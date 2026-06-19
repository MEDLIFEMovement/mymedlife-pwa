# myMEDLIFE PWA

myMEDLIFE is the custom, mobile-first MEDLIFE chapter operating app for
`www.myMEDLIFE.org`.

This repo is a parallel build to the current Discourse prototype. Do not replace
or modify Discourse from this repo unless Nick explicitly approves that change.
Discourse remains a reference/prototype/community layer while this app explores
the production-style custom PWA path.

## Current Goal

The current priority is review readiness for PR #94 and PR #95. Use
`docs/review/pr-94-pr-95-review-checklist.md` for the reviewer order and
approval questions, then use `/admin/review-path`, `/admin/nick-review`,
`/admin/launch-gate`, and `/admin/database-security` as the Phase 1 review
packet routes.

The current goal is Goal 162: membership approval write readiness. This extends
`/chapter/members`, the write plan, browser-write readiness, and staff rehearsal
surfaces so reviewers can inspect the future `app.approve_chapter_membership`
function target, required SQL/RLS tests, locked database-function/RLS checks,
membership table targets, disabled welcome outbox, CRM-disabled posture, and
audit/readback expectations before any membership approval write is implemented
or enabled.

Goal 161 added membership approval result states. This extends `/chapter/members`
and the admin write-result coverage map so reviewers can inspect the future
membership approval success, disabled, welcome-disabled, CRM-disabled, duplicate,
auth, permission, missing-request, profile, role, audit-reason, and error states
before any membership approval write is enabled. It does not approve production
auth, join approval saves, membership rows, chapter role assignment, welcome
messages, CRM syncs, or external sends.

Goal 160 added the membership approval packet. This extends
`/chapter/members` so chapter leaders, Admin, and Super Admin can review the
future membership approval function, join-request payload, readiness checks,
structured event, disabled outbox, audit action, and locked controls before any
real join request approval, membership row, chapter role assignment, welcome
message, CRM sync, or external send is approved.

Goal 159 added the proof storage intake packet. This extends
`/proof-library/upload` so members, chapter leaders, HQ, and Super Admin can
review the exact future private bucket, storage-path preview, upload-intake
function, required metadata, consent/moderation queue, raw-reader boundary,
future structured event, disabled outbox, audit action, and locked storage
controls before any proof file upload is approved. It does not create Supabase
Storage buckets, signed upload URLs, storage objects, public proof URLs,
production uploads, external exports, AI summaries, or public publishing.

Goal 158 added the proof submission packet. This extends
`/rush-month/evidence` so members and chapter operators can see the exact proof
metadata payload, local function, result preview, readiness checks, structured
event, disabled outbox, and audit action for the recommended proof item before
opening the action detail write gate. It does not approve proof metadata saves,
file uploads, public proof publishing, member reminders, external sends,
production auth, real student pilots, or student invitations.

Goal 157 added the production auth preflight checklist. This extends
`/onboarding` so Admin, DS Admin, and Super Admin can review callback URLs,
role coverage, auth/profile mapping, join approval, chapter role assignment,
coach scope, staff role assignment, audit/outbox posture, and support rollback
before any real user is invited. It does not approve production auth,
production user creation, onboarding writes, browser writes, onboarding
automations, external sends, or vendor switching.

Goal 156 added the admin write-audit preflight checklist. This extends
`/admin/audit-log` so Admin, DS Admin, and Super Admin can review actor
identity, target readback, before/after summaries, reason notes, visibility
boundaries, and retention/export locks before any audit-producing production
write is approved. It does not approve audit row edits, audit deletion, audit
exports, retention changes, production writes, external sends, or secret
exposure.

Goal 155 added the integration live-send preflight checklist. This extends
`/admin/integration-outbox` so Admin, DS Admin, and Super Admin can review
source events, payload/idempotency, audit readback, destination policy, and
secrets boundaries before any queue mutation, retry, unlock, payload edit, or
external send is approved. It does not approve live n8n, HubSpot, Luma,
warehouse, Power BI, SMS, email, AI, or worker writes.

Goal 154 added the coach intervention checklist. This extends
`/coach` so coaches and HQ support can turn pending proof, stalled work, risk,
and KPI posture into a concrete hold/intervene plan before any coach note,
coach decision, escalation, or external send is approved. It does not approve
production auth, coach note saves, coach decision writes, member nudges,
escalation packets, real student pilots, or student invitations.

Goal 153 added the leader proof review rubric. This extends
`/rush-month/review` so chapter leaders and HQ support can inspect the
assignment-fit, story-context, points/KPI, and sharing-boundary checks before
any approve, request-changes, or reject decision is saved. It does not approve
production auth, proof decision writes, points/KPI writes, member nudges,
public proof sharing, external sends, real student pilots, or student
invitations.

Goal 152 added the evidence prep checklist. This extends
`/rush-month/evidence` so members and chapter operators can see the next proof
item, story prompt, prep checklist, review lane, future proof-intake link, and
disabled controls before any proof metadata save or upload is approved. It does
not approve production auth, browser writes, uploads, public proof sharing,
external sends, real student pilots, or student invitations. Goal 158 adds the
recommended proof submission packet so reviewers can inspect the future
metadata payload, readiness checks, result preview, structured event, disabled
outbox, and audit action from the evidence queue itself.

Goal 151 updated `/admin/nick-review` with the pilot-scope and launch-evidence
checkpoint.

Goal 150 added the launch evidence checklist to `/admin/launch-gate`.

Goal 149 added the device and PWA smoke matrix to `/admin/design-qa`.

Goal 148 added a concrete keyboard and screen-reader review plan to
`/admin/design-qa`.

Goal 147 connected the Goal 146 phone-sized route review plan to the admin route
smoke manifest.

Goal 146 added a concrete phone-sized route review plan to `/admin/design-qa`.

Goal 145 added `/admin/nick-review` as one focused final local MVP review route.

Goal 144 added the stakeholder review phase map. This adds a plain-English
phase map to `/admin/review-path` before the detailed route list, grouping the
walkthrough into member, leader, proof, coach, admin, and write-packet review
phases.

Goal 143 added admin walkthrough sequence review. This orders
the `/admin/review-path` admin walkthrough from control center to master data,
integration outbox, audit log, system health, database security, final review
path, release readiness, launch gate, design QA, operations, and write packets.
It does not approve user creation, role writes, chapter edits, campaign
template edits, outbox mutations, audit exports, system-health launch claims,
admin writes, external sends, or student invitations.

Goal 142 added coach walkthrough sequence review. This separates
coach portfolio health from coach readiness in `/admin/review-path`, so
reviewers can inspect assigned chapters, campaign health, overdue work, pending
evidence, KPI movement, risk alerts, advance/hold/intervene posture, support
notes, and disabled coach decisions on `/coach`. It does not approve coach
decision saves, support note saves, coach reassignments, KPI writes, escalation
packets, n8n workflows, external sends, or student invitations.

Goal 141 added leader walkthrough sequence review. This adds a
President / VP dashboard checkpoint to `/admin/review-path` before leader
follow-up, member-role coverage, the operating loop, event readiness, and proof
decisions. It helps reviewers see leader KPIs, assignment posture, completion
tracking, evidence review, and member management before approving any real
leader writes. It does not approve assignment creation, proof decisions,
membership writes, KPI writes, reminders, external sends, or student
invitations.

Goal 140 added member walkthrough sequence review. This orders
the `/admin/review-path` member walkthrough as local sign-in, profile scope,
auth/onboarding, chapter home, Rush Month overview, assigned actions, action
detail, evidence submission, leaderboard, member dashboard, events, and one
event detail before leader, coach, and admin surfaces. It does not approve
production auth, browser writes, uploads, external sends, real student pilots,
or student invitations.

Goal 139 added member Rush Month events review coverage. This
makes `/rush-month/events` an explicit member-flow review checkpoint for event
plans, expected student actions, feedback/NPS prompts, proof prompts,
proof-intake handoff, disabled Luma/outbox posture, and the
attend-reflect-share bridge. It does not approve attendance imports, NPS
reminders, proof uploads, public proof sharing, Luma writes, warehouse exports,
AI summaries, external sends, or student invitations.

Goal 138 added member assigned-actions review coverage. This makes
`/rush-month/actions` an explicit member-flow review checkpoint for a member's
assigned-action list, due dates, status, proof requirements, points, KPI signal,
and links into the next action detail. It does not approve assignment creation,
action-start saves, proof saves, reminders, points/KPI writes, browser writes,
external sends, or student invitations.

Goal 137 added member Rush Month overview review coverage. This makes
`/rush-month` an explicit member-flow review checkpoint for the active campaign
objective, role next action, visible action counts, proof pending posture,
coach-read status, event/proof sections, operating path, and links into
dashboard, actions, and events. It does not approve campaign phase changes,
assignment saves, proof saves, points/KPI writes, Luma writes, n8n workflows,
external sends, or student invitations.

Goal 136 added member action detail review coverage. This makes
`/rush-month/actions/member-push` an explicit member-flow review checkpoint for
one assigned action, owner, status, points, evidence requirements, proof
handoff, local action-start posture, disabled upload controls, and outbox/audit
posture. It does not approve action-start saves, proof metadata saves, file
uploads, points/KPI writes, reminders, external sends, or student invitations.

Goal 135 added member chapter home review coverage. This makes `/chapter` an
explicit member-flow review checkpoint for chapter context, current campaign,
visible progress, read-only points, and next links into Rush Month, member
roles, campaigns, committees, and proof library. It does not approve membership
writes, role approvals, points writes, campaign writes, proof uploads, external
sends, or student invitations.

Goal 134 added local sign-in review coverage. This makes
`/login` a first-class MVP review route for fake local seed-user sign-in,
local Supabase Auth session readiness, and the production-auth safety boundary.
It does not approve production auth, production users, profile writes,
membership writes, browser writes, external sends, or student invitations.

Goal 133 added the focused admin stakeholder review path. This adds
`/admin/review-path` as a direct read-only no-code walkthrough for Admin, DS
Admin, and Super Admin. The route gathers fake local actor emails, route-by-route
review steps, expected review moments, safety boundaries, `0 writes`, and `0
sends`. It does not approve production auth, browser writes, proof uploads,
public proof sharing, external sends, or student invitations.

Goal 132 added the focused admin release readiness route. This adds
`/admin/release-readiness` as a direct read-only release-readiness summary for
Admin, DS Admin, and Super Admin. The route shows what is ready for local
stakeholder review, what blocks live student launch, the role-model checkpoint,
next approvals, `local review yes`, `live launch no`, `0 writes`, and `0
sends`. It does not approve production auth, browser writes, proof uploads,
external sends, or student invitations.

Goal 131 added the focused admin launch gate route. This adds
`/admin/launch-gate` as a direct read-only production launch gate for Admin, DS
Admin, and Super Admin. The route gathers the eight launch gates, missing live
evidence, the Goal 150 launch evidence checklist, review routes, owner sign-off
needs, rollback posture, `launch no`, `0 writes`, and `0 sends` before any
student pilot decision. It does not approve live launch, production auth,
browser writes, proof uploads, vendor switching, external sends, or student
invitations.

Goal 130 added the focused admin database security route. This adds
`/admin/database-security` as a direct read-only Supabase Postgres/Auth/Storage
versus PlanetScale MySQL/Vitess review surface for Admin, DS Admin, and Super
Admin. The route keeps the approved MVP stack visible, names the PlanetScale
tradeoff as an architecture rewrite rather than a simple security fix, and
blocks live launch, vendor switching, production auth, browser writes, proof
uploads, service-key exposure, external sends, and PHI/ePHI handling until
DS/security approvals are complete.

Goal 129 added the focused admin operations route. This adds
`/admin/operations` as a direct read-only incident triage, auth/access
recovery, database/RLS recovery, write rollback, proof moderation, integration
recovery, mobile PWA support, and pilot communications review surface for
Admin, DS Admin, and Super Admin. The route does not approve live launch,
production auth, browser writes, proof uploads, outbox sends, monitoring
claims, backup claims, support-owner claims, or student invitations.

Goal 128 added the focused admin design QA route. This adds
`/admin/design-qa` as a direct read-only Figma, mobile viewport,
accessibility, role complexity, offline recovery, and pilot-safety review
surface for Admin, DS Admin, and Super Admin. The route does not approve live
launch, production auth, browser writes, uploads, public proof sharing,
external sends, staging claims, or final Figma/mobile QA.

Goal 127 added the focused admin system health route. This adds
`/admin/system-health` as a direct read-only launch-health review surface for
route coverage, data source posture, environment flags, audit readback, outbox
safety, auth, proof storage, external integrations, monitoring, backup, and
incident ownership. The route does not approve live launch, production auth,
production writes, uploads, external sends, monitoring claims, backup claims, or
secrets.

