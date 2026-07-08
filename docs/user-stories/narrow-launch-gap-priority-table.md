# myMEDLIFE Narrow Launch Gap Priority Table

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: plain-English priority list of the remaining launch gaps, separated by
what can move soon through shell/QA work versus what requires real production
evidence.

## Top 10 Rollout-Critical Gaps

| Rank | Gap | Current truth | Owner lane | Next proof needed | Can move soon? | Needs real rollout proof? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Owner-returned CSVs and validation | blocked | Rollout Evidence / Coordinator | Real owner-returned rows, required fields, validation notes | no | yes |
| 2 | Production rollout packet | blocked | Rollout Evidence / Coordinator | Packet assembled from approved real owner data only | no | yes |
| 3 | Production live counts | blocked | Rollout Evidence / Coordinator | Timestamped live count readback from approved source | no | yes |
| 4 | Production signed-in route proof by role | staged / not captured | Rollout Evidence + Data/Safety | Real member, leader, staff/support, and DS/admin accounts proving expected routes | maybe readiness tooling only | yes |
| 5 | Pilot event proof | blocked | Rollout Evidence / Coordinator | Real pilot event evidence for RSVP, attendance, and points | no | yes |
| 6 | Audit/outbox zero-send proof | blocked | Rollout Evidence + Data/Safety | Real pilot audit/outbox evidence showing no unauthorized sends/writes | maybe safety contract only | yes |
| 7 | Member event-to-points continuity | partial / preview-only | `#1` | Source-backed UI plus focused tests/smoke | yes: `Scope/UI`, `QA/Ops` | yes for final launch |
| 8 | Leader shell/menu continuity | partial / active | `#2` | `/leader?view=*` route/menu restoration, focused tests/smoke | yes: `Scope/UI`, `QA/Ops` | yes for final launch |
| 9 | Staff/Admin review walkthrough coherence | partial / active | `#3` | Staff drawer, embedded Admin, Proof/UGC, admin menu handoffs, focused tests/smoke | yes: `Scope/UI`, `QA/Ops` | yes for final launch |
| 10 | Final Coordinator/Nick invite-gate approval | blocked | Coordinator / Nick | All required real evidence present and explicitly approved | no | yes |

## What Can Move Percentages Soon

These items can plausibly move modest percentages after real PRs land and pass
checks:

- `#1` member event/detail/RSVP-check-in/points continuity: `Scope/UI`,
  possibly `QA/Ops`.
- `#1` member home/profile or Stories source-fidelity cleanups: `Scope/UI`,
  possibly `QA/Ops`.
- `#2` leader `/leader?view=*` service-backed menu/view restoration:
  `Scope/UI`, possibly `QA/Ops`.
- `#2` leader succession/support/member-profile handoff honesty: `Scope/UI`,
  possibly `QA/Ops`.
- `#3` staff chapter drawer / embedded Admin / Chapters loop coherence:
  `Scope/UI`, possibly `QA/Ops`.
- `#3` staff Proof/UGC and DS Admin blocked-control clarity: `Scope/UI`,
  possibly `QA/Ops`.
- `#4` focused browser smoke, mobile QA, and visual TEST-label review:
  `QA/Ops` only.

## What Cannot Move Without Real Proof

These should not move from planning, screenshots, shell PRs, public no-write
smoke, TEST rows, local actors, sandbox data, or Figma data:

- Owner CSV readiness.
- Production rollout packet readiness.
- Production live-count readiness.
- Production signed-in proof by role.
- Pilot RSVP/attendance/points proof.
- Audit/outbox zero-send production proof.
- HubSpot, Luma, Hootsuite, Smile.io, n8n, BigQuery/Databricks, or other
  provider readiness.
- Final invite-gate approval.

## Access Needed Later

No new access is needed for the next shell/UI/QA planning slices.

Access or real data is needed later for:

- Owner-returned CSVs: ask Nick/team only when the intake path is ready to
  validate real rows.
- Supabase/myMEDLIFE production proof: ask only when DS/admin approve real
  signed-in route proof and live counts.
- Luma static export or read-only mapping: ask only when pilot event proof needs
  source comparison.
- HubSpot static export or read-only fallback: ask only if contact/coach/chapter
  truth cannot be validated from owner-returned data.
- Provider/API write access: do not request for the narrow shell backlog; it
  belongs to a separate approved Writes/Integrations activation lane.

## TEST-Label Gate

Before anything is shown as production-visible, every fake/sandbox/Figma-derived
person, chapter, event, story/proof row, campaign, SOP/sample item, placeholder
owner, fake audit actor, provider example, and fake metric must either:

1. keep visible `TEST`,
2. be replaced with approved real data, or
3. be hidden from student/leader/staff/admin production views.

Removing `TEST` by itself does not increase readiness. Replacing TEST content
with approved real data plus source/proof may support `Data/Auth`, `QA/Ops`, or
`Rollout Gate` movement depending on the evidence.

## Coordinator Shortcut

If a PR is shell-only, ask: did it improve source-backed UI/route/control
honesty without implying real writes?

If yes, it may help `Scope/UI` and maybe `QA/Ops`.

If the PR does not include real data, real accounts, live counts, pilot proof,
audit/outbox evidence, or final approval, it does not help `Rollout Gate`.
