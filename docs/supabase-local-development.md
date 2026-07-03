# Supabase Local Development

Goals 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, and 16 add the local-only Supabase
foundation for myMEDLIFE. Goal 17 adds proof/video storage planning without
creating storage buckets or upload paths. Goal 18 adds a local-only audited
chapter-leader assignment creation function. Goal 19 adds auth/onboarding
planning without enabling live auth or production users. Goal 20 adds the
route-by-route live-data connection plan without enabling production data.
Goals 21 and 22 expand read-only campaign/dashboard surfaces. Goals 23 through
27 add visible browser-write activation gates while keeping enabled controls
off. Goal 27 also adds the local-only audited coach decision function. Goal 58
adds localhost-only Supabase Auth sign-in for fake local seed users. Goal 59
maps that local auth session into role-aware app context. Goal 60 adds the first
local-only browser-to-Supabase write path for `action_started`. Goal 61 adds a
stable local seed assignment plus readback proof for that first write. Goal 62
adds the second local-only browser-to-Supabase write path for
`evidence_submitted` proof/testimonial metadata. Goal 63 adds the third
local-only browser-to-Supabase write path for `hq_sharing_decision`. Goal 64
adds the fourth local-only browser-to-Supabase write path for `action_assigned`
assignment creation. Goal 65 adds the fifth local-only browser-to-Supabase
write path for `coach_decision_logged`. Goal 116 adds the sixth local-only
browser-to-Supabase write path for `leader_proof_decision` on
`/rush-month/review`.
Goals 74 through 76 add `/admin/first-write` so staff can inspect the first
action-start write drill, review post-drill readback evidence, and use one
operator-ready packet for env settings, fake sign-in, route sequence, proof
expectations, stop conditions, and staging-review posture.
Goal 77 adds `/admin/write-sequence` so staff can see the safe write promotion
order after that first action-start proof: proof metadata, HQ proof decision,
leader assignment creation, and coach decision logging.
Goal 78 adds `/admin/proof-write` so staff can prepare the second local write,
`evidence_submitted` proof/testimonial metadata, only after first-write
readback is proven.
Goal 79 adds `/admin/hq-proof-write` so staff can prepare the third local
write, `hq_sharing_decision_logged`, only after proof metadata readback is
proven.
Goal 80 adds `/admin/assignment-write` so staff can prepare the fourth local
write, `action_assigned`, only after HQ proof decision readback is proven.
Goal 115 adds the local-only database/RLS packet for
`leader_proof_decision`. Goal 116 adds the local browser/server-action path for
that function, but it remains disabled by default and requires local Supabase
Auth plus the explicit leader proof decision write flag.
Goal 130 adds `/admin/database-security` as the focused read-only
Supabase-versus-PlanetScale review surface for DS/security before production
setup.
Goal 131 adds `/admin/launch-gate` as the focused read-only production launch
gate before any live pilot approval.
Goal 150 adds the launch evidence checklist inside `/admin/launch-gate` so
staging URL, Supabase posture, auth callback, RLS/CI, proof storage,
device/PWA/accessibility QA, monitoring, integration hold, and pilot support
ownership can be collected before any pilot approval.
Goal 132 adds `/admin/release-readiness` as the focused read-only MVP
release-readiness summary before deeper launch, security, operations, or pilot
approval routes.
Goal 133 adds `/admin/review-path` as the focused read-only no-code stakeholder
walkthrough with fake local actor emails, route-level review expectations, and
safety boundaries before final Nick review.
Goal 134 makes `/login` a first-class local sign-in review checkpoint for fake
seed users and Supabase Auth session readiness without enabling production auth.
Goal 135 makes `/chapter` a first-class member chapter-home review checkpoint
without enabling membership, role, points, campaign, proof, or external writes.
Goal 136 makes `/rush-month/actions/member-push` a first-class member action
detail review checkpoint without enabling action-start saves, proof metadata
saves, file uploads, points/KPI writes, reminders, or external writes.
Goal 137 makes `/rush-month` a first-class member Rush Month overview review
checkpoint without enabling campaign phase changes, assignment saves, proof
saves, points/KPI writes, Luma writes, n8n workflows, or external writes.
Goal 138 makes `/rush-month/actions` a first-class member assigned-actions
review checkpoint without enabling assignment creation, action-start saves,
proof saves, reminders, points/KPI writes, browser writes, or external writes.
Goal 139 makes `/rush-month/events` a first-class member events review
checkpoint without enabling attendance imports, NPS reminders, proof uploads,
public proof sharing, Luma writes, warehouse exports, AI summaries, or external
writes.
Goal 140 orders the `/admin/review-path` member walkthrough from local sign-in
through profile scope, onboarding, chapter home, Rush Month overview, assigned
actions, action detail, evidence, leaderboard, dashboard, events, and one event
detail before leader, coach, and admin surfaces without enabling any new writes
or external sends.
Goal 141 adds a President / VP dashboard checkpoint to the leader walkthrough
before leader follow-up, member-role coverage, the operating loop, event
readiness, and proof decisions without enabling assignment creation, proof
decision writes, membership changes, KPI writes, reminders, or external sends.
Goal 142 separates coach portfolio health from coach readiness in the
stakeholder walkthrough so reviewers can inspect assigned chapters, campaign
health, overdue work, pending evidence, KPI movement, risk alerts,
advance/hold/intervene posture, support notes, and disabled coach decisions
without enabling coach decisions, notes, reassignments, KPI writes, n8n
workflows, or external sends.
Goal 143 orders the admin walkthrough from control center to master data,
integration outbox, audit log, system health, database security, final review
path, release readiness, launch gate, design QA, operations, and write packets
without enabling user creation, role writes, chapter edits, campaign template
edits, outbox mutations, audit exports, system-health launch claims, admin
writes, or external sends.
Goal 144 adds a phase map to `/admin/review-path` so reviewers can scan the
member, leader, proof, coach, admin, and write-packet phases before opening the
43 detailed route checks without enabling production auth, browser writes,
uploads, public proof sharing, or external sends.
Goal 145 adds `/admin/nick-review` as the final local MVP review packet for
owner lanes, pass signals, launch boundaries, local review yes, live launch no,
zero writes, zero sends, and zero student invitations before any pilot decision.
Goal 151 extends `/admin/nick-review` with the Goal 150 launch evidence
checkpoint and first-pilot scope route before any pilot decision.
Goal 160 extends `/chapter/members` with a membership approval packet that
shows the future join-request payload, `app.approve_chapter_membership`
function target, readiness checks, structured event, disabled outbox, audit
action, and locked controls before any membership approval write is approved.
Goal 161 adds membership approval result states for success, disabled,
welcome-disabled, CRM-disabled, duplicate, auth, permission, missing request,
profile, role, audit reason, and server-error outcomes before any membership
approval write is approved.
Goal 162 adds membership approval write readiness on `/chapter/members`, the
write plan, browser-write gate, and staff rehearsal surfaces. It names the future
`app.approve_chapter_membership` function, required SQL/RLS tests, future
membership/event/outbox/audit tables, and disabled welcome/CRM posture while
keeping the database function and RLS checks blocked.
Goal 152 extends `/rush-month/evidence` with proof prep checklists, story
prompts, review lanes, proof-intake links, and disabled controls before any
proof metadata save or upload is approved.
Goal 158 extends `/rush-month/evidence` with a proof submission packet that
shows the future metadata payload, `app.submit_assignment_proof_metadata`
function target, result preview, readiness checks, structured event, disabled
outbox, and audit action before any proof metadata save or upload is approved.
Goal 159 extends `/proof-library/upload` with a proof storage intake packet that
shows the future private bucket, storage-path preview,
`app.prepare_proof_upload_intake` function target, required metadata,
moderation queue, structured event, disabled outbox, audit action, and locked
storage controls before any Supabase Storage bucket or upload write is approved.
Goal 153 extends `/rush-month/review` with a leader proof review rubric for
assignment fit, story context, points/KPI impact, and the HQ sharing boundary
before any leader proof decision save, nudge, public sharing action, or external
send is approved.
Goal 154 extends `/coach` with a coach intervention checklist for proof review,
stalled work, decision notes, risk response, and escalation boundaries before
any coach note save, coach decision save, nudge, escalation send, or external
automation is approved.
Goal 155 extends `/admin/integration-outbox` with a live-send preflight
checklist for source events, payload/idempotency, audit readback, destination
policy, and secrets boundaries before any queue mutation, retry, payload edit,
unlock, external worker, or live send is approved.
Goal 156 extends `/admin/audit-log` with a write-audit preflight checklist for
actor identity, target readback, before/after summaries, reason notes,
visibility boundaries, and retention/export locks before any audit-producing
production write is approved.
Goal 157 extends `/onboarding` with a staff-only production auth preflight for
callback URLs, role coverage, auth/profile mapping, join approval, chapter role
assignment, coach scope, staff role assignment, audit/outbox posture, and
rollback ownership before any real users are invited.
Goal 146 extends `/admin/design-qa` with an eight-route mobile visual smoke plan
for the 390px phone viewport across member Rush Month, assigned actions,
evidence, leader dashboard, coach portfolio, Nick final review, offline
recovery, and proof-upload readiness routes.
Goal 147 connects that same mobile plan to the admin route smoke manifest, so
`/admin` shows reviewer actor emails, 390px viewport, target signals, pass
signals, and still-blocked launch boundaries for the eight mobile checks.
Goal 148 extends `/admin/design-qa` with a seven-check accessibility smoke plan
for skip links, focus order, screen-reader headings, disabled proof controls,
coach risk copy, offline recovery, and restricted admin states.
Goal 149 extends `/admin/design-qa` with a seven-check real-device/PWA smoke
matrix for iPhone Safari, Android Chrome, installed PWA behavior, offline
recovery, tablet leader review, desktop admin review, and staging
cross-browser rendering.

