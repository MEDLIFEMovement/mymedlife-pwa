# Production Capability Gap Register

Date: 2026-07-19

Status: Phase 0 audit complete; Phase 1 auth lifecycle production-proven

This register separates rendered surfaces from real product capability. A route,
TEST record, preview control, green unit test, or READY deployment is not proof
that the corresponding workflow is production-capable.

## Evidence Baseline

- GitHub `main` and production Vercel both point to
  `d732b8f9b4ee90a80750eaaaf876f13cc71a97d7` (through PR #718). Production
  deployment `dpl_4xHLETYiLZiweKAE2riX7c4fMsDU` is READY and serves
  `mymedlife.org`.
- The production Supabase project `fnlhontvvprwgooevzdl` is `ACTIVE_HEALTHY`
  on Postgres 17.6.
- Production contains 122 Auth users and 122 active app profiles. At least 115
  profiles are visibly TEST-like by email or display name.
- Production contains 8 chapters, 110 memberships (109 approved and 1
  requested), 17 chapter events, 14 Luma links, 37 app event rows, 36 points
  rows, 14 integration events, 14 disabled outbox rows, and 16 audit rows.
- No profile has a `hubspot_contact_id`; no chapter has a
  `hubspot_company_id`.
- All 14 Luma links have status `mocked`; 7 have a non-null
  `last_imported_at` value. That timestamp does not make the mocked links a
  real provider sync.
- The event activity stream includes 5 RSVP records, 3 RSVP cancellations, and
  1 attendance record. This proves that the internal TEST event-loop write path
  has been exercised, not that a full live member cohort or Luma loop is ready.
- Supabase Storage has one bucket and zero stored objects. There are no app
  tables for stories, story media, story reactions, or story moderation.
- Production Auth leaked-password protection is enabled. The performance
  advisor still reports multiple unindexed foreign keys and overlapping
  permissive SELECT policies.

## Capability Register

| Domain | Current state | Classification | Launch-critical gaps | Evidence |
| --- | --- | --- | --- | --- |
| Auth | Password login, logout, self-service recovery request, one-time recovery callback, set-password, proxy session refresh, signed-session reads, and role-aware redirects are deployed. Production Auth has real accounts. | Functional and production-proven for the Phase 1 lifecycle | Expired-link and simultaneous cross-tab edge cases remain regression coverage. Password minimum length is still six and should be raised only with matching client validation and migration communication. Later rollout proof still needs the approved launch cohort; Phase 1 production proof does not establish whole-product readiness. | `src/app/login/actions.ts`, `src/app/auth/forgot-password`, `src/app/auth/callback/route.ts`, `src/app/auth/callback/recovery/[continuation]/route.ts`, `src/app/auth/set-password/actions.ts`, `src/proxy.ts`, `src/services/auth-session.ts`, `src/services/local-actor-context.ts`, PR #706, deployment `dpl_EXDb4ZoMF91k7TEynpPTEYNfZTqJ` |
| Users and chapters | App-owned profiles, chapters, memberships, roles, staff roles, and coach assignments exist with RLS. Production has real rows. The signed-in member home and campaign view now receive actor-scoped identity, chapter, campaign, event, points, and leaderboard data, and no longer substitute fixed campaign metrics, assignments, or coach messages. | Real tables, incomplete lifecycle | Most current profiles are TEST accounts. Other routes still allow mock fallback, and no real upstream materialization lifecycle exists. The identity/chapter path must be audited actor-by-actor across every launch-critical role. | `supabase/migrations/20260615110000_initial_supabase_foundation.sql`, `src/services/read-only-app-data.ts`, `src/services/local-actor-context.ts`, `src/services/member-mobile-identity-context.ts`, `src/app/app/member-home-page.tsx`, PRs #716 and #718 |
| HubSpot sync | Mapping columns exist on profiles and chapters. | Unbuilt | Zero production mappings. No backfill, incremental sync, retry/conflict ledger, sync run table, admin sync evidence, or practical import filters exist. Page loads must continue to use app tables, not live HubSpot fetches. | `app.profiles.hubspot_contact_id`, `app.chapters.hubspot_company_id`, repository search for HubSpot adapters |
| Events and Luma | App-owned chapter events and stable Luma link rows exist. Member event detail is route-backed. | Internal model partial; provider path mocked | Every production Luma link is `mocked`. There is no real ingestion client, scheduled/manual sync, cursor/checkpoint, failure/retry contract, or provider reconciliation. Event reads also inherit the global first-chapter fallback risk. | `app.chapter_events`, `app.luma_event_links`, `src/services/luma-dry-run-adapter.ts`, `src/services/read-only-app-data.ts` |
| RSVP, check-in, attendance, points | The production-gated server path persists RSVP, cancellation, attendance, and points rows. Cancellation is append-only and re-RSVP uses latest intent. TEST production proof exists for RSVP and cancellation. | Functional TEST path, incomplete production design | Writes use a server service-role client and application checks instead of one transactional, permission-checking database RPC. Attendance count update, attendance event insert, and points insert are not proven atomic under concurrency. Complete role readback, duplicate/race handling, real-event proof, audit readback, staging evidence, and production cohort proof remain. | `src/services/member-event-loop-write.ts`, `src/services/launch-lane-event-snapshots.ts`, `src/services/launch-lane-points-readback.ts`, `src/app/app/events/[eventId]/actions.ts` |
| Stories, media, likes | Member and leader story shells render proof items or TEST fallback stories. Like/save controls are disabled previews. | Shell only | No story create/ingest model, media records, storage objects, thumbnails, reactions, moderation state, or persistent member interactions exist. | `src/components/figma-member-stories-page.tsx`, `src/components/figma-leader-stories-screen.tsx`, `storage.objects` |
| Admin and permissions | RLS is enabled on app tables. Audited RPCs exist for selected user, chapter, membership, assignment, proof, and event operations. Many controls are visibly gated. | Mixed real and review-only | Enabled admin operations need an explicit inventory and browser proof by role. Risky writes need rollback procedures and readback verification. External integrations remain disabled. Review-only controls must stay disabled until their own permission, audit, rollback, and proof requirements pass. The live advisor's overlapping permissive SELECT policies must be reviewed for both intended scope and query cost. | `supabase/migrations`, `src/app/admin`, `src/services/admin-*`, `app.audit_logs`, `app.automation_outbox` |
| QA, CI, staging, production | The repo has broad Vitest, Playwright, RLS, route, and rollout tooling. PR #706 passed the Phase 1 auth gates. PRs #717 and #718 passed the current app, browser-smoke, RLS, CodeQL, dependency-review, Sonar, review, and coverage gates. The exact current merge commit is deployed. The complete Phase 1 recovery/session/role matrix was clicked on production with an isolated TEST account. | Phase 1 production-proven; later phases remain unproved | Green checks remain supporting evidence only. The actor-scoped campaign and member-home honesty changes on PRs #716/#718 still require a fresh signed-in deployed-site click-through because the available browser session has expired. Staging was not separately exercised for Phase 1. Provider integration, stories, transactional event-loop proof, and full admin-control proof remain phase-specific work. | `tests`, `supabase/tests`, `tests/e2e/launch-smoke.spec.ts`, PRs #706, #717, and #718, Vercel deployment `dpl_4xHLETYiLZiweKAE2riX7c4fMsDU`, production audit rows `866e5535-0a7a-49c2-bfe6-8f92a0667ab2` through `e3a0cabc-dbdf-43eb-9e41-262b2de1037c` |

## Source-Of-Truth Map

| Domain | Canonical app truth | Upstream or external system | Boundary |
| --- | --- | --- | --- |
| Authentication | Supabase Auth `auth.users` and sessions | Email provider through Supabase Auth | Auth owns credentials and sessions. App authorization must not trust editable user metadata. |
| User identity | `app.profiles` | HubSpot contacts where approved | Import/materialize into app rows. Store stable external IDs and sync state. Never fetch HubSpot on every page load. |
| Chapters | `app.chapters` | HubSpot companies where approved | Import/materialize into app rows with stable company mapping and conflict handling. |
| Membership and roles | `app.memberships`, `app.roles`, `app.staff_role_assignments`, `app.coach_chapter_assignments` | HubSpot only as an upstream signal where agreed | App tables and RLS are authoritative for access. Changes require audit history. |
| Events | `app.chapter_events` | Luma events where Luma is the approved upstream | `app.luma_event_links` stores stable mappings. Sync runs need checkpoints, failures, retries, and reconciliation. |
| RSVP intent | Append-only `app.events` rows (`event_rsvp_recorded`, `event_rsvp_cancelled`) | Optional future Luma writeback | Latest valid intent is current state. Never delete cancellation history. |
| Attendance | Append-only `app.events` attendance rows plus derived event readback | Luma attendance import where approved | Imports must be idempotent and tied to a stable event/user mapping. Cached counts must be transactionally consistent. |
| Points | Append-only `app.points_events` | Optional downstream analytics only | App ledger is authoritative. Unique/idempotency constraints must prevent duplicate awards. |
| Stories | New app-owned `stories` and moderation records are required | Optional approved source feeds | App owns lifecycle and moderation state. External publishing is downstream only. |
| Media and thumbnails | Supabase Storage plus new app-owned media metadata | Optional image/video processors | Private-by-default storage policies, durable object paths, derived thumbnail metadata, and deletion/audit rules are required. |
| Likes/reactions | New app-owned reaction rows | None required | Per-user uniqueness and RLS must enforce one current reaction while retaining appropriate audit history. |
| Integration work | `app.integration_events`, `app.automation_outbox` | HubSpot, Luma, n8n, warehouse, email/SMS | Outbox remains disabled until a specific integration is approved, credentialed, idempotent, monitored, and rollback-ready. |
| Audit | `app.audit_logs` plus append-only domain events | External log/warehouse may consume later | App audit rows remain the operational source; exports do not replace them. |

## Prioritized Implementation Order

1. Make all launch-critical reads actor-scoped and remove production mock
   fallback. Then implement HubSpot-backed user/chapter/membership
   materialization with sync-run evidence.
2. Build real Luma ingestion into `app.chapter_events` and
   `app.luma_event_links`, including reconciliation, retry, and admin-visible
   sync status.
3. Move the member event-loop write into an idempotent transactional database
   boundary and prove RSVP, cancellation, re-RSVP, check-in, attendance, points,
   role readback, and audit history end to end.
4. Add the real stories/media/reactions schema, private storage, thumbnail
   processing, moderation, and browser-verifiable interactions.
5. Inventory and activate only safe admin operations with explicit permission,
   audit, rollback, and deployed browser proof. Review overlapping RLS policies
   and add indexes for launch-critical foreign-key access paths before scale.
6. Run one requirement-linked launch gate that keeps local, CI, browser,
   staging, production, and audit/readback evidence separate.

## Phase 0 Verdict

PASS. The current state, intended source-of-truth boundaries, and prioritized
gaps are now explicit and tied to repository and live production evidence.
This verdict does not advance any later phase and is not a rollout-readiness
claim.

## Phase 1 Verdict

### 1. Built

- Self-service recovery request, one-time recovery continuation, set-password,
  login/logout, proxy session refresh, and role-aware workspace routing are on
  `main` at `9d907451922d80408d6544f540828aa442b3ab0e`.
- Production redirect allowlists cover both apex and `www` callback paths,
  including `/auth/callback/recovery/**`.
- Supabase Auth leaked-password protection is enabled.

### 2. Locally Tested

- PR #706 passed typecheck, lint, build, the focused auth/admin suite (15 files,
  77 tests), and the full Vitest suite (340 files, 2,027 tests).
