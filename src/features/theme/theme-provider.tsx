"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  isTheme,
  type Theme,
  themeStorageKey,
} from "@/features/theme/config";
import { syncThemeColorMeta } from "@/features/theme/theme-color";

interface ThemeContextValue {
  theme: Theme | null;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeChangeEvent = "qvak:theme-change";

function getDocumentTheme(): Theme {
  const currentTheme = document.documentElement.dataset.theme ?? null;

  return isTheme(currentTheme) ? currentTheme : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  syncThemeColorMeta();
  window.dispatchEvent(new Event(themeChangeEvent));
}

function subscribeToTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function followSystemPreference(event: MediaQueryListEvent) {
    if (!isTheme(window.localStorage.getItem(themeStorageKey))) {
      applyTheme(event.matches ? "dark" : "light");
    }
  }

  window.addEventListener(themeChangeEvent, onStoreChange);
  mediaQuery.addEventListener("change", followSystemPreference);

  return () => {
    window.removeEventListener(themeChangeEvent, onStoreChange);
    mediaQuery.removeEventListener("change", followSystemPreference);
  };
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const pathname = usePathname();
  const theme = useSyncExternalStore<Theme | null>(
    subscribeToTheme,
    getDocumentTheme,
    () => null,
  );

  useLayoutEffect(() => {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    const resolvedTheme = isTheme(storedTheme)
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    if (getDocumentTheme() !== resolvedTheme) {
      applyTheme(resolvedTheme);
    } else {
      syncThemeColorMeta();
    }
  }, [pathname]);

  const toggleTheme = useCallback(() => {
    const currentTheme = theme ?? getDocumentTheme();
    const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";

    window.localStorage.setItem(themeStorageKey, nextTheme);
    applyTheme(nextTheme);
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
