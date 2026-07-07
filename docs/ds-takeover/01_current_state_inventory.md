# Current State Inventory

Last updated: 2026-07-07

This inventory separates landed product state from active draft work and planning evidence.

## Repo Snapshot

| Item | Current state |
| --- | --- |
| Repository | `MEDLIFEMovement/mymedlife-pwa` |
| Reviewed branch | `main` |
| Reviewed commit | `9bbfc8a` |
| Local DS docs branch | `codex/ds-takeover-docs` |
| App stack | Next.js, React, Supabase, Vitest, Playwright, Vercel |
| Package scripts | `dev`, `build`, `lint`, `typecheck`, `test`, `e2e`, `supabase:test`, production/rollout check scripts |
| Local shell note | `node` was not on PATH in this thread; use the bundled Codex runtime if checks are needed. |

## Active PRs To Watch

| PR | Status at review | Why DS should care | Risk |
| --- | --- | --- | --- |
| #394 - DS Admin route-backed shell views | Draft, checks green, `BEHIND` | Makes DS Admin sidebar views URL-backed while preserving the dark DS Admin shell and blocked/preview posture. | Touches admin shell and staff embedded admin exit routing. Refresh before merge. |
| #395 - member SLT handoff | Draft, checks green, `BEHIND` | Restores a route-backed SLT Prep handoff from the general member home for traveler preview users and keeps content TEST-labeled. | Touches member shell and SLT prep pages. Refresh before merge. |

Other open PRs include dependency bumps and older/stale parked branches such as PR #181 and PR #125. Treat those as separate governance or dependency work, not current launch-lane ownership.

## Active Builder Lanes

| Thread | Current ownership | Current posture |
| --- | --- | --- |
| #1 General Member App | `/app`, member mobile shell, member Stories/Profile/SLT handoffs | Active via PR #395. |
| #2 Student Leadership | `/leader` command center and leader shell honesty | Latest landed PR #393 on `main`; next slice pending. |
| #3 Staff / DS Admin | `/staff`, `/admin`, DS Admin shell/menu fidelity | Active via PR #394. |
| #4 Release / QA Watch | PR checks, deploy watch, public smoke, screenshot QA | Read-only support lane. |
| #5 Figma / Product Planning | Source maps and builder packets | Planning artifacts only; planning does not move production readiness. |
| #6 DS Takeover | Documentation, inventory, handoff, conflict warnings | Docs-only coordination lane. |

## Plain-English Readiness

| Area | Current estimate | Meaning |
| --- | ---: | --- |
| Core launch lane | 55-60% | The narrow app loop is visible and increasingly clickable, but still lacks production proof. |
| 30-chapter / 500-student rollout | 45% | Tooling and packets are strong, but real owner-returned data, live counts, signed-in proof, and pilot proof are missing. |
| Full myMEDLIFE product | 35-40% | Many shells and safety contracts exist; many broader modules are preview-only, blocked, or not wired to real production operations. |

## Landed Realities DS Can Trust

- `main` has a Figma-derived role shell family for member, leader, staff, and admin routes.
- The launch-lane route family exists for login, member app, member events, event detail, points, leader, staff, admin, and Luma/admin review surfaces.
- Many risky controls have been changed from fake-live behavior into blocked, preview-only, local-only, or read-only behavior.
- Supabase migrations exist for the core app schema, RLS tests, admin access management RPCs, membership, proof, event updates, and write-gated areas.
- Test/Figma seed policy exists and requires fake visible records to be clearly marked as Test data.

## Not Production Proof Yet

- Real 30-chapter rollout packet approval.
- Returned owner CSVs and validated owner data.
- Production live data count proof.
- Real signed-in route proof for production users.
- Hosted five-chapter RSVP, attendance, points, audit, and zero-send pilot proof.
- Live provider writes for Luma, HubSpot, n8n, warehouse, email, SMS, or social systems.
- Final human invite approval.

## Main Existing Docs To Reuse

- `docs/figma-code-contract.md`
- `docs/figma-shell-contract-map.md`
- `docs/route-to-page-map.md`
- `docs/route-to-figma-page-map.md`
- `docs/functionality-map.md`
- `docs/production-functionality-wiring-audit.md`
- `docs/integration-readiness-map.md`
- `docs/test-data-seed-map.md`
- `docs/production-readiness-plain-english-glossary.md`

## Next Small Human-Owned PRs

1. Refresh and merge PR #394 only after it is up to date with `main`.
2. Refresh and merge PR #395 only after it is up to date with `main`.
3. Add or update one route-backed admin/menu doc after #394 lands.
4. Add or update one member/SLT route doc after #395 lands.
5. Keep DS takeover docs refreshed after each landed shell PR without mixing in feature work.
