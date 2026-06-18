# Goal 90: Leader Role Personas

## Purpose

Goal 90 closes the next role-fidelity gap in the local MVP review build. The
final myMEDLIFE MVP names E-Board Member and President / VP as separate chapter
roles. The schema and permissions already model them separately, but the local
preview build used one combined fake leader account.

## What It Adds

- `leader.a@mymedlife.test` now previews President / VP only.
- `eboard.a@mymedlife.test` now previews E-Board Member only.
- Matching fake local Supabase Auth seed user, profile, and membership rows.
- Local sign-in suggestions for the E-Board persona.
- Admin role coverage tests proving E-Board Member and President / VP resolve
  to separate local review accounts.
- Local actor tests proving both roles still map to chapter-leader visibility.

## Permission Posture

This goal does not create a new production permission model.

For the current local review build:

- President / VP maps to the `chapter_leader` audience.
- E-Board Member maps to the `chapter_leader` audience.
- President / VP and E-Board Member use separate fake local users so staff can
  inspect role-specific copy and future behavior without pretending one person
  owns both responsibilities.

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
preview the leader roles:

```text
leader.a@mymedlife.test
eboard.a@mymedlife.test
```

The password for local Supabase seed users remains:

```text
password
```

Open `/admin` to confirm the named MVP role coverage panel shows President / VP
and E-Board Member as separate ready local review roles.

## Follow-On

Goal 91 uses these separated local personas on the Rush Month dashboard so
President / VP approval work and E-Board execution follow-up read differently
without enabling membership writes, assignment saves, reminders, or external
automation.
