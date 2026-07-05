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
| `/app/events` | Student quick navigation | Keep Home / Events / Points / Profile available from the event list | Event route had a back link but not the persistent launch menu | Added shared route quick nav with active Events state | Pass |
| `/app/events/[eventId]` | Student quick navigation + leaderboard CTA | Keep event detail connected to points impact | Event detail linked to points, but route-level menu disappeared | Added shared route quick nav and verified leaderboard impact link | Pass |
| `/app/points` | Student quick navigation | Keep Home / Events / Points / Profile available from leaderboard | Points route had a back link but not the persistent launch menu | Added shared route quick nav with active Points state | Pass |
| `/leader?view=overview` | Chapter Leaderboard | Show chapter leaderboard | Button could appear inert before hydration | Converted sidebar item to real link `/leader?view=leaderboard` with hydrated app navigation | Pass |
| `/leader?view=leaderboard` | Ranked chapter table | Show an unmistakable leaderboard | Screen had chapter benchmark cards but did not read clearly as a leaderboard table | Added ranked chapter leaderboard table with rank, chapter, region, active metric, attendance, points score, health, and best-practice columns | Pass |
| `/leader?view=overview` | Member Leaderboard | Show member leaderboard | Button could appear inert before hydration | Converted sidebar item to real link `/leader?view=members` | Pass |
| `/leader?view=member_profile` | Member Profile | Show member profile landing state | Profile content opened, but the page did not have a clear top-level profile heading | Added Member Profile heading and context copy above the profile metrics | Pass |
| `/leader?view=overview` | Event Performance | Show event performance | Button could appear inert before hydration | Converted sidebar item to real link `/leader?view=events` | Pass |
| `/leader?view=overview` | Create Event | Show create event form | Button could appear inert before hydration | Converted sidebar item to real link `/leader?view=create_event` | Pass |
| `/leader?view=overview` | Feed Analytics, Succession, etc. | Show matching leader screen | Button could appear inert before hydration | Converted sidebar items to normal browser links with canonical `view=` values plus hydrated state updates | Pass |
| `/leader?view=overview` | Campaigns, Fundraising, SLT, Proof Review, Settings | Do not silently fail | Disabled but visibly labeled as not available | Left disabled with explanatory title | Pass |
| `/staff?view=events` | Staff Events route | Show event/RSVP/attendance/points view | Fell back to Portfolio Overview | Added URL-backed staff shell state and event operations panel | Pass |
| `/staff?view=leaderboard` | Staff Leaderboard route | Show org leaderboard | Fell back to Portfolio Overview | Added URL-backed staff shell state and organization leaderboard panel | Pass |
| `/staff?view=chapters` | Staff top nav | Menu clicks route to their screens | Prototype-only state could feel inert before hydration | Converted top nav to real links with hydrated app navigation | Pass |
| `/admin` | Admin vertical menu | Every visible primary menu item opens its matching admin screen | Admin visual shell was not covered by browser click-through evidence | Added browser smoke over Overview, Users, Chapters, Modules, Luma Events, Points, Integrations, Audit Logs, System Health, API Keys, Settings | Pass |
| `/admin` | MCP Connections | Keep MCP out of launch-critical primary menu | MCP was visible as a primary clickable admin item | Removed MCP Connections from primary nav; MCP Analytics remains visibly disabled in Disabled Modules | Pass |
| `/admin` | Footer identity row | Avoid a faux logout control | Footer row looked clickable but did not own logout | Made it informational and pointed reviewers to the real top-right account menu | Pass |
| `/admin` as member | Manual URL access | Redirect unauthorized member away from admin | Not covered in browser smoke | Added browser smoke proving member preview redirects to `/app` | Pass |
| Account menu | Log out | Clear preview actor and return to sign-in | Account menu was unit-tested but not browser-tested | Added browser smoke that opens the account menu, clicks Log out, and lands on `/login` | Pass |

## Browser Evidence

Verified with Playwright against the running local app:

- Member: `/app` -> Events, Points, Profile.
- Member route pages: `/app/events`, first `/app/events/[eventId]`, `/app/points`, and `/profile` through the route quick nav.
- Leader: `/leader?view=overview` -> Chapter Leaderboard, Member Leaderboard, Event Performance, Create Event, Feed Analytics, Succession.
- Leader full menu sweep: Chapter Home, Chapter Leaderboard, Feed Analytics, Member Leaderboard, Member Profile, Event Committees, Event Performance, Create Event, Impact, Bridge Videos, MEDLIFE Stories, Current Leaders, Succession, Values, Leadership Training.
- Staff full menu sweep: Chapters, Events, Leaderboard, Campaigns, Proof / UGC, Best Practices, Campaign SOPs, Admin.
- Admin visual menu sweep: Overview, Users, Chapters, Modules, Luma Events, Points, Integrations, Audit Logs, System Health, API Keys, Settings.
- Access/session checks: member preview redirect away from `/admin`; account menu logout returns to `/login`.

Focused browser smoke passed:

```text
PLAYWRIGHT_BASE_URL=http://localhost:3010 pnpm exec playwright test tests/e2e/launch-smoke.spec.ts --project=chromium
8 passed
```

Additional focused repair run:

```text
PLAYWRIGHT_BASE_URL=http://localhost:3010 pnpm exec playwright test tests/e2e/launch-smoke.spec.ts --project=chromium --grep "leader command center|student command center"
2 passed
```

## Remaining Notes

- Admin internal menu intentionally uses the copied admin shell's local screen state for the visual console, while audited route pages remain available for `/admin/users`, `/admin/chapters`, `/admin/integrations/luma`, `/admin/audit-log`, and `/admin/integration-outbox`.
- Leader unavailable items remain disabled intentionally in launch mode.
- Live external writes were not enabled or tested.
