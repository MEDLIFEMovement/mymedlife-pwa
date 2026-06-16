# Goal 25: Proof Submission Browser Write Gate

Goal 25 makes the proof/testimonial submission path visible in the app without
enabling browser writes, uploads, public sharing, or automation sends.

The candidate write is `evidence_submitted` on
`/rush-month/actions/[assignmentId]`, backed by the existing local Supabase
function:

```sql
app.submit_assignment_proof_metadata(
  assignment_uuid,
  evidence_kind,
  proof_summary,
  ...
)
```

This goal aligns the browser activation gate with the local Supabase function
from Goal 15. It does not turn on proof saves or file uploads.

## Why This Exists

The Rush Month loop needs members and chapter operators to submit proof after
they act. In myMEDLIFE, proof is a testimonial, bridge video, event photo,
external link, or short recap that helps MEDLIFE HQ decide what should become a
belief-building library asset.

The database already has an audited local function for proof metadata
submission, and RLS tests prove direct evidence inserts are blocked. The app now
shows the reviewer the activation checks before any enabled proof submission
control appears.

The gate tells a reviewer:

- the current actor can or cannot submit proof for the assignment
- the actor is or is not allowed by the write plan
- the local database function exists
- RLS/security tests exist
- external writes remain disabled
- live auth is still missing
- browser write approval is still missing

## What Stays Disabled

- enabled browser save/submit controls
- production Supabase
- live auth/browser sessions
- proof uploads and storage writes
- public proof publishing
- HubSpot writes
- Luma writes
- n8n workflows
- warehouse or Power BI exports
- SMS/email sends
- AI summaries

Even when `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`, the browser gate still
returns `canRenderEnabledControl: false`.

## Files

- `src/services/browser-write-activation.ts`
- `src/app/rush-month/actions/[assignmentId]/page.tsx`
- `tests/browser-write-activation.test.ts`
- updated `README.md`
- updated `AGENTS.md`

## Next Approval Needed

Before a real proof submission browser write is enabled, Nick/team should
explicitly approve:

1. local auth/session readiness
2. the first proof submission route and actor scope
3. proof metadata validation and rollback behavior
4. the visible success/error states
5. confirmation that uploads, public sharing, and external writes remain disabled
