# Route To Page Map

Date: 2026-07-05

Purpose: give reviewers a plain-language map from visible launch-lane routes to the page or shell that owns the experience.

## Public And Entry Routes

| Route | Page/shell | Primary purpose | Guard |
|---|---|---|---|
| `/` | role-aware handoff | Redirect or hand off users to the correct workspace. | session/actor-derived route |
| `/login` | login page + login form | One entry point for all workspaces. | public entry; role decides redirect after auth |
| `/offline` | offline fallback | Safe recovery shell with no private data writes. | public/offline |
| `/profile` | profile workspace | Role, scope, logout, and safe next route. | signed-in actor |

## Member Routes

| Route | Page/shell | Primary purpose | Guard |
|---|---|---|---|
| `/app` | `FigmaMemberMobileHome` | Mobile-first member home with events, RSVP, points, leaderboard, and next actions. | member workspace |
| `/app/events` | member events page | Route-level event list for RSVP, attendance, and points context. | member workspace |
| `/app/events/[eventId]` | member event detail page | Event readback with RSVP state, attendance impact, and leaderboard CTA. | member workspace |
| `/app/points` | member points page | Member points, recent event awards, and chapter leaderboard. | member workspace |
| `/app/slt-prep` | SLT Prep alias | Traveler readiness module entry. | traveler eligibility / launch-safe preview |

## Student Leader Routes

| Route | Page/shell | Primary purpose | Guard |
|---|---|---|---|
| `/leader?view=overview` | `FigmaLeaderCommandCenter` | Chapter leadership home and launch metrics. | leader workspace |
| `/leader?view=leaderboard` | leader shell screen | Chapter leaderboard and points ranking. | leader workspace |
| `/leader?view=members` | leader shell screen | Member leaderboard and chapter member performance. | leader workspace |
| `/leader?view=member_profile` | leader shell screen | Member profile review. | leader workspace |
| `/leader?view=committees` | leader shell screen | Event committees. | leader workspace |
| `/leader?view=events` | leader shell screen | Event performance, RSVP, attendance, NPS, and points posture. | leader workspace |
| `/leader?view=create_event` | leader shell screen | Stage a new event; no live Luma write in this pass. | leader workspace |
| `/leader?view=impact` | leader shell screen | Impact metrics. | leader workspace |
| `/leader?view=bridge_videos` | leader shell screen | Bridge video hub. | leader workspace |
| `/leader?view=stories` | leader shell screen | MEDLIFE Stories. | leader workspace |
| `/leader?view=leaders` | leader shell screen | Current leaders. | leader workspace |
| `/leader?view=succession` | leader shell screen | Leadership succession. | leader workspace |
| `/leader?view=values` | leader shell screen | MEDLIFE values. | leader workspace |
| `/leader?view=training` | leader shell screen | Leadership and resources hub. | leader workspace |

## Staff Routes

| Route | Page/shell | Primary purpose | Guard |
|---|---|---|---|
| `/staff?view=chapters` | `FigmaStaffCommandCenter` | Portfolio overview, chapter search/filter/sort, chapter type, event totals, RSVP, attendance, and points columns. | staff workspace |
| `/staff?view=events` | staff shell screen | RSVP, attendance, and point readiness by chapter. | staff workspace |
| `/staff?view=leaderboard` | staff shell screen | Organization leaderboard ranked by attendance-backed points. | staff workspace |
| `/staff?view=campaigns` | staff shell screen | Campaign operations. | staff workspace |
| `/staff?view=proof_ugc` | staff shell screen | Proof/UGC review queue, still mock-safe. | staff workspace |
| `/staff?view=best_practices` | staff shell screen | Best practices library. | staff workspace |
| `/staff?view=sops` | staff shell screen | Campaign SOP builder shell. | staff workspace |
| `/staff?view=admin` | staff shell screen | Staff admin/system health entry. | staff workspace plus local gate |

## Admin Routes

| Route | Page/shell | Primary purpose | Guard |
|---|---|---|---|
| `/admin` | `FigmaAdminPanel` | Backend overview and visual admin shell. | admin/DS/super admin |
| `/admin/users` | admin users page | User access review and disabled user-management posture. | admin/DS/super admin |
| `/admin/chapters` | admin chapters page | Chapter records, chapter type, Luma posture, and event/points readiness. | admin/DS/super admin |
| `/admin/access` | admin access matrix | Role-to-workspace visibility and access review. | admin/DS/super admin |
| `/admin/launch-gate` | launch gate page | Production blockers and go/no-go posture. | admin/DS/super admin |
| `/admin/audit-log` | audit log page | Audit posture and readback safety. | admin/DS/super admin |
| `/admin/integration-outbox` | outbox review page | Integration send posture and zero-send review. | admin/DS/super admin |
| `/admin/integrations/luma` | Luma status page | Secret-free Luma mode, linked-event posture, and blocked write controls. | DS/super admin |
| `/admin/pilot-scope` | pilot scope page | One-chapter / first-five-chapter rollout scope and boundaries. | admin/DS/super admin |

## Visible But Outside The Invite Gate

These routes/modules may exist in code and may remain visible, but they are not part of the launch-lane smoke target:

- broad Rush Month legacy routes
- broad SLT Prep sidebar entry
- proof library upload
- phase-3 workflow/SOP backend routes
- general coach legacy route
- non-Luma integrations
- production API key management

They should stay parked, disabled, read-only, or explicitly blocked until their own launch slice is approved. Mere visibility should not block the 30-chapter invite gate; missing launch-critical event, RSVP, attendance, points, leaderboard, login, workspace, audit, or outbox proof still should.
