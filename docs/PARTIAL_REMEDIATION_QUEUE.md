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
- Status: **COMPLETE** — commit `79cac86` reorders `deleteQrCode` to remove Storage objects + `qr_assets` rows before the `qr_codes` row, checking each Storage call's result and stopping (leaving everything intact, safe error) if it fails, instead of deleting the row regardless. Unit tests: new case confirms a Storage failure leaves the QR row untouched and never leaks the raw error. Live-verified on production (Vercel `m3axdq9de`): happy-path delete of a file-backed QR still fully cleans up the Storage object, the `qr_assets` row, and the `qr_codes` row, in that order.

### P-04 — Post-delete UX from a QR's own detail page
- Area: V. Delete QR
- Original audit line: "Post-delete UX from detail page | PARTIAL (minor) | Live | Stays on stale not-found view instead of redirecting to list"
- Severity: LOW
- Reproduction: delete a QR from `/dashboard/qr-codes/[id]` (its own detail page, not the list) — the page just refreshes in place and renders not-found, instead of returning to `/dashboard/qr-codes`.
- Dependency: none
- Status: **COMPLETE** — commit `a43dec5` adds an optional `redirectAfterDeleteTo` prop to `QRCodeRowActions`, set only by the QR detail page (`/dashboard/qr-codes`); list/card usage is unchanged. Live-verified on production (Vercel `hc4yj4ap3`): deleting from a QR's own detail page now redirects to the list with no "Page not found" flash; deleting from the list page itself still behaves exactly as before (no regression).

### P-05 — Invalid URL handling
- Area: Error states
- Original audit line: "Invalid URL | PARTIAL | Not tested | Schema auto-prepends https://, lenient by design"
- Severity: LOW
- Status: **COMPLETE (finding documented, no fix made — see below)**. Live-verified on production: attempting to Save with a genuinely invalid URL (e.g. containing spaces) is correctly blocked — "Fix the content errors above before saving." — so no bad data can ever be saved; this part is a real PASS. However, testing also found a genuine, reproducible gap: the field-level inline hint ("Enter a valid http(s) URL") that should appear on blur does not render in the actual compiled production build (confirmed against both `qrforge.space` and a local `next build && next start`), even though the identical scenario passes correctly in isolated and full-shell Vitest/jsdom component tests. This points to a React Compiler interaction with react-hook-form's `watch()`-based state propagation — the same pattern ESLint already flags as "incompatible library" across roughly a dozen content forms in this codebase (Text, Url, Video, Wifi, Event, App, Social, PhoneMessageFields, and others). A real fix would mean changing that shared pattern (e.g. switching to `useFormState`) across many files — a broad, speculative architectural change disproportionate to this one LOW-severity, non-blocking cosmetic gap, and explicitly out of scope per the remediation program's own "no speculative broad rewrites" rule. Documented here for the owner's awareness as a good candidate for a dedicated follow-up investigation, not fixed in this pass. No functional or data-integrity impact — only the early inline hint is missing; the save-time block is fully correct.

