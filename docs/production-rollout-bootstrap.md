# Production Rollout Bootstrap

This document describes the minimum real data packet needed before myMEDLIFE can
be verified for a 30-chapter production rollout.

Do not copy `supabase/seed.sql` into production. That file is fake local test
data. Production needs real invited users, real chapters, real roles, and no
passwords or API keys in the import packet.

## Current Production State

As of July 3, 2026, production Supabase has the app schema and RLS enabled, but
the live data tables are empty:

- `auth.users`: 0
- `app.profiles`: 0
- `app.chapters`: 0
- `app.memberships`: 0
- `app.staff_role_assignments`: 0
- `app.campaigns`: 0
- `app.assignments`: 0
- `app.points_events`: 0
- `app.audit_logs`: 0

This means the app is deployed, but signed-in role verification cannot be
completed until production users and app records exist.

## Required Packet

Prepare one reviewed packet with these sections:

```json
{
  "chapters": [
    {
      "id": "chapter-ucla",
      "name": "UCLA MEDLIFE",
      "campus": "UCLA",
      "region": "West",
      "status": "active"
    }
  ],
  "users": [
    {
      "email": "leader.name@medlifemovement.org",
      "displayName": "Leader Name"
    }
  ],
  "memberships": [
    {
      "email": "leader.name@medlifemovement.org",
      "chapterId": "chapter-ucla",
      "roleKey": "president_vp",
      "status": "approved"
    }
  ],
  "staffRoles": [
    {
      "email": "coach.name@medlifemovement.org",
      "roleKey": "coach",
      "status": "active"
    }
  ],
  "coachAssignments": [
    {
      "coachEmail": "coach.name@medlifemovement.org",
      "chapterId": "chapter-ucla",
      "coachType": "portfolio",
      "status": "active"
    }
  ],
  "campaigns": [
    {
      "chapterId": "chapter-ucla",
      "name": "Rush Month",
      "slug": "rush-month-ucla",
      "status": "active"
    }
  ],
  "lumaCalendars": [
    {
      "chapterId": "chapter-ucla",
      "calendarId": "cal_abc123",
      "calendarName": "UCLA MEDLIFE",
      "status": "linked"
    }
  ],
  "pilotEventProof": [
    {
      "chapterId": "chapter-ucla",
      "eventName": "Rush Month Kickoff",
      "lumaEventId": "evt_abc123",
      "rsvpCount": 12,
      "attendanceCount": 10,
      "pointsAwardedCount": 10,
      "auditEvidence": "recorded",
      "outboxStatus": "zero_sends",
      "status": "ready"
    }
  ],
  "launchOwners": [
    {
      "email": "owner.name@medlifemovement.org",
      "ownerType": "support",
      "displayName": "Owner Name",
      "status": "active"
    }
  ]
}
```

Teams can start from blank CSV templates:

```bash
pnpm rollout:templates --out rollout-csv
```

For the plain-English data request, owner map, and review checklist, use
`docs/production-rollout-data-collection.md`.

Then fill those files with real MEDLIFE data and build the JSON packet:

```bash
pnpm rollout:check-csv --dir rollout-csv

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

Expected CSV headers:

- `chapters.csv`: `id,name,campus,region,status`
- `users.csv`: `email,displayName`
- `memberships.csv`: `email,chapterId,roleKey,status`
- `staff-roles.csv`: `email,roleKey,status`
- `coach-assignments.csv`: `coachEmail,chapterId,coachType,status`
- `campaigns.csv`: `chapterId,name,slug,status`
- `luma-calendars.csv`: `chapterId,calendarId,calendarName,status`
- `pilot-event-proof.csv`:
  `chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status`
- `launch-owners.csv`: `email,ownerType,displayName,status`

`region` and `status` are optional where listed. Do not add password, token,
API key, secret, or extra helper columns; unsupported columns are rejected.

Allowed values:

- Membership `roleKey`: `general_member`, `action_committee_member`,
  `action_committee_chair`, `e_board_member`, `president_vp`
- Staff `roleKey`: `coach`, `admin`, `ds_admin`, `super_admin`
- Coach assignment `coachType`: `expansion`, `portfolio`
- Chapter `status`: `active`, `inactive`, `archived`
- Membership `status`: `requested`, `approved`, `rejected`, `inactive`
- Staff and coach assignment `status`: `active`, `inactive`, `ended`
- Campaign `status`: `draft`, `active`, `complete`, `archived`
- Luma calendar `status`: `linked`, `needs_setup`, `inactive`
- Pilot proof `auditEvidence`: `recorded`, `missing`
- Pilot proof `outboxStatus`: `zero_sends`, `sends_detected`, `not_checked`
- Pilot proof `status`: `ready`, `needs_review`, `blocked`
- Launch owner `ownerType`: `production_apply`, `support`, `rollback`,
  `launch_decision`
- Launch owner `status`: `active`, `backup`, `inactive`

## Readiness Rules

The packet is not ready until all of these are true:

- At least 30 active chapters exist.
- At least 500 approved student/leader users exist across those chapters.
- Every active chapter has at least one approved chapter leader.
- Every active chapter has at least one approved `general_member` or
  `action_committee_member` for student-app access.
- Every active chapter has one active coach assignment.
- Every active chapter has one active launch campaign.
- Every active chapter has one linked Luma calendar mapping.
- At least 5 pilot chapters have ready event-loop proof for RSVP, attendance,
  points, audit, and zero external sends.
- Every coach assignment points to a user with an active `coach` staff role.
- At least one active `admin` staff role exists for day-one support.
- At least one active `ds_admin` or `super_admin` role exists for launch
  controls.
- At least one active `coach`, `admin`, or `super_admin` can access the staff
  command center.
- Active support, rollback, and production apply owners exist.
- No fake/test emails are present.
- No password, token, API key, or secret fields are present.
- Every membership, coach assignment, campaign, Luma calendar mapping, pilot
  proof row, and launch owner references a known user or chapter.

The validator lives in:

- `src/services/production-rollout-bootstrap.ts`
- `tests/production-rollout-bootstrap.test.ts`

Run it before any production import:

```bash
pnpm rollout:check path/to/production-rollout-packet.json
```

The command prints the packet counts, blockers, warnings, and next steps. It
exits with a failure code when the packet is not ready, so it can also be used
in a review checklist or CI job.

After the packet passes, create a review-only handoff for the human apply step:

```bash
pnpm rollout:handoff path/to/production-rollout-packet.json \
  --out production-rollout-handoff.md
