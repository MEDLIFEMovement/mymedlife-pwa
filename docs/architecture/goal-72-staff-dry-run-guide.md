# Goal 72: Staff Dry-Run Guide

## Purpose

Goal 72 turns the Goal 71 "staff dry run is ready" claim into an executable
staff-only rehearsal route. The app still is not ready to invite real students,
but HQ can now run a structured fake-user rehearsal before staging or pilot
approval.

## What It Adds

- `/admin/staff-dry-run`
- `getStaffDryRunGuide(actor)`
- `StaffDryRunGuidePanel`
- route metadata and route registry entry
- admin, DS admin, and super admin navigation links
- route smoke and stakeholder review coverage
- MVP coverage, progress, release, and controlled pilot references
- tests for dry-run steps, pass criteria, structured events, route coverage,
  role restrictions, and zero-write/zero-send posture

## Dry-Run Sequence

The staff guide walks reviewers through:

- admin preflight safety posture
- general member week
- chapter leader follow-up
- Rush Month event/NPS readiness
- proof upload intake readiness
- HQ proof review posture
- coach readout
- DS Admin integration/outbox safety

Each step includes:

- fake local actor email
- route to open
- rehearsal goal
- pass criteria
- structured events to notice
- safety assertion

## Safety Rules

- No production auth is enabled.
- No browser writes are enabled.
- No proof upload or public sharing is enabled.
- No real student invitations are approved.
- No Luma, HubSpot, n8n, warehouse, Power BI, SMS, email, or AI writes are
  enabled.
- The dry run is rehearsal evidence only. It does not approve staging, student
  pilot use, public proof, leaderboards, or external automation.

## Why This Matters

The project needs a practical bridge between local review and a real pilot. A
dry-run route gives non-coders and technical reviewers the same checklist for
what to inspect, which fake user to use, and what safety promises must remain
true before any student-facing pilot is considered.