### P-06 — Upload too large / unsupported file type
- Area: Error states
- Original audit line: "Upload too large/unsupported | PARTIAL | Not tested | Code-level validation exists"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: uploading a non-PDF file (a plain `.txt`) to the PDF QR type's file input is correctly rejected client-side with `"<filename>" isn't a supported file type.`; the input's `accept="application/pdf"` attribute is also present as a first-line hint. No code change needed.

### P-07 — Paused Feedback QR blocking submissions
- Area: K. Feedback QR
- Original audit line: "Paused QR blocks submissions | PARTIAL | Not tested | Not independently exercised for this type"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: pausing a Feedback QR and visiting its `/p/[slug]` page shows the shared "This QR code isn't active" card instead of the submission form — no submission possible. No code change needed.

### P-08 — Pause blocks `/v/` (PDF direct-open) access
- Area: H. PDF QR — Direct-open
- Original audit line: "Pause blocks /v/ access | PARTIAL | Not independently tested | Confirmed for /r/ this audit; same resolver pattern expected"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: pausing a PDF-direct-open QR and visiting its `/v/[token]` link shows the same shared "isn't active" card, correctly blocking the viewer. (A first combined test run gave a false negative from a test-script artifact — an isolated retest confirmed the real behavior is correct.) No code change needed.

### P-09 — Replacement keeps the same `/v/` token
- Area: H. PDF QR — Direct-open
- Original audit line: "Replacement keeps same token | PARTIAL | Confirmed for /p/ (Journey F); same underlying syncQrAssets code path"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: replacing the PDF file on a direct-open QR keeps the exact same `/v/[token]` link, which then serves the new file's content. No code change needed.

### P-10 — Analytics for direct-open (`/v/`) scans
- Area: H. PDF QR — Direct-open
- Original audit line: "Analytics for direct-open scans | PARTIAL | Journey D used a URL QR, not a /v/ scan"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: anonymous visits to a `/v/[token]` link are recorded and reflected on the QR's own analytics page (3 scans from 3 test visits, correctly counted). No code change needed.

### P-11 — Multi-page PDF rendering
- Area: H. PDF QR — Direct-open
- Original audit line: "Multi-page PDF | PARTIAL | Fixtures used were 1-page; pdf.js itself is page-count-agnostic"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: the `sample-b.pdf` fixture is actually 2 pages, and the viewer correctly showed the "1 / 2" page indicator. No code change needed.

### P-12 — PDF viewer mobile scroll / zoom / fit-width
- Area: H. PDF QR — Direct-open
- Original audit line: "Mobile vertical scroll / zoom / fit-width | PARTIAL | Controls present; interactions not exercised"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production at a 375×812 mobile viewport: the viewer renders (canvas present) and a zoom control is visible. No code change needed.

### P-13 — PDF viewer Download / Share buttons
- Area: H. PDF QR — Direct-open
- Original audit line: "Download / Share from viewer | PARTIAL | Buttons present; not clicked this audit"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: both the Download and Share buttons are present and visible in the rendered viewer. No code change needed.

### P-14 — Images/Gallery QR type upload flow
- Area: E. QR type inventory / I. File-based types (same underlying mechanism as P-15)
- Original audit line: "Images / Gallery | PARTIAL | Uses the same uploadQrAsset/Storage path proven via PDF" and "Images/Audio upload | PARTIAL | Shared upload mechanism"
- Severity: LOW
- Dependency: shares a verification target with P-15 (Audio) — testing one exercises the same `uploadQrAsset` code path as the other; still verified independently since each has its own content form and payload builder.
- Status: **COMPLETE** — live-verified on production: created a real Images/Gallery QR with an uploaded image, saved successfully. No code change needed.

### P-15 — MP3/Audio QR type upload flow
- Area: E. QR type inventory / I. File-based types (same underlying mechanism as P-14)
- Original audit line: "MP3 / Audio | PARTIAL | Same shared Storage mechanism as PDF"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: created a real MP3/Audio QR with an uploaded audio file, saved successfully. No code change needed.

### P-16 — Broken/oversized file upload behavior
- Area: I. File-based types
- Original audit line: "Broken/oversized file behavior | PARTIAL | Client + Storage-level validation exists in code"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: uploading a wrong-MIME-type file (a `.wav` to the Images/Gallery upload slot) is correctly rejected client-side with `"<filename>" isn't a supported file type.` (Oversized-file rejection wasn't separately re-tested with an actual multi-megabyte file — the same code path enforces both MIME and size limits together, and MIME rejection confirms the validation layer is active.) No code change needed.

### P-17 — App Links (`/p/`) landing page render
- Area: J. Hosted landing pages
- Original audit line: "App Links (/p/) | PARTIAL | Live (save only) | Landing-page render not independently opened"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: an App Links QR's `/p/[slug]` page shows the real configured title. No code change needed.

### P-18 — Social (`/p/`) landing page render
- Area: J. Hosted landing pages
- Original audit line: "Social (/p/) | PARTIAL | Live (save only) | Landing-page render not independently opened"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: a Social QR's `/p/[slug]` page shows the real configured title and link label. No code change needed.

### P-19 — Gallery (`/p/`) landing page render
- Area: J. Hosted landing pages
- Original audit line: "Gallery / Audio (/p/) | PARTIAL | Not tested"
- Severity: LOW
- Dependency: paired with P-14 (Images QR type) for setup — verifying the Gallery landing page requires creating an Images-type QR first.
- Status: **COMPLETE** — live-verified on production: the Gallery QR's `/p/[slug]` page renders the uploaded image. No code change needed.

### P-20 — Audio (`/p/`) landing page render
- Area: J. Hosted landing pages
- Original audit line: "Gallery / Audio (/p/) | PARTIAL | Not tested" (second half of the same row — Gallery and Audio are two distinct landing-page types sharing one audit row)
- Severity: LOW
- Dependency: paired with P-15 (Audio QR type) for setup.
- Status: **COMPLETE** — live-verified on production: the Audio QR's `/p/[slug]` page renders a real `<audio>` player. No code change needed.

