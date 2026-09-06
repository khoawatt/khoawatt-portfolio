export const navigationSectionIds = [
  "home",
  "about",
  "skills",
  "projects",
  "resume",
  "blog",
  "contact",
] as const;

export type NavigationSectionId = (typeof navigationSectionIds)[number];

/** Blog is both a home-page anchor section and a multi-route area (/blog). */
export type NavigationItemId = NavigationSectionId | "blog";

/** Header/footer order: Blog sits between Resume and Contact (spec §8.1). */
export const primaryNavigationIds: readonly NavigationItemId[] = [
  "home",
  "about",
  "skills",
  "projects",
  "resume",
  "blog",
  "contact",
];

export const blogNavigationPath = "/blog";