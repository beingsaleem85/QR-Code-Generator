# Master Build Prompt — QR Code Generator Web Platform

> **Reference product:** QR.io  
> **Backend:** Supabase  
> **Build order:** Structure → UI → Features  
> **Working method:** Complete, verify, document, and stabilize one module before starting the next module.

---

## 0. ROLE AND PRIMARY OBJECTIVE

You are the senior product architect, UI/UX engineer, full-stack developer, database engineer, QA engineer, and security reviewer responsible for building a production-ready QR Code Generator web application.

The product should take functional and UX inspiration from **QR.io**, especially its QR creation flow, QR type selection, design/customization controls, preview experience, account/dashboard model, dynamic QR concept, and analytics. However:

- **Do not clone QR.io pixel-for-pixel.**
- Do not copy its logo, brand name, proprietary graphics, marketing copy, icons, illustrations, or other protected assets.
- Build an original visual identity and original component implementation.
- Treat QR.io as a **functional/UI reference**, not a source-code or branding template.
- The final product should feel modern, clean, fast, trustworthy, responsive, and easier to use than the reference.

The backend must use **Supabase**.

The project owner will create the Supabase project and provide the necessary credentials/tokens **only when integration reaches the point where they are actually required**.

Do not request Supabase credentials at the beginning of the project.

---

# 1. NON-NEGOTIABLE EXECUTION RULES

## 1.1 Strict Phase Order

You must build the project in exactly this order:

1. **STRUCTURE**
2. **UI**
3. **FEATURES**

Do not start UI work until the Structure phase is complete and verified.

Do not start functional feature implementation until the UI phase is complete and verified.

Within each phase, follow the module order defined in this prompt.

---

## 1.2 Module Completion Gate

For every module:

1. Read the complete module requirements.
2. Implement only that module and any small dependency strictly necessary for it.
3. Run all relevant checks.
4. Fix errors, warnings, broken routes, TypeScript errors, lint issues, and obvious regressions.
5. Update project documentation.
6. Produce a short module completion report containing:
   - What was implemented
   - Files/folders created or changed
   - Tests/checks executed
   - Any known limitation
   - Whether the module passed its acceptance checklist
7. Only after the module passes may you start the next module.

Never mark a module complete merely because files exist.

A module is complete only when the relevant acceptance criteria pass.

---

## 1.3 Autonomous Work Rule

Work autonomously through the modules.

Do not stop after every trivial step to ask the user what to do next.

Pause only when you genuinely require something that cannot safely be inferred or created locally, such as:

- Supabase project credentials
- A production domain
- Third-party billing credentials if payment functionality is later authorized
- A destructive or irreversible production action
- A business decision that materially changes scope

If a blocked item is not required for other work, document it and continue with all non-blocked work.

---

## 1.4 Credential and Secret Safety

Create an `.env.example` early, but never place real secrets inside source control.

