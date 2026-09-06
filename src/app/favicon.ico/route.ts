import { NextResponse } from "next/server";

import { getFaviconSetting } from "@/features/site-settings/favicon";

/**
 * Conventional `/favicon.ico` URL, served from the same dynamic setting as
 * the metadata icon links (no static file). Temporary redirect because the
 * target changes on every re-upload; 404 when no favicon is set yet.
 */
export async function GET() {
  const favicon = await getFaviconSetting();

  if (!favicon) {
    return new NextResponse("Favicon is not configured.", { status: 404 });
  }

  return NextResponse.redirect(favicon.url, { status: 302 });
}
