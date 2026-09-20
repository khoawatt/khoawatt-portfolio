-- Seed three bilingual sample blog posts (knowledge / techniques / reviews).
--
-- Owner-approved demo content so the public blog, topic chips and related
-- posts render with real shape on production. Idempotent: safe to re-run
-- (upserts by id / (post_id,locale) / (post_id,tag_id)).
--
-- Local-first: apply with `supabase db query --local -f scripts/seed-blog-samples.sql`,
-- verify, then promote with `--linked`. NOTE: direct SQL does not run the
-- admin `updateTag(BLOG_CACHE_TAG)` path, so cached listing/article pages need
-- an on-demand revalidation (any admin blog save) or a fresh deployment.

-- NOTE: wrapped in a single DO block because `supabase db query -f`
-- executes the file as one prepared statement (multi-command files fail).

DO $seed$
BEGIN


insert into blog_posts (id, slug, category_id, status, published_at, updated_at) values
  ('building-blog-with-nextjs-supabase',
   'building-blog-with-nextjs-supabase',
   'knowledge', 'published',
   '2026-08-20T09:00:00Z', '2026-08-20T09:00:00Z'),
  ('typescript-tips-for-react-server-components',
   'typescript-tips-for-react-server-components',
   'techniques', 'published',
   '2026-08-22T09:00:00Z', '2026-08-22T09:00:00Z'),
  ('review-ai-coding-assistants-in-daily-work',
   'review-ai-coding-assistants-in-daily-work',
   'reviews', 'published',
   '2026-08-24T09:00:00Z', '2026-08-24T09:00:00Z')
on conflict (id) do update set
  slug = excluded.slug,
  category_id = excluded.category_id,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = excluded.updated_at;