Expected Supabase variables may include:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
```

Rules:

- `NEXT_PUBLIC_*` variables may be exposed to the browser only when appropriate.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.
- A Supabase personal access token must never be exposed to browser code.
- Never hard-code secrets.
- Never print full secrets into logs.
- Never commit `.env.local`, `.env`, service keys, or access tokens.
- Use server-side authorization for privileged operations.

The project owner may provide either:

- Supabase Project URL + anon/publishable key for normal app integration,
- service-role key where privileged server operations require it,
- and/or Supabase CLI/personal access token when project linking or management commands require it.

Ask only for the minimum credential required at the moment it becomes necessary.

---

# 2. PRODUCT VISION

Build a complete web platform that lets users:

- Generate static QR codes quickly
- Create dynamic QR codes whose destination can later be changed
- Customize QR code appearance
- Add frames, colors, gradients, shapes, and logos
- Preview the QR code live
- Download QR codes
- Save generated QR codes to an account
- Organize and manage QR codes from a dashboard
- Edit supported QR codes
- Track dynamic QR scans
- View scan analytics
- Upload files for file-based QR experiences
- Build lightweight mobile landing pages for supported dynamic QR types
- Manage profile/account settings

The public generator must be simple enough for a first-time user but the dashboard must be powerful enough for business users.

---

# 3. REFERENCE UX — QR.IO PATTERNS TO INCORPORATE

Use the following **reference patterns** in an original implementation.

## 3.1 Primary QR Builder Pattern

The central generator should follow a clear multi-step mental model:

### Step 1 — Content

User chooses a QR type and enters the required information.

### Step 2 — Design

User customizes the QR appearance.

### Step 3 — Preview / Generate / Download

User sees the final QR preview and can generate/save/download it.

On desktop, a superior implementation may use:

- Left/main column: content and design controls
- Right sticky column: live QR preview and primary action

On smaller screens:

- Controls stack vertically
- Preview remains easy to access
- Primary Generate/Download action remains visible without creating confusing horizontal scrolling

---

## 3.2 QR Type Selector

The QR type selector should be highly visible and icon-based.

Initial supported type categories should be designed around:

- URL / Link
- Text
- Email
- Phone Call
- SMS
- vCard / Contact
- WhatsApp
- Wi-Fi
- PDF
- App Store / Play Store
- Images / Gallery
- Video
- Social Media
- Event
- 2D Barcode / structured product data

Additional product-enhancing types may include:

- Multiple Links / Link-in-bio
- Menu
- Feedback
- MP3 / Audio
- Location
- Coupon
- Business Page

Do not implement all advanced types at once unless their module explicitly calls for them.

---

## 3.3 Design Controls

The UI must support a structured design panel inspired by modern QR builders:

### Frame

- Frame style/template
- Optional CTA phrase such as “Scan Me”
- CTA text
- CTA font
- Frame color

### QR Shape & Color

- Pattern/dot style
- Foreground color
- Background color
- Transparent background option
- Gradient option
- Gradient second color
- Linear/radial gradient mode where technically supported

### Eye / Finder Pattern

Treat outer finder square and center finder dot as separate design concepts where supported by the chosen QR rendering library.

Allow:

- Corner square style
- Corner square color
- Corner dot style
- Corner dot color

### Logo

- Upload a custom logo
- Preview logo inside QR
- Remove logo
- Safe logo sizing
- Optional white margin/background behind logo
- Preserve scan reliability

Every appearance option must prioritize QR readability over decoration.

---

## 3.4 Preview Behavior

The preview should:

- Update quickly when content or styling changes
- Have an intentional debounce if generation is expensive
- Clearly show empty/default state
- Warn when required content is missing
- Warn if a design choice may reduce scannability
- Never claim a QR is valid if it could not be encoded
- Support reset-to-default design

---

## 3.5 Public Marketing Website

The public website should include:

- Header/navigation
- QR generator hero or immediately visible generator entry point
- Static vs Dynamic QR explanation
- Benefits/features section
- Supported QR types section
- Simple “How it works” section
- Use-case section
- FAQ
- CTA
- Footer

Do not copy reference-site wording.

Write original concise copy.

---

# 4. RECOMMENDED TECHNICAL STACK

Unless the existing repository already dictates otherwise, use:

## Frontend

- Next.js using the latest stable App Router architecture
- TypeScript with strict mode
- React
- Tailwind CSS
- Accessible reusable component primitives
- shadcn/ui or an equivalent maintainable component layer where useful
- Lucide or another consistent open-source icon set
- React Hook Form where complex forms benefit from it
- Zod for validation

## Backend

- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- Supabase server/client SDKs
- Supabase database functions/RPC only where they provide a clear benefit

## QR Rendering

Use a reputable maintained QR generation/styling library capable of producing standards-compliant QR codes.

Preferred architecture:

- A QR encoding abstraction/domain layer
- A renderer adapter
- A download/export adapter

Avoid coupling business logic directly to one library throughout the codebase.

## Quality

- ESLint
- TypeScript validation
- Unit tests for core QR payload builders
- Integration tests for important Supabase data access
- End-to-end tests for major user journeys where practical

Do not lock the project to obsolete package versions.

---

# 5. PROJECT ENGINEERING PRINCIPLES

Follow these principles throughout all phases:

- Mobile-first responsive behavior
- Accessibility-first forms and controls
- Clear loading, success, error, and empty states
- Server-side permission validation
- Least-privilege access
- Reusable components
- Reusable domain models
- No giant page components containing all logic
- No duplicated QR payload-building code
- No duplicated Supabase clients
- No arbitrary `any` TypeScript usage
- No silent error swallowing
- Do not expose private storage assets unintentionally
- QR generation must remain usable even if analytics services fail
- Static QR creation should not depend on dynamic redirect infrastructure
- Dynamic redirect infrastructure must not interfere with static codes
- Keep business logic testable outside React components

---

# PHASE 1 — STRUCTURE

> **Critical rule:** During this phase, focus on architecture, routes, schema, core abstractions, component skeletons, and data contracts.  
> Do **not** spend time polishing final visual styling.  
> Do **not** implement the complete feature set.

---

# MODULE 1.1 — Repository and Application Foundation

## Objective

Create a clean production-oriented project foundation.

## Tasks

1. Initialize or inspect the repository.
2. Configure:
   - Next.js
   - TypeScript strict mode
   - Tailwind
   - linting
   - formatting if useful
   - path aliases
3. Establish environment configuration.
4. Add `.env.example`.
5. Add `.gitignore` rules for secrets and build artifacts.
6. Create application-level error handling conventions.
7. Establish folder naming conventions.
8. Add a basic health/build verification path if appropriate.
9. Create project documentation files:
   - `README.md`
   - `docs/ARCHITECTURE.md`
   - `docs/WORKLOG.md`
   - `docs/SESSION_HANDOFF.md`

## Suggested Directory Architecture

```text
src/
  app/
    (marketing)/
    (auth)/
    (dashboard)/
    api/
    r/
  components/
    ui/
    layout/
    marketing/
    qr/
    dashboard/
    analytics/
  features/
    auth/
    qr-builder/
    qr-management/
    analytics/
    landing-pages/
    account/
  lib/
    supabase/
    qr/
    validation/
    utils/
  server/
    actions/
    repositories/
    services/
  types/
  config/
supabase/
  migrations/
  seed.sql
docs/
tests/
```

Adjust intelligently if the framework creates a better equivalent structure.

## Acceptance Criteria

- App starts successfully
- TypeScript check passes
- Lint passes
- No real credentials in repository
- Folder architecture documented
- Core directories have clear responsibility
- No feature logic is unnecessarily implemented yet

### Gate

Do not start Module 1.2 until this module passes.

---

# MODULE 1.2 — Route and Information Architecture

## Objective

Define all important product routes before UI polish.

## Public Routes

Plan routes similar to:

```text
/
 /qr-generator
 /qr-types
 /static-qr
 /dynamic-qr
 /features
 /pricing            # placeholder/future-ready if monetization is not yet in scope
 /faq
 /login
 /signup
 /forgot-password
```

## Authenticated Routes

```text
/dashboard
/dashboard/qr-codes
/dashboard/qr-codes/new
/dashboard/qr-codes/[id]
/dashboard/qr-codes/[id]/edit
/dashboard/qr-codes/[id]/analytics
/dashboard/files
/dashboard/account
/dashboard/settings
```

## Public Dynamic Redirect Route

Use a short redirect pattern such as:

```text
/r/[slug]
```

This route will later:

1. Validate the dynamic QR identifier
2. Resolve the active destination
3. Record a scan event safely
4. Redirect rapidly

Do not build full analytics in this module; define the contract and route skeleton.

## Landing Page Route

For QR types using hosted mini-pages, plan a route such as:

```text
/p/[slug]
```

or an equivalent clean route.

## Acceptance Criteria

- Route architecture documented
- Placeholder pages render without route errors
- Protected route strategy documented
- Redirect and landing-page route responsibilities are clearly separated

### Gate

Do not start Module 1.3 until passed.

---

# MODULE 1.3 — QR Domain Model and Type System

## Objective

Create a strongly typed QR domain model before feature implementation.

Define concepts such as:

```ts
type QRMode = "static" | "dynamic";

type QRType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "vcard"
  | "whatsapp"
  | "wifi"
  | "pdf"
  | "app"
  | "images"
  | "video"
  | "social"
  | "event"
  | "barcode_2d"
  | "multi_link"
  | "menu"
  | "feedback"
  | "audio"
  | "location";
