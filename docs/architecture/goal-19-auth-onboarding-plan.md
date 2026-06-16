# Goal 19 Auth And Onboarding Plan

Status: planning and disabled readiness only.

Goal 19 defines the future auth and onboarding path without enabling live auth,
browser sessions, production users, or role-approval writes.

## Future Flow

1. User signs in through Supabase Auth.
2. App profile is created for the auth user.
3. Student requests to join a chapter.
4. President/VP approves chapter membership.
5. President/VP assigns chapter-scoped roles.
6. Admin/Super Admin assigns coach portfolio relationships.
7. Super Admin assigns staff roles.

Every meaningful step should create a structured app event.

## Source Of Truth

Supabase remains the source of truth for:

- auth user identity
- profile
- chapter join request
- membership approval
- chapter role assignment
- coach portfolio assignment
- staff role assignment

n8n, HubSpot, Luma, warehouse, Power BI, and AI should not own membership or
permission truth.

## Role Boundaries

- Students can request membership for themselves.
- Students cannot approve membership or roles.
- President/VP can approve membership and chapter-scoped roles inside their
  chapter.
- Coaches can read assigned portfolio chapters, but should not approve
  membership truth.
- Admin can support coach assignment and operational review, but should not own
  routine chapter membership approval.
- DS Admin can manage integration infrastructure later, but should not own app
  onboarding truth.
- Super Admin owns staff-role assignment and break-glass oversight.

## What Stays Disabled

- live Supabase auth in the browser
- production users
- browser sessions and cookies
- real join requests
- real membership approvals
- real role assignments
- real external writes

## Implementation Gate

Before live auth implementation, the team should approve:

- sign-in providers
- email domain assumptions
- profile creation flow
- chapter join request UX
- President/VP approval UX
- coach assignment admin UX
- staff role assignment UX
- RLS policy review for every auth/onboarding table
- audit/event requirements
