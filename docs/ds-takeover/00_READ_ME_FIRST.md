# DS Takeover Read Me First

Last updated: 2026-07-07

This folder is the Data Solutions takeover map for myMEDLIFE. It is meant to help DS understand what exists, what is real, what is still a shell, and what should be owned next without interrupting the active build lanes.

## Bottom Line

The app is not fully production-ready. The current narrow launch lane is still Events, RSVP, QR/check-in, Attendance, Points, simple leaderboards, and role-based workspaces. Figma-coded shells are visible and improving, but production rollout still needs real owner data, signed-in proof, pilot event-loop proof, and final human approval.

## Hard Rules For This Lane

- Do not redesign the UI. Figma/exported code remains the visual contract.
- Do not start broad feature work from this folder.
- Do not rewrite the app or collapse the role shells.
- Do not implement HubSpot, full SOP rollout, MCP, n8n, warehouse, or provider automation from this lane.
- Do not treat sandbox, Test, Figma, local, smoke, or preview proof as production rollout proof.
- Do not email passwords. Use secure invite or password-set links for accounts, plus a separate plain-English instruction email.

## Coordination Status Snapshot

- Source repo: `MEDLIFEMovement/mymedlife-pwa`
- Docs branch for this packet: `codex/ds-takeover-docs`
- Current `main` reviewed: `9bbfc8a` (`Add leader impact bridge feed honesty`, PR #393)
- Active draft PRs to watch:
  - PR #394: DS Admin route-backed shell views. Green checks, still behind `main` when checked.
  - PR #395: member SLT handoff. Green checks, still behind `main` when checked.
- Source coordinator thread: `myMEDLIFE Coordinator`
- This thread role: `myMEDLIFE #6 - DS Takeover + Live Build Coordination`

## DS Update Rule

Meaningful handbacks should be sendable to:

- To: `DS@medlifemovement.org`
- Cc: `nellis@medlifemovement.org`, `regoavil@medlifemovement.org`

Suggested subject format:

`myMEDLIFE DS takeover update - <short status> - 2026-07-07`

Suggested body shape:

1. What changed since the last update.
2. What is landed vs only in draft PRs.
3. What DS can safely trust today.
4. What remains blocked.
5. The next smallest human-owned PRs or review actions.

## Files In This Folder

- `01_current_state_inventory.md`: live repo, PR, thread, and readiness inventory.
- `02_route_map.md`: route-by-route ownership and guard posture.
- `03_module_map.md`: module readiness by UI, data/auth, writes/integrations, QA/ops, and rollout gate.
- `04_figma_to_route_map.md`: Figma/exported-source contract mapped to routes.
- `05_functionality_wiring_map.md`: what visible controls actually do.
- `06_data_model_and_seed_map.md`: Supabase, seed, Test-data, and production-evidence boundaries.
- `07_integrations_map.md`: external systems and what stays out of launch.
- `08_live_build_status.md`: active PR/thread status to refresh during coordination.

## First DS Reading Path

Start with this file, then read:

1. `01_current_state_inventory.md`
2. `72_LAUNCH_PROOF_OPERATOR_PACKET.md`
3. `73_PROOF_ARTIFACT_RECEIPT_PACKET.md`
4. `74_ROLLOUT_PROOF_REQUEST_AND_INTAKE_KIT.md`
5. `75_ROLLOUT_EVIDENCE_IMPORT_VALIDATION_PACKET.md`
6. `03_module_map.md`
7. `05_functionality_wiring_map.md`
8. `06_data_model_and_seed_map.md`
9. `08_live_build_status.md`

Use the other maps when someone asks, "Where is this route?", "Which Figma screen owns this?", or "Can this button safely write data?"