Goal 126 added the focused admin audit log route. This adds
`/admin/audit-log` as a direct read-only audit posture surface for Admin, DS
Admin, and Super Admin. Admin and Super Admin can inspect persisted audit
readback when local rows exist; DS Admin can confirm audit safety without
row-level chapter/member details. Goal 156 extends this same route with a
write-audit preflight checklist for actor identity, target readback,
before/after summaries, reason notes, visibility boundaries, and
retention/export locks. The route does not edit audit rows, delete audit rows,
export audit rows, change retention, approve production writes, send external
automation, or expose secrets.

Goal 125 added the focused admin integration outbox route. This adds
`/admin/integration-outbox` as a direct read-only DS/Admin review surface for
structured integration events, automation outbox rows, destination safety,
audit posture, and blocked live-send controls. The route does not mutate queue
state, approve live sends, retry sends, edit payloads, show secrets, export
data, run AI summaries, or send external automation.

Goal 124 added the focused admin master data route. This adds
`/admin/master-data` as a direct read-only inventory for fake users, named
roles, chapter scope, and campaign templates. Admin, DS Admin, and Super Admin
can review the inventory without enabling production users, role writes,
chapter edits, campaign-template writes, coach assignment changes, browser
writes, or external sends.

Goal 123 added the evidence submission readiness route. This deepens
`/rush-month/evidence` from a proof status list into a member-facing proof
submission queue with the next proof item, submission posture, future structured
records, and blocked upload/public-sharing/external-send posture. Goal 152 adds
the story prompt, prep checklist, review lane, and disabled controls to that
queue. The route is still mock-safe and does not save proof metadata, upload
files, publish proof, write points/KPIs, send reminders, export data, or run AI
summaries.

Goal 122 added the auth onboarding readiness route. This added `/onboarding` as
a read-only reviewer workspace for future sign-in, profile creation, chapter
join requests, membership approval, chapter role assignment, coach assignment,
and staff role assignment. The page shows owner roles and future structured
events while keeping live auth, production users, onboarding writes, browser
writes, and external sends disabled. Goal 157 adds a staff-only production auth
preflight on this same route for callback URLs, role coverage, auth/profile
mapping, join approval, role assignment, coach scope, staff scope, audit/outbox
posture, and rollback sign-off.

Goal 121 added the read-only profile route. This added `/profile` as a local
account, role, chapter/staff scope, and next-action workspace for every fake
review actor. Members now have Profile as the fourth mobile quick tab. The page
is read-only and does not save profiles, submit join requests, approve roles,
change memberships, change coach assignments, or send external automation.

Goal 120 added the Rush Month event detail route. This added
`/rush-month/events/[eventId]` as a direct mobile-friendly event workspace for
one Rush Month event. Members, action committee roles, leaders, coaches, HQ
Admin, and Super Admin can review the owner, student action, NPS prompt, proof
prompt, readiness checks, future structured events, and disabled outbox posture.
DS Admin remains restricted to integration safety. The page is read-only and
does not create/update Luma events, import attendance, send NPS reminders,
upload proof, write event recaps, update KPIs, or send external automation.

Goal 119 added the member leaderboard route. This added
`/rush-month/leaderboard` as a direct mobile-friendly points, rank,
recognition, and chapter-impact destination for members, leaders, coaches, HQ
Admin, and Super Admin. DS Admin remains restricted to integration safety. The
page is read-only and does not write points, mutate leaderboards, update KPIs,
nudge members, or send external automation.

Goal 118 added the admin master data inventory. This deepens the existing
`/admin` control center so Admin, DS Admin, and Super Admin reviewers can
inspect fake users, named role coverage, chapter scope, and campaign template
shells from one read-only inventory. Admin mutation controls, production user
creation, role changes, chapter edits, campaign-template edits, browser writes,
and external sends remain disabled.

Goal 117 added the PWA offline recovery shell. This adds `/offline`, a
conservative service worker, and an explicit service-worker registration gate so
the app has a production-style offline fallback without caching private chapter
data. The service worker uses network-first navigation, caches only the static
shell/icon/manifest assets, does not enable push notifications, and does not
submit assignments, proof, points, nudges, audit, outbox, or external automation
while offline.

Goal 116 added the local leader proof decision server action. This
adds a localhost-only `/rush-month/review` server action for Chapter Leaders and
Super Admin to approve, request changes, or reject submitted proof through
`app.record_leader_proof_decision(...)`. The browser path stays locked by
default and only opens when local Supabase reads, local Supabase Auth,
`MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`, and
`MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE=true` are all set. General
Members, Coaches, Admin, and DS Admin remain blocked from routine chapter proof
truth. Points/KPI movement happens only for approved proof, member nudges and
public proof publishing remain disabled, and HubSpot, Luma, n8n, warehouse,
Power BI, SMS, email, and AI writes remain disabled.

Goal 115 added the leader proof decision local write packet. This added the
local Supabase database function and pgTAP RLS coverage for approving,
requesting changes, or rejecting chapter proof while browser proof-decision
controls remained disabled.

Goal 114 added leader proof decision result states. This remains mock-safe by
default and adds one `/rush-month/review` result-state panel. Chapter leaders,
Admin, and Super Admin can inspect the disabled browser result, future
approve/request-changes/reject outcomes, future event/audit names, and the
points/KPI/public-sharing boundary while proof decision saves, points ledger
writes, member nudges, public proof sharing, warehouse, Power BI, HubSpot, Luma,
n8n, SMS, email, and AI writes remain disabled.

Goal 113 added a leader proof decision workspace. This remains mock-safe by
default and adds one `/rush-month/review` panel. Chapter leaders, Admin, and
Super Admin can inspect disabled approve, request-changes, and reject controls
for chapter proof review while proof decision saves, points ledger writes,
member nudges, public proof sharing, warehouse, Power BI, HubSpot, Luma, n8n,
SMS, email, and AI writes remain disabled.

Goal 112 added a coach support notes workspace. This remains mock-safe by
default and adds one `/coach` notes panel. Coaches, Admin, and Super Admin can
inspect decision rationale, pending evidence, risk response, owner check-in, and
escalation-note posture while coach note saves, escalation packets, coach
reassignment, warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes
remain disabled.

Goal 111 added a production operations runbook. This remains mock-safe by
default and adds one `/admin` operations panel. Admin, DS Admin, and Super Admin
can inspect incident triage, auth/access recovery, database/RLS recovery, write
rollback, proof moderation, integration/outbox recovery, mobile PWA support, and
pilot communication posture while launch remains blocked. Production auth,
broad browser writes, campaign-template writes, role writes, membership writes,
chapter-level proof decisions, uploads, public sharing, warehouse, Power BI,
HubSpot, Luma, n8n, SMS, email, and AI writes remain disabled.

Goal 110 added an admin system health review. This remains mock-safe by default
and adds one `/admin` system health panel. Admin, DS Admin, and Super Admin can
inspect local route, data-source, environment, audit, outbox, auth, proof
storage, integration, monitoring, backup, and incident ownership posture while
launch remains blocked. Production auth, broad browser writes,
campaign-template writes, role writes, membership writes, chapter-level proof
decisions, uploads, public sharing, warehouse, Power BI, HubSpot, Luma, n8n,
SMS, email, and AI writes remain disabled.

Goal 109 added an admin audit log review. This remains mock-safe by
default and adds one `/admin` read-only audit panel. Admin and Super Admin can
inspect visible audit rows when local Supabase readback is available; DS Admin
can inspect summary-only audit posture without row-level chapter/member truth.
Mock fallback remains honest about `0` persisted audit rows. Production auth,
broad browser writes, campaign-template writes, role writes, membership writes,
chapter-level proof decisions, uploads, public sharing, warehouse, Power BI,
HubSpot, Luma, n8n, SMS, email, and AI writes remain disabled.

Goal 108 added a database security decision packet. This remains
mock-safe by default and adds one `/admin` DS/security review packet that
recommends keeping Supabase Postgres/Auth/Storage for the MVP, documents the
PlanetScale MySQL/Vitess tradeoffs, and keeps live launch blocked until
DS/security signs off on RLS, service-key handling, proof storage, compliance,
and production setup. Production auth, broad browser writes,
campaign-template writes, role writes, membership writes, chapter-level proof
decisions, uploads, public sharing, warehouse, Power BI, HubSpot, Luma, n8n,
SMS, email, and AI writes remain disabled.

Goal 107 added a production launch gate. This remains mock-safe by default and
adds one `/admin` gate that shows the local evidence and missing live evidence
for auth, RLS, guarded write promotion, proof storage, campaign template
writes, integration outbox, observability, and pilot operations.
Production auth, broad browser writes, campaign-template writes, role writes,
membership writes, chapter-level proof decisions, uploads, public sharing,
warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain
disabled.

Goal 106 added a Start a Chapter campaign plan. This remains mock-safe by
default and deepens the seventh non-Rush starter campaign at
`/campaigns/start-a-chapter` with phases, owner roles, proof prompts, KPI
signals, structured events, disabled outbox posture, and closeout checks.
Production auth, broad browser writes, campaign-template writes, role writes,
membership writes, chapter-level proof decisions, uploads, public sharing,
warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain
disabled.

Goal 105 added a Grow the Movement campaign plan. This remains mock-safe by
default and deepens the sixth non-Rush starter campaign at
`/campaigns/grow-the-movement` with phases, owner roles, proof prompts, KPI
signals, structured events, disabled outbox posture, and closeout checks.
Production auth, broad browser writes, campaign-template writes, role writes,
membership writes, chapter-level proof decisions, uploads, public sharing,
warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain
disabled.

Goal 104 added a Leadership Transition campaign plan. This remains mock-safe by
default and deepens the fifth non-Rush starter campaign at
`/campaigns/leadership-transition` with phases, owner roles, proof prompts, KPI
signals, structured events, disabled outbox posture, and closeout checks.
Production auth, broad browser writes, campaign-template writes, role writes,
membership writes, chapter-level proof decisions, uploads, public sharing,
warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain
disabled.

Goal 103 added a Moving Mountains campaign plan. This remains mock-safe by
default and deepens the fourth non-Rush starter campaign at
`/campaigns/moving-mountains` with phases, owner roles, proof prompts, KPI
signals, structured events, disabled outbox posture, and closeout checks.
Production auth, broad browser writes, campaign-template writes, role writes,
membership writes, chapter-level proof decisions, uploads, public sharing,
warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain
disabled.

Goal 102 added an SLT Promotion campaign plan. This remains mock-safe by
default and deepens the third non-Rush starter campaign at
`/campaigns/slt-promotion` with phases, owner roles, proof prompts, KPI
signals, structured events, disabled outbox posture, and closeout checks.
Production auth, broad browser writes, campaign-template writes, role writes,
membership writes, chapter-level proof decisions, uploads, public sharing,
warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain
disabled.

Goal 101 added a Chapter Engagement campaign plan. This remains mock-safe by
default and deepens the second non-Rush starter campaign at
`/campaigns/chapter-engagement` with phases, owner roles, proof prompts, KPI
signals, structured events, disabled outbox posture, and closeout checks.
Production auth, broad browser writes, campaign-template writes, role writes,
membership writes, chapter-level proof decisions, uploads, public sharing,
warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain
disabled.

Goal 100 added a Planning / Goal Setting campaign plan. This remains mock-safe
by default and deepens the first non-Rush starter campaign at
`/campaigns/planning-goal-setting` with phases, owner roles, proof prompts, KPI
signals, structured events, disabled outbox posture, and closeout checks.
Production auth, broad browser writes, campaign-template writes, role writes,
membership writes, chapter-level proof decisions, uploads, public sharing,
warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain
disabled.

Goal 99 added a campaign starter shell checkpoint. This remains mock-safe by
default and makes `/campaigns` show one clear readiness checkpoint for the exact
non-Rush starter campaign shells required by the MVP: Planning / Goal Setting,
Chapter Engagement, SLT Promotion, Moving Mountains, Leadership Transition,
Grow the Movement, and Start a Chapter. Production auth, broad browser writes,
campaign-template writes, role writes, membership writes, chapter-level proof
decisions, uploads, public sharing, warehouse, Power BI, HubSpot, Luma, n8n,
SMS, email, and AI writes remain disabled.