```

Use a registry/config model rather than scattered conditionals.

Each QR type definition should be able to declare:

- key
- label
- icon
- static support
- dynamic support
- fields/schema
- payload builder
- whether it needs Supabase Storage
- whether it needs a hosted landing page
- whether it supports analytics
- preview behavior

## QR Payload Builders

Create separate typed functions for payload formats such as:

- URL
- plain text
- `mailto:`
- `tel:`
- `sms:`
- WhatsApp URL
- Wi-Fi payload
- MECARD or vCard payload
- calendar/event payload

Do not generate QR canvas/SVG inside payload builders.

Payload generation and QR rendering must be separate.

## Acceptance Criteria

- QR type registry exists
- Core payload formats are unit-testable
- Field validation contracts exist
- No generator page contains QR-format business logic

### Gate

Do not start Module 1.4 until passed.

---

# MODULE 1.4 — Supabase Database Architecture

## Objective

Design the Supabase data model.

Do not request live Supabase credentials until local schema/migration definitions are ready.

## Core Tables

### `profiles`

Recommended fields:

- `id uuid primary key references auth.users`
- `display_name`
- `avatar_url`
- `created_at`
- `updated_at`

### `qr_codes`

Recommended fields:

- `id uuid primary key`
- `user_id uuid`
- `name`
- `slug`
- `mode` — static/dynamic
- `qr_type`
- `status` — active/paused/archived
- `payload_data jsonb`
- `destination_url`
- `design_config jsonb`
- `landing_page_config jsonb`
- `scan_count_cached`
- `created_at`
- `updated_at`

Rules:

- `slug` must be unique where required
- `payload_data` must never contain secrets
- URL values must be validated server-side
- Design configuration should be versionable

### `qr_scan_events`

Recommended fields:

- `id`
- `qr_code_id`
- `scanned_at`
- `country_code` nullable
- `region` nullable
- `city` nullable
- `device_type` nullable
- `os` nullable
- `browser` nullable
- `referrer` nullable
- `user_agent` nullable or privacy-minimized
- `ip_hash` nullable
- `metadata jsonb`

Privacy requirements:

- Do not store raw IP addresses unless there is a documented legal/product necessity.
- Prefer privacy-preserving derived metadata.
- Analytics collection must never delay redirect more than necessary.

### `qr_assets`

For uploaded assets:

- `id`
- `user_id`
- `qr_code_id` nullable
- `asset_type`
- `bucket`
- `path`
- `mime_type`
- `size_bytes`
- `created_at`

### `qr_folders` — optional but recommended

- `id`
- `user_id`
- `name`
- `created_at`

### `qr_code_folders` or `folder_id`

Choose the simpler structure appropriate for one-folder vs multi-folder organization.

## Optional Future Tables

Do not implement unless needed yet:

- subscriptions
- teams
- team_members
- api_keys
- audit_logs
- webhooks

Keep future extensibility in mind without over-engineering the MVP.

## Indexes

Plan indexes for:

- `qr_codes.user_id`
- `qr_codes.slug`
- `qr_codes.created_at`
- `qr_scan_events.qr_code_id`
- `qr_scan_events.scanned_at`
- compound analytics queries where justified

## Acceptance Criteria

- Schema documented
- Migrations are deterministic
- Foreign keys defined
- Indexes defined
- Delete behavior consciously selected
- Sensitive analytics handling documented

### Gate

Do not start Module 1.5 until passed.

---

# MODULE 1.5 — Supabase Auth, Storage, and RLS Design

## Objective

Create security boundaries before building authenticated functionality.

## Authentication

Support:

- Email/password signup
- Login
- Logout
- Password reset
- Session restoration

Google authentication may be added later if desired, but it must not block core launch.

## Row Level Security

RLS must be enabled for all user-owned tables.

Base policy intention:

- User can select only their own records
- User can insert only records owned by their authenticated user ID
- User can update only their own records
- User can delete only their own records
- Public redirect/landing-page access must not expose private database rows directly

Never rely only on hiding UI buttons.

## Storage Buckets

Plan separate storage concerns for:

- QR logos
- PDFs/documents
- image galleries
- audio/video assets where self-hosting is permitted
- profile avatars

Prefer private buckets when files should not be globally readable.

Use signed URLs or controlled server delivery when necessary.

Define:

- file type allowlists
- file-size limits
- sanitized filenames/paths
- user-isolated folders
- delete/replace behavior

## Acceptance Criteria

- RLS policies are explicit
- Storage policy is explicit
- Server/client Supabase responsibilities are documented
- Privileged key usage is server-only
- No public policy accidentally grants access to all user data

### Gate

Do not start Module 1.6 until passed.

---

# MODULE 1.6 — Structural Component Architecture

## Objective

Create component contracts and neutral skeletons without final UI styling.

## Core Components

Plan/build skeletons for:

```text
QRGeneratorShell
QRTypeSelector
QRContentPanel
QRDesignPanel
QRPreviewPanel
QRDownloadActions
QRNameField
QRModeToggle

DesignFrameControls
DesignPatternControls
DesignEyeControls
DesignColorControls
DesignLogoControls

DashboardSidebar
DashboardHeader
QRCodeCard
QRCodeTable
QRCodeStatusBadge
EmptyState

