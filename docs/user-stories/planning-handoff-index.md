# myMEDLIFE Planning Handoff Index

Date: 2026-07-08  
Owner lane: myMEDLIFE #5, planning/docs only  
Planning reference: MED-512  
Purpose: give Coordinator one small entrypoint into the repo-truth planning
system so builder assignment, review, and truth checks do not require
re-reading the full docs stack every time.

## Start Here

Use this index when you need to answer one of these questions quickly:

- What is actually implemented in the repo right now?
- What is in MVP scope for the narrow launch?
- Which builder should take the next slice?
- Is a surface built, preview-only, blocked, or rollout-gated?
- Which docs explain test coverage versus rollout proof?
- Where is the visible Figma intent ahead of repo truth?

## Core Merged Docs

These are the stable docs already merged into `main` and safe to use as the
baseline planning stack.

| Need | Best doc | What it answers |
| --- | --- | --- |
| Full story truth by persona | `docs/user-stories/master-user-story-inventory.md` | What exists by route/persona, with status and blockers |
| Clean MVP story spine | `docs/user-stories/narrow-launch-mvp-stories.md` | Which stories define the narrow launch |
| Gaps and rollout blockers | `docs/user-stories/user-story-gap-report.md` | What is missing, vague, blocked, or still only preview-safe |
| PR-sized work queue | `docs/user-stories/delivery-backlog.md` | The delivery backlog by owner lane and work type |
| Test/proof mapping | `docs/user-stories/story-to-test-traceability.md` | Which stories have route/component/service/e2e coverage and which still need proof |
| Ranked next slices | `docs/user-stories/latest-main-builder-crosswalk.md` | Short next-up steering for `#1`, `#2`, `#3`, `#4` |
| Immediate next assignments | `docs/user-stories/builder-ticket-packet.md` | One paste-ready packet each for `#1`, `#2`, `#3`, and `#4` |
| Module ownership by shell | `docs/user-stories/module-to-shell-acceptance-map.md` | Which modules belong to member, leader, staff/admin, or rollout lanes |

## Pending Enrichment Docs

These are useful follow-through docs that may still be in PR review or queue
hygiene at the moment. Use them when available, but do not assume they are
merged until their PR lands.

| Need | Likely doc | Why it exists |
| --- | --- | --- |
| Fast built vs preview-only vs rollout-gated snapshot | `docs/user-stories/narrow-launch-truth-refresh.md` | One-page truth summary for live coordination |
| Long-run shell packets | `docs/user-stories/member-builder-packet.md`, `leader-builder-packet.md`, `staff-admin-builder-packet.md` | Durable 3-to-5-slice runway for each shell builder |
| Figma vs repo-truth mismatches | `docs/user-stories/figma-repo-truth-contradictions.md` | Where the visible shell looks more live than the proof actually is |

## Which Doc To Open By Question

### “What should `#1` work on next?”

1. `docs/user-stories/builder-ticket-packet.md`
2. `docs/user-stories/latest-main-builder-crosswalk.md`
3. `docs/user-stories/member-builder-packet.md` when available

### “What should `#2` or `#3` work on next?”

1. `docs/user-stories/latest-main-builder-crosswalk.md`
2. `docs/user-stories/builder-ticket-packet.md`
3. `docs/user-stories/leader-builder-packet.md` or
   `docs/user-stories/staff-admin-builder-packet.md` when available

### “Is this route really built, or just preview-only?”

1. `docs/user-stories/master-user-story-inventory.md`
2. `docs/user-stories/story-to-test-traceability.md`
3. `docs/user-stories/module-to-shell-acceptance-map.md`
4. `docs/user-stories/narrow-launch-truth-refresh.md` when available

### “Can this move the readiness matrix?”

1. `docs/user-stories/delivery-backlog.md`
2. `docs/user-stories/story-to-test-traceability.md`
3. `docs/user-stories/user-story-gap-report.md`

Rule of thumb:

- UI shell work can support modest `Scope/UI` and `QA/Ops` only after landing
  and smoke.
- `Data/Auth`, `Writes/Integrations`, and `Rollout Gate` need separate proof or
  safety evidence.

### “Why does this polished screen still count as preview-only?”

1. `docs/user-stories/figma-repo-truth-contradictions.md` when available
2. `docs/user-stories/module-to-shell-acceptance-map.md`
3. `docs/user-stories/user-story-gap-report.md`

## Builder Routing Snapshot

| Lane | Best immediate source | Main use |
| --- | --- | --- |
| `#1` General Member App | `builder-ticket-packet.md` | member events, points, profile, SLT handoff |
| `#2` Student Leadership | `builder-ticket-packet.md` | leader events, attendance, leaderboard, support/culture |
| `#3` Staff / DS Admin | `builder-ticket-packet.md` | DS Admin integrations/API/MCP, staff/admin preview surfaces |
| `#4` QA / release watch | `builder-ticket-packet.md`, `story-to-test-traceability.md` | mobile QA, visible TEST checks, no-write smoke |
| `#5` planning | this index + full stack | story truth, backlog shaping, contradiction mapping |

## Truth Rules To Carry Forward

- Repo truth beats design intent for implementation status.
- Figma/exported code is the visual contract for acceptance, not proof of live
  wiring.
- Visible fake content must keep `TEST`.
- Screenshots, smoke, local, sandbox, and preview evidence are useful, but they
  are not rollout proof.
- Do not let polished UI language outrun blocked write, provider, or rollout truth.

## Recommended Use Pattern

1. Start with this index.
2. Open the smallest doc that answers the question.
3. Only escalate to the larger story inventory if the smaller doc is not enough.
4. Keep pending docs separate from merged truth until their PRs land.

## Matrix Recommendation

This handoff index is planning/documentation only and should not move readiness
percentages by itself.
