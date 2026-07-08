# Student Leadership Shell Acceptance Packet

Date: 2026-07-08  
Owner lane: myMEDLIFE #5, planning/docs only  
Builder owner: `#2` Student Leadership / Chapter Command Center  
Purpose: source-backed acceptance packet for `/leader?view=*` implementation
slices.

## Sources To Use First

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/delivery-backlog.md`, especially `BL-012` through `BL-018`
- `docs/user-stories/leader-shell-menu-restoration-acceptance-slice.md`
- `docs/user-stories/shell-delivery-map-and-acceptance-checklist.md`
- `docs/figma-control-inventory.md`
- `docs/leader-remaining-controls-parity-acceptance-checklist.md`
- Source routes/components named by the story package: `/leader?view=*`,
  `figma-leader-command-center`, `leader-command-center-routing`, and
  `leader-launch-lane`.

## Source-Backed Menu And Screen Inventory

Leader surfaces that should remain visible where source-backed:

- `/leader?view=overview`
- `/leader?view=events`
- `/leader?view=attendance` where routed or service-backed
- `/leader?view=leaderboard`
- `/leader?view=members`
- `/leader?view=member_profile`
- `/leader?view=create_event`
- `/leader?view=committees`
- Impact, Bridge Videos, MEDLIFE Stories, Values, Succession, Current Leaders,
  and Leadership Training screens where the exported/source menu includes them.

## What Must Remain Visible Even If Unfinished

- The exported/Figma sidebar/menu family.
- Chapter overview and metrics.
- Member list/profile handoff surfaces.
- Event, attendance, committee, and create-event surfaces.
- Leaderboard and points readback surfaces.
- Training, values, succession, impact, bridge video, and stories surfaces.

Unfinished controls should stay visible but honest: route-backed, read-only,
blocked, disabled, or preview-only.

## TEST Label Requirements

Visible fake or sandbox leader content must include `TEST`:

- leader/member names
- chapter names
- event names
- leaderboard rows
- profile preview rows
- succession/current leader examples
- training/story/support/culture sample content
- fake metrics and task examples

Keep real product/provider/menu labels clean: MEDLIFE, myMEDLIFE, Events,
Attendance, Points, Leadership Training, role labels, and menu labels should not
be prefixed.

## What Counts As Scope/UI Progress

- Canonical `/leader?view=*` routing and service-backed menu restoration.
- Source-faithful sidebar/menu and screen continuity across the leader families.
- Deep links and reloads preserve the intended leader view.
- Visible controls clearly communicate blocked/preview-only status.
- Focused leader route/control tests remain passing.

## What Does Not Count As Rollout Readiness

- Leader shell routes, screenshots, public no-write smoke, TEST rows, or local
  actor proof.
- Leaderboard readback without real points ledger.
- Event/create-event UI without approved live event writes.
- Attendance views without real attendance source.
- Member/profile previews without role-scoped production account proof.
- Succession/training/culture UI without approved persistent workflow.

## Next Safest Slice Sequence

1. `BL-012`: service-backed `/leader?view=*` menu restoration and canonical
   route continuity.
2. `BL-015`: leader member/profile handoff parity after the menu contract lands.
3. `BL-013`: leader event/attendance handoff closeout.
4. `BL-014`: leaderboard/comparison polish after route continuity is stable.
5. `BL-018`: training, values, succession, impact, bridge videos, and stories
   preview-safe parity.

## Reviewer Acceptance Checks

- Source-backed leader menu families remain visible and navigable.
- URLs, reloads, and direct links stay on the intended `/leader?view=*` screen.
- Create, publish, assign, promote, export, follow-up, attendance import, and
  succession controls are blocked or preview-only.
- Visible fake data includes `TEST`.
- The PR stays in leader-owned files and tests unless Coordinator approved a
  shared helper change.

## Common Drift Warnings

- Starting with leaderboard polish before route/menu continuity is stable.
- Making event creation, attendance import, role change, assignment, or
  succession copy sound live.
- Hiding source-backed menu items because they are unfinished.
- Reusing member or staff/admin routes instead of canonical leader view routes.
- Treating local role switching or screenshots as production signed-in proof.

## Matrix Language

Landed and smoked leader shell work may support modest `Scope/UI` and `QA/Ops`
movement for affected leader rows. It does not move `Data/Auth`,
`Writes/Integrations`, or `Rollout Gate` without separate real evidence.
