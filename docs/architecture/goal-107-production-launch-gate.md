# Goal 107: Production Launch Gate

## Purpose

Goal 107 adds one admin-readable gate between local MVP review and live student
pilot approval. It gathers the launch evidence that exists today and the
evidence still missing before production auth, production writes, proof uploads,
external automation, or a real pilot can turn on.

## What It Adds

- A typed production launch gate service.
- A production launch gate panel on `/admin`.
- Eight launch gates:
  - production auth and onboarding
  - RLS and schema security
  - guarded write promotion
  - proof upload, storage, and consent
  - campaign template writes
  - integration outbox and external automation
  - audit logs, monitoring, and system health
  - controlled pilot operations
- Local evidence, missing live evidence, review routes, and approval owner text
  for each gate.
- Goal 111 production operations runbook evidence for incident response,
  rollback, backup, support, and integration recovery review.
- Tests proving the gate is admin-only, launch-blocking, write-safe, and
  explicit about missing live evidence.

## Permission Posture

This goal is read-only.

It does not:

- enable production auth
- create real users
- enable browser writes
- upload files
- publish proof
- create campaign templates
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- expose secrets

Admin, DS Admin, and Super Admin can inspect the launch gate. Members, leaders,
and coaches cannot.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=admin@mymedlife.test
http://localhost:3000/admin
```

The page should show the production launch gate with eight gates, launch set to
`no`, `0` writes, and `0` sends. Each gate should list missing live evidence and
routes to review.

## Next Step

Use the gate to assign owners for production auth/RLS, the Goal 108 database
security decision packet, proof storage, first write promotion, integration
contracts, the Goal 111 production operations runbook, observability, and pilot
operations before any real users or external systems are connected.
