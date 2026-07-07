# Integrations Map

Last updated: 2026-07-07

The current launch posture is evidence-first, not provider-automation-first.

## Current Rule

Supabase and myMEDLIFE are the operational source of truth for launch. External systems may support evidence later, but they do not approve invites, create production users, send messages, award production points, or replace app/audit/outbox proof.

## Provider Status

| Provider/source | Current launch role | Approved access now? | Write posture | DS guidance |
| --- | --- | --- | --- | --- |
| Supabase / myMEDLIFE | App operational truth. | App-owned. | Only through approved app/admin/write gates. | DS should own schema/RLS/readback governance. |
| Luma | Event calendar, RSVP, attendance evidence source where approved. | Not broad API access. Static/read-only first. | No event create/update/delete, reminders, webhooks, or writeback. | Ask after 30-chapter slate approval and before five-chapter proof. |
| HubSpot | Possible source for real chapter/contact/owner data. | Not yet. Static/read-only first. | No contact/company/deal/task/lifecycle writes. | Ask only after owner-return gaps show missing fields. |
| n8n | Future outbox worker/orchestrator. | No. | Disabled. No workflow execution or replay. | Do not request credentials until one outbox destination is approved. |
| Warehouse / BigQuery / Databricks | Future downstream analytics/read model. | No. | No app writes or invite decisions. | Use only after live app data proof and reporting owner exist. |
| Hootsuite / Instagram / social leads | Future recruitment-source support. | No. | No direct app users/memberships/invites/points. | Route through approved consent/dedupe path later. |
| Smile.io | Future rewards/recognition. | No. | No reward grants, sync, coupons, or points mutation. | Wait until points ledger and audit proof are stable. |
| Email/SMS/push | Future communication channels. | No live sends from current preview surfaces. | No sends. | Require outbox, audit, idempotency, stop/replay, and approval. |
| MCP | Admin-visible blocked review surface. | No implementation in #6. | Blocked. | Keep out of this lane unless explicitly re-added. |

## Minimum Future Access Order

1. Finish owner CSV return intake and approved rollout packet.
2. Use HubSpot static export or read-only access only for missing chapter/contact/owner fields.
3. Use Luma read-only export/access for approved chapter calendar mappings and five-chapter event proof.
4. Apply production data through the approved Supabase path and capture live count proof.
5. Capture signed-in route proof and zero-send audit/outbox proof.
6. Revisit warehouse, n8n, Smile.io, and social sources only after event/outbox/audit proof is stable.

## What Integration Evidence Cannot Replace

- Real owner-returned data.
- Production Supabase/app rows.
- Signed-in route proof.
- Audit logs.
- Outbox zero-send proof.
- Human invite approval.
- Rollback/support/apply owner confirmation.

## DS Warning Signs

- A provider export is being treated like app truth.
- A provider key is visible in a browser route, screenshot, CSV, or doc.
- A preview screen says "sent", "synced", "connected", or "live" without audit/outbox proof.
- A Test/Figma row appears in production rollout evidence.
- An automated workflow can replay or send without a named owner and pause procedure.
