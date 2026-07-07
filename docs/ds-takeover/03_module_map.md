# Module Map

Last updated: 2026-07-07

This map uses the same five-column readiness shape as the coordinator matrix:
Scope/UI, Data/Auth, Writes/Integrations, QA/Ops, and Rollout Gate.

Percentages are directional and intentionally conservative. A high UI score does not mean production-ready.

## Launch-Critical Modules

| Module | Scope/UI | Data/Auth | Writes/Integrations | QA/Ops | Rollout Gate | DS summary |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Login and secure account flow | 80% | 55% | 30% | 70% | 25% | Single login exists; secure callback/set-password flow landed, but real DS admin invite proof and production account proof remain incomplete. |
| General Member App | 88% | 50% | 25% | 75% | 30% | Figma mobile shell is strong. Events/points are visible. Production user/data proof is still missing. |
| Events and RSVP | 70% | 45% | 25% | 65% | 30% | Local/mock-safe event and RSVP paths exist. Real Luma writeback and production pilot proof are not approved. |
| QR/check-in and attendance | 60% | 40% | 20% | 60% | 25% | Check-in/attendance posture is visible in launch flows, but production attendance import/proof remains missing. |
| Points and leaderboards | 70% | 45% | 20% | 65% | 25% | Points/leaderboard readbacks exist. Production points ledger materialization is not approved. |
| Student Leadership Command Center | 94% | 45% | 20% | 84% | 30% | Figma shell is source-faithful and improving. It is not fully real-data or write-ready. |
| Staff Command Center | 94% | 45% | 20% | 90% | 30% | Staff shell is strong and recently fixed. Staff preview must stay read-only. |
| DS Admin / Super Admin backend | 85% | 50% | 30% | 70% | 30% | Admin shell, user/chapter/access surfaces, audit/outbox/Luma review exist. PR #394 may improve route-backed shell fidelity. |

## Visible But Not Launch-Critical

| Module | Scope/UI | Data/Auth | Writes/Integrations | QA/Ops | Rollout Gate | DS summary |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| SLT Prep | 65% | 30% | 10% | 45% | 0% | Traveler surfaces exist and active PR #395 improves handoff. It is outside the current 30-chapter launch gate. |
| Proof / UGC / Stories | 70% | 35% | 10% | 55% | 0% | Preview/read-only surfaces exist. Upload, consent, publishing, social/provider sync, and production evidence use are blocked. |
| Campaigns / Rush Month | 65% | 35% | 15% | 55% | 0% | Campaign surfaces exist, but the launch lane is the simple event loop. |
| SOP / workflow rollout | 50% | 20% | 5% | 35% | 0% | SOP builder and planning artifacts exist. Full SOP rollout is future work and must not be implemented by #6. |
| Coach portfolio / intervention | 55% | 35% | 10% | 45% | 0% | Read-only staff/coach safety contracts exist. Live intervention authority is not approved. |
| Notifications / communications | 55% | 35% | 5% | 50% | 0% | Many controls were corrected to preview-only/no-send. Live sends remain blocked. |
| Analytics / warehouse reporting | 35% | 25% | 0% | 30% | 0% | Request templates exist. Warehouse is future read-only/downstream support, not app truth. |
| HubSpot / CRM | 30% | 20% | 0% | 25% | 0% | Read-only/static export planning exists. No HubSpot implementation or writes are approved. |
| MCP / provider console | 35% | 20% | 0% | 25% | 0% | Visible blocked review surface only. Do not implement MCP from this lane. |

## What Makes A Module "Real"

A module should not be called production-ready until it has all of these:

- Clear Figma/source ownership or an explicit missing-source placeholder.
- Role guard tied to real session/account data.
- Data source documented as production, sandbox, Test, fixture, or preview.
- No silent dead critical controls.
- Writes either implemented through approved audited paths or visibly blocked.
- Focused tests and route smoke.
- Production signed-in proof if it is part of rollout.
- Human rollout owner approval if it can affect invites, students, providers, points, or communications.

## DS Ownership Candidates

Small, safe DS ownership slices:

1. Admin users/chapters/access route review after PR #394 lands.
2. Production data proof checklist review: counts, route proof, owner rows, audit/outbox.
3. Test-data exclusion rules for production evidence.
4. Luma read-only mapping request review after 30-chapter packet approval.
5. Secure DS admin account invite process, using password-set links only.
