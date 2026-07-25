# Leader Shell Restoration Work Packet

Date: 2026-07-08
Builder owner: `#2` Student Leadership / Chapter Command Center
Owner lane: myMEDLIFE #5, planning/docs only

## Best Next Work Packet

Restore leader menu/view parity across service-backed `/leader?view=*` screens
and Figma fallback screens, with emphasis on Member Profile, Current Leaders,
Succession, Values, Leadership Training, and the review-loop handoffs that
connect them.

## Evidence Base

- Repo route: `src/app/leader/page.tsx`.
- Service-backed route set in repo truth: overview, leaderboard, leaders,
  members, member_profile, committees, events, impact, bridge_videos,
  succession, values, training, and feed_analytics.
- Figma fallback shell: `src/components/figma-leader-command-center.tsx`.
- Training/support source: `src/components/figma-leader-training-screen.tsx`
  and `src/components/figma-leader-stories-screen.tsx`.
- Exported app source:
  `/Users/codex/Desktop/myMEDLIFE App Prototype/src/app/App.tsx` includes
  leader dashboard, create event, QR/event management, share feed, and staff
  view sketches.

## What "Looks Like The Figma" Means

The leader shell should preserve the dark Student Leadership / Chapter Command
Center sidebar and grouped menu families:

- Chapter: Chapter Home, Chapter Leaderboard, Feed Analytics.
- Members: Member Leaderboard, Member Profile.
- Event Operations: Event Committees, Event Performance, Create Event.
- Impact & Culture: Impact, Bridge Videos, MEDLIFE Stories.
- Leadership: Current Leaders, Succession, Values, Leadership Training.

The route model should feel coherent whether a view is service-backed or Figma
fallback. Direct URLs and reloads should land on the intended `/leader?view=*`
surface.

## Smallest Safe Implementation Slices

1. **Review-loop continuity:** finish the route/copy handoff across Member
   Profile, Current Leaders, Succession, Values, and Leadership Training.
2. **Menu/view parity sweep:** verify every source-backed menu item has a
   route-backed, read-only, blocked, or preview-only state.
3. **Event-adjacent handoff:** only after the review loop is stable, ensure
   Event Committees, Event Performance, Create Event, and attendance readback do
   not imply live mutation.

## Likely File Families

- `src/app/leader/page.tsx`
- `src/components/figma-leader-command-center.tsx`
- `src/components/chapter-leader-command-center-panel.tsx`
- `src/components/leader-app-shell.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/components/figma-leader-stories-screen.tsx`
- `src/components/leadership-transition-campaign-panel.tsx`
- `src/services/leader-command-center-routing.ts`
- `src/services/leader-launch-lane.ts`
- focused leader route/component tests

## Do Not Touch

- `/app`, `/staff`, `/admin`
- production member/profile/role mutation services
- succession, assignment, training, or committee writes
- event creation writes or attendance imports
- notification/reminder sends
- Luma/provider sync
- points awards or leaderboard mutation
- rollout proof, live counts, owner data, or production signed-in proof

## Acceptance Checks

- Source-backed menu families remain visible.
- Direct `/leader?view=*` URLs and reloads preserve the intended view.
- Service-backed and Figma fallback views do not contradict each other.
- Promote, assign, transition, contact, create-event, attendance, export, share,
  and points controls are blocked/read-only/preview-only where no write path
  exists.
- Visible fake leaders, members, chapters, training resources, succession
  examples, story rows, and metrics include `TEST`.
- Focused leader tests or browser checks cover changed views.

## Visible UI Versus Repo Truth

The leader shell can look operational because the menu and modal flows are rich.
Repo truth still does not prove live role changes, succession approvals,
training assignment, event creation, attendance import, notification delivery,
or points awards. Those stay blocked until separate data/write evidence exists.

## Matrix Limits

Can move: `Scope/UI`, possibly `QA/Ops` if tested/smoked.

Cannot move: `Data/Auth`, `Writes/Integrations`, `Rollout Gate`.
