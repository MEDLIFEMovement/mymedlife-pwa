# Production Rollout Data Collection

This is the human handoff for the first 30-chapter myMEDLIFE production rollout.
It explains the real data needed before production users can be created and the
launch check can pass.

The CSV templates can be generated with:

```bash
pnpm rollout:templates --out rollout-csv
pnpm rollout:workbook --out production-rollout-workbook.md --csv-dir rollout-csv
```

The current local working copy is:

```text
.codex-artifacts/production-rollout-csv/
```

Once the CSVs are filled, the safe review order is:

```bash
pnpm rollout:intake-status --dir rollout-csv
pnpm rollout:chapter-matrix --dir rollout-csv --out production-rollout-chapter-matrix.md
pnpm rollout:check-csv --dir rollout-csv
pnpm rollout:build ... --out production-rollout-packet.json
pnpm rollout:check production-rollout-packet.json
pnpm rollout:gaps production-rollout-packet.json --out production-rollout-gaps.md
pnpm rollout:handoff production-rollout-packet.json --out production-rollout-handoff.md
pnpm rollout:apply-plan production-rollout-packet.json --out production-rollout-apply-plan.md
```

The apply plan is still read-only. It tells DS/platform which production Auth
users and app rows need to be created, which UUIDs must be resolved after Auth
users exist, and which safety checks stay blocked before broad invitations.
It does not create accounts, write rows, send invitations, change Vercel, or
turn on integrations.

The chapter matrix is also read-only. It gives a row-by-row view of which
chapter still lacks a member, student leader, coach, launch campaign, Luma
calendar, pilot proof, or signed-in proof. It does not show invitee email lists.

Do not put passwords, API keys, tokens, secrets, or private notes in these
files. This packet is only for launch users, chapters, roles, coach coverage,
launch campaigns, Luma calendar mappings, pilot proof, and launch ownership.

## Who Owns Each File

| File | Owner | Plain-English Purpose |
| --- | --- | --- |
| `chapters.csv` | Nick / HQ launch owner | Which 30 chapters are in the first rollout |
| `users.csv` | HQ launch owner + DS | Every person who needs production access |
| `memberships.csv` | HQ launch owner | Which chapter each student or leader belongs to |
| `staff-roles.csv` | DS / HQ launch owner | Which staff/admin users can support launch |
| `coach-assignments.csv` | Sales/coaching owner | Which coach owns each chapter |
| `campaigns.csv` | HQ launch owner | Which launch campaign each chapter starts with |
| `luma-calendars.csv` | DS / Luma owner | Which Luma calendar belongs to each launch chapter |
| `pilot-event-proof.csv` | Launch owner + DS | Which 5 pilot chapters have proven RSVP, attendance, points, audit, and zero-send posture |
| `launch-owners.csv` | Nick / HQ launch owner | Who owns production apply, support, rollback, and launch decisions |
| `signed-in-route-proof.csv` | Launch owner + DS | Which real production accounts proved member, leader, staff, and admin routing |

## Minimum Ready Packet

The first production rollout packet must include:

- 30 active chapters.
- At least 500 approved student/leader users across those chapters.
- At least one approved chapter leader for every active chapter.
- At least one approved `general_member` or `action_committee_member` for every
  active chapter so the student app can be tested with a true member account.
- One active coach assignment for every active chapter.
- One active launch campaign for every active chapter.
- One linked Luma calendar mapping for every active chapter.
- At least 5 pilot chapters with ready event-loop proof.
- At least one active `admin` staff role for day-one support.
- At least one active `ds_admin` or `super_admin` for launch controls.
- At least one active `coach`, `admin`, or `super_admin` for staff command
  center access.
- Active `support`, `rollback`, and `production_apply` owners.
- Real user emails only.

The signed-in route proof file can stay header-only before production users and
app rows are applied. Before broad invitations, it must include passed evidence
for one real member, one real leader, one real staff/coach user, and one real
DS Admin or Super Admin.

The validator blocks fake/test emails, unknown user references, unknown chapter
references, duplicate user emails, duplicate chapter IDs, and credential-like
fields.

## CSV Fields

### chapters.csv

Headers:

```text
id,name,campus,region,status
```

Rules:

- `id` should be stable and simple, for example `chapter-ucla`.
- This is a review handle. Production `app.chapters.id` is a UUID, so the
  production apply owner must either resolve this handle to a created chapter
  UUID or explicitly replace it with a real UUID before database rows are
  written.
- `name` is the display name, for example `UCLA MEDLIFE`.
- `campus` is the school or chapter campus name.
- `region` is optional but useful for staff filtering.
- `status` should be `active` for first-rollout chapters.

### users.csv

Headers:

```text
email,displayName
```

Rules:

- Include every student leader, member, coach, admin, DS admin, and super admin
  referenced anywhere else in the packet.
- Use real emails only.
- Do not include passwords. Auth users must be created through the approved
  production Supabase invite/admin path.

### memberships.csv

Headers:

```text
email,chapterId,roleKey,status
```

Allowed `roleKey` values:

- `general_member`
- `action_committee_member`
- `action_committee_chair`
- `e_board_member`
- `president_vp`

Rules:

- Every active chapter needs at least one approved leader:
  `action_committee_chair`, `e_board_member`, or `president_vp`.
- Every active chapter needs at least one approved `general_member` or
  `action_committee_member` so the member app can be verified with a real
  student-style account.
- `status` should usually be `approved` for launch users.

### staff-roles.csv

Headers:

```text
email,roleKey,status
```

Allowed `roleKey` values:

- `coach`
- `admin`
- `ds_admin`
- `super_admin`

Rules:

- Every coach in `coach-assignments.csv` must also have an active `coach` row
  here.
- Include at least one active `admin`.
- Include at least one active `ds_admin` or `super_admin`.

### coach-assignments.csv

Headers:

```text
coachEmail,chapterId,coachType,status
```

Allowed `coachType` values:

- `portfolio`
- `expansion`

Rules:

- Every active chapter needs one active coach assignment.
- `coachEmail` must exist in `users.csv`.
- `coachEmail` must also have an active `coach` role in `staff-roles.csv`.
- Production `app.coach_chapter_assignments` also needs a `starts_at` date.
  The apply plan uses the approved apply date unless DS/platform chooses a
  different explicit start date before writing rows.

### campaigns.csv

Headers:

```text
chapterId,name,slug,status
```

Rules:

- Every active chapter needs one active launch campaign.
- For the first rollout, use `Rush Month` unless Nick/HQ chooses a different
  approved launch campaign.
- `slug` should be stable and lowercase, for example `rush-month-ucla`.
- Production `app.campaigns` also needs an objective. The apply plan defaults
  this to the launch event/RSVP/attendance/points/leaderboard loop unless the
  launch owner changes it before apply.

### luma-calendars.csv

Headers:

```text
chapterId,calendarId,calendarName,status
```

Rules:

- Every active chapter needs one linked Luma calendar row.
- `chapterId` must exist in `chapters.csv`.
- `calendarId` is the Luma calendar id, not an API key.
- `status` should be `linked` when the chapter calendar is ready for event
  readback.
- These rows target the saved `chapter_luma_calendars` path when production
  supports it. If that table is not approved in production yet, DS/platform can
  use the approved `MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON` registry as the
  temporary production mapping path.
- Before hosted event proof, run:

  ```bash
  pnpm rollout:luma-mappings --packet production-rollout-packet.json --mapping-json chapter-luma-map.json
  ```

  This compares the rollout packet to the runtime chapter-to-Luma registry. It
  does not call Luma or write data. The registry can also come from the
  `MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON` environment variable when the command
  runs in the configured environment.
- To produce the runtime registry JSON from an approved packet, run:

  ```bash
  pnpm rollout:luma-registry --packet production-rollout-packet.json --out chapter-luma-map.json
  ```

  This writes a local JSON file only after the packet mappings pass readiness.
  It does not apply the value to Vercel. Treat the output as launch
  configuration and apply it only through the approved environment-change path.

### pilot-event-proof.csv

Headers:

```text
chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes
```

Rules:

- At least 5 chapters need `status` set to `ready`.
- A ready row must have at least one RSVP, one attendance check-in, one points
  award, `auditEvidence` set to `recorded`, and `outboxStatus` set to
  `zero_sends`.
- A ready row must include app proof routes for the event, attendance, points,
  audit log, and integration outbox readback.
- `checkedAt` should be the review timestamp.
- `reviewedByEmail` must be a real launch user from `users.csv`.
- This proves the event loop before broad invitations. It does not enable n8n,
  HubSpot, warehouse, Power BI, SMS, email, or AI sends.

### launch-owners.csv

Headers:

```text
email,ownerType,displayName,status
```

Allowed `ownerType` values:

- `production_apply`
- `support`
- `rollback`
- `launch_decision`

Rules:

- Include active `support`, `rollback`, and `production_apply` owners.
- Owner emails must also exist in `users.csv`.
- The `support` owner must have an active `coach`, `admin`, or `super_admin`
  staff role.
- The `rollback` and `production_apply` owners must have active `ds_admin` or
  `super_admin` staff roles.
- After production data is applied, the `support` owner must have passed route
  proof for `/staff?view=chapters`.
- After production data is applied, the `rollback` and `production_apply`
  owners must have passed route proof for `/admin`.
