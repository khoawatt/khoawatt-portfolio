/**
 * Keep the browser-chrome `theme-color` meta in sync with the active theme.
 *
 * The meta value is read live from the `--color-page` custom property, so it
 * always matches the exact page background in both themes without hardcoded
 * hex duplicates. `oklch()` is valid in `theme-color` on modern browsers;
 * older ones ignore the meta (same as having none).
 */
export function syncThemeColorMeta(): void {
  if (typeof document === "undefined") return;
  const pageColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-page")
    .trim();
  if (!pageColor) return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", pageColor);
}
