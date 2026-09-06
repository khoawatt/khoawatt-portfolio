-- Cover for the first bilingual blog post (ai-agents-2026-how-they-work).
--
-- Uploads are NOT part of this file: place the rendered 1600x900 PNG at
-- `blog-media/ai-agents-2026-how-they-work/cover.png` first, e.g.
--   supabase storage cp <png> ss:///blog-media/ai-agents-2026-how-they-work/cover.png --local --experimental
-- Source artwork: scripts/cover-ai-agents-2026-how-they-work.svg
-- (regenerate with `node -e "require('sharp')('<svg>').png().toFile('<png>')"`).
--
-- Idempotent: safe to re-run (upserts by (bucket,path) / id).
-- Local-first: apply with `supabase db query --local -f <this-file>`,
-- verify, then promote with `--linked` only after human approval.
--
-- NOTE: wrapped in a single DO block because `supabase db query -f`
-- executes the file as one prepared statement (multi-command files fail).

DO $seed$
BEGIN

insert into media_assets (bucket, path, title, alt_en, alt_vi, width, height, size_bytes, mime) values
  ('blog-media', 'ai-agents-2026-how-they-work/cover.png',
   'AI Agents in 2026 — article cover',
   'Editorial cover for the article AI Agents in 2026: dark background with gold accents, the six-stage agent loop Goal, Plan, Tool, Observe, Decide, Execute, and an agent hub connected to Code, Web, API, DB, Files and Memory tools.',
   'Ảnh bìa bài viết AI Agent năm 2026: nền tối điểm vàng gold, vòng lặp sáu giai đoạn Goal, Plan, Tool, Observe, Decide, Execute và trung tâm agent nối tới các công cụ Code, Web, API, DB, Files và Memory.',
   1600, 900, 158918, 'image/png')
on conflict (bucket, path) do update set
  title = excluded.title,
  alt_en = excluded.alt_en,
  alt_vi = excluded.alt_vi,
  width = excluded.width,
  height = excluded.height,
  size_bytes = excluded.size_bytes,
  mime = excluded.mime,
  updated_at = now();

update blog_posts
set cover_bucket_path = 'ai-agents-2026-how-they-work/cover.png',
    updated_at = now()
where id = 'ai-agents-2026-how-they-work';

END
$seed$;