- Required GitHub App checks, browser smoke, Supabase RLS tests, CodeQL,
  dependency review, Sonar, Claude review, and Codecov completed successfully.

### 3. Browser Verified

- Browser: isolated Chromium session `recovery706`.
- Role/account: `nellis+mymedlife-recovery-test@medlifemovement.org`, visibly
  labeled `TEST Phase 1 Recovery`.
- Click path: `/auth/forgot-password` -> freshly delivered email link ->
  `/auth/callback/recovery/Lw` -> `/auth/set-password?redirectTo=%2F` -> `/app`.
- Password set, hard-reload session persistence, `/profile`, logout, anonymous
  `/app` redirect, restored-password login, and post-HIBP login all passed.
- The same account was moved through member, President / VP, Admin, and Super
  Admin using the audited production RPC. `/leader`, `/staff`, and `/admin`
  loaded only for allowed roles; denied workspace attempts returned to the
  account's allowed default workspace.

### 4. Staging Validated

- Not separately exercised. The exact merged artifact was deployed directly to
  production and proved there. This is recorded explicitly rather than treating
  production proof as retroactive staging evidence.

### 5. Production Proven

- Vercel deployment `dpl_EXDb4ZoMF91k7TEynpPTEYNfZTqJ` serves the exact merge
  commit on both production domains.
- Gmail message `19f7bf5747e0b24c` supplied the fresh one-time recovery link used
  in the browser proof.
- Production audit rows record all temporary role transitions. Final database
  readback shows one approved `general_member` membership and inactive
  `president_vp`, `admin`, and `super_admin` assignments.
- Final browser readback showed the TEST member identity and chapter on `/app`;
  a subsequent `/admin` attempt returned to `/app`.

### 6. Remaining Blocked

- No Phase 1 launch-critical blocker remains. Expired-link and concurrent
  cross-tab cases remain regression tests, and password-policy strengthening is
  deferred until matching client validation and user communication exist.
- Phase 2 user/chapter/membership materialization and HubSpot synchronization
  remain unbuilt. This Phase 1 result does not move those gates.

### 7. PASS/PARTIAL/BLOCKED

**PASS.** Phase 1 meets its build, automated-proof, real-browser, deployed-site,
authorization-readback, and cleanup requirements. This is an auth lifecycle
verdict only, not a whole-product rollout-readiness claim.
