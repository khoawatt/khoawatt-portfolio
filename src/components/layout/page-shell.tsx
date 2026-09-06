import type { ComponentPropsWithoutRef } from "react";

type PageShellProps = ComponentPropsWithoutRef<"main">;

export function PageShell({ className, id = "main-content", ...props }: Readonly<PageShellProps>) {
  const classes = ["page-shell", className].filter(Boolean).join(" ");

  // tabIndex -1 keeps the landmark out of the Tab order while letting the
  // skip link move keyboard focus here on activation.
  return (
    <main className={classes} id={id} tabIndex={-1} {...props} />
  );
}
