# Production Invite-Gate Evidence Integrity Checklist

Use this as the last quick gate-check before treating rollout evidence as valid for any invite decisions.

This lane is evidence-only: **do not** send email, run owner `--apply`, query production counts, assemble a packet from incomplete returns, or request external provider access.

## What the invite gate currently trusts

The final invite gate reads only these evidence groups:

- 30-chapter rollout packet readiness
- production live-data count proof
- five-chapter pilot event proof
- invite-batch readiness
- signed-in route proof
- workspace/owner handoff confirmations

Everything else is context only until these are present and aligned.

## Hard non-count list (must be explicitly excluded)

Any of these **never** satisfy final invite-gate evidence on their own:

- provider planning templates or API/data requests
  - HubSpot request templates / exports
  - Luma mappings and event exports
  - Hootsuite or Instagram lead exports
  - warehouse/BI/analytics feeds
  - Smile.io / n8n / other future lane artifacts
- fake, draft, or rehearsal artifacts
  - `Test`, `Figma`, `preview`, sandbox rehearsals, SOP/sample rows
  - staging rows or preview-cookie proof
- local/operator artifacts
  - local auth or local-only profile setup notes
  - screenshots without real app-route proof links
  - missing-profile sessions
- production-like-looking status without required readback fields
  - missing `checkedAt` timestamps
  - missing `reviewedByEmail`
  - missing audit route / outbox route links

## What must be present for each production proof group

### Rollout packet

- `production-rollout-packet.json` exists from **validated** owner returns + shared CSVs.
- Packet validator is clean (no placeholders, no Test/Figma markers, no draft/sample rows).

### Live-data proof

- count proof command has run and passed against the approved packet.
- proof must include expected active chapter/member/event/automation counts.
- outbox unsafe send count must be zero.

### Signed-in route proof

- at least one confirmed passed route row each for:
  - student/member, leader, staff, and admin paths
- reviewer timestamp + route path must match known launch routes.

### Five-chapter pilot proof

- at least five proven chapters
- each ready row must include:
  - event + Luma ids
  - RSVP + attendance + points counts
  - recorded audit evidence
  - zero-send outbox status
  - all required proof routes
  - reviewer email + valid timestamp

### Owner handoff/readiness

- 7/7 owners assigned
- returned + validated owner status reflected in current status tooling
- support / rollback / production-apply ownership confirmed and documented.

## Evidence integrity checks before any operator action

Run this order when required inputs are available:

1. `pnpm rollout:gaps`
2. `pnpm rollout:check production-rollout-packet.json`
3. `pnpm production:pilot-event-proof --packet production-rollout-packet.json`
4. `pnpm production:signed-in-route-proof --packet production-rollout-packet.json`
5. `pnpm production:data-counts > production-live-data-counts.txt`
6. `pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt --out production-invite-gate.md`

If any command reports blockers, stop and do not proceed.

## Guardrails for operator review

- Never treat provider templates or exported provider files as a replacement for Supabase/myMEDLIFE evidence.
- Never combine a screenshot with no route/timestamp/reviewer evidence and mark it as proof.
- Never mark the invite gate ready until all blockers in the check output are gone.
- Keep all provider/template actions in future-lane request docs and label them as **supporting context only**.

## Recommendation to Coordinator

If this checklist and command outputs are clean, we can treat the environment as evidence-ready-ready-on-paper.
If not, the lane remains blocked on the next unresolved evidence source.
