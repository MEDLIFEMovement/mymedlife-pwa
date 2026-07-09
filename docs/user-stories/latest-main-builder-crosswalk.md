# myMEDLIFE Latest-Main Builder Crosswalk

Date: 2026-07-09
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: give Coordinator a compact, latest-main steering view for the active
three-shell builders without re-reading the full story inventory, delivery
backlog, and story-to-test traceability map.

## Current MED-512 Queue Overlay

Use this queue overlay before the older backlog table below when assigning the
next live branch:

1. `#619` is merged, so stop treating it as active queue work.
2. `#618` is merged, so stop treating it as active queue work.
3. `#620` is merged and public no-write smoke stayed `11/11` green after the
   merge. Do not keep its staff/admin seam in the pending queue.
4. `#621` is merged.
5. `#624` is now the new member front candidate; it is open, draft, mergeable,
   and green on checks.
6. `#2` should return to local leader follow-on shaping after the `#619`
   landing, keeping attendance, member review, and simple-leaderboard continuity
   narrow.
7. `#3` should shape the next staff/admin seam locally while member `#624`
   clears draft/merge posture, with emphasis on chapter oversight honesty,
   embedded Admin context, and visible TEST-label coverage.
8. `#4` should watch `#624` for scope, TEST labels, route evidence, and no
   rollout-proof inflation. `#6` should stay quiet unless real proof artifacts
   appear.

Rollout-proof truth is unchanged. Shell merges, public no-write smoke, green CI,
and TEST/sandbox rows may support `Scope/UI` or `QA/Ops` discussion, but they do
not prove owner data, signed-in production authority, provider writes, pilot
readiness, or rollout approval.

## Sources Inspected

- Repo `origin/main` after the `#621` merge.
- Merged planning docs:
  - `docs/user-stories/master-user-story-inventory.md`
  - `docs/user-stories/narrow-launch-mvp-stories.md`
  - `docs/user-stories/user-story-gap-report.md`
  - `docs/user-stories/delivery-backlog.md`
  - `docs/user-stories/story-to-test-traceability.md`
- Current queue evidence:
  - `#617` merged.
  - `#620` merged.
  - `#619` merged.
  - `#618` merged.
  - `#621` merged.
  - `#624` open, draft, mergeable, and green on checks.
- Coordinator-reported public no-write smoke: 11/11 passed after `#620`.

## How To Use This Crosswalk

- Use this as the short steering layer for assigning the next #1/#2/#3 slices.
- Use `delivery-backlog.md` for the full 50-slice backlog and
  `story-to-test-traceability.md` for test/proof details.
- Do not use this planning doc to move readiness percentages by itself.
- Keep visible fake/sandbox/Figma-derived content labeled `TEST`.
- Keep UI shell work separate from Data/Safety and Rollout Evidence work.

## #1 General Member App Queue

| Priority | Backlog ID | Suggested next slice | Why now | In scope | Do not touch | Matrix if landed/smoked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `BL-001` | Member `/app/events` + event detail + RSVP/check-in + `/app/points` handoff polish. | Highest narrow-launch value; story-to-test map shows strong local coverage but rollout proof is still missing. | `src/app/app/events/*`, `src/app/app/points/page.tsx`, member shell links/tests as needed. | Auth, real RSVP/attendance writes, points ledger authority, Luma/provider writes, rollout proof. | Possible modest Member/Events/Points `Scope/UI` and `QA/Ops` only. |
| 2 | `BL-006` | Member points readback wording and leaderboard preview honesty. | Tightens the event-to-points loop after the event handoff slice. | `/app/points`, member points cards, read-only leaderboard copy/tests. | Smile.io/rewards, award authority, provider sync, production leaderboard proof. | Possible modest Points `Scope/UI` and `QA/Ops` only. |
| 3 | `BL-003` | Member Profile source-fidelity and privacy-copy pass. | Useful launch-adjacent surface; should remain clearly read-only/private-safe. | `/profile`, member profile links, profile privacy copy/tests. | Profile/contact/emergency/traveler writes, HubSpot/contact sync, signed-in production proof. | Possible modest Member/Profile `Scope/UI` and `QA/Ops` only. |
| 4 | `BL-004` | `/app/slt-prep` member-shell integration closeout. | Keep SLT visible where source-backed, but outside first invite-gate truth. | `/app/slt-prep`, member entry/handoff copy/tests. | Payment/forms/Drive/Shopify/HubSpot/Luma/Zoom/trip registration/staff approval writes. | Possible modest SLT `Scope/UI` and `QA/Ops`; no rollout movement. |
| 5 | `BL-005` | Member bottom-nav and no-silent-tap sweep. | Good fallback if event/points work is already in flight. | Member bottom nav, route-backed links, disabled/blocked states. | Leader/staff/admin files, data/auth, rollout proof. | Possible modest Member App `Scope/UI` and `QA/Ops` only. |

## #2 Student Leadership / Chapter Command Center Queue

