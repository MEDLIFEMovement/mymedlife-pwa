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
- `#523`, `#533`, `#535`, and `#536` are fully green and behind-only in the
  latest Coordinator queue note.
- `#534` is no longer a Codecov-red branch; treat it as behind-only/rerun-state
  unless new checks fail.
- `#1` is actively implementing the member profile/mobile-feel fix from
  `member-profile-rhythm-acceptance-map.md`.
- After the active profile route-shell fix lands, the next member-only pressure
  splits into profile body rhythm and Stories IG-feed fidelity; neither should
  broaden into profile writes, story publishing, or proof/provider behavior.
- `#2` is continuing the leader continuity wave after repairing `#539`.
- `#3` confirmed the staff topbar overlap is not the next missing slice on
  current main; the next staff/admin pressure is embedded Admin return-loop
  coherence.
- `#546` is merged; use `active-builder-lane-truth-refresh.md` as the short
  coordinator steering layer for the next member, leader, staff/admin, and QA
  moves.
- Figma/exported source remains fidelity contract; repo truth remains
  implementation truth.

## Builder Handoffs

| Builder | Use this doc | Next action |
| --- | --- | --- |
| `#1` Member | `member-stories-feed-reader-delta-map.md` | After `#523`, restore Stories feed/reader source feel without fake-live social/proof behavior. |
| `#1` Member | `member-profile-rhythm-acceptance-map.md` | Use for the next narrow profile rhythm pass: make `/profile` feel mobile/member-app native without adding profile writes. |
| `#1` Member | `member-profile-body-rhythm-acceptance-map.md` | Use only after the active profile route-shell bug is clean; tune body density, hierarchy, spacing, and mobile feel without redesigning profile. |
| `#1` Member | `member-stories-ig-feed-acceptance-map.md` | Use after profile settles to restore Stories IG-feed fidelity while keeping reactions, publishing, saves, shares, and proof/provider behavior preview-safe. |
| `#1` Member | `member-slt-prep-placement-map.md` | Use immediately for review of `#523`; keep `/app/slt-prep` as member-shell handoff and standalone `/slt-prep/*` as preview-safe workspace. |
| `#2` Leader | `leader-shell-acceptance-packet.md` plus current leader continuity PRs | Leader guidance is now return-path and cross-route polish, not broad shell rebuild or leaderboard-first polish. |
| `#2` Leader | `leader-cross-route-continuity-acceptance-map.md` | Use after the current `#533/#535/#539` wave to tighten Chapter Home, Member Profile, Current Leaders, Succession, Values, and Leadership Training continuity. |
| `#3` Staff/Admin | `staff-admin-acceptance-contradictions-map.md` | After `#521/#522/#528/#530`, run final Staff/Admin walkthrough contradiction pass. |
| `#3` Staff/Admin | `staff-topbar-shell-acceptance-map.md` | Use for the narrow topbar/header acceptance pass: prevent alert/account overlap while preserving source-backed staff nav. |
| `#3` Staff/Admin | `staff-embedded-admin-return-loop-acceptance-map.md` | Use for the next return-loop pass: chapter drawer -> embedded Admin -> Chapters and Proof / UGC -> embedded Admin -> review context. |
| `#4` QA | all three maps plus `reviewer-decision-tree.md` | Verify shell fidelity, TEST labels, blocked controls, and no rollout-proof inflation. |
| Coordinator / `#5` | `active-builder-lane-truth-refresh.md` | Use after `#546` to steer the next active shell wave and retire stale leaderboard-first, topbar-only, or rollout-assignment drift. |

## What These Docs Change

- They make the Member Stories ask concrete: IG-like means feed rhythm, filters,
  handle row, square media, action row, caption, read-more/detail, and timestamp.
- They separate `/app/slt-prep` from standalone `/slt-prep/*` without making
  either look production-live.
- They name Staff/Admin contradictions where menu depth looks operational but
  writes/providers/launch gate remain blocked.
- They make the member profile rhythm concern concrete without pretending there
  is a full exported profile screen beyond the source-backed bottom-nav/profile
  signal.
- They split the next member polish into route-shell/body rhythm versus Stories
  IG-feed fidelity, so `#1` can avoid mixing active profile work with future
  Stories feed work.
- They make the staff topbar overlap fix concrete without turning screenshot
  feedback into redesign permission.
- They make the leader next slice concrete: cross-route continuity and
  return-path polish, not broad shell shape or leaderboard-first work.
- They make the staff/admin next slice concrete: embedded Admin return loops,
  not another topbar-only pass unless a new screenshot or smoke failure proves
  otherwise.
- They add a compact active-builder truth refresh so Coordinator can steer
  `#1`, `#2`, `#3`, and `#4` without re-reading every story/backlog artifact.

## What They Do Not Change

- No matrix movement from planning alone.
- No production proof from shell UI, smoke, screenshots, TEST data, or exported
  source.
- No permission to edit product code outside assigned shell lanes.
