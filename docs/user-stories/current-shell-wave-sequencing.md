# Current Shell Wave Sequencing

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: give Coordinator and #4 a current merge-order guide for the active
member, leader, and staff/admin shell wave without turning shell progress into
rollout proof.

## Current Board Truth

Treat these PRs as already in the base:

| PR | Status | Planning meaning |
| --- | --- | --- |
| `#503` | merged | Staff chapter drawer / embedded Admin continuity is now base truth. |
| `#512` | merged | Leader service-backed leadership continuity is now base truth. |
| `#515` | merged | Admin phase 2 Command Center return cue is now base truth. |
| `#517` | merged | Next shell slice briefs are now base planning material. |

Current open wave:

| PR | Status checked | Lane | Sequencing note |
| --- | --- | --- | --- |
| `#520` | approved, non-draft, green, behind-only | `#5` planning | Docs-only story package refresh. Merge or refresh first because it is low-risk and improves the planning base. |
| `#518` | approved, draft, green, behind-only | `#1` member | Member profile/bottom-nav continuity. Make ready and refresh after #520 or before any new #1 member slice. |
| `#516` | approved, draft, green, behind-only | `#3` admin | Admin review route labels. Merge before deeper admin review copy if it is ready. |
| `#519` | approved, draft, green, behind-only | `#3` admin | Admin launch-gate review labels. Merge after #516 so label language stacks cleanly. |
| `#521` | approved, draft, clean | `#3` staff/admin | Embedded Admin review posture follow-on. Merge after #516/#519 if those labels overlap; otherwise it can proceed after Coordinator confirms scope. |

## Recommended Merge Order

1. **`#520` first, if it remains docs-only and behind-only.** It does not touch product code, and it updates the story package that subsequent planning uses.
2. **`#518` next once made ready and refreshed.** It closes the member profile/bottom-nav continuity repair before #1 starts another member-owned shell slice.
3. **`#516` then `#519` for admin labels.** Review route labels should settle before launch-gate review labels, because launch-gate copy is more sensitive and must stay blocked/read-only.
4. **`#521` after admin-label drift is settled, unless Coordinator confirms there is no overlap.** It is staff/admin follow-through and should not need to wait on member or leader lanes.
5. **Only then start the next broader shell wave.** Avoid launching overlapping member or staff/admin code before the current branch family lands.

## What Would Change This Order

- If any product-code PR turns red, the failing PR becomes the blocker and should be fixed before launching a same-shell follow-up.
- If `#520` stays docs-only and behind-only, refresh/merge it opportunistically; do not let it block product-code repairs.
- If `#518` remains draft, #1 can prepare planning or QA notes, but should not start another member PR touching profile/bottom-nav files.
- If `#516` or `#519` stays draft, `#521` can still proceed only if #3 confirms it does not edit the same admin label/copy surfaces.
- If `#521` starts touching launch-gate, provider, or production-readiness copy, Coordinator should pause it and narrow the scope.

## #4 Acceptance Checks After Each Merge

| PR | #4 should verify | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `#520` | Docs-only diff, no matrix edits, no rollout-proof inflation. | Planning base is clearer. | No implementation, QA, or rollout readiness. |
| `#518` | Member bottom-nav/profile route continuity, visible `TEST` labels, no profile/contact/traveler writes. | Member `Scope/UI` and maybe `QA/Ops` if tested/smoked. | No Data/Auth, Writes/Integrations, signed-in proof, or rollout proof. |
| `#516` | Admin review route labels are clear, blocked/read-only where needed, and do not imply live admin writes. | Admin `Scope/UI` and maybe `QA/Ops`. | No provider readiness, role/chapter mutation, or production proof. |
| `#519` | Launch-gate labels still read as review/blocked state, not approval or invite readiness. | Admin launch-gate UI honesty. | No owner CSV, invite gate, live counts, or final approval. |
| `#521` | Staff/Admin review posture, embedded Admin handoff, chapter/proof context, no topbar collision, visible `TEST` labels. | Staff/Admin `Scope/UI` and maybe `QA/Ops`. | No proof ingestion, moderation approval, provider sync, or rollout evidence. |

## Matrix Guidance

Planning docs alone move no percentages. If the open product PRs land and pass
focused checks, they can support modest `Scope/UI` and possibly `QA/Ops` for the
affected shell. None of the current wave moves `Data/Auth`,
`Writes/Integrations`, or `Rollout Gate` without separate real evidence.

## Rollout-Proof Boundary

The following never count as rollout proof by themselves:

- green CI,
- public no-write smoke,
- screenshots,
- docs,
- route labels,
- preview shell copy,
- visible `TEST` content,
- local/sandbox/Figma data,
- draft or preview admin review posture.

Rollout proof still requires approved owner data, live counts, real production
signed-in proof, pilot proof, audit/outbox evidence where relevant, and explicit
Coordinator/Nick approval.
