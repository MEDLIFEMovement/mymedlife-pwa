# UI Functionality Wiring Audit

Date: 2026-07-04

Scope: `/login`, `/app`, `/leader`, `/staff`, `/admin`, `/app/slt-prep`, Rush Month/event/points/feed/story/campaign/admin routes.

Status values:

- `wired_live` - connected to production-safe app behavior.
- `wired_staging` - connected to local/staging/mock-safe behavior only.
- `disabled_hidden` - intentionally not shown.
- `disabled_visible` - visible but explicitly unavailable.
- `placeholder_blocked` - visual placeholder or staged local behavior that must not imply a live write.
- `needs_decision` - product/security decision required before wiring.

## Current Top-Level Finding

The exact Figma shells are present for the member app, Student Leadership Center, and Staff Command Center, but most Figma controls are still shell/state controls. The only safe path is to wire one action family at a time, starting with events, RSVP, attendance, points, and leaderboards.

## `/login`

| Label / control | Component | Intended role | Current behavior | Target route/service | Permission | Feature flag | Status |
|---|---|---:|---|---|---|---|---|
| Email/password sign-in | `src/components/login-form.tsx` | all | Auth/session entry and local review auth posture | `src/app/login/actions.ts`, `src/services/landing-route.ts` | session role | staging auth flags | `wired_staging` |
| Workspace option cards | `src/app/login/page.tsx` | all | Entry guidance only; clicked card is not authority | role-derived redirect | actual assigned role | none | `wired_staging` |
| Root redirect | `src/app/page.tsx` | all | Redirects signed-in actors to owned workspace | `getLandingRouteForActor` | actual assigned role | none | `wired_staging` |

## `/app` Member Mobile Shell

| Label / control | Component | Intended role | Current behavior | Target route/service | Permission | Feature flag | Status |
|---|---|---:|---|---|---|---|---|
| Bottom nav: Home, Campaign, Events, Points, Profile | `src/components/figma-member-mobile-home.tsx` | member/traveler | Internal Figma shell navigation | future route-backed mobile tabs | member workspace | none | `wired_staging` |
| Start next action / action cards | `figma-member-mobile-home.tsx` | member | Opens local Action Detail screen | `src/services/action-start-write.ts` later | assigned member | action-start write flags | `placeholder_blocked` |
| Submit evidence | `figma-member-mobile-home.tsx` | member | Opens local evidence/confirmation screens | `src/services/proof-submission-write.ts` later | assigned member | proof metadata/upload flags | `placeholder_blocked` |
| Events list and event detail | `figma-member-mobile-home.tsx` | member | Opens local event/detail screens | `src/services/rush-month-event-detail.ts`, `src/services/rush-month-event-rsvp.ts` | member workspace | Luma read/write flags | `wired_staging` |
| RSVP / check-in / points impact | `figma-member-mobile-home.tsx` | member | Visible local flow, no live external write | Luma staging pilot/write path later | member workspace | Luma RSVP/attendance flags | `placeholder_blocked` |
| Points and chapter leaderboard | `figma-member-mobile-home.tsx` | member | Local/readback leaderboard screen | `src/services/launch-lane-points-readback.ts` | member workspace | none | `wired_staging` |
| Role preview buttons | `figma-member-mobile-home.tsx` | staff/admin preview | Local preview-only screens | `src/services/workspace-access.ts` | permitted preview role | none | `placeholder_blocked` |
| Stories cards/likes/share | `figma-member-mobile-home.tsx` | member | Local story UI only | future feed/story services | member workspace | feed publish flags | `placeholder_blocked` |

## `/leader` Student Leadership Center

| Label / control | Component | Intended role | Current behavior | Target route/service | Permission | Feature flag | Status |
|---|---|---:|---|---|---|---|---|
| Sidebar navigation groups | `src/components/figma-leader-command-center.tsx` | leader/e-board | Distinct Figma-owned screen state | eventual route-backed deep links | leader workspace | none | `wired_staging` |
| Chapter Home | `figma-leader-command-center.tsx` | leader | Renders leadership dashboard | `src/services/chapter-leader-command-center.ts` | leader workspace | none | `wired_staging` |
| Chapter Leaderboard | `figma-leader-command-center.tsx` | leader | Renders chapter ranking view | points/readback services | leader workspace | none | `wired_staging` |
| Member Leaderboard / Profile | `figma-leader-command-center.tsx` | leader | Opens member list/profile locally | `src/services/member-leaderboard-workspace.ts` | chapter-scoped leader | none | `wired_staging` |
| Event Committees | `figma-leader-command-center.tsx` | leader | Local committee surface | future committee service | chapter-scoped leader | none | `wired_staging` |
| Event Performance | `figma-leader-command-center.tsx` | leader | Local event analytics/NPS | event/attendance services | leader workspace | Luma read flags | `wired_staging` |
| Create Event | `src/components/figma-leader-create-event-screen.tsx` | leader | Stages event locally and shows no-send state | Luma create/update path later | leader workspace | Luma event-write flags | `placeholder_blocked` |
| Assign Task modal | `figma-leader-command-center.tsx` | leader | Local modal/confirmation only | `src/services/assignment-create-write.ts` | chapter-scoped leader | assignment write flags | `placeholder_blocked` |
| Promote Emerging Leader modal | `figma-leader-command-center.tsx` | leader | Local modal/confirmation only | future role/pipeline service | chapter-scoped leader | role-change flags | `placeholder_blocked` |
| Impact / Bridge Videos / MEDLIFE Stories | Figma leader components | leader | Local content views | future proof/feed/story services | leader workspace | feed/proof flags | `placeholder_blocked` |
| Succession / Current Leaders / Values / Training | Figma leader components | leader | Local shell surfaces | future leadership pipeline services | leader workspace | none | `wired_staging` |
| Profile view switcher | `figma-leader-command-center.tsx` | multi-role user | Local visual switcher only | workspace account menu/preview links | assigned roles | none | `needs_decision` |

