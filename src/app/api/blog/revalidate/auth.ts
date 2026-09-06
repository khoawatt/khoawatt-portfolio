import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Decide whether a revalidate request carries the configured shared secret.
 *
 * Pure function (no Next.js imports) so it stays unit-testable under node:test.
 * Fail-closed: an unconfigured/empty expected secret never authorizes.
 * Comparison is timing-safe (both sides hashed first so lengths always match).
 */
export function isRevalidateAuthorized(
  authHeader: string | null | undefined,
  expectedSecret: string | undefined,
): boolean {
  if (!expectedSecret) return false;
  if (!authHeader) return false;
  const [scheme, token] = authHeader.trim().split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return false;
  const a = createHash("sha256").update(token, "utf8").digest();
  const b = createHash("sha256").update(expectedSecret, "utf8").digest();
  return timingSafeEqual(a, b);
}
