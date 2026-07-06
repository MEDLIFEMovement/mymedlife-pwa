# Integration Readiness Map

This map keeps the first real myMEDLIFE rollout focused on evidence, not
provider automation. It connects the external systems Nick named to the
30-chapter rollout packet, live-data proof, owner handoff, invite gate, audit
log, and integration outbox posture.

## Current Rule

Supabase and myMEDLIFE own operational truth for launch. External systems can
help source, verify, or enrich the rollout packet only after their fields,
owners, read/write boundaries, audit posture, and rollback rules are approved.

For the current launch lane:

- no provider API access is requested yet
- no provider writes are approved
- no student invites are approved
- no production users or Supabase rows are created by integration tooling
- no warehouse, n8n, CRM, Luma, social, reward, email, SMS, or AI send is
  launch evidence until it is visible through the approved app/outbox/audit
  path

The existing repo already has read-only review surfaces for this posture:

- `docs/production-rollout-bootstrap.md`
- `docs/production-rollout-data-collection.md`
- `docs/architecture/goal-125-admin-integration-outbox-route.md`
- `docs/architecture/goal-155-integration-live-send-preflight.md`
- `docs/architecture/goal-111-production-operations-runbook.md`
- `src/services/admin-integration-outbox-workspace.ts`
- `src/services/integration-contract-review.ts`
- `src/services/production-live-data-readiness.ts`
- `src/services/production-luma-mapping-readiness.ts`

## Rollout Packet Fields

The first integration work should help fill or verify these packet fields:

- `chapters.csv`: 30 approved launch chapters
- `users.csv`: launch students, leaders, coaches, admins, DS admins, owners
- `memberships.csv`: approved student and leader chapter roles
- `staff-roles.csv`: active coach, admin, DS admin, and super admin roles
- `coach-assignments.csv`: one active coach assignment per launch chapter
- `campaigns.csv`: one active launch campaign per launch chapter
- `luma-calendars.csv`: one linked Luma calendar per launch chapter
- `pilot-event-proof.csv`: five-chapter RSVP, attendance, points, audit, and
  zero-send proof
- `launch-owners.csv`: support, rollback, production apply, and launch decision
  owners
- `signed-in-route-proof.csv`: real route proof after production users and app
  rows exist

## Provider Map

| Provider or Source | Launch Role | Launch Posture | Rollout Data It Can Help | Keep Out Until Verified | Guardrails | Access Timing |
| --- | --- | --- | --- | --- | --- | --- |
| HubSpot | Likely first external source for real chapter/contact/owner data. | Read-only for launch. No contact, deal, company, task, note, workflow, or lifecycle writes. | Chapter list, contact emails, names, lifecycle/contact ownership, chapter affiliation, coach/staff owner hints, launch owner candidates, opt-in/eligibility notes if already approved by HQ. | HubSpot tasks, lifecycle changes, marketing enrollment, contact mutation, hidden notes, unreviewed private fields, inferred memberships, duplicate contacts not resolved by owner review. | Export only approved fields into the owner packet or staging CSV; app/Supabase remains truth after human packet approval; dedupe by stable email plus chapter handle; log source file/date; no private notes or API tokens in CSVs. | Ask after returned owner packet loop confirms which fields are still missing. Request only read-only contact/company/list access or a static export first. |
| Luma | Event calendar, event link, RSVP, and attendance source where approved. | Read-only mapping/proof for launch. No Luma event creation/update/delete/reminders/webhooks until separately approved. | `luma-calendars.csv`, `pilot-event-proof.csv`, event URLs, event IDs, RSVP count, attendance count, check-in proof, event route proof. | Live event creation, reminder sends, webhook execution, API keys in browser or CSVs, attendance imports that bypass audit/outbox, shared-default mapping as broad-rollout proof. | Every launch chapter needs an approved calendar id; runtime registry must match the packet; five pilot chapters need reviewer, timestamp, app routes, audit, points, and zero-send proof; Luma status pages stay read-only. | Ask after the 30-chapter slate is approved and before five-chapter pilot proof. Request read-only calendar/event/guest access or owner-exported CSVs first. |
| Smile.io | Rewards and recognition after points policy stabilizes. | Not in launch critical path. Read-only planning only. No reward grants, points sync, coupon issuance, or member mutation. | Later reward eligibility mapping from approved myMEDLIFE points events and member identity. Could eventually compare reward account identity to app profile email. | Reward balances, coupon codes, automated rewards, public leaderboard claims, marketing segmentation, any data that makes Smile.io the points source of truth. | myMEDLIFE points ledger stays truth; rewards must be downstream and reversible; require audit row and outbox contract before any reward send. | Ask only after event/attendance/points proof is stable and launch owners approve a rewards pilot. No API ask for the 30-chapter invite gate. |
| Hootsuite and Instagram leads | Social lead source for recruitment interest. | Not direct-to-app for launch. Read-only or export-only into HubSpot/warehouse first. | Later lead source, campaign attribution, chapter-interest signals, and recruitment funnel context. | Direct production memberships, invite eligibility, student profile creation, points, owner proof, unconsented social handles, DMs/comments as production app truth. | Route through HubSpot or warehouse for dedupe, consent, and owner review; never create app memberships from social lead rows alone; keep raw handles out of rollout packet unless approved. | Ask after HubSpot/warehouse path exists and HQ defines consent/lead fields. No API ask for the first rollout packet. |
| Warehouse: BigQuery or Databricks | Governed analytics/read model after app event/outbox/audit are stable. | Read-only downstream for launch. Not source of operational writes. | Later cohort reporting, funnel analysis, event participation aggregates, support dashboards, invite-batch health, historical reconciliation. | Production app writes, invite decisions, membership authority, raw private exports in launch artifacts, stale warehouse rows used as live proof. | Define export batch key, freshness SLA, source tables, row-level privacy, owner, rollback/bad-batch procedure; myMEDLIFE/Supabase count proof remains the live gate source. | Ask after production packet/live count proof exists and DS names reporting owner. Request read-only dataset/report access, not write credentials. |
| n8n | Future worker/orchestrator for approved outbox events. | Disabled for launch unless a specific outbox contract is approved. No workflow execution or replay. | Later delivery/retry evidence for approved external actions and operational recovery. | Workflow triggers, live sends, retries, dead-letter mutation, contact updates, Luma writes, HubSpot writes, SMS/email sends, secrets in browser. | Use `integration_events`, `automation_outbox`, audit rows, idempotency keys, dead-letter rules, pause procedure, replay approval, and named DS owner before any live worker. | Ask after `/admin/integration-outbox` has approved destination contract, idempotency, audit readback, and stop/replay rules. No API ask for packet assembly. |
| Supabase and myMEDLIFE | Operational source of truth for launch. | Write-capable only through approved production apply and app write gates. | All rollout packet rows after human approval, live data count proof, signed-in route proof, audit logs, outbox zero-send proof, invite gate status. | Fake/test rows, production-looking demo data, external provider rows not passed through approved packet/apply/readback flow. | Use owner return intake, packet validation, apply plan, live counts, route proof, audit log, outbox safety, final invite gate, and human approval before broad invites. | Already the owned app platform, but production DB count access should wait until approved packet/apply path exists or DS provides read-only connection explicitly. |

