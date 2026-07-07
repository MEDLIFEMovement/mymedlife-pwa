# Route Map

Last updated: 2026-07-07

This is the DS-readable route ownership map. It names what each route is for and whether it belongs to the current launch lane.

## Entry And Account Routes

| Route | Audience | Current purpose | Launch lane? | Notes |
| --- | --- | --- | --- | --- |
| `/` | all users | Role-aware handoff to the right workspace. | Yes | Depends on session/actor routing. |
| `/login` | all users | Single sign-in entry. | Yes | Role cards are guidance only; real auth decides access. |
| `/auth/callback` | auth flow | Supabase callback and redirect handling. | Yes | Needed before secure invite/reset-link account flows. |
| `/auth/set-password` | invited users | Secure password-set flow. | Yes | Use this instead of emailing passwords. |
| `/profile` | signed-in users | Profile, role, scope, logout, next route. | Yes | Must stay tied to real session role. |
| `/offline` | all users | Safe offline fallback. | Support | No writes. |

## Member App Routes

| Route | Owner shell | Current purpose | Launch lane? | Current posture |
| --- | --- | --- | --- | --- |
| `/app` | General Member App | Mobile home with next actions, events, RSVP/check-in entry, points, campaigns, stories. | Yes | Figma shell with local/Test/preview data. |
| `/app/events` | General Member App | Event list and RSVP/attendance context. | Yes | Route-backed, launch-focused. |
| `/app/events/[eventId]` | General Member App | Event detail, RSVP, check-in, points reminder. | Yes | Local/mock-safe proof, not Luma production writeback. |
| `/app/points` | General Member App | Member points and leaderboard view. | Yes | Readback/local proof only until production points materialization is approved. |
| `/app/stories` | General Member App | Member Stories feed inside mobile shell. | No | Preview/read-only. |
| `/app/slt-prep` | General Member App / SLT Prep | Traveler readiness entry alias. | No | Preview/Test-labeled; active PR #395 may adjust handoff. |

## Student Leader Routes

| Route | Owner shell | Current purpose | Launch lane? | Current posture |
| --- | --- | --- | --- | --- |
| `/leader` | Student Leadership Command Center | Main leader workspace with Figma sidebar and screen state. | Yes | Figma shell, source-faithful, route/query-backed. |
| `/leader?view=overview` | Student Leadership | Chapter health and priority view. | Yes | Read/preview posture. |
| `/leader?view=events` | Student Leadership | Event performance, RSVP, attendance, points posture. | Yes | Create/update provider writes blocked. |
| `/leader?view=create_event` | Student Leadership | Event creation preview. | Yes | Local/preview; live Luma writes blocked. |
| `/leader?view=leaderboard` | Student Leadership | Chapter/member rankings and points. | Yes | Readback only. |
| `/leader?view=members` | Student Leadership | Member pipeline and leaderboard. | Yes | Read/preview posture. |
| `/leader?view=committees` | Student Leadership | Event committee view. | Support | Read/preview posture. |
| `/leader?view=impact`, `/leader?view=bridge_videos`, `/leader?view=stories`, `/leader?view=succession`, `/leader?view=training`, `/leader?view=values` | Student Leadership | Broader leader shell screens. | No | Visible but not current invite-gate proof. Provider-looking actions must stay blocked. |

## Staff Routes

| Route | Owner shell | Current purpose | Launch lane? | Current posture |
| --- | --- | --- | --- | --- |
| `/staff` | Staff Command Center | Portfolio overview and top-level staff shell. | Yes | Figma shell with TEST/preview data. |
| `/staff?view=chapters` | Staff | Chapter list, filters, health, type, events, attendance, points columns. | Yes | Read-only portfolio posture. |
| `/staff?view=events` | Staff | RSVP, attendance, and event readiness by chapter. | Yes | Readback only. |
| `/staff?view=leaderboard` | Staff | Organization points leaderboard. | Yes | Readback only. |
| `/staff?view=campaigns` | Staff | Campaign operations shell. | No | Preview/handoff posture. |
| `/staff?view=proof_ugc` | Staff | Proof/UGC review shell. | No | Review/publish/share writes blocked. |
| `/staff?view=best_practices` | Staff | Best-practices library. | No | Sharing/sends blocked. |
| `/staff?view=sops` | Staff | Campaign SOP builder shell. | No | Future SOP layer; do not promote as launch-ready. |
| `/staff?view=admin` | Staff/Admin | Embedded DS Admin gate. | Yes | Admin actions blocked/preview unless approved. |

## Admin Routes

| Route | Owner shell | Current purpose | Launch lane? | Current posture |
| --- | --- | --- | --- | --- |
| `/admin` | DS Admin | Backend overview and DS Admin vertical shell. | Yes | Figma/admin shell; active PR #394 may route-back views. |
| `/admin/users` | DS Admin | User review and management surface. | Yes | Guarded; writes must stay audited/approved. |
| `/admin/chapters` | DS Admin | Chapter records, chapter type, Luma posture. | Yes | Guarded; writes must stay audited/approved. |
| `/admin/access` | DS Admin | Role-to-workspace access review. | Yes | Guarded. |
| `/admin/audit-log` | DS Admin | Audit posture and readback. | Yes | Readback/review. |
| `/admin/integration-outbox` | DS Admin | Zero-send and provider-send safety review. | Yes | Live sends disabled. |
| `/admin/integrations/luma` | DS Admin | Luma status/mapping posture. | Yes | Read-only/status unless later approved. |
| `/admin/launch-gate`, `/admin/release-readiness`, `/admin/pilot-scope` | DS Admin | Rollout and launch readiness views. | Yes | Evidence review only. |
| `/admin/*write*`, `/admin/operations`, `/admin/system-health`, `/admin/database-security`, `/admin/master-data` | DS Admin | Backend/admin planning and drill surfaces. | Support | Many are review, drill, or gated write-readiness surfaces. |

## Parked Or Non-Launch Routes

| Route family | Why parked |
| --- | --- |
| `/rush-month/*` | Legacy/broader campaign surfaces. Use only if a current builder explicitly owns that slice. |
| `/campaigns/*` | Campaign shells exist, but launch focus remains simple event loop. |
| `/proof-library/*` | Proof/UGC surfaces are preview/read-only unless consent/storage/publishing gates are approved. |
| `/coach` | Coach portfolio/support is not the current launch-critical loop. |
| `/slt-prep/*` | Traveler readiness exists but is not the 30-chapter invite-gate lane. |
| Broad provider/API-key/admin backend screens | Visible surfaces must stay blocked, disabled, read-only, or explicit about preview state. |
