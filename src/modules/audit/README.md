# Audit Module

## What This Owns
- Audit event conventions, metadata-safe event shape, and readback posture across flags, theme, integrations, writes, and review packets.

## What This Does Not Own
- Raw secrets, private payloads, or external log drains.

## Routes
- `/admin/audit-log`
- Audit sections inside `/admin/feature-flags`, `/admin/theme`, and integration pages.

## Components And Services
- Existing audit behavior currently lives inside feature flag, theme, integration, and write services.

## Data Models
- Audit record id, actor, role, environment, action/key, old/new state, reason, timestamp, and secret-free metadata.

## Flags
- `ds_admin_controls`
- `integrations_outbox`

## Permissions
- Sensitive audit readback is DS/Super Admin unless the route is an approved review packet.

## Integrations
- Future exports/log drains require explicit approval.

## Tests
- `tests/admin-audit-log-review.test.ts`
- `tests/feature-flags-theme-services.test.ts`
- `tests/admin-integrations-security.test.ts`

## Safe Modification
- Never add secrets, raw private payloads, or full user medical/payment data to audit records.

## TODOs
- Centralize audit builders behind this module.
