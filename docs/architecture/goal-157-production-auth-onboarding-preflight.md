# Goal 157: Production Auth Onboarding Preflight

Goal 157 extends `/onboarding` with a staff-only production auth preflight for
Admin, DS Admin, and Super Admin reviewers.

The student-facing onboarding path stays simple: future sign-in, profile,
chapter join, membership approval, role assignment, coach assignment, and staff
role assignment are still shown as disabled sequence steps. Staff reviewers get
the extra launch checklist needed before any real user is invited.

## What Changed

- `src/services/auth-onboarding-workspace.ts`
- `src/app/onboarding/page.tsx`
- `tests/auth-onboarding-workspace.test.ts`
- `src/services/mvp-coverage-checklist.ts`
- `src/services/mvp-progress-map.ts`
- `src/services/mvp-release-readiness.ts`
- `src/services/production-launch-gate.ts`
- `src/services/route-smoke-manifest.ts`
- `src/services/stakeholder-review-plan.ts`
- `docs/review/local-mvp-review-guide.md`
- `docs/supabase-local-development.md`

## Checklist Items

- Approve auth callback URLs.
- Confirm every launch role has a local reviewer actor.
- Map each auth user to one app profile and chapter or staff scope.
- Keep chapter join approval explicit.
- Separate chapter role assignment from signup.
- Confirm coach portfolio assignment.
- Lock staff role assignment.
- Preserve event, audit, and outbox boundaries.
- Name the support and rollback owner.

## Safety Boundary

The route does not enable production Supabase Auth, create production users,
save profiles, submit join requests, approve memberships, assign chapter roles,
assign coaches, assign staff roles, send onboarding automations, enable browser
writes, or send external automation.

The preflight counts stay conservative: `0` production users, `0` browser
writes, and `0` external sends.

## Review Path

Open `/onboarding` as `admin@mymedlife.test`, `ds.admin@mymedlife.test`, or
`super.admin@mymedlife.test`.

The page should show the production auth preflight checklist, counts for ready /
watch / blocked items, locked controls, route evidence, `0` browser writes, `0`
external sends, and `0` production users.

Before live approval, Nick, engineering, DS/security, and HQ operations still
need to approve callback URLs, auth/profile mapping, role assignment ownership,
coach scope, staff role assignment, audit/outbox behavior, and rollback support.
