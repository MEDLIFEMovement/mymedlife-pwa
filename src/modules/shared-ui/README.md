# Shared UI Module

## What This Owns
- Reusable cards, pills, progress bars, tables, empty states, form patterns, restricted states, and accessible shared UI primitives.

## What This Does Not Own
- Role-specific workspace identity or business logic.

## Routes
- None directly.

## Components And Services
- Existing implementation lives across `src/components`.

## Data Models
- Presentational props only. Business state should be resolved before data reaches shared UI.

## Flags
- Shared UI should render graceful fallback states supplied by feature modules.

## Permissions
- Shared UI may display restricted states but must not be the only security boundary.

## Integrations
- None directly.

## Tests
- Page and component tests across member, leader, staff, and admin surfaces.

## Safe Modification
- Keep shared UI generic and avoid importing domain services into low-level components.

## TODOs
- Move truly shared components into this module after route parity settles.