Goal 98 added a role model review checkpoint. This remains mock-safe by default
and adds a Goal 90-97 checkpoint to `/admin` so Nick can review the accumulated
President / VP, E-Board, Action Committee Chair, guarded write responsibility,
and admin-summary work as one coherent role model. Production auth, broad
browser writes, role writes, membership writes, chapter-level proof decisions,
uploads, public sharing, warehouse, Power BI, HubSpot, Luma, n8n, SMS, email,
and AI writes remain disabled.

Goal 97 added an admin responsibility summary. This remains mock-safe by default
and makes `/admin` summarize which role owns each guarded Rush Month local write
step before reviewers open the deeper write sequence or staff dry-run pages.
Production auth, broad browser writes, role writes, membership writes,
chapter-level proof decisions, uploads, public sharing, warehouse, Power BI,
HubSpot, Luma, n8n, SMS, email, and AI writes remain disabled.

Goal 96 added write sequence role responsibility. This remains mock-safe by
default and makes `/admin/write-sequence` plus `/admin/staff-dry-run` show which
role owns each guarded Rush Month write step before any browser write or
staging discussion happens. Production auth, broad browser writes, role writes,
membership writes, chapter-level proof decisions, uploads, public sharing,
warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain
disabled.

Goal 95 added leader assignment role responsibility. This remains mock-safe by
default and makes `/admin/assignment-write` show which chapter role owns
assignment approval guardrails, owner handoff, and committee coordination before
any local assignment-create write is opened. Production auth, broad browser
writes, role writes, membership writes, chapter-level proof decisions, uploads,
public sharing, warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI
writes remain disabled.

Goal 94 added member role focus. This remains mock-safe by default and makes
`/chapter/members` distinguish President / VP role-coverage and
approval-readiness work from E-Board member follow-up and committee execution
work. Both roles still map to chapter-leader visibility. Production auth, broad
browser writes, role writes, membership writes, chapter-level proof decisions,
uploads, public sharing, warehouse, Power BI, HubSpot, Luma, n8n, SMS, email,
and AI writes remain disabled.

Goal 93 added leader review role focus. This remains mock-safe by default and
makes `/rush-month/review` distinguish President / VP proof accountability from
E-Board owner/event proof follow-up while keeping HQ sharing decisions separate
from chapter leadership authority. Both roles still map to chapter-leader
visibility. Production auth, broad browser writes, role writes, membership
writes, chapter-level proof decisions, uploads, public sharing, warehouse,
Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain disabled.

Goal 92 added leader actions role focus. This remains mock-safe by default and
makes `/rush-month/actions` distinguish President / VP assignment-approval
guardrails from E-Board owner/event execution follow-up. Both roles still map
to chapter-leader visibility. Production auth, broad browser writes, role
writes, membership writes, proof decisions, uploads, public sharing, warehouse,
Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain disabled.

Goal 91 added leader dashboard role focus. This remains mock-safe by default
and makes `/rush-month/dashboard` distinguish President / VP
approval/accountability work from E-Board owner/event execution work. Both
roles still map to chapter-leader visibility. Production auth, browser writes,
role writes, membership writes, assignment saves, proof decisions, uploads,
public sharing, warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI
writes remain disabled.

Goal 90 added leader role personas. This remains mock-safe by default and
separates the local President / VP and E-Board Member preview accounts so staff
can review the final MVP role model without pretending one fake user owns both
leader responsibilities. Both roles still map to chapter-leader visibility.
Production auth, browser writes, role writes, membership writes, uploads,
public sharing, warehouse, Power BI, HubSpot, Luma, n8n, SMS, email, and AI
writes remain disabled.

Goal 89 added leader evidence follow-up. This remains mock-safe by default and
adds a read-only `/rush-month/review` board that separates chapter follow-up
from HQ proof-sharing decisions. Leaders can see which assignments need proof,
better testimonial context, or HQ review; coaches and admins can inspect the
posture; members and DS Admin remain out of this leader follow-up board.
Nudges, proof saves, uploads, public sharing, warehouse, Power BI, HubSpot,
Luma, n8n, SMS, email, and AI writes remain disabled.

Goal 88 added member proof status. This remains mock-safe by
default and makes `/rush-month/evidence` explain proof/testimonial status in
plain English. Members can see whether proof is needed, waiting for HQ review,
needs changes, or approved for internal learning. Leaders, coaches, admins, and
super admins can inspect proof posture. DS Admin remains out of student proof
truth. Proof saves, uploads, public sharing, warehouse, Power BI, HubSpot, Luma,
n8n, SMS, email, and AI writes remain disabled.

Goal 87 added the action proof handoff. This remains mock-safe by
default and makes `/rush-month/actions/[assignmentId]` explain the next
proof/testimonial step in plain English before a student reaches the deeper
write-gate panels. Members and action committee roles can see what story to
prepare, leaders/coaches/admins can inspect proof posture, and DS Admin remains
out of student proof truth. Proof saves, uploads, public sharing, warehouse,
Power BI, HubSpot, Luma, n8n, SMS, email, and AI writes remain disabled.

Goal 86 added the event proof bridge. This remains mock-safe by
default and connects `/rush-month/events` to the member-facing proof/testimonial
intake loop. Members, action committee roles, leaders, coaches, admins, and
super admins can see how event attendance, NPS feedback, proof/testimonials,
future structured records, and disabled outbox destinations fit together. Luma,
reminders, proof uploads, public sharing, warehouse, Power BI, HubSpot, n8n,
SMS, email, and AI writes remain disabled.

Goal 85 added the action committee workspace. This remains
mock-safe by default and makes `/action-committees` more role-aware for general
members, action committee members, action committee chairs, leaders, coaches,
admins, DS admins, and super admins. The page now answers "What should I do
next?", highlights priority event focus, shows future structured events to
watch, and keeps Luma, reminders, proof sharing, warehouse, Power BI, HubSpot,
n8n, SMS, email, and AI writes disabled.

Goal 84 added action committee role personas. This remains
mock-safe by default and adds separate local review personas for Action
Committee Member and Action Committee Chair, then proves the admin view can
show each named MVP role separately. It updates mock fallback data, local
Supabase seed users, the local sign-in suggestions, admin role coverage, and
permission tests without enabling production auth, browser writes, role writes,
uploads, public proof sharing, or external automation.

Goal 83 added the staff dry-run rehearsal, Goal 116 extends it with leader proof
decision server-action coverage, and Goal 162 extends it to seven guarded write
packets. This remains
mock-safe by default and upgrades `/admin/staff-dry-run` so HQ reviewers can
rehearse the local write packets in one place: action-start, proof metadata,
leader proof decision, HQ proof decision, leader assignment, coach decision, and
membership approval readiness.
The page mirrors packet status from `/admin/write-sequence` but does not run
the drill, enable production auth, trigger browser writes, or send external
automation. Production data, broad browser writes, admin mutation controls,
real uploads, public proof sharing, warehouse exports, AI summaries, and
external integrations remain disabled.

Goal 82 upgraded `/admin/write-sequence`, Goal 116 extends it with leader proof
decision server-action status, and Goal 162 adds membership approval readiness so
HQ reviewers can see packet status for seven guarded writes without running the
drill, enabling production auth, or sending external automation.

Goal 81 added `/admin/coach-write` so HQ reviewers can prepare the fifth local
Rush Month write: one fake coach recording advance / hold / intervene without
n8n escalation packets or external automation.

Goal 80 added `/admin/assignment-write` so HQ reviewers can prepare the fourth
local Rush Month write: one fake chapter leader creating one assignment without
reminders or external automation.

Goal 79 added `/admin/hq-proof-write` so HQ reviewers can prepare the third
local Rush Month write: deciding whether submitted proof/testimonial metadata
can be shared later, needs more context, or should stay internal.

Goal 78 added `/admin/proof-write` so HQ reviewers can prepare the second
local Rush Month write: metadata-only proof/testimonial submission after the
first action-start readback is proven.

Goal 77 added `/admin/write-sequence` so HQ reviewers can see the safe Rush
Month write promotion order after the first-write packet: action-start, proof
metadata, HQ proof decision, leader assignment creation, and coach decision
logging.

Goal 76 extended `/admin/first-write` so HQ reviewers have one operator-ready
packet for local env settings, fake sign-in, the action-start route sequence,
proof expectations, stop conditions, and the staging-review decision.

Goal 75 extended `/admin/first-write` so HQ reviewers can see the expected
post-drill readback evidence for assignment status, internal event, integration
event, audit log, and zero automation outbox sends.

Goal 74 added `/admin/first-write` so HQ reviewers can see the exact local
Supabase/auth/flag checks required before the first action-start browser write
is tested on localhost.

Goal 73 added `/admin/pilot-scope` so HQ reviewers can choose the smallest safe
first Rush Month pilot, compare staff-only / one-chapter / later expansion
options, and see which approvals still block real student invitations.

Goal 72 added `/admin/staff-dry-run` so HQ reviewers can rehearse the Rush
Month MVP with fake local actor emails, pass criteria, structured events to
notice, and zero-write safety assertions before staging or student pilot
approval.

Goal 71 added an admin-visible pilot gate so reviewers can distinguish local
stakeholder review, staff dry run, staging review, first student pilot, and later
pilot expansion before any production launch is approved.

Goal 70 added an admin-visible Figma/mobile QA layer so reviewers can evaluate
next-action clarity, phone usability, role complexity, accessibility, mission
tone, pilot safety copy, and final visual launch blockers before any production
launch is approved.

Goal 69 added `/rush-month/events` so reviewers can see event plans, expected
student action, NPS prompts, proof prompts, disabled Luma posture, future
structured events, and disabled outbox rows before any Luma sync, attendance
import, reminder, warehouse export, or automation is approved.

Goal 5 turned the approved Goal 4 database plan into a local-only Supabase
foundation:

- local Supabase project structure
- first migration for core tables, role helpers, RLS policies, and safety
  triggers
- fake seed data for Rush Month, chapters, roles, proof/testimonials, coach
  portfolio access, and disabled/mock integration rows
- pgTAP RLS/security tests
- documentation for local setup and reset/test commands

Goal 6 reviewed that foundation against MEDLIFE Sales SOP knowledge bases and
defines the next safe local schema refinement plan before live auth or real
integrations.

Goal 7 implements that plan locally by adding campaign templates, phase
templates, campaign officer lanes, readiness reviews, risk flags, closeouts,
expanded proof/evidence types, fake seed data, and RLS/security tests.

Goal 8 added the first safe read-only bridge from the app to local Supabase data
while keeping mock data as the default fallback.

Goal 9 adds a local-only actor context layer so developers can test fake member,
leader, coach, admin, DS admin, and super admin read context without enabling
production auth or app writes.

Goal 10 turns that local actor context into role-aware navigation, restricted
state messaging, read filters, and permission tests for the Rush Month shell.

Goal 11 adds local-only contracts for starting an action, submitting proof,
previewing HQ proof-sharing decisions, recording audit intent, and shaping
disabled outbox rows. It updates the action detail, proof, and review screens
without adding real persistence, uploads, auth sessions, or integrations.

Goal 12 adds an explicit disabled write-readiness layer. It documents which
tables future action/proof/HQ decisions would touch, shows those future write
targets in the UI, and keeps every app write blocked until Nick approves a
later security-reviewed implementation goal.

Goal 13 turns that airlock into a reviewable local write implementation plan.
It defines the first local write paths, the role boundaries, the tables
they would touch, and the RLS tests required before any write is enabled. It
does not turn on writes.

Goal 14 implements the first local Supabase write path for starting an
assignment. It adds an auditable database function and RLS/security tests for
`action_started`, but it does not wire browser save controls or production auth.

Goal 15 implements the first local Supabase proof/testimonial metadata write
path. It adds an auditable database function and RLS/security tests for
`evidence_submitted`, but it does not upload files, publish proof, wire browser
save controls, or send external automation.

Goal 16 implements the first local Supabase HQ proof-sharing decision write
path. It adds an auditable database function and RLS/security tests for
`hq_sharing_decision_logged`, but it does not publish proof, wire browser save
controls, or send external automation.

Goal 17 prepares proof/video storage architecture and disabled upload
readiness. It documents future buckets, consent metadata, file constraints, and
access boundaries, but it does not create buckets, upload files, publish proof,
or send external automation.

Goal 18 implements the first local Supabase chapter-leader assignment creation
path. It adds an auditable database function and RLS/security tests for
`action_assigned`, but it does not wire browser save controls, production auth,
or external automation.

Goal 19 defines the future auth/onboarding path for sign-in, profile creation,
chapter join requests, membership approval, role assignment, coach assignment,
and staff role assignment. It does not enable live auth, browser sessions,
production users, or onboarding writes.

Goal 20 defines the future route-by-route migration from mock data to local
Supabase and then controlled pilot readiness. It does not enable production
Supabase, browser writes, or external writes.

