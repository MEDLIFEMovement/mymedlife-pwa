# MED-494 Staging Login + Luma Event Loop Evidence

Date: 2026-06-28

## Current Status

MED-494 is locally verified and deployed to a protected Vercel staging preview.
Hosted browser proof now works through a temporary Vercel protected-preview
access URL.

This is still a staging-safe review packet. It does not enable production Luma writes, external sends, uploads, or production configuration changes.

## Deployment Evidence

- PR: https://github.com/MEDLIFEMovement/mymedlife-pwa/pull/125
- Branch: `feat/MED-494-hosted-staging-read-write-proof`
- Latest verified commit: `18a8916949e37a9412e03c8d86b609b9571125f0`
- Vercel deployment id: `dpl_GoKz4WysBiyQ5nWVbRFkU6D4GXja`
- Vercel deployment URL: `https://mymedlife-kn6jkwk0s-nellis-6036s-projects.vercel.app`
- Vercel branch alias: `https://mymedlife-pwa-git-feat-med-494-hos-5fb6e4-nellis-6036s-projects.vercel.app`
- Staging alias: `https://staging.mymedlife.org`
- Deployment state: `READY`
- Alias error: none
- Deployment aliases include:
  - `staging.mymedlife.org`
  - `mymedlife-pwa-git-feat-med-494-hos-5fb6e4-nellis-6036s-projects.vercel.app`

## Hosted Browser Proof Completed

- Anonymous `https://staging.mymedlife.org` traffic is protected by Vercel SSO.
- A temporary Vercel protected-preview access URL reaches the myMEDLIFE app.
- `https://staging.mymedlife.org/login` reaches the myMEDLIFE login page after protected-preview access is granted.
- `/login` is one simple myMEDLIFE sign-in surface, not a multi-card role picker.
- `member.a@mymedlife.test` lands on `/app`.
- Member routes expose the event loop:
  - `/rush-month/events?source=luma-loop`
  - `/rush-month/leaderboard?source=luma-loop`
  - `/rush-month/actions/member-push?source=home`
- Seeded role preview reaches the main role surfaces:
  - leader: `/leader`
  - staff/coach: `/staff`
  - admin: `/admin`
  - admin outbox: `/admin/integration-outbox`
  - admin audit: `/admin/audit-log`
- The member, leader, staff, and admin surfaces show the Luma / RSVP / attendance / points / leaderboard story in role-appropriate language.
- Admin outbox safety is visible:
  - `LIVE SENDS 0`
  - `SECRETS 0`
  - mock-safe Luma, HubSpot, and warehouse rows
  - no live-send control enabled

## Validation Commands

- `pnpm vitest run tests/luma-calendar-readiness.test.ts tests/luma-event-loop-pilot.test.tsx`
- `pnpm typecheck`
- `pnpm eslint src/services/luma-calendar-readiness.ts src/services/luma-event-loop-pilot.ts tests/luma-calendar-readiness.test.ts tests/luma-event-loop-pilot.test.tsx`
- `pnpm build`

All checks passed after commit `18a8916`.

## Safety Evidence

- Luma execution remains staging-safe/mock-safe.
- No production Luma writes are enabled.
- No external sends are enabled.
- No raw Luma keys are exposed in browser-facing state.
- Automation outbox execution remains disabled.
- The staging event loop is represented through typed app services and visible review surfaces only.

## Current Blocker

The hosted app can now be reviewed, but the server-side Luma calendar read is
not yet successful.

Fresh recheck on 2026-06-28:

- Chrome passed Vercel protected-preview access after Vercel 2FA.
- `https://staging.mymedlife.org/login` rendered the myMEDLIFE staging login.
- The seeded member reviewer account reached the member home workspace.
- The member home Luma panel still shows `Luma read needs review`.
- The hosted Luma read still returns `HTTP 401`.
- The page still shows `Luma events 0`, and the RSVP, attendance, points, and
  leaderboard loop remains visible through the mock-safe path.
- Safety gates remain visible:
  - Luma event creation and updates are off.
  - Luma RSVP and attendee writes are off.
  - Attendance imports, reminders, webhooks, and n8n sends are off.
  - HubSpot, warehouse, Power BI, SMS/email, and AI actions are off.
  - No Luma secret is returned to browser-safe UI data.

Credential transfer / redeploy recheck on 2026-06-28:

