# Goal 122: Auth Onboarding Readiness Route

Goal 122 adds `/onboarding` as a first-class local review route for the future
auth and onboarding path.

## Route

- `/onboarding`

## What It Shows

- future Supabase sign-in
- profile creation
- chapter join request
- membership approval
- chapter role assignment
- coach assignment
- staff role assignment
- owner role for each step
- future structured event type for each step
- disabled browser/write posture
- staff-only production auth preflight for Admin, DS Admin, and Super Admin

## Safety Boundary

This route does not:

- enable production Supabase Auth
- create production users
- save profile data
- submit chapter join requests
- approve memberships
- assign chapter roles
- assign coaches
- assign staff roles
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI automation

All future onboarding events render as disabled internal events. Outbox rows stay
empty.

Goal 157 extends this same route with a production auth preflight for callback
URLs, role coverage, auth/profile mapping, join approval, chapter role
assignment, coach scope, staff role assignment, audit/outbox posture, and
rollback ownership. The preflight is visible only to Admin, DS Admin, and Super
Admin reviewers and still keeps production users, onboarding writes, browser
writes, external sends, and onboarding automations disabled.

## Why This Matters

The app already has profile and local sign-in groundwork, but production users
still need an explicit security review before launch. This route lets Nick,
engineering, and DS/security inspect the end-to-end onboarding sequence before
any real auth, membership, role, coach, or staff writes are approved.

## Implementation

- `src/app/onboarding/page.tsx`
- `src/services/auth-onboarding-workspace.ts`
- `tests/auth-onboarding-workspace.test.ts`

Related route/review surfaces now include `/onboarding` in the route registry,
route smoke manifest, live-data connection order, stakeholder review plan, MVP
coverage checklist, MVP progress map, release readiness summary, and production
launch gate. Goal 157 adds the staff production auth preflight to those same
review surfaces.
