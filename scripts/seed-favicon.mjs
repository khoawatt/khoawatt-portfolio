#!/usr/bin/env node
/**
 * Seed the default admin-managed favicon into local Supabase.
 *
 * Uploads the QVAK brand mark (recovered from git history — the static
 * `src/app/icon.png` removed in favor of the dynamic path) to the public
 * `portfolio` bucket at the fixed object `site/favicon.png`, then upserts
 * the `app_settings` rows (`favicon.path`, `favicon.updated_at`).
 *
 * Usage:
 *   node scripts/seed-favicon.mjs [path-to-png]
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the
 * environment (see .env.local). Idempotent. LOCAL ONLY unless a human
 * explicitly points it at production.
 */

import { readFile } from "node:fs/promises";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sourcePath = process.argv[2] ?? "/tmp/qvak-favicon-seed.png";

if (!url || !serviceRole) {
  console.error(
    "Missing required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

async function main() {
  const bytes = await readFile(sourcePath);
  if (bytes.length > 1024 * 1024) {
    throw new Error(`Seed image exceeds 1 MB (${bytes.length} bytes).`);
  }

  const baseHeaders = {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
  };

  // 1. Upload (upsert) the bytes to the public portfolio bucket.
  const uploadRes = await fetch(
    `${url}/storage/v1/object/portfolio/site/favicon.png`,
    {
      method: "POST",
      headers: {
        ...baseHeaders,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: bytes,
    },
  );
  if (!uploadRes.ok) {
    throw new Error(`Storage upload failed: ${await uploadRes.text()}`);
  }

  // 2. Upsert the setting rows (merge-duplicates => idempotent).
  const updatedAt = new Date().toISOString();
  const settingsRes = await fetch(`${url}/rest/v1/app_settings`, {
    method: "POST",
    headers: {
      ...baseHeaders,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify([
      { key: "favicon.path", value: "site/favicon.png" },
      { key: "favicon.updated_at", value: updatedAt },
    ]),
  });
  if (!settingsRes.ok) {
    throw new Error(`Settings upsert failed: ${await settingsRes.text()}`);
  }

  console.log(`Seeded favicon from ${sourcePath} (${bytes.length} bytes).`);
  console.log(`favicon.updated_at = ${updatedAt}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