This does not connect the app to production Supabase. It does not create real
users, enable production auth in the UI, enable browser writes beyond the local
action-start, assignment creation, proof metadata, HQ proof decision, coach
decision, and explicitly gated leader proof decision slices, or trigger
HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI writes.

## What Was Added

- `supabase/config.toml`: standard local Supabase project config.
- `supabase/migrations/20260615110000_initial_supabase_foundation.sql`: first
  local schema, role helpers, RLS policies, grants, and safety triggers.
- `supabase/migrations/20260615130000_goal_7_campaign_operating_model.sql`:
  local campaign operating model refinements for templates, readiness, campaign
  lanes, risk flags, closeouts, and assignment operating fields.
- `supabase/migrations/20260616090000_goal_14_action_start_write.sql`: first
  local action-start write function plus direct-start bypass protection.
- `supabase/migrations/20260616093000_goal_15_proof_submission_write.sql`:
  first local proof/testimonial metadata write function plus direct evidence
  insert bypass protection.
- `supabase/migrations/20260616103000_goal_16_hq_proof_sharing_decision.sql`:
  first local HQ proof-sharing decision write function plus direct approval
  insert bypass protection.
- `supabase/migrations/20260616110000_goal_18_leader_assignment_create.sql`:
  first local chapter-leader assignment creation function plus direct
  assignment insert bypass protection.
- `supabase/migrations/20260616120000_goal_27_coach_decision.sql`: first local
  coach advance / hold / intervene function plus direct readiness validation
  bypass protection.
- `supabase/migrations/20260617010000_goal_115_leader_proof_decision.sql`:
  first local leader proof decision function plus direct approval, points, KPI,
  and evidence-status bypass protection.
- `supabase/seed.sql`: fake local users, chapters, memberships, staff roles,
  Rush Month records, proof/testimonial records, disabled/mock outbox rows, and
  fake Goal 7 operating-model records, including one local submitted proof
  fixture for Goal 116 leader proof decision rehearsal.
- `supabase/tests/database/rls_goal_5.test.sql`: pgTAP tests for the first RLS
  permission model.
- `supabase/tests/database/rls_goal_7.test.sql`: pgTAP tests for campaign
  template, readiness, lane ownership, risk, closeout, and assignment-field
  protection boundaries.
- `supabase/tests/database/rls_goal_14.test.sql`: pgTAP tests for the first
  local `action_started` database write path.
- `supabase/tests/database/rls_goal_15.test.sql`: pgTAP tests for the first
  local `evidence_submitted` proof/testimonial metadata write path.
- `supabase/tests/database/rls_goal_16.test.sql`: pgTAP tests for the first
  local `hq_sharing_decision_logged` proof/testimonial sharing decision path.
