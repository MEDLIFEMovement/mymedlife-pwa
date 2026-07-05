# Figma Student Leadership Command Center Button Map

Date: 2026-07-04

Source: `/Users/codex/Desktop/Student Leadership Command Center/src/app`

App component targets:

- `src/components/figma-leader-command-center.tsx`
- `src/components/figma-leader-create-event-screen.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/components/figma-leader-stories-screen.tsx`

This shell is copied from the Figma export. Its screens are owned by the copied
Figma layout and local state, with `/leader?view=` now resolving to the matching
screen for reviewer links and reloads. Backend wiring should attach behavior
behind these exact controls instead of changing the shell.

## Shell Navigation

- Logo / myMEDLIFE button: returns to `Chapter Home`.
- `/leader?view=overview`: opens `Chapter Home`.
- Chapter group:
  - `Chapter Home`
  - `Chapter Leaderboard` (`/leader?view=leaderboard`)
  - `Feed Analytics` (`/leader?view=feed_analytics`)
- Members group:
  - `Member Leaderboard` (`/leader?view=members`)
  - `Member Profile` (`/leader?view=member_profile`)
- Event Operations group:
  - `Event Committees` (`/leader?view=committees`)
  - `Event Performance` (`/leader?view=events`)
  - `Create Event` (`/leader?view=create_event`)
- Impact & Culture group:
  - `Impact` (`/leader?view=impact`)
  - `Bridge Videos` (`/leader?view=bridge_videos`)
  - `MEDLIFE Stories` (`/leader?view=stories`)
- Leadership group:
  - `Current Leaders` (`/leader?view=leaders`)
  - `Succession` (`/leader?view=succession`)
  - `Values` (`/leader?view=values`)
  - `Leadership Training` (`/leader?view=training`)
- Bell button: visible notification affordance and disabled with blocked-state copy; no backend write in this pass.
- Footer profile button: opens the profile/menu state in the copied shell.

## Chapter Home

- `Create Event`: opens the Event Performance screen and the create-event form.
- `Assign Task`: opens the assign-action modal.
- `Review Members`: visible quick action; future wiring should route/focus the member pipeline.
- `Promote Emerging Leader`: opens the promote-leader modal.
- `Share Bridge Video`: visible quick action; future wiring should focus Bridge Videos.

## Leaderboard

- Metric filter buttons: switch leaderboard metric inside local state.
- `Top Bridge Videos`: jumps to Bridge Videos.
- Member/chapter rows: display ranking details; future wiring may open profiles or chapter comparisons.

## Member/Profile

- Member rows: open the member profile screen.
- Back button on profile: returns to Member Pipeline.
- Profile quick actions:
  - `Promote to Officer`
  - `Assign Leadership Action`
  - `Nominate for E-Board`
  - `Add Note`

## Committees

- `Add Committee`
- Committee expand/collapse card button.
- Expanded committee actions:
  - `Add Chair`
  - `Promote Member`
  - `Assign Task`
  - `Create Event`
  - `Review Committee`

## Event Performance

- `Create Event`: opens the copied Create Event form.
- NPS/feedback row controls:
  - expand/collapse NPS details
  - preview survey modal
  - close NPS detail
- NPS modal:
  - scores `0` through `10`
  - attendance/joining options
  - `Skip`
  - `Submit`
  - success `Done`

## Create Event Form

- `Back`
- `Create another event`
- Figma label `Publish Event`; implemented as `Stage Event` in the app until
  approved Luma/production publishing is enabled.
- Event type selection cards.
- Location type buttons.
- Share channel buttons.
- Social/WhatsApp/SMS copy buttons.
- Preview RSVP button.
- Footer publish button.
- Copy/share/preview RSVP controls are visibly disabled where they would imply
  live sharing, messaging, or Luma write behavior before approval.

## Impact / Bridge / Stories

- Impact:
  - `Share Impact Story`
  - `Create Bridge Video`
  - story filters
  - story cards
  - modal close
  - share/presentation buttons
- Bridge:
  - category filters
  - video cards
  - modal close
  - `Watch Video`
  - `Share to Feed`
  - `Feature`
  - `Submit for Approval`
- MEDLIFE Stories:
  - `Add Story`
  - story filters
  - story like buttons
  - story cards
  - play button
  - modal close buttons
  - share/bookmark controls without approved behavior are visibly disabled
  - external story source buttons are disabled/blocked until feed-sharing and
    external-link approval is complete.

## Succession

- `Start Transition Plan`
- gap action links that return to Members.
- Transition builder:
  - back/cancel controls
  - step selector buttons
  - role selection cards
  - date inputs
  - task toggles
  - review/activate button
  - success `Back to Succession`
  - success `View [member] Profile`

## Leadership Training

- `Add Resource`
- resource type filter buttons.
- search input.
- values/role filters.
- resource expand/collapse cards.
- resource actions:
  - `Watch`
  - `View Deck`
  - external link
  - `Share to Chapter Feed`
  - `Send to Committee`
  - `Add to Leadership Reading List`

## Modal Controls

- Assign Action modal:
  - member selection
  - task selection
  - details fields
  - `Cancel` / `Back`
  - `Continue`
  - `Confirm Assignment`
- Promote Emerging Leader modal:
  - member selection
  - role/level selection
  - note field
  - `Cancel` / `Back`
  - `Continue`
  - `Confirm Promotion`

## Safety Notes

- All controls are local-state only in this pass.
- No Luma writes, attendance writes, uploads, emails, SMS, HubSpot, n8n,
  warehouse, Power BI, or production sends are enabled.
- The copied shell is covered by `tests/figma-shell-cta-safety.test.ts`, which
  blocks fake links, empty handlers, JavaScript void links, and raw buttons
  without a handler or disabled state.
- The next pass should wire one button family at a time and add behavior tests
  for that family.
