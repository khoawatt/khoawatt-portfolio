# Resume Media Auto-Resolve + Audit Eye Visibility — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Media delete for `resume_media` currently blocks with `DELETE_DEPENDENCY_EXISTS` and requires manual removal from the resume entry; make it auto-resolve like blog (clear cover / remove node) and make the audit log eye icon actually visible/clickable to show the full row.

**Architecture:** Extend the existing `media-resolve` pipeline (currently blog-only) to handle `resume_media.thumbnail_src / full_src` references, add a dedicated RPC or app-layer helper that deletes/NULLs the `resume_media` row atomically, and fix the audit list UI where the eye button is hidden by table overflow / missing snapshot fetch and dark-theme contrast.

**Tech Stack:** Next.js 16 App Router (server actions), Supabase Postgres RLS + `SECURITY INVOKER` RPCs, `private.is_owner()`, Tailwind 4, `lucide` eye icon, `supabase db reset --local` for verification.

**Spec:** User request 2026-09-01: “trong media resume không xóa được ảnh, báo DELETE_DEPENDENCY_EXISTS. Tôi tưởng đã có cơ chế xử lý r chứ” + “trong audit log, cần làm thêm icon eye, click vào thì hiển thị full row … hiện tại hơi nhiều” + follow-up “muốn, làm hết đi nhưng hiện tại tính năng eye ở đâu sao t k thấy”. Canonical docs: `docs/03-content-data-model.md` (resume media shape), `docs/04-technical-architecture.md` (content repository layer), `AGENTS.md` (local-first DB workflow, light/dark, i18n, a11y).

## Global Constraints

- One issue = one branch from `main`, typed data + reusable components, no hard-coded section strings
- All public UI must support `light/dark` + `en/vi`, keyboard nav, focus trap, alt text, `prefers-reduced-motion`
- Images must have deliberate dimensions/aspect ratio, avoid layout shift
- Never commit `.env*`, secrets, tokens
- DB changes local-first: `supabase db query --local -f …` → verify → `--linked` (human approved), then mirror prod → local
- `npm run lint` + `npm run typecheck` + `npm run build -- --webpack` must pass before merge

---

## File Structure

**Resume auto-resolve:**
- Modify: `src/features/cms/media.ts:48-72` — `findMediaReferences` already handles `resume_media` candidate; keep as is, add `deleted_at` filter check
- Modify: `src/features/cms/media-resolve.ts:1-60` — add `removeResumeMediaReference` helper or extend `removeMarkdownImageNodes` to handle `resume_media` deletion (exact `thumbnail_src`/`full_src` match, not substring)
- Modify: `src/features/cms/media-resolve-actions.ts:10-80` — `resolveAndDeleteMedia` currently handles blog cover + `content_md` + `cms_soft_delete_media_asset`; extend to also query `resume_media` where `thumbnail_src = path OR full_src = path` and `resume_entry_id` not trashed, then `DELETE FROM resume_media WHERE id = …` inside same logical transaction (or `UPDATE … SET thumbnail_src = NULL` if you keep row). Must use `FOR UPDATE` on `resume_media` + `resume_entries` to avoid TOCTOU, and respect `resume_entries.deleted_at IS NULL` guard
- Modify: `supabase/migrations/20260831100000_advanced_delete_foundation.sql:396-410` — `cms_soft_delete_media_asset` reference count already includes `resume_media`; keep, but ensure `cms_resolve_media_reference` or new `cms_resolve_resume_media` handles resume
- Optionally: Create `supabase/migrations/YYYYMMDD_resume_media_resolve.sql` — `cms_resolve_resume_media(p_path text)` that deletes `resume_media` where `thumbnail_src = p_path OR full_src = p_path` and `resume_entry_id` in `select id from resume_entries where deleted_at is null`, `SECURITY INVOKER`, `GRANT TO authenticated`

