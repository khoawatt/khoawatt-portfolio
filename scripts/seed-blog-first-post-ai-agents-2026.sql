-- Seed first bilingual blog post: AI Agents in 2026 (knowledge / ai-agents + typescript).
--
-- Owner-approved SEO content for khoawatt.com. Idempotent: safe to re-run
-- (upserts by id / (post_id,locale) / (post_id,tag_id)).
--
-- Local-first: apply with `supabase db query --local -f scripts/seed-blog-first-post-ai-agents-2026.sql`,
-- verify, then promote with `--linked` only after human approval. NOTE: direct SQL
-- does not run the admin `updateTag(BLOG_CACHE_TAG)` path, so cached listing/article
-- pages need an on-demand revalidation (any admin blog save) or a fresh deployment.
--
-- Cover: intentionally NULL for v1 (repository renders without coverImage).
-- Follow-up task will produce the 16:9 editorial cover via the blog-media
-- local-first workflow and persist its reference + alt text.
--
-- NOTE: wrapped in a single DO block because `supabase db query -f`
-- executes the file as one prepared statement (multi-command files fail).

DO $seed$
BEGIN

insert into blog_posts (id, slug, category_id, status, published_at, updated_at) values
  ('ai-agents-2026-how-they-work',
   'ai-agents-2026-how-they-work',
   'knowledge', 'published',
   '2026-09-06T09:00:00Z', '2026-09-06T09:00:00Z')
on conflict (id) do update set
  slug = excluded.slug,
  category_id = excluded.category_id,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = excluded.updated_at;