- `supabase/tests/database/rls_goal_18.test.sql`: pgTAP tests for the first
  local `action_assigned` assignment creation path.
- `supabase/tests/database/rls_goal_27.test.sql`: pgTAP tests for the first
  local `coach_decision_logged` readiness decision path.
- `supabase/tests/database/rls_goal_115.test.sql`: pgTAP tests for the first
  local `leader_proof_decision` approval / request-changes / reject path.
- `src/services/leader-proof-decision-write.ts`: local-only server-action
  readiness, RPC result mapping, and readback handling for Goal 116.
- `src/components/leader-proof-decision-server-action-panel.tsx`: gated
  `/rush-month/review` panel for the local leader proof decision rehearsal.
- `tests/leader-proof-decision-write.test.ts`: unit coverage for disabled
  default state, local auth and role gates, RPC mapping, and readback states.
- `docs/architecture/goal-116-leader-proof-decision-server-action.md`: review
  packet for the local-only browser/server-action boundary.
- `src/lib/supabase-readonly.ts`: server-only REST reader for local Supabase.
- `src/services/read-only-app-data.ts`: mock-safe read model used by app pages.
- `.env.example`: local-only read configuration template.
- `src/services/local-actor-context.ts`: local-only actor context reader for
  fake seed users, memberships, staff roles, and coach assignments.
- `src/components/local-actor-notice.tsx`: visible local actor context display
  used by read-only pages.
- `src/services/role-visibility.ts`: read-only role visibility helpers for the
  local app shell.
- `src/components/local-role-switcher.tsx`: local debug panel listing fake
  actor emails for `MYMEDLIFE_LOCAL_ACTOR_EMAIL`.
- `src/components/restricted-state.tsx`: plain-English restricted-state UI for
  roles that should not read a page or panel.
- `src/services/local-action-contracts.ts`: local-only action/proof/HQ sharing
  contract previews for future write implementation.
- `tests/local-action-contracts.test.ts`: unit tests proving the local contract
  boundaries before any app writes are introduced.
- `src/services/write-readiness.ts`: disabled write-readiness airlock for future
  action/proof/HQ decision persistence.
- `src/components/write-readiness-notice.tsx`: visible no-write notice listing
  future tables that would be touched after approval.
- `tests/write-readiness.test.ts`: unit tests proving writes remain disabled,
  even when the local write env var is set.
- `docs/architecture/goal-13-local-write-implementation-plan.md`: reviewable
  local write plan for the first future write operations.
- `src/services/write-plan-matrix.ts`: typed plan matrix for future write
  operations, role boundaries, table targets, and required tests.
- `tests/write-plan-matrix.test.ts`: unit tests keeping the write plan aligned
  with the disabled write-readiness airlock.
- `docs/architecture/goal-14-action-start-write.md`: local action-start write
  architecture note.
- `docs/architecture/goal-15-proof-submission-write.md`: local
  proof/testimonial metadata write architecture note.
- `docs/architecture/goal-16-hq-proof-sharing-decision.md`: local HQ
  proof/testimonial sharing decision architecture note.
- `docs/architecture/goal-17-proof-video-storage-plan.md`: proof/video storage
  architecture plan with uploads still disabled.
- `docs/architecture/goal-18-leader-assignment-create.md`: local
  chapter-leader assignment creation architecture note.
- `docs/architecture/goal-19-auth-onboarding-plan.md`: future auth/onboarding
  architecture note with live auth still disabled.
- `docs/architecture/goal-122-auth-onboarding-readiness-route.md`: read-only
  auth/onboarding reviewer route with live auth, production users, onboarding
  writes, and external sends still disabled.
- `docs/architecture/goal-157-production-auth-onboarding-preflight.md`: review
  packet for the staff production auth preflight before real users, callbacks,
  onboarding writes, role writes, or automations are approved.
- `docs/architecture/goal-123-evidence-submission-readiness-route.md`:
  member-facing evidence submission queue with proof metadata saves, uploads,
  public proof, exports, reminders, and AI summaries still disabled.
- `docs/architecture/goal-158-proof-submission-packet.md`: review packet for
  the evidence-route proof payload, readiness checks, structured event, disabled
  outbox, and audit action before proof metadata saves are approved.
- `src/services/admin-master-data-workspace.ts`: read-only admin inventory
  workspace for fake users, named roles, chapters, and campaign templates with
  production user, role, chapter, template, coach assignment, and external-send
  controls still disabled.
- `src/app/admin/master-data/page.tsx`: focused admin/DS Admin/Super Admin
  review route for the master-data inventory.
- `tests/admin-master-data-workspace.test.ts`: unit tests proving the focused
  admin inventory stays readable only to admin audiences and keeps admin
  mutations, production auth, and external writes disabled.
- `docs/architecture/goal-124-admin-master-data-route.md`: review packet for
  the focused admin master-data route.
- `src/services/admin-integration-outbox-workspace.ts`: read-only DS/Admin
  integration and outbox workspace for structured events, disabled queue rows,
  Goal 155 live-send preflight, destination safety, audit posture, and blocked
  live-send controls.
- `src/app/admin/integration-outbox/page.tsx`: focused admin/DS Admin/Super
  Admin review route for integration and automation queue posture.
- `tests/admin-integration-outbox-workspace.test.ts`: unit tests proving the
  focused outbox route hides operating roles, hides audit row details from DS
  Admin, and keeps live sends, external writes, browser writes, and secrets at
  zero.
- `docs/architecture/goal-125-admin-integration-outbox-route.md`: review packet
  for the focused admin integration outbox route.
- `src/app/admin/audit-log/page.tsx`: focused admin/DS Admin/Super Admin audit
  posture route that reuses the read-only audit review service and Goal 156
  write-audit preflight checklist.
- `docs/architecture/goal-126-admin-audit-log-route.md`: review packet for the
  focused admin audit log route.
- `docs/architecture/goal-156-admin-write-audit-preflight.md`: review packet
  for the audit preflight checklist before production write approval.
- `src/app/admin/system-health/page.tsx`: focused admin/DS Admin/Super Admin
  system-health route that reuses the read-only system health review service.
- `docs/architecture/goal-127-admin-system-health-route.md`: review packet for
  the focused admin system health route.
