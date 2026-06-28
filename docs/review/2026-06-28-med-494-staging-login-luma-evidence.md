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

Superseded hosted result before valid key copy:

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

Superseded key-retrieval blocker before valid key copy:

- A valid Luma API key still needs to be generated or copied from the MEDLIFE Luma account.
- The key should be calendar-scoped for `MEDLIFE Chapters Events Calendar` / `cal-7WNftYCpBJclZyG` if Luma offers that option.
- Once the key is copied, Codex can safely stream it directly from clipboard into Vercel Preview for the branch, clear the clipboard, redeploy the Git-backed preview, re-alias staging, and rerun the hosted proof.

Resolution on 2026-06-28:

- The existing key created by the current Luma user was copied from the Luma Developer settings list.
- The key was validated without printing the secret:
  - `calendar/list-events` returned `HTTP 200`.
  - The response included `5` entries in the local validation sample.
- The key was streamed directly from clipboard into Vercel Preview for
  `feat/MED-494-hosted-staging-read-write-proof` as sensitive env var
  `LUMA_API_KEY`.
- The local clipboard was cleared after transfer.
- The latest Git-backed deployment for commit `c118def` was redeployed after
  the key update:
  - deployment id: `dpl_6tjeYh1LpaBuGFjzfP3oeQVWAZhg`
  - deployment URL: `https://mymedlife-cb7dz3rol-nellis-6036s-projects.vercel.app`
  - branch alias: `https://mymedlife-pwa-git-feat-med-494-hos-5fb6e4-nellis-6036s-projects.vercel.app`
  - staging alias: `https://staging.mymedlife.org`
- Vercel confirms `staging.mymedlife.org` points to that Git-backed Preview deployment.

Hosted staging proof after redeploy:

- Member reviewer:
  - URL: `https://staging.mymedlife.org/app?verify=luma-valid-key`
  - Result: `LUMA READ CONNECTED`
  - Result: `LUMA EVENTS` = `10`
  - Imported event cards appeared from Luma, including `Test value` and MEDLIFE campaign templates.
- Leader reviewer:
  - Identity: `leader.a@mymedlife.test`
  - URL: `/leader?verify=luma-valid-key`
  - Result: `LUMA READ CONNECTED`
  - Result: `10 Luma events are available for leader readback`
  - Leader view connected event posture, RSVP intent, attendance confirmation, and point validation.
- Staff/coach reviewer:
  - Identity: `coach@mymedlife.test`
  - URL: `/staff?verify=luma-valid-key`
  - Result: `LUMA READ CONNECTED`
  - Result: `10 Luma events are available for portfolio review`
  - Staff view connected chapter event health and leaderboard impact while external systems remained manual/read-only.
- Admin/DS reviewer:
  - Identity: `ds.admin@mymedlife.test`
  - URL: `/admin?verify=luma-valid-key`
  - Result: `LUMA READ CONNECTED`
  - Result: `10 Luma events are available through the server-only read path`
  - Admin view exposed imported event visibility, audit/outbox posture, and zero external sends review language.
- Admin outbox reviewer:
  - Identity: `ds.admin@mymedlife.test`
  - URL: `/admin/integration-outbox?verify=luma-valid-key`
  - Result: `LIVE SENDS` = `0`
  - Result: `SECRETS` = `0`
  - Luma, HubSpot, n8n, warehouse, and internal queues remained mock-safe.

Final hosted result:

- Luma server-side read is connected on staging.
- Imported Luma events appear across member, leader, staff, and admin role surfaces.
- The RSVP, attendance, points, and leaderboard loop is visible in role-specific language.
- Luma writes, attendee writes, reminders, webhooks, n8n, HubSpot, warehouse, Power BI, SMS/email, and AI sends remain disabled.
- No raw Luma secret is returned to browser-safe UI data.

The app now shows this plainly on the Luma readback panel:

> LUMA READ CONNECTED
> 10 Luma events are available from the MEDLIFE calendar.
> Luma read-only calendar access is configured. Event creation, RSVP writes, attendance imports, reminders, webhooks, and external sends remain disabled.

## Completion Check

Completed on 2026-06-28:

1. `/app` shows `Luma read connected`.
2. Imported Luma events appear in the member Luma panel.
3. `/leader`, `/staff`, and `/admin` show the same imported event readback.
4. `/admin/integration-outbox` shows `LIVE SENDS 0` and `SECRETS 0`.
5. No Luma writes, attendee writes, reminders, webhooks, n8n, HubSpot, warehouse, Power BI, SMS/email, or AI actions are enabled.

MED-494 can now be treated as hosted-staging readback complete for the
server-only Luma read/import layer. This does not approve Luma writes, attendee
imports, reminders, webhooks, n8n execution, HubSpot sync, warehouse export, or
production rollout.