AnalyticsSummaryCards
AnalyticsChartShell
AnalyticsFilters
```

## Form Architecture

- QR type determines the content form schema
- Form state is separate from persisted QR record state
- Design state is reusable across QR types
- Preview derives from validated form + design state
- Use debounced preview updates where necessary

## State Rule

Do not create one enormous global store.

Prefer:

- local component state for purely visual controls
- form library state for forms
- URL/query state for filters where appropriate
- server state from Supabase through clear data functions
- a small dedicated builder store only if cross-panel coordination truly requires it

## Acceptance Criteria

- Component responsibilities are documented
- Generator shell renders structurally
- No giant monolithic builder component
- State ownership is clear

### Gate

Do not start Module 1.7 until passed.

---

# MODULE 1.7 — Structure Phase Verification

Run:

- dependency install
- development build/start check
- production build
- TypeScript check
- lint
- unit tests created so far
- route smoke test
- schema/migration validation where possible

Create a **Structure Phase Completion Report**.

The report must include:

- architecture summary
- route map
- data model summary
- security model summary
- known blockers
- credential requirements for the next stage, if any

If Supabase connectivity is now required, ask the user for the minimum necessary values.

### PHASE GATE

**Do not begin Phase 2 until the complete Structure phase is verified.**

---

# PHASE 2 — UI

> The structure is now frozen enough to build the visual system.  
> During this phase, implement polished interfaces and interactions using mock/local data where backend functionality is not yet connected.  
> Do not prematurely implement full feature behavior.

---

# MODULE 2.1 — Visual Design System

## Objective

Create an original design system inspired by the cleanliness and conversion-focused layout of QR generator products.

## Direction

The visual language should be:

- Modern SaaS
- Clean
- Spacious
- Trustworthy
- Lightweight
- Professional
- Friendly to non-technical users

## Suggested UI Characteristics

Use:

- Light primary surface
- White cards
- Soft neutral borders
- Subtle shadows
- Moderate rounded corners
- Strong readable headings
- One distinctive primary brand color
- Muted secondary text
- Clear selected states
- High-contrast CTA buttons
- Simple iconography

Avoid:

- excessive glassmorphism
- distracting animated gradients
- tiny text
- low-contrast controls
- an overcomplicated dashboard
- mimicking QR.io branding exactly

## Define Tokens

Create semantic tokens for:

- background
- surface
- foreground
- muted foreground
- border
- primary
- primary foreground
- destructive
- success
- warning
- focus ring

Create consistent:

- spacing scale
- typography scale
- border radii
- control heights
- card styles
- shadows
- transitions

## Accessibility

- Keyboard navigable controls
- Visible focus states
- Proper labels
- Semantic buttons
- ARIA only where needed
- Color must not be the sole status indicator
- Respect reduced-motion preferences

## Acceptance Criteria

- Design tokens centralized
- Core primitives render consistently
- Desktop and mobile examples work
- No inaccessible low-contrast primary controls

### Gate

Do not start Module 2.2 until passed.

---

# MODULE 2.2 — Public Header, Footer, and Marketing Shell

## Header

Include:

- Original project logo/wordmark placeholder
- QR Codes / Generator
- Static QR
- Dynamic QR
- Features
- Optional Pricing
- Login
- Prominent “Create QR Code” or “Sign Up” CTA

Desktop:

- clean horizontal navigation

Mobile:

- accessible navigation drawer

## Footer

Include grouped links:

- Product
- QR Types
- Resources/Help
- Company/Legal

Also:

- copyright
- privacy
- terms
- language selector only if multilingual support is actually implemented

Do not create non-functional fake language switching.

## Acceptance Criteria

- Header responsive
- Mobile nav accessible
- Footer responsive
- All visible links point to valid routes or intentionally marked placeholders

### Gate

Do not start Module 2.3 until passed.

---

# MODULE 2.3 — Home Page UI

## Objective

Create a strong landing page that makes QR generation the primary action.

## Recommended Page Structure

1. Header
2. Hero
3. Generator preview/entry experience
4. Trust/benefit strip
5. Dynamic vs Static explanation
6. Feature cards
7. QR type grid
8. How it works
9. Business/use cases
10. Analytics/customization preview
11. FAQ
12. CTA
13. Footer

## Hero Direction

Possible hierarchy:

**Headline:** Create custom QR codes in seconds  
**Subheading:** Generate, customize, save and track QR codes from one simple dashboard.

Primary CTA:

- Create QR Code

Secondary:

- Explore QR Types

Do not copy this exact text if better original copy is written.

## Acceptance Criteria

- Clear first-screen action
- Good mobile hierarchy
- No overly tall empty hero
- QR product value is understandable within a few seconds

### Gate

Do not start Module 2.4 until passed.

---

# MODULE 2.4 — QR Generator UI

## Objective

This is the most important product screen.

Create a polished builder inspired by QR.io’s content/design/preview mental model while improving usability.

## Desktop Layout

Preferred:

```text
---------------------------------------------------------
Header
---------------------------------------------------------
Title / mode toggle / QR name
---------------------------------------------------------
QR type selector strip/grid
---------------------------------------------------------
| Content + Design controls | Sticky QR Preview         |
|                           |                           |
|                           | Generate / Save / Download|
---------------------------------------------------------
```

Alternative:

- Tabbed Content / Design panel with persistent preview

Choose whichever gives the clearest experience.

## Top Controls

- Static / Dynamic segmented toggle
- QR name field when logged in or saving is possible
- Reset button
- Optional template button later

## QR Type Selector

Each item:

- Icon
- Short label
- Selected state
- Tooltip for less obvious types

On mobile:

- horizontal scroll with visible affordance, or
- compact multi-column grid

## Content Section

Form changes according to QR type.

Inputs need:

- labels
- helper text where needed
- validation
- inline errors
- sensible placeholders

## Design Section

Organize as accordion or tabs:

1. Frame
2. Pattern / Shape
3. Eyes
4. Colors
5. Logo

Avoid placing 30 controls in one uninterrupted panel.

## Preview Panel

Must include:

- QR canvas/SVG preview
- light preview card
- optional checkerboard for transparency
- scan-readability status/warning
- Save QR
- Download
- format selector where supported

Preview should remain visible on desktop when scrolling through design controls.

## Mobile

On mobile:

- content first
- preview card
- design controls
- sticky or easy-to-reach primary CTA
- no cropped color pickers
- no horizontal page overflow

## Acceptance Criteria

- Generator visually complete
- All planned QR-type form states have UI
- Design controls have UI
- Preview state exists
- Loading/error/empty states designed
- No backend completion is required yet unless already available

### Gate

Do not start Module 2.5 until passed.

---

# MODULE 2.5 — Authentication UI

Build:

- Login
- Signup
- Forgot password
- Reset password state
- Auth callback/loading state

UI requirements:

- clean centered card or split layout
- email/password controls
- password visibility toggle
- validation
- loading state
- error message area
- links between login/signup/recovery
- optional social auth slot only if it will later be functional

Do not add fake social login buttons.

### Gate

Do not start Module 2.6 until passed.

---

# MODULE 2.6 — Dashboard UI

## Dashboard Layout

Desktop:

- sidebar
- top bar
- main content

Mobile:

- drawer/sidebar collapse
- clear page title
- actions remain accessible

## Sidebar

Suggested items:

- Overview
- QR Codes
- Create QR
- Analytics
- Files
- Account / Settings

Do not show routes that will never be implemented.

## Overview Screen

Include visual placeholders/components for:

- Total QR Codes
- Dynamic QR Codes
- Total Scans
- Scans this period
- Recent QR codes
- Recent activity/chart

## QR Code List

Provide both card/table strategy depending on viewport.

Each QR entry should show:

- name
- preview thumbnail
- type
- static/dynamic badge
- status
- scan count if applicable
- updated date
- quick actions

Actions:

- View
- Edit
- Analytics
- Download
- Duplicate
- Archive/Delete via guarded confirmation

## Empty State

New users need a strong empty state:

- explanation
- Create first QR CTA

### Gate

Do not start Module 2.7 until passed.

---

# MODULE 2.7 — QR Detail and Edit UI

Create a detailed QR page with:

- large QR preview
- name
- status
- type
- mode
- destination/content summary
- created/updated timestamps
- download actions
- edit action
- analytics summary for dynamic codes
- destructive actions separated visually

Edit page:

- reuse generator design/content components
- show unsaved changes state
- clear Save Changes action
- confirm navigation if important changes would be lost

### Gate

Do not start Module 2.8 until passed.

---

# MODULE 2.8 — Analytics UI

Create analytics interface for dynamic QR codes.

## Summary Cards

- Total scans
- Unique/estimated unique scans if methodology supports it
- Last 24h / 7d / 30d
- Top country
- Top device

## Charts

Plan:

- Scans over time
- Country distribution
- Device type
- Browser/OS if collected
- Hour/day breakdown

## Filters

- Date range
- QR code
- Country/device where useful

Do not display analytics metrics that the backend will not actually collect.

Use clear empty states:

- “No scans yet”

### Gate

Do not start Module 2.9 until passed.

---

# MODULE 2.9 — Account, Files, Settings UI

## Account

- display name
- email read-only/change flow if supported
- avatar
- password/security entry point

## Files

- uploaded asset list/grid
- file type
- size
- linked QR codes
- upload state
- delete action with confirmation

## Settings

Initially limit to settings that actually exist.

Potential settings:

- default QR design
- default download format
- analytics privacy preferences

Avoid fake toggles.

### Gate

Do not start Module 2.10 until passed.

---

# MODULE 2.10 — Responsive and Accessibility UI Audit

Test representative widths:

- small mobile
- large mobile
- tablet
- laptop
- desktop

Audit:

- navigation
- generator
- form labels
- color controls
- dialog focus trapping
- keyboard use
- sticky preview behavior
- dashboard table overflow
- chart readability
- empty states
- touch target sizes

Fix all important UI defects before Phase 3.

Create a **UI Phase Completion Report**.

### PHASE GATE

**Do not begin Phase 3 until the UI phase passes.**

---

# PHASE 3 — FEATURES

> Now wire real functionality into the already approved structure and UI.  
> Build feature modules in sequence.  
> Do not destabilize completed screens while adding backend behavior.

---

# MODULE 3.1 — Supabase Connection and Authentication

## Objective

Connect the live Supabase project.

At this point, if credentials have not yet been provided, request only what is necessary.

Configure:

- browser Supabase client
- server Supabase client
- auth session handling
- middleware/protected route strategy where appropriate
- signup
- login
- logout
- password recovery
- profile creation/upsert

Never expose service-role credentials to client bundles.

## Tests

Verify:

- signup
- login
- logout
- protected route redirect
- authenticated dashboard load
- session persistence
- password recovery request flow

### Gate

Do not start Module 3.2 until passed.

---

# MODULE 3.2 — Static QR Generation

## Objective

Implement real generation for core static QR types.

## Initial Static Types

Implement and test:

1. URL
2. Text
3. Email
4. Phone
5. SMS
6. WhatsApp
7. Wi-Fi
8. vCard
9. Event

Each must:

- validate required fields
- build a correct encoded payload
- generate a scannable QR
- update preview
- support download
- preserve Unicode where relevant

## Validation Examples

### URL

- require a valid URL
- normalize only when safe
- reject unsupported dangerous schemes

### Email

Build a valid `mailto:` payload with optional:

- subject
- body

### Phone

Build `tel:` URI.

### SMS

Build standards-compatible SMS URI.

### WhatsApp

Build appropriate WhatsApp deep/web link with encoded message.

### Wi-Fi

Support:

- SSID
- password
- encryption mode
- hidden network
- proper escaping

### vCard

Support:

- first/last name
- phone
- mobile
- email
- website
- company
- title
- address fields where available

### Event

Support standard calendar-compatible event data where feasible.

## Acceptance Criteria

Every type is tested with at least:

- valid case
- invalid case
- special characters/Unicode where relevant

### Gate

Do not start Module 3.3 until passed.

---

# MODULE 3.3 — QR Styling and Live Preview Engine

Implement real design rendering.

## Required Controls

- foreground color
- background color
- transparent background
- pattern style
- corner square style
- corner dot style
- finder colors
- gradient if supported reliably
- logo upload/use
- logo size constraints
- logo margin/background
- frame templates
- frame CTA text
- reset design

## Reliability Rules

The app must prioritize scan reliability.

Implement safeguards such as:

- strong contrast warning
- safe logo-size limits
- adequate QR quiet zone
- sensible error-correction level when logo is enabled
- fallback if a styling option is unsupported by an export format

Do not guarantee scan reliability under every possible extreme style.

## Preview Performance

- avoid full rerender loops
- debounce expensive renders
- clean up generated object URLs
- prevent memory leaks
- preserve form input responsiveness

### Gate

Do not start Module 3.4 until passed.

---

# MODULE 3.4 — QR Download and Export

Implement:

- PNG download
- SVG download

Optionally add:

- high-resolution PNG sizes
- JPEG only if it offers a clear user benefit
- print PDF later if reliably implemented

## Download Options

Allow resolution presets such as:

- 512px
- 1024px
- 2048px

SVG should remain vector-based.

Use safe filenames generated from the QR name.

Example:

```text
my-restaurant-menu-qr.png
```

## Acceptance Criteria

- Downloads work in supported browsers
- Logo appears correctly
- Transparent background behaves as expected
- QR remains readable after export
- Filename is sanitized

### Gate

Do not start Module 3.5 until passed.

---

# MODULE 3.5 — Saving and Managing QR Codes

Implement authenticated persistence.

User should be able to:

- save QR code
- name QR code
- view saved QR codes
- open detail
- edit supported properties
- duplicate
- archive
- delete with confirmation
- download again

## Persistence Rules

Store:

- QR type
- mode
- payload config
- design config
- destination
- asset references
- timestamps

Do not store generated base64 images in Postgres unless there is a strong reason.

Regenerate visuals from saved config.

## Security

All CRUD operations must respect RLS and server-side ownership checks.

### Gate

Do not start Module 3.6 until passed.

---

# MODULE 3.6 — Dynamic QR Codes

## Objective

Create changeable QR destinations.

A dynamic QR should encode a stable app URL such as:

```text
https://your-domain.com/r/AbC123xy
```

The database record maps this slug to the current destination.

## Required Behavior

User can:

- create a dynamic QR
- set destination
- download it
- later change destination
- keep the same printed QR code
- pause/archive it
- reactivate when appropriate

## Redirect Route Requirements

The `/r/[slug]` route must:

1. Resolve slug efficiently
2. Reject missing/invalid/inactive code cleanly
3. Record scan asynchronously or efficiently
4. Redirect safely
5. Prevent open-redirect abuse by validating stored targets
6. Avoid exposing internal database IDs unnecessarily
7. Use cache strategy carefully so destination edits propagate correctly

## Slug Requirements

- URL-safe
- difficult enough to guess
- unique
- never sequential database IDs

### Gate

Do not start Module 3.7 until passed.

---

# MODULE 3.7 — Scan Analytics

Implement real scan-event collection for dynamic QR codes.

## Capture Only Useful Metadata

Depending on available privacy-safe server signals:

- timestamp
- QR ID
- coarse geolocation if available and legally appropriate
- device class
- OS
- browser
- referrer
- anonymized/hashed network identifier only if truly necessary

## Privacy

- Minimize personal data
- Do not persist raw IP by default
- Add retention strategy if volume grows
- Document exactly what is collected
- Analytics must be disclosed in Privacy Policy before production

## Aggregation

Implement efficient analytics queries for:

- total scans
- scans by day
- scans by country
- scans by device
- scans by browser/OS if stored

For scale, consider:

- rollups
- materialized summaries
- cached counters

Do not prematurely add complexity if raw events are sufficient for expected volume.

### Gate

Do not start Module 3.8 until passed.

---

# MODULE 3.8 — File-Based QR Types and Supabase Storage

Implement storage-dependent types incrementally.

## PDF QR

Flow:

1. User uploads supported PDF
2. Validate file type/size
3. Store in Supabase Storage
4. Associate asset with user/QR
5. Create a controlled public/signed landing or file access URL
6. Generate dynamic QR pointing to that experience

Prefer dynamic behavior so the PDF can later be replaced without reprinting the QR.

## Image Gallery QR

Allow:

- multiple images
- ordering
- optional captions
- gallery landing page

## Audio / MP3 QR

Allow:

- supported audio upload
- title
- optional description/artwork
- mobile landing page/player

Do not self-host large video by default unless product requirements justify storage/bandwidth.

For Video QR, prefer:

- YouTube/Vimeo/external video URL
- hosted landing page around the external video

### Gate

Do not start Module 3.9 until passed.

---

# MODULE 3.9 — Hosted Landing Page QR Types

Implement mobile-first hosted experiences.

## Types

Prioritize:

1. Social Links
2. Multiple Links
3. App Links
4. Video
5. Feedback
6. Menu
7. Business/Profile page

Each landing page must:

- be fast
- be mobile responsive
- have safe output encoding
- use an original template system
- belong to the authenticated user
- support edit without changing dynamic QR where possible

## Social / Multiple Links

Support:

- page title
- avatar/logo
- short description
- ordered links
- social icons
- optional theme selection

## App Links

Support:

- iOS App Store URL
- Google Play URL
- fallback website
- device-aware CTA when appropriate

## Feedback

Support configurable:

- rating
- short text feedback
- optional contact field

Store feedback only if privacy policy and user consent requirements are handled.

### Gate

Do not start Module 3.10 until passed.

---

# MODULE 3.10 — Dashboard Search, Filters, and Organization

Implement:

- search by QR name
- filter by type
- filter by static/dynamic
- filter by status
- sorting
- pagination or infinite loading based on expected dataset
- optional folders

Avoid loading thousands of QR rows client-side and filtering them in memory.

Use database queries.

### Gate

Do not start Module 3.11 until passed.

---

# MODULE 3.11 — QR Status, Duplicate, Archive, and Safe Delete

Implement:

## Duplicate

Copies:

- content config
- design config

Generates:

- new ID
- new slug for dynamic QR
- new timestamps

## Archive

- removes from primary active view
- does not destroy analytics/history

## Pause Dynamic QR

- redirect route should show a controlled unavailable page rather than redirecting

## Delete

- confirmation required
- define behavior for linked storage assets and scan history
- avoid accidental cascading loss unless explicitly intended

### Gate

Do not start Module 3.12 until passed.

---

# MODULE 3.12 — Security Hardening

Audit:

## Auth

- authorization on every user-owned operation
- no reliance on client-provided `user_id`

## RLS

- test cross-user access attempts
- confirm storage policies

## Input

- URL validation
- text length limits
- file validation
- filename sanitization
- safe rendering
- no untrusted HTML

## Redirect Security

- prohibit dangerous URL schemes
- prevent stored JavaScript URLs
- handle malformed destinations
- use safe HTTP redirect handling

## Upload Security

- MIME checks
- extension checks
- size limits
- user quotas where appropriate

## Rate Limiting

Plan or implement protections for:

- unauthenticated generation abuse
- dynamic redirect abuse
- scan-event floods
- signup/login abuse
- file upload abuse

Rate limiting may use platform middleware/edge infrastructure where appropriate.

## Headers

Use secure defaults:

- CSP where practical
- frame protection
- MIME sniffing protection
- referrer policy

### Gate

Do not start Module 3.13 until passed.

---

# MODULE 3.13 — Performance and Reliability

Audit:

- generator render performance
- bundle size
- image optimization
- lazy loading
- dashboard query count
- analytics query performance
- redirect latency
- unnecessary client components
- storage cleanup
- database indexes
- N+1 queries

Dynamic redirects must remain lightweight.

Do not render a heavy dashboard application just to perform a redirect.

### Gate

Do not start Module 3.14 until passed.

---

# MODULE 3.14 — SEO and Public Content

Implement:

- metadata
- canonical URLs
- sitemap
- robots directives
- Open Graph basics
- QR type content pages where useful
- FAQ structured data only if content truly exists
- semantic headings
- fast public pages

Create original useful content.

Do not mass-produce thin SEO pages.

### Gate

Do not start Module 3.15 until passed.

---

# MODULE 3.15 — Legal and Privacy Readiness

Create route/page placeholders and then production-ready text must later be reviewed by the product owner/legal counsel:

- Privacy Policy
- Terms
- Cookie disclosure if required
- Data retention explanation
- Analytics disclosure

Do not invent legal guarantees.

Clearly distinguish implementation from legal approval.

### Gate

Do not start Module 3.16 until passed.

---

# MODULE 3.16 — Test Suite and End-to-End Verification

## Unit Tests

Cover:

- payload builders
- URL validation
- Wi-Fi escaping
- vCard generation
- slug helpers
- design config validation
- download filename sanitization

## Integration Tests

Cover where practical:

- QR CRUD
- ownership/RLS
- dynamic destination update
- scan event creation
- storage metadata

## E2E Journeys

At minimum test:

### Journey A — Anonymous Static QR

1. Open generator
2. Select URL
3. Enter URL
4. Customize color
5. Generate
6. Download

### Journey B — Account Creation

1. Sign up
2. Enter dashboard
3. Create saved QR
4. See it in list

### Journey C — Dynamic QR

1. Create dynamic link QR
2. Visit redirect
3. Confirm destination
4. Change destination
5. Revisit same QR redirect
6. Confirm new destination

### Journey D — Analytics

1. Scan dynamic QR
2. Confirm scan recorded
3. Open analytics
4. Confirm aggregate updates

### Journey E — Authorization

1. User A creates QR
2. User B attempts direct access
3. Access must be denied

### Journey F — File QR

1. Upload PDF
2. Save QR
3. Open landing/file route
4. Confirm access
5. Replace PDF if supported
6. Confirm same dynamic QR can resolve new content

## Browser/Viewport Verification

Test:

- Chrome-family browser
- at least one additional browser engine if available
- mobile viewport
- desktop viewport

### Gate

Do not start final release module until passed.

---

# MODULE 3.17 — Production Readiness and Final Audit

## Final Checks

Run:

- production build
- TypeScript
- lint
- unit tests
- integration tests
- E2E tests
- dependency audit where practical
- secret scan
- route audit
- broken-link audit
- responsive UI audit
- accessibility audit
- RLS/security audit
- storage policy audit

## Final Documentation

Update:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/WORKLOG.md`
- `docs/SESSION_HANDOFF.md`
- `docs/SUPABASE_SETUP.md`
- `docs/DEPLOYMENT.md`
- `docs/SECURITY.md`