## Minimum Future Access Asks

Do not ask Nick or DS for provider keys yet. When the Coordinator decides the
missing rollout fields justify access, start with the narrowest read-only ask.

### HubSpot Read-Only Ask

Request only one of these, in this order:

1. A static export for the 30 launch chapters and owners.
2. If API access is necessary, a read-only private app or OAuth grant scoped to
   contacts, companies, lists, and owners needed for the launch packet.

Minimum fields:

- contact email
- first name
- last name
- contact owner
- company or chapter affiliation
- lifecycle/status only if already used by HQ for launch eligibility
- MEDLIFE chapter or school field, if one exists
- opt-in or rollout eligibility field, if already approved by HQ
- last updated timestamp
- HubSpot record id for dedupe traceability

Fields not needed for first access:

- private notes
- deal details
- marketing email content
- task bodies
- activity timelines
- unapproved custom properties
- write scopes of any kind

### Luma Read-Only Ask

Request only after the chapter slate is approved.

Minimum fields:

- calendar id
- calendar name
- event id
- event name
- event URL
- event start time
- guest RSVP count
- attendance/check-in count if available through approved export or read-only
  endpoint
- last updated timestamp

Do not request event write, reminder, webhook, or secret exposure access in the
first ask.

### Warehouse Read-Only Ask

Request only after live data proof and outbox/audit proof exist.

Minimum fields:

- dataset or view names that mirror approved app tables
- freshness timestamp
- aggregate counts for chapters, memberships, events, points, audit, outbox
- batch key or snapshot id
- owner and SLA

No production write credentials are needed for the rollout gate.

### n8n Ask

Do not ask for n8n credentials until a specific outbox destination contract is
approved. The first ask should be for workflow inventory and read-only run logs,
not workflow execution.

### Smile.io and Social Ask

Do not ask for Smile.io, Hootsuite, or Instagram API access for the first
30-chapter invite gate. Ask for exports or field definitions only after HQ
approves a rewards or recruitment-source pilot.

## Matrix Impact

| Matrix Column | Integration Impact |
| --- | --- |
| Rollout packet / 30-chapter data packet | HubSpot read-only or static exports can raise confidence once returned owner CSVs identify missing chapter/contact/owner data. Luma mapping exports can help `luma-calendars.csv`. |
| Human handoff / launch owners | HubSpot owner/contact data can verify owner emails and chapter owner assignments, but human handoff remains canonical until returned CSVs are validated. |
| Invite batch readiness | HubSpot can help dedupe contact/chapter affiliation before batches; warehouse can later report batch health. No provider should directly approve invites. |
| Live production data count proof | Only Supabase/myMEDLIFE live count proof advances this column. Warehouse counts are supporting evidence only after source freshness is proven. |
| Signed-in route proof imports | No external provider can replace real signed-in route proof. HubSpot/Luma can help pick real test actors and events after production users/app rows exist. |
| Final invite gate readiness | Advances only after packet, live counts, signed-in proof, pilot proof, outbox safety, owner rows, and human approval pass. External systems can support inputs but cannot substitute for the gate. |

## Risks And Blockers

- Treating HubSpot, Luma, or warehouse data as app truth before owner packet
  approval would bypass the rollout gate.
- Asking for broad API scopes too early invites accidental write paths and
  credential handling risk.
- Social lead data can be noisy, duplicated, and consent-sensitive; it should
  not create users or memberships directly.
- Smile.io reward actions can create user-visible value changes and must wait
  until points ledger and audit proof are stable.
- n8n replay/retry behavior can mutate external systems quickly; it needs
  idempotency, dead-letter, pause, and rollback rules before enablement.
- Production evidence should stay tied to app routes, Supabase counts, audit
  logs, outbox state, and reviewer timestamps.

## Recommended Order

1. Finish owner CSV return intake and build the approved rollout packet.
2. Use HubSpot static export or read-only access only for missing chapter,
   contact, owner, and dedupe fields.
3. Use Luma read-only export/access for approved chapter calendar mappings and
   five-chapter event-loop proof.
4. Apply production data through the approved Supabase path and capture live
   data count proof.
5. Capture signed-in route proof and zero-send outbox/audit proof.
6. Revisit warehouse, n8n, Smile.io, and social sources after event/outbox/audit
   proof is stable.
