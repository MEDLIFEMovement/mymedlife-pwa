# Local MVP Review Guide

This guide is for non-coder reviewers looking at the local myMEDLIFE Rush Month
MVP.

## What This Build Is

This is a local, mock-safe review build of the custom myMEDLIFE PWA.

It shows how the app can support:

- members seeing what to do next
- leaders tracking action follow-up
- leaders previewing proof approve / request changes / reject posture
- proof/testimonials being collected for HQ review
- points and KPIs being displayed
- coaches seeing readiness, risk, support notes, and advance / hold / intervene
  posture
- admins reviewing safety, route coverage, outbox posture, and launch blockers

## What This Build Is Not

This is not a live student launch.

The build does not enable:

- live login
- production Supabase
- browser saves
- proof uploads
- public proof publishing
- reminders
- coach escalation packets
- HubSpot writes
- Luma writes
- n8n workflows
- warehouse or Power BI exports
- email, SMS, or AI writes

## How To Review It

Start on `/admin`.

Use the admin panels in this order:

1. MVP release readiness
2. Goal 90-97 role model checkpoint inside release readiness
3. Production launch gate
4. Database security decision
5. Environment safety
6. System health review
7. Production operations runbook
8. Stakeholder review path
9. Admin glossary
10. MVP coverage checklist
11. Manual route smoke manifest
12. Route coverage summary
13. Admin control center
14. Audit log review
15. Write activation readiness and approval plan

The stakeholder review path tells you which local actor email to use and which
route to open for each part of the walkthrough.

## Local Actor Emails

Use these fake local actor emails to preview the app:

- `member.a@mymedlife.test`
- `committee.member@mymedlife.test`
- `committee.chair@mymedlife.test`
- `leader.a@mymedlife.test`
- `eboard.a@mymedlife.test`
- `coach@mymedlife.test`
- `admin@mymedlife.test`
- `ds.admin@mymedlife.test`
- `super.admin@mymedlife.test`

These are not production users. They are local review roles only.

## Pass Signals

The local MVP review is healthy when:

- the app builds and tests pass
- admin panels show zero browser writes expected
- admin panels show zero external sends expected
- `/login` shows fake local seed-user sign-in, local Supabase Auth session
  readiness, and the production-auth boundary with `0` production users, `0`
  profile writes, `0` membership writes, and `0` external sends
- `/chapter` shows the member chapter home with chapter context, current
  campaign, visible progress, read-only points, and links into Rush Month,
  members and roles, campaigns, committees, and proof library with `0`
  membership writes, `0` role approvals, `0` points writes, and `0` external
  sends
- `/rush-month` shows the active Rush Month objective, role next action, visible
  action count, proof pending count, coach-read posture, event/proof sections,
  operating path, and links into dashboard, actions, and events with `0`
  campaign phase changes, `0` assignment saves, `0` proof saves, `0` points/KPI
  writes, `0` Luma writes, `0` n8n workflows, and `0` external sends
- `/rush-month/actions` shows the member assigned-actions list with due dates,
  status, proof requirements, points, KPI signal, and links into action detail
  with `0` assignment creation, `0` action-start saves, `0` proof saves, `0`
  reminders, `0` points/KPI writes, `0` browser writes, and `0` external sends
- `/rush-month/actions/member-push` shows one assigned member action with owner,
  status, points, evidence requirements, proof handoff, disabled action-start
  and proof controls, future outbox/audit posture, `0` proof metadata saves,
  `0` uploads, `0` points/KPI writes, and `0` external sends
- `/admin` release readiness shows a Goal 90-97 role model checkpoint with route
  checks, fake actor emails, and `0 writes` / `0 sends`
- `/admin/review-path` shows the focused no-code stakeholder walkthrough with
  fake local actor emails, route-by-route expectations, safety boundaries, `0
  writes`, and `0 sends`
- `/admin/review-path` shows a phase map for member, leader, proof, coach,
  admin, and write-packet review before the detailed 43-step route list
