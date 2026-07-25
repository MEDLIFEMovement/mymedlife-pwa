# Staff / DS Admin Restoration Work Packet

Date: 2026-07-08
Builder owner: `#3` Staff / DS Admin Command Center
Owner lane: myMEDLIFE #5, planning/docs only

## Best Next Work Packet

Restore staff/admin walkthrough depth: staff top nav, chapter drawer, Proof/UGC
review queue, embedded Admin return loop, and the dark DS Admin menu family.
Keep every provider/admin/proof action visibly honest and blocked where no real
write path exists.

## Evidence Base

- Repo routes: `/staff?view=*`, `/staff?view=admin`, `/admin`, and admin
  subroutes for review-path, chapters, users, access, system health, audit log,
  launch gate, integration outbox, Luma integration, operations, and phase 2.
- Staff source shell: `src/components/figma-staff-command-center.tsx`.
- Admin source shell: `src/components/figma-admin-panel.tsx`.
- Repo route gates: `src/app/staff/page.tsx` and `src/app/admin/page.tsx`.
- Exported app source:
  `/Users/codex/Desktop/myMEDLIFE App Prototype/src/app/App.tsx` includes
  staff/admin sketches, integrations, events, points, leader, and student
  workflows.

## What "Looks Like The Figma" Means

### Staff Command Center

The staff top nav family should remain visible:

- Chapters,
- Campaigns,
- Proof / UGC,
- Best Practices,
- Campaign SOPs,
- Admin.

Chapter drawer/detail flows should preserve portfolio context, risk/support
cues, NPS/survey preview, and embedded Admin handoff copy. The known
top-right alert/profile collision should remain a demo-quality acceptance
check, not permission to redesign the shell.

### Embedded Admin / DS Admin

The dark Admin shell should preserve:

- Overview,
- Users,
- Chapters,
- Modules,
- Luma Events,
- Points,
- Integrations,
- Audit Logs,
- System Health,
- API Keys,
- MCP Connections,
- Settings,
- disabled modules list.

The Command Center/back affordance should make it clear when the reviewer is in
embedded Admin versus the staff shell.

## Smallest Safe Implementation Slices

1. **Staff/Admin loop coherence:** chapter drawer -> embedded Admin -> Chapters
   readback -> return to staff context.
2. **Proof/UGC review handoff:** proof card -> review panel -> embedded Admin
   audit handoff -> return to Proof/UGC.
3. **Admin blocked-control parity:** Integrations, API Keys, MCP Connections,
   Audit Logs, System Health, Settings, and launch-gate controls should be
   route-backed/read-only/blocked/preview-only.
4. **Renato-facing demo polish:** staff top nav, dark Admin menu, Command Center
   back affordance, and top-right header clearance should be visually safe to
   click through.

## Likely File Families

- `src/app/staff/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/review-path/page.tsx`
- `src/app/admin/chapters/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/system-health/page.tsx`
- `src/app/admin/audit-log/page.tsx`
- `src/app/admin/integration-outbox/page.tsx`
- `src/app/admin/integrations/luma/page.tsx`
- `src/app/admin/launch-gate/page.tsx`
- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`
- focused staff/admin route/component tests

## Do Not Touch

- `/app`, `/leader`
- owner CSVs or rollout packets
- invite gate advancement
- production proof rows, live counts, signed-in production proof
- provider/API live writes or secret reveal/copy/rotate/revoke
- MCP live connects
- proof approval, consent approval, publishing, or social sync
- audit mutation, user/role/chapter production writes

## Acceptance Checks

- Staff top nav and dark Admin menu families remain source-backed and visible.
- Chapter drawer, embedded Admin, and return/back affordances are clear.
- Proof/UGC review surfaces show next-step clarity without implying live
  moderation, publishing, or evidence approval.
- API/MCP/integration/system-health/audit/launch-gate controls are blocked,
  read-only, disabled, or preview-only.
- Visible fake staff/admin/chapter/proof/audit/provider/fake metric content
  includes `TEST`.
- Focused staff/admin tests or browser checks cover changed route families.

## Visible UI Versus Repo Truth

The staff/admin shell is intentionally demo-rich. Repo truth still does not
prove production staff portfolio data, real proof moderation, provider sync,
API-key readiness, MCP readiness, owner-truth application, launch-gate approval,
or rollout evidence. Those remain outside #3's shell lane.

## Matrix Limits

Can move: `Scope/UI`, possibly `QA/Ops` if tested/smoked.

Cannot move: `Data/Auth`, `Writes/Integrations`, `Rollout Gate`.
