# Goal 111: Production Operations Runbook

## Purpose

Goal 111 turns the remaining production health blocker into a concrete
operations review surface. The app still is not live-launch approved, but Admin,
DS Admin, and Super Admin can now inspect the local first-response playbooks,
owner lanes, and missing live evidence for a controlled myMEDLIFE pilot.

## What It Adds

- A typed production operations runbook service.
- A production operations runbook panel on `/admin`.
- Eight read-only runbook areas:
  - incident triage and severity
  - auth or access incident
  - database or RLS incident
  - write rollback and audit review
  - proof storage, consent, and moderation incident
  - integration and outbox recovery
  - mobile PWA support
  - pilot communications and day-one support
- First-response steps for local review.
- Missing live evidence for monitoring, backup, rollback, recovery, and support.
- Tests proving the runbook is admin-only, write-safe, explicit about DS
  recovery ownership, and not live-launch approved.

## Permission Posture

This goal is read-only.

It does not:

- enable production auth
- enable production Supabase
- enable browser writes
- upload proof files
- expose service keys or secrets
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- create or replay outbox rows
- approve live launch

Admin, DS Admin, and Super Admin can inspect the runbook. Members, leaders, and
coaches cannot.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=ds.admin@mymedlife.test
http://localhost:3000/admin
```

The page should show production operations with launch `no`, `0` writes, `0`
sends, `0` secrets, Data Solutions ownership for integration recovery, and
blocked live evidence for auth, database/RLS, proof storage, mobile PWA support,
and pilot communications.

## Next Step

Before a real student pilot, Nick, HQ operations, DS/security, platform, and
launch owners should review the runbook and name the real incident commander,
support backup, alert channel, backup proof, rollback owners, integration
dead-letter rules, and day-one student support plan.