Goal 21 expands the mock-safe app from a Rush Month-only shell into the first
reusable campaign operating system surface. It adds campaign catalog pages,
campaign detail pages, action committee event planning, proof-library posture,
role-aware visibility, and tests while keeping the app read-only/mock-safe.

Goal 22 adds a role-aware Rush Month dashboard, a friendly mock leaderboard,
dashboard service tests, and the exact starter campaign shells required by the
final MVP goal.

Goal 23 adds a visible, testable browser-write activation gate for the first
candidate write route: `action_started` on `/rush-month/actions/[assignmentId]`.
It references the existing local Supabase function and RLS tests but still keeps
the browser control disabled until live auth and explicit write approval.

Goal 24 adds the same visible, testable browser-write activation gate for
chapter-leader assignment creation: `action_assigned` on `/rush-month/actions`.
It aligns the TypeScript write plan with the existing local Supabase assignment
creation function and still keeps the browser control disabled until live auth
and explicit write approval.

Goal 25 adds the same visible, testable browser-write activation gate for
proof/testimonial submission: `evidence_submitted` on
`/rush-month/actions/[assignmentId]`. It references the existing local Supabase
proof metadata function and keeps proof saves, uploads, public sharing, browser
writes, and external automation disabled.

Goal 26 adds the same visible, testable browser-write activation gate for HQ
proof-sharing decisions: `hq_sharing_decision` on `/rush-month/review`. It
references the existing local Supabase HQ decision function and keeps decision
saves, public proof sharing, browser writes, and external automation disabled.

Goal 27 adds the same visible, testable browser-write activation gate for coach
advance / hold / intervene decisions: `coach_decision_logged` on `/coach`. It
adds the local Supabase `app.log_coach_decision(...)` function and keeps coach
decision saves, browser writes, n8n escalation packets, and external automation
disabled.

Goal 28 adds a consolidated `/admin` write activation readiness panel. It
collects the first six browser-write gates into one reviewable staff/debug
surface and keeps every enabled control at zero until live auth and browser
write approval are explicitly granted.

Goal 29 adds a plain-English `/admin` approval plan for the first write
activation order. It recommends `action_started` as the first candidate and
lists the approvals required before any browser save control can be enabled.

Goal 30 defines the future action-start browser/server contract on
`/rush-month/actions/[assignmentId]`. It documents the future
`startAssignmentAction -> app.start_assignment_action` path, requires server-side
auth identity, and still returns a disabled attempt instead of saving.

Goal 31 defines the plain-English result states for that future action-start
save. The action detail route now shows the current disabled result, the future
result for the selected mock action, and the possible success/error states
without creating a server action or enabling browser writes.

Goal 32 defines the plain-English result states for the future proof/testimonial
save. The action detail route now shows the current disabled proof result, the
future result for the selected mock proof input, and the possible proof
success/error states without enabling proof saves, uploads, public sharing, or
external automation.

Goal 33 defines the plain-English result states for future HQ proof-sharing
decisions. The review route now shows the current disabled HQ decision result,
the future result for the selected mock decision, and the possible approval /
change-request / do-not-share states without enabling decision saves, public
proof publishing, or external automation.

Goal 34 defines the plain-English result states for future coach decisions. The
coach route now shows the current disabled coach decision result, the future
result for the selected mock advance / hold / intervene decision, and the
possible blocked states without enabling decision saves or n8n escalation
packets.

Goal 35 adds an admin-facing result-state coverage review. It shows that four
first-write candidates have result states and that leader assignment creation
still needs result states before write activation can be considered.

Goal 36 defines the plain-English result states for future leader assignment
creation. The actions route now shows the current disabled assignment-create
result, the future result for the selected mock assignment, and the possible
success/validation/permission/reminder-disabled states. At that point, the admin
coverage panel showed the original five first-write candidates covered while
writes remained disabled.

Goal 37 adds a browser-local Rush Month operating loop on `/rush-month/loop`.
It lets a reviewer click through leader assignment, member action start, proof
submission, local completion review, points/KPI movement, HQ sharing posture,
coach decision, structured events, disabled outbox rows, and audit logs without
writing to Supabase or sending external automation.

Goal 38 adds a read-only admin control center to `/admin`. It names the MVP
admin surfaces for users, roles, chapters, campaign templates, integration
events, automation outbox, audit logs, and system health placeholders while
keeping admin mutation controls disabled.

Goal 39 adds reusable role-aware next-action guidance. `/`, `/chapter`, and
`/rush-month` now show a plain-English priority for the selected local actor:
member, chapter leader, coach, admin, DS admin, or super admin. The guidance is
read-only and does not enable auth, browser writes, uploads, proof publishing,
or external integrations.

Goal 40 adds a read-only leader follow-up board to `/rush-month/actions`.
Leaders, coaches, admins, and super admins can see prioritized assignment
follow-up rows, while members stay focused on their own actions and DS admins
remain restricted to integration posture. Reminder sends and external
automation remain disabled.

Goal 41 adds a mock-safe coach portfolio readiness panel to `/coach`. Coaches,
admins, and super admins can compare fake portfolio chapters, handoff posture,
risk, proof pending, and advance / hold / intervene state. Coach assignment
changes remain read-only and disabled.

Goal 42 adds structured proof-sharing review states to `/proof-library`.
Leaders, coaches, admins, and super admins can see whether proof/testimonials
need consent/context, HQ review, internal learning use, or future public review.
Public publishing and external exports remain disabled.

Goal 43 adds clearer member recognition to `/rush-month/dashboard`. Members can
see rank, points, recognition, friendly leaderboard context, and understandable
chapter impact while DS Admin remains restricted from student points truth.

Goal 44 adds a read-only campaign closeout/readiness panel to `/rush-month`.
Leaders, coaches, admins, and super admins can see whether assignment
completion, proof posture, event feedback, and coach decision state support
advance, hold, or intervention. Closeout writes and exports remain disabled.

Goal 45 adds an admin-facing MVP coverage checklist to `/admin`. It summarizes
what the Rush Month MVP can demonstrate locally, what is read-only/mock-only,
and what remains blocked until live auth, browser writes, uploads, public proof
sharing, or integrations are approved.

Goal 46 adds a route-level smoke-test manifest to `/admin`. Admin, DS admin,
and super admin reviewers can see which core MVP routes to open, which local
roles to test, what should appear, and which safety boundary must remain true.

Goal 47 adds a plain-English release-readiness summary to `/admin`. It marks
the local Rush Month MVP as ready for stakeholder review but not ready for live
student launch until auth, writes, uploads, production setup, and integrations
are approved.

Goal 48 adds role-aware mobile quick navigation, active route styling, a
keyboard skip link, and reviewer-focused accessibility polish. It keeps the app
read-only/mock-safe and does not enable live auth, browser writes, uploads,
public proof sharing, or external integrations.

Goal 49 moves the existing local actor notice and local role switcher into the
shared app shell so every actor-aware route gets consistent reviewer context
without duplicating the same panels in route files.

Goal 50 adds the first install-readiness layer for the PWA: a manifest route,
app metadata, a local icon, and a test. It does not add offline caching, a
service worker, push notifications, auth, writes, uploads, public proof sharing,
or external integrations.

Goal 51 adds plain-English browser/page titles and descriptions for the main
routes through a small static metadata registry. It does not change permissions,
data loading, writes, auth, uploads, public proof sharing, or integrations.

Goal 52 adds a small route registry and tests to prove role-aware primary
navigation, mobile quick navigation, and the admin route smoke manifest point at
known app routes.

Goal 53 adds a plain-English admin route coverage summary showing known routes,
primary/mobile navigation coverage, smoke routes, and zero expected writes or
external sends.

Goal 54 adds a no-code stakeholder review path to `/admin` so reviewers know
which local actor email and route to use for member, leader, proof, coach, and
admin safety review.

Goal 55 adds a plain-English admin glossary for non-coder reviewers. It defines
local actor, mock data, browser write, external send, outbox, proof, RLS, and
stakeholder review.

Goal 56 adds an admin environment safety summary that explains safe local flags
without showing secrets, keys, tokens, passwords, or private connection strings.

Goal 57 adds a plain-English local MVP review guide for non-coder reviewers,
including pass/fail signals and the next approval boundary.

Goal 58 adds a localhost-only Supabase Auth sign-in route for fake local seed
users. It begins the real session foundation needed for the MVP, but does not
connect production Supabase, create real users, enable browser app writes, or
enable external writes.

Goal 59 maps signed-in local Supabase Auth users into the role-aware actor
context used across the app. Routes now prefer the local auth session over the
debug actor email when a matching fake local profile is signed in. Browser
writes, production auth, production users, uploads, public proof sharing, and
external sends remain disabled.

Goal 60 adds the first local browser-to-Supabase write path for
`action_started` on `/rush-month/actions/[assignmentId]`. It requires localhost
Supabase Auth, a signed-in fake seed user, `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`,
and `MYMEDLIFE_ENABLE_ACTION_START_WRITE=true`. All other browser writes,
production data, uploads, public proof sharing, and external sends remain
disabled.

Goal 61 adds a stable local seed assignment for that first write path and shows
plain-English readback after a start result. Local reviewers can use
`50000000-0000-4000-8000-000000000003` to confirm the page refreshes from
`not_started` to `in_progress` after the localhost-only action-start write.

Goal 62 adds the second local browser-to-Supabase write path for
`evidence_submitted` proof/testimonial metadata on
`/rush-month/actions/[assignmentId]`. It requires the same localhost-only auth
and local write posture as Goal 60, plus
`MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=true`, an assignment already in
`in_progress` or `changes_requested`, and proof uploads remaining disabled. It
records metadata only through the existing audited database function and does
not upload files, publish proof, or send automation.

Goal 63 adds the third local browser-to-Supabase write path for
`hq_sharing_decision` on `/rush-month/review`. It lets fake local Admin or
Super Admin users record HQ proof-sharing decisions through the existing
audited database function, while still refusing public proof publishing and all
external automation.

Goal 64 adds the fourth local browser-to-Supabase write path for
`action_assigned` on `/rush-month/actions`. It lets fake local chapter leaders
or Super Admin users create a local assignment through the existing audited
database function, while still keeping reminders and all external automation
disabled.

Goal 65 adds the fifth local browser-to-Supabase write path for
`coach_decision_logged` on `/coach`. It lets fake local Coach, Admin, or Super
Admin users record advance / hold / intervene decisions through the existing
audited database function, while still keeping n8n escalation packets and all
external automation disabled.

Goal 66 adds an admin-facing MVP progress map. It groups the remaining product
into understandable subprojects, shows directional local-review and live-MVP
percentages, names risks and route evidence, and keeps the app honest about
auth, uploads, production deploy, admin operations, and external integrations
still needing approval or future build work.

Goal 67 adds a read-only chapter membership workspace at `/chapter/members`.
It shows roster follow-up, join requests, role coverage, disabled future
membership controls, audit previews, and outbox previews for leaders, coaches,
admins, and super admins while keeping members and DS Admin out of membership
management truth.
Goal 160 extends the same route with a membership approval packet for the first
visible join request, including the future function, payload, readiness checks,
structured event, disabled outbox, audit action, and locked approval controls.
Goal 162 extends the same route with a membership approval write-readiness packet
that names the future SQL/RLS tests, function/RLS blockers, write-plan entry,
browser-write gate, future tables, disabled welcome/CRM posture, and audit
readback expectations before `app.approve_chapter_membership` is implemented.

Goal 68 adds a mock-safe proof upload intake readiness route at
`/proof-library/upload`. Students, leaders, coaches, admins, and super admins
can preview future file constraints, consent/context requirements, disabled
upload/publish/export controls, future structured events, and disabled outbox
destinations while DS Admin stays out of student proof content. No files are
uploaded, no buckets are created, no proof is published, and no external
automation runs.
Goal 159 extends the same route with a proof storage intake packet that previews
the private bucket, storage path, required metadata, moderation queue, disabled
outbox, audit action, and locked storage controls before any Supabase Storage
write is approved.

Goal 69 adds a mock-safe Rush Month event readiness route at
`/rush-month/events`. Members, leaders, coaches, admins, and super admins can
review event plans, student actions, NPS questions, proof prompts, disabled
Luma posture, future structured event records, and disabled outbox rows while
DS Admin remains restricted from chapter event truth. No Luma event writes,
attendance imports, reminders, warehouse exports, n8n workflows, or AI summaries
run.

Do not connect production Supabase, create real users, enable browser app
writes beyond the approved local action-start, assignment creation, proof
metadata, HQ proof decision, and coach decision slices, or enable external writes until Nick approves a later
implementation goal.

