# Warehouse / Analytics Read-Model Request Template

Use this only after the rollout lane has enough real myMEDLIFE evidence that a
warehouse is clearly downstream analytics, not launch truth.

This template is for future use with BigQuery, Databricks, or a similar
warehouse. It does not request access now.

## Why This Exists

- myMEDLIFE/Supabase stays the operational source of truth for launch.
- The warehouse can help with reporting, reconciliation, and planning after the
  main rollout evidence is real.
- The warehouse must never become the authority for invites, users,
  memberships, points, or the final invite gate.

## Safe Future Role

- Downstream reporting
- Cohort and chapter analytics
- Batch health and freshness checks
- Historical reconciliation
- Support dashboards after launch evidence is stable

## Ask Pattern

1. Do not make the warehouse part of the first invite-gate decision.
2. Prefer a static export or report first.
3. Ask for read-only dataset, report, or export access only if the export is not
   enough and the app/live-count/audit/outbox foundations are already stable.

## Minimum Fields For A Later Ask

Request only the smallest useful read-only set:

- aggregate counts
- chapter or cohort key
- campaign or event ids
- snapshot or batch key
- freshness timestamp
- report owner
- SLA or refresh cadence
- source system identifiers
- approved anonymized or deduped metrics

## Exclusions And Boundaries

Do not ask for:

- write credentials
- inserts, updates, deletes, or schema changes
- invite approvals from warehouse rows
- raw sensitive notes
- private messages
- secrets or tokens
- provider write scopes
- any use of warehouse data to bypass Supabase or myMEDLIFE app truth

## When To Ask

Ask only after the evidence gap report shows the analytics need is real and
after these foundations are stable:

- returned owner packets
- production rollout packet
- live production counts
- signed-in proof
- five-chapter pilot proof
- audit/outbox zero-send proof

Do not ask before the first invite gate.

## What The Warehouse Cannot Replace

Warehouse data cannot replace:

- owner CSV review
- Supabase or app truth
- signed-in role proof
- pilot proof
- audit/outbox zero-send proof
- the final invite gate

## Matrix Fit

This template does not move any rollout percentage by itself.

Later, it can support reporting confidence, but it is never a substitute for the
real rollout evidence.

## Plain-English Ask Block

> We are keeping the warehouse downstream only. If we need it later, please
> provide either a static export or read-only dataset/report access with the
> minimum fields above. Please do not provide write access, invite authority, or
> anything that could replace Supabase/myMEDLIFE evidence.

## Companion References

- `docs/integration-readiness-map.md`
- `docs/later-lane-integration-readiness-template.md`
- `docs/production-rollout-missing-evidence-gap-report.md`