insert into blog_post_translations (post_id, locale, title, summary, content_md) values
  ('ai-agents-2026-how-they-work', 'en',
   'AI Agents in 2026: What They Are, How They Work, and Why They Matter',
   'AI agents go beyond chatbots. Learn how autonomous AI agents plan, use tools, and execute multi-step tasks — and why agentic AI matters in 2026.',
   $$# AI Agents in 2026: What They Are, How They Work, and Why They Matter

AI agents have moved beyond simple chatbots. Instead of answering one prompt with one reply, autonomous AI agents pursue a goal across many steps: they plan, call tools, observe results, adjust course, and keep going until the job is done. That shift is why agentic AI is now core to modern development.

If you build web apps, internal tools, or automation pipelines, this mental model will save you real rework. This article explains what AI Agents are, how the loop works, and where they add value.

## Agents are not just smarter chatbots

A chatbot maps one input to one output. An AI Agent owns an objective such as "find the three slowest API routes and draft a fix." It breaks the request down, gathers context, runs commands, reads files, and reports back with evidence.

Three differences matter. First, persistence: autonomous AI agents keep working across tool calls without a fresh prompt each time. Second, tool use: they query databases, run code, and call APIs through typed interfaces. Third, recovery: when a step fails, a good agent replans instead of quitting or faking success. That loop is agentic AI in practice.

## How they work: Goal, Plan, Tool, Observe, Decide, Execute

Most production agents follow the same six-stage rhythm.

Goal must be specific and testable. "Improve checkout" is a wish; "reproduce the staging checkout timeout, find the slowest query, propose a minimal fix" is executable. Vague goals produce wandering trajectories.

Plan drafts a short sequence: explore, reproduce, measure, hypothesize, patch, verify. Keep it small and visible so a human can interrupt early. The plan is a draft that changes as observations arrive.

Tool gives the agent hands. Tools are typed functions with clear names: search files, read a handler, run tests, query logs. The model can only invoke what you expose, so designing tools is most of the engineering in agentic AI.

Observe grounds each decision. After every call the agent reads real output: file contents, test results, latency numbers. Without this step, autonomous AI agents drift and hallucinate.

Decide picks the next action: dig deeper, try another hypothesis, ask for a missing credential, or stop. Explicit decision points keep behavior reviewable and prevent infinite loops.

Execute runs the action, records it, and loops back with fresh context until the goal is met, blocked, or out of budget. Step limits, timeouts, and cost caps make AI Agents deployable.

## The four capabilities that matter

Planning keeps multi-step work coherent. Each action inherits context, so even a mid-size model can chain a dozen steps toward one outcome.

Tool use turns knowledge into effect. A model that only talks describes your slow query; an agent with database tools finds it and shows before-and-after numbers.

Memory bridges steps. Short-term memory tracks what was tried and rejected; durable memory stores repo conventions and guardrails. A Markdown memory file the agent reads at startup is often enough.

Bounded autonomy builds trust. Grant broad read access but narrow write access. Let the agent explore and draft freely, then require human approval before merging, deploying, or touching customer data.

## A minimal loop in TypeScript

The shape fits in one file: a bounded loop, explicit tools, an observation after every call, and a hard stop. Production adds retries, but the shape transfers.

```ts
type Tool = {
  name: string;
  description: string;
  run: (input: string) => Promise<string>;
};

async function runAgent(goal: string, tools: Tool[], maxSteps = 8) {
  const history = [`Goal: ${goal}`];
  for (let step = 0; step < maxSteps; step++) {
    const next = await planNext(history, tools);
    const tool = tools.find((t) => t.name === next.name);
    if (!tool) return `Stopped: unknown tool "${next.name}".`;
    const observation = await tool.run(next.input);
    history.push(`Action: ${tool.name}(${next.input})`);
    history.push(`Observation: ${observation}`);
    if (history.join("\n").includes("VERIFIED")) break;
  }
  return history.slice(-6).join("\n");
}

async function planNext(history: string[], tools: Tool[]) {
  // Call your LLM with goal + recent history + tool schemas.
  throw new Error("Wire to your model client.");
}
```

Keep tool schemas strict, truncate long observations, and define the stop condition up front: verified outcome, user interrupt, or budget exhausted.

## Why 2026 is the turning point

Models follow multi-step instructions reliably, one agent spans code, docs, and telemetry, and teams instrument the loop with traces and cost tracking. Triage arrives as a drafted answer with cited logs; migrations arrive as reviewed diffs. Engineers become reviewers and guardrail owners.

## Use them where verification is clear

Give autonomous AI agents well-scoped, checkable work: investigations, scaffolding, migrations, test generation, doc sync, first-pass review. Keep humans owning architecture, security, and irreversible production changes. The rule: the agent drafts, the human is accountable for every merged line. Start with one repo, five read tools, one gated write tool, and one metric — then expand.$$),
  ('ai-agents-2026-how-they-work', 'vi',
   'AI Agent năm 2026: Là gì, hoạt động như thế nào và tại sao quan trọng?',
   'AI Agent vượt xa chatbot. Tìm hiểu cách chúng lập kế hoạch, dùng công cụ, thực hiện tác vụ nhiều bước và vì sao agentic AI quan trọng năm 2026.',
   $$# AI Agent năm 2026: Là gì, hoạt động như thế nào và tại sao quan trọng?

AI Agent đã vượt xa chatbot truyền thống. Thay vì trả một câu hỏi bằng một câu trả lời, các autonomous AI agents theo đuổi mục tiêu qua nhiều bước: lập kế hoạch, gọi công cụ, quan sát kết quả, đổi hướng và tiếp tục đến khi xong việc. Chuyển từ phản hồi bị động sang hành vi hướng mục tiêu là lý do agentic AI thành mô hình cốt lõi trong phát triển phần mềm hiện đại.

Nếu bạn xây ứng dụng web, công cụ nội bộ hay pipeline tự động, mô hình này sẽ giúp bạn bớt làm lại. Bài viết giải thích AI Agent là gì, vòng lặp vận hành ra sao và giá trị thực nằm ở đâu.

## Agent không chỉ là chatbot khôn hơn

Chatbot ánh xạ một đầu vào thành một đầu ra. AI Agent sở hữu một mục tiêu như "tìm ba API chậm nhất rồi soạn bản sửa". Nó chia nhỏ việc, thu thập ngữ cảnh, chạy lệnh, đọc file và báo cáo kèm bằng chứng.

Ba khác biệt quan trọng. Thứ nhất, bền bỉ: autonomous AI agents làm xuyên suốt nhiều lần gọi công cụ mà không cần nhắc lại. Thứ hai, dùng công cụ: truy vấn cơ sở dữ liệu, chạy mã, gọi API qua giao diện có kiểu. Thứ ba, phục hồi: bước hỏng thì lập lại kế hoạch thay vì bỏ cuộc hay bịa thành công. Vòng lặp bộ nhớ, kế hoạch, công cụ và kiểm chứng chính là agentic AI trong thực tế.

## Cách vận hành: Mục tiêu, Kế hoạch, Công cụ, Quan sát, Quyết định, Thực thi

Hầu hết agent production đều theo sáu nhịp quen thuộc.

Mục tiêu phải cụ thể và kiểm chứng được. "Cải thiện checkout" là ước muốn; "tái hiện timeout checkout trên staging, tìm truy vấn chậm nhất, đề xuất bản sửa tối thiểu" mới thực thi được. Mục tiêu mơ hồ sinh hành trình lang thang.

Kế hoạch phác thảo chuỗi ngắn: khám phá, tái hiện, đo lường, giả thuyết, vá lỗi, kiểm chứng. Giữ gọn và hiển thị rõ để con người ngắt sớm. Kế hoạch là nháp và sẽ đổi khi quan sát mới đến.

Công cụ trao đôi tay cho agent. Công cụ là hàm có kiểu với tên rõ: tìm file, đọc handler, chạy test, truy log. Mô hình chỉ gọi những gì bạn cho phép, nên thiết kế công cụ chiếm phần lớn công việc trong agentic AI.

Quan sát neo quyết định vào thực tế. Sau mỗi lần gọi, agent đọc kết quả thật: nội dung file, kết quả test, con số độ trễ. Thiếu bước này, autonomous AI agents sẽ trôi và ảo giác.

Quyết định chọn hành động tiếp theo: đào sâu, đổi giả thuyết, hỏi thông tin thiếu, hay dừng lại. Điểm quyết định tường minh giúp hành vi dễ soát và tránh lặp vô hạn.

Thực thi chạy hành động, ghi lại rồi lặp lại với ngữ cảnh mới cho đến khi đạt mục tiêu, bị chặn hoặc hết ngân sách. Giới hạn bước, timeout và trần chi phí là lan can giúp AI Agent triển khai được.

## Bốn năng lực cốt lõi

Lập kế hoạch giữ mạch lạc nhiều bước. Mỗi hành động kế thừa ngữ cảnh nên mô hình tầm trung cũng xâu chuỗi được hàng chục bước tới một kết quả.

Dùng công cụ biến kiến thức thành tác động. Mô hình chỉ biết nói sẽ mô tả truy vấn chậm; agent có công cụ cơ sở dữ liệu sẽ tìm ra và cho con số trước sau.

Bộ nhớ nối các bước. Ngắn hạn ghi việc đã thử và đã loại; dài hạn lưu quy ước repo và lan can. Một file Markdown agent đọc lúc khởi động thường đã đủ.

Tự chủ có biên giới tạo tin cậy. Cho quyền đọc rộng nhưng quyền ghi hẹp. Để agent tự do khám phá và soạn nháp, rồi yêu cầu người duyệt trước khi merge, deploy hay chạm dữ liệu khách hàng.

## Vòng lặp tối thiểu bằng TypeScript

Hình dáng vừa trong một file: vòng lặp có giới hạn, công cụ tường minh, quan sát sau mỗi lần gọi và điểm dừng cứng. Bản production thêm retry và persistence nhưng giữ nguyên khung này.

```ts
type Tool = {
  name: string;
  description: string;
  run: (input: string) => Promise<string>;
};

async function runAgent(goal: string, tools: Tool[], maxSteps = 8) {
  const history = [`Goal: ${goal}`];
  for (let step = 0; step < maxSteps; step++) {
    const next = await planNext(history, tools);
    const tool = tools.find((t) => t.name === next.name);
    if (!tool) return `Stopped: unknown tool "${next.name}".`;
    const observation = await tool.run(next.input);
    history.push(`Action: ${tool.name}(${next.input})`);
    history.push(`Observation: ${observation}`);
    if (history.join("\n").includes("VERIFIED")) break;
  }
  return history.slice(-6).join("\n");
}

async function planNext(history: string[], tools: Tool[]) {
  // Gọi LLM với mục tiêu + lịch sử gần nhất + schema công cụ.
  throw new Error("Kết nối tới model client của bạn.");
}
```

Giữ schema công cụ nghiêm, cắt ngắn quan sát dài và chốt điều kiện dừng từ đầu: kết quả đã kiểm chứng, người dùng ngắt, hoặc hết ngân sách.

## Vì sao 2026 là bước ngoặt

Mô hình đã làm theo hướng dẫn nhiều bước ổn định, giao thức công cụ cho một agent làm xuyên mã nguồn, tài liệu và telemetry, và các nhóm đã đo vòng lặp bằng trace, replay cùng theo dõi chi phí. Phân loại hỗ trợ đến dưới dạng nháp kèm log trích dẫn; migration đến dưới dạng diff đã review. Kỹ sư lên vai trò reviewer và chủ lan can, còn tự chủ có giám sát nén khoảng cách từ phát hiện đến kiểm chứng bản sửa.

## Dùng nơi kiểm chứng rõ ràng

Giao cho autonomous AI agents việc có phạm vi gọn và tín hiệu xong rõ: điều tra, dựng khung, migration, sinh test, đồng bộ tài liệu, review vòng đầu. Giữ con người nắm kiến trúc, biên bảo mật và thay đổi production không đảo ngược được. Quy tắc hiệu quả: agent soạn nháp, con người chịu trách nhiệm từng dòng merge. Bắt đầu với một repo, năm công cụ đọc, một công cụ ghi có kiểm soát và một chỉ số — rồi mở rộng. Xây như vậy, agentic AI trả công mỗi tuần.$$)
on conflict (post_id, locale) do update set
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md;

insert into blog_post_tags (post_id, tag_id) values
  ('ai-agents-2026-how-they-work', 'ai-agents'),
  ('ai-agents-2026-how-they-work', 'typescript')
on conflict (post_id, tag_id) do nothing;

END
$seed$;
