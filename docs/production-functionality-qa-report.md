# Production Functionality QA Report

Date: 2026-07-05

Status: local branch QA passed for the launch-lane functionality wiring. Not production-promoted from this report alone.

## What Passed

- Login redirects signed-out visitors to the one sign-in area.
- Member mobile app loads with a preview member actor.
- Member event list, event detail, points page, profile link, and quick navigation are clickable.
- Member shell RSVP -> confirmation -> check-in -> `+20 points` -> points view is clickable.
- Student leader command center loads with a preview leader actor.
- Student leader menu items route to matching `view=` screens.
- Leader leaderboard shows a ranked leaderboard and points score column.
- Staff command center loads with a preview staff actor.
- Staff Events and Leaderboard menu items route to real matching screens.
- Staff chapter table filter preserves Type, RSVP, Attended, and Points columns.
- Admin visual menu items are clickable in the copied admin shell.
- Route-level admin Users, Chapters, Access, Luma, Audit Log, and Integration Outbox pages load for DS Admin.
- Unauthorized member access to `/admin` redirects back to `/app`.
- Account menu logout returns to `/login`.

## Commands Run

```text
pnpm lint
passed

pnpm typecheck
passed

pnpm test tests/route-coverage-summary.test.ts tests/route-smoke-manifest.test.ts tests/production-core-route-smoke.test.ts
3 files passed, 8 tests passed

pnpm test
168 files passed, 1079 tests passed

pnpm e2e
11 tests passed

pnpm build
passed

pnpm production:smoke https://www.mymedlife.org
11/11 checks passed
```

The Playwright run rebuilt the app before starting the local test server.

## Code And Test Changes

- Added `/admin/users`, `/admin/chapters`, and `/admin/access` to the launch-lane smoke manifest.
- Added `/admin` to the unauthenticated production route smoke check.
- Added browser coverage for the member event RSVP/check-in/points loop.
- Added browser coverage for staff chapter type filtering with event and points columns.
- Added browser coverage for the route-level Admin Access page.

## Safety Results

- Expected browser writes: `0`
- Expected external writes: `0`
- Luma secrets exposed: no
- Luma writes enabled: no
- HubSpot/n8n/warehouse/Power BI/SMS/email/AI writes enabled: no
- Admin route access: server-guarded and browser-tested for unauthorized member redirect

## Still Not Proven Here

- Hosted staging smoke after this branch is merged/deployed.
- Production branch content after merge/deployment. The public smoke passed, but that only confirms current public route behavior.
- Real production auth/account creation.
- Production Supabase RLS proof.
- Live Luma create/update, RSVP writeback, or attendance import.
- Production points ledger materialization.
- 5-chapter real-user rollout.

## Bottom Line

The branch is ready for review as a launch-lane wiring and QA pass. It makes the app easier to review and harder to misread, but it does not by itself make myMEDLIFE production-ready.