## Recommended Stack

Recommended model for this stack decision: GPT-5.5 Thinking.
Reason: stack choice affects the long-term architecture, hosting, data model,
integrations, and security posture.

Recommended stack for this repo:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Postgres/Auth/Storage
- Vercel deployment
- GitHub PR workflow
- Linear issue tracking

Why this recommendation:

- The myMEDLIFE build handoff explicitly recommends Next.js, Supabase, and
  Vercel for this custom PWA.
- The repo is already scaffolded as a Next.js app.
- Supabase is the planned app source of truth for auth, chapter membership,
  permissions, assignments, evidence, points, KPIs, and events.
- Vercel fits the public PWA deployment path for `www.myMEDLIFE.org`.

Stack conflict to keep visible:

- Kiomi's general project standard defaults to Vite, TanStack Router, TanStack
  Query, Hono, Cloudflare services, and evlog.
- Do not silently mix these stacks.
- If the team wants to switch to Kiomi's default stack, confirm that decision
  with Nick/team before changing this repo.

## Product Posture

myMEDLIFE should turn MEDLIFE campaign SOPs into distributed student action. It
should not become a passive SOP library, a generic marketing site, or a forum.

The first acceptance test is Rush Month:

leader assigns action -> member completes action -> evidence is submitted ->
leader/coach reviews -> points/KPIs update -> coach sees advance/hold/intervene.

All external integrations are mock-first until explicitly approved.

## Important Docs

- [Agent standards](./AGENTS.md)
- [Foundation and Rush Month MVP architecture](./docs/architecture/foundation-and-rush-month-mvp.md)
- [Supabase schema, auth, and RLS design plan](./docs/architecture/supabase-schema-auth-rls-plan.md)
- [Goal 6 Supabase foundation review and Goal 7 plan](./docs/architecture/goal-6-supabase-foundation-review.md)
- [Goal 13 local write implementation plan](./docs/architecture/goal-13-local-write-implementation-plan.md)
- [Goal 14 action start write](./docs/architecture/goal-14-action-start-write.md)
- [Goal 15 proof submission write](./docs/architecture/goal-15-proof-submission-write.md)
- [Goal 16 HQ proof sharing decision](./docs/architecture/goal-16-hq-proof-sharing-decision.md)
- [Goal 17 proof and video storage plan](./docs/architecture/goal-17-proof-video-storage-plan.md)
- [Goal 18 leader assignment creation](./docs/architecture/goal-18-leader-assignment-create.md)
- [Goal 19 auth and onboarding plan](./docs/architecture/goal-19-auth-onboarding-plan.md)
- [Goal 20 live data connection plan](./docs/architecture/goal-20-live-data-connection-plan.md)
- [Goal 21 campaign operating shells](./docs/architecture/goal-21-campaign-operating-shells.md)
- [Goal 22 Rush Month role-aware dashboard](./docs/architecture/goal-22-rush-month-dashboard.md)
- [Goal 23 action-start browser write gate](./docs/architecture/goal-23-action-start-browser-write-gate.md)
- [Goal 24 leader assignment browser write gate](./docs/architecture/goal-24-leader-assignment-write-gate.md)
- [Goal 25 proof submission browser write gate](./docs/architecture/goal-25-proof-submission-browser-write-gate.md)
- [Goal 26 HQ proof-sharing browser write gate](./docs/architecture/goal-26-hq-proof-sharing-browser-write-gate.md)
- [Goal 27 coach decision browser write gate](./docs/architecture/goal-27-coach-decision-browser-write-gate.md)
- [Goal 28 write activation readiness dashboard](./docs/architecture/goal-28-write-activation-readiness.md)
- [Goal 29 write activation approval plan](./docs/architecture/goal-29-write-activation-approval-plan.md)
- [Goal 30 action-start activation contract](./docs/architecture/goal-30-action-start-activation-contract.md)
- [Goal 31 action-start result states](./docs/architecture/goal-31-action-start-result-states.md)
- [Goal 32 proof submission result states](./docs/architecture/goal-32-proof-submission-result-states.md)
- [Goal 33 HQ proof decision result states](./docs/architecture/goal-33-hq-proof-decision-result-states.md)
- [Goal 34 coach decision result states](./docs/architecture/goal-34-coach-decision-result-states.md)
- [Goal 35 result-state coverage review](./docs/architecture/goal-35-result-state-coverage.md)
- [Goal 36 assignment creation result states](./docs/architecture/goal-36-assignment-create-result-states.md)
- [Goal 37 Rush Month local operating loop](./docs/architecture/goal-37-rush-month-local-loop.md)
- [Goal 38 admin control center](./docs/architecture/goal-38-admin-control-center.md)
- [Goal 39 role next actions](./docs/architecture/goal-39-role-next-actions.md)
- [Goal 40 leader follow-up board](./docs/architecture/goal-40-leader-follow-up-board.md)
- [Goal 41 coach portfolio readiness](./docs/architecture/goal-41-coach-portfolio-readiness.md)
- [Goal 42 proof-sharing review states](./docs/architecture/goal-42-proof-sharing-review-states.md)
- [Goal 43 member recognition](./docs/architecture/goal-43-member-recognition.md)
- [Goal 44 campaign closeout readiness](./docs/architecture/goal-44-campaign-closeout-readiness.md)
- [Goal 45 MVP coverage checklist](./docs/architecture/goal-45-mvp-coverage-checklist.md)
- [Goal 46 route smoke manifest](./docs/architecture/goal-46-route-smoke-manifest.md)
- [Goal 47 MVP release readiness](./docs/architecture/goal-47-mvp-release-readiness.md)
- [Goal 48 mobile navigation polish](./docs/architecture/goal-48-mobile-navigation-polish.md)
- [Goal 49 centralized local actor panels](./docs/architecture/goal-49-centralized-local-actor-panels.md)
- [Goal 50 PWA install readiness](./docs/architecture/goal-50-pwa-install-readiness.md)
- [Goal 51 page metadata](./docs/architecture/goal-51-page-metadata.md)
- [Goal 52 route registry guard](./docs/architecture/goal-52-route-registry-guard.md)
- [Goal 53 route coverage summary](./docs/architecture/goal-53-route-coverage-summary.md)
- [Goal 54 stakeholder review path](./docs/architecture/goal-54-stakeholder-review-path.md)
- [Goal 55 admin glossary](./docs/architecture/goal-55-admin-glossary.md)
- [Goal 56 environment safety summary](./docs/architecture/goal-56-environment-safety-summary.md)
- [Goal 57 local MVP review guide](./docs/architecture/goal-57-local-review-guide.md)
- [Goal 58 local Supabase Auth sign-in](./docs/architecture/goal-58-local-auth-sign-in.md)
- [Goal 59 auth-derived actor context](./docs/architecture/goal-59-auth-derived-actor-context.md)
- [Goal 60 action-start server action](./docs/architecture/goal-60-action-start-server-action.md)
- [Goal 61 action-start readback proof](./docs/architecture/goal-61-action-start-readback.md)
- [Goal 62 proof submission server action](./docs/architecture/goal-62-proof-submission-server-action.md)
- [Goal 63 HQ proof decision server action](./docs/architecture/goal-63-hq-proof-decision-server-action.md)
- [Goal 64 leader assignment server action](./docs/architecture/goal-64-leader-assignment-server-action.md)
- [Goal 65 coach decision server action](./docs/architecture/goal-65-coach-decision-server-action.md)
- [Goal 66 MVP progress map](./docs/architecture/goal-66-mvp-progress-map.md)
- [Goal 67 chapter membership workspace](./docs/architecture/goal-67-chapter-membership-workspace.md)
- [Goal 68 proof upload intake readiness](./docs/architecture/goal-68-proof-upload-intake.md)
- [Goal 69 Rush Month event readiness](./docs/architecture/goal-69-rush-month-event-readiness.md)
- [Goal 70 design QA readiness](./docs/architecture/goal-70-design-qa-readiness.md)
- [Goal 71 controlled pilot readiness](./docs/architecture/goal-71-controlled-pilot-readiness.md)
- [Goal 72 staff dry-run guide](./docs/architecture/goal-72-staff-dry-run-guide.md)
- [Goal 73 pilot scope planner](./docs/architecture/goal-73-pilot-scope-planner.md)
- [Goal 74 first-write activation drill](./docs/architecture/goal-74-first-write-activation-drill.md)
- [Goal 75 first-write readback evidence](./docs/architecture/goal-75-first-write-readback-evidence.md)
- [Goal 76 first-write verification packet](./docs/architecture/goal-76-first-write-verification-packet.md)
- [Goal 77 write sequence planner](./docs/architecture/goal-77-write-sequence-planner.md)
- [Goal 78 proof metadata packet](./docs/architecture/goal-78-proof-metadata-packet.md)
- [Goal 79 HQ proof decision packet](./docs/architecture/goal-79-hq-proof-decision-packet.md)
- [Goal 80 leader assignment packet](./docs/architecture/goal-80-leader-assignment-packet.md)
- [Goal 81 coach decision packet](./docs/architecture/goal-81-coach-decision-packet.md)
- [Goal 82 write sequence packet status](./docs/architecture/goal-82-write-sequence-status.md)
- [Goal 83 five-write staff dry-run rehearsal](./docs/architecture/goal-83-five-write-staff-dry-run.md)
- [Goal 84 action committee role personas](./docs/architecture/goal-84-action-committee-role-personas.md)
- [Goal 85 action committee workspace](./docs/architecture/goal-85-action-committee-workspace.md)
- [Goal 86 event proof bridge](./docs/architecture/goal-86-event-proof-bridge.md)
- [Goal 87 action proof handoff](./docs/architecture/goal-87-action-proof-handoff.md)
- [Goal 88 member proof status](./docs/architecture/goal-88-member-proof-status.md)
- [Goal 89 leader evidence follow-up](./docs/architecture/goal-89-leader-evidence-follow-up.md)
- [Goal 90 leader role personas](./docs/architecture/goal-90-leader-role-personas.md)
- [Goal 91 leader dashboard role focus](./docs/architecture/goal-91-leader-dashboard-role-focus.md)
- [Goal 92 leader actions role focus](./docs/architecture/goal-92-leader-actions-role-focus.md)
- [Goal 93 leader review role focus](./docs/architecture/goal-93-leader-review-role-focus.md)
- [Goal 94 member role focus](./docs/architecture/goal-94-member-role-focus.md)
- [Goal 95 leader assignment role responsibility](./docs/architecture/goal-95-leader-assignment-role-responsibility.md)
- [Goal 96 write sequence role responsibility](./docs/architecture/goal-96-write-sequence-role-responsibility.md)
- [Goal 97 admin responsibility summary](./docs/architecture/goal-97-admin-responsibility-summary.md)
- [Goal 98 role model review checkpoint](./docs/architecture/goal-98-role-model-review-checkpoint.md)
- [Goal 99 campaign starter shell checkpoint](./docs/architecture/goal-99-campaign-starter-shell-checkpoint.md)
- [Goal 100 Planning / Goal Setting campaign plan](./docs/architecture/goal-100-planning-goal-setting-campaign-plan.md)
- [Goal 101 Chapter Engagement campaign plan](./docs/architecture/goal-101-chapter-engagement-campaign-plan.md)
- [Goal 102 SLT Promotion campaign plan](./docs/architecture/goal-102-slt-promotion-campaign-plan.md)
- [Goal 103 Moving Mountains campaign plan](./docs/architecture/goal-103-moving-mountains-campaign-plan.md)
- [Goal 104 Leadership Transition campaign plan](./docs/architecture/goal-104-leadership-transition-campaign-plan.md)
- [Goal 105 Grow the Movement campaign plan](./docs/architecture/goal-105-grow-the-movement-campaign-plan.md)
- [Goal 106 Start a Chapter campaign plan](./docs/architecture/goal-106-start-a-chapter-campaign-plan.md)
- [Goal 107 production launch gate](./docs/architecture/goal-107-production-launch-gate.md)
- [Goal 108 database security decision packet](./docs/architecture/goal-108-database-security-decision.md)
- [Goal 109 admin audit log review](./docs/architecture/goal-109-admin-audit-log-review.md)
- [Goal 110 admin system health review](./docs/architecture/goal-110-admin-system-health-review.md)
- [Goal 111 production operations runbook](./docs/architecture/goal-111-production-operations-runbook.md)
- [Goal 112 coach support notes workspace](./docs/architecture/goal-112-coach-support-notes.md)
- [Goal 113 leader proof decision workspace](./docs/architecture/goal-113-leader-proof-decision-workspace.md)
- [Goal 114 leader proof decision result states](./docs/architecture/goal-114-leader-proof-decision-result-states.md)
- [Goal 115 leader proof decision local write](./docs/architecture/goal-115-leader-proof-decision-local-write.md)
- [Goal 116 leader proof decision server action](./docs/architecture/goal-116-leader-proof-decision-server-action.md)
- [Goal 117 PWA offline recovery shell](./docs/architecture/goal-117-pwa-offline-shell.md)
- [Goal 118 admin master data inventory](./docs/architecture/goal-118-admin-master-data-inventory.md)
- [Goal 119 member leaderboard route](./docs/architecture/goal-119-member-leaderboard-route.md)
- [Goal 120 Rush Month event detail route](./docs/architecture/goal-120-rush-month-event-detail-route.md)
- [Goal 121 read-only profile route](./docs/architecture/goal-121-read-only-profile-route.md)
- [Goal 122 auth onboarding readiness route](./docs/architecture/goal-122-auth-onboarding-readiness-route.md)
- [Goal 123 evidence submission readiness route](./docs/architecture/goal-123-evidence-submission-readiness-route.md)
- [Goal 124 admin master data route](./docs/architecture/goal-124-admin-master-data-route.md)
- [Goal 125 admin integration outbox route](./docs/architecture/goal-125-admin-integration-outbox-route.md)
- [Goal 126 admin audit log route](./docs/architecture/goal-126-admin-audit-log-route.md)
- [Goal 127 admin system health route](./docs/architecture/goal-127-admin-system-health-route.md)
- [Goal 128 admin design QA route](./docs/architecture/goal-128-admin-design-qa-route.md)
- [Goal 129 admin operations route](./docs/architecture/goal-129-admin-operations-route.md)
- [Goal 130 admin database security route](./docs/architecture/goal-130-admin-database-security-route.md)
- [Goal 131 admin launch gate route](./docs/architecture/goal-131-admin-launch-gate-route.md)
- [Goal 132 admin release readiness route](./docs/architecture/goal-132-admin-release-readiness-route.md)
- [Goal 133 admin stakeholder review path](./docs/architecture/goal-133-admin-review-path-route.md)
- [Goal 134 local sign-in review coverage](./docs/architecture/goal-134-local-sign-in-review-coverage.md)
- [Goal 135 member chapter home review coverage](./docs/architecture/goal-135-member-chapter-home-review-coverage.md)
- [Goal 136 member action detail review coverage](./docs/architecture/goal-136-member-action-detail-review-coverage.md)
- [Goal 137 member Rush Month overview review coverage](./docs/architecture/goal-137-member-rush-month-overview-review-coverage.md)
- [Goal 138 member assigned-actions review coverage](./docs/architecture/goal-138-member-assigned-actions-review-coverage.md)
- [Goal 139 member Rush Month events review coverage](./docs/architecture/goal-139-member-rush-month-events-review-coverage.md)
- [Goal 140 member walkthrough sequence review](./docs/architecture/goal-140-member-walkthrough-sequence.md)
- [Goal 141 leader walkthrough sequence review](./docs/architecture/goal-141-leader-walkthrough-sequence.md)
- [Goal 142 coach walkthrough sequence review](./docs/architecture/goal-142-coach-walkthrough-sequence.md)
- [Goal 143 admin walkthrough sequence review](./docs/architecture/goal-143-admin-walkthrough-sequence.md)
- [Goal 144 stakeholder review phase map](./docs/architecture/goal-144-stakeholder-review-phase-map.md)
- [Goal 145 Nick final local review packet](./docs/architecture/goal-145-nick-final-review-packet.md)
- [Goal 146 mobile visual smoke plan](./docs/architecture/goal-146-mobile-visual-smoke-plan.md)
- [Goal 147 mobile route smoke manifest bridge](./docs/architecture/goal-147-mobile-route-smoke-manifest.md)
- [Goal 148 accessibility smoke plan](./docs/architecture/goal-148-accessibility-smoke-plan.md)
- [Goal 149 device and PWA smoke matrix](./docs/architecture/goal-149-device-pwa-smoke-matrix.md)
- [Goal 150 launch evidence checklist](./docs/architecture/goal-150-launch-evidence-checklist.md)
- [Goal 151 Nick pilot approval checkpoint](./docs/architecture/goal-151-nick-pilot-approval-checkpoint.md)
- [Goal 152 evidence prep checklist](./docs/architecture/goal-152-evidence-prep-checklist.md)
- [Goal 153 leader proof review rubric](./docs/architecture/goal-153-leader-proof-review-rubric.md)
- [Goal 154 coach intervention checklist](./docs/architecture/goal-154-coach-intervention-checklist.md)
- [Goal 155 integration live-send preflight checklist](./docs/architecture/goal-155-integration-live-send-preflight.md)
- [Goal 156 admin write-audit preflight checklist](./docs/architecture/goal-156-admin-write-audit-preflight.md)
- [Goal 157 production auth preflight checklist](./docs/architecture/goal-157-production-auth-onboarding-preflight.md)
- [Goal 158 proof submission packet](./docs/architecture/goal-158-proof-submission-packet.md)
- [Goal 159 proof storage intake packet](./docs/architecture/goal-159-proof-storage-intake-packet.md)
- [Goal 160 membership approval packet](./docs/architecture/goal-160-membership-approval-packet.md)
- [Goal 161 membership approval result states](./docs/architecture/goal-161-membership-approval-result-states.md)
- [Goal 162 membership approval write readiness](./docs/architecture/goal-162-membership-approval-write-readiness.md)
- [Local MVP review guide](./docs/review/local-mvp-review-guide.md)
- [Future RLS test plan](./docs/testing/rls-test-plan.md)
- [Supabase local development](./docs/supabase-local-development.md)
- [Codex operating brief](./docs/operating-brief.md)

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Run checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run local Supabase when Docker is available:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:test
```

To test the read-only local Supabase path:

```bash
cp .env.example .env.local
# Set MYMEDLIFE_DATA_SOURCE=supabase
# Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true
# Set SUPABASE_SERVICE_ROLE_KEY to the local service role key printed by Supabase
# Optional: set MYMEDLIFE_LOCAL_ACTOR_EMAIL to one of the fake seed users.
# This also works when the app is using mock fallback data.
pnpm supabase:start
pnpm supabase:reset
pnpm dev
```

## Environment Variables

No live external services are required for the current mock app or local
database foundation. The app uses mock data unless local Supabase reads are
explicitly enabled.

```bash
MYMEDLIFE_DATA_SOURCE=mock
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=false
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=false
MYMEDLIFE_ENABLE_ACTION_START_WRITE=false
MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=false
MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=false
MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE=false
MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=false
MYMEDLIFE_ALLOW_PROOF_UPLOADS=false
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MYMEDLIFE_LOCAL_ACTOR_EMAIL=member.a@mymedlife.test
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Rules:

