# myMEDLIFE Staff/Admin Review Queue Acceptance Packet

Date: 2026-07-07  
Owner lane: myMEDLIFE #5, planning/docs only  
Planning reference: MED-512  
Purpose: give the active staff/admin builder lane a plain-English,
source-backed acceptance packet for the current demo-quality slice without
turning it into a redesign brief.

## Source Files And Docs Inspected

- `src/components/figma-staff-command-center.tsx`
- `tests/staff-page.test.tsx`
- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/delivery-backlog.md`
- `docs/user-stories/module-to-shell-acceptance-map.md`
- `docs/user-stories/reviewer-decision-tree.md`
- `docs/proof-evidence-ugc-visible-controls-acceptance-checklist.md`
- `docs/staff-remaining-controls-acceptance-checklist.md`
- `docs/admin-backend-remaining-controls-acceptance-checklist.md`

## Purpose In Plain English

This packet is for the current staff/admin shell lane that makes the Staff
Command Center more reviewable and more demo-safe. It focuses on the parts that
still shape first impressions:

- proof and UGC review wording
- embedded Admin review cues
- chapter drawer follow-through
- top-right alert/header overlap quality

It is not permission to redesign the shell. The goal is to make the existing
source-backed surface clearer, safer, and easier to review.

## Current Truth

- `Shell state`: route-backed staff shell with embedded admin handoff
- `Data state`: TEST/mock-safe staff, chapter, proof, and admin rows
- `Implementation truth`: partial but source-backed, with strong route and test
  coverage
- `Launch posture`: review-safe and preview-only for moderation, notes,
  interventions, exports, and admin actions

## What Visible Controls, Copy, And Routes Matter Most

### Proof / UGC moderation and review queue

Most important visible cues:

- `Proof / UGC Review Queue` tab remains route-backed
- review rows stay visible and readable
- blocked-state copy stays explicit:
  - story link ingestion blocked
  - provider fetch blocked
  - queue writes blocked
  - proof sharing and publishing blocked
- staff can review content context without implying real moderation writes
- any route into Admin from proof review should clearly say it is for preview
  and audit readback, not live DS action

### Embedded Admin review posture and cross-surface handoff copy

Most important visible cues:

- `Admin` remains visible in the staff nav where source-backed
- non-admin staff see a safe blocked state instead of disappearing nav
- admin-capable actors can preview the embedded admin path
- copy makes clear that this is an admin preview route and not a live staff-side
  write surface
- `Command Center` return posture/back affordance remains understandable

### Chapter drawer and embedded Admin preview follow-through

Most important visible cues:

- chapter rows still open a review drawer/detail state
- drawer copy stays honest about preview-readback posture
- coach notes remain preview-only
- no intervention write, note save, follow-up write, owner change, or outreach
  send should sound active from the drawer
- Admin review handoff from the drawer remains visible and clear

### Top-right alert/header overlap

Most important visible cue:

- the top-right intervention/alert chip and account area must not visibly
  collide or crowd each other
- this is a demo-quality acceptance check only
- it should preserve the source shell structure rather than invent a new header
  pattern

## What Should Remain Blocked Or Preview-Only

- proof ingestion
- provider fetch
- moderation writes
- approval / request-change / reject writes
- proof sharing and publishing
- coach note saves
- intervention status writes
- follow-up task writes
- outreach sends
- export
- embedded admin mutations
- provider/API/MCP actions surfaced through the staff/admin path

If a control is visible, it should be route-backed, read-only, blocked,
disabled, or clearly preview-only. No silent dead clicks.

## TEST Label Rules

- Visible fake chapters, staff actors, student names, proof items, audit actors,
  and metric narratives should keep `TEST`
- Review-queue item titles and drawer row labels should keep `TEST` when they
  are not real production content
- Clean labels should stay clean:
  - `Staff Command Center`
  - `Proof / UGC`
  - `Admin`
  - `Campaign SOPs`
  - `MCP Connections`
  - provider and product names
- TEST labeling is UI honesty only and never rollout proof

## What Counts As Real Progress

- proof/UGC wording becomes more obviously review-safe
- embedded Admin handoff copy becomes clearer without widening authority
- chapter drawer copy better explains readback-only posture
- the header/top-right area reads cleanly in demos without source drift
- tests continue proving blocked-state wording, admin handoff posture, and
  chapter drawer honesty

## What Does Not Count As Real Progress

- making the shell prettier while the blocked-state copy gets weaker
- adding richer fake proof/admin activity without `TEST`
- treating visible admin/readback cues as live DS readiness
- treating smoke, screenshots, or TEST rows as rollout evidence
- moving controls around just to hide crowding if it breaks source-backed shell
  hierarchy

## Next Likely Builder Owner

- `#3` Staff / DS Admin Command Center Builder

## Suggested Model

- `gpt-5.4` medium

## What Must Not Be Overstated As Production Proof

- proof moderation readiness
- proof ingestion/storage readiness
- admin authority
- intervention workflow readiness
- export readiness
- provider/API/MCP readiness
- production staff proof
- rollout evidence

## Practical Reviewer Checks

- Does `Proof / UGC Review Queue` still open as a route-backed staff surface?
- Does the copy clearly say blocked or preview-only for ingestion, sharing, and
  publishing verbs?
- Does the Admin handoff stay visible without granting live staff-side admin
  authority?
- Does the chapter drawer still say readback-only and preview-only for notes,
  interventions, and outreach?
- Does the top-right header area avoid visible overlap while keeping the source
  shell shape?
- Are fake visible rows and actors still `TEST` labeled?
- Did the PR stay inside staff/admin shell files instead of drifting into member,
  leader, auth, rollout, or provider lanes?

## Matrix Recommendation

This packet is planning-only and should not move readiness percentages by
itself. A clean implementation PR may support modest `Staff Command Center` or
`Admin / DS Admin` `Scope/UI` and `QA/Ops` movement only.