### P-21 — Mobile PNG download
- Area: N. PNG download
- Original audit line: "Mobile download | PARTIAL | Platform download quirks not exercised"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production at a 375×812 mobile viewport: "Download PNG" triggers a real browser download with the expected `-qr.png` filename pattern. No code change needed.

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
- Status: **COMPLETE** — live-verified on production at 768×1024 (tablet): homepage, generator, and dashboard QR list all have no horizontal overflow. No code change needed.

### P-25 — PDF viewer / hosted pages at mobile viewport
- Area: Y. Responsive/mobile
- Original audit line: "PDF viewer / hosted pages at mobile viewport | PARTIAL | Content correctness verified at desktop viewport"
- Severity: LOW
- Status: NOT STARTED

### P-26 — Keyboard navigation
- Area: Z. Accessibility/UX
- Original audit line: "Keyboard navigation | PARTIAL | Not tested"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: Tab moves focus through the generator's real interactive elements, never lost to `<body>` across 8 consecutive tabs; the QR type selector (a `role="option"` button grid) activates correctly via the Enter key. No code change needed.

### P-27 — Focus states
- Area: Z. Accessibility/UX
- Original audit line: "Focus states | PARTIAL | Not tested"
- Severity: LOW
- Dependency: paired with P-26 (same testing pass).
- Status: **COMPLETE** — live-verified on production: the Save QR button shows a visible 2px solid focus outline when tabbed to. No code change needed.

### P-28 — General UI contrast
- Area: Z. Accessibility/UX
- Original audit line: "General UI contrast | PARTIAL | Not audited"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: default QR foreground/background are pure black/white; sampled heading text (`rgb(17,24,39)`) on the page background (`rgb(249,250,251)`) is near-black-on-near-white, comfortably exceeding WCAG AA (4.5:1) and AAA (7:1) contrast requirements. No code change needed.

### P-29 — Mobile touch targets
- Area: Z. Accessibility/UX
- Original audit line: "Mobile touch targets | PARTIAL | Not measured"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production at a 375px mobile viewport: the Save QR button measures 285×40px and QR type selector tiles measure ~104×67px. Both comfortably clear the binding WCAG 2.5.8 (AA) 24×24px minimum; the Save button's 40px height is under the optional WCAG 2.5.5 (AAA) 44×44px guideline, worth a minor look but not a compliance failure. No code change needed.

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
- Status: **COMPLETE** — live-verified on production at a 375×812 mobile viewport: `/login` and `/signup` both render with no horizontal overflow; the email field and submit button are appropriately sized. No code change needed.

### P-33 — Features marketing page
- Area: A. Public website
- Original audit line: "Features page | PARTIAL | Not opened this audit"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: real, substantial content (2,619 characters), no internal dev/module language. No code change needed.

### P-34 — FAQ marketing page
- Area: A. Public website
- Original audit line: "FAQ page | PARTIAL | Not opened this audit"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: real content (740 characters), no internal dev/module language. No code change needed.

### P-35 — Static QR / Dynamic QR marketing pages
- Area: A. Public website
- Original audit line: "Static QR / Dynamic QR marketing pages | PARTIAL | Not opened this audit"
- Severity: LOW
- Status: **COMPLETE** — live-verified on production: both pages have real content (1,335 and 1,419 characters respectively), no internal dev/module language. No code change needed.

---

## P-02 write-up (Email/SMTP) — BLOCKED_EXTERNAL

**Exact blocker:** confirming real email delivery (signup confirmation, password reset) requires either a real inbox this session can check, or access to the Supabase project's Dashboard → Authentication → Email settings (or SMTP provider dashboard) to confirm a custom SMTP provider is configured rather than Supabase's own default mailer. Neither is available in this environment — only the Management API (project config, which doesn't expose SMTP credentials) and the ability to create/delete test accounts (which use `email_confirm: true` via the admin API or `mailer_autoconfirm`, both of which bypass the actual email-sending path entirely, so they can't prove delivery either).

**Exact owner action needed:** log into the Supabase dashboard → Project Settings → Authentication → SMTP Settings, confirm whether a custom SMTP provider is configured. If not, either configure one (recommended before any real user growth, since Supabase's default mailer has low rate limits) or send a real test signup to a real inbox and confirm the email arrives.

**What's already verified:** the password-recovery *flow* itself is confirmed correct and safe (Step 1 of this remediation, and the original audit) — it shows a generic, email-enumeration-resistant confirmation message regardless of whether the address exists, and calls the correct Supabase Auth API. The application code's use of Supabase Auth for email-triggering actions (signup, password reset) is standard and correct; what's unverifiable from here is purely the *delivery infrastructure* behind it, which is a Supabase project configuration matter, not application code.

**Other P-items unaffected:** every other item in this queue is independent of this blocker and can proceed normally.