- `src/app/admin/design-qa/page.tsx`: focused admin/DS Admin/Super Admin
  design-QA route that reuses the read-only Figma/mobile QA readiness service
  and renders the Goal 146 mobile visual smoke plan.
- `docs/architecture/goal-128-admin-design-qa-route.md`: review packet for the
  focused admin design QA route.
- `docs/architecture/goal-146-mobile-visual-smoke-plan.md`: review packet for
  the eight-route phone-sized visual smoke plan.
- `docs/architecture/goal-147-mobile-route-smoke-manifest.md`: review packet
  for the route-smoke bridge that reuses the Goal 146 mobile checks.
- `docs/architecture/goal-148-accessibility-smoke-plan.md`: review packet for
  the keyboard and screen-reader accessibility smoke plan.
- `docs/architecture/goal-149-device-pwa-smoke-matrix.md`: review packet for
  real-device, installed-PWA, offline, tablet, desktop, and staging QA.
- `src/app/admin/operations/page.tsx`: focused admin/DS Admin/Super Admin
  operations route that reuses the read-only production operations runbook
  service.
- `docs/architecture/goal-129-admin-operations-route.md`: review packet for the
  focused admin operations route.
- `src/app/admin/database-security/page.tsx`: focused admin/DS Admin/Super
  Admin route for the Supabase Postgres/Auth/Storage versus PlanetScale
  MySQL/Vitess review.
- `docs/architecture/goal-130-admin-database-security-route.md`: review packet
  for the focused admin database-security route.
- `src/app/admin/launch-gate/page.tsx`: focused admin/DS Admin/Super Admin
  route for the production launch gate and Goal 150 launch evidence checklist.
- `docs/architecture/goal-131-admin-launch-gate-route.md`: review packet for
  the focused admin launch-gate route.
- `docs/architecture/goal-150-launch-evidence-checklist.md`: review packet for
  the staging and pilot launch evidence checklist.
- `src/app/admin/release-readiness/page.tsx`: focused admin/DS Admin/Super
  Admin route for the MVP release-readiness summary.
- `docs/architecture/goal-132-admin-release-readiness-route.md`: review packet
  for the focused admin release-readiness route.
- `src/app/admin/review-path/page.tsx`: focused admin/DS Admin/Super Admin
  route for the no-code stakeholder review path.
- `docs/architecture/goal-133-admin-review-path-route.md`: review packet for
  the focused admin stakeholder review path route.
- `src/app/admin/nick-review/page.tsx`: focused admin/DS Admin/Super Admin
  route for the final local Nick review packet and Goal 151 pilot approval
  checkpoint.
- `src/services/nick-mvp-review.ts`: final local review packet data, pass
  signals, launch boundaries, and zero-write / zero-send / zero-invite posture.
- `src/components/nick-mvp-review-panel.tsx`: panel used on `/admin` and
  `/admin/nick-review`.
- `docs/architecture/goal-134-local-sign-in-review-coverage.md`: review packet
  for local sign-in review coverage.
- `docs/architecture/goal-135-member-chapter-home-review-coverage.md`: review
  packet for member chapter-home review coverage.
- `docs/architecture/goal-136-member-action-detail-review-coverage.md`: review
  packet for member action-detail review coverage.
- `docs/architecture/goal-137-member-rush-month-overview-review-coverage.md`:
  review packet for member Rush Month overview review coverage.
- `docs/architecture/goal-138-member-assigned-actions-review-coverage.md`:
  review packet for member assigned-actions review coverage.
- `docs/architecture/goal-139-member-rush-month-events-review-coverage.md`:
  review packet for member Rush Month events review coverage.
- `docs/architecture/goal-140-member-walkthrough-sequence.md`: review packet
  for the member walkthrough sequence in the stakeholder review path.
- `docs/architecture/goal-141-leader-walkthrough-sequence.md`: review packet
  for the leader walkthrough sequence in the stakeholder review path.
- `docs/architecture/goal-142-coach-walkthrough-sequence.md`: review packet
  for the coach walkthrough sequence in the stakeholder review path.
- `docs/architecture/goal-143-admin-walkthrough-sequence.md`: review packet
  for the admin walkthrough sequence in the stakeholder review path.
- `docs/architecture/goal-144-stakeholder-review-phase-map.md`: review packet
  for the phase map in the stakeholder review path.
- `docs/architecture/goal-145-nick-final-review-packet.md`: review packet for
  the final local Nick review route.
- `docs/architecture/goal-20-live-data-connection-plan.md`: future
  route-by-route live-data connection plan with production data still disabled.
- `docs/architecture/goal-21-campaign-operating-shells.md`: read-only campaign
  shells and action committee/proof-library posture.
- `docs/architecture/goal-22-rush-month-dashboard.md`: role-aware Rush Month
  dashboard with browser writes still disabled.
- `docs/architecture/goal-23-action-start-browser-write-gate.md`: visible
  action-start browser write activation gate with enabled controls still
  disabled.
- `docs/architecture/goal-24-leader-assignment-write-gate.md`: visible
  assignment-create browser write activation gate with enabled controls still
  disabled.
- `docs/architecture/goal-25-proof-submission-browser-write-gate.md`: visible
  proof-submission browser write activation gate with enabled controls still
  disabled.
- `docs/architecture/goal-26-hq-proof-sharing-browser-write-gate.md`: visible
  HQ proof-sharing decision browser write activation gate with enabled controls
  still disabled.
- `docs/architecture/goal-27-coach-decision-browser-write-gate.md`: visible
  coach decision browser write activation gate with enabled controls still
  disabled.
- `docs/architecture/goal-58-local-auth-sign-in.md`: local Supabase Auth
  sign-in architecture note with production auth still disabled.
- `docs/architecture/goal-59-auth-derived-actor-context.md`: local Auth session
  to app actor context architecture note with writes still disabled.
- `docs/architecture/goal-60-action-start-server-action.md`: local
  action-start server action architecture note.
- `docs/architecture/goal-61-action-start-readback.md`: local action-start
  readback proof note for the stable fake seed assignment.
- `docs/architecture/goal-62-proof-submission-server-action.md`: local
  proof/testimonial metadata server action architecture note.
- `docs/architecture/goal-63-hq-proof-decision-server-action.md`: local HQ
  proof/testimonial decision server action architecture note.
- `docs/architecture/goal-64-leader-assignment-server-action.md`: local
  chapter-leader assignment creation server action architecture note.
