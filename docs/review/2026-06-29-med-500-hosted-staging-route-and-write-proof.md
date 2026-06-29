# MED-500 Hosted Staging Route And Write Proof

Date: 2026-06-29

Status:
- hosted staging proof captured
- review-only
- no new production writes approved
- no external sends enabled

## Why this note exists

This note records the cleanest current hosted staging proof for the Phase 2
closeout lane. It is the source of truth for which route/readback evidence is
real, which assignment row is authoritative, and which earlier seeded row
should not be treated as proof.

## Reviewer access path

Observed reviewer path on `https://staging.mymedlife.org`:

1. Open `https://staging.mymedlife.org`.
2. Complete the Vercel SSO gate first.
3. After the Vercel handoff, the app loads the myMEDLIFE login page.
4. Sign in with a seeded staging account.
5. Confirm the app routes the signed-in reviewer into the correct workspace.

Important:

- the Vercel SSO cookie alone is not app proof
- the preview-actor cookie alone is not app proof
- the valid proof path is: Vercel SSO -> myMEDLIFE login -> seeded account ->
  role-routed workspace

## Hosted sign-in and route proof captured

Hosted role-routed proof was rechecked on 2026-06-29 through the staging alias:

- member:
  - sign-in: `member.a@mymedlife.test`
  - route evidence: `/app`
  - route evidence: `/rush-month/actions/50000000-0000-4000-8000-000000000002`
  - readback:
    - `Hi, Sofia`
    - `Rush Month`
    - `Invite three more students to Rush Month`
    - status `submitted`
- leader:
  - sign-in: `leader.a@mymedlife.test`
  - route evidence:
    `/rush-month/review?assignmentId=50000000-0000-4000-8000-000000000002&evidenceItemId=3e7b2ab6-8770-488f-9637-90cbaa863b62`
  - readback:
    - `Leader proof review`
    - `Chapter proof follow-up`
    - `Waiting for HQ review`
- staff:
  - sign-in: `admin@mymedlife.test`
  - route evidence: `/staff?view=chapters`
  - readback:
    - `Staff Command Center | myMEDLIFE`
    - `Event and points pulse`
- DS admin:
  - sign-in: `ds.admin@mymedlife.test`
  - route evidence:
    - `/admin/audit-log`
    - `/admin/integration-outbox`
    - `/admin/pilot-scope`
    - `/admin/first-write`
    - `/admin/feature-flags`
    - `/admin/theme`
    - `/admin/luma-live-pilot`

## Authoritative hosted first-write and proof-loop row set

Do not use assignment
`50000000-0000-4000-8000-000000000001`
as the hosted first-write proof row.

Reason:

- it reads as `in_progress`
- but it does not have the matching internal event, integration event, and
  audit log chain needed for authoritative hosted proof

Use assignment
`50000000-0000-4000-8000-000000000002`
as the authoritative hosted proof chain.

Assignment readback:

- title: `Invite three more students to Rush Month`
- status: `submitted`
- points: `15`

### Hosted `action_started` evidence

For assignment `50000000-0000-4000-8000-000000000002`:

- internal event:
  - id: `80326f8b-2436-409b-9a7d-454006c76772`
  - type: `action_started`
- integration event:
  - id: `20033a9c-f891-43c6-88ca-0e3bf0b03a8c`
  - type: `action_started`
  - destination: `internal`
  - status: `recorded`
- audit log:
  - id: `99ad7242-b46c-48d4-a573-79eef122fa74`
  - action: `action_started`
  - target: assignment `50000000-0000-4000-8000-000000000002`
- automation outbox:
  - expected result: no `action_started` send row
  - current result: no `action_started` outbox send row observed

This is the clean authoritative proof that the approved first hosted write can
run without creating an unauthorized downstream send.

### Hosted proof metadata readback

For the same assignment:

- evidence item:
  - id: `3e7b2ab6-8770-488f-9637-90cbaa863b62`
  - status: `pending_review`
- internal event:
  - id: `cca7640b-149f-45b7-8efe-c6c50b5815cf`
  - type: `evidence_submitted`
- integration event:
  - id: `b95589cd-1000-4435-a28d-3fbb9a168a4a`
  - type: `evidence_submitted`
  - destination: `internal`
  - status: `recorded`
- audit log:
  - id: `bf1c1538-6983-46f6-b0f5-d4053be65da5`
  - action: `evidence_submitted`
- automation outbox:
  - id: `e80798d1-18cb-4441-8d94-84a56bc1ad0c`
  - event type: `evidence_submitted`
  - destination: `n8n`
  - status: `disabled`

Leader readback on the hosted route shows the submitted proof waiting in the
chapter review lane without opening leader decision writes.

## Readback surfaces confirmed

Hosted route-level readback was confirmed for:

- member home: `/app`
- member leaderboard: `/rush-month/leaderboard`
- member action detail:
  `/rush-month/actions/50000000-0000-4000-8000-000000000002`
- leader review route:
  `/rush-month/review?assignmentId=50000000-0000-4000-8000-000000000002&evidenceItemId=3e7b2ab6-8770-488f-9637-90cbaa863b62`
- staff chapters: `/staff?view=chapters`
- admin audit: `/admin/audit-log`
- admin outbox: `/admin/integration-outbox`
- admin pilot scope: `/admin/pilot-scope`
- admin first write: `/admin/first-write`
- admin feature flags: `/admin/feature-flags`
- admin theme: `/admin/theme`
- admin Luma pilot: `/admin/luma-live-pilot`

## What is now honestly proven

- the signed-in reviewer path through `staging.mymedlife.org` is real
- role-routed hosted readback exists for member, leader, staff, and DS admin
- the approved first hosted write `action_started` has authoritative hosted
  event, integration-event, and audit proof
- proof metadata submission readback exists on the same assignment chain
- leader review readback exists without opening leader decision writes
- the outbox stays blocked for the first hosted write and disabled for the proof
  metadata loop
- the Luma event / RSVP / attendance / points / leaderboard loop is separately
  proven on hosted staging

## What is still not proven here

- leader decision write approval or request-changes write
- HQ proof decision write
- proof upload
- public proof sharing
- broader chapter/admin mutation writes
- production auth
- production deployment
- external sends beyond the separately approved blocked/disabled staging rows

## What this means for the next phase

The honest next phase is no longer "discover whether staging works."
That part is proven.

The next phase moving toward production is:

1. close Phase 2 externally with the current hosted evidence recorded in review
   systems
2. keep the pilot narrow to one chapter and one workflow
3. stand up the separate production environment and ownership model
4. promote only the next approved live-pilot writes in sequence
5. keep external systems off until each family gets its own approval gate
