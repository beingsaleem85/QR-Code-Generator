# QRForge Production Remediation

## Baseline

Source: `docs/PRODUCTION_FEATURE_AUDIT.md` (2026-08-20)

```text
212 total
171 PASS
35 PARTIAL
4 FAIL
2 NOT IMPLEMENTED
```

Starting commit: `ea64621` (audit report)

## Current Step

STEP 2 — Event QR optional end-date bug

## Status

IN PROGRESS

---

## Step Log

### STEP 1 — Change Password
- Audit item: C. Profile/Account — "Password & security" card, disabled "Change password" button
- Root cause: Feature was never implemented — a permanently `disabled` button with static "not available" text, no blocker to work around.
- Fix: New `ChangePasswordForm` (`src/components/account/ChangePasswordForm.tsx`) calling Supabase Auth's `updateUser({ password })` directly from the client, the same call the existing reset-password flow already makes. Checked live Supabase Auth config first: `security_update_password_require_current_password: false` and `security_update_password_require_reauthentication: false`, so no current-password field is required or requested. Reuses the existing `resetPasswordSchema` (min 8 chars + match) so the app has one consistent password policy.
- Focused tests: `tests/unit/components/ChangePasswordForm.test.tsx` — 8/8 pass (validation, loading state, success clears fields, safe error passthrough, stale-state clearing, no current-password field).
- Full suite: 635/635 pass.
- TypeScript: pass. ESLint: pass (0 errors). Prettier: pass. Production build: pass. Secret scan: clean.
- Commit SHA: `bdb3930` — "Implement secure Change Password on the Account page"
- Vercel deployment: `k58a0bdwo` — READY, aliased to qrforge.space
- Production verification: **PASSWORD CHANGE PRODUCTION VERIFICATION: PASS** — all 15 checks (UI present, loading state, success state, old password rejected after change, new password authenticates, account healthy after reload, mismatch rejected, too-short rejected, no raw internals exposed) confirmed live with a temporary account.
- Cleanup: temp account deleted; `mailer_autoconfirm` restored to `false`.
- Status: **COMPLETE**

### STEP 2 — Event QR optional end-date bug
- Status: **NOT STARTED**

### STEP 3 — Feedback QR default-values/save bug
- Status: **NOT STARTED**

### STEP 4 — 2D Barcode / Location UX + internal doc leak
- Status: **NOT STARTED**

### STEP 5 — Database-level Dynamic QR quota enforcement
- Status: **NOT STARTED**

### STEP 6 — 35 PARTIAL audit items
- Queue: `docs/PARTIAL_REMEDIATION_QUEUE.md` (not yet created)
- Status: **NOT STARTED**

### FINAL STEP — Complete re-audit
- Status: **NOT STARTED**
