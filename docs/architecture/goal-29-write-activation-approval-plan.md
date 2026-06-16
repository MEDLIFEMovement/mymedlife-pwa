# Goal 29: Write Activation Approval Plan

Goal 29 adds a plain-English approval plan for the first browser write
activation sequence. It does not activate any write.

The plan appears on `/admin` beneath the write activation readiness dashboard.
It answers:

- which write should be activated first
- which writes should wait
- why the order is safer
- what must be approved before any save button turns on
- what must stay disabled after the first write is enabled

## Recommended Order

1. `action_started`
2. `action_assigned`
3. `evidence_submitted`
4. `hq_sharing_decision`
5. `coach_decision_logged`

The first recommended activation is `action_started` because it is the narrowest
write path: one assignment status update plus internal event/audit records. It
does not create an automation outbox row.

Higher-risk paths wait because they affect chapter operating truth, proof reuse,
or coach readiness decisions.

## Required Before Activation

- live auth/session verified
- server-side identity bound to auth, not client role strings
- relevant RLS/security CI green
- rollback path defined
- success/error states reviewed
- external writes confirmed disabled
- audit/event payload reviewed

Every requirement remains incomplete in this goal.

## What Stays Disabled

- browser save controls
- production Supabase
- proof uploads and public proof publishing
- HubSpot writes
- Luma writes
- n8n workflows or escalation packets
- warehouse or Power BI exports
- SMS/email sends
- AI summaries

## Files

- `src/services/write-activation-approval-plan.ts`
- `src/components/write-activation-approval-plan-panel.tsx`
- `src/app/admin/page.tsx`
- `tests/write-activation-approval-plan.test.ts`

## Next Approval Needed

Nick/team should explicitly approve Goal 30 before any action-start browser
control is implemented as a real save path.
