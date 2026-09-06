-- Admin-manageable favicon seed (local-first content SQL).
--
-- Reuses the existing `app_settings` key-value table (same pattern as
-- `resume.publicity`) instead of a new `site_settings` table. Points at the
-- fixed public object `site/favicon.png` in the `portfolio` bucket; the
-- binary itself is uploaded by `scripts/seed-favicon.mjs` (SQL cannot carry
-- binaries). Idempotent: safe to re-apply after every re-upload simply by
-- refreshing `favicon.updated_at` (the `?v=` cache-buster source).
--
-- Apply: supabase db query --local -f scripts/seed-favicon.sql
-- Promote to cloud ONLY with explicit human approval (--linked).

insert into public.app_settings (key, value, changed_at)
values
  ('favicon.path', '"site/favicon.png"', now()),
  ('favicon.updated_at', to_jsonb(now()::text), now())
on conflict (key) do update
  set value = excluded.value,
      changed_at = excluded.changed_at;
