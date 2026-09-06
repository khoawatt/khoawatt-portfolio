# AGENTS.md — Portfolio Next.js

This repository uses docs-first execution.

## Source of truth

Before implementing a feature, read:

- `docs/00-product-brief.md`
- `docs/02-ui-ux-spec.md`
- `docs/03-content-data-model.md`
- `docs/04-technical-architecture.md`
- `docs/05-implementation-plan.md`
- the relevant issue

If an issue conflicts with an accepted canonical document, stop and report the conflict. Do not silently reinterpret requirements.

## Working rules

1. One issue = one bounded scope; create a feature branch from `main`. Do not mix unrelated refactors into feature work.
2. Prefer typed data and reusable components over section-specific hard-coding.
3. All public UI must support light/dark themes and `en`/`vi` locales.
4. Preserve accessibility: keyboard navigation, visible focus, semantic headings, dialog focus management, alt text, reduced-motion behavior.
5. Images must use deliberate dimensions/aspect ratios and avoid layout shift.
6. Never commit secrets, `.env*`, private keys, tokens, or production credentials.
7. Do not introduce the CMS into MVP tasks unless the issue explicitly belongs to the CMS phase.
8. Every implementation PR must state tests run, screenshots/visual verification, known limitations, and docs affected.
9. Follow the PR contract in `docs/07-codex-execution-contract.md` and the issue template in `.github/ISSUE_TEMPLATE/feature.md`.
10. Database changes are strictly **local-first** (see "Database workflow" below): every migration, seed/backfill, or content SQL must be applied and verified on the local Supabase stack BEFORE it touches the linked cloud project. After any production data mutation, immediately mirror the same change back into local. Local missing data that production already has is never acceptable — treat divergence as a defect to fix in the same task.

## Commands

- `npm run lint` — ESLint (`eslint .`)
- `npm run typecheck` — runs `next typegen && tsc --noEmit` (needed because Next types are generated)
- `npm run build` — production build (Next 16 defaults to Turbopack)
- `npm run dev` — dev server
- `supabase db query --local -f scripts/<file>.sql` — apply content SQL to the local stack first
- `supabase db query --linked -f scripts/<file>.sql` — promote to the linked cloud project only after local verification
- `gh` is available for issue/PR workflows; PRs use `Closes #<issue>` with one PR per issue.

There is a minimal `npm test` runner using Node's built-in `node:test` via `tsx`, covering the contact-delivery feature (`src/features/contact/*.test.ts`). For other areas, verification remains manual/visual smoke checks plus lint/typecheck/build.

### Blog publishing (automated)

- Full runbook: `docs/08-blog-operations.md` (paths, cache model, env table, troubleshooting).
- Machine posts go through the `cms_upsert_blog_post` RPC (same gate as `/admin`), never hand-written table rows.
- After machine writes, refresh caches with `BLOG_REVALIDATE_SECRET=... scripts/blog-revalidate.sh <base-url>` (`POST /api/blog/revalidate`, server-only Bearer secret, fail-closed when unset). Secret lives in `.env.local` (gitignored) and Vercel env — names only in `.env.example`; generate with `openssl rand -hex 32`. Vercel env changes need a redeploy to take effect.
- ChatGPT-drafted content is fetched with `chatgpt-review fetch --url=<conversation-url>` (turns + files to `/tmp`, never posts anything).

### Build quirk

`npm run build` uses Turbopack, which can fail in sandboxed environments (CSS worker cannot bind an internal port → `Operation not permitted`). If the default build fails this way, run `npm run build -- --webpack` — that path is verified passing.

### Database workflow (local-first)

Local dev serves CMS content from its own Supabase stack (`127.0.0.1`, see `.env.local`); production serves from the linked cloud project. The two drift silently unless kept in sync, so:

1. **Apply locally first**: run every new SQL script with `supabase db query --local -f …`, then verify in `npm run dev` before promoting.
2. **Promote to cloud only after local verification**: same script with `--linked` (production mutations remain human-approved).
3. **Mirror prod back into local immediately** after any production data change: `supabase db dump --data-only --linked -x 'auth.*' -x 'storage.*' -x 'public.admin_owner' -f /tmp/prod-data.sql`, strip any remaining non-content tables (`auth.*`, `storage.*` — never import production credentials), then `truncate` the matching local tables and restore via `psql`. Verify row counts match before calling it done.
4. **Divergence is a defect**: if local lacks data that production has (or vice versa), fix it in the same task that caused it — do not leave it for later.

## Architecture notes

