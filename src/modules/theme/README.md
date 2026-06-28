# Theme Module

## What This Owns
- MEDLIFE design tokens, theme draft/publish/rollback/default restore behavior, contrast checks, CSS variable output, and theme audit records.

## What This Does Not Own
- Pixel-perfect redesign, Figma token extraction, or production theme persistence.

## Routes
- `/admin/theme`

## Components And Services
- `constants.ts` defines default MEDLIFE tokens and contrast pairs.
- `services/theme-service.ts` owns server-side theme operations and audit behavior.
- `/admin/theme/actions.ts` handles route server actions.

## Data Models
- `ThemeTokenValue`, `ThemeSnapshot`, `ThemeContrastResult`, and `ThemeAuditRecord`.

## Flags
- `theme_design_system`

## Permissions
- DS Admin and Super Admin can manage tokens. Super Admin can override blocked contrast with a reason.

## Integrations
- None. Pantone values are metadata only; the browser renders hex/CSS variables.

## Tests
- `tests/feature-flags-theme-services.test.ts`
- `tests/feature-flags-theme-pages.test.tsx`

## Safe Modification
- Add tokens to `types.ts`, `constants.ts`, contrast pairs, and tests together.

## TODOs
- Persist snapshots and audit records after DS approves hosted storage.
