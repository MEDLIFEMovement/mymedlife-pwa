# MED-494 Staging Login + Luma Event Loop Evidence

Date: 2026-06-28

## Current Status

MED-494 is locally verified and deployed to a protected Vercel staging preview.

This is still a staging-safe review packet. It does not enable production Luma writes, external sends, uploads, or production configuration changes.

## Deployment Evidence

- PR: https://github.com/MEDLIFEMovement/mymedlife-pwa/pull/125
- Branch: `feat/MED-494-hosted-staging-read-write-proof`
- Latest verified commit: `75d96b61ceccd044cf1b94e5f4c949e2a8b675f2`
- Vercel deployment id: `dpl_BtddUkerGUKBkQfk2t9V1zokfpRH`
- Vercel deployment URL: `https://mymedlife-lrg3qszk7-nellis-6036s-projects.vercel.app`
- Vercel branch alias: `https://mymedlife-pwa-git-feat-med-494-hos-5fb6e4-nellis-6036s-projects.vercel.app`
- Staging alias: `https://staging.mymedlife.org`
- Deployment state: `READY`
- Deployment aliases include:
  - `staging.mymedlife.org`
  - `mymedlife-pwa-git-feat-med-494-hos-5fb6e4-nellis-6036s-projects.vercel.app`

## Local Browser Proof Completed

- Signed-out `/` redirects to `/login`.
- `/login` is one simple myMEDLIFE sign-in surface, not a multi-card role picker.
- `nellis@medlifemovement.org` with password `6598` routes to `/admin`.
- `member.a@mymedlife.test` with password `password` routes to the student home and cannot enter `/admin`.
- `leader.a@mymedlife.test` with password `password` routes to `/leader`.
- `/leader?view=events` shows:
  - staging-safe Luma link status
  - QR status
  - event stored in myMEDLIFE
  - shared-to-feed step
  - member RSVP step
  - attendance-to-points step
  - one-time points award
- `sales.coach@mymedlife.test` with password `password` routes to `/staff`.
- `/staff?view=chapters` shows event, RSVP, attendance, and points analytics together.
- Manual `/login` while already signed in redirects to the owned workspace.

## Validation Commands

- `pnpm test -- tests/staging-luma-event-loop.test.ts tests/login-actions.test.ts tests/login-page.test.tsx tests/local-actor-context.test.ts tests/home-page-login-first.test.tsx tests/member-rush-month-events-panel.test.ts tests/chapter-leader-command-center.test.ts tests/staff-command-center.test.ts tests/admin-page.test.tsx`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

All checks passed after commit `75d96b6`.

## Safety Evidence

- Luma execution remains staging-safe/mock-safe.
- No production Luma writes are enabled.
- No external sends are enabled.
- No raw Luma keys are exposed in browser-facing state.
- Automation outbox execution remains disabled.
- The staging event loop is represented through typed app services and visible review surfaces only.

## Remaining Hosted Proof

The Vercel deployment and staging alias are ready, but browser-level hosted proof is still blocked by Vercel SSO unless a reviewer signs into Vercel or a temporary protected preview access path is provided.

Remaining steps:

1. Open `https://staging.mymedlife.org` in a browser with Vercel SSO access.
2. Confirm signed-out traffic reaches `/login`.
3. Sign in with `nellis@medlifemovement.org` / `6598` and confirm `/admin`.
4. Sign out.
5. Sign in with a member test account and confirm `/app` or member home.
6. Sign in with a leader test account and confirm `/leader?view=events` shows the Luma sequence.
7. Sign in with a staff/coach test account and confirm `/staff?view=chapters` shows event/RSVP/attendance/points analytics.
8. Confirm `/admin` shows the Luma/outbox/status posture.
9. Record screenshots or route-level notes back to MED-494.

Do not mark MED-494 fully complete until the hosted browser proof above is recorded.