```

This report lists the Supabase Auth users, chapter rows, approved memberships,
staff roles, coach assignments, launch campaigns, Luma calendar mappings, pilot
proof rows, launch owners, and safety rules that a human reviewer needs before
applying production data. It does not create Auth users, write app rows, upload
files, touch DNS, change Vercel settings, or enable external integrations.

## Production Domain Check

Vercel already has these aliases attached to the `mymedlife-pwa` project:

- `mymedlife.org`
- `www.mymedlife.org`
- `mymedlife-pwa.vercel.app`

GoDaddy DNS must stop serving parking records before the public domain can be
considered live. As of July 3, 2026, `pnpm production:domain
https://www.mymedlife.org` verifies that the public domain is serving the
myMEDLIFE app.

If the GoDaddy lander returns, remove parking records like:

```text
A     @     15.197.148.33
A     @     3.33.130.190
```

The currently verified working records are:

```text
A     @     216.150.1.1
CNAME www   mymedlife.org
```

After DNS is saved and has time to propagate, verify Vercel and the public login
page:

```bash
pnpm dlx vercel@latest domains verify mymedlife.org \
  --scope team_Ckuej4U0KGPbI7v9TtfElAMP --non-interactive

pnpm dlx vercel@latest domains verify www.mymedlife.org \
  --scope team_Ckuej4U0KGPbI7v9TtfElAMP --non-interactive

pnpm production:domain https://www.mymedlife.org
```

The public domain is not ready until the domain check says `READY` and confirms
that `/login` serves the myMEDLIFE app copy instead of the GoDaddy lander.

## Combined Launch Check

Use the combined read-only launch check when preparing a final go/no-go update:

```bash
pnpm production:launch-check \
  --app-url https://mymedlife-pwa.vercel.app \
  --public-url https://www.mymedlife.org \
  --packet production-rollout-packet.json
```

This command checks all of the following in one report:

- the deployed Vercel app routes for `/login`, `/app`, `/leader`, `/staff`, and
  `/admin`
- the public production domain DNS and login page
- the 30-chapter rollout packet readiness
- the review-only rollout handoff posture

It is read-only. It does not create users, write Supabase rows, change DNS,
change Vercel settings, upload files, or enable integrations.

## Production Live Data Count Check

After the reviewed packet is applied by the approved production owner, verify the
live Supabase launch tables with:

```bash
pnpm production:data-counts
```

This command uses the linked Supabase production project and only returns
aggregate counts. It does not show user names or emails, create rows, apply
migrations, change Auth, change RLS, upload files, or enable integrations.

The count check is not a replacement for the rollout packet validator. It proves
that production has enough table volume for launch, while the packet validator
still proves row-by-row ownership: which user belongs to which chapter, which
coach owns each chapter, and which campaign each chapter starts with.

## Production Route Smoke Check

After each production deployment, verify the five core public routes:

```bash
pnpm production:smoke https://mymedlife-pwa.vercel.app
```

This checks that:

- `/login` returns the myMEDLIFE login page.
- `/app` redirects unauthenticated users to login with the student feed return
  path preserved.
- `/leader` redirects unauthenticated users to login with the student command
  center return path preserved.
- `/staff` redirects unauthenticated users to login with the staff command
  center return path preserved.
- `/admin` redirects unauthenticated users to login with the admin backend
  return path preserved.

Once DNS is attached, run the same check against:

```bash
pnpm production:smoke https://www.mymedlife.org
```

## Safe Production Sequence

1. Prepare the packet from real chapter and staff data.
2. Run the readiness validator locally.
3. Have Nick, DS, and the launch owner review the packet.
4. Create Supabase Auth users through an approved invite/admin flow.
5. Insert matching `app.profiles`, `app.chapters`, `app.memberships`,
   `app.staff_role_assignments`, `app.coach_chapter_assignments`, and
   `app.campaigns`.
6. Verify signed-in routing for `/app`, `/leader`, `/staff`, and `/admin`.
7. Only then invite the first production rollout group.

## Still Blocked

Production rollout is still blocked until:

- GoDaddy DNS points `mymedlife.org` and `www.mymedlife.org` to Vercel.
- The production packet is filled with real data.
- Production users are invited or created through the approved auth path.
- Signed-in route verification passes with real roles.
