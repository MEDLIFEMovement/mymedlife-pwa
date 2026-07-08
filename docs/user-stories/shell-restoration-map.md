# Three-Shell Restoration Map

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: convert repo truth plus exported-source intent into a restoration map
for the three active shell builders.

## Reading Rules

- Repo truth wins for implementation status.
- Exported Figma/code is the visual and navigation contract, not proof of live
  data, writes, integrations, or rollout readiness.
- Screenshots are acceptance checks only.
- Visible fake/sandbox/Figma-derived content must keep `TEST` until replaced by
  approved real data or hidden.
- Shell/UI progress, QA/smoke progress, and rollout-proof progress are separate
  evidence categories.

## Sources Inspected

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/user-story-gap-report.md`
- `docs/user-stories/member-shell-acceptance-packet.md`
- `docs/user-stories/leader-shell-acceptance-packet.md`
- `docs/user-stories/staff-admin-shell-acceptance-packet.md`
- `docs/user-stories/module-to-shell-acceptance-map.md`
- `docs/user-stories/current-shell-wave-sequencing.md`
- `src/app/app/page.tsx`
- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `src/app/app/stories/page.tsx`
- `src/app/app/slt-prep/page.tsx`
- `src/app/slt-prep/page.tsx`
- `src/app/leader/page.tsx`
- `src/app/staff/page.tsx`
- `src/app/admin/page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- `src/components/figma-member-stories-page.tsx`
- `src/components/figma-leader-command-center.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`
- `/Users/codex/Desktop/myMEDLIFE App Prototype/src/app/App.tsx`
- `/Users/codex/Desktop/myMEDLIFE App Prototype/src/imports/pasted_text/story-data.ts`
- `/Users/codex/Desktop/myMEDLIFE App Prototype/src/imports/pasted_text/ui-components.tsx`
- `/Users/codex/Desktop/myMEDLIFE SLT Prep Phase/src/app/routes.tsx`

## Shell Summary

| Shell | Builder | Repo truth now | Export/source intent to preserve | Next restoration focus |
| --- | --- | --- | --- | --- |
| General Member App | `#1` | Routes exist for `/app`, events/detail, points, Stories, profile, and `/app/slt-prep`; most operating actions are preview-only. | Mobile app shell, bottom-nav family, IG-style Stories feel, event-to-points continuity, SLT as member-shell entry rather than fake-live travel app. | Member Stories IG feel + route honesty, then SLT/member bottom-nav continuity and event/points handoff review. |
| Student Leadership / Chapter Command Center | `#2` | `/leader?view=*` has service-backed views plus Figma fallback screens; leader writes remain blocked. | Dark sidebar/menu families for Chapter, Members, Event Operations, Impact & Culture, and Leadership. | Menu/view continuity across Member Profile, Current Leaders, Succession, Values, Leadership Training, and review-loop handoffs. |
| Staff / DS Admin Command Center | `#3` | `/staff?view=*`, embedded Admin, and `/admin` shell exist; proof/admin/provider operations are preview-only or blocked. | Staff top nav, chapter drawer, Proof/UGC review queue, embedded dark Admin, DS Admin left menu depth. | Staff/Admin walkthrough coherence across chapter drawer, embedded Admin, Proof/UGC review, admin labels, launch-gate posture, API/MCP blocked states. |

## Current Visible-UI Versus Operating Truth

| Area | Visible UI can look complete | Repo-truth caveat |
| --- | --- | --- |
| Member RSVP / check-in / points | Event cards, detail pages, points readback, and leaderboard cues are visible. | RSVP/check-in/attendance/points award authority still needs approved data/write/proof boundaries. |
| Member Stories | Feed, story cards, reactions, share, save, and reader affordances are visible. | Social interactions, publishing, comments, consent, storage, provider sync, and production proof remain blocked or preview-only. |
| Member SLT Prep | `/app/slt-prep` and standalone `/slt-prep/*` routes exist. | Travel readiness, forms, payments, scholarships, provider sync, reminders, and profile writes are not production-live. |
| Leader command center | Menu and deep-link views are route-backed. | Role changes, succession, assignments, event creation, attendance import, notifications, and points awards remain blocked. |
| Staff/Admin | Staff drawer, Proof/UGC, embedded Admin, and DS Admin menu families are visible. | Proof approval, publishing, provider sync, API key actions, MCP connections, audit mutation, user/role/chapter writes, and launch-gate advancement remain blocked. |

## Restoration Priority

1. `#1` Member Stories IG feel and route honesty, using exported Stories source
   as the visual contract and repo preview controls as the safety boundary.
2. `#1` `/app/slt-prep` member-shell placement, ensuring SLT reads as a student
   app entry/handoff, not a standalone fake-live travel workflow.
3. `#2` leader menu/view parity across service-backed and Figma fallback views,
   especially Member Profile, Current Leaders, Succession, Values, Leadership
   Training, and review loops.
4. `#3` staff/admin menu depth and walkthrough coherence: chapter drawer,
   Proof/UGC review, embedded Admin, Chapters, Audit, System Health, API Keys,
   MCP Connections, Settings, and Launch Gate.
5. `#4` review/smoke classification after each shell PR, with no rollout-proof
   inflation.

## Matrix Language

Shell restoration PRs may support `Scope/UI` and, if tested/smoked, `QA/Ops`.
They do not move `Data/Auth`, `Writes/Integrations`, or `Rollout Gate` unless a
separate approved lane supplies real auth/data/write/proof evidence.
