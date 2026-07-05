# Figma Route Audit

Date: 2026-07-04

Purpose: verify that every visible myMEDLIFE menu item routes to its own intended
Figma-backed page instead of silently reusing the Chapter page or another launch
lane placeholder.

Raw Figma code is preserved as a redacted archive at
`docs/figma-code/raw/figma-export-source-redacted-2026-07-04.zip`. Source paths
below refer to archive-internal paths.

## Current Findings

| Menu label | Current route | Expected route | Current rendered page/component | Expected Figma screen/code source | Status | Fix needed |
| --- | --- | --- | --- | --- | --- | --- |
| Login | `/login` | `/login` | `src/app/login/page.tsx` + `LoginForm` | `docs/figma-code/raw/login/App.tsx` | correct | Keep real auth form while preserving Figma login layout. |
| General member home | `/app` | `/app` | `src/app/app/member-home-page.tsx` + exact `FigmaMemberMobileHome` shell | `docs/figma-code/raw/member-app/App.tsx`, `StudentHome` | fixed in MED-508 | `/app` now copies the Figma mobile shell structure directly; screen changes are owned by exported buttons. |
| General Feed / Stories | `/proof-library` from member bottom nav | `/proof-library` or `/app/stories` | Figma-derived MEDLIFE Stories feed | `docs/figma-code/raw/member-app/App.tsx`, `StoriesScreen`; also `docs/figma-code/raw/student-leadership/StoriesScreen.tsx` | fixed in PR #170 | Route renders the student Stories feed and keeps uploads/publishing gated. |
| Member events | `/app/events` | `/app/events` | Dedicated member events page | `docs/figma-code/raw/member-app/App.tsx`, `EventsScreen` | correct with gaps | Page is not Chapter, but should continue moving toward exported Events screen. |
| Member points | `/app/points` | `/app/points` | Dedicated member points page | `docs/figma-code/raw/member-app/App.tsx`, `PointsLeaderboard` | correct with gaps | Page is not Chapter, but should continue moving toward exported Points screen. |
| Member active campaign | `/campaigns` from member home | `/campaigns` or `/campaigns/rush-month` | Figma-derived student campaign page | `docs/figma-code/raw/member-app/App.tsx`, `CampaignPage` | fixed in PR #170 | Route renders Rush Month phase, KPIs, role actions, good-state checklist, and event/points CTA. |
| Student Command Center / Home | `/leader` internal `Chapter Home` button | `/leader` internal `Chapter Home` button | Exact `FigmaLeaderCommandCenter` shell | `docs/figma-code/raw/student-leadership/App.tsx`, `HomeScreen` | fixed in MED-508 | `/leader` now copies the Figma shell structure directly; screen changes are owned by exported buttons. |
| Student Command Center / Leaderboard | `/leader` internal `Chapter Leaderboard` button | `/leader` internal `Chapter Leaderboard` button | Exact Figma leaderboard screen inside copied shell | `docs/figma-code/raw/student-leadership/App.tsx`, `LeaderboardScreen` | fixed in MED-508 | Button renders leaderboard rows and benchmark context. Backend wiring comes later. |
| Student Command Center / Members | `/leader` internal `Member Leaderboard` / `Member Profile` buttons | `/leader` internal member buttons | Exact Figma member screens inside copied shell | `docs/figma-code/raw/student-leadership/App.tsx`, `MembersScreen`, `ProfileScreen` | fixed in MED-508 | Buttons render member pipeline/profile table with points, role, evidence, and next-step context. |
| Student Command Center / Committees | `/leader` internal `Event Committees` button | `/leader` internal `Event Committees` button | Exact Figma committee screen inside copied shell | `docs/figma-code/raw/student-leadership/App.tsx`, `CommitteesScreen` | fixed in MED-508 | Button renders committee cards and event posture. |
| Student Command Center / Events | `/leader` internal `Event Performance` / `Create Event` buttons | `/leader` internal event buttons | Exact Figma event/create-event screens inside copied shell | `docs/figma-code/raw/student-leadership/App.tsx`, `EventsScreen`; `CreateEventScreen.tsx` | fixed in MED-508 | Buttons render event performance and create-event flow; live Luma writes remain blocked. |
| Student Command Center / Impact | `/leader` internal `Impact` button | `/leader` internal `Impact` button | Exact Figma impact screen inside copied shell | `docs/figma-code/raw/student-leadership/App.tsx`, `ImpactScreen` | fixed in MED-508 | Button renders impact cards and highlights. |
| Student Command Center / Bridge Videos | `/leader` internal `Bridge Videos` button | `/leader` internal `Bridge Videos` button | Exact Figma bridge screen inside copied shell | `docs/figma-code/raw/student-leadership/App.tsx`, `BridgeScreen` | fixed in MED-508 | Button renders bridge video metrics and entries. |
| Student Command Center / Succession | `/leader` internal `Succession` button | `/leader` internal `Succession` button | Exact Figma succession screen inside copied shell | `docs/figma-code/raw/student-leadership/App.tsx`, `SuccessionScreen` | fixed in MED-508 | Button renders readiness summary and succession builder. |
| Student Command Center / Feed Analytics | `/leader` internal `Feed Analytics` button | `/leader` internal `Feed Analytics` button | Exact Figma feed analytics screen inside copied shell | `docs/figma-code/raw/student-leadership/App.tsx`, `FeedScreen` | fixed in MED-508 | Button renders feed metrics and post performance. |
| Staff Command Center / Chapters | `/staff` internal `Chapters` button | `/staff` internal `Chapters` button | Exact Figma `FigmaStaffCommandCenter` portfolio overview | `docs/figma-code/raw/staff-command-center/App.tsx`, `PortfolioOverview` | fixed in MED-507 | `/staff` now copies the Figma shell structure directly; screen changes are owned by the exported buttons. |
| Staff Command Center / Campaigns | `/staff` internal `Campaigns` button | `/staff` internal `Campaigns` button | Exact Figma Campaign Operations screen inside copied shell | `docs/figma-code/raw/staff-command-center/App.tsx`, `CampaignOps` | fixed in MED-507 | Button renders campaign tabs, at-risk chapters, suggestions, and exported campaign table variants. |
| Staff Command Center / Proof / UGC | `/staff` internal `Proof / UGC` button | `/staff` internal `Proof / UGC` button | Exact Figma Proof / UGC Review Queue inside copied shell | `docs/figma-code/raw/staff-command-center/App.tsx`, `ProofUGCQueue` | fixed in MED-507 | Button renders story link submission, platform filters, proof cards, consent posture, queue summary, and review controls. |
| Staff Command Center / Best Practices | `/staff` internal `Best Practices` button | `/staff` internal `Best Practices` button | Exact Figma Best Practices Library inside copied shell | `docs/figma-code/raw/staff-command-center/App.tsx`, `BestPracticesLibrary` | fixed in MED-507 | Button renders filters, recommendation cards, share controls, coach sends, and bookmark controls. |
| Staff Command Center / Campaign SOPs | `/staff` internal `Campaign SOPs` button | `/staff` internal `Campaign SOPs` button | Exact Figma Campaign SOP Library and Builder inside copied shell | `docs/figma-code/raw/staff-command-center/App.tsx`, `SOPLibraryScreen`, `SOPBuilderScreen` | fixed in MED-507 | Button renders SOP library, builder tabs, and workflow controls. Deeper `/admin/sop-library` route remains future work. |
| Staff Command Center / Admin | `/staff` internal `Admin` button | `/staff` internal `Admin` button plus `/admin` | Exact Figma admin role gate, then redacted DS Admin panel overlay | `docs/figma-code/raw/staff-command-center/App.tsx`, `AdminRoleGate`, `AdminPanel`; login export has DS/Super Admin shells | fixed in MED-507 | Button renders role gate and overlays the redacted Figma AdminPanel; `/admin` still renders the standalone DS Admin shell. |
| Admin backend | `/admin` | `/admin` | Figma-derived DS Admin shell with vertical backend menu | `docs/figma-code/raw/staff-command-center/mock-data.tsx`, `AdminPanel`, `Sidebar`, `OverviewPage`, `UsersPage`, `SystemHealthPage`, `ApiKeysPage` | fixed in PR TBD | Route renders the exported admin shell with Users, Chapters, Modules, Luma Events, Points, Integrations, Audit Logs, System Health, API Keys, MCP Connections, and Settings. Secret-like Figma sample values are redacted before shipping. |
| Chapter | `/chapter` | `/chapter` | Legacy chapter surface | No current dedicated route-level Figma export beyond leader/staff chapter screens | correct route, visual gap | Keep Chapter page only for Chapter route. Do not reuse it elsewhere. |
| SLT Prep | `/app/slt-prep`, `/slt-prep` | `/app/slt-prep` and/or `/slt-prep` | Existing traveler readiness workflow with explicit missing-Figma notice | SLT Prep Figma export not present in local code package | correct placeholder | `/app/slt-prep` now renders the SLT Prep surface. It states `Figma page missing - implementation blocked` and does not reuse Chapter. |
| SOP Builder | `/staff?view=sops` | `/staff?view=sops`; future `/admin/sop-library` and `/admin/sop-builder/[campaignSlug]` | Figma-derived Campaign SOP Builder preview in staff shell | `docs/figma-code/raw/staff-command-center/App.tsx`, SOP imports | fixed for visible staff nav | Staff route renders SOP library/builder preview with publishing disabled. Deeper admin SOP routes remain future work and are not visible nav targets in this pass. |

## Route Reuse Problems To Fix First

1. Unsupported staff subviews without local Figma pages (`feed_studio`,
   `feed_analytics`, `hubspot`) now show explicit missing-Figma states instead
   of parking into Chapters; they still need real Figma source before full
   implementation.
2. `/slt-prep` still shows an explicit missing-Figma notice while retaining the
   safe traveler workflow until exact Figma source is available.

## Immediate Fix Order

1. Deeper SOP Builder admin routes if staff preview is not enough for workflow
   configuration.
2. Replace the `/slt-prep` notice with an exact Figma port when that source file
   is approved.