## Final Report

Produce:

### 1. Product Summary

What was built.

### 2. Architecture

Frontend, Supabase, QR renderer, redirect architecture.

### 3. Completed QR Types

Static and dynamic.

### 4. Database

Tables, relationships, RLS.

### 5. Storage

Buckets and policies.

### 6. Analytics

What is tracked and what is intentionally not tracked.

### 7. Testing

Exact checks and results.

### 8. Known Limitations

Anything intentionally deferred.

### 9. Required Production Configuration

- environment variables
- domain
- Supabase redirect URLs
- storage settings
- optional email provider
- optional monitoring

### 10. Future Enhancements

Only after core product is stable.

---

# 6. SUPABASE IMPLEMENTATION REQUIREMENTS

When live Supabase access becomes available:

1. Link to the correct project.
2. Confirm project reference before applying changes.
3. Apply migrations in order.
4. Never destroy production data to fix a migration.
5. Use forward migrations.
6. Enable RLS.
7. Verify every policy.
8. Configure Auth redirect URLs.
9. Configure Storage buckets and policies.
10. Add a controlled seed only for non-sensitive development data.
11. Document every environment variable.
12. Never expose service-role key to frontend code.

If the owner gives a Supabase access token, treat it as a privileged secret.

Do not echo it back.

---

