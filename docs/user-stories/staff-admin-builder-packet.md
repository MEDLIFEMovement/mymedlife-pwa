# myMEDLIFE Staff / Admin Builder Packet

Date: 2026-07-07  
Owner lane: `#3` Staff / DS Admin Command Center Builder  
Planning reference: MED-512  
Purpose: give the staff/admin shell builder a durable queue that preserves the
source-backed Staff Command Center and dark DS Admin shell while keeping live
ops and provider behaviors blocked.

## Sources Inspected

- `docs/user-stories/builder-ticket-packet.md`
- `docs/user-stories/latest-main-builder-crosswalk.md`
- `docs/user-stories/story-to-test-traceability.md`
- `docs/user-stories/delivery-backlog.md`
- `src/app/staff/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/system-health/page.tsx`
- `src/app/admin/audit-log/page.tsx`
- `src/app/admin/integration-outbox/page.tsx`
- `src/app/admin/integrations/luma/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/chapters/page.tsx`
- `src/app/admin/access/page.tsx`
- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`

## Shell Contract

- Repo truth sets implementation status.
- Exported/Figma Staff Command Center and dark DS Admin shell are the visual
  contract.
- Source-backed menu families stay visible even when actions are blocked.
- Visible fake staff/admin/provider rows must keep `TEST`.
- No staff/admin PR should imply live provider writes, secret access, outbox
  sends, role mutations, owner CSV apply, or launch-gate advancement.

## Current Staff / Admin Truth

- Built or launch-reviewable: `/staff?view=chapters`, `/admin`, core DS Admin menu family
- Partial: staff event/leaderboard readback, admin users/chapters/access review,
  system health and audit readback
- Preview-only: campaigns, proof/UGC, best practices, SOPs, integrations, API
  Keys, MCP, admin operations verbs
- Rollout-blocked: production staff/admin proof, owner data truth, live counts,
  pilot proof, invite gate

## Recommended Next Slices

### 1. BL-028 - DS Admin integrations / API Keys / MCP clarity

- In scope:
  - `/admin`
  - `/admin/integration-outbox`
  - `/admin/integrations/luma`
  - `src/components/figma-admin-panel.tsx`
  - relevant admin tests
- Goal:
  - keep dark-admin fidelity while making every provider/API/MCP verb clearly
    blocked, masked, read-only, or preview-only
- Must stay blocked:
  - key reveal/copy/rotate/revoke, provider connect/test/send, MCP writes,
    outbox replay/retry/send

### 2. BL-029 - System Health + Audit Logs read-only clarity

- In scope:
  - `/admin/system-health`
  - `/admin/audit-log`
  - read-only admin ops language and tests
- Goal:
  - make ops-review surfaces useful without implying live repair actions or
    production health proof
- Must stay blocked:
  - incident actions, health refresh as live repair, audit mutation

### 3. BL-030 - Users / Chapters / Access review parity

- In scope:
  - `/admin/users`
  - `/admin/chapters`
  - `/admin/access`
  - blocked mutation copy/tests
- Goal:
  - keep admin review surfaces visible and honest without drifting into owner
    truth or production mutation claims
- Must stay blocked:
  - invites, owner CSV apply, role/chapter/user writes, rollout packet changes

### 4. BL-023 / BL-024 - Staff preview surfaces follow-through

- In scope:
  - staff campaigns/Rush Month
  - staff proof/UGC
  - best practices and campaign SOPs where source-backed
- Goal:
  - preserve visible support surfaces while making publish/moderate/sync verbs
    explicitly preview-only
- Must stay blocked:
  - campaign publish, QR/contact capture, proof ingestion, moderation, publish,
    social/provider sync

## Do-Not-Touch Boundaries

- No member or leader shell work
- No auth/data-safety service changes unless scope is explicitly widened
- No rollout evidence artifacts or owner-data handling
- No provider/API access or production secrets work

## Acceptance Checks

- Staff top-nav and DS Admin dark menu family remain source-faithful
- Visible fake staff/admin/provider/audit rows keep `TEST`
- Source-backed menu items stay visible
- Controls are route-backed, blocked, disabled, read-only, or preview-only
- No fake-live wording for providers, outbox, audit, health, or role/admin mutations

## Model Recommendation

Use `gpt-5.4` medium for implementation. Use `gpt-5.4-mini` only for acceptance
checklists or review follow-through.

## Matrix Guidance

Staff/admin shell PRs may support modest Staff / Admin / DS Admin `Scope/UI`
and `QA/Ops` movement once landed and smoked. They must not move `Data/Auth`,
`Writes/Integrations`, or `Rollout Gate` by themselves.
