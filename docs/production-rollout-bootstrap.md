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
  ]
}
```

## Readiness Rules

The packet is not ready until all of these are true:

- At least 30 active chapters exist.
- Every active chapter has at least one approved chapter leader.
- Every active chapter has one active coach assignment.
- Every active chapter has one active launch campaign.
- Every coach assignment points to a user with an active `coach` staff role.
- At least one active `admin` staff role exists for day-one support.
- At least one active `ds_admin` or `super_admin` role exists for launch
  controls.
- No fake/test emails are present.
- No password, token, API key, or secret fields are present.
- Every membership, coach assignment, and campaign references a known user or
  chapter.

The validator lives in:

- `src/services/production-rollout-bootstrap.ts`
- `tests/production-rollout-bootstrap.test.ts`

## Safe Production Sequence

1. Prepare the packet from real chapter and staff data.
2. Run the readiness validator locally.
3. Have Nick, DS, and the launch owner review the packet.
4. Create Supabase Auth users through an approved invite/admin flow.
5. Insert matching `app.profiles`, `app.chapters`, `app.memberships`,
   `app.staff_role_assignments`, `app.coach_chapter_assignments`, and
   `app.campaigns`.
6. Verify signed-in routing for `/app`, `/leader`, and `/staff`.
7. Only then invite the first production rollout group.

## Still Blocked

Production rollout is still blocked until:

- GoDaddy DNS points `mymedlife.org` and `www.mymedlife.org` to Vercel.
- The production packet is filled with real data.
- Production users are invited or created through the approved auth path.
- Signed-in route verification passes with real roles.
