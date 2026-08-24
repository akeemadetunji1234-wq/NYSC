#!/usr/bin/env bash
set -u
BASE_URL="${BASE_URL:-http://127.0.0.1:3002}"

role_routes=(
  /member /member/marketplace /member/notifications /member/messages /member/artisans /member/transport /member/premium /member/profile /member/compare
  /agent /agent/leads /agent/analytics /agent/properties /agent/properties/boost /agent/reviews /agent/viewings /agent/messages /agent/premium
  /admin /admin/analytics /admin/audit /admin/cms /admin/verification /admin/properties /admin/users /admin/agents /admin/reports /admin/disputes /admin/payouts /admin/settings /admin/partnerships
)
api_routes=(
  /api/health /api/keep-alive /api/pusher/auth /api/cron/deliver-notifications /api/cron/cleanup-otp /api/admin/verification-document /api/upload
)

printf 'BASE_URL=%s\n' "$BASE_URL"
printf '\nROLE ROUTES (unauthenticated boundary)\n'
for route in "${role_routes[@]}"; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$BASE_URL$route") || code=000
  printf '%-42s %s\n' "$route" "$code"
done

printf '\nAPI ROUTES (unauthenticated/health boundary)\n'
for route in "${api_routes[@]}"; do
  if [[ "$route" == "/api/pusher/auth" ]]; then
    code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 -X POST -H 'content-type: application/x-www-form-urlencoded' --data 'socket_id=1.1&channel_name=private-user-test' "$BASE_URL$route") || code=000
  else
    code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$BASE_URL$route") || code=000
  fi
  printf '%-42s %s\n' "$route" "$code"
done
