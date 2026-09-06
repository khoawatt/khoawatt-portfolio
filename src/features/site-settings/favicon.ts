import type { Metadata } from "next";

import { imageDimensions } from "@/features/cms/image-dimensions";
import { publicMediaUrl } from "@/features/cms/media-url";
import { getServiceClient } from "@/features/cms/server";

/**
 * Admin-manageable website favicon (single dynamic code path — there is no
 * static fallback; `src/app/{favicon.ico,icon.png,apple-icon.png}` were
 * removed in favor of this Storage-backed setting).
 *
 * Storage: the public `portfolio` bucket, fixed object `site/favicon.png`
 * (re-uploaded with upsert; the `?v=` query param busts aggressive favicon
 * caching). State: `app_settings` rows `favicon.path` + `favicon.updated_at`
 * (JSONB strings, same key-value pattern as `resume.publicity`).
 */

export const FAVICON_BUCKET = "portfolio" as const;
export const FAVICON_PATH = "site/favicon.png";
export const FAVICON_PATH_KEY = "favicon.path";
export const FAVICON_UPDATED_AT_KEY = "favicon.updated_at";

/** PNG-only keeps one validation/render path (square check via header bytes). */
export const FAVICON_MIME = "image/png";
export const FAVICON_MAX_BYTES = 1024 * 1024; // 1 MB
/** Minimum edge so one source can serve favicon + apple-touch-icon sizes. */
export const FAVICON_MIN_EDGE = 512;

export interface FaviconValidationError {
  code: "mime" | "size" | "dimensions" | "square" | "min-edge";
  message: string;
}

export function validateFaviconMime(mime: string): FaviconValidationError | null {
  if (mime !== FAVICON_MIME) {
    return {
      code: "mime",
      message: `Favicon must be a PNG image (got “${mime || "unknown"}”).`,
    };
  }
  return null;
}

export function validateFaviconSize(sizeBytes: number): FaviconValidationError | null {
  if (sizeBytes > FAVICON_MAX_BYTES) {
    return {
      code: "size",
      message: "Favicon must be 1 MB or smaller.",
    };
  }
  return null;
}

export function validateFaviconDimensions(
  bytes: Uint8Array,
): FaviconValidationError | null {
  const dimensions = imageDimensions(bytes, FAVICON_MIME);
  if (!dimensions) {
    return {
      code: "dimensions",
      message: "Could not read this PNG's dimensions.",
    };
  }
  if (dimensions.width !== dimensions.height) {
    return {
      code: "square",
      message: `Favicon must be square (got ${dimensions.width}×${dimensions.height}).`,
    };
  }
  if (dimensions.width < FAVICON_MIN_EDGE) {
    return {
      code: "min-edge",
      message: `Favicon must be at least ${FAVICON_MIN_EDGE}×${FAVICON_MIN_EDGE}px (got ${dimensions.width}×${dimensions.height}).`,
    };
  }
  return null;
}

export interface FaviconSetting {
  path: string;
  updatedAt: string | null;
  /** Public Storage URL with a cache-busting `?v=` param. */
  url: string;
}

export function buildFaviconUrl(path: string, updatedAt: string | null): string {
  const base = publicMediaUrl(FAVICON_BUCKET, path);
  if (!updatedAt) return base;
  const version = Date.parse(updatedAt);
  if (Number.isNaN(version)) return base;
  return `${base}?v=${version}`;
}

let testOverride: FaviconSetting | null | undefined;

export function setFaviconForTest(value: FaviconSetting | null | undefined): void {
  testOverride = value;
}

export async function getFaviconSetting(): Promise<FaviconSetting | null> {
  if (testOverride !== undefined) {
    return testOverride;
  }

  const client = getServiceClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from("app_settings")
      .select("key, value")
      .in("key", [FAVICON_PATH_KEY, FAVICON_UPDATED_AT_KEY]);

    if (error || !data) {
      return null;
    }

    const rows = data as Array<{ key: string; value: unknown }>;
    const pathRow = rows.find((row) => row.key === FAVICON_PATH_KEY);
    const updatedAtRow = rows.find((row) => row.key === FAVICON_UPDATED_AT_KEY);

    if (typeof pathRow?.value !== "string" || pathRow.value.trim() === "") {
      return null;
    }

    const updatedAt =
      typeof updatedAtRow?.value === "string" ? updatedAtRow.value : null;

    return {
      path: pathRow.value,
      updatedAt,
      url: buildFaviconUrl(pathRow.value, updatedAt),
    };
  } catch {
    return null;
  }
}

/**
 * `Metadata["icons"]` for the locale layout. Returns undefined when no
 * favicon is set — deliberately no static fallback (owner uploads one at
 * /admin/settings).
 */
export async function getFaviconIcons(): Promise<Metadata["icons"] | undefined> {
  const favicon = await getFaviconSetting();
  if (!favicon) {
    return undefined;
  }

  return {
    icon: [{ url: favicon.url, type: FAVICON_MIME }],
    apple: [{ url: favicon.url }],
  };
}
