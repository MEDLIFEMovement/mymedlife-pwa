# myMEDLIFE Launch Truth Summary

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: plain-English summary of current launch truth for the MVP story
package, written for Coordinator, Kiomi, Nick, and the builder threads.

## Bottom Line

myMEDLIFE has strong reviewable shells for the narrow launch path. A reviewer
can walk member, leader, staff, and DS Admin surfaces and see the intended app
shape. That is real `Scope/UI` progress, and focused checks or no-write smoke
can add `QA/Ops` confidence.

That is not the same as launch readiness. Student launch still needs real
production evidence: owner-approved data, live counts, signed-in route proof by
role, pilot event proof, audit/outbox zero-send proof, and explicit final
approval.

## What Is Built Enough To Review

- `/login` and role-aware shell routing.
- General Member App: `/app`, `/app/events`, event detail, `/app/stories`,
  `/app/points`, `/profile`, and `/app/slt-prep`.
- Student Leadership: `/leader?view=*` shell, menu families, leader events,
  leaderboards, member/profile handoffs, and leadership support surfaces.
- Staff Command Center: `/staff?view=*` shell, chapter portfolio, chapter
  drawer, campaigns, Proof / UGC, Best Practices, Campaign SOPs, and embedded
  Admin handoff.
- DS Admin: `/admin` dark shell and route-level review surfaces for users,
  chapters, access, integrations, audit logs, system health, API keys, MCP
  Connections, settings, and launch gate where source-backed.

## What Is Preview-Only Or Mock-Safe

- RSVP, check-in, attendance, points, and simple leaderboards.
- Member stories, reactions, sharing, proof/story identity, profile edits, and
  SLT Prep traveler workflow.
- Leader event creation, attendance imports, committees/tasks, member/profile
  actions, role changes, succession, values, training, bridge videos, and
  stories.
- Staff campaigns, proof moderation, UGC publishing, SOP publish/rollback,
  survey sends, exports, interventions, and provider-looking controls.
- Admin provider actions, API key operations, MCP writes, system-health
  operations, audit/outbox retry or replay, user/role/chapter mutations, and
  launch-gate advancement.

## What Is Blocked Before Launch

- Real owner-returned CSVs and validation.
- Production rollout packet from approved real data.
- Production live counts from the real app/source of truth.
- Real signed-in proof for member, leader, staff/support, and DS/admin.
- Real pilot event proof for RSVP, attendance, points, audit, and zero-send.
- Any live provider write, external send, invite, or browser-facing production
  write.
- Final invite-gate approval.

## Current Builder Ownership

- `#1` owns General Member App shell continuity.
- `#2` owns Student Leadership / Chapter Command Center shell continuity.
- `#3` owns Staff / DS Admin shell continuity. `#3` is not the rollout packet,
  owner CSV, or invite-gate evidence owner in the current shell model.
- `#4` owns PR watch, focused checks, visual QA, and no-write smoke
  classification.
- `#5` owns planning, repo-truth story audit, backlog grooming, and stale
  steering repair.

## Where UI Looks Strong But Proof Is Weak

- The member event loop looks close to operating, but RSVP/check-in/points are
  still preview/readback until real write and proof paths exist.
- Leader views look rich, but event creation, attendance imports, role changes,
  assignments, succession, and points awards are blocked.
- Staff/Admin surfaces look demo-ready, but interventions, exports, proof
  moderation, provider actions, API/MCP operations, user/role/chapter writes,
  and launch-gate advancement are not live.
- Stories and Proof / UGC look product-like, but consent, storage, moderation,
  publishing, and production evidence are not complete.

## TEST And Evidence Rules

- Visible fake people, chapters, events, stories, proof rows, campaigns, SOPs,
  audit actors, provider examples, placeholder owners, and fake metrics must
  show `TEST`.
- Product/provider/menu/module names stay clean. Do not prefix real labels like
  MEDLIFE, myMEDLIFE, Luma, Events, RSVP, Attendance, Points, SLT Prep,
  HubSpot, Hootsuite, Smile.io, n8n, BigQuery, Databricks, roles, or menu
  labels.
- TEST/Figma/sandbox/local content can help reviewers understand the UI. It
  never counts as rollout proof.

## Top 10 Rollout-Critical Gaps

1. Owner-returned CSVs and validation.
2. Production rollout packet from approved real data.
3. Production live counts.
4. Production signed-in route proof for member, leader, staff/support, and
   DS/admin.
5. Luma read-only mapping proof for the pilot event loop where needed.
6. Pilot event proof for RSVP, attendance, and points.
7. Audit/outbox zero-send proof from real pilot activity.
8. Mobile/device QA sign-off for the member event loop.
9. TEST-label removal or real-data replacement gate for production-visible rows.
10. Final Coordinator/Nick invite-gate approval.

## Matrix Language

- `Scope/UI`: can move from landed shell work that preserves source/Figma
  fidelity and visible control honesty.
- `QA/Ops`: can move from focused tests, browser smoke, or visual QA evidence.
- `Data/Auth`: needs implemented and tested role/data/privacy/safety contracts
  or real signed-in proof readiness.
- `Writes/Integrations`: needs approved write/provider contracts, audit/outbox
  proof, fail-closed tests, and explicit activation approval.
- `Rollout Gate`: needs real owner-approved data, live counts, production
  signed-in route proof, pilot proof, audit/outbox zero-send proof, and final
  Coordinator/Nick approval.

Planning docs, shell screenshots, public no-write smoke, TEST cleanup, local
actors, sandbox rows, Figma data, and preview flows do not move rollout proof by
themselves.