**Audit eye:**
- Modify: `src/app/admin/(dashboard)/audit/data.ts:16-47` — already fetches `snapshot` after fix `b16d96c`; verify it selects `snapshot` and types it
- Modify: `src/app/admin/(dashboard)/audit/page.tsx:1-15` — currently server component that renders `AuditList`; ensure it passes `snapshot`
- Modify: `src/app/admin/(dashboard)/audit/audit-list.tsx:1-90` — this is the eye implementation (`EyeIcon`, `selected` state, modal). Bug: user “không thấy” — likely because `audit-list.tsx` is on `fix/audit-eye` branch (`b16d96c`) which is on `main` locally but not on `dev` branch where user tested (`dev` was at `8e6c65a` before tags, now at `6adab33` after social-trash-polish but before audit eye). Need to merge `fix/audit-eye` (or `main` with audit eye) into `dev` and all `feat/*` branches, or cherry-pick. Also check CSS: eye button uses `admin-link-button` which in dark theme may have low contrast; ensure `color: var(--color-accent)` and `hover` visible, and table `td:last-child` not truncated by `table-layout: fixed` + `max-width:18rem` from `globals.css:3311`
- Modify: `src/styles/globals.css:3786-3799` — `.admin-dialog` already fixed to `position:fixed; inset:0; margin:auto` for centering; verify audit modal uses same `admin-dialog` with `var(--color-surface)` / `var(--color-text)` so eye modal is centered and theme-synced (previous bug was hardcoded `white`)
- Modify: `src/app/admin/(dashboard)/admin-sidebar.tsx:116-119` — already has `Trash` + `Audit` links; verify audit link is visible after dev merge

---

### Task 1: Reproduce resume block and audit eye missing

**Files:**
- Read: `src/features/cms/media.ts`
- Read: `src/features/cms/media-resolve-actions.ts`
- Read: `src/app/admin/(dashboard)/audit/audit-list.tsx`
- Read: `src/app/admin/(dashboard)/audit/data.ts`
- Read: `supabase/migrations/20260831100000_advanced_delete_foundation.sql:396-410`

**Interfaces:**
- Consumes: existing `findMediaReferences(client, "resume-media", path)`, `cms_soft_delete_media_asset(p_bucket,p_path)` returns `{status:"blocked", errorCode:"DELETE_DEPENDENCY_EXISTS", dependencyCount:n}`
- Produces: reproduction script output confirming `DELETE_DEPENDENCY_EXISTS` for a resume image that is still in `resume_media`, and confirming `/admin/audit` table has no eye column on the branch the user is currently on (`feat/118` or `dev` before merge)

- [ ] **Step 1: Write failing reproduction (no code change)**

```bash
# in psql local (or via a temporary Node script using service_role)
# 1. Create a resume entry with media
insert into resume_entries (id, category_id, draft) values ('test-resume-entry','career-journey', false);
insert into resume_media (id, resume_entry_id, thumbnail_src, full_src) values ('test-media','test-resume-entry','resume-media/test.jpg','resume-media/test.jpg');
insert into media_assets (bucket, path, title) values ('resume-media','test.jpg','Test');
# 2. Try soft delete via owner RPC (or via UI)
select cms_soft_delete_media_asset('resume-media','test.jpg');
-- Expected: {status:blocked, errorCode:DELETE_DEPENDENCY_EXISTS} — reproduces bug
# 3. Check audit eye
# Open http://localhost:3000/admin/audit on feat/118 — inspect DOM, expect no button with aria-label "View details"
```

- [ ] **Step 2: Run and confirm both issues**

Run: `supabase db reset --local && npm run seed:admin && npm run dev` then open `/admin/audit` and `/admin/media` (resume-media bucket)

Expected: `DELETE_DEPENDENCY_EXISTS` for resume image, and no eye icon in audit table header

- [ ] **Step 3: Commit nothing (reproduction only)**

---

### Task 2: Extend media-resolve to handle resume_media

