#!/usr/bin/env bash
set -u -o pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

RESULT_DIR="docs/audit-assets/test-results"
mkdir -p "$RESULT_DIR"
RESULTS_FILE="$RESULT_DIR/results.tsv"
printf 'check\texit_code\tduration_seconds\tlog\n' > "$RESULTS_FILE"

run_check() {
  local name="$1"
  local log_file="$2"
  shift 2
  local start end status
  start=$(date +%s)
  if "$@" >"$log_file" 2>&1; then
    status=0
  else
    status=$?
  fi
  if [[ -f "$log_file" ]]; then
    sed -i 's/[[:space:]]\+$//' "$log_file"
    perl -0777 -pi -e 's/\n+\z/\n/' "$log_file"
  fi
  end=$(date +%s)
  printf '%s\t%s\t%s\t%s\n' "$name" "$status" "$((end - start))" "$log_file" >> "$RESULTS_FILE"
  printf '%-32s exit=%s duration=%ss log=%s\n' "$name" "$status" "$((end - start))" "$log_file"
}

run_env_check() {
  local name="$1"
  local log_file="$2"
  shift 2
  run_check "$name" "$log_file" bash -c 'set -a; . ./.env.test.local; set +a; "$@"' bash "$@"
}

run_env_check "dependency audit" "$RESULT_DIR/dependency-audit.log" pnpm audit --json
run_env_check "typescript" "$RESULT_DIR/typescript.log" pnpm exec tsc --noEmit
find "$RESULT_DIR" -type f -name '*.log' -exec sed -i 's/[[:space:]]\+$//' {} +
find "$RESULT_DIR" -type f -name '*.log' -exec perl -0777 -pi -e 's/\n+\z/\n/' {} +
run_check "git diff check" "$RESULT_DIR/git-diff-check.log" git diff --check
run_env_check "production build" "$RESULT_DIR/production-build.log" pnpm exec next build
run_env_check "e2e auth" "$RESULT_DIR/e2e-auth.log" pnpm test:e2e:auth
run_env_check "e2e authorization isolation" "$RESULT_DIR/e2e-authz.log" pnpm test:e2e:authz
run_env_check "authorization policy" "$RESULT_DIR/authorization-policy.log" pnpm test:authz:policy
run_env_check "password change" "$RESULT_DIR/password-change.log" pnpm test:password-change
run_env_check "business flows" "$RESULT_DIR/business-flows.log" pnpm test:business-flows
run_check "responsive smoke" "$RESULT_DIR/responsive-smoke.log" pnpm test:responsive
run_env_check "role integration smoke" "$RESULT_DIR/role-integration-smoke.log" bash scripts/role-integration-smoke.sh
run_check "security audit baseline" "$RESULT_DIR/security-audit-baseline.log" bash -c 'REPO_DIR="$PWD" RUN_BUILD=false bash /home/ubuntu/skills/nysc-security-audit/scripts/run_nysc_security_audit.sh'

exit_code=0
while IFS=$'\t' read -r check status duration log; do
  [[ "$check" == "check" ]] && continue
  if [[ "$status" != "0" ]]; then exit_code=1; fi
done < "$RESULTS_FILE"
exit "$exit_code"
