# Figma General Student Member App Button Map

Date: 2026-07-04

Source: `/Users/codex/Desktop/myMEDLIFE App Prototype/src/app/App.tsx`

App component target:

- `src/components/figma-member-mobile-home.tsx`

This shell is copied from the Figma export. Its screens are owned by internal
button state inside the mobile frame. Backend wiring should attach behavior
behind these exact controls instead of changing the shell.

## Mobile Shell

- Bottom nav:
  - `Home`
  - `Campaign`
  - `Events`
  - `Points`
  - `Profile`
- Back buttons inside detail screens return to the prior Figma screen.
- Notification bell is visible on the home/header states; no backend write in this pass.

## Home

- `Start next action`: opens Action Detail.
- Points card: opens Points.
- MEDLIFE Stories card: opens Stories.
- Event cards:
  - event card click opens Events.
  - RSVP pill/button is visible; live RSVP write is not enabled by this pass.
- Campaign card: opens Campaign.
- Action cards: open Action Detail.
- `See all`: visible event/action affordance.
- `Full board`: opens Points.
- Role preview controls:
  - General Member
  - E-Board
  - Staff
  - DS
  - Sales
  - Super Admin
- Privileged preview buttons:
  - `Leader Hub`
  - `Coach View`
  - `Admin`

## Campaign

- Why-it-matters accordion.
- Role/action cards: open Action Detail.
- `View my actions`: opens Action Detail.
- `Submit evidence`: opens Evidence Submission.

## Action Detail / Evidence

- `Submit evidence`: opens Evidence Submission.
- Evidence tabs:
  - photo
  - link
  - file
- Upload drop zone button.
- Consent/accuracy checkbox.
- `Submit evidence`: opens Confirmation when allowed.
- Confirmation:
  - action card returns to Action Detail.
  - `Back to Home`
  - `View all my actions`

## Leader Preview Screens

- Leader dashboard back button.
- `Review evidence`: opens Review Evidence.
- evidence cards: open Review Evidence.
- `Assign action`: opens Assign Action.
- Assign Action:
  - campaign selector
  - task template selector
  - assignee selector
  - step navigation
  - `Assign`
  - `Edit assignment`
- Review Evidence:
  - `View full`
  - approve button
  - request changes button

## Coach / Admin Preview Screens

- Coach dashboard back button.
- risk chapter buttons that return to leader/member context.
- `Write coach note`
- `Review risk reports`
- Admin dashboard back button.
- `View integration events`

## Points

- `See how to earn more points`
- leaderboard/chapter ranking cards.
- points category rows.

## Events

- Campaign filter buttons:
  - `All`
  - per-campaign filters.
- Event cards: open Event Detail.
- RSVP/action buttons on event cards.
- Event Detail:
  - back to Events.
  - share/download/map-style buttons.
  - `RSVP`
  - `Add to Calendar`
  - `Share`
- RSVP Confirmation:
  - `Go to Check-In`
  - `Back to Events`
- Check-In:
  - check-in button.
  - `View All My Points`
  - `Back to Events`

## Stories

- Story cards.
- story like buttons.
- story modal close buttons.
- mobile story card menu.
- `Read story`
- `Back to App`
- `Share Story`
- story filter chips.

## Safety Notes

- All controls are local-state only in this pass.
- No Luma writes, attendance writes, proof uploads, approvals, messages,
  external sends, HubSpot, n8n, warehouse, Power BI, or production changes are
  enabled.
- The next pass should wire the event/RSVP/attendance/points controls first,
  one behavior family at a time.
