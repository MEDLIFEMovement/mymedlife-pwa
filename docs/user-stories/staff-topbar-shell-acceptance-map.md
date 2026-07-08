# Staff Topbar Shell Acceptance Map

Date: 2026-07-08  
Owner lane: `#3` Staff / DS Admin Command Center Builder  
Planning status: docs/spec only; no product code changed here.

## Purpose

Give `#3`, `#4`, and Coordinator a narrow acceptance target for staff topbar
spacing, alert-pill behavior, account-chip clearance, and source-backed Staff /
DS Admin shell continuity.

The goal is demo-quality shell fidelity, not a redesign. The known top-right
alert/header overlap issue is an acceptance check: fix the collision while
preserving the source-backed staff top nav, dark header feel, and embedded Admin
handoff posture.

## Sources Inspected

Repo implementation truth:

- `src/components/figma-staff-command-center.tsx`
- `tests/staff-page.test.tsx`
- `tests/staff-command-center.test.ts`
- `docs/user-stories/staff-admin-shell-acceptance-packet.md`
- `docs/user-stories/staff-admin-review-queue-acceptance-packet.md`
- `docs/user-stories/staff-admin-acceptance-contradictions-map.md`
- `docs/user-stories/current-shell-wave-sequencing.md`

Visible acceptance context:

- user-provided staff screenshot issue around the top-right intervention pill /
  profile-chip collision, used only as an acceptance check
- exported/source-backed staff command center shape represented by the current
  `figma-staff-command-center` implementation

## Current Repo Truth

- `src/components/figma-staff-command-center.tsx` owns the Staff Command Center
  shell and embedded Admin handoff behavior.
- The topbar has source-backed staff branding: `myMEDLIFE` plus `Staff Command
  Center`.
- The top nav includes source-backed families: `Chapters`, `Campaigns`,
  `Proof / UGC`, `Best Practices`, `Campaign SOPs`, and `Admin`.
- The implementation already reserves account-chip clearance with
  `STAFF_HEADER_ACCOUNT_CLEARANCE`.
- The right-side alert pill is intentionally constrained with
  `STAFF_HEADER_ALERT_VISIBILITY`.
- Embedded Admin remains gated and preview-safe; Staff users should not receive
  live admin write authority from this shell.
- None of this proves live staff interventions, provider writes, admin writes,
  proof moderation approval, owner data, or rollout readiness.

## Required Visual Contract

The Staff shell should preserve:

- dark topbar with myMEDLIFE mark and `Staff Command Center` label
- visible source-backed staff nav family on desktop where space allows
- active nav state that clearly matches the route/view
- top-right alert/intervention pill as a demo/readback cue where it can fit
- account/profile chip clearance; no collision with the workspace account area
- page header below the dark topbar with title and status copy
- embedded Admin handoff that still feels connected to the Staff Command Center
- dark DS Admin shell/menu fidelity when Admin preview opens

## Source-Faithful Versus Merely Workable

Source-faithful:

- preserve the dark topbar and Staff Command Center label
- preserve the staff nav labels and order unless a source-backed route is
  intentionally hidden at a breakpoint
- preserve Admin as a visible staff nav/handoff surface where source-backed
- preserve preview-safe alert/status cue language
- preserve account-chip clearance on the topbar and page header

Acceptable launch adaptation:

- hide the alert pill below medium width if it would collide
- truncate alert copy before it overlaps the account chip
- reserve extra right padding for the account chip at larger breakpoints
- reduce nav gap/padding only enough to prevent overlap, without removing menu
  families from desktop

Not acceptable:

- alert pill overlaps the account/profile chip
- account chip covers staff nav or page title text
- desktop staff nav loses source-backed menu families without explanation
- topbar turns into a generic white admin header
- Admin handoff disappears or reads like live admin access for all staff
- a blocked/preview-only control starts implying real intervention, proof,
  provider, role, or admin writes

## Required Honesty Rules

Controls and copy must stay honest:

- intervention alerts are readback/preview cues, not live task creation
- chapter drawer actions are preview-safe unless a separate write path exists
- Proof / UGC review controls do not approve, publish, upload, or sync proof
- Admin handoff is gated to DS Admin / Super Admin preview posture
- API keys, MCP Connections, integrations, system health, audit logs, users,
  roles, chapters, and settings controls do not mutate production
- provider names stay clean; fake rows, fake actors, placeholder owners, sample
  audit events, fake chapters, and sample proof/UGC items visibly include `TEST`

Clean-label exceptions:

- `MEDLIFE`, `myMEDLIFE`, `Staff Command Center`, `DS Admin`, `Super Admin`,
  `Admin`, `Proof / UGC`, `Best Practices`, `Campaign SOPs`, `HubSpot`, `Luma`,
  `Hootsuite`, `Smile.io`, `n8n`, `BigQuery`, `Databricks`, and menu labels.

## Smallest Useful #3 Slice

Smallest acceptable implementation scope:

- Fix the staff topbar/header overlap without changing unrelated staff/admin
  screens.
- Keep the staff nav family visible and source-backed.
- Preserve or improve account-chip clearance in both the dark topbar and page
  header.
- Add or update focused tests only for the affected shell/topbar behavior if
  useful.

Likely files in scope:

- `src/components/figma-staff-command-center.tsx`
- `tests/staff-page.test.tsx`
- `tests/staff-command-center.test.ts`

Files and lanes out of scope:

- `/app` member shell files
- `/leader` shell files
- auth/session helpers, role/RLS services, provider services
- rollout packets, owner CSVs, live counts, production signed-in proof
- broad DS Admin settings/provider rewrites outside the topbar or blocked-state
  handoff slice

## Reviewer Acceptance Checks

Suggested `#4` or Coordinator review:

- Open `/staff?view=chapters`, `/staff?view=ugc`,
  `/staff?view=best-practices`, `/staff?view=sops`, and
  `/staff?view=admin`.
- Confirm the dark topbar still shows myMEDLIFE plus `Staff Command Center`.
- Confirm desktop nav still exposes `Chapters`, `Campaigns`, `Proof / UGC`,
  `Best Practices`, `Campaign SOPs`, and `Admin`.
- Confirm the alert/intervention pill never collides with the account/profile
  chip; it may hide or truncate before collision.
- Confirm page header title/status text has enough right-side clearance.
- Confirm embedded Admin preview still has clear blocked/read-only posture.
- Confirm visible fake actors, chapters, audit examples, proof/UGC examples,
  and placeholder content are `TEST` labeled.
- Confirm no copy implies real staff intervention writes, proof approval,
  provider sync, user/role/chapter writes, audit mutation, or rollout proof.

## What Counts As Real Progress

Real progress from this slice:

- Staff/Admin `Scope/UI` progress for source-backed shell fidelity
- possible `QA/Ops` progress if focused tests or browser review cover the
  no-overlap contract
- better demo confidence for Renato-facing Staff/Admin walkthroughs

Not progress from this slice:

- Data/Auth readiness
- Writes/Integrations readiness
- provider readiness
- production staff/admin proof
- rollout readiness
- owner-return or invite-gate proof

## Matrix Guidance

Planning alone moves nothing.

If implemented and tested cleanly, this can support modest Staff/Admin
`Scope/UI` and maybe `QA/Ops` movement. It must not move Data/Auth,
Writes/Integrations, production proof, provider readiness, or Rollout Gate.