- `/admin/nick-review` shows the final local MVP review packet with owner lanes,
  pass signals, Goal 150 launch evidence, pilot scope, launch boundaries,
  `local review yes`, `live launch no`, `0` writes, `0` sends, and `0` student
  invitations
- `/admin/review-path` orders the member walkthrough as login, profile scope,
  onboarding, chapter home, Rush Month overview, assigned actions, action
  detail, evidence submission, leaderboard, dashboard, events, and one event
  detail before leader, coach, and admin review surfaces
- `/admin/review-path` then starts the leader walkthrough with a President / VP
  dashboard checkpoint before leader follow-up, member-role coverage, the
  operating loop, event readiness, and proof decisions, all with `0` writes and
  `0` sends
- `/admin/review-path` separates coach portfolio health from coach readiness so
  `/coach` can be reviewed for assigned chapters, campaign health, overdue work,
  pending evidence, KPI movement, risk alerts, advance/hold/intervene posture,
  support notes, and disabled coach decisions with `0` writes and `0` sends
- `/admin/review-path` orders the admin walkthrough as control center, master
  data, integration outbox, audit log, system health, database security, final
  review path, release readiness, launch gate, design QA, operations, and write
  packets with `0` admin writes and `0` external sends
- `/admin/release-readiness` shows the focused local review versus live launch
  posture with ready items, blockers, the role-model checkpoint, next approvals,
  `local review yes`, `live launch no`, `0 writes`, and `0 sends`
- `/admin` production launch gate shows eight launch gates, missing live
  evidence, review routes, `launch no`, `0 writes`, and `0 sends`
- `/admin/launch-gate` shows the focused production launch gate with eight live
  gates, the Goal 150 launch evidence checklist, missing evidence, review
  routes, owner sign-off needs, rollback posture, `launch no`, `0 writes`, and
  `0 sends`
- `/admin` database security decision shows Supabase Postgres/Auth/Storage as
  the MVP recommendation, PlanetScale MySQL/Vitess as reviewed tradeoff, launch
  `no`, `0 writes`, and `0 sends`
- `/admin/database-security` shows the focused Supabase versus PlanetScale
  review for Admin, DS Admin, and Super Admin, including chapter-scoped RLS,
  service-key handling, proof storage, BAA/HIPAA posture, launch `no`, `0
  writes`, and `0 sends`
- `/admin` audit log review shows either persisted readback rows for Admin /
  Super Admin or an honest `0` row mock-fallback state; DS Admin sees posture
  without row-level chapter/member audit details, and reviewers can inspect the
  Goal 156 write-audit preflight checklist
- `/admin/audit-log` shows the focused audit readback posture with visible rows
  for Admin/Super Admin, hidden row details for DS Admin, actor/target/
  before-after/reason/visibility/retention checks, `0` browser writes, `0`
  external sends, and `0` secrets
- `/admin` system health shows route, data-source, environment, audit, outbox,
  auth, proof storage, integration, monitoring, backup, and incident checks with
  `launch no`, `0 writes`, `0 sends`, and `0 secrets`
- `/admin/system-health` shows the same focused route, data-source,
  environment, audit, outbox, auth, proof storage, integration, monitoring,
  backup, and incident-owner health checks with live launch still blocked
- `/admin/design-qa` shows the focused Figma target, 390px phone viewport,
  mobile next-action clarity, role complexity, accessibility, mission tone,
  offline recovery, and the Goal 146 eight-route mobile visual smoke plan for
  member, leader, coach, admin, proof-intake, final-review, and offline routes
  with live launch still blocked
- `/admin` route smoke now mirrors the Goal 146 mobile visual checks with Goal
  147 mobile-review metadata, including reviewer actor email, 390px viewport,
  target signal, pass signal, and still-blocked launch boundary
- `/admin/design-qa` now includes the Goal 148 accessibility smoke plan for
  skip links, focus order, screen-reader headings, restricted states, disabled
  proof controls, offline recovery copy, and non-color-only status cues
- `/admin/design-qa` now includes the Goal 149 device/PWA smoke matrix for
  iPhone Safari, Android Chrome, installed PWA, offline recovery, tablet leader
  review, desktop admin review, and staging cross-browser checks
