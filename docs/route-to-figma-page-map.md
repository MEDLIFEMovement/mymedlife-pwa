# Route to Figma Page Map

Date: 2026-07-05

This map records the launch-critical routes and the Figma-derived shell/page that should own them.

## Member Mobile App

| Nav label | Route | Figma source | Current component | Status |
|---|---|---|---|---|
| Home | `/app` | myMEDLIFE App Prototype | `FigmaMemberMobileHome` | Active |
| Events | `/app/events` | myMEDLIFE App Prototype event flow | App event list route | Active |
| Event Detail | `/app/events/[eventId]` | myMEDLIFE App Prototype event detail flow | App event detail route with student quick nav | Active |
| Points | `/app/points` | myMEDLIFE App Prototype points flow | App points route | Active |
| Profile | `/profile` | myMEDLIFE App Prototype profile area | `MemberProfilePanel` | Active |
| SLT Prep | `/app/slt-prep` | SLT Prep mockup | `SltPrepPage` via app route alias | Active |

## Student Leader Command Center

| Menu label | Route | Figma page/screen | Current component | Status |
|---|---|---|---|---|
| Chapter Home | `/leader?view=overview` | Student Leadership Command Center home | `FigmaLeaderCommandCenter` | Active |
| Chapter Leaderboard | `/leader?view=leaderboard` | Chapter Leaderboard | `LeaderboardScreen` with ranked chapter table | Active |
| Feed Analytics | `/leader?view=feed_analytics` | Feed Analytics | `FeedScreen` | Active |
| Member Leaderboard | `/leader?view=members` | Member Leaderboard | `MembersScreen` | Active |
| Member Profile | `/leader?view=member_profile` | Member Profile | `ProfileScreen` | Active |
| Event Committees | `/leader?view=committees` | Event Committees | `CommitteesScreen` | Active |
| Event Performance | `/leader?view=events` | Event Performance | `EventsScreen` | Active |
| Create Event | `/leader?view=create_event` | Create Event | `CreateEventForm` | Active |
| Impact | `/leader?view=impact` | Impact | `ImpactScreen` | Active |
| Bridge Videos | `/leader?view=bridge_videos` | Bridge Videos | `BridgeScreen` | Active |
| MEDLIFE Stories | `/leader?view=stories` | MEDLIFE Stories | `MedlifeStoriesScreen` | Active |
| Current Leaders | `/leader?view=leaders` | Current Leaders | `LeadersScreen` | Active |
| Succession | `/leader?view=succession` | Succession | `SuccessionScreen` | Active |
| Values | `/leader?view=values` | Values | `ValuesScreen` | Active |
| Leadership Training | `/leader?view=training` | Leadership Training | `TrainingScreen` | Active |
| Campaigns / Fundraising / SLT / Proof Review / Settings | none | Not yet available group | Disabled buttons with explanatory title | Intentionally disabled |

## Staff Command Center

| Menu label | Route | Figma page/screen | Current component | Status |
|---|---|---|---|---|
| Chapters | `/staff?view=chapters` | Staff Command Center portfolio | `PortfolioOverview` | Active |
| Events | `/staff?view=events` | Staff event operations | `StaffLaunchEventsOperations` inside Figma staff shell | Active |
| Leaderboard | `/staff?view=leaderboard` | Organization points leaderboard | `StaffLaunchOrganizationLeaderboard` inside Figma staff shell | Active |
| Campaigns | `/staff?view=campaigns` | Campaign Operations | `CampaignOps` | Active |
| Proof / UGC | `/staff?view=proof_ugc` | Proof / UGC Review Queue | `ProofUGCQueue` | Active |
| Best Practices | `/staff?view=best_practices` | Best Practices Library | `BestPracticesLibrary` | Active |
| Campaign SOPs | `/staff?view=sops` | Campaign SOP Builder | Figma SOP library/builder | Active |
| Admin | `/staff?view=admin` | Staff system health gate | `AdminRoleGate` / `FigmaAdminPanel` | Active with DS/Super Admin gate |

## Admin Backend

| Menu label | Route | Figma page/screen | Current component | Status |
|---|---|---|---|---|
| Overview | `/admin` | Admin backend shell | `FigmaAdminPanel` / admin route | Active |
| Users | `/admin/users` | Admin users | `AdminUsersManagementPanel` | Active |
| Chapters | `/admin/chapters` | Admin chapters | `AdminChaptersManagementPanel` | Active |
| Luma Events | `/admin/integrations/luma` | Luma integration status | Luma integration route | Active |
| Audit Logs | `/admin/audit-log` | Audit posture | Audit route | Active |
| Integration Outbox | `/admin/integration-outbox` | Integration safety | Outbox route | Active |
| Visual console menu | `/admin` local screen state | Admin backend shell | `FigmaAdminPanel` primary menu | Active |
| MCP Connections | none in primary menu | Disabled launch module | Disabled Modules group only | Disabled in launch mode |

## Launch Mode Boundary

The active launch lane remains Events, RSVP, attendance, points, leaderboards, simple staff summaries, users/chapters/admin visibility, and Luma status. Unfinished broader modules should stay disabled, gated, or visibly marked until explicitly reopened.
