# Integrations Module

## What This Owns
- Provider registry, integration security console, outbox posture, mock-safe connection tests, and disabled-provider boundaries.

## What This Does Not Own
- Raw secrets in browser state, live external sends, production provider tests, or hosted secret manager provisioning.

## Routes
- `/admin/integrations`
- `/admin/integrations/[provider]`
- `/admin/integrations/audit`
- `/admin/integration-outbox`

## Components And Services
- Provider catalog, redaction utilities, metadata-only credential store, audit events, and outbox review surfaces.

## Data Models
- Integration provider, environment, connection status, secret reference, audit event, and redacted provider error.

## Flags
- `integrations_outbox`
- Provider flags: `integration_luma`, `integration_hubspot`, `integration_shopify`, `integration_givelively`, `integration_bigquery`, `integration_powerbi`, `integration_n8n`, `integration_openai`.

## Permissions
- DS/Super Admin own secure integration controls. General staff can read approved review surfaces only.

## Integrations
- HubSpot, Luma, Shopify, GiveLively, BigQuery, Power BI, n8n, and OpenAI are disabled unless their flags and approvals allow them.

## Tests
- `tests/admin-integrations-security.test.ts`
- `tests/admin-integrations-guard.test.ts`
- `tests/admin-integration-outbox-page.test.tsx`

## Safe Modification
- Provider code must fail closed and sanitize errors before returning to the browser.

## TODOs
- Move existing integration services into this module.
