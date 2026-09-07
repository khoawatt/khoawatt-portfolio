import { themeStorageKey } from "@/features/theme/config";

const themeInitializationScript = `
  try {
    var storedTheme = localStorage.getItem(${JSON.stringify(themeStorageKey)});
    var resolvedTheme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = resolvedTheme;
    var pageColor = getComputedStyle(document.documentElement).getPropertyValue("--color-page").trim();
    if (pageColor) {
      var themeMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeMeta) {
        themeMeta = document.createElement("meta");
        themeMeta.setAttribute("name", "theme-color");
        document.head.appendChild(themeMeta);
      }
      themeMeta.setAttribute("content", pageColor);
    }
  } catch (error) {
    document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
`;

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
      id="theme-initializer"
    />
  );
}
