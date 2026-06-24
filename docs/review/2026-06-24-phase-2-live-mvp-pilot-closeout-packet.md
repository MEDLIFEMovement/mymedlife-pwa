# myMEDLIFE Phase 2 Live MVP Pilot Closeout Packet

Date: 2026-06-24

Status:
- staging remains the hosted rehearsal environment
- controlled live MVP pilot is not yet approved
- production launch is out of scope for this packet
- repo support now exists for explicit hosted staging review auth plus narrow staging-only `action_started` and proof metadata gates
- those staging gates remain disabled by default and still block uploads, public proof, and external writes

## Goal of this packet

Close Phase 2 at the smallest safe real pilot:
- one chapter
- one campaign
- one narrow hosted write
- one proof/review loop
- named human owners
- zero external writes

## Recommended defaults

- Planning default chapter: `UCLA MEDLIFE`
- Campaign scope: `Rush Month only`
- Pilot cohort size: `5-10 students`
- First hosted write: `action_started`
- Smallest real proof loop: `proof metadata submission + leader review`
- Event/NPS posture: `manual-first`
- Hosted target: `staging.mymedlife.org`
- Integration hold:
  - HubSpot writes off
  - Luma writes off
  - n8n off
  - warehouse / Power BI off
  - SMS / email off
  - AI actions off

These are recommended defaults, not final approvals.

## Human-owned blanks still required

- Chapter leader owner: pending Nick/team
- Coach owner: pending Coach lead
- HQ/admin owner: pending HQ ops
- DS owner: pending Data Solutions
- Support/pause channel: pending HQ ops
- Rollback owner: pending Kiomi

## Hosted auth recommendation

Recommended default:
- pre-provision the first pilot cohort manually in staging

Reason:
- this keeps Phase 2 from depending on broad self-serve join and onboarding writes
- it narrows the first real test to role routing, sign-in, and the action loop

Still blocked:
- self-serve join requests
- membership approvals
- chapter role assignment writes
- coach assignment writes
- staff role assignment writes

## First hosted write recommendation

Recommended first hosted write:
- `action_started`

Required proof before any broader write opens:
- before/after route evidence from the signed-in student path
- assignment status changes to `in_progress`
- one internal `action_started` event row exists
- one internal integration event row exists
- one audit log row exists
- zero automation outbox sends exist
- zero external writes occur

## Review surfaces that must read back correctly

- student: `/rush-month/actions/[assignmentId]`
- leader: `/chapter?view=members`
- staff: `/staff?view=chapters`
- DS/admin:
  - `/admin/audit-log`
  - `/admin/integration-outbox`
  - `/admin/pilot-scope`
  - `/admin/first-write`

## Still blocked in this Phase 2 closeout step

- proof uploads
- public proof sharing
- assignment creation
- HQ proof decisions
- coach decisions
- HubSpot writes
- Luma writes
- n8n writes
- warehouse / Power BI writes
- SMS / email / AI actions

## Approval reply format

Reviewers can reply:

`approved as written`

Or replace only these fields:
- pilot chapter
- cohort size
- named owners
- event/NPS posture
- support/pause channel
- rollback owner

## What Phase 2 completion means

Phase 2 is complete when:
- named owners are recorded
- hosted auth works for the pilot cohort
- `action_started` is proven on staging
- the smallest proof/review loop is proven end to end
- leader, staff, DS/admin, audit, and outbox views all read back correctly
- all external integrations remain disabled

Phase 2 completion does **not** mean:
- full production launch
- broad student rollout
- public proof sharing
- live downstream integrations