- `src/services/assignment-create-write.ts`: local assignment creation write
  readiness, RPC result mapping, and readback state.
- `src/components/leader-assignment-server-action-panel.tsx`: local-only
  assignment creation form and readback panel for the actions page.
- `docs/architecture/goal-65-coach-decision-server-action.md`: local coach
  decision server action architecture note.
- `src/services/coach-decision-write.ts`: local coach decision write readiness,
  RPC result mapping, and readback state.
- `src/components/coach-decision-server-action-panel.tsx`: local-only coach
  decision form and readback panel for the coach page.
- `src/services/auth-onboarding-plan.ts`: disabled auth/onboarding plan for
  future sign-in, join requests, membership approvals, and role assignments.
- `src/services/auth-onboarding-workspace.ts`: read-only onboarding route state
  that makes the future sequence, owner boundaries, and staff production auth
  preflight reviewable without writes.
- `tests/auth-onboarding-plan.test.ts`: unit tests proving live auth and
  production users remain disabled.
- `tests/auth-onboarding-workspace.test.ts`: unit tests proving `/onboarding`
  stays event-ready, browser-disabled, and write-safe for member, leader, DS
  Admin, and Super Admin actors while staff can inspect the Goal 157 production
  auth preflight.
- `src/services/evidence-submission-workspace.ts`: read-only proof submission
  queue for the evidence route with Goal 152 proof prep packets, future records,
  Goal 158 proof submission packet, and blocked write posture.
- `src/services/proof-upload-intake.ts`: read-only proof upload route state with
  Goal 159 storage intake packets, future bucket/path previews, consent and
  moderation gates, disabled outbox posture, and locked storage controls.
- `src/services/private-proof-upload-write.ts`: localhost-only private proof
  upload gate, storage-path helpers, queue row shaping, and audited RPC result
  mapping for Goal 160.
- `src/services/private-proof-upload-workspace.ts`: role-scoped upload queue
  for `/proof-library/upload`, including submitter-only raw upload ownership and
  HQ cleanup visibility.
- `src/components/private-proof-upload-panel.tsx`: browser-facing private proof
  upload and removal forms that stay localhost-only and keep public proof off.
- `src/app/proof-library/upload/actions.ts`: server actions that prepare the
  private bucket path, upload one file, remove one file, and persist the
  audited bundle.
- `src/services/chapter-membership-workspace.ts`: read-only membership route
  state with Goal 160 membership approval packets, join-request payload
  previews, readiness checks, disabled outbox posture, and locked approval
  controls.
- `src/services/membership-approval-result-states.ts`: membership approval
  result-state definitions for the Goal 161 future write family.
- `src/services/membership-approval-write-readiness.ts`: Goal 162 readiness
  checks for the future membership approval write, including env flags,
  still-missing SQL/RLS implementation checks, disabled welcome/CRM sends, and
  required RLS test names.
- `tests/evidence-submission-workspace.test.ts`: unit tests proving the evidence
  route keeps uploads, external sends, and public proof disabled while guiding
  members/leaders to the right next proof item.
- `tests/proof-upload-intake.test.ts`: unit tests proving the proof upload route
  keeps file uploads disabled while exposing the Goal 159 storage packet for
  reviewers.
- `tests/private-proof-upload-write.test.ts`: unit tests proving the Goal 160
  private upload gate, path convention, row permissions, and RPC result mapping
  stay explicit.
- `tests/chapter-membership-workspace.test.ts`: unit tests proving membership
  approval packets are visible to leaders/admins, hidden from coaches and DS
  Admin, and still keep membership writes disabled.
- `tests/membership-approval-result-states.test.ts`: unit tests proving
  membership approval success and blocked result states are explicit while
  welcome messages and CRM syncs remain disabled.
- `tests/membership-approval-write-readiness.test.ts`: unit tests proving
  membership approval write readiness remains blocked even if local write flags
  are requested before SQL/RLS implementation exists.
- `src/services/local-actor-context.ts`: actor context service that now prefers
  the signed-in local auth user and falls back to `MYMEDLIFE_LOCAL_ACTOR_EMAIL`.
- `src/services/action-start-write.ts`: local action-start write readiness and
  RPC result mapping.
- `src/services/proof-submission-write.ts`: local proof/testimonial metadata
  write readiness, RPC result mapping, and readback state.
- `src/components/proof-submission-server-action-panel.tsx`: local-only proof
  metadata form and readback panel for action detail pages.
- `tests/proof-submission-write.test.ts`: unit tests proving proof metadata
  writes stay gated and map local RPC results safely.
- `src/services/hq-proof-decision-write.ts`: local HQ proof decision write
  readiness, RPC result mapping, and readback state.
- `src/components/hq-proof-decision-server-action-panel.tsx`: local-only HQ
  decision form and readback panel for the review route.
- `tests/hq-proof-decision-write.test.ts`: unit tests proving HQ decisions stay
  gated and map local RPC results safely.
- `src/services/live-data-connection-plan.ts`: disabled live-data migration
  plan for route order and connection mode.
- `tests/live-data-connection-plan.test.ts`: unit tests proving production
  Supabase, browser writes, and external writes remain disabled.
- `src/services/browser-write-activation.ts`: first action-start browser write
  gate that references the existing local function without enabling it.
- `src/components/browser-write-gate-notice.tsx`: visible reviewer-facing gate
  notice on action detail pages.
- `tests/browser-write-activation.test.ts`: unit tests proving the gate keeps
  enabled browser controls disabled until explicit approval.
- `src/services/proof-storage-readiness.ts`: disabled upload readiness plan for
  future proof files.
- `tests/proof-storage-readiness.test.ts`: unit tests proving proof uploads and
  public publishing remain disabled.
- `src/services/first-write-activation-drill.ts`: staff-only first-write drill,
  readback evidence, and verification packet for the first action-start local
  write.
- `src/components/first-write-activation-drill-panel.tsx`: `/admin/first-write`
  panel with readiness checks, operator packet, readback evidence, and stop
  conditions.
- `tests/first-write-activation-drill.test.ts`: unit tests for first-write
  readiness, readback evidence, and packet decision states.
- `src/services/write-sequence-planner.ts`: staff-only promotion map for the
  local Rush Month write sequence, expected tables, events, audit evidence, and
  disabled outbox posture.
