# Figma To Route Map

Last updated: 2026-07-07

Figma/exported code is the fixed visual contract. App work should adapt routing, auth, role guards, data, and safe disabled states underneath the exported shells. It should not redesign the shells.

## Source Families

| Source family | Known source | Route family | Current app target | Status |
| --- | --- | --- | --- | --- |
| Role-based login | `docs/figma-code/raw/login/App.tsx` and role login export notes | `/login` | `src/app/login/page.tsx`, `src/components/login-form.tsx` | Needs visual review but real auth is preserved. |
| General Student App | `docs/figma-code/raw/member-app/App.tsx` | `/app`, `/app/events`, `/app/points`, `/profile`, `/app/stories` | `src/components/figma-member-mobile-home.tsx`, member route pages | Preserved. |
| Member event flow | Member app export event screens | `/app/events`, `/app/events/[eventId]` | Member event pages | Active route-backed flow, not full live provider integration. |
| Member points | Member app export points screen | `/app/points` | App points page | Active route-backed readback. |
| Member Stories | Member app export Stories screen | `/app/stories`, `/proof-library` | Member Stories/proof components | Preview/read-only. |
| Student Leadership Command Center | `docs/figma-code/raw/student-leadership/App.tsx` | `/leader?view=*` | `src/components/figma-leader-command-center.tsx` and support screens | Preserved. |
| Staff Command Center | `docs/figma-code/raw/staff-command-center/App.tsx` | `/staff?view=*` | `src/components/figma-staff-command-center.tsx` | Preserved. |
| Staff/Admin panel | Staff export admin screens, redacted admin shell | `/staff?view=admin`, `/admin`, `/admin/*` | `src/components/figma-admin-panel.tsx`, admin pages | Needs ongoing visual review; PR #394 improves route-backed shell views. |
| SLT Prep | Desktop source folder referenced by planning docs; standalone bundle not in redacted raw archive | `/app/slt-prep`, `/slt-prep/*` | SLT route pages/components | Preview/Test-labeled; PR #395 improves handoff. |

## Contract Rules

- If a Figma source exists, the route should render the exported structure with only app-specific adaptations.
- If exact source is missing, show an explicit blocked/missing-source or preview posture rather than pretending parity.
- Do not reuse the Chapter page under unrelated menu labels.
- Do not rename labels as a substitute for route wiring.
- Do not leave copied Figma controls silently doing nothing. Wire, hide, disable, block, or label them.
- Screenshots are acceptance checks; exported code/source maps are stronger source evidence.

## Current Drift Watch

| Area | Drift risk | What #6 should watch |
| --- | --- | --- |
| `/admin` | Route-backed state and direct-vs-embedded Staff Admin shell behavior. | PR #394 refresh and merge. Confirm DS Admin menu remains dark/vertical and blocked where needed. |
| `/app/slt-prep` | Traveler preview visibility could be mistaken for launch lane. | PR #395 refresh and merge. Confirm TEST labels and outside-invite-gate wording remain. |
| `/leader` provider-looking controls | Some leader screens have live-looking HubSpot/resource actions. | Keep provider actions blocked unless a separate approved integration PR exists. |
| `/staff` proof/SOP/best-practice controls | Staff shell can look operational even when it is preview-only. | Confirm review/share/export/send actions are blocked or preview-only. |
| `/proof-library/upload` | Upload/storage/consent surfaces can look real. | Keep storage, publishing, and production-evidence claims blocked. |

## Existing Source Maps To Reuse

- `docs/figma-code-contract.md`
- `docs/figma-shell-contract-map.md`
- `docs/figma-route-audit.md`
- `docs/route-to-figma-page-map.md`
- `docs/figma-member-mobile-app-button-map.md`
- `docs/figma-leader-command-center-button-map.md`
- `docs/figma-staff-command-center-button-map.md`
- `docs/figma-admin-panel-button-map.md`
