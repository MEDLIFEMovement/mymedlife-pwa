# General Member App Acceptance Packet

Date: 2026-07-08  
Owner lane: myMEDLIFE #5, planning/docs only  
Builder owner: `#1` General Member App  
Purpose: source-backed acceptance packet for member-shell implementation slices.

## Sources To Use First

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/delivery-backlog.md`, especially `BL-001` through `BL-006`
- `docs/user-stories/user-story-backlog-table.md`
- `docs/user-stories/shell-delivery-map-and-acceptance-checklist.md`
- `docs/figma-control-inventory.md`
- `docs/member-event-loop-acceptance-checklist.md`
- `docs/member-stories-ig-feed-source-fidelity-handoff.md`
- Source routes/components named by the story package: `/app`,
  `/app/events`, `/app/events/[eventId]`, `/app/points`, `/app/stories`,
  `/profile`, `/app/slt-prep`, and `figma-member-mobile-home`.

## Source-Backed Menu And Screen Inventory

Member surfaces that should remain visible where source-backed:

- `/login` as the single sign-in entry.
- `/app` mobile home and bottom navigation.
- `/app/events` event list.
- `/app/events/[eventId]` event detail with RSVP/check-in/points posture.
- `/app/points` points and simple leaderboard readback.
- `/app/stories` IG-style stories/feed and reader/detail posture.
- `/profile` member identity/profile context.
- `/app/slt-prep` member-shell SLT entry/handoff.

## What Must Remain Visible Even If Unfinished

- Bottom navigation families for Home, Events, Stories, Points, and Profile
  where source-backed.
- Event cards and event-detail entry points.
- RSVP/check-in/attendance/points handoff cues.
- Points/leaderboard readback.
- Stories/feed controls such as reactions, save, share, comment, and reader
  links where the exported/source shell includes them.
- SLT entry/handoff when source-backed.

Unfinished controls should be route-backed, read-only, disabled, blocked, or
preview-only. They should not silently do nothing.

## TEST Label Requirements

Visible fake or sandbox member content must include `TEST`:

- member names and profile identities
- chapter names
- event names
- story/proof cards
- points and leaderboard rows
- SLT/traveler sample rows
- fake metric narratives

Keep real product/provider/menu labels clean: MEDLIFE, myMEDLIFE, Events, RSVP,
Attendance, Points, SLT Prep, role labels, and menu labels should not be
prefixed.

## What Counts As Scope/UI Progress

- Source-faithful member mobile shell and bottom-nav behavior.
- Route-backed member paths with no silent dead taps.
- Preview-safe RSVP, check-in, attendance, and points handoff language.
- Stories/feed visual fidelity to exported/Figma source without fake-live social
  behavior.
- Focused route/component/browser checks for touched member paths.

## What Does Not Count As Rollout Readiness

- Local member preview, public no-write smoke, screenshots, TEST rows, or Figma
  data.
- RSVP/check-in controls that are visible but not backed by approved live writes.
- Points/leaderboard readback without real ledger and award authority.
- Stories/proof UI without consent, storage, moderation, and production evidence.
- SLT preview routes without real traveler/payment/form/provider approval.

## Next Safest Slice Sequence

1. `BL-001`: member `/app/events` -> event detail -> RSVP/check-in ->
   `/app/points` continuity.
2. `BL-003`: member home-to-profile continuity and privacy-copy pass.
3. `BL-006`: points readback wording and leaderboard preview honesty.
4. `BL-002`: Stories IG-style feed and reader/detail final parity.
5. `BL-004`: `/app/slt-prep` member-shell integration closeout if the prior
   member routes remain stable.

## Reviewer Acceptance Checks

- The member shell still looks and navigates like the exported/Figma mobile app.
- Every visible control is route-backed, read-only, blocked, disabled, or
  preview-only.
- No copy claims live RSVP, attendance, check-in, points award, Smile.io sync,
  story publish, proof consent, or rollout readiness.
- Visible fake data includes `TEST`.
- Tests/checks are focused on member files and do not touch leader/staff/admin
  ownership.

## Common Drift Warnings

- Matching screenshots by eye instead of using exported/Figma source.
- Making event/RSVP/check-in/points feel live before write/proof gates exist.
- Treating points readback as award authority.
- Letting stories reactions/share/save/publish imply social or provider writes.
- Pulling leader, staff/admin, auth, or rollout evidence files into a member UI
  PR.

## Matrix Language

Landed and smoked member shell work may support modest `Scope/UI` and `QA/Ops`
movement for affected member rows. It does not move `Data/Auth`,
`Writes/Integrations`, or `Rollout Gate` without separate real evidence.
