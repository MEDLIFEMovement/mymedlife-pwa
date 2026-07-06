# Later-Lane Integration Readiness Template (Warehouse, n8n, Smile.io)

Use this only after the owner-return intake, rollout packet, and launch gate work are
advanced enough that these systems are for reporting, orchestration, or rewards
support—never for opening the first rollout gate.

## Why This Exists

This lane helps the team decide when to ask for extra systems without letting
them become production app truth.

At this stage:

- myMEDLIFE/Supabase remains operational truth.
- Returned owner CSVs, approved packet, live count proof, signed-in route proof,
  pilot event proof, audit/outbox proof, and final invite gate are still the
  launch path.
- Warehouse/n8n/Smile.io can support later reporting/operations only after the
  above evidence is stable.

## 1) Warehouse (BigQuery or Databricks) — Read Model Only

### Safe Future Role

- Produce downstream analytics and reconciliation once app data, outbox, and rollout
  evidence are stable.
- Support DS/HQ reporting, batch health checks, and trend summaries.

### Ask Pattern

1) Prefer static output first (CSV/BI snapshot) from existing exports.
2) Ask only for read access if static export cannot prove required analytics.

### Minimum Evidence to Request Later

- Snapshot key list (dataset, tables, views) used for reports.
- Freshness timestamp and export/refresh cadence.
- Aggregate or count fields for chapters, memberships, roles, events, points,
  outbox, and audit.
- Row-level batch/snapshot id for traceability.
- Owner/contact for the export or report.

### Exclusions and Boundaries (No-Write / No-Send)

- No production writes, inserts, updates, deletes, or schema mutations.
- No direct invite, user, membership, points, attendance, or roll-forward authority.
- No using warehouse aggregates as live production proof.
- No loading private keys, connection secrets, or raw secrets into shared artifacts.

### When to Ask

Ask only after launch evidence is stable and the team has approved a reporting use
case, such as:

- historical cohort or batch-completion reconciliation,
- operational dashboard support after outbox and audit are stable,
- non-production analysis for planning/decision support.

## 2) n8n — Approved Outbox Orchestrator Only

### Safe Future Role

- Future worker/orchestrator for approved integration actions already represented in
  `admin integration outbox` contracts.
- Replay-safe delivery and operational recovery only after contracts and audit
  gates are signed.

### Ask Pattern

1) Do not request access now.
2) When approved, request only workflow definitions/inventory and read-only run
   logs first.
3) Move to execution permissions only after explicit destination contracts and
   pause/replay/rollback process approval.

### Minimum Evidence to Request Later

- Destination contracts per workflow, including idempotency and dead-letter behavior.
- Allowed event set and retry policy.
- Owner/contact for workflow runs.
- Log retention and evidence of pause/rollback controls.
- Read endpoint for run status before any action permissions.

### Exclusions and Boundaries (No-Write / No-Action)

- No live workflow execution or trigger activation until explicitly approved.
- No workflow that can create invites, memberships, attendance, points,
  notifications, or external writes before approved gate.
- No credentials or secrets in rollout docs/CSV.
- Keep n8n separate from owner packet packet authority until DS approval.

### When to Ask

Ask only after:

- integration outbox + audit contracts are stable and reviewed,
- DS/NS have approved the destination set,
- coordinator confirms replay and rollback behavior is required for production
  operations.

## 3) Smile.io — Rewards Only After Points Ledger Stability

### Safe Future Role

- Auxiliary rewards and recognition connector after points governance is stable.
- Downstream sync path for reporting and optional rewards workflows.

### Ask Pattern

1) Prefer static export for rewards pilot design and field matching.
2) Request API access only if export cannot support the approved rewards pilot.

### Minimum Fields/Evidence to Request Later

- stable user identifier aligned to app identity (approved mapping field),
- eligible event/award category,
- points balance or reward status (read-only),
- reward campaign identifier,
- timestamp for last sync/update,
- source contact for the dataset or export.

### Exclusions and Boundaries (No-Grant / No-Reward)

- No reward issuance or points grant before myMEDLIFE points ledger is stable.
- No coupon/credit mutations, campaign automation, or user-facing reward
  assignments before gate.
- No replacing myMEDLIFE points as source of truth.
- No use for invite eligibility or production proof paths.

### When to Ask

Ask only after:

- points ledger and points routes are stable in launch evidence,
- signed-in route and pilot proof are complete,
- DS/HQ approve a scoped rewards pilot.

## What These Systems Cannot Replace

Warehouse, n8n, and Smile.io cannot replace:

- returned owner CSV validation,
- approved rollout packet and apply plan,
- Supabase/myMEDLIFE live data count proof,
- signed-in route proof,
- five-chapter pilot event proof,
- audit/outbox proof,
- final invite gate.

## Rollout Matrix Fit (Current-Lane View)

- **Rollout packet / 30-chapter data packet:** no direct impact. Supports reporting or
  follow-on coordination only.
- **Human handoff / launch owners:** no replacement for owner packet validation.
- **Invite batch readiness:** can support ops reporting once gates are already passed,
  not a gate input.
- **Live production data count proof:** no impact.
- **Signed-in route proof imports:** no impact.
- **Final invite gate readiness:** no direct impact; these systems cannot be used as
  gate authority.

## Plain-English Ask Block (Copy/Paste)

> We are not using this as a first-wave production proof source. Please use
> static exports first for reporting/recruitment-reward planning needs. If needed,
> request only narrow read-only access later after the invite gate evidence path is
> stable: read-only export/report access, no write scopes, and no production
> creation permissions. This cannot replace owner packet validation, Supabase live
> proof, route proof, pilot event proof, audit/outbox proof, or the final invite
> gate.