insert into blog_post_translations (post_id, locale, title, summary, content_md) values
  ('building-blog-with-nextjs-supabase', 'en',
   'Building This Blog with Next.js 16 and Supabase',
   'How the public blog on this site works: typed repository accessors, bilingual markdown content, cached listings and per-post SEO.',
   $$# Building This Blog with Next.js 16 and Supabase

The blog you are reading runs on the same stack as the rest of this portfolio: Next.js 16 App Router, React 19, and a Supabase Postgres backend. This post walks through how the pieces fit together.

## Content model

Posts live in two tables: a locale-neutral `blog_posts` row plus one `blog_post_translations` row per language. Markdown is stored raw and rendered at request time, so both English and Vietnamese versions share the same slug, category and cover image.

### Why bilingual rows instead of JSON columns

Typed columns keep queries honest. A missing Vietnamese translation simply hides the post from the Vietnamese listing instead of rendering half-localized content.

## Reading path

A single repository module owns every public query. It maps database rows into view models, computes reading time from the markdown body, and never leaks raw rows into components.

```ts
const listing = await getPublishedPosts(locale, page);
```

Listings are wrapped in a tagged cache so admin edits revalidate everything through one tag.

## Takeaways

- Model translations as rows, not documents
- Render markdown on the server, ship HTML to the client
- One cached accessor per read path keeps invalidation simple$$),
  ('building-blog-with-nextjs-supabase', 'vi',
   'Xây Dựng Blog Này Bằng Next.js 16 và Supabase',
   'Cách blog công khai trên trang này hoạt động: repository có kiểu hóa, nội dung markdown song ngữ, danh sách có cache và SEO riêng cho từng bài.',
   $$# Xây Dựng Blog Này Bằng Next.js 16 và Supabase

Blog bạn đang đọc chạy trên cùng một stack với phần còn lại của portfolio: Next.js 16 App Router, React 19 và backend Supabase Postgres. Bài viết này đi qua cách các phần ghép với nhau.

## Mô hình nội dung

Bài viết nằm trong hai bảng: một dòng `blog_posts` trung lập ngôn ngữ cùng các dòng `blog_post_translations` cho từng ngôn ngữ. Markdown được lưu thô và render khi có yêu cầu, nên bản tiếng Anh và tiếng Việt dùng chung slug, chuyên mục và ảnh bìa.

### Vì sao chọn dòng dịch thay vì cột JSON

Cột có kiểu rõ ràng giữ cho truy vấn trung thực. Thiếu bản dịch tiếng Việt chỉ khiến bài bị ẩn khỏi danh sách tiếng Việt thay vì hiển thị nửa dịch nửa chưa dịch.

## Đường đọc dữ liệu

Một module repository duy nhất sở hữu mọi truy vấn công khai. Nó map dòng dữ liệu thành view model, tính thời gian đọc từ thân markdown và không bao giờ để lộ dòng dữ liệu thô ra component.

```ts
const listing = await getPublishedPosts(locale, page);
```

Danh sách được bọc trong cache có tag để mọi chỉnh sửa từ admin revalidate thông qua đúng một tag.

## Kết luận

- Định nghĩa bản dịch thành dòng, không phải document
- Render markdown phía server, trả HTML về client
- Một accessor có cache cho mỗi đường đọc giúp việc vô hiệu hóa đơn giản$$),
  ('typescript-tips-for-react-server-components', 'en',
   'TypeScript Tips for React Server Components',
   'Small typing habits that keep server and client components honest: prop boundaries, async params, and serializable return types.',
   $$# TypeScript Tips for React Server Components

Server components change what your types mean. A prop that was always serializable now must be, and params arrive as promises. These are the habits that keep a mixed server/client codebase calm.

## Type the boundary, not the internals

Mark client components explicitly with `"use client"` and type their props as plain data. Everything crossing that line must survive serialization, so prefer strings, numbers and plain objects over class instances.

## Async params are a promise

In Next.js 16, page props arrive asynchronously. Typing them correctly removes a whole class of runtime surprises:

```ts
interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
}
```

## Let messages travel as props

Localization loaders are server-only. Passing resolved message objects into client components keeps translations out of the client bundle and the types honest.

### Checklist

- Props crossing the server/client line are plain data
- Params and searchParams are awaited and typed as promises
- View models come from the repository, never raw rows$$),
  ('typescript-tips-for-react-server-components', 'vi',
   'Mẹo TypeScript Cho React Server Components',
   'Những thói quen kiểu hóa nhỏ giúp server và client component trung thực: ranh giới prop, async params và kiểu trả về có thể serialize.',
   $$# Mẹo TypeScript Cho React Server Components

Server components thay đổi ý nghĩa của các kiểu dữ liệu. Prop vốn luôn phải serialize được giờ bắt buộc phải vậy, và params đến dưới dạng promise. Đây là những thói quen giữ cho codebase trộn server/client luôn ổn định.

## Định kiểu ở ranh giới, không phải bên trong

Đánh dấu client component tường minh bằng `"use client"` và định kiểu prop của chúng là dữ liệu thuần. Mọi thứ vượt qua ranh giới đó phải sống sót qua serialization, nên hãy ưu tiên chuỗi, số và object thường thay vì instance của class.

## Async params là một promise

Trong Next.js 16, page props đến bất đồng bộ. Định kiểu đúng loại bỏ cả một lớp sự cố lúc chạy:

```ts
interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
}
```

## Để message đi qua props

Bộ nạp bản dịch chỉ chạy phía server. Truyền object message đã resolve vào client component giúp bản dịch không lọt vào bundle phía client và kiểu dữ liệu luôn trung thực.

### Danh sách kiểm

- Prop vượt tuyến server/client là dữ liệu thuần
- Params và searchParams được awaited và định kiểu là promise
- View model đến từ repository, không bao giờ là dòng dữ liệu thô$$),
  ('review-ai-coding-assistants-in-daily-work', 'en',
   'Review: AI Coding Assistants in Daily Work',
   'Three months of using AI assistants for reviews, boilerplate and debugging — where they genuinely help and where they still need a human.',
   $$# Review: AI Coding Assistants in Daily Work

After three months of weaving AI assistants into everyday engineering work — reviews, boilerplate, debugging — here is an honest scorecard.

## Where they shine

Repetitive scaffolding, first-pass test ideas, and explaining unfamiliar code. Asking an assistant to summarize a legacy module before reading it saves real time, and generated boilerplate is usually fine after a quick pass.

## Where humans stay required

Architecture decisions, security boundaries and anything touching production data. Assistants optimize for plausible answers; reviews must optimize for correct ones. The pattern that works: let the assistant draft, keep the human accountable for every merged line.

### Small UX details matter

Latency shapes usage more than model quality. Tools that stream partial answers get used for exploration; tools that batch get used for well-defined asks.

## Verdict

Adopt them like a fast junior pair: great throughput, zero authority. Keep reviews, credentials and deployments human-owned.$$),
  ('review-ai-coding-assistants-in-daily-work', 'vi',
   'Đánh Giá: AI Coding Assistant Trong Công Việc Hàng Ngày',
   'Ba tháng dùng AI assistant cho review, boilerplate và debug — chỗ nào thực sự giúp ích và chỗ nào vẫn cần con người.',
   $$# Đánh Giá: AI Coding Assistant Trong Công Việc Hàng Ngày

Sau ba tháng đưa AI assistant vào công việc kỹ thuật hằng ngày — review, boilerplate, debug — đây là bảng điểm trung thực.

## Chỗ nào chúng tỏa sáng

Việc dựng khung lặp lại, ý tưởng test lần đầu và giải thích code lạ. Nhờ assistant tóm tắt một module cũ trước khi tự đọc tiết kiệm thời gian thật, còn boilerplate sinh ra thường ổn sau một lượt đọc nhanh.

## Chỗ nào vẫn cần con người

Quyết định kiến trúc, ranh giới bảo mật và mọi thứ chạm vào dữ liệu production. Assistant tối ưu cho câu trả lời "có vẻ đúng"; review phải tối ưu cho câu trả lời đúng. Mô hình hiệu quả: để assistant soạn nháp, con người chịu trách nhiệm cho từng dòng được merge.

### Chi tiết UX nhỏ nhưng quan trọng

Độ trễ quyết định cách dùng nhiều hơn chất lượng mô hình. Công cụ stream từng phần đáp ứng phù hợp để khám phá; công cụ trả theo lô hợp với yêu cầu đã rõ ràng.

## Kết luận

Hãy sử dụng như một cặp lập trình nhanh: năng suất cao, không có quyền quyết cuối. Giữ review, thông tin đăng nhập và việc triển khai trong tay con người.$$)
on conflict (post_id, locale) do update set
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md;

insert into blog_post_tags (post_id, tag_id) values
  ('building-blog-with-nextjs-supabase', 'nextjs'),
  ('building-blog-with-nextjs-supabase', 'supabase'),
  ('typescript-tips-for-react-server-components', 'typescript'),
  ('typescript-tips-for-react-server-components', 'nextjs'),
  ('review-ai-coding-assistants-in-daily-work', 'ai-agents'),
  ('review-ai-coding-assistants-in-daily-work', 'ux')
on conflict (post_id, tag_id) do nothing;


END
$seed$;
