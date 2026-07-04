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
| General Student App | `docs/figma-code/raw/member-app/App.tsx` | `/app` | Student mobile | Home | `src/components/figma-member-mobile-home.tsx` | Mobile-first student home with blue header, priority action, events, points, campaign, stories, bottom nav | Home is partially ported; subpages need stricter route/page mapping. |
| Member campaign | `docs/figma-code/raw/member-app/App.tsx`, `CampaignPage` | `/campaigns`, `/campaigns/rush-month`, or `/rush-month` | Student mobile | Active Campaign | `src/components/figma-member-campaigns-page.tsx`; existing campaign detail pages | Rush Month campaign page with phase, KPIs, role actions, evidence, points, and route-specific actions | `/campaigns` wired in PR #170; campaign detail routes can continue deeper parity later. |
| Member events | `docs/figma-code/raw/member-app/App.tsx`, `EventsScreen`, `EventDetailScreen`, `RsvpConfirmScreen`, `CheckInScreen` | `/app/events`, `/app/events/[eventId]` | Student mobile | Events | `src/app/app/events/page.tsx`, event detail route | Event feed, campaign filters, event detail, RSVP confirmation, check-in, points reminder | Current route is dedicated but not yet a full code port. |
| Member points | `docs/figma-code/raw/member-app/App.tsx`, `PointsLeaderboard` | `/app/points` | Student mobile | Points | `src/app/app/points/page.tsx` | Points and recognition page with chapter leaderboard and point explanations | Current route is dedicated but not yet a full code port. |
| Member Stories | `docs/figma-code/raw/member-app/App.tsx`, `StoriesScreen` | `/proof-library` or `/app/stories` | Student mobile | Stories | `src/components/figma-member-stories-page.tsx` | MEDLIFE Stories feed with filters and story cards | `/proof-library` wired in PR #170 with uploads/publishing still gated. |
| Student Leadership Command Center | `docs/figma-code/raw/student-leadership/App.tsx` | `/leader?view=overview` | Leader desktop | Home | `src/components/figma-leader-command-center.tsx` | Desktop sidebar command center with BC sample, health score, metrics, risk alerts, priorities, quick actions | Overview exists; route-specific screens still need mapping. |
| Leader leaderboard | `docs/figma-code/raw/student-leadership/App.tsx`, `LeaderboardScreen` | `/leader?view=leaderboard` | Leader desktop | Leaderboard | `src/components/figma-leader-command-center.tsx` | Leaderboard screen with metrics, chapter/member rankings, benchmark context | Wired in PR #170. |
| Leader members/profile | `docs/figma-code/raw/student-leadership/App.tsx`, `MembersScreen`, `ProfileScreen` | `/leader?view=members`, `/leader?view=member_profile` | Leader desktop | Members | `src/components/figma-leader-command-center.tsx` | Member pipeline/profile table with role and points context | Wired in PR #170. |
| Leader committees | `docs/figma-code/raw/student-leadership/App.tsx`, `CommitteesScreen` | `/leader?view=committees` | Leader desktop | Committees | `src/components/figma-leader-command-center.tsx` | Committee overview and activity health | Wired in PR #170. |
| Leader events/create event | `docs/figma-code/raw/student-leadership/App.tsx`, `CreateEventScreen.tsx` | `/leader?view=events`, quick action create event | Leader desktop | Events, Create Event | `src/components/figma-leader-command-center.tsx` | Event table, attendance/NPS posture, Luma readback, RSVP, attendance, and points | Wired in PR #170; full modal-style Create Event flow remains future work. |
| Leader impact/bridge/succession/feed/training | `docs/figma-code/raw/student-leadership/App.tsx`, `StoriesScreen.tsx`, `TrainingScreen.tsx` | `/leader?view=impact`, `/leader?view=bridge_videos`, `/leader?view=succession`, `/leader?view=feed_analytics` | Leader desktop | Impact, Bridge Videos, Succession, Feed Analytics | `src/components/figma-leader-command-center.tsx` | Distinct exported leader screens | Core route bodies wired in PR #170; training and stories remain outside the current sidebar. |
| Staff Command Center | `docs/figma-code/raw/staff-command-center/App.tsx` | `/staff?view=chapters` | Staff desktop | Chapters | `src/components/figma-staff-command-center.tsx` | Dark top nav, portfolio overview, filters, chapter table, detail drawer | Implemented for Chapters. |
| Staff Campaign Operations | `docs/figma-code/raw/staff-command-center/App.tsx`, `CampaignOps` | `/staff?view=campaigns` | Staff desktop | Campaigns | `src/components/figma-staff-command-center.tsx` | Campaign tabs, at-risk chapters, suggested actions, and chapter event/points table | Wired in PR #170; deeper YoY tables can continue later. |
| Staff Proof / UGC Review | `docs/figma-code/raw/staff-command-center/App.tsx`, `ProofUGCQueue` | `/staff?view=proof_ugc` | Staff desktop | Proof / UGC | `src/components/figma-staff-command-center.tsx` | Proof cards, consent/visibility, queue summary, share controls | Wired in PR #170 with upload/embed/publish writes blocked. |
| Staff Best Practices | `docs/figma-code/raw/staff-command-center/App.tsx`, `BestPracticesLibrary` | `/staff?view=best_practices` | Staff desktop | Best Practices | `src/components/figma-staff-command-center.tsx` | Best practice library with filters, recommendation cards, share controls | Wired in PR #170 with share controls disabled. |
| Staff Campaign SOPs | `docs/figma-code/raw/staff-command-center/App.tsx`, `SOPLibraryScreen`, `SOPBuilderScreen`; `campaign-data.tsx` | `/staff?view=sops` | Staff/Admin backend | Campaign SOPs | `src/components/figma-staff-command-center.tsx` | SOP library and builder workspace with tabs and campaign workflow data | Wired in PR #170 as read-only staff preview; deeper `/admin/sop-library` remains future work. |
| Staff/Admin panel | `docs/figma-code/raw/staff-command-center/App.tsx`, `AdminRoleGate`, `AdminPanel`; `mock-data.tsx` | `/staff?view=admin` and `/admin` | Staff/Admin backend | Admin | `src/components/figma-staff-command-center.tsx`; `src/app/admin/page.tsx` | Staff shell shows System Health preview; `/admin` keeps the secure backend | Full `/admin` route now shows explicit missing-Figma notice until a dedicated admin export is available. |
| SLT Prep | No current raw Figma export in this package | `/app/slt-prep` and `/slt-prep` | SLT Prep | SLT Prep | `src/app/app/slt-prep/page.tsx`; `src/app/slt-prep/page.tsx` | Traveler readiness workflow with explicit missing-Figma notice | Exact local Figma code is unavailable; route now shows `Figma page missing - implementation blocked` instead of pretending to be final Figma parity. |

## Implementation Rule

When a Figma source is listed above, the target route must either:

1. render a component ported from that source, with only data/auth/safety
   adaptations, or
2. render an explicit `Figma page missing - implementation blocked` placeholder
   when no exact source exists.

It must not render the Chapter page, a renamed Chapter page, or another
unrelated page as a convenience fallback.