| Priority | Backlog ID | Suggested next slice | Why now | In scope | Do not touch | Matrix if landed/smoked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `BL-013` | Leader event/attendance handoff closeout. | Aligns leader shell with the member event loop without enabling writes. | `/leader` event/attendance views, route/control copy, leader tests. | Event creation writes, attendance import, Luma sync, follow-up sends, member shell files. | Possible modest Leader/Events `Scope/UI` and `QA/Ops` only. |
| 2 | `BL-014` | Leader leaderboard/comparison source-fidelity polish. | Keeps points visibility consistent across member and leader views. | `/leader?view=leaderboard`, comparison/readback copy/tests. | Point mutations, exports, rewards, provider sync, production leaderboard proof. | Possible modest Leader/Points `Scope/UI` and `QA/Ops` only. |
| 3 | `BL-018` | Training, Values, Succession, Impact, Bridge Videos, MEDLIFE Stories parity sweep. | Latest leader shell work improved roster/review posture; support/culture remains preview-only but visible. | Leader support/culture views and preview controls. | Publish/share/assign/promote/succession writes, story/proof production evidence. | Possible modest Leader support/culture `Scope/UI` and `QA/Ops` only. |
| 4 | `BL-016` | Leader create-event preview honesty. | Useful if event/attendance UI exposes create/publish-looking actions. | Create Event preview route/panel and blocked-state copy/tests. | myMEDLIFE or Luma event writes, reminders, outbox sends. | Possible modest Leader Events `Scope/UI` and `QA/Ops` only. |
| 5 | `BL-017` | Committees/tasks visible-control honesty. | Future-facing leader workflow that must stay preview-safe. | Committee/task UI, TEST labels, blocked actions/tests. | Task writes, committee/role/member mutation, notifications, points awards. | Possible modest Leader/Assignments `Scope/UI` and `QA/Ops` only. |

## #3 Staff / DS Admin Command Center Queue

| Priority | Backlog ID | Suggested next slice | Why now | In scope | Do not touch | Matrix if landed/smoked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `BL-028` | DS Admin Integrations / API Keys / MCP blocked-state clarity. | High-risk Renato-facing/admin surface; wording must not sound live. | `/admin` integration/API/MCP panels and admin tests. | Secrets exposure, key rotate/revoke/copy live, provider connect/test/send. | Possible modest Admin/DS `Scope/UI` and `QA/Ops` only. |
| 2 | `BL-029` | System Health + Audit Logs read-only clarity. | Complements integration safety with admin-ops proof posture. | `/admin/system-health`, `/admin/audit-log`, read-only copy/tests. | Live health operations, audit mutation, incident actions. | Possible modest Admin/DS `Scope/UI` and `QA/Ops` only. |
| 3 | `BL-030` | Users / Chapters / Access review surface parity. | Important launch review surface; must keep owner-truth separate from rollout evidence. | `/admin/users`, `/admin/chapters`, `/admin/access`, blocked mutation copy/tests. | Owner CSV apply, invites, role/chapter/user production writes. | Possible modest Admin review `Scope/UI` and `QA/Ops` only. |
| 4 | `BL-023` | Staff Campaigns / Rush Month deeper parity. | Staff launch support surface remains preview-only and source-backed. | Staff campaign views, campaign detail/review handoffs, tests. | Campaign publish, QR/contact lead capture, provider sync, invite sends, points awards. | Possible modest Staff Campaigns `Scope/UI` and `QA/Ops` only. |
| 5 | `BL-024` | Staff Proof / UGC visible-control closeout. | Proof surfaces can look production-like unless copy/control state stays honest. | Staff proof/UGC views, blocked moderation/publish controls, tests. | Proof ingestion, consent approval, publishing, social/provider sync. | Possible modest Proof/UGC `Scope/UI` and `QA/Ops` only. |

## #4 QA / Release Watch Queue

| Priority | Backlog ID | Suggested next slice | Why now | Evidence to capture | Must not claim |
| --- | --- | --- | --- | --- | --- |
| 1 | `BL-046` | Mobile device QA for member event/points loop. | The member shell is mobile-first; desktop public smoke is necessary but insufficient. | iPhone Safari/Chrome and Android Chrome where available, screenshots or recordings for `/app`, `/app/events`, detail, RSVP, check-in, `/app/points`. | Data/Auth, Writes/Integrations, Rollout Gate, production proof. |
| 2 | `BL-044` | Three-shell PR acceptance checklist refresh. | Keeps review consistent as #1/#2/#3 continue in parallel. | Source evidence, file scope, visible TEST labels, blocked controls, checks, and smoke. | Implementation assignment or matrix movement. |
| 3 | `BL-045` | Visible TEST label audit after each shell PR. | TEST labeling is a product requirement and visual QA failure condition. | Browser review notes showing fake visible rows include `TEST`; clean product/provider/menu labels stay clean. | Internal variable renaming, production data proof. |
| 4 | `BL-032` | Staff/Admin visual QA and public no-write smoke. | Renato-facing staff/admin/admin-shell surfaces are high perception risk. | `/staff`, `/staff?view=admin`, `/admin`, Audit, System Health, API/MCP screenshots. | Live admin/provider readiness or production evidence. |

## Immediate Coordination Recommendation

If all builders are available, assign in parallel:

1. `#1` -> `BL-001` member event/detail/RSVP/check-in/points handoff polish.
2. `#2` -> `BL-013` leader event/attendance handoff closeout.
3. `#3` -> `BL-028` DS Admin integrations/API/MCP blocked-state clarity.
4. `#4` -> `BL-046` mobile device QA for the member event/points loop.

If only one UI builder can move first, prioritize `#1 BL-001` because it is the
closest narrow-launch user path and already has the strongest local test
scaffold.

## Matrix Guidance

This crosswalk is planning/documentation only and should not move readiness
percentages by itself. A landed and smoked UI slice can support modest
`Scope/UI` and `QA/Ops` movement for the affected module. `Data/Auth`,
`Writes/Integrations`, and `Rollout Gate` require matching safety contracts,
real production evidence, or approved rollout artifacts.
