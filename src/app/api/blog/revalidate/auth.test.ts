import assert from "node:assert/strict";
import { test } from "node:test";

import { isRevalidateAuthorized } from "./auth";

const SECRET = "test-secret-with-32-plus-characters-abcdef";

test("revalidate auth: exact Bearer match is authorized", () => {
  assert.equal(isRevalidateAuthorized(`Bearer ${SECRET}`, SECRET), true);
});

test("revalidate auth: wrong token is rejected", () => {
  assert.equal(isRevalidateAuthorized("Bearer wrong-token", SECRET), false);
});

test("revalidate auth: missing or malformed header is rejected", () => {
  assert.equal(isRevalidateAuthorized(null, SECRET), false);
  assert.equal(isRevalidateAuthorized(undefined, SECRET), false);
  assert.equal(isRevalidateAuthorized("", SECRET), false);
  assert.equal(isRevalidateAuthorized(SECRET, SECRET), false);
  assert.equal(isRevalidateAuthorized("Basic abc123", SECRET), false);
  assert.equal(isRevalidateAuthorized("Bearer ", SECRET), false);
});

test("revalidate auth: unconfigured secret never authorizes (fail-closed)", () => {
  assert.equal(isRevalidateAuthorized(`Bearer ${SECRET}`, undefined), false);
  assert.equal(isRevalidateAuthorized(`Bearer ${SECRET}`, ""), false);
  assert.equal(isRevalidateAuthorized("Bearer ", ""), false);
});

test("revalidate auth: different-length secrets compare safely", () => {
  assert.equal(isRevalidateAuthorized("Bearer short", SECRET), false);
  assert.equal(
    isRevalidateAuthorized(`Bearer ${"x".repeat(200)}`, SECRET),
    false,
  );
});
