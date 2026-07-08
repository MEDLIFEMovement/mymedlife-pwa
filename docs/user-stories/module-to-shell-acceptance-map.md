# myMEDLIFE Module-To-Shell Acceptance Map

Date: 2026-07-07  
Owner lane: myMEDLIFE #5, planning/docs only  
Planning reference: MED-512  
Purpose: give Coordinator and `#1`-`#4` a short repo-truth map of which narrow
launch and adjacent modules belong to which shell, what "good enough to review"
means for each one, and where rollout or write-readiness must still stay
blocked.

## Sources Inspected

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/user-story-gap-report.md`
- `docs/user-stories/delivery-backlog.md`
- `docs/user-stories/story-to-test-traceability.md`
- `docs/user-stories/latest-main-builder-crosswalk.md`
- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `src/app/app/stories/page.tsx`
- `src/app/app/slt-prep/page.tsx`
- `src/app/leader/page.tsx`
- `src/app/staff/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/system-health/page.tsx`
- `src/app/admin/integration-outbox/page.tsx`
- `src/app/admin/integrations/luma/page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- `src/components/figma-member-stories-page.tsx`
- `src/components/figma-leader-command-center.tsx`
- `src/components/figma-leader-stories-screen.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`
- `docs/figma-code-contract.md`
- `docs/figma-shell-contract-map.md`
- `docs/figma-route-audit.md`
- `docs/figma-fidelity-review-login-slt.md`

## Reading Rules

- Repo truth wins for implementation status.
- Figma/exported code is the visual and navigation contract, not production
  proof.
- Screenshots are acceptance checks only.
- Visible fake people, chapters, events, stories, proof, providers, audit
  actors, and metrics must keep `TEST`.
- A module is only `launch-reviewable` when the shell is visible, route-backed,
  and honest about blocked actions.
- A module is not rollout-ready just because it looks complete.

## Module Map

| Module | Primary shell owner | Primary routes / surfaces | Current repo truth | Acceptance posture now | Next owner lane | Must stay blocked |
| --- | --- | --- | --- | --- | --- | --- |
| Login | shared entry | `/login` | partial | Single sign-in entry, correct role routing, no production proof claims | Data/Safety + `#4` | production account proof assumptions |
| Member home + bottom nav | General Member App | `/app` | built shell / mock-safe | Route-backed shell, no silent taps, TEST fake rows | `#1` | real data claims, rollout proof |
| Member events | General Member App | `/app/events`, `/app/events/[eventId]` | partial | Source-faithful list/detail, preview-safe RSVP/check-in handoff | `#1` | RSVP writes, check-in writes, attendance writes |
| Member points + leaderboard | General Member App | `/app/points` | partial | Readback only, route-backed from events/home, no award-authority language | `#1` | points mutation, Smile.io, reward claims |
| Member Stories | General Member App | `/app/stories` | preview-only | IG-style feed feel from exported shell, preview-only reactions/share/save, TEST story rows | `#1` | publishing, comments, consent approval, provider sync |
| Member SLT Prep entry | General Member App | `/app/slt-prep` | preview-only / source-confidence limited | Member-shell handoff is honest; route may exist without claiming full source parity | `#1` | payments, forms, traveler writes, provider sync |
| Standalone SLT Prep | SLT module outside narrow launch | `/slt-prep/*` | preview-only / blocked-source-confidence | Visible only as staged/mock-safe module; not part of first invite-gate truth | `#1` for shell posture, later dedicated lane for deeper work | payment/forms/Drive/HubSpot/Luma/Zoom/trip writes |
| Leader overview | Student Leadership | `/leader?view=overview` | built shell / partial data | Exported shell/menu fidelity, TEST fake metrics, no silent controls | `#2` | role/member mutations, production proof claims |
| Leader events + attendance | Student Leadership | `/leader?view=events`, `attendance` | partial | Route-backed review surfaces, preview-only operations copy | `#2` | event writes, attendance imports, follow-up sends |
| Leader leaderboard | Student Leadership | `/leader?view=leaderboard` | partial | Readback only, TEST fake rows, no live points/export claims | `#2` | point mutation, exports, rewards |
| Leader support/culture surfaces | Student Leadership | `stories`, `values`, `succession`, `training`, `impact`, `bridge` | preview-only | Source-faithful visible screens, preview-safe controls, TEST sample content | `#2` | publishing, succession writes, assignments, shares |
| Staff chapters / portfolio | Staff Command Center | `/staff?view=chapters` | built shell / partial data | Top nav, filters, chapter detail handoffs visible and honest | `#3` | intervention writes, exports, reminders |
| Staff events / leaderboard readback | Staff Command Center | `/staff?view=events`, leaderboard surfaces | partial | Read-only coaching/support posture, no live ops language | `#3` | event writes, points mutation, notifications |
| Staff campaigns / Rush Month | Staff Command Center | campaign list/detail/review surfaces | preview-only | Source-backed preview shell, TEST fake campaigns, blocked publish/sync actions | `#3` | publish, QR/contact capture, invite sends |
| Staff proof / UGC / best practices / SOPs | Staff Command Center | proof feed, best-practice, SOP panels | preview-only | Visible and route-backed where present, explicit preview-only governance posture | `#3` | consent approval, moderation, publish, n8n/provider sends |
| Staff admin handoff | Staff Command Center into DS Admin | `/staff?view=admin` | partial | Safe handoff into dark admin shell, no hidden admin families | `#3` | admin write authority from staff shell |
| DS Admin shell/menu | DS Admin | `/admin` | built shell / partial ops | Dark admin menu family intact, source-backed visible modules, TEST fake rows | `#3` | production-ready claims from shell alone |
| DS Admin integrations / API Keys / MCP | DS Admin | `/admin`, `/admin/integration-outbox`, `/admin/integrations/luma` | preview-only | Masked/blocked/read-only controls, visible menu fidelity, no secret exposure | `#3` | provider connect/test/send, key reveal/rotate, MCP writes |
| DS Admin System Health + Audit Logs | DS Admin | `/admin/system-health`, `/admin/audit-log` | partial / preview-only | Read-only clarity, route-backed review surfaces, no live ops language | `#3` | audit mutation, incident actions, live repair actions |
| Admin users / chapters / access review | DS/Admin review | `/admin/users`, `/admin/chapters`, `/admin/access` | partial | Review surfaces stay visible; blocked mutation posture is explicit | `#3` + Rollout Evidence later | invites, owner CSV apply, role/chapter writes |
| Launch gate / release readiness | Admin / rollout overlay | `/admin/launch-gate`, related readiness pages | staged / blocked | Must clearly refuse rollout without real evidence | Rollout Evidence + `#4` | any UI-only gate advancement |