- Never commit real secrets.
- Keep `MYMEDLIFE_DATA_SOURCE=mock` unless you are intentionally testing local
  Supabase.
- Goal 8 only permits localhost Supabase reads. Non-local Supabase URLs fall
  back to mock data.
- Goal 9 actor switching is local-only and reads fake seed users by email. It
  can use `MYMEDLIFE_LOCAL_ACTOR_EMAIL` or the in-app preview-role cookie, but
  it does not add browser sign-in, production auth, or app writes.
- Goal 10 role filtering is read-only and local-only. It uses
  `MYMEDLIFE_LOCAL_ACTOR_EMAIL` to preview member, action committee, leader,
  coach, admin, DS admin, and super admin views.
- Goal 11 local action/proof contracts are preview-only. They shape future
  events, audit logs, and disabled outbox rows but do not save data, upload
  files, publish proof, or trigger automation.
- Goal 12 write-readiness is an airlock. `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES`
  is documented but still blocked by code until a later approved goal adds
  real local writes with RLS tests.
- Goal 13 write planning is documentation and tests only. It names the first
  future write paths, including assignment creation, but the app still refuses
  to save data.
- Goal 14 adds the first local Supabase database write function for
  `action_started`. Browser saves require the later Goal 60 local-only server
  action flags.
- Goal 15 adds the first local Supabase database write function for
  `evidence_submitted` proof/testimonial metadata. Browser saves require the
  later Goal 62 local-only server action flags. Uploads, public proof sharing,
  and external automation remain disabled.
- Goal 16 adds the first local Supabase database write function for
  `hq_sharing_decision_logged` proof/testimonial sharing decisions. The browser
  UI still does not save decisions, publish proof, or send automation.
- Goal 17 adds proof/video storage planning and disabled upload readiness.
  `MYMEDLIFE_ALLOW_PROOF_UPLOADS=true` still does not upload files or publish
  proof.
- Goal 18 adds the first local Supabase database write function for
  `action_assigned` chapter-leader assignment creation. The browser UI still
  does not save assignments or send automation.
- Goal 19 adds auth/onboarding planning and tests. Live auth, browser sessions,
  production users, join requests, membership approvals, and role assignments
  remain disabled.
- Goal 20 adds the route-by-route live-data connection plan. Production
  Supabase, browser writes, and external writes remain disabled.
- Goal 21 adds read-only campaign shells, action committee event examples, and
  proof-library posture. It still does not build all campaigns, publish proof,
  enable browser writes, or send anything externally.
- Goal 22 adds a role-aware Rush Month dashboard and exact starter campaign
  shells. It still does not enable browser writes, live auth, proof uploads, or
  external sends.
- Goal 23 adds a browser-write activation gate for action start. It still keeps
  the enabled browser control off, even if the local write env var is set.
- Goal 24 adds a browser-write activation gate for leader assignment creation.
  It also keeps the enabled browser control off, even if the local write env var
  is set.
- Goal 25 adds a browser-write activation gate for proof/testimonial submission.
  It still keeps proof saves, uploads, public sharing, and enabled browser
  controls off, even if the local write env var is set.
- Goal 26 adds a browser-write activation gate for HQ proof-sharing decisions.
  It still keeps decision saves, public sharing, and enabled browser controls
  off, even if the local write env var is set.
- Goal 27 adds a browser-write activation gate for coach decisions. It still
  keeps coach decision saves, n8n escalation packets, and enabled browser
  controls off, even if the local write env var is set.
- Goal 28 adds the consolidated write activation readiness panel on `/admin`.
  It keeps every enabled browser control at zero.
- Goal 29 adds the write activation approval plan on `/admin`. It does not
  grant approval or activate any write.
- Goal 30 adds the action-start activation contract on
  `/rush-month/actions/[assignmentId]`. It does not create a server action or
  save from the browser.
- Goal 31 adds action-start result states. It does not wire those states to a
  real browser write.
- Goal 32 adds proof submission result states. It does not wire those states to
  a real browser write, upload, public sharing workflow, or external automation.
- Goal 33 adds HQ proof decision result states. It does not wire those states
  to a real browser write, public proof publishing workflow, or external
  automation.
- Goal 34 adds coach decision result states. It does not wire those states to a
  real browser write, n8n escalation packet, or external automation.
- Goal 35 adds an admin result-state coverage review. It does not treat
  coverage as approval, and it keeps assignment creation marked as missing
  result-state review.
- Goal 36 adds assignment creation result states and marked the original five
  first write candidates covered in the admin coverage panel. It still does not
  enable browser writes or reminder automation.
- Goal 37 adds a browser-local Rush Month operating loop. It is interactive
  review evidence only; it still does not save to Supabase or send external
  automation.
- Goal 38 adds a read-only admin control center. It names the required admin
  MVP surfaces but does not enable admin mutations.
- Goal 48 adds role-aware mobile quick navigation and active route styling.
  It improves reviewer usability without enabling live auth, browser writes,
  uploads, public proof sharing, or external integrations.
- Goal 49 centralizes the local actor notice and role switcher in `AppShell`
  so actor-aware routes inherit consistent reviewer context without duplicating
  page-level debug panels.
- Goal 50 adds static PWA install metadata and an app icon. It does not add a
  service worker, offline caching, push notifications, live auth, browser
  writes, uploads, public proof sharing, or external integrations.
- Goal 117 adds a conservative offline recovery shell and service worker. It
  caches only static shell assets, uses network-first navigation, and does not
  cache private Supabase/app data, enable push, submit writes, or run external
  automation.
- Goal 51 adds static page titles and descriptions for core routes. It does
  not change permissions, data loading, writes, auth, uploads, public proof
  sharing, or integrations.
- Goal 52 adds a route registry guard for primary navigation, mobile
  navigation, and admin smoke-manifest links. It does not change route
  permissions, visibility, data loading, writes, auth, uploads, public proof
  sharing, or integrations.
