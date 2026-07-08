# Current Shell Acceptance Handoff Index

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only

## Purpose

Point Coordinator to the right acceptance map for the next shell-builder move,
based on current repo truth and the verified PR queue.

## Current Queue Truth Checked

- `#518` is merged.
- `#523` is the active member SLT branch and currently needs watch/repair before
  another member shell slice should touch the same files.
- `#521`, `#522`, `#528`, `#530`, and `#533` are clean.
- `#524`, `#529`, and `#532` are behind-only.
- Figma/exported source remains fidelity contract; repo truth remains
  implementation truth.

## Builder Handoffs

| Builder | Use this doc | Next action |
| --- | --- | --- |
| `#1` Member | `member-stories-feed-reader-delta-map.md` | After `#523`, restore Stories feed/reader source feel without fake-live social/proof behavior. |
| `#1` Member | `member-slt-prep-placement-map.md` | Use immediately for review of `#523`; keep `/app/slt-prep` as member-shell handoff and standalone `/slt-prep/*` as preview-safe workspace. |
| `#2` Leader | `leader-shell-acceptance-packet.md` plus current #524/#529/#532/#533 PRs | No new broad #2 packet needed from this batch; finish/refresh active leader continuity PRs before another leader slice. |
| `#3` Staff/Admin | `staff-admin-acceptance-contradictions-map.md` | After `#521/#522/#528/#530`, run final Staff/Admin walkthrough contradiction pass. |
| `#4` QA | all three maps plus `reviewer-decision-tree.md` | Verify shell fidelity, TEST labels, blocked controls, and no rollout-proof inflation. |

## What These Docs Change

- They make the Member Stories ask concrete: IG-like means feed rhythm, filters,
  handle row, square media, action row, caption, read-more/detail, and timestamp.
- They separate `/app/slt-prep` from standalone `/slt-prep/*` without making
  either look production-live.
- They name Staff/Admin contradictions where menu depth looks operational but
  writes/providers/launch gate remain blocked.

## What They Do Not Change

- No matrix movement from planning alone.
- No production proof from shell UI, smoke, screenshots, TEST data, or exported
  source.
- No permission to edit product code outside assigned shell lanes.