**Files:**
- Modify: `src/features/cms/media-resolve.ts`
- Modify: `src/features/cms/media-resolve-actions.ts`

**Interfaces:**
- Consumes: `removeMarkdownImageNodes` (existing), `getServerClient()`, `private.is_owner()` via RLS
- Produces: `resolveResumeMediaReferences(client, path)` → `{ deletedRows: number }` and extended `resolveAndDeleteMedia(bucket,path)` now also clears resume

- [ ] **Step 1: Write failing test for resume resolve helper**

```ts
// src/features/cms/media-resolve.test.ts
import { removeResumeMediaReference } from "./media-resolve";
test("removeResumeMediaReference deletes resume_media row", async () => {
  // setup: insert resume_media with path "a.jpg"
  const before = await countResumeMedia("a.jpg");
  expect(before).toBe(1);
  await removeResumeMediaReference(client, "a.jpg");
  const after = await countResumeMedia("a.jpg");
  expect(after).toBe(0);
});
```

- [ ] **Step 2: Run test — expect FAIL (function not defined)**

Run: `npm test -- src/features/cms/media-resolve.test.ts -t "removeResumeMedia"`

- [ ] **Step 3: Implement minimal helper**

```ts
// src/features/cms/media-resolve.ts
export async function removeResumeMediaReference(client, path: string) {
  const { data, error } = await client.from("resume_media").delete().or(`thumbnail_src.eq.${path},full_src.eq.${path}`).select("id");
  if (error) throw new Error(error.message);
  return { deletedRows: data?.length ?? 0 };
}
```

- [ ] **Step 4: Test passes**

Run: `npm test -- src/features/cms/media-resolve.test.ts`

- [ ] **Step 5: Extend resolveAndDeleteMedia to call it**

```ts
// in resolveAndDeleteMedia, after blog cover/content handling:
const { data: resumeRows } = await client.from("resume_media").select("id, resume_entry_id").or(`thumbnail_src.eq.${path},full_src.eq.${path}`);
if (resumeRows?.length) {
  // For each, ensure resume_entry not trashed, then delete row with FOR UPDATE
  for (const row of resumeRows) {
    await client.from("resume_media").delete().eq("id", row.id);
    removedResumeRows++;
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/features/cms/media-resolve.ts src/features/cms/media-resolve-actions.ts
git commit -m "feat(media): auto-resolve resume_media on delete (bypass DELETE_DEPENDENCY_EXISTS)"
```

---

### Task 3: Fix RPC or add dedicated resume resolve RPC (optional but recommended for atomicity)

**Files:**
- Create: `supabase/migrations/YYYYMMDD_resume_media_resolve.sql`
- Modify: `src/features/cms/media-resolve-actions.ts` to call new RPC if exists

**Interfaces:**
- Consumes: `resume_media` table, `resume_entries.deleted_at`
- Produces: `public.cms_resolve_resume_media(p_path text) returns jsonb` — deletes `resume_media` where `thumbnail_src = p_path OR full_src = p_path` and `resume_entry_id` in `select id from resume_entries where deleted_at is null`, `SECURITY INVOKER`, `GRANT TO authenticated`

- [ ] **Step 1: Write migration with function**

```sql
create or replace function public.cms_resolve_resume_media(p_path text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_cnt int;
begin
  if not private.is_owner() then return jsonb_build_object('status','failed','errorCode','DELETE_NOT_ALLOWED'); end if;
  delete from public.resume_media where thumbnail_src = p_path or full_src = p_path and resume_entry_id in (select id from public.resume_entries where deleted_at is null);
  get diagnostics v_cnt = row_count;
  return jsonb_build_object('status','deleted','deletedRows',v_cnt);
end; $$;
revoke all on function public.cms_resolve_resume_media(text) from public;
grant execute on function public.cms_resolve_resume_media(text) to authenticated;
```

- [ ] **Step 2: Apply locally**

Run: `supabase db reset --local` — expect no error

- [ ] **Step 3: Update app layer to prefer RPC**