- `/admin` control center shows the master data inventory for fake users, named
  role coverage, chapter scope, and campaign templates with `0` mutation
  controls and `0` external writes
- `/admin/integration-outbox` shows structured integration events, automation
  outbox rows, the Goal 155 live-send preflight checklist, destination safety,
  audit posture, blocked live controls, `0` live sends, `0` external writes, and
  `0` secrets
- `/admin/master-data` shows the same fake users, named roles, chapter scope,
  campaign templates, blocked admin writes, `0` mutation controls, and `0`
  external sends in a focused review route. It also gives reviewers a direct
  handoff into the SOP builder lane so the inventory and workflow tooling stay
  visibly connected.
- `/admin` production operations runbook shows incident triage, auth/access,
  database/RLS, write rollback, proof moderation, integration/outbox recovery,
  mobile PWA, and pilot support playbooks with `launch no`, `0 writes`, `0
  sends`, `0 secrets`, and live evidence still blocked before student launch
- `/admin/operations` shows the same focused production operations runbook for
  incident triage, auth/access recovery, database/RLS recovery, write rollback,
  proof moderation, integration recovery, mobile PWA support, and pilot
  communications with live launch still blocked
- `/offline` shows a mobile PWA recovery shell that does not cache private
  chapter data, submit work, upload proof, update points, nudge members, or send
  external automation
- `/rush-month/leaderboard` shows member points, rank, recognition, chapter
  impact, and next action with `0` points writes, `0` leaderboard mutations, and
  `0` external sends
- `/profile` shows local identity, role/chapter or staff scope, next safe
  action, future profile events, and `0` profile writes, `0` membership writes,
  `0` role writes, and `0` external sends
- `/onboarding` shows the future sign-in, profile creation, chapter join,
  membership approval, chapter role assignment, coach assignment, and staff role
  assignment sequence with `0` live auth, `0` production users, `0` onboarding
  writes, and `0` external sends; Admin, DS Admin, and Super Admin also see the
  Goal 157 production auth preflight while the student path stays simple
- `/rush-month/evidence` shows the next proof item, submission queue, Goal 152
  proof prep checklist, Goal 158 proof submission packet, story prompt, review
  lane, proof status, future structured records, and blocked
  upload/public-sharing posture with `0` proof metadata saves, `0` uploads,
  `0` public publishes, `0` reminders, `0` exports, and `0` AI summaries
- `/proof-library/upload` shows file requirements, consent/context checks, the
  Goal 159 proof storage intake packet, future private bucket/path, moderation
  queue, disabled outbox posture, and locked upload controls with `0` signed
  upload URLs, `0` storage writes, `0` public proof URLs, `0` exports, and `0`
  AI summaries
- `/rush-month/events/event-rush-social-001` shows one event owner, student
  action, NPS prompt, proof prompt, readiness checks, future structured events,
  and disabled Luma/outbox rows with `0` Luma writes, `0` attendance imports,
  `0` proof uploads, and `0` external sends
- `/rush-month/events` shows the member event list, expected student actions,
  feedback/NPS prompts, proof prompts, proof-intake handoff, disabled
  Luma/outbox posture, and the attend-reflect-share bridge with `0` attendance
  imports, `0` NPS reminders, `0` proof uploads, `0` public proof shares, `0`
  exports, `0` AI summaries, and `0` external sends
- `/campaigns` shows the seven required non-Rush starter campaign shells with
  `7/7` present, `0` missing, `0 writes`, and `0 sends`
- `/campaigns/planning-goal-setting` shows five Planning / Goal Setting phases
  with owner roles, KPI signals, structured events, proof prompts, closeout
  checks, `0 writes`, and `0 sends`
- `/campaigns/chapter-engagement` shows five Chapter Engagement phases with
  owner roles, KPI signals, structured events, proof prompts, closeout checks,
  `0 writes`, and `0 sends`
- `/campaigns/slt-promotion` shows five SLT Promotion phases with owner roles,
  KPI signals, structured events, proof prompts, closeout checks, `0 writes`,
  and `0 sends`
