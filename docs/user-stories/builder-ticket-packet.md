# myMEDLIFE Builder Ticket Packet

Date: 2026-07-07  
Owner lane: myMEDLIFE #5, planning/docs only  
Planning reference: MED-512  
Purpose: turn the merged latest-main crosswalk into four paste-ready packets
Coordinator can send immediately to `#1`, `#2`, `#3`, and `#4`.

## Sources Inspected

- `docs/user-stories/latest-main-builder-crosswalk.md`
- `docs/user-stories/delivery-backlog.md`
- `docs/user-stories/story-to-test-traceability.md`
- Repo `origin/main` at `bddbd285cdb95a313757dd785f800239eccf906b`
  (`Add latest-main builder crosswalk (#442)`)

## Shared Rules

- Repo truth wins over planning intent.
- Figma/exported code remains the visual and navigation contract.
- Screenshots, smoke, TEST rows, local fixtures, and docs are not production
  rollout proof.
- Visible fake people, chapters, events, stories, proof, providers, audit
  actors, and metrics must keep `TEST`.
- Controls must be route-backed, read-only, blocked, disabled, or preview-only.
  No silent dead clicks.
- No production writes, provider/API writes, owner CSV apply, live counts,
  signed-in proof, pilot proof, or rollout packet work from these packets.

## Packet For #1

- `Target thread`: `#1` General Member App Builder
- `Backlog / story IDs`: `BL-001`, `MVP-MEM-03`, `MVP-MEM-04`, `MVP-MEM-05`, `MVP-MEM-06`
- `Suggested model`: `gpt-5.4` medium
- `Plain-English goal`: polish the member event loop so `/app/events`, member
  event detail, RSVP/check-in posture, and `/app/points` feel like one
  coherent Figma-faithful member path without implying live writes.
- `In-scope files / surfaces`:
  - `src/app/app/events/page.tsx`
  - `src/app/app/events/[eventId]/page.tsx`
  - `src/app/app/points/page.tsx`
  - `src/components/figma-member-mobile-home.tsx`
  - `tests/member-mobile-shell-page.test.tsx`
  - `tests/member-event-detail-page.test.tsx`
  - `tests/member-launch-lane-events.test.ts`
  - `tests/launch-lane-points-readback.test.ts`
- `Do not touch`:
  - auth, rollout evidence, provider integrations, points award authority,
    Smile.io, Luma, real RSVP/check-in/attendance writes
  - leader, staff, and admin surfaces
- `Acceptance checks`:
  - `/app/events` and event detail preserve the exported member shell and bottom
    nav
  - RSVP and check-in controls are route-backed or clearly preview-only/blocked
  - `/app/points` reads as points visibility, not live award authority
  - visible fake rows keep `TEST`
  - no silent dead clicks
- `Matrix movement limits`: at most modest Member App / Events / Points
  `Scope/UI` and `QA/Ops` if landed and smoked; no `Data/Auth`,
  `Writes/Integrations`, or `Rollout Gate`

## Packet For #2

- `Target thread`: `#2` Student Leadership / Chapter Command Center Builder
- `Backlog / story IDs`: `BL-013`, `MVP-LDR-02`
- `Suggested model`: `gpt-5.4` medium
- `Plain-English goal`: close the leader event and attendance handoff gap so
  `/leader` stays source-faithful and honest about preview-only operations.
- `In-scope files / surfaces`:
  - `src/app/leader/page.tsx`
  - `src/components/figma-leader-command-center.tsx`
  - `src/services/leader-command-center-routing.ts`
  - `src/services/events-points-launch-lane.ts`
  - `src/services/launch-lane-points-readback.ts`
  - `tests/leader-page.test.tsx`
  - `tests/leader-command-center-routing.test.ts`
- `Do not touch`:
  - member, staff, admin, auth, rollout evidence, provider write surfaces
  - event creation writes, attendance imports, RSVP mutations, Luma sync,
    follow-up sends, points awards
- `Acceptance checks`:
  - leader shell/menu remains exported-source faithful
  - event, attendance, RSVP, and follow-up handoffs route correctly or show
    blocked/preview-only state
  - visible fake rows keep `TEST`
  - copy does not imply live attendance imports, sync, or sends
- `Matrix movement limits`: at most modest Leader / Events `Scope/UI` and
  `QA/Ops` if landed and smoked; no `Data/Auth`, `Writes/Integrations`, or
  `Rollout Gate`

## Packet For #3

- `Target thread`: `#3` Staff / DS Admin Command Center Builder
- `Backlog / story IDs`: `BL-028`, `MVP-DSA-02`
- `Suggested model`: `gpt-5.4` medium
- `Plain-English goal`: tighten DS Admin Integrations, API Keys, and MCP
  Connections so the dark admin shell looks source-backed and every risky
  control reads clearly blocked, masked, or preview-only.
- `In-scope files / surfaces`:
  - `src/app/admin/page.tsx`
  - `src/app/admin/integration-outbox/page.tsx`
  - `src/app/admin/integrations/luma/page.tsx`
  - `src/components/figma-admin-panel.tsx`
  - `tests/admin-management-pages.test.tsx`
  - `tests/admin-integration-outbox-workspace.test.ts`
  - `tests/admin-luma-integration-status.test.ts`
- `Do not touch`:
  - member or leader surfaces
  - auth, rollout evidence, secrets handling beyond UI posture
  - live key reveal/copy/rotate/revoke, provider connect/test/send, MCP
    write/connect mutation, outbox replay/retry/send
- `Acceptance checks`:
  - dark DS Admin shell/menu stays intact
  - Integrations, API Keys, MCP Connections remain visible where source-backed
  - risky controls are masked, blocked, read-only, disabled, or preview-only
  - fake admin/provider rows keep `TEST`
  - copy does not imply live readiness or secret access
- `Matrix movement limits`: at most modest Admin / DS Admin `Scope/UI` and
  `QA/Ops` if landed and smoked; no `Data/Auth`, `Writes/Integrations`, or
  `Rollout Gate`

## Packet For #4

- `Target thread`: `#4` Release / QA Watch Captain
- `Backlog / story IDs`: `BL-046`
- `Suggested model`: `gpt-5.4-mini` medium
- `Plain-English goal`: run mobile QA on the member event-to-points loop so we
  have real browser evidence for the mobile-first shell after the matching UI
  slice lands.
- `In-scope files / surfaces`:
  - `/app`
  - `/app/events`
  - member event detail
  - RSVP preview step
  - check-in preview step
  - `/app/points`
- `Do not touch`:
  - production sign-in proof unless separately approved
  - provider/API access, sends, writes, rollout packet work, matrix editing
- `Acceptance checks`:
  - iPhone Safari/Chrome and Android Chrome where available
  - screenshots or recordings include route/context
  - mobile shell preserves bottom-nav fidelity
  - text, tap targets, and scroll behavior are usable
  - visible fake rows keep `TEST`
  - no silent dead taps and no fake-live RSVP/check-in/points claims
- `Matrix movement limits`: QA evidence may support `QA/Ops` confidence only; no
  `Data/Auth`, `Writes/Integrations`, or `Rollout Gate`

## Coordinator Note

If all lanes are free, the send order from the merged crosswalk still holds:

1. `#1` -> `BL-001`
2. `#2` -> `BL-013`
3. `#3` -> `BL-028`
4. `#4` -> `BL-046`

If only one builder can move first, send `#1` first because it is the closest
narrow-launch member path and already has the strongest local test scaffold.

## Matrix Recommendation

This packet is docs-only and should not move readiness percentages by itself.
