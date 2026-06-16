# Goal 84: Action Committee Role Personas

## Purpose

Goal 84 closes a role-coverage gap in the local MVP review build. The final MVP
requires General Member, Action Committee Member, Action Committee Chair,
E-Board, President / VP, Coach, Admin, and Super Admin coverage. The app already
had broad member, leader, coach, admin, DS admin, and super admin audiences, but
Action Committee Member and Action Committee Chair were not separate local
personas.

## What It Adds

- `committee.member@mymedlife.test` as a fake Action Committee Member.
- `committee.chair@mymedlife.test` as a fake Action Committee Chair.
- Matching fake local Supabase Auth users and profile/membership seed rows.
- Local sign-in suggestions for both committee personas.
- Admin role coverage that shows every named MVP role and the fake local actor
  that previews it.
- Tests proving committee members keep member-lane visibility and committee
  chairs use chapter-leader visibility.

## Permission Posture

This goal does not create a new production permission model.

For the current local review build:

- Action Committee Member maps to the `chapter_member` audience.
- Action Committee Chair maps to the `chapter_leader` audience.
- E-Board Member and President / VP continue to map to `chapter_leader`.
- Coach, Admin, DS Admin, and Super Admin keep their existing staff boundaries.

This keeps the app readable and testable while avoiding premature role-write
complexity.

## Safety Boundary

This goal does not:

- enable production auth
- enable browser write controls
- create production users
- enable role or membership writes
- upload proof files
- publish proof publicly
- invite pilot students
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

All new users are fake local review users.

## How Staff Should Use It

Use either `MYMEDLIFE_LOCAL_ACTOR_EMAIL` or local Supabase Auth sign-in to
preview the new roles:

```text
committee.member@mymedlife.test
committee.chair@mymedlife.test
```

The password for local Supabase seed users remains:

```text
password
```

Open `/admin` to confirm the named MVP role coverage panel shows all required
roles as ready for local read-only review.

## Next Step

The next useful slice is to make the action committee event-planning surface
more useful for the committee member and committee chair personas without
turning on production writes or external Luma automation.
