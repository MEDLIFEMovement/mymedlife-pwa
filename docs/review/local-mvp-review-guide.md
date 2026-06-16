# Local MVP Review Guide

This guide is for non-coder reviewers looking at the local myMEDLIFE Rush Month
MVP.

## What This Build Is

This is a local, mock-safe review build of the custom myMEDLIFE PWA.

It shows how the app can support:

- members seeing what to do next
- leaders tracking action follow-up
- proof/testimonials being collected for HQ review
- points and KPIs being displayed
- coaches seeing readiness, risk, and advance / hold / intervene posture
- admins reviewing safety, route coverage, outbox posture, and launch blockers

## What This Build Is Not

This is not a live student launch.

The build does not enable:

- live login
- production Supabase
- browser saves
- proof uploads
- public proof publishing
- reminders
- coach escalation packets
- HubSpot writes
- Luma writes
- n8n workflows
- warehouse or Power BI exports
- email, SMS, or AI writes

## How To Review It

Start on `/admin`.

Use the admin panels in this order:

1. MVP release readiness
2. Environment safety
3. Stakeholder review path
4. Admin glossary
5. MVP coverage checklist
6. Manual route smoke manifest
7. Route coverage summary
8. Admin control center
9. Write activation readiness and approval plan

The stakeholder review path tells you which local actor email to use and which
route to open for each part of the walkthrough.

## Local Actor Emails

Use these fake local actor emails to preview the app:

- `member.a@mymedlife.test`
- `leader.a@mymedlife.test`
- `coach@mymedlife.test`
- `admin@mymedlife.test`
- `ds.admin@mymedlife.test`
- `super.admin@mymedlife.test`

These are not production users. They are local review roles only.

## Pass Signals

The local MVP review is healthy when:

- the app builds and tests pass
- admin panels show zero browser writes expected
- admin panels show zero external sends expected
- member routes focus on student actions and recognition
- leader routes focus on follow-up and readiness
- coach routes show portfolio/risk/decision posture
- DS Admin stays focused on outbox/integration safety
- proof is described as testimonial/bridge-video material for HQ sharing review

## Fail Signals

Pause review if you see:

- a real login prompt
- a save button that claims to write real data
- proof upload controls that appear enabled
- public proof publishing controls that appear enabled
- HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI sends that appear enabled
- DS Admin seeing student/member truth instead of outbox safety posture

## Next Approval Boundary

The next major approval should be explicit.

Do not enable live auth, browser writes, uploads, public proof publishing, or
external integrations until Nick/team approve the next implementation goal.
