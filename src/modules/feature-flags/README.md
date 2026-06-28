# Feature Flags Module

## What This Owns
- Central module/provider feature registry, environment-aware status evaluation, server-side helpers, and feature flag audit records.

## What This Does Not Own
- Live provider credentials, rollout decisions, or external side effects.

## Routes
- `/admin/feature-flags`

## Components And Services
- `constants.ts` defines registry/statuses/environments.
- `services/feature-flag-service.ts` exposes centralized helpers and audit storage.
- `/admin/feature-flags/actions.ts` handles audited server actions.

## Data Models
- `FeatureFlagDefinition`, `FeatureFlagResolvedState`, `FeatureFlagAuditRecord`, and flag key/status/environment unions.

## Flags
- This module defines all required module and provider flags.

## Permissions
- `canManageFeatureFlags` allows only DS Admin and Super Admin.

## Integrations
- Provider flags mark external API boundaries. Disabled providers must not call external APIs.

## Tests
- `tests/feature-flags-theme-services.test.ts`
- `tests/feature-flags-theme-pages.test.tsx`

## Safe Modification
- Add new flags in `types.ts` and `constants.ts`, then cover their default behavior in tests.

## TODOs
- Replace in-memory overrides with audited persistence after DS approves hosted storage.
