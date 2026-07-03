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
and launch campaigns.

## Who Owns Each File

| File | Owner | Plain-English Purpose |
| --- | --- | --- |
| `chapters.csv` | Nick / HQ launch owner | Which 30 chapters are in the first rollout |
| `users.csv` | HQ launch owner + DS | Every person who needs production access |
| `memberships.csv` | HQ launch owner | Which chapter each student or leader belongs to |
| `staff-roles.csv` | DS / HQ launch owner | Which staff/admin users can support launch |
| `coach-assignments.csv` | Sales/coaching owner | Which coach owns each chapter |
| `campaigns.csv` | HQ launch owner | Which launch campaign each chapter starts with |

## Minimum Ready Packet

The first production rollout packet must include:

- 30 active chapters.
- At least one approved chapter leader for every active chapter.
- At least one approved member for every active chapter.
- One active coach assignment for every active chapter.
- One active launch campaign for every active chapter.
- At least one active `admin` staff role for day-one support.
- At least one active `ds_admin` or `super_admin` for launch controls.
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
- Every active chapter should include at least one approved member so the
  student feed and chapter leaderboard are not empty on day one.
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

## Build And Validate

After the CSV files are filled with real data:

```bash
pnpm rollout:build \
  --chapters rollout-csv/chapters.csv \
  --users rollout-csv/users.csv \
  --memberships rollout-csv/memberships.csv \
  --staff-roles rollout-csv/staff-roles.csv \
  --coach-assignments rollout-csv/coach-assignments.csv \
  --campaigns rollout-csv/campaigns.csv \
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
- The combined launch check only passes after GoDaddy DNS is fixed.
- Nick approves the 30 chapters.
- DS approves the user and role apply path.
- The production apply owner is named.
- External writes remain off: HubSpot, Luma writes, n8n, warehouse, Power BI,
  SMS, email, and AI actions.

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
