import type { PortfolioMessages } from "@/features/i18n/messages/types";

const messages = {
  metadata: {
    title: "Quach Vo Anh Khoa",
    description: "Portfolio foundation for Quach Vo Anh Khoa.",
  },
  localeSwitcher: {
    label: "Change language",
    currentLanguage: "Current language",
    english: "English",
    vietnamese: "Tiếng Việt",
  },
  header: {
    primaryNavigation: "Portfolio sections",
    homeAction: "Go to Home",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    github: "Open GitHub profile",
    sections: {
      home: "Home",
      about: "About",
      skills: "Skills",
      projects: "Projects",
      resume: "Resume",
      blog: "Blog",
      contact: "Contact",
    },
  },
  blog: {
    eyebrow: "Blog",
    title: "Notes, deep-dives, and reviews.",
    intro:
      "Writing on the web, engineering, and the tools shaping how I build.",
    emptyState: "No posts yet — the first one is on its way.",
    readMinutes: "{count} min read",
    publishedLabel: "Published",
    updatedLabel: "Updated",
    categoryLabel: "Category",
    tagsLabel: "Tags",
    onThisPage: "On this page",
    relatedPosts: "Related posts",
    breadcrumbLabel: "Breadcrumb",
    backToBlog: "All posts",
    homeLabel: "Home",
    paginationLabel: "Pagination",
    paginationPrev: "Previous page",
    paginationNext: "Next page",
    pageNumberLabel: "Page {n}",
    topicsLabel: "Knowledge library",
    topicsViewAll: "All topics",
    categoryPostCount: "{count} posts",
    readMoreLabel: "Read post",
    backToTopLabel: "Back to top",
    filterLabel: "Category",
    allPostsLabel: "All posts",
    tocExpandLabel: "Show table of contents",
    tocCollapseLabel: "Hide table of contents",
    markdownTooltip: "Markdown for AI Agents",
    markdownCopyLabel: "Copy markdown",
    markdownViewLabel: "View .md",
    markdownCopiedLabel: "Copied markdown",
    markdownCopyErrorLabel: "Copy failed",
    previewEyebrow: "Blog",
    previewTitle: "Latest from the blog",
    previewIntro:
      "Recent writing on the web, engineering, and the tools shaping how I build.",
    previewSeeMore: "See more",
    diagramLabel: "Diagram",
  },
  themeToggle: {
    toggle: "Toggle color theme",
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
  },
  adminFavicon: {
    pageTitle: "Site settings",
    cardTitle: "Website favicon",
    cardHint:
      "The favicon is served dynamically from Storage — there is no static fallback. Uploading replaces it everywhere immediately.",
    currentLabel: "Current favicon",
    noFaviconLabel: "No favicon is set yet.",
    updatedAtLabel: "Last updated",
    neverLabel: "—",
    fileLabel: "New favicon (PNG, square, at least 512×512px, max 1 MB)",
    fileHint: "Square PNG, minimum 512×512 pixels, up to 1 MB.",
    newPreviewLabel: "New preview",
    uploadAction: "Upload favicon",
    uploadingLabel: "Uploading…",
    successMessage: "Favicon updated.",
    chooseFileError: "Choose a PNG file to upload.",
    currentFaviconAlt: "Current website favicon",
    newFaviconAlt: "Preview of the new favicon",
  },
  notFound: {
    eyebrow: "404",
    title: "This page could not be found",
    description:
      "The page you are looking for may have moved or no longer exists.",
    homeAction: "Back to Home",
  },
  foundation: {
    eyebrow: "Portfolio foundation",
    title: "A clear frame for the work ahead.",
    description:
      "The shared design system and page shell are ready for portfolio sections to build on.",
    items: [
      {
        id: "responsive",
        title: "Responsive by default",
        description:
          "A shared container adapts from mobile through wide screens.",
      },
      {
        id: "visual-language",
        title: "One visual language",
        description:
          "Semantic tokens keep future sections coherent and maintainable.",
      },
      {
        id: "motion",
        title: "Motion with care",
        description:
          "The foundation honors reduced-motion preferences from the start.",
      },
    ],
  },
} satisfies PortfolioMessages;

export default messages;
