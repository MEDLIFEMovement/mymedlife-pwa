# Goal 108: Database Security Decision Packet

## Purpose

Goal 108 turns the DS-team database concern into a concrete admin review packet
instead of an informal stack debate. The packet recommends keeping the approved
Supabase/Postgres/Auth/Storage stack for the MVP, documents the
PlanetScale/MySQL tradeoffs, and keeps live launch blocked until DS/security
evidence is signed off.

## What It Adds

- A typed database security decision service.
- A database security decision panel on `/admin`.
- A reviewed platform comparison for:
  - Supabase Postgres and RLS
  - Supabase Auth and Storage
  - PlanetScale MySQL/Vitess
  - application-layer authorization rewrite risk
- Launch controls for:
  - approved stack boundary
  - chapter-scoped RLS
  - audited RPC write paths
  - service-key handling
  - proof storage and consent
  - compliance/vendor contracts
  - switching-cost control
- Tests proving the packet is admin-only, write-safe, explicit about
  PlanetScale/MySQL tradeoffs, and not live-launch approved.

## Recommendation

Keep Supabase for the myMEDLIFE MVP.

The reason is not that PlanetScale is insecure. It is that this app's security
shape is chapter-scoped and role-scoped: members, chapter leaders, coaches,
admins, DS admins, and super admins must see different rows and perform
different actions. The current repo, schema plan, local migrations, RLS tests,
proof-storage path, and write gates are already designed around
database-enforced Postgres policies plus narrow audited write functions.

PlanetScale MySQL/Vitess remains a valid future architecture option, but using
it now would move more authorization responsibility into application code and
would require a rewrite of migrations, data access, auth assumptions, proof
storage, RLS/security tests, and launch evidence.

## Permission Posture

This goal is read-only.

It does not:

- enable production Supabase
- create production users
- enable browser writes
- upload files
- expose service keys
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- replace the approved stack

Admin, DS Admin, and Super Admin can inspect the packet. Members, chapter
leaders, and coaches cannot.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=ds.admin@mymedlife.test
http://localhost:3000/admin
```

The page should show the database security decision packet with Supabase
recommended, PlanetScale MySQL/Vitess reviewed, launch set to `no`, `0` writes,
and `0` sends.

## Next Step

Before production setup, DS/security should review the packet with the
schema/RLS plan, confirm whether PHI/ePHI is in scope, complete any BAA/DPA
decisions, approve service-key handling, and rerun RLS/security tests on the
release branch.
