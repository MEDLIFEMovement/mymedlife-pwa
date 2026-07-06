# Rollout Evidence Gap Guardrail Refresh

This note keeps the rollout matrix honest. It is a no-write, no-access
checkpoint for the current myMEDLIFE launch lane.

The repo already has provider templates, proof checklists, and validator
guards. This refresh does not add a new rollout process. It summarizes the
evidence that is still missing before the matrix can move.

## Current Missing Evidence

| Evidence needed before rollout percentages move | Current state | What counts | What does not count |
| --- | --- | --- | --- |
| Returned owner CSVs | Still missing | Returned folders tied to the canonical owner handoff thread and saved under `returned-owner-packets/<owner-slug>/` | Sent-only packets, draft spreadsheets, or any owner packet that has not returned |
| Approved production rollout packet | Still missing | A validated packet build that passes intake and check steps | Partial folders, template work, or packet-shaped docs without validated real rows |
| Production live data counts | Still missing | Real live counts from myMEDLIFE/Supabase after apply | External exports, snapshots, or warehouse-only aggregates |
| Real signed-in member/leader/staff/admin proof | Still missing | Real production route proof for member, leader, staff, and admin accounts with timestamps and reviewer identity | Local-only proof, screenshots, fake/test accounts, or shell render checks |
| Five-chapter pilot proof | Still missing | Five real pilot chapters with RSVP, attendance, points, audit, and zero-send evidence | One-chapter checks, mock rows, or Luma-only evidence |
| Luma mapping proof | Still missing | Approved calendar mapping and read-only event context for the launch chapters | Calendar screenshots, sample exports, or unapproved Luma writes |
| Audit/outbox zero-send proof | Still missing | Audit rows plus zero-external-send readback for the pilot chapters | A general “looks good” note, smoke tests, or outbox evidence without checked timestamps |
| Support / rollback / production apply owners | Still missing | Named owners with a current handoff record for support, rollback, and production apply | Unassigned responsibility, placeholders, or inferred ownership |
| Final invite gate output | Still missing | The gate report that passes only after the real packet, counts, proof, and owners are in place | Deploy success, CI green, or any matrix optimism without launch evidence |

## What Cannot Count

- Test/Figma/sandbox rows
- SOP/sample/template content
- Public no-auth smoke alone
- Provider exports alone
- Local signed-in proof alone
- Screenshots without real account/data evidence

## Existing Guardrails Already In The Repo

These files already keep fake proof out of the launch path:

- `docs/production-rollout-data-collection.md`
- `docs/production-rollout-bootstrap.md`
- `docs/integration-readiness-map.md`
- `docs/five-chapter-pilot-proof-checklist.md`
- `docs/five-chapter-pilot-proof-operator-runbook.md`
- `docs/audit-outbox-zero-send-evidence-checklist.md`
- `docs/luma-rollout-data-request-template.md`
- `docs/pilot-event-proof-luma-evidence-template.md`
- `docs/production-readiness-plain-english-glossary.md`
- `src/services/production-rollout-bootstrap.ts`
- `src/services/production-pilot-event-proof.ts`
- `src/services/production-invite-gate.ts`
- `scripts/check-production-invite-gate.mjs`

The important guardrail behavior already in code and docs:

- pilot proof needs five approved chapters, not a single example row
- `checkedAt` must be present and a valid timestamp
- `reviewedByEmail` must map to a known user
- audit evidence must be recorded
- outbox evidence must be zero-send
- Test/Figma/sandbox rows are rejected
- screenshots do not replace real production evidence
- provider templates do not replace myMEDLIFE/Supabase truth
- public smoke success does not equal rollout readiness

## Matrix-Facing Summary

The launch matrix should stay where it is until the missing evidence above is
real, reviewed, and attached to the current rollout packet.

Recommended next no-write steps:

1. Wait for returned owner CSVs and run owner return intake dry run only.
2. Keep pilot proof collection scoped to real five-chapter evidence.
3. Use the read-only provider templates only when the missing fields justify it.
4. Recheck the invite gate only after the packet, live counts, route proof, and
   audit/outbox evidence exist.
