# Goal 121: Read-Only Profile Route

Goal 121 adds `/profile` as a first-class local review route.

## Why

The Figma direction includes Profile as a first-viewport mobile destination, and
the MVP needs a clear place to verify identity, role scope, chapter scope, and
the next safe action before production auth/onboarding is approved.

## Route

- `/profile`

## What The Route Shows

- selected local actor name and email
- identity source and auth-session status
- chapter role or staff role
- chapter scope or coach portfolio scope
- role-aware next safe action
- future profile/onboarding structured events
- zero expected profile, membership, role, and external writes

## Role Boundary

- Members see their own chapter role and chapter scope.
- Action Committee roles see their local member/leader scope through the same
  profile route.
- Coaches see portfolio scope.
- Admin and Super Admin see staff/support scope.
- DS Admin sees integration posture only and no student/chapter truth.

## Safety Boundary

This route does not:

- save profile edits
- create join requests
- approve roles
- change memberships
- change coach assignments
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI automation

Production profile and role truth must later use approved Supabase Auth,
membership/RLS policies, server-side write paths, and audit records.

## Files

- `src/app/profile/page.tsx`
- `src/services/profile-workspace.ts`
- `tests/profile-workspace.test.ts`
