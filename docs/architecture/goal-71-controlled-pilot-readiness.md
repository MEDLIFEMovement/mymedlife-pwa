# Goal 71: Controlled Pilot Readiness

## Purpose

Goal 71 adds a controlled pilot readiness gate to the admin review path. The app
has strong local Rush Month flows, local auth groundwork, RLS/security tests,
proof/testimonial readiness, event/NPS readiness, and design QA readiness. The
next risk is accidentally treating local review as approval for real students.

This goal makes the middle path explicit:

- local stakeholder review: ready
- staff dry run with fake users: ready
- staging review: blocked before pilot
- first student pilot: blocked before pilot
- pilot expansion: blocked before scale

## What It Adds

- `getControlledPilotReadiness(actor)`
- `ControlledPilotReadinessPanel`
- `/admin` controlled pilot readiness section
- stakeholder review step for pilot readiness
- MVP coverage and progress-map entries for controlled pilot readiness
- release-readiness achievement for the pilot decision packet
- tests covering staff dry run readiness, pilot blockers, DS Admin safety
  visibility, and operating-role restrictions

## Pilot Gate Logic

The app is ready for a staff dry run because reviewers can use fake/local users
to rehearse:

- member action start
- leader follow-up posture
- proof/testimonial intake posture
- HQ sharing posture
- points/KPI and recognition posture
- coach advance/hold/intervene posture
- disabled outbox and audit posture

The app is not ready for real students until the team approves:

- first pilot chapter or internal group
- staging environment
- production auth/onboarding
- minimum pilot write paths
- proof consent and storage rules
- event attendance and NPS handling
- coach/support ownership

External integrations stay blocked before scale unless separately approved.

## Safety Rules

- No production auth is enabled.
- No browser writes are enabled.
- No proof upload or public sharing is enabled.
- No Luma, HubSpot, n8n, warehouse, Power BI, SMS, email, or AI writes are
  enabled.
- The panel is a decision packet, not approval to invite students.

## Why This Matters

The team needs a practical way to move from local review to a tiny pilot without
turning launch into one huge, risky switch. This panel gives the team a shared
language for what can happen now, what needs a decision, what blocks the first
student pilot, and what blocks expansion.
