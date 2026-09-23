# Admin MFA (TOTP) + step-up

## What shipped

- DB fields on `User`: `totpSecret` (encrypted), `totpEnabled`, `totpEnabledAt`
- Server actions: `beginAdminMfaEnrollment`, `confirmAdminMfaEnrollment`, `verifyAdminMfaStepUp`, `disableAdminMfa`
- `requireAdminStepUp()` guard — after MFA is enabled, sensitive actions need a valid TOTP within 15 minutes
- Wired into: support snapshot, NDPR export route

## Admin setup (one-time)

1. Deploy migration `0016_admin_mfa` (runs on Vercel build via migrate script)
2. While signed in as ADMIN, call `beginAdminMfaEnrollment()`
3. Scan the `otpauthUrl` / enter `secret` in Google Authenticator or Authy
4. Call `confirmAdminMfaEnrollment(code)` with a live 6-digit code
5. Audit log should show `ADMIN_MFA_ENABLED`

## Step-up usage

Before NDPR export, support view, role changes, etc.:

1. Call `verifyAdminMfaStepUp(code)`
2. Cookie `nysc_admin_mfa_stepup` is set (httpOnly, 15 min)
3. Proceed with the sensitive action

## Still to build (UI)

- Admin settings page: QR code + confirm form
- Optional login challenge when `totpEnabled`
- Wire `requireAdminStepUp` into remaining admin mutations (role changes, verification decisions, payment config)

## Security notes

- TOTP secret encrypted with key derived from `NEXTAUTH_SECRET`
- Failed codes rate-limited and audit-logged
- Until MFA is enabled, admins are not locked out (soft rollout); enable MFA as soon as possible
