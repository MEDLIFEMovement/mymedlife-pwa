# Staff / DS Admin Shell Acceptance Packet

Date: 2026-07-08  
Owner lane: myMEDLIFE #5, planning/docs only  
Builder owner: `#3` Staff / DS Admin Command Center  
Purpose: source-backed acceptance packet for staff/admin implementation slices.

## Sources To Use First

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/delivery-backlog.md`, especially `BL-021` through `BL-031`
- `docs/user-stories/shell-delivery-map-and-acceptance-checklist.md`
- `docs/staff-command-center-control-honesty-acceptance-checklist.md`
- `docs/staff-remaining-controls-acceptance-checklist.md`
- `docs/admin-backend-remaining-controls-acceptance-checklist.md`
- `docs/renato-admin-demo-pr-acceptance-checklist.md`
- `docs/proof-evidence-ugc-visible-controls-acceptance-checklist.md`
- Source routes/components named by the story package: `/staff?view=*`,
  `/staff?view=admin`, `/admin`, `figma-staff-command-center`, and
  `figma-admin-panel`.

## Source-Backed Menu And Screen Inventory

Staff/Admin surfaces that should remain visible where source-backed:

- `/staff?view=chapters`
- `/staff?view=campaigns`
- `/staff?view=proof_ugc`
- `/staff?view=best_practices`
- `/staff?view=sops`
- `/staff?view=admin`
- `/admin`
- Admin menu families: Overview, Users, Chapters, Modules, Luma Events, Points,
  Integrations, Audit Logs, System Health, API Keys, MCP Connections, Settings,
  and disabled modules where source-backed.

## What Must Remain Visible Even If Unfinished

- Staff top nav and chapter portfolio.
- Chapter detail drawer and support/intervention cues.
- Campaigns, Proof / UGC, Best Practices, and Campaign SOPs.
- Embedded Admin handoff and Command Center/back affordance.
- Dark DS Admin shell and menu family.
- Admin review surfaces for users, chapters, access, audit, integrations,
  system health, launch gate, API keys, and MCP posture.

Unfinished controls should be route-backed, read-only, disabled, blocked, or
preview-only. Missing live behavior should be named honestly, not hidden behind
fake success states.

## TEST Label Requirements

Visible fake or sandbox staff/admin content must include `TEST`:

- staff/admin users
- chapter rows and school names
- portfolio metrics
- proof/UGC cards and review actors
- campaign instances and SOP/sample content
- audit actors and admin-change rows
- provider placeholders, API examples, and fake metrics
- placeholder owners

Keep real product/provider/menu labels clean: MEDLIFE, myMEDLIFE, Luma,
HubSpot, Hootsuite, Smile.io, n8n, Events, Points, MCP Connections, API Keys,
roles, and menu labels should not be prefixed.

## What Counts As Scope/UI Progress

- Source-faithful staff top nav and chapter portfolio walkthrough.
- Chapter drawer, embedded Admin, and Chapters loop coherence.
- Dark DS Admin shell/menu fidelity.
- Visible blocked/preview-only posture for staff/admin controls.
- Focused staff/admin route/control tests and no-write smoke selectors.

## What Does Not Count As Rollout Readiness

- Staff/Admin shell visibility, screenshots, TEST rows, local actor proof, or
  no-write smoke.
- Staff portfolio rows without real production portfolio data.
- Admin users/chapters/access rows without owner-approved data and live readback.
- Provider/API/MCP panels without approved contracts and proof.
- Launch-gate UI without owner CSVs, live counts, signed-in proof, pilot proof,
  audit/outbox zero-send proof, and explicit approval.

## Next Safest Slice Sequence

1. `BL-022`: staff chapter drawer / embedded Admin / Chapters loop coherence.
2. `BL-024`: staff Proof / UGC visible-control follow-through.
3. `BL-026`: embedded Staff Admin handoff and Command Center back-affordance
   parity.
4. `BL-027`: DS Admin dark shell/menu final parity.
5. `BL-028`: Integrations / API Keys / MCP blocked-state clarity.
6. `BL-029`: System Health + Audit Logs read-only clarity.

## Reviewer Acceptance Checks

- Staff top nav and dark Admin menu families stay source-backed and visible.
- Chapter drawer and embedded Admin handoff are clear, readable, and reversible.
- Survey, intervention, export, provider, API, MCP, user/role/chapter, launch
  gate, and audit/outbox actions are blocked, read-only, or preview-only.
- Visible fake data includes `TEST`.
- The PR stays in staff/admin-owned files and tests unless Coordinator approved
  a shared helper change.

## Common Drift Warnings

- Treating `#3` as rollout packet, owner CSV, invite-gate, or production proof
  owner. In the current shell model, `#3` owns Staff / DS Admin shell continuity.
- Hiding source-backed menu families because live operations are unfinished.
- Making API keys, MCP, provider sync, system health, audit/outbox, survey send,
  proof moderation, or user/role/chapter mutations sound live.
- Letting staff chapter drawer or embedded Admin copy read like a generic panel
  instead of a source-backed staff/admin walkthrough.
- Mixing member or leader files into a staff/admin PR.

## Matrix Language

Landed and smoked staff/admin shell work may support modest `Scope/UI` and
`QA/Ops` movement for affected staff/admin rows. It does not move `Data/Auth`,
`Writes/Integrations`, or `Rollout Gate` without separate real evidence.
