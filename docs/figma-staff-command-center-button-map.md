# Figma Staff Command Center Button Map

Source of truth: `/Users/codex/Desktop/Staff Command Center Dashboard/src/app/App.tsx`

Implementation copy: `src/components/figma-staff-command-center.tsx`

Support copy: `src/components/figma-sop-builder.tsx`

## Copy Contract

- The Staff Command Center shell is copied from the Figma export instead of reconstructed from the previous service-driven staff dashboard.
- The Figma export is 2,094 lines. The app copy is intentionally kept within a small compatibility range of that size.
- Allowed compatibility edits are limited to `"use client"`, import paths, exported component name, and the already-redacted Figma admin panel import.
- This pass preserves button/state structure first. Internal data writes and backend functions should be wired in later against this map.

## Global Shell

- Logo button: returns to `Chapters`.
- Top navigation buttons:
  - `Chapters`
  - `Campaigns`
  - `Proof / UGC`
  - `Best Practices`
  - `Campaign SOPs`
  - `Admin`
- Alert/status pill: `2 chapters need intervention`.
- User chip: `JS`.

## Portfolio Overview

Default screen: `Portfolio Overview`.

Controls:
- Search input: `Search chapter or school...`
- Clear search button: `X`, visible after typing.
- Region select: `All Regions`, New England, Mid Atlantic, South, Midwest, West, Puerto Rico, UK, Canada, International.
- Coach select: `All Coaches` plus coach names from the Figma data.
- Sort select: `Sort: Name`, `Sort: NPS`, `Sort: Events`, `Sort: Leads`, `Sort: Lead %`, `Sort: Points`.
- `Export` button.
- Chapter table rows: open `Chapter Detail` drawer.

Chapter table columns:
- `#`
- `Chapter`
- `Coach`
- `Region`
- `Events/Yr`
- `Events/Mo`
- `Leads`
- `RSVPs`
- `Attended`
- `Lead→Event %`
- `Avg NPS`
- `Points/Yr`

## Chapter Detail Drawer

Opened by selecting a chapter row.

Controls:
- Close drawer `X`.
- `Preview Survey` opens the NPS survey preview modal.
- `Send NPS Survey` button in the NPS section.
- Coach note textarea.
- Footer `Send Content` button.
- Footer `Send NPS Survey` button.
- Footer external-link icon button.

NPS survey modal controls:
- Score buttons `0` through `10`.
- Optional feedback textarea.
- `Submit` button.
- Close modal `X`.

## Campaign Operations

Screen: `Campaign Operations`.

Campaign tab buttons:
- `Rush Month`
- `SLT Promotion`
- `Moving Mountains`
- `Chapter Events`
- `Leadership Transition`
- `Chapter Organization and Planning`
- `Social Media`

Controls:
- Campaign tab buttons reset the region and coach filters.
- At-risk hover panel shows suggested actions.
- Region select.
- Coach select.

Campaign table variants:
- Rush Month table.
- SLT Promotion table.
- Moving Mountains table.
- Chapter Events table.
- Leadership Transition table.
- Chapter Organization and Planning table.
- Social Media table.

## Proof / UGC Review Queue

Screen: `Proof / UGC Review Queue`.

Controls:
- Story link input.
- Platform quick-fill buttons: LinkedIn, Instagram, Loom, Facebook, YouTube.
- `Submit` story-link button.
- Status filter buttons: `All`, `Pending`, `Approved`, `Rejected`.
- Platform select: all platforms plus LinkedIn, Instagram, Facebook, Loom, YouTube, TikTok, Uploaded.
- Story cards: select or unselect the review panel item.
- Selected story external link: `Open link`.
- Share target buttons:
  - `This chapter only`
  - `Selected chapters`
  - `All chapters`
  - `Global / Public`
- `Mark as Best Practice`
- `Request Changes`
- `Reject`
- Coach note textarea.

## Best Practices Library

Screen: `Best Practices Library`.

Controls:
- Campaign select: `All Campaigns` plus campaign names.
- Region select.
- Per-card `Share to Feed` button.
- Per-card `Send to Coaches` button.
- Per-card bookmark icon button.

## Campaign SOPs

Screen: `Campaign SOP Builder`.

Library controls:
- `New Campaign SOP`.
- Status filter buttons: `All`, `Live`, `Draft`, `Scheduled`, `Archived`.
- Search input: `Search campaigns...`.
- Per-row `Open Builder`.
- Per-row copy icon button.
- Per-row archive icon button.

Builder header controls:
- `Library` back button.
- `Preview`.
- `Publish`.

Builder tab buttons:
- `Steps`
- `Role Matrix`
- `Completion Rules`
- `Points & KPI`
- `Comm Triggers`
- `Role Preview`
- `Version Review`

Steps tab controls:
- Section buttons: Planning, Launch, Recruitment, Onboarding, Review.
- Version buttons: v3.2, v3.1, v3.0.
- `Campaign Config`.
- `Add Section`.
- Step cards.
- Step card `Add step after` buttons.
- `Add New Step`.
- Step detail edit icon.
- Step detail more icon.
- Rule toggles: Evidence Required, Approval Required, Points Enabled, Required Step.

Role Matrix controls:
- Step select.

Completion Rules controls:
- `Manual completion`.
- `Auto-complete when rules pass`.
- Evidence item checkboxes.
- Approval toggle.

Points & KPI controls:
- Points Enabled toggle.
- General Member points input.
- E-board points input.
- KPI Tag input.
- Metric Key input.
- Rules toggles: Leaderboard Visible, Approval for Points, Internal-Only Tracking, Allow Manual Override.

Comm Triggers controls:
- `Add Trigger`.
- Per-trigger edit icon.

Role Preview controls:
- Role buttons for each role preview.

Version Review controls:
- `Rollback to v3.1`.
- `Publish Now`.
- Publish modal:
  - Close `X`.
  - `Publish Now`.
  - `Schedule Later`.
  - `Cancel`.

## Admin Entry From Staff Shell

Screen: `System Health` before admin access is granted.

Controls:
- Admin role radio: `DS Admin`.
- Admin role radio: `Super Admin`.
- `Enter Admin Panel`.
- `Return to dashboard`.

After access is granted, the staff shell opens the redacted Figma DS Admin panel overlay already used by `/admin`.

## Wiring Rule For Future Work

Each listed control should receive real behavior in a later PR without changing the Figma shell layout first. When functionality requires a backend action, wire it behind the existing button/control and keep the visible labels, grouping, and page hierarchy intact unless the Figma source changes.