- The `launch_decision` owner is recommended so the final go/no-go owner is
  visible in the packet.

### signed-in-route-proof.csv

Headers:

```text
email,workspace,expectedPath,observedPath,status,checkedAt,notes
```

Allowed `workspace` values:

- `student_app`
- `leader_command_center`
- `staff_command_center`
- `admin_backend`

Allowed `status` values:

- `passed`
- `failed`
- `not_checked`

Rules:

- Add these rows after production users and app rows are applied.
- `student_app` must use a real approved `general_member` or
  `action_committee_member` and should prove `/app`.
- `leader_command_center` must use a real approved chapter leader and should
  prove `/leader?view=overview`.
- `staff_command_center` must use a real coach/staff account and should prove
  `/staff?view=chapters`.
- `admin_backend` must use a real DS Admin or Super Admin and should prove
  `/admin`.
- Do not put passwords, tokens, screenshots, or private notes in this file.
- Use `notes` only for short operational context, for example
  `verified by Nick on phone`.

## Build And Validate

After the CSV files are filled with real data:

```bash
pnpm rollout:check-csv --dir rollout-csv
```

When the CSV folder is ready, build the JSON packet:

```bash
pnpm rollout:build \
  --chapters rollout-csv/chapters.csv \
  --users rollout-csv/users.csv \
  --memberships rollout-csv/memberships.csv \
  --staff-roles rollout-csv/staff-roles.csv \
  --coach-assignments rollout-csv/coach-assignments.csv \
  --campaigns rollout-csv/campaigns.csv \
  --luma-calendars rollout-csv/luma-calendars.csv \
  --pilot-event-proof rollout-csv/pilot-event-proof.csv \
  --launch-owners rollout-csv/launch-owners.csv \
  --signed-in-route-proof rollout-csv/signed-in-route-proof.csv \
  --out production-rollout-packet.json
```

Then run:

```bash
pnpm rollout:check production-rollout-packet.json
pnpm rollout:gaps production-rollout-packet.json --out production-rollout-gaps.md
pnpm rollout:handoff production-rollout-packet.json --out production-rollout-handoff.md
pnpm production:launch-check --packet production-rollout-packet.json
pnpm production:pilot-event-proof --packet production-rollout-packet.json
pnpm production:data-counts > production-live-data-counts.txt
pnpm production:signed-in-route-proof --packet production-rollout-packet.json
pnpm production:invite-batches --packet production-rollout-packet.json
pnpm rollout:approval-summary production-rollout-packet.json --out production-rollout-approval-summary.md
pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt --public-url https://www.mymedlife.org
```

If local Supabase is not linked on the review machine, keep the approved
production database URL in an environment variable and use:

```bash
pnpm production:data-counts --db-url-env SUPABASE_DB_URL > production-live-data-counts.txt
```

Do not paste database URLs, passwords, service keys, or tokens into command
lines, docs, PR comments, or Linear.

## Review Checklist

Before any production data apply, confirm:

- The packet passes `pnpm rollout:check`.
- The packet gap report says `Production rollout packet gaps: READY`.
- The handoff says `READY FOR HUMAN APPLY`.
- The combined launch check still passes the public production domain gate.
- The five-chapter pilot event proof says `5-chapter pilot event loop proof:
  READY`.
- The saved production live-data count proof says `Production live data count check: READY` with at least 30 active chapters, 500 approved memberships, 5 production chapter events, and 5 production Luma event links.
- The signed-in route proof check says `Production signed-in route proof: READY`.
- The invite-batch check says `Production invite batch readiness: READY` and
  batch 1 is the reviewed five-chapter pilot group.
- The redacted approval summary says `30-chapter approval summary: READY FOR
  FINAL GATE REVIEW`.
- The invite gate says `30-chapter invite gate: READY`.
- Nick approves the 30 chapters.
- DS approves the user and role apply path.
- The production apply owner is named.
- The support owner and rollback owner are named.
- The signed-in route proof rows pass for one member, one leader, one staff
  user, one admin, the named support owner, the named rollback and production
  apply owners, and member/leader access for each ready pilot chapter.
- The 5-chapter Luma event loop has proof for RSVP, attendance, points, audit,
  and zero external sends.
- External writes remain off: HubSpot, n8n, warehouse, Power BI, SMS, email,
  and AI actions.
- Luma writes stay limited to the separately approved event, RSVP, and
  attendance/check-in path.

## Production Apply Boundary

This packet does not apply data by itself. It does not:

- create Supabase Auth users
- insert production app rows
- send invitations
- upload files
- change DNS
- change Vercel settings
- enable external integrations

Those steps stay separate and require an approved production apply step.
