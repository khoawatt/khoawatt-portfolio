# 08 — Blog Operations (publishing automation)

How blog posts get written, published, and refreshed — human and machine paths.

## Publishing paths

| Path | How | Cache refresh | When to use |
|------|-----|---------------|-------------|
| `/admin` UI | Owner fills the post form → Save/Publish | Automatic (`updateTag(blog)` in the same Server Action) | Default for hand-written posts |
| Machine (RPC) | Call `cms_upsert_blog_post` (service_role/SQL), then `POST /api/blog/revalidate` | Via the revalidate endpoint (below) | Automated posts (e.g. drafted in ChatGPT, fetched via bridge) |
| SQL seeds (`scripts/seed-blog-*.sql`) | Apply with `supabase db query` | **None** — needs an admin save or the revalidate call | Reproducible fixtures/backfills only, never routine publishing |

Direct table writes that skip both `/admin` and the RPC/revalidate pair leave
listing/category/tag/RSS pages stale until the 24h safety net refreshes them.

## Cache model

- Every public blog read runs through `unstable_cache` tagged `blog`
  (`BLOG_CACHE_TAG` in `src/features/blog/repository.ts`).
- One `updateTag("blog")` refreshes listings, details, categories, tags,
  sitemap, and feeds together. `revalidate` (24h) is only a safety net.
- A **new slug** renders instantly (cold key); **existing listing keys** need
  the tag refresh. That asymmetry is why a new post's detail page can look
  live while `/blog` still misses it.

## Machine publishing procedure

1. **Fetch content** (if drafted in ChatGPT):
   `chatgpt-review fetch --url=<conversation-url>` → `/tmp/chatgpt-fetch-*/`
   with `conversation.md`, `manifest.json`, and `files/` (article markdown,
   cover, bundles). See the `chatgpt-review` skill.
2. **Stage assets**: upload cover to the `blog-media` bucket
   (`supabase storage cp <png> ss:///blog-media/<slug>/cover.png --local/--linked`),
   upsert the `media_assets` row (title, `alt_en`, `alt_vi`, dimensions),
   create any missing tags via `cms_upsert_blog_tag`.
3. **Write the post** through `cms_upsert_blog_post` (same RPC `/admin` uses —
   publish gate + `published_at` stamping enforced atomically). Never hand-write
   `blog_posts`/`blog_post_translations` rows.
4. **Refresh the cache**: `BLOG_REVALIDATE_SECRET=... scripts/blog-revalidate.sh <base-url>`
   (local dev URL or production). Verify the listing shows the post.
5. **Verify**: detail pages EN+VI (title, cover, tags), listing, feeds.

## Revalidate endpoint

`POST /api/blog/revalidate` (`src/app/api/blog/revalidate/route.ts`).

- Auth: `Authorization: Bearer <BLOG_REVALIDATE_SECRET>`, timing-safe compare
  (`auth.ts`, unit-tested). Wrong/missing secret → 401.
- Fail-closed: unset/empty secret → 503 always (no 200 path exists).
- Success → 200 `{"ok":true}` after `revalidateTag(blog)` (the route-handler
  counterpart of the `updateTag(blog)` call admin Server Actions use — same tag).
- The secret is server-only (never `NEXT_PUBLIC_`), never logged, never committed.

## Environment

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase API URL (local `127.0.0.1` vs linked cloud) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Publishable key (frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | RPC/storage writes for automation |
| `RESEND_API_KEY` / `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` | server-only | Contact delivery |
| `BLOG_REVALIDATE_SECRET` | server-only | Bearer secret for the revalidate endpoint (`.env.example` has the name only; generate with `openssl rand -hex 32`) |

Local: keep values in `.env.local` (gitignored, never commit).
Production: set in the Vercel project environment; **env changes need a
redeploy to take effect**, so add the secret *before* merging code that
depends on it. The operator machine keeps a local copy of the production
revalidate secret in `.env.production.local` (gitignored) purely for making
the authed automation calls — the Vercel env entry stays the source of truth.

## Troubleshooting

- Listing missing a fresh post → call the revalidate script (or any admin blog save).
- Revalidate answers 401 → wrong secret or wrong environment's secret.
- Revalidate answers 503 → `BLOG_REVALIDATE_SECRET` not set in that environment.
- Stale reads in local dev after direct SQL → same remedy (script against the dev URL).

## Diagrams (Mermaid)

- Authoring: fenced ` ```mermaid ` blocks in `content_md` (same as any code fence).
- Rendering: the server pipeline keeps mermaid source as a plain code block
  (stable `language-mermaid` hook, unit-tested); the client `MermaidDiagrams`
  component progressively enhances blocks into SVG figures at runtime.
- Guarantees: no-JS readers and render failures still see readable source;
  `securityLevel: "strict"`; follows light/dark `data-theme` (re-renders on flip);
  `role="img"` + locale `diagramLabel`; static SVG (no motion issues).
- Cost control: the `mermaid` library is dynamically imported only on pages
  that actually contain a diagram — other pages ship zero extra JavaScript.