- The approved Luma API key was transferred from the local clipboard into
  Vercel Preview for `feat/MED-494-hosted-staging-read-write-proof`.
- The local clipboard was cleared after transfer.
- A local CLI preview deployment was created, but it did not inherit the
  branch-scoped Luma variables, so it was not used for final staging proof.
- The latest Git-backed deployment for commit `dce6fce` was redeployed after
  the key update:
  - deployment id: `dpl_7iBTeMqe6T8aXNWtBe2uuswqnxzW`
  - deployment URL: `https://mymedlife-r6q7mc584-nellis-6036s-projects.vercel.app`
  - branch alias: `https://mymedlife-pwa-git-feat-med-494-hos-5fb6e4-nellis-6036s-projects.vercel.app`
  - staging alias: `https://staging.mymedlife.org`
- Vercel confirms `staging.mymedlife.org` points to that Git-backed branch
  deployment.
- The redeployed staging member route still returns `Luma read needs review`
  with `HTTP 401`.
- Current conclusion: the app, branch alias, and Vercel env target are wired,
  but the supplied Luma credential is still rejected by Luma for calendar
  `cal-7WNftYCpBJclZyG`.

Current hosted result:

- `LUMA_API_KEY` and `LUMA_CALENDAR_ID` appear to be present in the Vercel Preview environment.
- Luma rejects the staged credential with `HTTP 401`.
- Imported Luma events do not appear yet.
- Existing mock event-loop cards still appear, and every write/send remains blocked.

Luma UI/key retrieval attempt on 2026-06-28:

- Safari reached the live calendar at `https://lu.ma/medlife-events`.
- Calendar ownership/access was confirmed by the visible `Manage` link.
- The calendar management URL opened for `cal-7WNftYCpBJclZyG`.
- Settings and likely developer/API key URLs were attempted:
  - `https://luma.com/calendar/manage/cal-7WNftYCpBJclZyG/settings`
  - `https://luma.com/calendar/manage/cal-7WNftYCpBJclZyG/settings/developer`
  - `https://luma.com/calendar/manage/cal-7WNftYCpBJclZyG/settings/api-keys`
  - `https://lu.ma/home/settings/integrations`
- Those pages remained in Luma loading-placeholder state, so no API-key control was safely reachable through automation.
- Chrome was not signed into Luma and the Luma sign-in page did not render usable controls.
- Local clipboard was checked for key-shaped content without printing values; it did not contain a clean Luma API key candidate.

Current key-retrieval blocker:

- A valid Luma API key still needs to be generated or copied from the MEDLIFE Luma account.
- The key should be calendar-scoped for `MEDLIFE Chapters Events Calendar` / `cal-7WNftYCpBJclZyG` if Luma offers that option.
- Once the key is copied, Codex can safely stream it directly from clipboard into Vercel Preview for the branch, clear the clipboard, redeploy the Git-backed preview, re-alias staging, and rerun the hosted proof.

The app now shows this plainly on the Luma readback panel:

> Luma calendar read returned HTTP 401. The server has Luma config, but Luma rejected the staged credential. Refresh LUMA_API_KEY in the Vercel Preview environment before treating imported events as verified.

## Required Fix

Refresh the Preview-scoped `LUMA_API_KEY` for the
`feat/MED-494-hosted-staging-read-write-proof` branch, then let Vercel redeploy.

Use the existing safe values:

- `LUMA_CALENDAR_ID`: `cal-7WNftYCpBJclZyG`
- `LUMA_API_KEY`: generate or copy a valid Luma API key from the MEDLIFE Luma account
- Environment: Vercel Preview
- Branch scope: `feat/MED-494-hosted-staging-read-write-proof`
- Do not add the key to `.env.example`, GitHub, Linear, screenshots, logs, or browser-visible state

After redeploy, re-open `https://staging.mymedlife.org` through Vercel
protected-preview access and confirm:

1. `/app` shows `Luma read connected`.
2. Imported Luma events appear in the member Luma panel.
3. `/leader`, `/staff`, and `/admin` show the same imported event readback.
4. `/admin/integration-outbox` still shows `LIVE SENDS 0` and `SECRETS 0`.
5. No Luma writes, attendee writes, reminders, webhooks, n8n, HubSpot, warehouse, Power BI, SMS/email, or AI actions are enabled.

Do not mark MED-494 or the Luma Event Loop Live Pilot Foundation complete until
the refreshed credential proves imported Luma events on hosted staging.
