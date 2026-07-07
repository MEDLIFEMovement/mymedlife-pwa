# Functionality Wiring Map

Last updated: 2026-07-07

This map answers: when a user clicks something, is it real, preview, blocked, or future?

## Launch Loop

| Behavior | Routes | Current services/files | Current wiring | Production status |
| --- | --- | --- | --- | --- |
| Sign in | `/login`, auth callback routes | `src/services/auth-session.ts`, `src/services/login-route.ts`, `src/app/auth/*` | Real auth route family exists. | Needs real production DS/user invite proof. |
| Member event discovery | `/app`, `/app/events`, `/app/events/[eventId]` | `src/services/member-launch-lane-events.ts`, `src/services/launch-lane-event-snapshots.ts` | Visible and route-backed. | Not production Luma truth yet. |
| RSVP | `/app/events/[eventId]` and member shell | `src/services/rush-month-event-rsvp.ts` | Local/mock-safe path. | Luma RSVP writeback blocked. |
| QR/check-in and attendance | member, leader, staff event surfaces | `src/services/event-loop.ts`, `src/services/launch-lane-event-snapshots.ts` | Visible in launch loop. | Production attendance import/proof missing. |
| Points | `/app/points`, leader/staff leaderboards | `src/services/launch-lane-points-policy.ts`, `src/services/launch-lane-points-readback.ts`, `src/services/points-kpi-ledger.ts` | Readback/local proof. | Production points materialization blocked. |
| Leaderboards | `/app/points`, `/leader`, `/staff` | points/readback services and shell components | Visible. | Production count/proof missing. |

## Admin And Operational Controls

| Behavior | Routes | Current services/files | Current wiring | Production status |
| --- | --- | --- | --- | --- |
| User/chapter/access review | `/admin/users`, `/admin/chapters`, `/admin/access` | `src/services/admin-management*.ts`, `src/services/role-access-invariants.ts` | Guarded admin surfaces exist. | Writes require audit/approval and should remain cautious. |
| Admin route-backed shell | `/admin` | `src/components/figma-admin-panel.tsx` | Active PR #394 improves URL-backed views. | Not landed until PR #394 merges. |
| Audit log review | `/admin/audit-log` | `src/services/admin-audit-log-review.ts` | Review/readback. | Supports proof, does not replace proof. |
| Integration outbox | `/admin/integration-outbox` | `src/services/admin-integration-outbox-workspace.ts` | Review/zero-send posture. | Live sends blocked. |
| Luma status | `/admin/integrations/luma` | `src/services/admin-luma-integration-status.ts`, `src/services/chapter-luma-calendars.ts` | Read-only/status and mapping posture. | Event create/update/import writes blocked. |

## Preview Or Future Controls

| Behavior | Visible in | Current state | Required before real |
| --- | --- | --- | --- |
| Create/stage event | Leader/staff shells | Preview/blocked for provider writes. | Approved local server action, Luma contract, audit/outbox, no-send proof. |
| Upload proof | Member/proof routes | Preview/read-only or metadata-only posture. | Consent, storage, moderation, audit, production evidence exclusion. |
| Review/share/publish UGC | Staff/proof routes | Blocked or preview-only. | Consent/storage contract plus human approval. |
| Send notifications/surveys | Member/leader/staff/admin surfaces | Preview-only/no-send. | Approved outbox destination, idempotency, audit, stop/replay rules. |
| HubSpot sync/actions | Admin/leader/staff surfaces | Blocked/read-only planning. | Separate read-only discovery, approved fields, no writes. |
| SOP workflow triggers | Staff/Admin SOP surfaces | Preview/planning only. | Full data model, approval flow, audit/outbox contract. |
| SLT Prep forms/payments/notifications | `/app/slt-prep`, `/slt-prep/*` | Preview/Test-labeled; active PR #395 in flight. | Separate traveler rollout, schema, source acceptance, write approval. |

## No-Silent-Control Rule

Every visible critical control must be one of these:

- `wired`: does the intended real behavior through an approved path.
- `preview`: clearly local/Test/sandbox and not production proof.
- `blocked`: visible but disabled or guarded with clear copy.
- `hidden`: removed until its module is approved.
- `route-backed`: opens the correct route/view without pretending to write data.

Any critical control that silently does nothing is a bug or a handoff blocker.

## Highest-Risk Misreadings

- A green smoke run is not production readiness.
- A Vercel preview is not rollout proof.
- A Test-labeled signed-in flow is not production signed-in proof.
- A visible provider name is not provider integration.
- An admin shell view is not proof that admin writes are production-approved.
- A local points/check-in path is not proof that production Luma/points ledgers are live.
