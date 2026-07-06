# Launch-Lane Auth Readiness

This document is the auth/data guardrail companion to the current launch-lane
routes. It does not change any shell UI. It only names what each route is
allowed to prove today.

## Current rule

- Local sandbox Test accounts and preview-mode review can exercise launch-lane
  routes safely.
- Those local/sandbox checks do **not** count as production rollout evidence.
- Production signed-in proof still requires real production accounts, approved
  packet inputs, and owner-reviewed rows.

## Route posture

The repo source of truth lives in `src/services/launch-lane-auth-readiness.ts`.

- `/login`: shared public sign-in surface. Local sandbox review is useful, but
  real production sign-in proof is still required.
- `/app`, `/app/stories`, `/app/events`, `/app/events/[eventId]`,
  `/app/points`: member-owned routes. Member accounts own them; staff/admin
  review remains local preview or sandbox-only and must stay out of rollout
  evidence.
- `/leader?view=overview`: leader-owned route. Preview review is allowed
  locally; production leader proof still needs a real signed-in leader account.
- `/staff?view=chapters`: staff-owned route. Local sandbox proof is useful, but
  rollout evidence still needs a real signed-in staff or coach account.
- `/admin` plus core review routes such as `/admin/users`, `/admin/chapters`,
  `/admin/access`, `/admin/launch-gate`, `/admin/audit-log`,
  `/admin/integration-outbox`, `/admin/integrations/luma`, and
  `/admin/pilot-scope`: admin-owned review surfaces. Sandbox review stays
  read-only and cannot satisfy the real production gate.

## Current member stories posture

- `/app/stories` is now a live member launch-lane route on current main.
- It should be treated like the other member-owned, signed-in, read-only review
  routes in this manifest.
- Local sandbox and preview review are still not production rollout evidence.

## Review use

Use this document and the matching test coverage when we need to answer:

- Which launch-lane routes are role-owned?
- Which ones are safe only for local sandbox or preview review?
- Which ones still require real production signed-in proof?
- Which routes are live now, but still must not be oversold as production proof?
