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

STEP 5 — Database-level Dynamic QR quota enforcement

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
- Audit item: E. QR type inventory — Event, FAIL, "cannot save with 'Ends' blank"
- Reproduced first on production before any code change: confirmed live via commit `ea64621`'s deployed code (Event → title + start only → Save → "Fix the content errors above before saving.").
- Root cause: `eventQrSchema`'s `end` field was `z.string().refine(isValidDate).optional()`. `EventForm` always submits a string for `end` (`asString(value.end)` defaults to `""`), never `undefined`, even when the field is left blank. Zod's `.optional()` only exempts `undefined` from the inner schema, so the date-format `refine` ran on `""` every time and always failed — `Date.parse("")` is `NaN`. The field was labeled "Optional" in the UI but was, in practice, always required.
- Fix: `end` is now a plain `z.string().trim().optional()` with no per-field refine. The date-format check moved into an object-level `.refine()` (alongside the pre-existing end-after-start check), both guarded by `!data.end` — true for both `undefined` and `""` — so a blank end is skipped, and a genuinely supplied end is still validated for format and ordering. `buildEventPayload` already treated `""` as falsy (`if (input.end)`), so no change was needed there.
- Focused tests: `tests/unit/qr/event.test.ts` — 7/7 pass (added: blank end via `""` accepted, whitespace-only end accepted, invalid non-blank end still rejected).
- Full suite: 638/638 pass.
- TypeScript: pass. ESLint: pass. Prettier: pass. Production build: pass. Secret scan: clean.
- Commit SHA: `8923143` — "Fix Event QR: blank optional end date always failed to save"
- Vercel deployment: `kog7vajl0` — READY, aliased to qrforge.space
- Production verification: blank end date saves successfully; reload shows the saved QR; edit reloads with Ends still blank; end-before-start is still correctly rejected; a valid supplied end date still saves; detail page healthy afterward. All confirmed live with a temporary account.
- Cleanup: temp account deleted; `mailer_autoconfirm` restored to `false`.
- Status: **COMPLETE**

### STEP 3 — Feedback QR default-values/save bug
- Audit item: E./J./K. Feedback QR — PARTIAL/FAIL, "cannot save without touching a field despite valid defaults"
- Reproduced first on production before any code change: confirmed via commit `ba115fb`'s prior deployed code (Feedback → Save immediately, no field touched → "Fix the content errors above before saving.").
- Root cause: `FeedbackForm`'s `defaultValues` (title "How was your experience?", both collect toggles) are already fully valid on their own, but `useEffect(() => watch((values) => onChange(values)), [watch, onChange])` only fires on a field-level change event — react-hook-form never calls the watch callback with its own initial `defaultValues` on mount. The parent's `content` state stayed whatever it was before this form ever rendered (`{}` for a fresh QR) until the user edited something, so an untouched Save submitted stale/empty content and failed server-side validation with a generic, non-specific error.
- Fix: `onChange(getValues())` is now called once on mount, in addition to the existing watch-driven updates for subsequent edits, so the parent always has content matching what's actually displayed. Scoped to Feedback only, per the explicit step boundary — the same `watch()`-without-mount-sync pattern exists in several other content forms (App, Social, Event, Text, Url, Video, Wifi, PhoneMessageFields per grep), but none of the others have a fully-valid all-default state the way Feedback does, so they don't currently exhibit the same user-facing failure; noted here for awareness, not fixed.
- Focused tests: `tests/unit/components/FeedbackForm.test.tsx` (new) — 4/4 pass (onChange fires valid content on mount, mounted defaults match what's displayed, edits still propagate, pre-existing `value` in edit mode isn't overwritten by defaults).
- Full suite: 642/642 pass.
- TypeScript: pass. ESLint: pass (0 errors, same pre-existing `watch()` library warning already present on 11 other files). Prettier: pass. Production build: pass. Secret scan: clean.
- Commit SHA: `ba115fb` — "Fix Feedback QR: saving with untouched (already-valid) defaults always failed"
- Vercel deployment: `qp19b1x2a` — READY, aliased to qrforge.space
- Production verification: untouched-defaults Feedback QR now saves immediately; public `/p/[slug]` page still opens with the default prompt; anonymous submission still reaches the database (confirmed via the owner's detail page showing "Feedback (1)"); editing a field before saving still works (no regression). All confirmed live with a temporary account.
- Cleanup: temp account deleted; `mailer_autoconfirm` restored to `false`.
- Status: **COMPLETE**

### STEP 4 — 2D Barcode / Location UX + internal doc leak
- Audit item: E. QR type inventory — 2D Barcode/Location, FAIL, "leaks internal doc reference"
- Product-state investigation (per explicit instruction not to invent semantics): checked `docs/ARCHITECTURE.md`, `QR_Code_Generator_Master_Build_Prompt.md`, `docs/WORKLOG.md`, `docs/SESSION_HANDOFF.md`, `docs/FINAL_REPORT.md`, and the registry. No product specification exists anywhere for either type — the master prompt itself only lists "2D Barcode / structured product data" and "Location" as bare menu items, with no symbology, data format, or field schema ever defined. Confirmed genuinely not-implemented, not merely hidden.
- Root cause: both `barcode_2d` (`staticSupport: true`) and `location` (`staticSupport: true, dynamicSupport: true`) passed `QRTypeSelector`'s filter as ordinary clickable options despite having no real content form. Selecting either rendered `QRContentPanel`'s generic fallback, whose description read "...its content form arrives with that module (see docs/ARCHITECTURE.md, QR Domain Model)" — a raw internal documentation path shown to real users.
- Fix: `QRTypeSelector` now renders any type without a real content form (`CONTENT_FORMS[key] == null` — the same check `/qr-types` already uses to sort into its own "Coming soon" section) as `disabled` with a "Coming soon" badge, consistent with the marketing page, and never calls `onTypeChange` for it. `QRContentPanel`'s fallback text was also cleaned up as defense-in-depth (generic "coming soon" wording, no file paths/module references), in case it's ever reached another way.
- Focused tests: `tests/unit/components/QRTypeSelector.test.tsx` (+2 new: disabled + badge + no-click for both static and dynamic mode) and `tests/unit/components/QRContentPanel.test.tsx` (new, 2 tests: real type still works, not-yet-implemented type shows no internal references) — 11/11 pass.
- Full suite: 646/646 pass.
- TypeScript: pass. ESLint: pass (0 errors). Prettier: pass. Production build: pass. Secret scan: clean.
- Commit SHA: `155c747` — "Mark 2D Barcode / Location as Coming soon in the generator, remove the internal doc leak"
- Vercel deployment: `gneb6f0uo` — READY, aliased to qrforge.space
- Production verification: both options render disabled with a "Coming soon" badge (desktop, anonymous flow, no account needed) in both static and dynamic mode; a forced click still cannot select either or reach any internal reference; the marketing page (`/qr-types`) stays consistent; a real implemented type (URL) is unaffected. All 8 checks confirmed live.
- Cleanup: no temporary account was needed (anonymous `/qr-generator` flow).
- Status: **COMPLETE**

### STEP 5 — Database-level Dynamic QR quota enforcement
- Status: **NOT STARTED**

### STEP 6 — 35 PARTIAL audit items
- Queue: `docs/PARTIAL_REMEDIATION_QUEUE.md` (not yet created)
- Status: **NOT STARTED**

### FINAL STEP — Complete re-audit
- Status: **NOT STARTED**