- `src/components/write-sequence-planner-panel.tsx`: `/admin/write-sequence`
  panel for reviewing the next safe write after the first action-start drill.
- `tests/write-sequence-planner.test.ts`: unit tests proving write-sequence
  visibility, DS Admin safety review, route order, and zero external sends.
- `src/services/proof-metadata-verification-packet.ts`: staff-only packet for
  metadata-only proof/testimonial submission after action-start readback is
  proven.
- `src/components/proof-metadata-verification-panel.tsx`: `/admin/proof-write`
  panel with local env settings, fake member sign-in, stop conditions, and
  readback evidence for evidence item/event/outbox/audit rows.
- `tests/proof-metadata-verification-packet.test.ts`: unit tests proving proof
  metadata packet blocking, ready state, readback, upload safety, and role
  visibility.
- `src/services/hq-proof-decision-verification-packet.ts`: staff-only packet
  for local HQ proof-sharing decisions after proof metadata readback is proven.
- `src/components/hq-proof-decision-verification-panel.tsx`:
  `/admin/hq-proof-write` panel with local env settings, fake Admin sign-in,
  stop conditions, and readback evidence for event/outbox/audit rows.
- `tests/hq-proof-decision-verification-packet.test.ts`: unit tests proving HQ
  decision packet blocking, ready state, readback, public-sharing safety, and
  role visibility.
- `src/services/leader-assignment-verification-packet.ts`: staff-only packet
  for local chapter-leader assignment creation after HQ decision readback is
  proven.
- `src/components/leader-assignment-verification-panel.tsx`:
  `/admin/assignment-write` panel with local env settings, fake leader sign-in,
  stop conditions, and readback evidence for assignment/event/outbox/audit rows.
- `tests/leader-assignment-verification-packet.test.ts`: unit tests proving
  assignment packet blocking, ready state, duplicate safety, readback, reminder
  safety, and role visibility.

## Requirements

Install or make available:

- Docker
- pnpm

The repo scripts use `pnpm dlx supabase@2.106.0` so contributors do not need a
global Supabase CLI install.

## Local Commands

Start Supabase:

```bash
pnpm supabase:start
```

Apply migrations and seed fake data:

```bash
pnpm supabase:reset
```

Run the RLS/security tests:

```bash
pnpm supabase:test
```

Run normal app checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Optional Read-Only App Connection

The app uses mock data by default. To test the first local Supabase read path:

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

```bash
MYMEDLIFE_DATA_SOURCE=supabase
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=false
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<local service role key from supabase start>
MYMEDLIFE_LOCAL_ACTOR_EMAIL=member.a@mymedlife.test
```

Then run:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm dev
```

Open these routes:

- `http://localhost:3000/chapter`
- `http://localhost:3000/rush-month`
- `http://localhost:3000/rush-month/actions`
- `http://localhost:3000/coach`
- `http://localhost:3000/admin`

Each route shows a small data-source notice and local actor context notice. If
the local Supabase URL or key is missing, unsafe, or unavailable, the app falls
back to mock data.

Goal 8 intentionally uses a server-only read path. Goal 9 adds local-only actor
switching by fake seed email. Goal 10 uses that actor to filter read-only
navigation, assignments, risks, admin panels, and integration/outbox visibility.
Goal 11 adds local-only action/proof/HQ sharing contract previews. This does
not add browser auth, student sign-in, production auth, app writes, proof
uploads, public sharing, or external automation. The local role switcher can
set a browser-local preview cookie so reviewers can move through fake roles
without changing env vars. Goal 12 adds a disabled write-readiness layer so
future table targets are visible while code still blocks writes. Goal 13 adds
the first local write implementation plan and test matrix. Goal 14 adds the
first local Supabase database write function for `action_started`, but it still
does not add browser save controls or production auth. Goal 15 adds the first
local Supabase proof/testimonial metadata write function for
`evidence_submitted`, but it still does not add browser save controls, file
uploads, public proof sharing, or external sends. Goal 16 adds the first local
Supabase HQ proof-sharing decision write function for
`hq_sharing_decision_logged`, but it still does not add browser save controls,
public publishing, or external sends. Goal 17 documents the future proof/video
storage layer and adds disabled upload readiness tests, but it still does not
create buckets, upload files, publish proof, or send external automation. Goal
160 adds the first localhost-only private proof upload write: one submitter can
attach one private raw file to one existing proof metadata row, HQ cleanup roles
can remove it, storage RLS keeps cross-user access blocked, and public proof
plus external sends remain off. Goal 18 adds the first local Supabase
assignment creation function for
`action_assigned`, but it still does not add browser save controls, production
auth, or external sends. Goal 19 defines the future auth/onboarding path, but
it still does not enable live auth, browser sessions, production users,
membership approvals, role assignments, or external sends. Goal 20 defines the
future route-by-route live-data migration order, but it still does not enable
production Supabase, browser writes, or external sends. Goal 27 adds the first
local Supabase coach decision function for `coach_decision_logged` and a visible
browser gate on `/coach`, but it still does not enable browser saves, live auth,
n8n escalation packets, or external sends.
Goal 115 adds the local Supabase leader proof decision function for
`leader_proof_decision`. Goal 116 adds the local browser/server action for that
function, but it still does not enable production saves, production auth, member
nudges, public proof publishing, or external sends.

## GitHub CI

The PR workflow at `.github/workflows/goal-5-ci.yml` runs two jobs:

- app checks: lint, typecheck, unit tests, and build
- Supabase RLS tests: starts local Supabase on an Ubuntu runner, resets the
  database with fake seed data, and runs `supabase test db`

## Fake Users

The seed file creates fake local-only users:

- `member.a@mymedlife.test`: General Member in UCLA MEDLIFE.
- `committee.member@mymedlife.test`: Action Committee Member in Northview.
- `committee.chair@mymedlife.test`: Action Committee Chair in Northview.
- `leader.a@mymedlife.test`: President/VP in Northview.
- `eboard.a@mymedlife.test`: E-Board Member in Northview.
- `coach@mymedlife.test`: Coach assigned to Northview only.
- `admin@mymedlife.test`: MEDLIFE Admin.
- `ds.admin@mymedlife.test`: DS Admin for integration/outbox controls.
- `super.admin@mymedlife.test`: Super Admin.
- `member.b@mymedlife.test`: General Member in Lakeside MEDLIFE.
- `unrelated@mymedlife.test`: Requested but unapproved member.

