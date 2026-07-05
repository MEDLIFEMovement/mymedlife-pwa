# Production Rollout Data Collection

This is the human handoff for the first 30-chapter myMEDLIFE production rollout.
It explains the real data needed before production users can be created and the
launch check can pass.

The CSV templates can be generated with:

```bash
pnpm rollout:templates --out rollout-csv
```

The current local working copy is:

```text
.codex-artifacts/production-rollout-csv/
```

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

### pilot-event-proof.csv

Headers:

```text
chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status
```

Rules:

- At least 5 chapters need `status` set to `ready`.
- A ready row must have at least one RSVP, one attendance check-in, one points
  award, `auditEvidence` set to `recorded`, and `outboxStatus` set to
  `zero_sends`.
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
- The `launch_decision` owner is recommended so the final go/no-go owner is
  visible in the packet.

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
  --out production-rollout-packet.json
```

Then run:

```bash
pnpm rollout:check production-rollout-packet.json
pnpm rollout:handoff production-rollout-packet.json --out production-rollout-handoff.md
pnpm production:launch-check --packet production-rollout-packet.json
```

## Review Checklist

Before any production data apply, confirm:

- The packet passes `pnpm rollout:check`.
- The handoff says `READY FOR HUMAN APPLY`.
- The combined launch check still passes the public production domain gate.
- Nick approves the 30 chapters.
- DS approves the user and role apply path.
- The production apply owner is named.
- The support owner and rollback owner are named.
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
