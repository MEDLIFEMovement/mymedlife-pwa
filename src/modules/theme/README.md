# Theme Module

## What This Owns
- MEDLIFE design tokens, theme draft/publish/rollback/default restore behavior, contrast checks, CSS variable output, theme audit records, and Supabase-backed theme snapshot persistence when enabled.

## What This Does Not Own
- Pixel-perfect redesign, Figma token extraction, or production launch approval for theme changes.

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
- `tests/theme-durable-update.test.ts`
- `tests/theme-published-css-durable.test.ts`
- `tests/admin-control-actions.test.ts`

## Safe Modification
- Add tokens to `types.ts`, `constants.ts`, contrast pairs, and tests together.

## TODOs
- Keep the memory fallback limited to review sessions where the control layer is intentionally off or no Supabase session is active.
- Add coverage whenever a new token needs durable publish/rollback behavior or a new production approval rule.
