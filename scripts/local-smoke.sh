#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"

curl -fsS "$API_BASE_URL/api/v1/health" | node -e '
let body = "";
process.stdin.on("data", c => body += c);
process.stdin.on("end", () => {
  const parsed = JSON.parse(body);
  if (!parsed.success || parsed.data.status !== "ok") process.exit(1);
  console.log(JSON.stringify(parsed.data, null, 2));
});
'
