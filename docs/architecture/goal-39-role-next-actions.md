# Goal 39: Role Next-Action Guidance

## Purpose

Goal 39 adds one reusable, read-only priority layer that tells each local actor
what matters next in plain English.

This keeps the MVP easier to review:

- members see the next student action and proof prompt
- chapter leaders see whether to clear proof follow-up or assign the next owner
- coaches see the current advance / hold / intervene posture
- admins see HQ proof-sharing review posture
- DS admins see disabled integration/outbox posture only
- super admins see full local oversight before any write activation approval

## What Changed

- `src/services/role-next-actions.ts` centralizes the role-specific guidance.
- `src/components/role-next-action-panel.tsx` renders the guidance as a
  reusable mobile-first panel.
- `/`, `/chapter`, and `/rush-month` now show the same role-aware priority
  model.
- `tests/role-next-actions.test.ts` covers each local actor role.

## Safety Boundary

This is guidance only. It does not:

- enable production Supabase
- enable live auth
- create browser sessions
- save assignments, proof, coach decisions, or HQ decisions
- upload files
- publish proof
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

DS Admin remains limited to integration/outbox posture and does not receive
student truth, proof content, points, KPIs, or chapter operating data.

## Future Use

When real auth and write activation are approved, this service can remain the
plain-English routing layer while server actions and RLS enforce the real
permission model.