- Goal 53 adds an admin route coverage summary. It does not add routes, change
  navigation behavior, or enable auth, writes, uploads, public proof sharing,
  or integrations.
- Goal 54 adds an admin stakeholder review path. It does not enable auth,
  browser writes, uploads, public proof sharing, reminders, escalation packets,
  or external integrations.
- Goal 55 adds a plain-English admin glossary. It does not enable auth, writes,
  uploads, public proof sharing, external sends, reminders, escalation packets,
  service workers, or production data.
- Goal 56 adds an environment safety summary without showing secrets. It does
  not enable auth, writes, uploads, public proof sharing, external sends,
  reminders, escalation packets, service workers, or production data.
- Goal 57 adds a plain-English local MVP review guide. It is documentation only
  and does not enable auth, writes, uploads, public proof sharing, external
  integrations, service workers, reminders, escalation packets, or production
  data.
- Goal 58 adds localhost-only Supabase Auth sign-in at `/login` for fake local
  seed users. It does not enable production Supabase Auth, production users,
  browser app writes, uploads, public proof sharing, or external sends.
- Goal 59 maps signed-in local Supabase Auth users into role-aware actor
  context. It keeps the debug actor fallback and still does not enable
  production auth, production users, browser writes, uploads, public proof
  sharing, or external sends.
- Goal 60 adds the first local action-start server action. It requires local
  Supabase Auth, a fake seed user, and both local write flags. It does not
  enable production Supabase, production users, assignment creation writes,
  proof writes, coach writes, uploads, public proof sharing, or external sends.
- Goal 62 adds the second local server action for proof/testimonial metadata.
  It requires local Supabase Auth, a fake seed user, local write flags, an
  in-progress or changes-requested assignment, and uploads disabled. It does
  not upload files, publish proof, or trigger external sends.
- Goal 63 adds the third local server action for HQ proof/testimonial sharing
  decisions. It requires local Supabase Auth, a fake Admin or Super Admin seed
  user, local write flags, a UUID evidence item, and public sharing disabled.
  It does not publish proof or trigger external sends.
- Goal 64 adds the fourth local server action for chapter-leader assignment
  creation. It requires local Supabase Auth, a fake leader or Super Admin seed
  user, local write flags, UUID chapter/campaign rows, and reminder automation
  disabled. It creates a disabled outbox row but sends no reminders.
- Goal 65 adds the fifth local server action for coach advance / hold /
  intervene decisions. It requires local Supabase Auth, a fake Coach, Admin, or
  Super Admin seed user, local write flags, UUID chapter/campaign/phase rows,
  and escalation packets disabled. It creates a disabled outbox row but sends no
  escalation packet.
- Goal 68 adds the proof upload intake readiness route at
  `/proof-library/upload`. It validates future file/consent/context posture and
  names future events/outbox destinations, but it does not create storage
  buckets, upload files, publish proof, export raw proof, or trigger external
  sends.
- Goal 159 adds the proof storage intake packet to `/proof-library/upload`,
  including future bucket/path, required metadata, moderation, disabled outbox,
  audit action, and locked storage controls while keeping uploads off.
- Goal 69 adds the Rush Month event readiness route at `/rush-month/events`.
  It previews event plans, NPS questions, proof prompts, disabled Luma posture,
  future structured events, and disabled outbox destinations, but it does not
  create/update Luma events, import attendance, send NPS reminders, export
  warehouse rows, or trigger external sends.
- Keep real HubSpot, Luma, warehouse, Power BI, and n8n writes disabled until
  explicitly approved.
- Use mock-safe integration events and outbox rows before adding real syncs.

## Current App State

The app currently uses mock data by default. When local Supabase env vars are
explicitly enabled, these server-rendered routes can read fake local Supabase
data and fake local actor context. With or without local Supabase running,
`MYMEDLIFE_LOCAL_ACTOR_EMAIL` can preview the Goal 10 local role views:

- `/login`
- `/profile`
- `/onboarding`
- `/chapter`
- `/chapter/members`
- `/campaigns`
- `/campaigns/[campaignSlug]`
- `/action-committees`
- `/rush-month`
- `/rush-month/dashboard`
- `/rush-month/leaderboard`
- `/rush-month/loop`
- `/rush-month/events`
- `/rush-month/events/[eventId]`
- `/rush-month/events/[eventId]`
- `/rush-month/actions`
- `/rush-month/actions/[assignmentId]`
- `/rush-month/evidence`
- `/rush-month/review`
- `/proof-library`
- `/proof-library/upload`
- `/coach`
- `/admin`
- `/admin/review-path`
- `/admin/nick-review`
- `/admin/release-readiness`
- `/admin/launch-gate`
- `/admin/audit-log`
- `/admin/integration-outbox`
- `/admin/master-data`
- `/admin/database-security`
- `/admin/system-health`
- `/admin/design-qa`
- `/admin/operations`
- `/admin/first-write`
- `/admin/write-sequence`
- `/admin/proof-write`
- `/admin/hq-proof-write`
- `/admin/assignment-write`
- `/admin/pilot-scope`
- `/admin/staff-dry-run`

There is no production Supabase auth, production database connection, broad
browser write launch, HubSpot write, Luma write, warehouse export, Power BI
export, n8n workflow, or AI summary. Local-only server action paths remain
guarded behind fake local auth, localhost Supabase, and explicit env flags.

Goal 2 route shells:

- `/`: mobile-first app front door
- `/login`: fake local Supabase Auth sign-in, seed-user session readiness, and production-auth boundary review
- `/profile`: read-only local profile, role/chapter scope, next action, and disabled profile/onboarding posture
- `/onboarding`: read-only sign-in, profile, chapter join, membership approval, role assignment, coach assignment, staff role assignment sequence, and Goal 157 staff production auth preflight
- `/chapter`: read-only chapter home, current campaign, visible progress, points, and next links into Rush Month, roles, campaigns, committees, and proof library
- `/chapter/members`: read-only roster, join request, Goal 160 membership approval packet, Goal 161 membership result preview, Goal 162 write readiness, role coverage, and membership control posture
- `/campaigns`: role-aware campaign catalog plus required starter-shell checkpoint
- `/campaigns/[campaignSlug]`: campaign detail, action lanes, events, proof, KPIs, disabled integration posture, and deepened local plans for all seven required non-Rush starter campaigns
- `/action-committees`: action committee and chapter event operating examples
- `/rush-month`: Rush Month campaign shell
- `/rush-month/dashboard`: role-aware Rush Month operating dashboard
- `/rush-month/leaderboard`: member points, rank, recognition, next action, and leaderboard route
- `/rush-month/loop`: browser-local end-to-end Rush Month operating-loop demo
- `/rush-month/events`: mock-safe event, NPS, proof prompt, disabled Luma, and future outbox readiness
- `/rush-month/events/[eventId]`: direct event detail, owner, next action, NPS/proof prompts, readiness checks, and disabled event outbox posture
- `/rush-month/actions`: role-aware visible assignments plus disabled leader assignment gate
- `/rush-month/actions/[assignmentId]`: role-aware action detail, local proof contract preview, and disabled proof submission gate
- `/rush-month/evidence`: member evidence submission queue, Goal 152 proof prep checklist, Goal 158 proof submission packet, proof status, future structured records, and disabled upload/public-sharing posture
- `/rush-month/review`: leader proof decision workspace, Goal 153 review rubric, disabled leader/HQ decision gates, and proof-sharing boundary
- `/proof-library`: role-aware proof/testimonial library posture
- `/proof-library/upload`: mock-safe proof upload intake readiness, Goal 159 storage packet, consent/context checks, disabled upload controls, and future event/outbox posture
- `/coach`: coach dashboard shell, portfolio, Goal 154 intervention checklist, support notes, risk readout, and disabled coach decision path
- `/admin`: admin/super-admin release readiness, production launch gate, route coverage, role responsibility, audit readback, and integration/outbox safety
- `/admin/review-path`: focused read-only stakeholder walkthrough, fake local actor emails, expected review moments, route safety boundaries, and zero-write/no-send posture
- `/admin/nick-review`: focused final local MVP review packet with owner lanes, pass signals, Goal 150 launch evidence, pilot scope, launch boundaries, zero writes, zero sends, and zero invitations
- `/admin/release-readiness`: focused read-only MVP release-readiness summary, local-review posture, launch blockers, role checkpoint, and next approvals
- `/admin/launch-gate`: focused read-only production launch gate, Goal 150 launch evidence checklist, missing live evidence, owner sign-off, rollback, and pilot-readiness review
- `/admin/audit-log`: focused read-only audit readback posture, Goal 156 write-audit preflight, hidden-row safety, retention/export locks, and disabled write/send review
- `/admin/integration-outbox`: focused read-only integration event, automation outbox, Goal 155 live-send preflight, audit posture, and blocked live-send review
- `/admin/master-data`: focused read-only fake-user, role, chapter, and campaign-template inventory
- `/admin/database-security`: focused read-only Supabase versus PlanetScale decision review, RLS approval, proof-storage, compliance, and service-key posture
- `/admin/system-health`: focused read-only system health, launch blocker, and production readiness review
- `/admin/design-qa`: focused read-only Figma, mobile visual smoke plan, route-smoke metadata, accessibility smoke plan, device/PWA smoke matrix, offline, proof-intake, final-review, and pilot-safety review
- `/admin/operations`: focused read-only incident, rollback, integration recovery, mobile PWA support, and day-one support review
- `/admin/first-write`: staff-only first local action-start write drill
- `/admin/write-sequence`: staff-only Rush Month write promotion planner
- `/admin/proof-write`: staff-only metadata proof/testimonial packet
- `/admin/hq-proof-write`: staff-only HQ proof-sharing decision packet
- `/admin/assignment-write`: staff-only leader assignment creation packet
- `/admin/pilot-scope`: first-pilot scope decision planner
- `/admin/staff-dry-run`: fake-user staff rehearsal guide

Mock Rush Month data lives in `src/data/mock-rush-month.ts`. Mock campaign,
action committee, event, and proof library data lives in
`src/data/mock-campaigns.ts`. Shared domain types live in
`src/shared/types/domain.ts` and `src/shared/types/campaigns.ts`. Validation
schemas live in `src/shared/schemas/domain.ts`. Pure mock workflow logic lives
in `src/services/rush-month-service.ts`. Campaign operating logic lives in
`src/services/campaign-ops-service.ts`. Local action/proof contract previews
live in `src/services/local-action-contracts.ts`. Disabled future write
boundaries live in `src/services/write-readiness.ts`. Small reusable UI
components live in `src/components`.

Goal 4 Supabase planning lives in
`docs/architecture/supabase-schema-auth-rls-plan.md`. The draft SQL sketch lives
in `docs/architecture/drafts/0001_supabase_schema_draft.sql` and is not an
applied migration.

Goal 5 local Supabase implementation lives in:

- `.github/workflows/goal-5-ci.yml`
- `supabase/config.toml`
- `supabase/migrations/20260615110000_initial_supabase_foundation.sql`
- `supabase/seed.sql`
- `supabase/tests/database/rls_goal_5.test.sql`
- `docs/supabase-local-development.md`

Goal 6 planning lives in:

- `docs/architecture/goal-6-supabase-foundation-review.md`
- `docs/architecture/drafts/0002_goal_6_schema_refinements_draft.sql`

Goal 7 local schema refinement lives in:

- `supabase/migrations/20260615130000_goal_7_campaign_operating_model.sql`
- `supabase/tests/database/rls_goal_7.test.sql`
- additional fake Goal 7 records in `supabase/seed.sql`

Goal 8 read-only app foundation lives in:

- `.env.example`
- `src/lib/supabase-readonly.ts`
- `src/services/read-only-app-data.ts`
- `src/components/data-source-notice.tsx`
- `tests/supabase-readonly.test.ts`
- `tests/read-only-app-data.test.ts`

Goal 10 role-aware read-only proof lives in:

- `src/services/role-visibility.ts`
- `src/components/local-role-switcher.tsx`
- `src/components/restricted-state.tsx`
- role-aware updates to `/chapter`, `/rush-month`, `/rush-month/actions`,
  `/coach`, and `/admin`
- `tests/role-visibility.test.ts`

Goal 11 local proof/action contracts live in:

- `src/services/local-action-contracts.ts`
- `tests/local-action-contracts.test.ts`
- expanded proof evidence types in `src/shared/types/domain.ts` and
  `src/shared/schemas/domain.ts`
- role-aware updates to `/rush-month/actions/[assignmentId]`,
  `/rush-month/evidence`, and `/rush-month/review`

Goal 12 disabled write-readiness lives in:

- `src/services/write-readiness.ts`
- `src/components/write-readiness-notice.tsx`
- `tests/write-readiness.test.ts`
- visible write-readiness notices on action detail and HQ review screens

Goal 13 local write planning lives in:

- `docs/architecture/goal-13-local-write-implementation-plan.md`
- `src/services/write-plan-matrix.ts`
- `tests/write-plan-matrix.test.ts`

Goal 14 local action-start write lives in:

- `docs/architecture/goal-14-action-start-write.md`
- `supabase/migrations/20260616090000_goal_14_action_start_write.sql`
- `supabase/tests/database/rls_goal_14.test.sql`

Goal 15 local proof/testimonial metadata write lives in:

- `docs/architecture/goal-15-proof-submission-write.md`
- `supabase/migrations/20260616093000_goal_15_proof_submission_write.sql`
- `supabase/tests/database/rls_goal_15.test.sql`

Goal 16 local HQ proof/testimonial sharing decision write lives in:

- `docs/architecture/goal-16-hq-proof-sharing-decision.md`
- `supabase/migrations/20260616103000_goal_16_hq_proof_sharing_decision.sql`
- `supabase/tests/database/rls_goal_16.test.sql`

Goal 17 proof/video storage planning lives in:

- `docs/architecture/goal-17-proof-video-storage-plan.md`
- `src/services/proof-storage-readiness.ts`
- `tests/proof-storage-readiness.test.ts`

Goal 18 local leader assignment creation lives in:

- `docs/architecture/goal-18-leader-assignment-create.md`
- `supabase/migrations/20260616110000_goal_18_leader_assignment_create.sql`
- `supabase/tests/database/rls_goal_18.test.sql`

Goal 19 auth/onboarding planning lives in:

- `docs/architecture/goal-19-auth-onboarding-plan.md`
- `src/services/auth-onboarding-plan.ts`
- `tests/auth-onboarding-plan.test.ts`

Goal 58 local Supabase Auth sign-in lives in:

- `docs/architecture/goal-58-local-auth-sign-in.md`
- `src/app/login/page.tsx`
- `src/app/login/actions.ts`
- `src/lib/supabase-server.ts`
- `src/services/supabase-auth-config.ts`
- `src/services/auth-session.ts`
- `tests/supabase-auth-config.test.ts`
- `tests/auth-session.test.ts`

Goal 59 auth-derived actor context lives in:

- `docs/architecture/goal-59-auth-derived-actor-context.md`
- `src/services/local-actor-context.ts`
- `src/components/local-actor-notice.tsx`
- `src/components/local-role-switcher.tsx`
- `tests/local-actor-context.test.ts`

Goal 60 local action-start server action lives in:

- `docs/architecture/goal-60-action-start-server-action.md`
- `src/app/rush-month/actions/[assignmentId]/actions.ts`
- `src/components/action-start-server-action-panel.tsx`
- `src/services/action-start-write.ts`
- `tests/action-start-write.test.ts`

Goal 62 local proof/testimonial metadata server action lives in:

- `docs/architecture/goal-62-proof-submission-server-action.md`
- `src/app/rush-month/actions/[assignmentId]/actions.ts`
- `src/components/proof-submission-server-action-panel.tsx`
- `src/services/proof-submission-write.ts`
- `tests/proof-submission-write.test.ts`

Goal 63 local HQ proof decision server action lives in:

- `docs/architecture/goal-63-hq-proof-decision-server-action.md`
- `src/app/rush-month/review/actions.ts`
- `src/app/rush-month/review/page.tsx`
- `src/components/hq-proof-decision-server-action-panel.tsx`
- `src/services/hq-proof-decision-write.ts`
- `tests/hq-proof-decision-write.test.ts`

Goal 64 local leader assignment server action lives in:

- `docs/architecture/goal-64-leader-assignment-server-action.md`
- `src/app/rush-month/actions/actions.ts`
- `src/app/rush-month/actions/page.tsx`
- `src/components/leader-assignment-server-action-panel.tsx`
- `src/services/assignment-create-write.ts`
- `tests/assignment-create-write.test.ts`

Goal 65 local coach decision server action lives in:

- `docs/architecture/goal-65-coach-decision-server-action.md`
- `src/app/coach/actions.ts`
- `src/app/coach/page.tsx`
- `src/components/coach-decision-server-action-panel.tsx`
- `src/services/coach-decision-write.ts`
- `tests/coach-decision-write.test.ts`

Goal 66 MVP progress map lives in:

- `docs/architecture/goal-66-mvp-progress-map.md`
- `src/components/mvp-progress-map-panel.tsx`
- `src/services/mvp-progress-map.ts`
- `tests/mvp-progress-map.test.ts`

Goal 67 chapter membership workspace lives in:

- `docs/architecture/goal-67-chapter-membership-workspace.md`
- `src/app/chapter/members/page.tsx`
- `src/components/chapter-membership-workspace-panel.tsx`
- `src/services/chapter-membership-workspace.ts`
- `tests/chapter-membership-workspace.test.ts`

Goal 20 live-data connection planning lives in:

- `docs/architecture/goal-20-live-data-connection-plan.md`
- `src/services/live-data-connection-plan.ts`
- `tests/live-data-connection-plan.test.ts`

Goal 21 campaign operating shells live in:

- `docs/architecture/goal-21-campaign-operating-shells.md`
- `src/shared/types/campaigns.ts`
- `src/data/mock-campaigns.ts`
- `src/services/campaign-ops-service.ts`
- `src/components/campaign-card.tsx`
- `src/app/campaigns/page.tsx`
- `src/app/campaigns/[campaignSlug]/page.tsx`
- `src/app/action-committees/page.tsx`
- `src/app/proof-library/page.tsx`
- `tests/campaign-ops-service.test.ts`

Goal 22 Rush Month dashboard lives in:

- `docs/architecture/goal-22-rush-month-dashboard.md`
- `src/app/rush-month/dashboard/page.tsx`
- `src/data/mock-leaderboard.ts`
- `src/services/rush-month-dashboard-service.ts`
- `src/shared/types/rush-month-dashboard.ts`
- `tests/rush-month-dashboard-service.test.ts`

Goal 23 action-start browser write gate lives in:

- `docs/architecture/goal-23-action-start-browser-write-gate.md`
- `src/services/browser-write-activation.ts`
- `src/components/browser-write-gate-notice.tsx`
- `tests/browser-write-activation.test.ts`
- visible gate notice on `/rush-month/actions/[assignmentId]`

Goal 24 leader assignment browser write gate lives in:

- `docs/architecture/goal-24-leader-assignment-write-gate.md`
- `src/services/local-action-contracts.ts`
- `src/services/write-plan-matrix.ts`
- `src/services/write-readiness.ts`
- `src/services/browser-write-activation.ts`
- `tests/local-action-contracts.test.ts`
- `tests/write-plan-matrix.test.ts`
- `tests/browser-write-activation.test.ts`
- visible gate notice on `/rush-month/actions`

Goal 25 proof submission browser write gate lives in:

- `docs/architecture/goal-25-proof-submission-browser-write-gate.md`
- `src/services/browser-write-activation.ts`
- `src/app/rush-month/actions/[assignmentId]/page.tsx`
- `tests/browser-write-activation.test.ts`
- visible gate notice on `/rush-month/actions/[assignmentId]` for roles that
  can submit proof

Goal 26 HQ proof-sharing browser write gate lives in:

- `docs/architecture/goal-26-hq-proof-sharing-browser-write-gate.md`
- `src/services/browser-write-activation.ts`
- `src/app/rush-month/review/page.tsx`
- `tests/browser-write-activation.test.ts`
- visible gate notice on `/rush-month/review` for roles that can make HQ
  sharing decisions

Goal 27 coach decision browser write gate lives in:

- `docs/architecture/goal-27-coach-decision-browser-write-gate.md`
- `supabase/migrations/20260616120000_goal_27_coach_decision_write.sql`
- `supabase/tests/database/rls_goal_27.test.sql`
- visible gate notice on `/coach`

Goal 28 write activation readiness lives in:

- `docs/architecture/goal-28-write-activation-readiness.md`
- `src/services/write-activation-readiness.ts`
- `src/components/write-activation-readiness-panel.tsx`
- `tests/write-activation-readiness.test.ts`
- visible readiness panel on `/admin`

Goal 29 write activation approval plan lives in:

- `docs/architecture/goal-29-write-activation-approval-plan.md`
- `src/services/write-activation-approval-plan.ts`
- `src/components/write-activation-approval-plan-panel.tsx`
- `tests/write-activation-approval-plan.test.ts`
- visible approval plan on `/admin`

Goal 30 action-start activation contract lives in:

- `docs/architecture/goal-30-action-start-activation-contract.md`
- `src/services/action-start-activation-contract.ts`
- `src/components/action-start-activation-contract-panel.tsx`
- `tests/action-start-activation-contract.test.ts`
- visible contract on `/rush-month/actions/[assignmentId]`

Goal 31 action-start result states live in:

- `docs/architecture/goal-31-action-start-result-states.md`
- `src/services/action-start-result-states.ts`
- `src/components/action-start-result-states-panel.tsx`
- `tests/action-start-result-states.test.ts`
- visible result-state panel on `/rush-month/actions/[assignmentId]`

Goal 32 proof submission result states live in:

- `docs/architecture/goal-32-proof-submission-result-states.md`
- `src/services/proof-submission-result-states.ts`
- `src/components/proof-submission-result-states-panel.tsx`
- `tests/proof-submission-result-states.test.ts`
- visible proof result-state panel on `/rush-month/actions/[assignmentId]`

Goal 33 HQ proof decision result states live in:

- `docs/architecture/goal-33-hq-proof-decision-result-states.md`
- `src/services/hq-proof-decision-result-states.ts`
- `src/components/hq-proof-decision-result-states-panel.tsx`
- `tests/hq-proof-decision-result-states.test.ts`
- visible HQ decision result-state panel on `/rush-month/review`

Goal 34 coach decision result states live in:

- `docs/architecture/goal-34-coach-decision-result-states.md`
- `src/services/coach-decision-result-states.ts`
- `src/components/coach-decision-result-states-panel.tsx`
- `tests/coach-decision-result-states.test.ts`
- visible coach decision result-state panel on `/coach`

Goal 35 result-state coverage review lives in:

- `docs/architecture/goal-35-result-state-coverage.md`
- `src/services/write-result-state-coverage.ts`
- `src/components/write-result-state-coverage-panel.tsx`
- `tests/write-result-state-coverage.test.ts`
- visible coverage review panel on `/admin`

Goal 36 assignment creation result states live in:

- `docs/architecture/goal-36-assignment-create-result-states.md`
- `src/services/assignment-create-result-states.ts`
- `src/components/assignment-create-result-states-panel.tsx`
- `tests/assignment-create-result-states.test.ts`
- visible assignment-create result-state panel on `/rush-month/actions`
- updated coverage review on `/admin`

Goal 37 Rush Month local operating loop lives in:

- `docs/architecture/goal-37-rush-month-local-loop.md`
- `src/services/rush-month-local-loop.ts`
- `src/components/rush-month-local-loop-demo.tsx`
- `src/app/rush-month/loop/page.tsx`
- `tests/rush-month-local-loop.test.ts`
- navigation entry in `src/services/role-visibility.ts`

Goal 38 admin control center lives in:

- `docs/architecture/goal-38-admin-control-center.md`
- `src/services/admin-control-center.ts`
- `src/components/admin-control-center-panel.tsx`
- `tests/admin-control-center.test.ts`
- visible admin control center panel on `/admin`

Goal 9 local actor context lives in:

- `src/services/local-actor-context.ts`
- `src/components/local-actor-notice.tsx`
- `tests/local-actor-context.test.ts`

## Linear Lane

Primary live issues:

- MED-412: Bootstrap myMEDLIFE PWA repo lane
- MED-413: Define Supabase schema and role model
- MED-414: Build Rush Month MVP action loop
- MED-415: Build evidence submission and review workflow
- MED-416: Build points, KPI events, and leaderboard stubs
- MED-417: Build Luma, HubSpot, warehouse, and AI mock integration layer
- MED-418: Run bake-off evaluation against Discourse prototype

## Definition of Done for Goal 38

Goal 38 is complete when a human developer can open `/admin` and see the
read-only admin control center for users, roles, chapters, campaign templates,
integration/outbox posture, audit-log readiness, and system-health placeholders
with no admin mutation controls enabled.

The app remains mock-first by default. Goal 38 does not wire production
Supabase, create a server action, enable browser writes, upload files, publish
proof, remove mock fallback, send reminders or escalation packets, enable admin
mutations, or activate real integrations.