# 7. DATABASE POLICY EXAMPLES — INTENT ONLY

Implement equivalent policies using correct Supabase/Postgres syntax.

For a user-owned QR record:

```text
SELECT allowed when qr_codes.user_id = auth.uid()
INSERT allowed when new user_id = auth.uid()
UPDATE allowed when qr_codes.user_id = auth.uid()
DELETE allowed when qr_codes.user_id = auth.uid()
```

For public dynamic redirects:

- Do not open unrestricted public SELECT access to full `qr_codes` rows merely to support redirects.
- Prefer a secure server path/function that exposes only the minimum fields required for redirect resolution.

For scan insertion:

- Prevent attackers from inserting arbitrary QR IDs into analytics.
- Resolve the slug server-side and attach the valid QR ID internally.

---

# 8. QR SCANNABILITY REQUIREMENTS

A beautiful QR that does not scan is a failed product.

Therefore:

- Preserve quiet zone
- Maintain adequate foreground/background contrast
- Avoid overly large logos
- Use appropriate error correction
- Avoid destructive pattern styling
- Test real exported files
- Include a “Reset design” action
- Consider a warning if contrast is too low
- Do not allow the logo to cover finder patterns

Create automated tests where possible, but also perform manual scanner verification during final QA.

---

# 9. ERROR AND EMPTY-STATE REQUIREMENTS