All seed data is fake and local-only.

## Goal 61 Action-Start Readback Test

After running the local Supabase reset, use this fake Northview assignment to
test the first localhost-only action-start browser write:

```text
50000000-0000-4000-8000-000000000003
```

Recommended local test path:

1. Set `MYMEDLIFE_DATA_SOURCE=supabase`.
2. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
3. Set `MYMEDLIFE_AUTH_MODE=local_supabase`.
4. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
5. Set `MYMEDLIFE_ENABLE_ACTION_START_WRITE=true`.
6. Sign in at `/login` as `member.a@mymedlife.test` with password `password`.
7. Open `/rush-month/actions/50000000-0000-4000-8000-000000000003`.
8. Click `Start this action`.
9. Confirm the refreshed page shows the assignment status as `in_progress` and
   the local readback success message.

This test still does not enable production auth, external sends, proof uploads,
public proof sharing, or any write path except the local action-start slice.

## Goal 62 Proof/Testimonial Metadata Test

Goal 62 uses the same fake Northview assignment after it has been started. The
assignment must be `in_progress` or `changes_requested` before proof metadata
can be saved.

Recommended local test path:

1. Complete the Goal 61 action-start test above for
   `50000000-0000-4000-8000-000000000003`.
2. Keep `MYMEDLIFE_DATA_SOURCE=supabase`.
3. Keep `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
4. Keep `MYMEDLIFE_AUTH_MODE=local_supabase`.
5. Keep `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
6. Set `MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=true`.
7. Keep `MYMEDLIFE_ALLOW_PROOF_UPLOADS=false`.
8. Stay signed in as `member.a@mymedlife.test`.
9. Open `/rush-month/actions/50000000-0000-4000-8000-000000000003`.
10. Submit the local proof/testimonial metadata form.
11. Confirm the refreshed page shows the assignment status as `submitted` and
    the local proof readback success message.

Expected database behavior:

- `app.submit_assignment_proof_metadata(...)` writes the evidence metadata row.
- The assignment status changes to `submitted`.
- An internal `evidence_submitted` event is recorded.
- An integration event is recorded for future automation pickup.
- A disabled automation outbox row is recorded.
- An audit log row is recorded.

This test still does not upload files, publish proof, enable production auth,
or send HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI writes.

## Goal 63 HQ Proof/Testimonial Decision Test

After running the local Supabase reset, use this fake Northview proof item to
test the first localhost-only HQ proof decision browser write:

```text
60000000-0000-4000-8000-000000000001
```

Recommended local test path:

1. Set `MYMEDLIFE_DATA_SOURCE=supabase`.
2. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
3. Set `MYMEDLIFE_AUTH_MODE=local_supabase`.
4. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
5. Set `MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE=true`.
6. Sign in at `/login` as `admin@mymedlife.test` with password `password`.
7. Open `/admin/hq-proof-write`.
8. Confirm the packet says proof metadata readback is proven and public proof
   sharing remains disabled.
9. Open `/rush-month/review`.
10. Confirm the proof queue reads the local evidence item.
11. Submit the local HQ proof decision form.
12. Return to `/admin/hq-proof-write`.
13. Confirm the packet shows proof status, event, integration event, disabled
    outbox, and audit readback evidence.
14. Confirm the refreshed review page shows the proof status as `approved` or
    `changes_requested`, depending on the selected decision, and shows the local
    HQ decision readback message.

Expected database behavior:

- `app.record_hq_proof_sharing_decision(...)` updates the evidence review and
  sharing posture.
- An `approvals` row is recorded.
- An internal `hq_sharing_decision_logged` event is recorded.
- An integration event is recorded for future automation pickup.
- A disabled automation outbox row is recorded.
- An audit log row is recorded.

This test still does not upload files, publish proof, enable production auth,
or send HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI writes.

## Goal 64 Leader Assignment Creation Test

After running the local Supabase reset, use the fake Northview Rush Month
campaign through `/rush-month/actions`.

Recommended local test path:

1. Set `MYMEDLIFE_DATA_SOURCE=supabase`.
2. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
3. Set `MYMEDLIFE_AUTH_MODE=local_supabase`.
4. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
5. Set `MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=true`.
6. Open `/admin/assignment-write`.
7. Confirm the packet says HQ proof decision readback is proven and reminders
   remain disabled.
8. Sign in at `/login` as `leader.a@mymedlife.test` with password `password`.
9. Open `/rush-month/actions`.
10. Confirm the local leader assignment creation panel is enabled.
11. Submit the local assignment form.
12. Return to `/admin/assignment-write`.
13. Confirm the packet shows assignment, event, integration event, disabled
    outbox, and audit readback evidence.
14. Confirm the refreshed page shows the assignment-created result and local
    readback when the new assignment is visible.

Expected database behavior:

- `app.create_chapter_assignment(...)` creates the assignment row.
- An internal `action_assigned` event is recorded.
- An integration event is recorded for future automation pickup.
- A disabled automation outbox row is recorded.
- An audit log row is recorded.

This test still does not send reminders, enable production auth, upload files,
publish proof, or send HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or
AI writes.

## Goal 81 Coach Decision Packet

`/admin/coach-write` is the staff-only operator packet for the local
`coach_decision_logged` test. Use it after `/admin/assignment-write` shows
leader assignment readback evidence.

The packet checks:

- local Supabase reads are active
- chapter, campaign, and phase IDs are real UUIDs
- leader assignment readback has already been proven
- local Supabase Auth mode is selected
- `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`
- `MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=true`
- fake coach auth is signed in
- escalation packets and external sends remain disabled

The page is read-only. It should not send n8n escalation packets, create HubSpot
notes, send email/SMS, write to Luma, export to a warehouse, update Power BI, or
generate AI summaries.

## Goal 65 Coach Decision Test

After running the local Supabase reset, use the fake Northview Rush Month coach
page.

Recommended local test path:

1. Set `MYMEDLIFE_DATA_SOURCE=supabase`.
2. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
3. Set `MYMEDLIFE_AUTH_MODE=local_supabase`.
4. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
5. Set `MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=true`.
6. Open `/admin/coach-write` and confirm prerequisite checks.
7. Sign in at `/login` as `coach@mymedlife.test` with password `password`.
8. Open `/coach`.
9. Confirm the local coach decision panel is enabled.
10. Submit the local coach decision form.
11. Confirm the refreshed page shows the recorded decision result and local
    readiness readback.

