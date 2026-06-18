# Goal 119: Member Leaderboard Route

Goal 119 turns member recognition into a direct route-level flow at
`/rush-month/leaderboard`.

The page gives members a mobile-friendly place to review:

- their points
- their rank
- recognition text
- chapter impact metrics
- friendly leaderboard context
- the next action that can move their standing

Leaders, coaches, Admin, and Super Admin can inspect the same recognition
context for operating review. DS Admin remains restricted because student
points, recognition, and leaderboard truth are app-owned chapter data.

## Files

- `src/app/rush-month/leaderboard/page.tsx`
- `src/services/member-leaderboard-workspace.ts`
- `src/services/role-visibility.ts`
- `src/services/app-route-registry.ts`
- `src/services/route-smoke-manifest.ts`
- `src/services/static-route-metadata.ts`
- `tests/member-leaderboard-workspace.test.ts`

## Safety

Expected writes remain zero:

- browser writes expected: `0`
- external writes expected: `0`
- no points ledger write
- no KPI write
- no leaderboard mutation
- no member nudge
- no HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI write

The page reuses the mock read-only recognition summary. Production points must
still come from approved evidence review and audited server-side write paths.

## Review

Open `/rush-month/leaderboard` as:

- `member.a@mymedlife.test`
- `committee.member@mymedlife.test`
- `leader.a@mymedlife.test`
- `coach@mymedlife.test`
- `admin@mymedlife.test`
- `super.admin@mymedlife.test`

Then open it as `ds.admin@mymedlife.test` and confirm the restricted state.