Every important workflow must have:

- Loading state
- Empty state
- Validation error
- Server error
- Retry path
- Disabled action where appropriate
- Success feedback

Examples:

## Generator

- invalid URL
- unsupported input
- required field missing
- file too large
- QR rendering error

## Dashboard

- no QR codes
- failed load
- no search results

## Analytics

- no scans yet
- failed analytics load

## Storage

- upload in progress
- upload failed
- unsupported file
- quota exceeded if quotas are implemented

Never leave users with a blank panel after an error.

---

# 10. USER EXPERIENCE IMPROVEMENTS OVER THE REFERENCE

Implement these improvements where feasible:

1. Keep QR preview visible while editing on desktop.
2. Make Static/Dynamic distinction obvious before generation.
3. Explain which QR types can be edited after printing.
4. Use a structured accordion for design controls.
5. Show live validation rather than only final-submit errors.
6. Provide clear scan-reliability warnings.
7. Let signed-in users name a QR before saving.
8. Keep dashboard actions consistent.
9. Make analytics understandable to non-technical users.
10. Make mobile generator controls comfortable and touch-friendly.
11. Preserve a user’s builder state during authentication where practical.
12. Do not force account creation merely to preview a static QR unless the product owner later chooses that business rule.
13. Keep the codebase ready for future pricing/subscription functionality without forcing billing into the MVP.

