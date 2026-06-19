# Goal 109: Admin Audit Log Review

## Purpose

Goal 109 makes audit evidence inspectable from `/admin` instead of leaving audit
readback only inside individual write packets. It gives Admin and Super Admin a
read-only audit log review panel, while DS Admin sees summary-only audit posture
without row-level chapter/member detail.

## What It Adds

- A typed admin audit log review service.
- An admin audit log review panel on `/admin`.
- Row-level audit readback for Admin and Super Admin when `audit_logs` rows are
  visible in the read-only app snapshot.
- Summary-only posture for DS Admin.
- Mock-mode honesty: the panel says when no persisted audit rows are visible
  yet.
- Goal 156 write-audit preflight checks for actor identity, target readback,
  before/after summaries, reason notes, visibility boundaries, and
  retention/export locks.
- Admin control-center metrics that count visible audit rows and mark audit logs
  read-only ready only when rows exist.
- Tests proving role visibility, persisted-row mapping, mock fallback posture,
  DS Admin row hiding, and launch-readiness references.

## Permission Posture

This goal is read-only.

It does not:

- create audit rows
- enable browser writes
- enable production Supabase
- expose service keys
- reveal secrets
- export audit rows
- change audit retention
- send external automation
- grant DS Admin row-level chapter/member audit detail

Admin and Super Admin can inspect visible audit rows. DS Admin can confirm audit
posture, but row-level audit truth remains hidden. Members, leaders, and coaches
cannot read the audit review panel.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=admin@mymedlife.test
http://localhost:3000/admin
```

The page should show the audit log review panel. In mock fallback mode, it
should show `0` rows and explain that persisted audit rows require localhost
Supabase write/readback drills. In local Supabase mode, visible `audit_logs`
rows should show action, actor, chapter, target, before/after summary, reason,
and timestamp. The Goal 156 checklist should also show the readiness of actor,
target, before/after, reason, visibility, and retention/export evidence before
production write approval.

To verify DS Admin posture:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=ds.admin@mymedlife.test
http://localhost:3000/admin
```

The page should show audit posture while hiding row-level details.

## Next Step

Before production launch, every promoted write path should prove one readback
row in `audit_logs` with actor, target, before value, after value, reason, and
created timestamp. Production audit review remains blocked until those rows are
verified on the release branch with real auth identity.