- `/campaigns/moving-mountains` shows five Moving Mountains phases with owner
  roles, KPI signals, structured events, proof prompts, closeout checks,
  `0 writes`, and `0 sends`
- `/campaigns/leadership-transition` shows five Leadership Transition phases
  with owner roles, KPI signals, structured events, proof prompts, closeout
  checks, `0 writes`, and `0 sends`
- `/campaigns/grow-the-movement` shows five Grow the Movement phases with
  owner roles, KPI signals, structured events, proof prompts, closeout checks,
  `0 writes`, and `0 sends`
- `/campaigns/start-a-chapter` shows five Start a Chapter phases with owner
  roles, KPI signals, structured events, proof prompts, closeout checks,
  `0 writes`, and `0 sends`
- member routes focus on student actions and recognition
- leader routes focus on follow-up and readiness
- `/rush-month/dashboard` distinguishes President/VP approval work from E-Board
  owner/event execution when previewing `leader.a@mymedlife.test` and
  `eboard.a@mymedlife.test`
- `/rush-month/actions` distinguishes President/VP assignment guardrails from
  E-Board owner/event follow-up for the same leader personas
- `/rush-month/review` distinguishes President/VP proof accountability from
  E-Board proof follow-up while showing disabled Approve, Request changes, and
  Reject posture, the Goal 153 leader proof review rubric, disabled leader proof
  decision result states, and HQ sharing decisions as HQ-only
- Goal 116 adds the local-only leader proof decision server action on
  `/rush-month/review`; it stays disabled by default and only opens with local
  Supabase Auth plus `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true` and
  `MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE=true`
- `/chapter/members` distinguishes President/VP role coverage from E-Board
  member follow-up and shows the Goal 160 membership approval packet plus Goal
  161 membership result states plus Goal 162 write readiness while keeping
  membership rows, role writes, welcome messages, CRM syncs, and external sends
  disabled
- `/admin/assignment-write` shows President/VP approval guardrails, E-Board
  owner handoff, and Action Committee Chair coordination before any assignment
  write opens
- `/admin/write-sequence` and `/admin/staff-dry-run` show the responsible role,
  review prompt, and safety boundary for each guarded local write step
- `/admin` summarizes the same guarded-write responsibility model for
  non-technical review before deeper packet inspection
- `/admin` audit review keeps browser writes, external sends, and secrets at
  `0`
- `/admin` system health keeps live launch blocked until production health
  checks have owners and evidence
- `/admin` production operations runbook keeps live launch blocked until
  incident, rollback, backup, integration recovery, and day-one support owners
  are named
- `/coach` shows portfolio, the Goal 154 intervention checklist, support notes,
  risk, and decision posture with `0` writes and `0` sends
- production leader proof decisions, leader result-state saves, member nudges,
  direct points/KPI browser writes, and HQ sharing writes remain disabled
- DS Admin stays focused on outbox/integration safety
- DS Admin can review the database security decision without getting a stack
  switch, production auth, or live data connection
- proof is described as testimonial/bridge-video material for HQ sharing review

## Fail Signals

Pause review if you see:

- a production login prompt
- a save button that claims to write real data
- proof upload controls that appear enabled
- leader proof approve/request/reject controls that appear enabled without local
  Supabase Auth and the explicit Goal 116 local write flags
- leader proof result-state controls that appear to save points, KPI movement, or nudges
- leader proof SQL/RLS evidence being presented as production browser-write approval
- public proof publishing controls that appear enabled
- HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI sends that appear enabled
- offline mode showing stale private chapter/member data or claiming to submit
  work while disconnected
- DS Admin seeing student/member truth instead of outbox safety posture
- DS Admin seeing row-level chapter/member audit details
- a database vendor change presented as approved without DS/security sign-off,
  migration plan, and replacement permission tests

## Next Approval Boundary

The next major approval should be explicit.

Do not enable live auth, browser writes, uploads, public proof publishing,
external integrations, or a database-vendor change until Nick/team approve the
next implementation goal.
