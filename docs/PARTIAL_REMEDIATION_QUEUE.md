# PARTIAL Remediation Queue

Frozen from `docs/PRODUCTION_FEATURE_AUDIT.md` (2026-08-20 baseline) at the start of Step 6, so this list stays stable regardless of later edits to the audit report itself. All 35 original PARTIAL rows, given permanent IDs P-01 through P-35, ordered per the task's priority rule (HIGH severity/security/core workflow first, then MEDIUM, then LOW/UX/polish), with technical-dependency reordering noted inline where it applies.

Allowed status: `NOT STARTED`, `IN PROGRESS`, `COMPLETE`, `BLOCKED_EXTERNAL`, `RESOLVED_BY_PRIOR_STEP`.

---

### P-01 — Feedback QR (save step)
- Area: E. QR type inventory
- Original audit line: "Feedback | PARTIAL | Live | Landing page + anonymous submission fully PASS; save step has a confirmed bug"
- Severity: HIGH
- Reproduction: create a Feedback QR without touching any field, click Save — was rejected with a generic error.
- Dependency: none
- Status: **RESOLVED_BY_PRIOR_STEP** — fixed and production-verified in Step 3 (commit `ba115fb`). No further action.

### P-02 — Email/SMTP delivery
- Area: Email/SMTP
- Original audit line: "Delivery / SMTP configuration | PARTIAL | Recovery flow verified live; actual delivery not verifiable this audit"
- Severity: HIGH
- Reproduction: cannot confirm whether a real signup-confirmation or password-reset email actually lands in an inbox, or whether custom SMTP is configured vs. Supabase's own default (rate-limited) mailer — this session has no access to a real inbox or the Supabase dashboard's SMTP settings UI.
- Dependency: none
- Status: **BLOCKED_EXTERNAL** — see write-up below.

### P-03 — Orphan Storage objects on a partial delete failure
- Area: I. File-based types
- Original audit line: "Orphan Storage objects (failure path) | PARTIAL (gap) | Code | No DB-level cascade/transaction guarantee"
- Severity: MEDIUM
- Reproduction: code-level gap — `deleteQrCode` fetches asset rows, deletes the `qr_codes` row, then removes Storage objects, then deletes `qr_assets` rows, as separate sequential steps with no transactional guarantee; a failure between steps could orphan a file. Confirmed clean on the happy path (Step 5 era testing and the original audit both), no live defect reproduced — this is a defense-in-depth gap, not an observed failure.
- Dependency: none
- Status: NOT STARTED

### P-04 — Post-delete UX from a QR's own detail page
- Area: V. Delete QR
- Original audit line: "Post-delete UX from detail page | PARTIAL (minor) | Live | Stays on stale not-found view instead of redirecting to list"
- Severity: LOW
- Reproduction: delete a QR from `/dashboard/qr-codes/[id]` (its own detail page, not the list) — the page just refreshes in place and renders not-found, instead of returning to `/dashboard/qr-codes`.
- Dependency: none
- Status: NOT STARTED

### P-05 — Invalid URL handling
- Area: Error states
- Original audit line: "Invalid URL | PARTIAL | Not tested | Schema auto-prepends https://, lenient by design"
- Severity: LOW
- Status: NOT STARTED

### P-06 — Upload too large / unsupported file type
- Area: Error states
- Original audit line: "Upload too large/unsupported | PARTIAL | Not tested | Code-level validation exists"
- Severity: LOW
- Status: NOT STARTED

### P-07 — Paused Feedback QR blocking submissions
- Area: K. Feedback QR
- Original audit line: "Paused QR blocks submissions | PARTIAL | Not tested | Not independently exercised for this type"
- Severity: LOW
- Status: NOT STARTED

### P-08 — Pause blocks `/v/` (PDF direct-open) access
- Area: H. PDF QR — Direct-open
- Original audit line: "Pause blocks /v/ access | PARTIAL | Not independently tested | Confirmed for /r/ this audit; same resolver pattern expected"
- Severity: LOW
- Status: NOT STARTED

### P-09 — Replacement keeps the same `/v/` token
- Area: H. PDF QR — Direct-open
- Original audit line: "Replacement keeps same token | PARTIAL | Confirmed for /p/ (Journey F); same underlying syncQrAssets code path"
- Severity: LOW
- Status: NOT STARTED

