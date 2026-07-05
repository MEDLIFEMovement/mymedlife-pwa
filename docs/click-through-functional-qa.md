# Click-Through Functional QA

Date: 2026-07-05

Scope: local myMEDLIFE launch surfaces on `http://localhost:3010`.

Rule used: every visible navigation item must route, open a visible state, be clearly disabled, or be hidden.

## Findings and Fixes

| Route / Screen | Visible item | Expected result | Actual before | Fix | Final status |
|---|---|---|---|---|---|
| `/app/slt-prep` | SLT Prep route | Load traveler prep page | Dev route errored because metadata/dynamic were re-exported from another route | Defined metadata/dynamic locally and re-exported the page default only | Pass |
| `/app` mobile nav | Events | Open event list | Prototype state could feel inert before hydration | Converted launch tab to real link `/app/events` | Pass |
| `/app` mobile nav | Points | Open leaderboard | Prototype state could feel inert before hydration | Converted launch tab to real link `/app/points` | Pass |
| `/app` mobile nav | Profile | Open member profile | Profile incorrectly reused Events state | Converted Profile to real link `/profile` | Pass |
| `/leader?view=overview` | Chapter Leaderboard | Show chapter leaderboard | Button could appear inert before hydration | Converted sidebar item to real link `/leader?view=leaderboard` with hydrated app navigation | Pass |
| `/leader?view=overview` | Member Leaderboard | Show member leaderboard | Button could appear inert before hydration | Converted sidebar item to real link `/leader?view=members` | Pass |
| `/leader?view=overview` | Event Performance | Show event performance | Button could appear inert before hydration | Converted sidebar item to real link `/leader?view=events` | Pass |
| `/leader?view=overview` | Create Event | Show create event form | Button could appear inert before hydration | Converted sidebar item to real link `/leader?view=create_event` | Pass |
| `/leader?view=overview` | Feed Analytics, Succession, etc. | Show matching leader screen | Button could appear inert before hydration | Converted sidebar items to real links with canonical `view=` values | Pass |
| `/leader?view=overview` | Campaigns, Fundraising, SLT, Proof Review, Settings | Do not silently fail | Disabled but visibly labeled as not available | Left disabled with explanatory title | Pass |
| `/staff?view=events` | Staff Events route | Show event/RSVP/attendance/points view | Fell back to Portfolio Overview | Added URL-backed staff shell state and event operations panel | Pass |
| `/staff?view=leaderboard` | Staff Leaderboard route | Show org leaderboard | Fell back to Portfolio Overview | Added URL-backed staff shell state and organization leaderboard panel | Pass |
| `/staff?view=chapters` | Staff top nav | Menu clicks route to their screens | Prototype-only state could feel inert before hydration | Converted top nav to real links with hydrated app navigation | Pass |

## Browser Evidence

Verified with Playwright against the running local app:

- Member: `/app` -> Events, Points, Profile.
- Leader: `/leader?view=overview` -> Chapter Leaderboard, Member Leaderboard, Event Performance, Create Event, Feed Analytics, Succession.
- Staff: `/staff?view=chapters` -> Events, Leaderboard, Campaigns, Proof / UGC, Best Practices, Campaign SOPs, Admin.

Focused browser smoke passed:

```text
PLAYWRIGHT_BASE_URL=http://localhost:3010 pnpm exec playwright test tests/e2e/launch-smoke.spec.ts --project=chromium
4 passed
```

## Remaining Notes

- Admin internal menu still uses the copied admin shell's local state. It was not part of this immediate student command center repair.
- Leader unavailable items remain disabled intentionally in launch mode.
- Live external writes were not enabled or tested.
