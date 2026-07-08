# myMEDLIFE Leader Builder Packet

Date: 2026-07-07  
Owner lane: `#2` Student Leadership / Chapter Command Center Builder  
Planning reference: MED-512  
Purpose: give the leader-shell builder a focused runway that preserves the
leader Figma shell while keeping event, leaderboard, and support/culture
surfaces honest.

## Sources Inspected

- `docs/user-stories/builder-ticket-packet.md`
- `docs/user-stories/latest-main-builder-crosswalk.md`
- `docs/user-stories/story-to-test-traceability.md`
- `docs/user-stories/delivery-backlog.md`
- `src/app/leader/page.tsx`
- `src/components/figma-leader-command-center.tsx`
- `src/components/figma-leader-stories-screen.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/components/figma-leader-create-event-screen.tsx`
- `src/services/leader-command-center-routing.ts`

## Shell Contract

- Repo truth sets implementation status.
- Exported/Figma leader shell/menu is the visual contract.
- Visible fake leader/member/chapter/event/story rows must keep `TEST`.
- No leader PR should imply live event creation, attendance imports, role
  changes, assignment writes, succession writes, or points mutation.

## Current Leader Truth

- Built or launch-reviewable: `/leader?view=overview`
- Partial: events/attendance and leaderboard readback
- Preview-only: create-event, committees/tasks, member/profile handoff,
  values/succession/training/impact/bridge/stories
- Rollout-blocked: production leader proof, real chapter data, live event/attendance truth

## Recommended Next Slices

### 1. BL-013 - Leader event and attendance handoff closeout

- In scope:
  - `/leader` event and attendance views
  - `src/app/leader/page.tsx`
  - `src/services/leader-command-center-routing.ts`
  - relevant leader tests
- Goal:
  - make event and attendance navigation and copy feel complete without
    implying live mutation
- Must stay blocked:
  - event creation writes, attendance imports, RSVP mutation, Luma sync,
    follow-up sends

### 2. BL-014 - Leader leaderboard/comparison polish

- In scope:
  - leaderboard view state inside `/leader`
  - comparison/readback copy and tests
- Goal:
  - keep points visibility source-faithful and readable from the leader shell
- Must stay blocked:
  - point mutation, exports, rewards, provider sync, production leaderboard proof

### 3. BL-018 - Support/culture parity sweep

- In scope:
  - `stories`, `values`, `succession`, `training`, `impact`, `bridge`
    surfaces inside the leader shell
  - `src/components/figma-leader-stories-screen.tsx`
  - `src/components/figma-leader-training-screen.tsx`
- Goal:
  - preserve the visible support/culture system without letting controls sound
    more live than they are
- Must stay blocked:
  - publish/share, succession writes, assignment writes, story/proof claims

### 4. BL-016 - Create-event preview honesty

- In scope:
  - visible create-event route/panel and related blocked-state wording
- Goal:
  - make create-event posture explicit without hiding the feature
- Must stay blocked:
  - myMEDLIFE/Luma event writes, reminders, sends, outbox behavior

## Do-Not-Touch Boundaries

- No member, staff, or DS Admin surfaces
- No auth/data-safety services unless scope is explicitly widened
- No rollout evidence work
- No provider/API access

## Acceptance Checks

- Leader sidebar/menu families remain source-faithful
- Visible fake rows keep `TEST`
- Event, leaderboard, and support/culture controls are route-backed, blocked,
  disabled, read-only, or preview-only
- No fake-live wording for event ops, attendance, leaderboard mutation,
  succession, or stories

## Model Recommendation

Use `gpt-5.4` medium for implementation. Use `gpt-5.4-mini` for checklists and
review support only.

## Matrix Guidance

Leader-shell PRs may support modest Leader `Scope/UI` and `QA/Ops` movement once
landed and smoked. They must not move `Data/Auth`, `Writes/Integrations`, or
`Rollout Gate` by themselves.
