#!/usr/bin/env bash
# Refresh cached blog reads after machine publishing (see docs/08-blog-operations.md).
#
# Usage:
#   BLOG_REVALIDATE_SECRET=<secret> scripts/blog-revalidate.sh <base-url>
#
# Examples:
#   BLOG_REVALIDATE_SECRET=... scripts/blog-revalidate.sh http://127.0.0.1:3000
#   BLOG_REVALIDATE_SECRET=... scripts/blog-revalidate.sh https://khoawatt.com
#
# Exits non-zero unless the endpoint answers {"ok":true}. The secret is sent
# only as an Authorization header and is never printed.
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: BLOG_REVALIDATE_SECRET=<secret> $0 <base-url>" >&2
  exit 2
fi
if [ -z "${BLOG_REVALIDATE_SECRET:-}" ]; then
  echo "error: BLOG_REVALIDATE_SECRET is not set (refusing to send an empty secret)" >&2
  exit 2
fi

base="${1%/}"
code="$(curl -s -o /tmp/blog-revalidate-response.json -w '%{http_code}' --max-time 60 \
  -X POST "${base}/api/blog/revalidate" \
  -H "Authorization: Bearer ${BLOG_REVALIDATE_SECRET}")"
body="$(cat /tmp/blog-revalidate-response.json)"
rm -f /tmp/blog-revalidate-response.json

if [ "$code" = "200" ] && [ "$body" = '{"ok":true}' ]; then
  echo "revalidated ${base} (blog cache tag refreshed)"
else
  echo "revalidate failed: HTTP ${code} body: ${body}" >&2
  exit 1
fi