## Underdefined But Important Modules

### SLT Prep

- Current truth: real route family exists, but exact exported source confidence
  remains limited compared with member, leader, and admin shells.
- Honest posture now: treat SLT as preview-only and TEST-labeled inside the
  member shell unless a stronger source bundle is provided.
- What good review looks like: no silent redirects that pretend final parity,
  no live traveler/payment/forms/provider language.

### Stories

- Current truth: member and leader stories surfaces are visually rich and
  source-backed enough for shell fidelity review, but they remain governance and
  consent blocked.
- Honest posture now: preview-only feed, blocked reactions/publish/share if not
  truly wired, TEST fake stories and fake social proof.

### DS Admin Menus

- Current truth: dark shell/menu family is repo-backed and acceptance-backed,
  including Integrations, System Health, API Keys, and MCP Connections.
- Honest posture now: keep every source-backed menu family visible, even when
  the route is read-only or blocked.

### Integrations Surfaces

- Current truth: provider/admin/integration panels are useful review surfaces
  but not operational proof.
- Honest posture now: masked values, blocked verbs, no live-ready language, no
  secret exposure, no production write implication.

## Narrow-Launch Truth Snapshot

### Built or launch-reviewable now

- Member home shell and bottom nav
- Member events/detail/points routes as reviewable shells
- Leader overview shell/menu
- Staff chapter portfolio shell/menu
- DS Admin dark shell/menu

### Preview-only or mock-safe now

- RSVP, check-in, attendance, points authority
- Stories/proof/UGC interactions
- Leader support/culture screens
- Staff campaigns/proof/SOPs
- SLT Prep
- Integrations/API/MCP/admin ops verbs

### Rollout-gated now

- Owner CSV truth
- Production signed-in proof by role
- Live counts
- Pilot event proof
- Audit/outbox zero-send proof
- Final invite gate

## Coordinator Use

- Use this map when a builder needs the next 3-5 slices without rereading the
  full story set.
- Use `builder-ticket-packet.md` for immediate assignments.
- Use `latest-main-builder-crosswalk.md` for ranked next slices.
- Use `story-to-test-traceability.md` when deciding whether a slice is merely
  visible, locally tested, or still rollout-blocked.

## Matrix Recommendation

This map is planning/documentation only and should not move readiness
percentages by itself.