## `/staff` Staff Command Center

| Label / control | Component | Intended role | Current behavior | Target route/service | Permission | Feature flag | Status |
|---|---|---:|---|---|---|---|---|
| Top nav: Chapters, Campaigns, Proof/UGC, Best Practices, Campaign SOPs, Admin | `src/components/figma-staff-command-center.tsx` | staff/coach/admin | Figma-owned screen state | future route-backed staff views | staff workspace | none | `wired_staging` |
| Portfolio search/filter/sort/table | `figma-staff-command-center.tsx` | staff/coach | Local Figma table filtering/drawer | `src/services/staff-command-center.ts` | staff workspace | none | `wired_staging` |
| Chapter detail drawer / NPS modal | `figma-staff-command-center.tsx` | staff/coach | Local drawer/modal; no send | future NPS/event service | staff workspace | external-send flags | `placeholder_blocked` |
| Campaign operations tabs | `figma-staff-command-center.tsx` | staff | Local campaign tables | workflow/SOP runtime later | staff workspace | campaign flags | `wired_staging` |
| Proof/UGC review queue | `figma-staff-command-center.tsx` | staff/admin | Local review UI only | proof sharing/review services | staff/admin | proof publish flags | `placeholder_blocked` |
| Best Practices library actions | `figma-staff-command-center.tsx` | staff | Local share/send/bookmark only | feed/outbox later | staff workspace | external-send flags | `placeholder_blocked` |
| Campaign SOP Builder | `figma-staff-command-center.tsx`, `figma-sop-builder.tsx` | staff/admin | Local builder shell | `/admin/sop-library`, `/admin/sop-builder/*` | staff/admin by policy | workflow flags | `wired_staging` |
| Admin entry | `figma-staff-command-center.tsx` | DS/admin | Opens redacted Figma admin overlay only after role choice | `/admin` route family | DS Admin/Super Admin | none | `wired_staging` |

## `/admin`

| Label / control | Component / route | Intended role | Current behavior | Target route/service | Permission | Feature flag | Status |
|---|---|---:|---|---|---|---|---|
| Admin home / vertical admin lanes | `src/app/admin/page.tsx` | DS/Super Admin | Secure admin overview | admin review services | DS Admin/Super Admin | none | `wired_staging` |
| Users / Chapters admin | `/admin/users`, `/admin/chapters` | DS/Super Admin | Audited local/staging write panels where approved | admin management write services | DS/Super Admin | admin write flags | `wired_staging` |
| Audit log | `/admin/audit-log` | DS/Super Admin | Readback/review surface | `src/services/admin-audit-log-review.ts` | DS/Super Admin | none | `wired_staging` |
| Integration outbox | `/admin/integration-outbox` | DS/Super Admin | Outbox safety/readback | `src/services/admin-integration-outbox-workspace.ts` | DS/Super Admin | external-send flags | `wired_staging` |
| Luma integration status | `/admin/integrations/luma` | DS/Super Admin | Secret-free provider mode, safe test posture, last sync, error log, and outbox status | `src/services/admin-luma-integration-status.ts` | DS Admin/Super Admin | Luma env flags | `wired_staging` |
| API keys / provider setup | Admin shell | DS/Super Admin | Must remain secret-free | future server-only secret abstraction | DS/Super Admin + step-up | provider flags | `needs_decision` |

## `/app/slt-prep`

| Label / control | Component / route | Intended role | Current behavior | Target route/service | Permission | Feature flag | Status |
|---|---|---:|---|---|---|---|---|
| SLT Prep entry | `/app/slt-prep`, `/slt-prep/*` | eligible traveler | Routed shell/module exists | SLT readiness services | traveler eligibility | launch lane traveler flag | `wired_staging` |
| Checklist/forms/payment/flights/meetings | SLT routes | traveler/staff | Mock/readiness views | future traveler writes/storage | traveler/staff | SLT write flags | `placeholder_blocked` |

## Safety Notes For This PR

- The Figma Create Event form now says `Event Staged`, not `Event Published`, and explicitly says no email, WhatsApp/SMS, Luma write, external send, or production publish occurred.
- Chapter type now uses the approved values `high_school`, `college_university`, and `needs_review`; admin list/detail/forms, staff chapter list/detail, and leader chapter header show the approved labels.
- PR #125 contains older Luma pilot work but is too stale to merge safely; it currently conflicts with 86 files against `main`.
- HubSpot is not part of this run.
