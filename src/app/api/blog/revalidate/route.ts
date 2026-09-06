import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { BLOG_CACHE_TAG } from "@/features/blog/repository";

import { isRevalidateAuthorized } from "./auth";

/**
 * Automation hook for blog publishing outside /admin (#149).
 *
 * Direct content writes (RPC/SQL automation) bypass the admin Server Actions,
 * so nothing refreshes the `blog` cache tag and listing/category/tag/RSS pages
 * stay stale until the 24h safety net. POST here with the shared secret to
 * refresh every cached blog read at once — `revalidateTag` here is the
 * route-handler counterpart of the `updateTag(blog)` call the admin actions use
 * (both target the same single choke point, `BLOG_CACHE_TAG`).
 *
 * Security: server-only `BLOG_REVALIDATE_SECRET` (never NEXT_PUBLIC_).
 * Fail-closed when unconfigured; Bearer comparison is timing-safe (see auth.ts).
 * The secret itself is never logged or echoed.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.BLOG_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Not configured." }, { status: 503 });
  }
  if (!isRevalidateAuthorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  // `{ expire: 0 }` = expire matching entries immediately, mirroring what the
  // admin's `updateTag(blog)` does from Server Actions.
  revalidateTag(BLOG_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
