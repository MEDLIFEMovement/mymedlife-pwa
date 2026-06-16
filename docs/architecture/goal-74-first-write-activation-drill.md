# Goal 74: First-Write Activation Drill

## Purpose

Goal 74 adds a staff-only first-write activation drill for the first local
browser write candidate: `action_started`.

The app already has a local Supabase function, server action, RLS tests, result
states, and browser gate for action start. This goal makes the activation path
clear enough for staff to test safely: which fake member signs in, which action
route to open, which local flags must be enabled, what should change, and what
evidence proves the write worked.

## What It Adds

- `/admin/first-write`
- `getFirstWriteActivationDrill(actor, data, env)`
- `FirstWriteActivationDrillPanel`
- route metadata and route registry coverage
- admin, DS admin, and super admin navigation links
- route smoke, stakeholder review, MVP coverage, progress, release, and pilot
  planner references
- tests for drill visibility, local Supabase/UUID requirements, flags, auth,
  event/audit proof expectations, and zero external sends

## Drill Scope

The drill covers one localhost-only write:

- operation: `action_started`
- route: `/rush-month/actions/[assignmentId]`
- local function: `app.start_assignment_action(assignment_uuid)`
- fake target user: `member.a@mymedlife.test`
- expected result: assignment becomes `in_progress`
- expected records: internal event, integration event, and audit log
- expected external sends: zero

## Safety Rules

- The drill does not approve production writes.
- The drill does not enable writes by default.
- The drill requires local Supabase UUID-backed data.
- The drill requires local Supabase Auth.
- The drill requires explicit local write flags.
- The drill keeps proof upload, assignment creation, HQ decision, coach decision,
  admin mutation, and external integration writes disabled.

## Why This Matters

The MVP cannot stay in read-only review forever. This drill creates the bridge
from "write gates exist" to "we can safely prove the first local save works"
without widening the system too quickly.