- Next.js 16 App Router, React 19, Tailwind CSS 4. Path alias `@/*` → `src/*`.
- **Locale routing is in `src/proxy.ts`** (Next 16 renamed `middleware.ts` to `proxy.ts` — do not create a `middleware.ts`). Locales are `["en", "vi"]` with `en` as the default at the locale root (`/` and `/vi`). Config lives in `src/features/i18n/config.ts`; use `getLocalizedPathname` for locale-aware links and `getLocaleFromParams` in server components.
- Server components receive `params` as a **`Promise`** (Next 16 async params), e.g. `params: Promise<{ locale: string }>`. `getMessages` and i18n message loaders are `server-only` — pass messages into client components as props.
- **Content layer**: `src/content/*.ts` export typed accessors like `getPortfolioProfile(locale)` / `getSkillsContent(locale)` returning view models; translatable strings use `Record<Locale, string>`. Keep data out of components.
- **Client boundary**: only interactive components carry `"use client"` (e.g. `site-header`, `locale-switcher`, `theme-provider`, `skills-section`). Keep section shells server-rendered.
- **Theme**: set via `data-theme` on `<html>` with `ThemeScript` in `<head>` to prevent flash; storage key `qvak.theme` in `src/features/theme/config.ts`.
- **Placeholders**: `src/app/[locale]/page.tsx` renders generic placeholder anchor sections (from `navigationSectionIds`) for Projects/Resume/Contact/Footer. New section issues replace these placeholders; don't build new sections ad hoc elsewhere.
- Empty directories are preserved with `.gitkeep` files — keep them when adding files.
- `docs/references/` and `docs/migration/legacy-assets/` hold design-reference/migration evidence only; keep them out of the runtime bundle and do not move them into `public/`. Ignore `:Zone.Identifier` junk files.

## ChatGPT–OpenCode Collaboration

GitHub is the communication protocol for implementation and review.

The linked GitHub Issue is the task and scope authority.

OpenCode is the implementation agent.

OpenCode must:

- inspect the current repository and working-tree state before changing files;
- preserve existing uncommitted work;
- follow the linked Issue and canonical project documentation;
- remain inside approved scope;
- delegate visual analysis to `@vision` when visual understanding is required;
- run real verification;
- self-review the complete diff;
- hand meaningful work off through a Pull Request;
- respond to actionable ChatGPT review feedback;
- never merge by default.

OpenCode self-review does not replace independent review.

### ChatGPT review bridge (pre-PR, optional but encouraged)

Before opening a Pull Request, run an external review through the ChatGPT bridge
to catch issues an independent reviewer may flag. Use the `@chatgpt-review`
subagent (or the `chatgpt-review` skill). One command, no copy-paste:

1. Finish the task and write the normal result summary (Done / What changed /
   Verification).
2. Invoke `@chatgpt-review` in the session and pass that result summary text as
   the review material. Do not attach a git diff.
3. The subagent sends the summary to ChatGPT Plus (web) via the browser bridge
   and returns the verdict.
4. Address actionable feedback, rerun relevant checks, and mention the review
   in the PR.

The bridge needs a one-time login: run
`~/.config/opencode/chatgpt-bridge/bin/chatgpt-review login` in a terminal, then
verify with `~/.config/opencode/chatgpt-bridge/bin/chatgpt-review status`.

The bridge keeps one ChatGPT thread per repo+branch so reviews on the same
branch share context instead of spawning new chats. It reuses the saved thread
and only starts a fresh one when it gets stale (`max_chars` / `max_turns` /
`max_age_hours` in `~/.config/opencode/chatgpt-bridge/bridge-config.json`) or
when a saved id fails to open. Inspect state with
`~/.config/opencode/chatgpt-bridge/bin/chatgpt-review chats`; force a fresh
thread with `/chatgpt-new`.

This repo uses a ChatGPT Project named after the repo for its reviews: on
`@chatgpt-review`, the bridge opens (or creates) the project and keeps the
review thread inside it. Manage the mapping with `/chatgpt-project`.

GitHub Actions provides independent automated verification.

ChatGPT Web independently reviews the Issue, Pull Request diff, CI results,
scope compliance, security boundaries, production impact, tests, and relevant
architecture/documentation.

Human maintainers retain final authority over merge, production changes,
material scope changes, dependencies, architecture, security decisions, and
hosted-resource mutations.

Merge is permitted through the safety-checked wrapper
`.opencode/scripts/merge-approved-pr.sh` (recommended). Raw `gh pr merge` and
historically destructive operations (`git reset`/`clean`/`restore`, force-push)
prompt for confirmation (`ask`). See `opencode.jsonc`.

Do not run OpenCode with `--auto`/auto-approve when relying on `ask`-tier
confirmation as a human gate — auto mode approves all `ask`-tier operations
without an explicit human prompt. The human may revoke these permissions at any time.

### Visual tasks

When a task involves screenshots, images, UI references, mockups, visual
comparison, visual regression, responsive screenshots, diagrams, or visual
bugs, delegate visual analysis to `@vision` before making material visual
implementation decisions.

`@vision` analyzes only. The Primary Build Agent implements.

## Quality gates

Expected before merge:

- lint
- typecheck
- production build (`-- --webpack` if Turbopack fails in this environment)
- accessibility/keyboard smoke check for interactive UI
- responsive smoke check at mobile/tablet/desktop breakpoints
- visual verification screenshots in the PR for UI changes
