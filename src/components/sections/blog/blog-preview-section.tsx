import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedPosts } from "@/features/blog/repository";
import type { PostListItem } from "@/features/blog/types";
import type { Locale } from "@/features/i18n/config";
import type { BlogMessages } from "@/features/i18n/messages/types";
import { getLocalizedPathname } from "@/features/i18n/routing";

interface BlogPreviewSectionProps {
  locale: Locale;
  messages: BlogMessages;
}

/** Newest posts shown on the home page; the listing page keeps paginating. */
const PREVIEW_POST_COUNT = 4;

/** Fixed pill tones (own design tokens, see globals.css `.blog-preview__pill`). */
export const BLOG_PREVIEW_PILL_TONES = 6;

/**
 * Deterministic pill tone per category slug so a category keeps the same
 * color across renders and locales.
 */
export function toneForCategorySlug(slug: string): number {
  let hash = 0;

  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  }

  return hash % BLOG_PREVIEW_PILL_TONES;
}

type PreviewCardSize = "large" | "wide" | "small" | "standard";

interface PreviewCardProps {
  locale: Locale;
  messages: BlogMessages;
  post: PostListItem;
  size: PreviewCardSize;
}

function PreviewCard({ locale, messages, post, size }: Readonly<PreviewCardProps>) {
  const href = getLocalizedPathname(`/blog/${post.slug}`, locale);
  const localeTag = locale === "vi" ? "vi-VN" : "en-US";
  const date = new Intl.DateTimeFormat(localeTag, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(post.publishedAt));
  const readTime = messages.readMinutes.replace(
    "{count}",
    String(post.readingTimeMinutes),
  );

  return (
    <article className="blog-preview__card" data-size={size}>
      {post.coverImage ? (
        <Image
          alt={post.coverImage.alt}
          className="blog-preview__cover"
          height={post.coverImage.height}
          sizes="(min-width: 64rem) 36rem, (min-width: 48rem) 45vw, 90vw"
          src={post.coverImage.src}
          width={post.coverImage.width}
        />
      ) : (
        <div
          aria-hidden="true"
          className="blog-preview__cover blog-preview__cover--placeholder"
        />
      )}
      <div aria-hidden="true" className="blog-preview__scrim" />
      <div className="blog-preview__body">
        <p
          className="blog-preview__pill"
          data-tone={toneForCategorySlug(post.category.slug)}
        >
          {post.category.name}
        </p>
        <h3 className="blog-preview__title">
          <Link className="blog-preview__link" href={href}>
            {post.title}
          </Link>
        </h3>
        <p className="blog-preview__meta">
          <time dateTime={post.publishedAt}>{date}</time>
          <span aria-hidden="true" className="blog-preview__meta-separator">
            ·
          </span>
          <span>{readTime}</span>
        </p>
      </div>
    </article>
  );
}

/**
 * Home-page blog preview (server component). Reads through the cached
 * repository reader like the listing page; renders nothing when no post is
 * published so the page still builds with zero posts.
 */
export async function BlogPreviewSection({
  locale,
  messages,
}: Readonly<BlogPreviewSectionProps>) {
  const posts = (await getPublishedPosts(locale, 1)).posts.slice(
    0,
    PREVIEW_POST_COUNT,
  );

  if (posts.length === 0) {
    return null;
  }

  const isMosaic = posts.length >= PREVIEW_POST_COUNT;
  const blogPath = getLocalizedPathname("/blog", locale);
  const mosaicSizes: readonly PreviewCardSize[] = [
    "large",
    "wide",
    "small",
    "small",
  ];

  return (
    <section
      aria-labelledby="blog-title"
      className="blog-preview-section navigation-anchor"
      id="blog"
    >
      <Container>
        <div className="blog-preview-section__intro">
          <SectionHeading
            description={messages.previewIntro}
            eyebrow={messages.previewEyebrow}
            title={messages.previewTitle}
            titleId="blog-title"
          />
        </div>

        <div
          className="blog-preview__grid"
          data-count={posts.length}
          data-layout={isMosaic ? "mosaic" : "simple"}
        >
          {posts.map((post, index) => (
            <PreviewCard
              key={post.slug}
              locale={locale}
              messages={messages}
              post={post}
              size={
                isMosaic
                  ? (mosaicSizes[index] ?? "small")
                  : index === 0
                    ? "large"
                    : "standard"
              }
            />
          ))}
        </div>

        <div className="blog-preview-section__actions">
          <Link className="blog-preview__see-more" href={blogPath}>
            {messages.previewSeeMore}
            <svg
              aria-hidden="true"
              className="blog-preview__see-more-arrow"
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </Container>
    </section>
  );
}