### P-10 — Analytics for direct-open (`/v/`) scans
- Area: H. PDF QR — Direct-open
- Original audit line: "Analytics for direct-open scans | PARTIAL | Journey D used a URL QR, not a /v/ scan"
- Severity: LOW
- Status: NOT STARTED

### P-11 — Multi-page PDF rendering
- Area: H. PDF QR — Direct-open
- Original audit line: "Multi-page PDF | PARTIAL | Fixtures used were 1-page; pdf.js itself is page-count-agnostic"
- Severity: LOW
- Status: NOT STARTED

### P-12 — PDF viewer mobile scroll / zoom / fit-width
- Area: H. PDF QR — Direct-open
- Original audit line: "Mobile vertical scroll / zoom / fit-width | PARTIAL | Controls present; interactions not exercised"
- Severity: LOW
- Status: NOT STARTED

### P-13 — PDF viewer Download / Share buttons
- Area: H. PDF QR — Direct-open
- Original audit line: "Download / Share from viewer | PARTIAL | Buttons present; not clicked this audit"
- Severity: LOW
- Status: NOT STARTED

### P-14 — Images/Gallery QR type upload flow
- Area: E. QR type inventory / I. File-based types (same underlying mechanism as P-15)
- Original audit line: "Images / Gallery | PARTIAL | Uses the same uploadQrAsset/Storage path proven via PDF" and "Images/Audio upload | PARTIAL | Shared upload mechanism"
- Severity: LOW
- Dependency: shares a verification target with P-15 (Audio) — testing one exercises the same `uploadQrAsset` code path as the other; still verified independently since each has its own content form and payload builder.
- Status: NOT STARTED

### P-15 — MP3/Audio QR type upload flow
- Area: E. QR type inventory / I. File-based types (same underlying mechanism as P-14)
- Original audit line: "MP3 / Audio | PARTIAL | Same shared Storage mechanism as PDF"
- Severity: LOW
- Status: NOT STARTED

### P-16 — Broken/oversized file upload behavior
- Area: I. File-based types
- Original audit line: "Broken/oversized file behavior | PARTIAL | Client + Storage-level validation exists in code"
- Severity: LOW
- Status: NOT STARTED

### P-17 — App Links (`/p/`) landing page render
- Area: J. Hosted landing pages
- Original audit line: "App Links (/p/) | PARTIAL | Live (save only) | Landing-page render not independently opened"
- Severity: LOW
- Status: NOT STARTED

### P-18 — Social (`/p/`) landing page render
- Area: J. Hosted landing pages
- Original audit line: "Social (/p/) | PARTIAL | Live (save only) | Landing-page render not independently opened"
- Severity: LOW
- Status: NOT STARTED

### P-19 — Gallery (`/p/`) landing page render
- Area: J. Hosted landing pages
- Original audit line: "Gallery / Audio (/p/) | PARTIAL | Not tested"
- Severity: LOW
- Dependency: paired with P-14 (Images QR type) for setup — verifying the Gallery landing page requires creating an Images-type QR first.
- Status: NOT STARTED

### P-20 — Audio (`/p/`) landing page render
- Area: J. Hosted landing pages
- Original audit line: "Gallery / Audio (/p/) | PARTIAL | Not tested" (second half of the same row — Gallery and Audio are two distinct landing-page types sharing one audit row)
- Severity: LOW
- Dependency: paired with P-15 (Audio QR type) for setup.
- Status: NOT STARTED

### P-21 — Mobile PNG download
- Area: N. PNG download
- Original audit line: "Mobile download | PARTIAL | Platform download quirks not exercised"
- Severity: LOW
- Status: NOT STARTED

### P-22 — Analytics device/browser/OS/country breakdown
- Area: W. Analytics
- Original audit line: "Device/browser/OS/country breakdown | PARTIAL | Existing user-agent.test.ts per inventory"
- Severity: LOW
- Status: NOT STARTED

### P-23 — PDF.js range requests not inflating scan counts
- Area: W. Analytics
- Original audit line: "PDF.js range requests not inflating counts | PARTIAL | scan-tracking.test.ts exists per inventory"
- Severity: LOW
- Status: NOT STARTED

### P-24 — Tablet viewport responsiveness
- Area: Y. Responsive/mobile
- Original audit line: "Tablet-ish viewport | PARTIAL | Only desktop + one mobile size covered"
- Severity: LOW
- Status: NOT STARTED

