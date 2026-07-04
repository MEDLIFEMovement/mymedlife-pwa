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
| General member home | `/app` | `/app` | `src/app/app/member-home-page.tsx` + `FigmaMemberMobileHome` | `docs/figma-code/raw/member-app/App.tsx`, `StudentHome` | correct with gaps | Continue parity work from member export, but route does not reuse Chapter. |
| General Feed / Stories | `/proof-library` from member bottom nav | `/proof-library` or `/app/stories` | Figma-derived MEDLIFE Stories feed | `docs/figma-code/raw/member-app/App.tsx`, `StoriesScreen`; also `docs/figma-code/raw/student-leadership/StoriesScreen.tsx` | fixed in PR #170 | Route renders the student Stories feed and keeps uploads/publishing gated. |
| Member events | `/app/events` | `/app/events` | Dedicated member events page | `docs/figma-code/raw/member-app/App.tsx`, `EventsScreen` | correct with gaps | Page is not Chapter, but should continue moving toward exported Events screen. |
| Member points | `/app/points` | `/app/points` | Dedicated member points page | `docs/figma-code/raw/member-app/App.tsx`, `PointsLeaderboard` | correct with gaps | Page is not Chapter, but should continue moving toward exported Points screen. |
| Member active campaign | `/campaigns` from member home | `/campaigns` or `/campaigns/rush-month` | Figma-derived student campaign page | `docs/figma-code/raw/member-app/App.tsx`, `CampaignPage` | fixed in PR #170 | Route renders Rush Month phase, KPIs, role actions, good-state checklist, and event/points CTA. |
| Student Command Center / Home | `/leader?view=overview` | `/leader?view=overview` | `FigmaLeaderCommandCenter` overview | `docs/figma-code/raw/student-leadership/App.tsx`, `HomeScreen` | correct with gaps | Keep export-backed leader shell; make non-overview menu items render their own screens. |
| Student Command Center / Leaderboard | `/leader?view=leaderboard` | `/leader?view=leaderboard` | Figma-derived Chapter Leaderboard page | `docs/figma-code/raw/student-leadership/App.tsx`, `LeaderboardScreen` | fixed in PR #170 | Route renders leaderboard rows and benchmark context, not the overview body. |
| Student Command Center / Members | `/leader?view=members` | `/leader?view=members` | Figma-derived Member Pipeline page | `docs/figma-code/raw/student-leadership/App.tsx`, `MembersScreen` | fixed in PR #170 | Route renders member pipeline table with points, role, evidence, and next-step context. |
| Student Command Center / Committees | `/leader?view=committees` | `/leader?view=committees` | Figma-derived Event Committees page | `docs/figma-code/raw/student-leadership/App.tsx`, `CommitteesScreen` | fixed in PR #170 | Route renders committee cards and Luma/event posture. |
| Student Command Center / Events | `/leader?view=events` | `/leader?view=events` | Figma-derived Event Performance page | `docs/figma-code/raw/student-leadership/App.tsx`, `EventsScreen`; `CreateEventScreen.tsx` | fixed in PR #170 | Route renders Luma readback, RSVP, attendance, proof, and points context. |
| Student Command Center / Impact | `/leader?view=impact` | `/leader?view=impact` | Figma-derived Impact Dashboard page | `docs/figma-code/raw/student-leadership/App.tsx`, `ImpactScreen` | fixed in PR #170 | Route renders impact cards and highlights, not Leaderboard. |
| Student Command Center / Bridge Videos | `/leader?view=bridge_videos` | `/leader?view=bridge_videos` | Figma-derived Bridge Video Hub page | `docs/figma-code/raw/student-leadership/App.tsx`, `BridgeScreen` | fixed in PR #170 | Route renders bridge video metrics and entries. |
| Student Command Center / Succession | `/leader?view=succession` | `/leader?view=succession` | Figma-derived Succession Planning page | `docs/figma-code/raw/student-leadership/App.tsx`, `SuccessionScreen` | fixed in PR #170 | Route renders readiness summary and succession candidates. |
| Student Command Center / Feed Analytics | `/leader?view=feed_analytics` | `/leader?view=feed_analytics` | Figma-derived Feed Analytics page | `docs/figma-code/raw/student-leadership/App.tsx`, `FeedScreen` | fixed in PR #170 | Route renders feed metrics and post performance. |
| Staff Command Center / Chapters | `/staff?view=chapters` | `/staff?view=chapters` | `FigmaStaffCommandCenter` portfolio overview | `docs/figma-code/raw/staff-command-center/App.tsx`, `PortfolioOverview` | correct | Keep as Figma staff chapter page. |
| Staff Command Center / Campaigns | `/staff?view=campaigns` | `/staff?view=campaigns` | Figma-derived Campaign Operations page | `docs/figma-code/raw/staff-command-center/App.tsx`, `CampaignOps` | fixed in PR #170 | Real href renders campaign tabs, at-risk chapters, suggestions, and event/points table. |
| Staff Command Center / Proof / UGC | `/staff?view=proof_ugc` | `/staff?view=proof_ugc` | Figma-derived Proof / UGC Review Queue page | `docs/figma-code/raw/staff-command-center/App.tsx`, `ProofUGCQueue` | fixed in PR #170 | Real href renders proof cards, consent posture, and queue summary with writes disabled. |
| Staff Command Center / Best Practices | `/staff?view=best_practices` | `/staff?view=best_practices` | Figma-derived Best Practices Library page | `docs/figma-code/raw/staff-command-center/App.tsx`, `BestPracticesLibrary` | fixed in PR #170 | Real href renders filters, recommendation cards, and disabled share controls. |
| Staff Command Center / Campaign SOPs | `/staff?view=sops` | `/staff?view=sops` | Figma-derived Campaign SOP Builder preview | `docs/figma-code/raw/staff-command-center/App.tsx`, `SOPLibraryScreen`, `SOPBuilderScreen` | fixed in PR #170 | Staff route renders SOP library/builder preview with publishing disabled; deeper `/admin/sop-library` route remains future work. |
| Staff Command Center / Admin | `/staff?view=admin` | `/staff?view=admin` or `/admin` | Figma-derived System Health page in staff shell | `docs/figma-code/raw/staff-command-center/App.tsx`, `AdminRoleGate`, `AdminPanel`; login export has DS/Super Admin shells | fixed in PR #170 | Staff route renders integration posture, automation outbox, and audit log. |
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
