# Goal 115: Leader Proof Decision Local Write

Goal 115 adds the local Supabase database packet for chapter leader proof
decisions without enabling browser save controls.

## What changed

- Added `app.record_leader_proof_decision(...)` as the only local path for
  approving, requesting changes, or rejecting chapter proof.
- Added `app.can_record_leader_proof_decision(...)` so Chapter Leaders and
  Super Admin can own the decision while General Members, Coaches, Admin, and
  DS Admin remain blocked from routine chapter proof truth.
- Replaced direct `points_events` and `kpi_events` insert policies with
  function-only insert policies.
- Added pgTAP coverage in `supabase/tests/database/rls_goal_115.test.sql`.

## Decision outcomes

`approve`:

- updates evidence to `approved`
- updates assignment to `approved`
- records a `chapter_proof_decision` approval row
- creates a points event for the assigned member
- creates a KPI completion event
- records an internal `evidence_approved` event
- records a disabled outbox row and audit log

`request_changes`:

- updates evidence and assignment to `changes_requested`
- records a `chapter_proof_decision` approval row
- records an internal `evidence_changes_requested` event
- creates no points or KPI movement
- records a disabled outbox row and audit log

`reject`:

- updates evidence to `rejected`
- returns assignment to `changes_requested`
- records a `chapter_proof_decision` approval row
- records an internal `evidence_rejected` event
- creates no points or KPI movement
- records a disabled outbox row and audit log

## Safety boundaries

- Browser controls remain disabled.
- Production Supabase remains disabled.
- Proof uploads and public proof sharing remain disabled.
- Member nudges remain disabled.
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes remain
  disabled.
- The function leaves HQ proof-sharing status separate from chapter proof
  completion.

## Test evidence

`supabase/tests/database/rls_goal_115.test.sql` proves:

- direct approval, points, KPI, and evidence-status bypasses are blocked
- Chapter Leader can approve, request changes, and reject submitted proof
- approve creates assignment/evidence status, approval, points, KPI, event,
  integration event, disabled outbox, and audit rows together
- request changes and reject do not award points or KPI movement
- General Member, Coach, Admin, and DS Admin cannot record routine leader proof
  decisions
- Super Admin can record an audited break-glass decision
- final decisions, short notes, missing proof, and not-ready proof are rejected
- no leader proof decision approves or sends external automation
