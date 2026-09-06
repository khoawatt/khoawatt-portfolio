"use client";

import { useEffect, useRef } from "react";

interface MermaidDiagramsProps {
  /** Accessible name for rendered diagrams (already localized by the caller). */
  diagramLabel: string;
  /** Server-rendered article HTML; mermaid fences enhance in place. */
  html: string;
}

/**
 * Progressive enhancement for ```mermaid fenced code blocks.
 *
 * The server pipeline keeps mermaid source as a plain code block (with the
 * stable `language-mermaid` hook), so no-JS readers and render failures still
 * show readable source. When JS runs, each block is replaced by the rendered
 * SVG figure (re-rendered if the light/dark theme flips afterwards).
 *
 * The mermaid library is dynamically imported only when at least one block
 * exists, so pages without diagrams ship zero extra JavaScript. Rendering
 * uses `securityLevel: "strict"`; input comes from owner-authored posts only.
 */
export function MermaidDiagrams({ diagramLabel, html }: Readonly<MermaidDiagramsProps>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  // Generation counter: concurrent renderAll passes (initial mount racing a
  // post-hydration theme write, rapid theme flips) must not interleave DOM
  // writes — only the latest generation may touch the DOM.
  const genRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (root.querySelectorAll("pre code.language-mermaid, figure.mermaid-diagram").length === 0) {
      return;
    }
    let cancelled = false;

    // The split chunk may 404/403 while the bundler is still emitting it
    // (dev) or on a flaky network — retry before giving up to the fallback.
    const loadMermaid = async (): Promise<{
      render: (id: string, source: string) => Promise<{ svg: string }>;
      initialize: (config: Record<string, unknown>) => void;
    }> => {
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const mod = await import("mermaid");
          return mod.default;
        } catch (error) {
          lastError = error;
          await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        }
      }
      throw lastError;
    };

    const renderFigure = async (
      mermaid: Awaited<ReturnType<typeof loadMermaid>>,
      figure: HTMLElement,
      source: string,
      index: number,
    ): Promise<void> => {
      idRef.current += 1;
      const { svg } = await mermaid.render(`mermaid-diagram-${idRef.current}`, source);
      if (cancelled) return;
      figure.innerHTML = svg;
      figure.setAttribute("aria-label", `${diagramLabel} ${index + 1}`);
    };

    const renderAll = async (): Promise<void> => {
      const gen = (genRef.current += 1);
      const alive = (): boolean => !cancelled && gen === genRef.current;
      let mermaid: Awaited<ReturnType<typeof loadMermaid>>;
      try {
        mermaid = await loadMermaid();
      } catch {
        return; // Keep readable code blocks.
      }
      if (!alive() || !rootRef.current) return;
      const root = rootRef.current;
      const dark = document.documentElement.dataset.theme === "dark";
      const themeKey = dark ? "dark" : "light";
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: dark ? "dark" : "default",
      });
      // Fresh code blocks become figures (original source kept for re-renders).
      // `index` is 0-based; renderFigure numbers from 1 for aria-labels.
      const blocks = Array.from(root.querySelectorAll("pre code.language-mermaid"));
      let index = root.querySelectorAll("figure.mermaid-diagram").length;
      for (const el of blocks) {
        const source = el.textContent ?? "";
        const pre = el.closest("pre");
        if (!pre || !source.trim()) continue;
        const figure = document.createElement("figure");
        figure.className = "mermaid-diagram";
        figure.setAttribute("role", "img");
        figure.dataset.source = source;
        try {
          await renderFigure(mermaid, figure, source, index);
          if (!alive()) return;
          figure.dataset.theme = themeKey;
          pre.replaceWith(figure);
          index += 1;
        } catch {
          // Keep the readable code block as fallback.
        }
      }
      // Re-render only figures drawn under a different theme (e.g. after a
      // light/dark flip); figures already matching are left untouched.
      const figures = Array.from(root.querySelectorAll("figure.mermaid-diagram"));
      for (const [i, figure] of figures.entries()) {
        const fig = figure as HTMLElement;
        if (!fig.dataset.source || fig.dataset.theme === themeKey) continue;
        try {
          await renderFigure(mermaid, fig, fig.dataset.source, i);
          if (!alive()) return;
          fig.dataset.theme = themeKey;
        } catch {
          // Keep the last good render.
        }
      }
    };

    void renderAll();
    const observer = new MutationObserver(() => {
      void renderAll();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [diagramLabel, html]);

  return (
    <div
      ref={rootRef}
      className="blog-article__prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
