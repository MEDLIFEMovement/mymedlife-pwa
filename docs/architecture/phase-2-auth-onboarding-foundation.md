# MED-473 Phase 2 Auth And Onboarding Foundation

Date: 2026-06-19

## Goal

Turn the auth and onboarding plan into a concrete routing, ownership, duplicate
handling, and rollback packet before any real users, profiles, or memberships
are written.

## Identity Source Of Truth

- Supabase Auth identity is the sign-in source of truth.
- App profile, chapter membership, and app role rows decide what the user can
  see after sign-in.
- Signup alone does not grant chapter access.

## Route Outcomes

- Member: `/`
- Chapter leader / E-board: `/chapter`
- Coach: `/coach`
- Staff: `/staff`
- Admin: `/admin`
- DS Admin: `/admin/phase-2`
- Super Admin: `/admin`

## Profile Rules

- One auth user maps to exactly one app profile.
- Duplicate profile matches must not auto-merge silently.
- Chapter join requests are separate from membership approval.
- Authorization must not depend on user-editable metadata.
- Server actor context must come from auth identity plus app-owned roles.

## Ownership Decisions

- Student can request to join a chapter for self only.
- President / VP approves membership for own chapter only.
- President / VP assigns chapter-scoped roles.
- Admin or Super Admin assigns coach portfolio scope.
- Super Admin assigns Admin, DS Admin, and Super Admin roles.
- Kiomi / DS should own auth configuration and rollback execution.
- Nick should own launch go/no-go and pilot communications.

## Callback Route

- App callback route: `/auth/callback`

This route exists to finish the auth redirect flow inside the app. It is still a
foundation artifact until live environments and hosted keys are approved.

## Blocked Live Actions

Do not do the following from this issue alone:

- enable production auth
- create real production users
- save hosted profiles
- save hosted join requests
- approve hosted memberships
- route users from preview cookies instead of validated auth identity
