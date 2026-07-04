# Figma Code Contract

Date: 2026-07-04

This document maps every local Figma export source to the route/component that
must implement it. Raw Figma code is stored as a redacted archive at
`docs/figma-code/raw/figma-export-source-redacted-2026-07-04.zip` and should be
treated as reference input, not edited in place. Paths in the source column are
archive-internal paths.

## Raw Code Inventory

| Figma screen/package | Raw Figma code source | Target route | App shell | Nav item | Primary component in app | Expected visual result | Known gaps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Role-based login | `docs/figma-code/raw/login/App.tsx` | `/login` | Login entry | Sign in | `src/app/login/page.tsx`, `src/components/login-form.tsx` | Dark centered myMEDLIFE login card with logo, email, password, forgot-password, and sign-in button | Current app preserves real auth; profile picker/workspace cards from export are not fully ported. |
| General Student App | `docs/figma-code/raw/member-app/App.tsx` | `/app` | Student mobile | Home | `src/components/figma-member-mobile-home.tsx` | Exact Figma mobile shell copied into the app with blue header, priority action, events, points, campaign, stories, bottom nav, and button-owned screen changes | Replaced older service-adapted shell in MED-508; see `docs/figma-member-mobile-app-button-map.md`. |
| Member campaign | `docs/figma-code/raw/member-app/App.tsx`, `CampaignPage` | `/campaigns`, `/campaigns/rush-month`, or `/rush-month` | Student mobile | Active Campaign | `src/components/figma-member-campaigns-page.tsx`; existing campaign detail pages | Rush Month campaign page with phase, KPIs, role actions, evidence, points, and route-specific actions | `/campaigns` wired in PR #170; campaign detail routes can continue deeper parity later. |
| Member events | `docs/figma-code/raw/member-app/App.tsx`, `EventsScreen`, `EventDetailScreen`, `RsvpConfirmScreen`, `CheckInScreen` | `/app/events`, `/app/events/[eventId]` | Student mobile | Events | `src/app/app/events/page.tsx`, event detail route | Event feed, campaign filters, event detail, RSVP confirmation, check-in, points reminder | Current route is dedicated but not yet a full code port. |
| Member points | `docs/figma-code/raw/member-app/App.tsx`, `PointsLeaderboard` | `/app/points` | Student mobile | Points | `src/app/app/points/page.tsx` | Points and recognition page with chapter leaderboard and point explanations | Current route is dedicated but not yet a full code port. |
| Member Stories | `docs/figma-code/raw/member-app/App.tsx`, `StoriesScreen` | `/proof-library` or `/app/stories` | Student mobile | Stories | `src/components/figma-member-stories-page.tsx` | MEDLIFE Stories feed with filters and story cards | `/proof-library` wired in PR #170 with uploads/publishing still gated. |
| Student Leadership Command Center | `docs/figma-code/raw/student-leadership/App.tsx` | `/leader` internal buttons | Leader desktop | Home | `src/components/figma-leader-command-center.tsx` | Exact Figma desktop shell copied into the app with sidebar, BC sample, health score, metrics, risk alerts, priorities, quick actions, and button-owned screen changes | Replaced older service-adapted shell in MED-508; see `docs/figma-leader-command-center-button-map.md`. |
| Leader leaderboard | `docs/figma-code/raw/student-leadership/App.tsx`, `LeaderboardScreen` | `/leader` internal `Chapter Leaderboard` button | Leader desktop | Leaderboard | `src/components/figma-leader-command-center.tsx` | Leaderboard screen with metrics, chapter/member rankings, benchmark context | Preserved from exact Figma shell; backend wiring comes later. |
| Leader members/profile | `docs/figma-code/raw/student-leadership/App.tsx`, `MembersScreen`, `ProfileScreen` | `/leader` internal `Member Leaderboard` / `Member Profile` buttons | Leader desktop | Members | `src/components/figma-leader-command-center.tsx` | Member pipeline/profile table with role and points context | Preserved from exact Figma shell; backend wiring comes later. |
| Leader committees | `docs/figma-code/raw/student-leadership/App.tsx`, `CommitteesScreen` | `/leader` internal `Event Committees` button | Leader desktop | Committees | `src/components/figma-leader-command-center.tsx` | Committee overview and activity health | Preserved from exact Figma shell; backend wiring comes later. |
| Leader events/create event | `docs/figma-code/raw/student-leadership/App.tsx`, `CreateEventScreen.tsx` | `/leader` internal `Event Performance` / `Create Event` buttons | Leader desktop | Events, Create Event | `src/components/figma-leader-command-center.tsx`; `src/components/figma-leader-create-event-screen.tsx` | Event table, attendance/NPS posture, create-event flow, RSVP, attendance, and points context | Preserved from exact Figma shell; live Luma writes remain blocked. |
| Leader impact/bridge/succession/feed/training | `docs/figma-code/raw/student-leadership/App.tsx`, `StoriesScreen.tsx`, `TrainingScreen.tsx` | `/leader` internal buttons | Leader desktop | Impact, Bridge Videos, Succession, Feed Analytics, Training, Stories | `src/components/figma-leader-command-center.tsx`; `src/components/figma-leader-training-screen.tsx`; `src/components/figma-leader-stories-screen.tsx` | Distinct exported leader screens copied from Figma | Preserved from exact Figma shell; backend wiring comes later. |
| Staff Command Center | `docs/figma-code/raw/staff-command-center/App.tsx` | `/staff` | Staff desktop | Chapters | `src/components/figma-staff-command-center.tsx` | Figma-exported 2,094-line shell copied into the app with dark top nav, portfolio overview, filters, chapter table, detail drawer, and button-owned screen changes | Replaced older service-adapted shell in MED-507; see `docs/figma-staff-command-center-button-map.md`. |
| Staff Campaign Operations | `docs/figma-code/raw/staff-command-center/App.tsx`, `CampaignOps` | `/staff` internal `Campaigns` button | Staff desktop | Campaigns | `src/components/figma-staff-command-center.tsx` | Campaign tabs, at-risk chapters, suggestions, and all exported campaign table variants | Preserved from exact Figma shell; backend wiring comes later. |
| Staff Proof / UGC Review | `docs/figma-code/raw/staff-command-center/App.tsx`, `ProofUGCQueue` | `/staff` internal `Proof / UGC` button | Staff desktop | Proof / UGC | `src/components/figma-staff-command-center.tsx` | Proof cards, consent/visibility, queue summary, story-link submission, platform chips, share controls, and review actions | Preserved from exact Figma shell; uploads/publishing writes remain blocked. |
| Staff Best Practices | `docs/figma-code/raw/staff-command-center/App.tsx`, `BestPracticesLibrary` | `/staff` internal `Best Practices` button | Staff desktop | Best Practices | `src/components/figma-staff-command-center.tsx` | Best practice library with filters, recommendation cards, share controls, coach sends, and bookmarks | Preserved from exact Figma shell; share/send behavior remains future wiring. |
| Staff Campaign SOPs | `docs/figma-code/raw/staff-command-center/App.tsx`, `SOPLibraryScreen`, `SOPBuilderScreen`; `campaign-data.tsx` | `/staff` internal `Campaign SOPs` button | Staff/Admin backend | Campaign SOPs | `src/components/figma-staff-command-center.tsx`; `src/components/figma-sop-builder.tsx` | SOP library and builder workspace with steps, role matrix, completion rules, points/KPI, comm triggers, role preview, and version review tabs | Preserved from exact Figma shell; deeper `/admin/sop-library` remains future work. |
| Staff/Admin panel | `docs/figma-code/raw/staff-command-center/App.tsx`, `AdminRoleGate`, `AdminPanel`; `mock-data.tsx` | `/staff` internal `Admin` button and `/admin` | Staff/Admin backend | Admin | `src/components/figma-staff-command-center.tsx`; `src/components/figma-admin-panel.tsx`; `src/app/admin/page.tsx` | Staff shell shows the Figma admin role gate, then opens the redacted Figma DS Admin panel overlay; `/admin` renders the Figma-exported DS Admin vertical shell | `/admin` uses redacted secret references instead of raw Figma sample key strings; backend writes remain mock-safe. |
| SLT Prep | No current raw Figma export in this package | `/app/slt-prep` and `/slt-prep` | SLT Prep | SLT Prep | `src/app/app/slt-prep/page.tsx`; `src/app/slt-prep/page.tsx` | Traveler readiness workflow with explicit missing-Figma notice | Exact local Figma code is unavailable; route now shows `Figma page missing - implementation blocked` instead of pretending to be final Figma parity. |

## Implementation Rule

When a Figma source is listed above, the target route must either:

1. render a component ported from that source, with only data/auth/safety
   adaptations, or
2. render an explicit `Figma page missing - implementation blocked` placeholder
   when no exact source exists.

It must not render the Chapter page, a renamed Chapter page, or another
unrelated page as a convenience fallback.
