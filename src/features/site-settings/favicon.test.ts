import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildFaviconUrl,
  FAVICON_MIN_EDGE,
  validateFaviconDimensions,
  validateFaviconMime,
  validateFaviconSize,
} from "./favicon";

function pngBytes(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0, 0, 0, 13], 8);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  bytes.set(
    [
      (width >>> 24) & 0xff,
      (width >>> 16) & 0xff,
      (width >>> 8) & 0xff,
      width & 0xff,
    ],
    16,
  );
  bytes.set(
    [
      (height >>> 24) & 0xff,
      (height >>> 16) & 0xff,
      (height >>> 8) & 0xff,
      height & 0xff,
    ],
    20,
  );
  return bytes;
}

test("favicon mime validation accepts only PNG", () => {
  assert.equal(validateFaviconMime("image/png"), null);
  assert.equal(validateFaviconMime("image/svg+xml")?.code, "mime");
  assert.equal(validateFaviconMime("image/jpeg")?.code, "mime");
  assert.equal(validateFaviconMime("")?.code, "mime");
});

test("favicon size validation enforces the 1 MB cap", () => {
  assert.equal(validateFaviconSize(1024 * 1024), null);
  assert.equal(validateFaviconSize(0), null);
  assert.equal(validateFaviconSize(1024 * 1024 + 1)?.code, "size");
});

test("favicon dimensions require square PNG at least 512px", () => {
  assert.equal(
    validateFaviconDimensions(pngBytes(FAVICON_MIN_EDGE, FAVICON_MIN_EDGE)),
    null,
  );
  assert.equal(
    validateFaviconDimensions(pngBytes(1024, 1024)),
    null,
  );
  assert.equal(
    validateFaviconDimensions(pngBytes(512, 256))?.code,
    "square",
  );
  assert.equal(
    validateFaviconDimensions(pngBytes(256, 256))?.code,
    "min-edge",
  );
  assert.equal(
    validateFaviconDimensions(new Uint8Array([1, 2, 3]))?.code,
    "dimensions",
  );
});

test("favicon URL carries a cache-busting version", () => {
  const versioned = buildFaviconUrl(
    "site/favicon.png",
    "2026-09-06T00:00:00.000Z",
  );
  assert.match(versioned, /\/site\/favicon\.png\?v=\d+$/);
  assert.equal(
    buildFaviconUrl("site/favicon.png", null),
    buildFaviconUrl("site/favicon.png", "not-a-date"),
  );
});
