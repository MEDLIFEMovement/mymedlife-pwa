# Goal 116: Leader Proof Decision Server Action

Goal 116 adds the first browser-facing, localhost-only server action for chapter
leader proof decisions on `/rush-month/review`.

## What Changed

- Added a local-only leader proof decision server action that calls
  `app.record_leader_proof_decision(evidence_uuid, decision_input, review_note)`.
- Added a `/rush-month/review` panel where eligible local Chapter Leaders and
  Super Admin can submit approve, request-changes, or reject decisions only when
  every safety gate passes.
- Added a stable fake seed fixture:
  - assignment `50000000-0000-4000-8000-000000000004`
  - evidence `60000000-0000-4000-8000-000000000004`
- Added typed readiness, browser-gate, result, and readback handling for the
  local server action.
- Added unit coverage for disabled-by-default behavior, local auth gating, role
  blocking, RPC success/error mapping, and readback states.

## Required Local Flags

This path is disabled unless all of these are true:

```text
MYMEDLIFE_DATA_SOURCE=supabase
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true
MYMEDLIFE_AUTH_MODE=local_supabase
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true
MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE=true
```

The reviewer must also sign in locally as `leader.a@mymedlife.test` or
`super.admin@mymedlife.test`.

## Safety Boundary

Goal 116 does not enable:

- production Supabase writes
- production auth
- proof uploads
- public proof publishing
- member nudges
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

Approvals can create local points and KPI rows through the database function.
Request-changes and reject decisions do not create points or KPI movement.

## Review Path

1. Reset local Supabase and confirm Goal 115 SQL/RLS tests pass.
2. Set the local read, auth, write, and leader proof decision flags above.
3. Sign in at `/login` as `leader.a@mymedlife.test`.
4. Open `/rush-month/review`.
5. Use the local leader proof decision panel for fake evidence
   `60000000-0000-4000-8000-000000000004`.
6. Confirm the page readback shows the expected approved, changes requested, or
   rejected status.
7. Confirm no member nudge, public proof publish, or external automation ran.

## Keep Separate From HQ Sharing

Leader proof decisions answer: "Does this assignment count for the chapter?"

HQ sharing decisions answer: "Can this proof/testimonial be reused publicly or
internally beyond the chapter?"

Those remain separate write paths and separate approval responsibilities.
