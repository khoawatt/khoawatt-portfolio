import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { POST } from "./route";

const KEY = "BLOG_REVALIDATE_SECRET";
const saved = process.env[KEY];

afterEach(() => {
  if (saved === undefined) delete process.env[KEY];
  else process.env[KEY] = saved;
});

function postRequest(authHeader?: string): Request {
  return new Request("http://localhost/api/blog/revalidate", {
    method: "POST",
    ...(authHeader ? { headers: { authorization: authHeader } } : {}),
  });
}

test("revalidate route fails closed when the secret is unconfigured", async () => {
  delete process.env[KEY];
  const response = await POST(postRequest("Bearer anything"));
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Not configured/);
});

test("revalidate route rejects a wrong secret", async () => {
  process.env[KEY] = "correct-secret-for-tests-only-abc123";
  const response = await POST(postRequest("Bearer wrong-secret"));
  assert.equal(response.status, 401);
});

test("revalidate route rejects a missing header", async () => {
  process.env[KEY] = "correct-secret-for-tests-only-abc123";
  const response = await POST(postRequest());
  assert.equal(response.status, 401);
});