### P-25 — PDF viewer / hosted pages at mobile viewport
- Area: Y. Responsive/mobile
- Original audit line: "PDF viewer / hosted pages at mobile viewport | PARTIAL | Content correctness verified at desktop viewport"
- Severity: LOW
- Status: NOT STARTED

### P-26 — Keyboard navigation
- Area: Z. Accessibility/UX
- Original audit line: "Keyboard navigation | PARTIAL | Not tested"
- Severity: LOW
- Status: NOT STARTED

### P-27 — Focus states
- Area: Z. Accessibility/UX
- Original audit line: "Focus states | PARTIAL | Not tested"
- Severity: LOW
- Dependency: paired with P-26 (same testing pass).
- Status: NOT STARTED

### P-28 — General UI contrast
- Area: Z. Accessibility/UX
- Original audit line: "General UI contrast | PARTIAL | Not audited"
- Severity: LOW
- Status: NOT STARTED

### P-29 — Mobile touch targets
- Area: Z. Accessibility/UX
- Original audit line: "Mobile touch targets | PARTIAL | Not measured"
- Severity: LOW
- Status: NOT STARTED

### P-30 — Reset-password page (post-email-link)
- Area: A. Public website
- Original audit line: "Reset-password page (post-email-link) | PARTIAL | No email inbox access to click a real reset link"
- Severity: LOW
- Dependency: same underlying constraint as P-02 (no real inbox access) for the "click a real emailed link" part specifically, but the page's *own* rendering/validation can still be tested by visiting it directly with a manufactured Supabase recovery session.
- Status: NOT STARTED

### P-31 — Recovery callback (`/auth/callback`)
- Area: B. Authentication
- Original audit line: "Recovery callback | PARTIAL | Code only | safeNext() guard confirmed in code; not clicked from a real email link"
- Severity: LOW
- Status: NOT STARTED

### P-32 — Mobile auth UX (login/signup forms)
- Area: B. Authentication
- Original audit line: "Mobile auth UX | PARTIAL | Live (dashboard pages only) | Login/signup forms not independently re-opened at mobile viewport"
- Severity: LOW
- Status: NOT STARTED

### P-33 — Features marketing page
- Area: A. Public website
- Original audit line: "Features page | PARTIAL | Not opened this audit"
- Severity: LOW
- Status: NOT STARTED

### P-34 — FAQ marketing page
- Area: A. Public website
- Original audit line: "FAQ page | PARTIAL | Not opened this audit"
- Severity: LOW
- Status: NOT STARTED

### P-35 — Static QR / Dynamic QR marketing pages
- Area: A. Public website
- Original audit line: "Static QR / Dynamic QR marketing pages | PARTIAL | Not opened this audit"
- Severity: LOW
- Status: NOT STARTED

---

## P-02 write-up (Email/SMTP) — BLOCKED_EXTERNAL

**Exact blocker:** confirming real email delivery (signup confirmation, password reset) requires either a real inbox this session can check, or access to the Supabase project's Dashboard → Authentication → Email settings (or SMTP provider dashboard) to confirm a custom SMTP provider is configured rather than Supabase's own default mailer. Neither is available in this environment — only the Management API (project config, which doesn't expose SMTP credentials) and the ability to create/delete test accounts (which use `email_confirm: true` via the admin API or `mailer_autoconfirm`, both of which bypass the actual email-sending path entirely, so they can't prove delivery either).

**Exact owner action needed:** log into the Supabase dashboard → Project Settings → Authentication → SMTP Settings, confirm whether a custom SMTP provider is configured. If not, either configure one (recommended before any real user growth, since Supabase's default mailer has low rate limits) or send a real test signup to a real inbox and confirm the email arrives.

**What's already verified:** the password-recovery *flow* itself is confirmed correct and safe (Step 1 of this remediation, and the original audit) — it shows a generic, email-enumeration-resistant confirmation message regardless of whether the address exists, and calls the correct Supabase Auth API. The application code's use of Supabase Auth for email-triggering actions (signup, password reset) is standard and correct; what's unverifiable from here is purely the *delivery infrastructure* behind it, which is a Supabase project configuration matter, not application code.

**Other P-items unaffected:** every other item in this queue is independent of this blocker and can proceed normally.