```ts
await client.rpc("cms_resolve_resume_media", { p_path: path });
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/YYYYMMDD_resume_media_resolve.sql src/features/cms/media-resolve-actions.ts
git commit -m "fix(db): add cms_resolve_resume_media RPC for atomic resume cleanup"
```

---

### Task 4: Make audit eye visible on all branches

**Files:**
- Modify: `src/app/admin/(dashboard)/audit/data.ts` — ensure `snapshot` selected
- Modify: `src/app/admin/(dashboard)/audit/audit-list.tsx` — ensure eye button is not hidden by `table-layout: fixed` + `max-width:18rem` and has proper contrast
- Modify: `src/app/admin/(dashboard)/audit/page.tsx` — ensure it renders `AuditList`

**Interfaces:**
- Consumes: `listAudit(limit)` → `AuditRow[]` with `snapshot`
- Produces: `AuditList` renders `<table>` with last column `width:3rem` containing `<button aria-label="View details"><EyeIcon/></button>` and modal with `admin-dialog` centered, `var(--color-surface)` / `var(--color-text)`

- [ ] **Step 1: Verify eye missing is due to branch**

Run: `git branch --contains 7c83692 | grep -E "dev|main|feat/118"` — expect `feat/118` not containing `fix/audit-eye` (which is on `main` + `feat/blog-tags-admin` but not on `dev` before merge). Confirm by checking `git log --oneline dev | grep audit-eye` — if missing, that explains user not seeing eye on dev/118.

- [ ] **Step 2: Cherry-pick or merge fix into dev and all feat branches**

Run:
```bash
git checkout dev && git merge fix/audit-eye --no-edit
git checkout feat/118-dependency-inspection && git merge fix/audit-eye --no-edit
# repeat for 119,120,121,122, feat/blog-tags-admin
```

- [ ] **Step 3: Fix CSS if eye still hidden**

If eye button is rendered but not visible:
- Check `globals.css:3318` — `.admin-table td { max-width:18rem; overflow:hidden; ... }` — ensure last `td` (actions) has `white-space:normal; overflow:visible` (already added for `td:last-child`) so eye not clipped
- Check `audit-list.tsx` eye button uses `admin-link-button` which has `color: var(--color-accent)` — ensure contrast in both themes (accent is visible on surface)

Add test:
```ts
test("audit table renders eye button", () => {
  render(<AuditList rows={[mockRow]} />);
  expect(screen.getByLabelText(/View details/)).toBeVisible();
});
```

- [ ] **Step 4: Run lint/typecheck/build**

Run: `npm run lint && npm run typecheck && npm run build -- --webpack`

Expected: PASS (eye visible)

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/audit/*
git commit -m "fix(audit): ensure eye icon visible and snapshot modal works on all branches"
```

---

### Task 5: Manual verification and docs

**Files:**
- Modify: `docs/superpowers/plans/YYYY-MM-DD-resume-media-resolve-audit-eye.md` (this file) — mark tasks complete

- [ ] **Step 1: Run full flow on feat/122 (or dev after merges)**

```bash
git checkout dev
supabase db reset --local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 SUPABASE_SERVICE_ROLE_KEY=sb_secret_... ADMIN_EMAIL=local-test@qvak.dev ADMIN_PASSWORD=Qvak-Admin-2026 npm run seed:admin
npm run dev
# 1. Create resume entry with image via /admin/resume → add media
# 2. Try delete that image from /admin/media → should now auto-resolve (or show Resolve & Delete that succeeds) instead of blocked
# 3. Check Trash has the media, Audit has eye → click eye → modal shows full row + snapshot
```

- [ ] **Step 2: Verify no regression for blog media**

Repeat blog cover/content test from Task 1 — still should auto-resolve

- [ ] **Step 3: Push and open PR**

```bash
git push origin dev
gh pr create --base main --head dev --title "fix: resume media auto-resolve + audit eye visibility"
```

