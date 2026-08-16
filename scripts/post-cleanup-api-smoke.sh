#!/usr/bin/env bash
set -u

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected="$4"
  local body="${5:-}"
  local content_type="${6:-}"
  local tmp
  tmp=$(mktemp)
  local status
  if [[ -n "$body" && -n "$content_type" ]]; then
    status=$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" -H "$content_type" --data "$body" "$BASE_URL$path")
  elif [[ -n "$body" ]]; then
    status=$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" --data "$body" "$BASE_URL$path")
  else
    status=$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$BASE_URL$path")
  fi
  local response
  response=$(tr '\n' ' ' < "$tmp" | cut -c1-180)
  rm -f "$tmp"
  if [[ "$status" == "$expected" ]]; then
    printf 'PASS %-38s HTTP %s  %s\n' "$name" "$status" "$response"
    PASS=$((PASS + 1))
  else
    printf 'FAIL %-38s HTTP %s (expected %s)  %s\n' "$name" "$status" "$expected" "$response"
    FAIL=$((FAIL + 1))
  fi
}

# Public health/auth endpoints.
check "health database probe" GET "/api/health" 200
check "NextAuth providers" GET "/api/auth/providers" 200
check "NextAuth CSRF" GET "/api/auth/csrf" 200
check "NextAuth session" GET "/api/auth/session" 200
check "auth development log stub" POST "/api/auth/_log" 200 '{}' 'Content-Type: application/json'

# Validation and authorization boundaries.
check "registration invalid payload" POST "/api/auth/register" 400 '{}' 'Content-Type: application/json'
check "protected verification document" GET "/api/admin/verification-document" 401
check "protected Pusher auth" POST "/api/pusher/auth" 401 '' 'Content-Type: application/x-www-form-urlencoded'
check "upload malformed request" POST "/api/upload" 400
check "keep-alive without bearer" GET "/api/keep-alive" 401
check "OTP cleanup without bearer" GET "/api/cron/cleanup-otp" 401

printf '\nSummary: %d passed, %d failed\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]]
