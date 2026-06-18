# Goal 158: Proof Submission Packet

Goal 158 extends `/rush-month/evidence` with a proof submission packet for the
recommended proof item.

The route already tells members and chapter operators what proof to prepare
next. This packet makes the future write path concrete by showing the metadata
payload, local function, result preview, readiness checks, structured event,
disabled outbox row, and audit action before reviewers open the action detail
write gate.

## What Changed

- `src/services/evidence-submission-workspace.ts`
- `src/app/rush-month/evidence/page.tsx`
- `tests/evidence-submission-workspace.test.ts`
- `src/services/mvp-coverage-checklist.ts`
- `src/services/mvp-progress-map.ts`
- `src/services/mvp-release-readiness.ts`
- `src/services/route-smoke-manifest.ts`
- `src/services/stakeholder-review-plan.ts`
- `docs/review/local-mvp-review-guide.md`
- `docs/supabase-local-development.md`

## Packet Fields

- Recommended assignment and action route.
- Future `app.submit_assignment_proof_metadata` function target.
- Metadata-only proof payload.
- Current disabled result and future enabled result.
- Readiness checks from the proof-submission write gate.
- Evidence item, structured event, disabled outbox, and audit action preview.
- Locked proof metadata save, file upload, public publish, reminder, and external
  send controls.

## Safety Boundary

The route does not save proof metadata, upload files, publish proof, send member
reminders, write points or KPIs, export proof, run AI summaries, or send
HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI automation.

The packet is a review artifact only. Production auth, browser writes, proof
storage, public proof publishing, and real student invitations remain blocked.

## Review Path

Open `/rush-month/evidence` as `member.a@mymedlife.test`.

The page should show the Goal 158 proof submission packet for `member-push`,
including `write_disabled` now, `proof_submitted` if enabled, the
`app.submit_assignment_proof_metadata` function, readiness checks, future
`evidence_submitted` event, disabled `n8n` outbox, and `evidence_submitted`
audit action.

Open the same route as `leader.a@mymedlife.test` to confirm changes-requested
proof uses the bridge-video packet. DS Admin should still see no student proof
queue or packet.
