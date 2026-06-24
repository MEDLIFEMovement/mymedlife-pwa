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

The `/admin/pilot-scope` route now mirrors these defaults in a registry-backed approval block so recorded final answers can replace the proposed defaults cleanly when reviewers respond.

## Where recorded answers live

Once Nick / Kiomi / DS approve the final pilot defaults and named owners, record
them through the Phase 2 pilot registry env keys so every closeout surface reads
the same answers:

- `MYMEDLIFE_PILOT_CHAPTER`
- `MYMEDLIFE_PILOT_CAMPAIGN_SCOPE`
- `MYMEDLIFE_PILOT_COHORT_SIZE`
- `MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE`
- `MYMEDLIFE_PILOT_PROOF_REVIEW_LOOP`
- `MYMEDLIFE_PILOT_EVENT_NPS_POSTURE`
- `MYMEDLIFE_PILOT_INTEGRATION_HOLD`
- `MYMEDLIFE_PILOT_CHAPTER_LEADER_OWNER`
- `MYMEDLIFE_PILOT_COACH_OWNER`
- `MYMEDLIFE_PILOT_HQ_ADMIN_OWNER`
- `MYMEDLIFE_PILOT_DS_OWNER`
- `MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL`
- `MYMEDLIFE_PILOT_ROLLBACK_OWNER`

Until those values are set, the app should keep showing recommended defaults and
pending owner slots rather than implying final approval.

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

Observed staging access on 2026-06-24:
- anonymous requests to `https://staging.mymedlife.org` redirected to Vercel SSO first
- that Vercel SSO request then redirected to a Vercel-hosted `/login?next=/sso-api...` path before reaching the app
- direct anonymous requests to `https://staging.mymedlife.org/login` were also intercepted by the same Vercel SSO gate
- this means the reviewer access path is still not self-evident from the staging hostname alone and needs explicit owner confirmation

Implication:
- hosted auth proof is still blocked until the team confirms the intended reviewer access path, whether that stays Vercel-SSO-gated, becomes a named approved reviewer session flow, or moves to a different approved staging access posture

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

## Current criterion-by-criterion audit

As of 2026-06-24, the closeout criteria separate into three buckets:

### Review-ready in repo, but not yet hosted-proof complete

- first hosted write is explicitly narrowed to `action_started`
- the smallest hosted proof loop is explicitly narrowed to `proof metadata submission + leader review`
- leader, staff, DS/admin, audit, and outbox review surfaces are named for the hosted proof loop
- all external integrations remain explicitly disabled in the pilot framing

### Awaiting human recording or signoff

- final named pilot owners are not all recorded yet
- final support/pause channel is not fully confirmed yet
- final rollback owner is not fully confirmed yet
- final staging reviewer access posture is not yet confirmed

### Awaiting hosted staging proof

- hosted auth does not yet have approved reviewer-path evidence
- hosted `action_started` does not yet have before/after staging proof
- the hosted proof/review loop does not yet have end-to-end staging evidence
- leader, staff, DS/admin, audit, and outbox readback do not yet have hosted proof captured from staging

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

Current honest reading:
- Phase 2 is review-ready and tightly framed
- Phase 2 is not yet complete
- the remaining gap is real hosted proof plus named human approvals, not more product-surface expansion
