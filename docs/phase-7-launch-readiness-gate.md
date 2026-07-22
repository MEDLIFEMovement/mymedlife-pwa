# Phase 7 Launch Readiness Gate

Date: 2026-07-22

Status: **BLOCKED by external provider activation and staging proof**

This gate separates product capability from deployment evidence, external
provider activation, and rollout approval. A green PR, rendered route, TEST
workflow, or production database row is supporting evidence; none is a
substitute for the proof column where it is missing.

## Readiness Summary

| Workflow | Built | Local tests | Browser verified | CI | Staging | Production proof | Remaining boundary | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth and account lifecycle | Real password login/logout, recovery, password reset, session refresh, role routing, and route guards | Focused auth suites and full repository suite passed | Recovery, reset, persistence, logout, and role transitions exercised with an isolated TEST account | Required checks passed | Not separately validated | Real recovery email, signed-in role routing, audit readback, and cleanup proved | Approved launch-cohort proof remains a rollout activity | **PASS** |
| Users, chapters, memberships | App-owned Supabase tables, actor-scoped reads, RLS, mappings, import runners, lifecycle ledgers | Sync, reconciliation, fail-closed, RLS, and readback coverage passed | Signed-in member/admin surfaces read app-owned production rows | Required checks passed | Current provider-backed staging path not established | 125 auth users/profiles, 8 active chapters, 116 approved memberships, role assignments, and chapter readback observed | HubSpot has never populated these rows in production | **PARTIAL** |
| HubSpot upstream sync | Server-only backfill/incremental sync, stable mappings, conflict/failure/replay state, scheduler, and admin controls | Focused and full suites passed | Production admin page truthfully shows disabled configuration and zero runs | Required checks passed | Current HubSpot staging activation absent | Zero runs, imports, and mappings in production | Requires current access token, enable flag, production approval flag, then backfill and signed-in readback | **BLOCKED** |
| Events and Luma ingestion | Coherent app event model, event detail, server-only reconciliation, mapping and failure state, scheduled/manual controls | Event/Luma suites and full repository suite passed | Member event list/detail works; production admin Luma route inspected | Required checks passed | Current Luma read-sync staging contract absent | 18 app events and 14 links read from production; all 14 provider links are `mocked`; zero sync runs/imports | Requires current API key, calendar, chapter mapping, enable/approval flags, then provider import and cross-role browser proof | **BLOCKED** |
| RSVP, Un-RSVP, check-in, attendance, points | Transactional service-role RPC, append-only intent history, re-RSVP, check-in, deduped points, role readbacks | Focused/RLS/full suites passed | Member loop and adjacent controls exercised in browser | Required checks passed | No separate staging cohort proof | Production has 19 RSVP, 13 cancellation, 5 attendance, and 40 event-points records with recent real write/readback evidence | Real rollout cohort and provider-sourced event proof remain separate rollout gates | **PASS** |
| Stories, private media, reactions, moderation | Durable story readback, private proof upload/removal, object validation, reaction writes, HQ sharing decisions | Focused/RLS/full suites passed | Signed-in member and HQ/admin paths exercised | Required checks passed | Not separately validated | Production has persisted like/unlike, upload/remove, moderation decisions, 7 storage-backed evidence rows, and one private bucket object | Thumbnail-generation evidence is not isolated as a separate production proof | **PASS** |
| Admin safety and operations | Permissioned user creation/deactivation, audit readback, inactive-user safety; irreversible deletion and chapter mutations separated and blocked | Admin lifecycle, permission, RLS, chapter posture, full suite passed | Super Admin lifecycle and every visible chapter-management control exercised | Required checks passed | Not separately validated | TEST account creation/deactivation and audit history proved; chapter page shows real readback and nine disabled unsafe mutations | Permanent user deletion and production chapter mutation stay review-only pending independent implementation/approval/proof | **PASS** |
| Route/domain smoke | Core-route and domain checkers aligned with actual redirects | 11/11 core and 6/6 domain checks passed | Public and auth-boundary routes exercised by automation/browser | Required checks passed | Not a staging substitute | Production smoke currently reports 11/11 core and 6/6 domain READY | This proves availability and redirect contracts only | **PASS** |
| Launch rollout gate | Evidence tooling and rollout packet contracts exist | Packet validators pass locally | No approved 30-chapter rollout execution | Required checks passed | Not validated | No human-approved rollout apply handoff or cohort evidence | Requires approved cohort, current provider activation, staging validation, operator handoff, monitoring, and rollback ownership | **BLOCKED** |

## Production Readback Snapshot

Read-only production evidence from Supabase project
`fnlhontvvprwgooevzdl`:

- 125 auth users and 125 app profiles
- 8 active chapters and 116 approved memberships
- 20 active staff role assignments and 10 active coach chapter assignments
- 8 active campaigns, 18 chapter events, 35 assignments, and 40 points events
- 44 audit rows and 19 outbox rows; 0 unsafe approved/sent outbox rows
- HubSpot: 0 runs, imports, mappings, and failures
- Luma: 0 calendars, runs, and imports; 14 links, all `mocked`
- Event loop: 19 RSVP, 13 cancellation, and 5 attendance events
- Stories/evidence: 8 likes, 6 unlikes, 2 proof uploads, 2 proof removals,
  1 HQ sharing decision, 7 storage-backed evidence rows, and 1 private bucket
  object

The event/story/admin write evidence proves the app-owned production paths. It
does not prove HubSpot or Luma provider activation, staging, or rollout-cohort
readiness.

## Current External Blockers

### HubSpot

Production requires all of the following before a real read sync can run:

- `MYMEDLIFE_ENABLE_HUBSPOT_READ_SYNC=true`
- `HUBSPOT_ACCESS_TOKEN`
- `MYMEDLIFE_ALLOW_PRODUCTION_HUBSPOT_READ_SYNC=true`
- an approved initial backfill and browser/database readback

### Luma

Production requires all of the following before a real read sync can run:

- `MYMEDLIFE_ENABLE_LUMA_READ_SYNC=true`
- `LUMA_API_KEY`
- `LUMA_CALENDAR_ID`
- `MYMEDLIFE_LUMA_CHAPTER_ID`
- `MYMEDLIFE_ALLOW_PRODUCTION_LUMA_READ_SYNC=true`
- an approved import/reconciliation and cross-role browser/database readback

Provider writes remain disabled and are not required for read ingestion.

### Staging and rollout

- Preview currently contains mixed legacy Luma write variables, but lacks the
  complete current HubSpot/Luma read-sync configuration. It is not a clean
  staging proof boundary.
- No approved 30-chapter rollout packet or human apply handoff has been
  executed.
- Monitoring, rollback ownership, and approval evidence must be attached to the
  rollout packet before cohort activation.

## Production Honesty Repair

PR #800 (`f44252e78c213a500c89f9b34862913d78270ed6`) corrects the
production Luma page so an unconfigured production integration cannot claim
`Staging Ready` merely because Supabase readback is available. Local tests,
typecheck, lint, browser smoke, RLS, CodeQL, Sonar, dependency review, and
automated review pass.

The exact merged commit is deployed in production as
`dpl_2ig8GiwFjjSRXtkwBaUtPgWknEys` and serves `mymedlife.org`. Signed-in Super
Admin reproof on `/admin/integrations/luma` shows `Production`, provider
`disabled`, test connection `disabled`, and `Connection disabled`. It also
shows zero calendars, zero sync runs/imports, fourteen mocked event links, zero
live sends, and no completed provider sync.

Every visible control on the affected surface was exercised after deployment.
All fourteen navigation/action links preserved the signed-in shell and reached
their expected route, the keyboard skip link focused `main-content`, and the
backfill/reconcile inputs and buttons remained disabled. Post-deploy core-route
smoke passed 11/11 and domain readiness passed 6/6. This proves the page's
production honesty and control behavior; it does not prove Luma activation.

## Phase Verdicts

| Phase | Verdict | Truth |
| --- | --- | --- |
| 0 - Audit and source map | **PASS** | Current-state register and HubSpot -> Supabase -> Databricks boundary are explicit. |
| 1 - Auth lifecycle | **PASS** | Built, automated, browser-verified, audited, and production-proven. |
| 2 - Users/chapters/HubSpot | **BLOCKED** | App-owned data and sync runtime exist; real HubSpot activation and materialization proof do not. |
| 3 - Events/Luma | **BLOCKED** | App event model/detail works; all provider mappings remain mocked and real Luma ingestion is inactive. |
| 4 - Event action loop | **PASS** | RSVP, cancellation, attendance, and points have durable audited production evidence. |
| 5 - Stories/media/reactions | **PASS** | Durable production write/readback evidence exists; provider rollout is not implied. |
| 6 - Admin safety | **PASS** | Enabled lifecycle is permissioned/audited/proven; unsafe writes remain visibly review-only. |
| 7 - Launch proof | **BLOCKED** | HubSpot/Luma activation, clean staging proof, and approved rollout execution remain open. |

## Next Gate Sequence

1. Establish one clean staging boundary with the current read-sync contracts.
2. Activate and prove HubSpot read sync: one approved backfill, mapping/failure
   readback, and signed-in identity/chapter verification.
3. Activate and prove Luma read sync: one approved reconciliation, stable event
   mapping, event-detail readback across roles, and failure/retry visibility.
4. Re-run launch-critical browser QA and the production smoke/domain checks on
   the exact release candidate.
5. Assemble and approve the rollout packet with cohort scope, operator,
   monitoring, rollback, and human apply handoff.

Until those steps pass, the honest overall result is **BLOCKED**, not launch
ready.