Expected database behavior:

- `app.log_coach_decision(...)` updates phase readiness.
- A `phase_readiness_reviews` row is recorded.
- An internal `coach_decision_logged` event is recorded.
- An integration event is recorded for future automation pickup.
- A disabled automation outbox row is recorded.
- An audit log row is recorded.

This test still does not send n8n escalation packets, enable production auth,
upload files, publish proof, or send HubSpot, Luma, warehouse, Power BI, email,
SMS, or AI writes.

## Goal 115 Leader Proof Decision SQL/RLS Test

Goal 115 is the database/RLS packet that Goal 116 depends on. After running the
local Supabase reset, run the SQL test suite:

```bash
pnpm supabase:test
```

Expected database behavior:

- `app.record_leader_proof_decision(...)` is the only path for local chapter
  proof approval, request-changes, or reject decisions.
- Direct approval, points, KPI, and evidence-status bypasses are blocked.
- Chapter Leader can approve, request changes, and reject submitted proof.
- Super Admin can record an audited break-glass leader proof decision.
- General Member, Coach, Admin, and DS Admin cannot record routine leader proof
  decisions.
- Approving proof records assignment status, evidence status, approval, points,
  KPI, internal event, integration event, disabled outbox, and audit rows
  together.
- Requesting changes or rejecting proof records the decision without points or
  KPI movement.
- No leader proof decision approves or sends external automation.

This test still does not enable production auth, member nudges, proof uploads,
public proof publishing, or HubSpot, Luma, n8n, warehouse, Power BI, email, SMS,
or AI writes.

## Goal 116 Leader Proof Decision Browser Test

Goal 116 is the local browser/server-action layer over the Goal 115 function.
After running the local Supabase reset and the Goal 115 SQL/RLS test, use this
fake submitted Northview proof item:

```text
assignment: 50000000-0000-4000-8000-000000000004
evidence:   60000000-0000-4000-8000-000000000004
```

Recommended local test path:

1. Set `MYMEDLIFE_DATA_SOURCE=supabase`.
2. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
3. Set `MYMEDLIFE_AUTH_MODE=local_supabase`.
4. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
5. Set `MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE=true`.
6. Sign in at `/login` as `leader.a@mymedlife.test` with password `password`.
7. Open `/rush-month/review`.
8. Confirm the local leader proof decision panel is enabled for the fake
   submitted proof fixture.
9. Submit Approve, Request changes, or Reject with a plain-English note.
10. Confirm the refreshed page shows the matching local readback state.

Expected database behavior:

- `app.record_leader_proof_decision(...)` records the chapter proof decision.
- Approve updates assignment/evidence status and records approval, points, KPI,
  internal event, integration event, disabled outbox, and audit rows together.
- Request changes and Reject record the decision, event, integration event,
  disabled outbox, and audit rows without points or KPI movement.
- No member nudge, public proof publish, or live external send runs.

This test still does not enable production auth, production data, proof uploads,
public proof publishing, or HubSpot, Luma, n8n, warehouse, Power BI, email, SMS,
or AI writes.

`MYMEDLIFE_LOCAL_ACTOR_EMAIL` also works when the app is using mock fallback
data, so developers can preview all role views without Docker. Restart the local
development server after changing the env var.

## RLS Model In Plain English

- General members can see their own profile, approved chapter work, their own
  proof/testimonials, and their own points.
- Chapter leaders can manage work inside their own chapter, but cannot cross
  into another chapter.
- Coaches can read only chapters in their active portfolio assignment.
- E-Board and Action Committee leaders do not approve proof for broad sharing.
- MEDLIFE Admin/HQ staff can make proof sharing decisions.
- DS Admin and Super Admin can manage integration/outbox status.
- External sends remain disabled or mocked until Nick explicitly approves live
  integrations.
- HQ/Admin can manage global campaign templates; normal students and DS Admins
  cannot.
- Chapter leaders can assign campaign lanes inside their own chapter.
- Coaches can validate readiness and closeouts only for chapters in their
  active portfolio.
- Coach-private risk flags stay hidden from members and chapter leaders.
- Action-start assignment status changes must use
  `app.start_assignment_action` so the assignment update, event row,
  integration event row, and audit log are written together.
- Admin and DS Admin cannot start routine student truth assignments.
- Proof/testimonial metadata submissions must use
  `app.submit_assignment_proof_metadata` so the assignment update, evidence
  metadata row, event row, integration event row, disabled outbox row, and audit
  log are written together.
- Coach, Admin, DS Admin, and Super Admin cannot use the normal proof
  submission path.
- HQ proof/testimonial sharing decisions must use
  `app.record_hq_proof_sharing_decision` so the evidence update, approval row,
  event row, integration event row, disabled outbox row, and audit log are
  written together.
- General Members, Chapter Leaders, Coaches, and DS Admin cannot record HQ
  proof-sharing decisions.
- Chapter-leader assignment creation must use `app.create_chapter_assignment`
  so the assignment row, event row, integration event row, disabled outbox row,
  and audit log are written together.
- General Members, Coaches, Admin, and DS Admin cannot create routine chapter
  assignments.
- Coach decisions must use `app.log_coach_decision` so the phase readiness
  update, readiness review row, event row, integration event row, disabled
  outbox row, and audit log are written together.
- General Members, Chapter Leaders, and DS Admin cannot log coach decisions.
- Leader proof decisions must use `app.record_leader_proof_decision` so the
  assignment/evidence status, approval row, optional points/KPI rows, event row,
  integration event row, disabled outbox row, and audit log are written
  together.
- General Members, Coaches, Admin, and DS Admin cannot record routine leader
  proof decisions.
- Leader proof decisions do not publish proof, nudge members, or approve live
  external sends.

## Known Codex Environment Limitation

This Codex environment did not have Docker installed, so the SQL files and tests
were added but the Supabase local stack could not be started here. A developer
with Docker can run the commands above to execute the migration, seed data, and
pgTAP RLS tests. GitHub CI is also configured to run the Supabase reset/test
path on a Docker-capable Ubuntu runner.
