# Goal 73: Pilot Scope Planner

## Purpose

Goal 73 adds a staff-only first pilot scope planner. Goal 72 made the staff dry
run executable; Goal 73 makes the next decision explicit: who is allowed into
the first tiny real pilot, which routes they use, which write path can be
considered first, and what must stay manual or disabled.

## What It Adds

- `/admin/pilot-scope`
- `getPilotScopePlanner(actor)`
- `PilotScopePlannerPanel`
- route metadata and route registry coverage
- admin, DS admin, and super admin navigation links
- controlled pilot readiness link and proof requirement
- route smoke, stakeholder review, MVP coverage, progress, and release-readiness
  references
- tests for candidate scopes, minimum pilot path, decisions, role restrictions,
  and zero-write/zero-send posture

## Recommended First Real Pilot

The planner recommends one tiny Rush Month pilot only after gates are approved:

- one chapter or one internal staff-plus-chapter rehearsal group
- 5-15 student users
- one coach
- one HQ owner
- action-start as the first possible browser write
- manual event/NPS handling first
- proof uploads disabled until consent/storage/moderation rules are approved
- all external writes disabled

## Safety Rules

- The planner does not approve student invitations.
- The planner does not enable production auth.
- The planner does not enable browser writes.
- The planner does not enable proof uploads or public proof sharing.
- The planner does not trigger Luma, HubSpot, n8n, warehouse, Power BI, SMS,
  email, or AI writes.

## Why This Matters

Without a scope planner, "pilot" can quietly become a broad launch. This route
keeps the team honest by naming the smallest useful pilot and keeping larger
launch options visibly out of scope until evidence supports expansion.