---

# 11. OUT-OF-SCOPE UNTIL CORE PRODUCT IS COMPLETE

Do not implement these before the core modules are complete:

- enterprise team management
- white-label domains
- public REST API
- webhooks
- Zapier integrations
- advanced campaign attribution
- custom domain per QR
- SSO
- reseller system
- complex subscription billing
- AI-generated QR content
- native mobile apps
- browser extensions

The architecture may remain extensible for them.

---

# 12. CODING STANDARDS

## TypeScript

- strict mode
- no avoidable `any`
- narrow unknown data
- shared schemas
- typed database results where possible

## React

- small composable components
- minimize unnecessary client components
- do not place server secrets in client code
- avoid useEffect for data flows better handled server-side
- stable keys
- clear form ownership

## Database

- migrations committed
- RLS committed/documented
- indexes intentional
- no destructive reset as a normal workflow

## Naming

Use consistent naming across:

- routes
- database columns
- TypeScript types
- components
- feature folders

---

# 13. GIT AND CHANGE MANAGEMENT

If Git is available:

- Make logical commits at meaningful module boundaries.
- Do not bundle unrelated refactors.
- Keep the repository buildable.
- Do not rewrite history unless explicitly required.
- Do not commit secrets.

Suggested commit pattern:

```text
chore: establish qr platform foundation
feat: add qr domain model
feat: add supabase schema and rls
feat: build generator ui
feat: implement static qr generation
feat: add dynamic qr redirects
feat: add scan analytics
```

---

# 14. STATUS TRACKING

Maintain `docs/WORKLOG.md`.

After each module record:

```md
## Module X.Y — [Name]

Status: COMPLETE / BLOCKED / IN PROGRESS

Completed:

- ...

Verification:

- ...

Known issues:

- ...

Next:

- Module X.Z
```

Maintain `docs/SESSION_HANDOFF.md` so another coding-agent session can continue without guessing.

The handoff should always contain:

- current module
- last completed module
- current branch/commit if known
- relevant commands
- current blockers
- next exact task
- Supabase integration status
- test status

---

# 15. CREDENTIAL REQUEST PROTOCOL

Do not casually ask:

> “Send me all Supabase keys.”

Instead determine the actual requirement.

Examples:

## If only client auth/data access is needed

Request:

- Project URL
- anon/publishable key

## If secure server admin operation is genuinely required

Request:

- service-role key

## If Supabase CLI project linking/management is required

Request:

- project ref
- personal access token if the environment needs one

Before requesting credentials, tell the owner:

1. Which module needs them
2. Exactly which value is required
3. Where it will be placed
4. Whether it is browser-safe or server-only

Do not request credentials earlier than necessary.

---

# 16. FINAL PRODUCT ACCEPTANCE CHECKLIST

The project is not complete until all applicable items pass.

## Structure

- [ ] Clean folder architecture
- [ ] Route architecture complete
- [ ] QR type registry exists
- [ ] Supabase schema/migrations exist
- [ ] RLS strategy exists
- [ ] Storage architecture exists
- [ ] Environment config documented

## UI

- [ ] Responsive marketing site
- [ ] Responsive QR generator
- [ ] Static/Dynamic selector
- [ ] QR type selector
- [ ] Content forms
- [ ] Design controls
- [ ] Live preview
- [ ] Auth pages
- [ ] Dashboard
- [ ] QR detail/edit
- [ ] Analytics UI
- [ ] Account/files/settings
- [ ] Accessibility audit

## Core Features

- [ ] Static QR generation
- [ ] QR style customization
- [ ] Logo
- [ ] Frame/CTA
- [ ] PNG export
- [ ] SVG export
- [ ] Save QR
- [ ] Edit QR
- [ ] Duplicate
- [ ] Archive/delete
- [ ] Dynamic redirect
- [ ] Update dynamic destination
- [ ] Scan analytics
- [ ] PDF QR
- [ ] At least one hosted landing-page QR type

## Security

- [ ] Auth tested
- [ ] RLS tested
- [ ] Cross-user access denied
- [ ] Service key server-only
- [ ] Safe URL validation
- [ ] Safe file uploads
- [ ] No secrets committed
- [ ] Redirect abuse considered

## Quality

- [ ] TypeScript passes
- [ ] Lint passes
- [ ] Production build passes
- [ ] Unit tests pass
- [ ] Integration tests pass where configured
- [ ] E2E critical paths pass
- [ ] Mobile tested
- [ ] Desktop tested
- [ ] Scannability manually verified

---

# 17. FIRST ACTION FOR THE CODING AGENT

Start with **PHASE 1 — STRUCTURE, MODULE 1.1 only**.

Do not begin Module 1.2 until Module 1.1 is implemented, checked, documented, and marked passed.

Do not begin UI work.

Do not begin feature implementation.

Your first response/work session should:

1. Inspect the current repository if one already exists.
2. Summarize the detected stack/state.
3. Establish the Module 1.1 foundation.
4. Run verification.
5. Update documentation.
6. Produce the Module 1.1 completion report.
7. Continue to Module 1.2 only if Module 1.1 has passed.

Remember the permanent phase order:

> **STRUCTURE → UI → FEATURES**

Never reverse or merge these phases merely to move faster.

---

# END OF MASTER BUILD PROMPT
