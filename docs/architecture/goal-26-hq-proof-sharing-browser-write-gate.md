# Goal 26: HQ Proof-Sharing Browser Write Gate

Goal 26 makes the HQ proof/testimonial sharing decision path visible in the app
without enabling browser writes, public proof publishing, or automation sends.

The candidate write is `hq_sharing_decision` on `/rush-month/review`, backed by
the existing local Supabase function:

```sql
app.record_hq_proof_sharing_decision(
  evidence_uuid,
  decision_input,
  review_note
)
```

This goal aligns the browser activation gate with the local Supabase function
from Goal 16. It does not turn on decision saves or public sharing.

## Why This Exists

MEDLIFE HQ, not chapter leaders, decides whether submitted proof/testimonials
should be shared broadly with other chapters or universities. The database
already has an audited local function for that decision, and RLS tests prove
direct approval inserts are blocked.

The app now shows the reviewer the activation checks before any enabled HQ
proof-sharing decision control appears.

The gate tells a reviewer:

- the current actor can or cannot make HQ sharing decisions
- the actor is or is not allowed by the write plan
- the local database function exists
- RLS/security tests exist
- external writes remain disabled
- live auth is still missing
- browser write approval is still missing

## What Stays Disabled

- enabled browser save/decision controls
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
- `src/app/rush-month/review/page.tsx`
- `tests/browser-write-activation.test.ts`
- updated `README.md`
- updated `AGENTS.md`

## Next Approval Needed

Before a real HQ sharing decision browser write is enabled, Nick/team should
explicitly approve:

1. local auth/session readiness
2. the first HQ decision route and actor scope
3. decision validation and rollback behavior
4. the visible success/error states
5. confirmation that public sharing and external writes remain disabled
