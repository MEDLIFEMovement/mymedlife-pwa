# Production Functionality Wiring Audit

Date: 2026-07-05

Status: branch-local review pass. This is not a production promotion record.

## Scope

This pass checks that the production-facing Figma-coded shells are functionally honest for the current launch lane: events, RSVP, attendance/check-in, points, leaderboard, login/logout, workspace routing, and admin safety review.

The pass does not redesign the Figma shells and does not enable new live external writes.

## Current Launch Lane

The app is intentionally narrowed to:

- one sign-in area
- member mobile app
- student leader command center
- staff command center
- DS/Admin backend
- Luma status and outbox safety review
- events, RSVP, attendance/check-in, points, and leaderboards

Non-launch modules remain hidden, disabled, or clearly marked as blocked.

## Wiring Summary

| Area | Current wiring | Safety posture |
|---|---|---|
| Login | `/login` is the single entry surface. Authentication/session role decides destination. | Role card choice is guidance only, not permission authority. |
| Member app | `/app` renders the copied Figma mobile shell. Home, event cards, RSVP, check-in, points, route-level Events, route-level Points, and Profile are clickable. | Local/mock-safe event state only. No external sends. |
| Student leader | `/leader?view=*` renders the copied Figma command center with route-backed menu items. Leaderboard and event views render real matching screens. | Event create is staged/blocked until write approval. |
| Staff | `/staff?view=*` renders the copied Figma staff shell with real menu links, chapter table filters, event operations, and organization leaderboard. | Filters/readbacks are local/mock-safe. |
| Admin | `/admin` renders the copied admin backend shell. Route-level Users, Chapters, Access, Luma, Audit Log, Integration Outbox, Launch Gate, and Pilot Scope are registered for smoke review. | Admin routes stay role-guarded. Secret and integration writes remain blocked. |
| SLT Prep | `/app/slt-prep` remains accessible as the existing traveler alias, but launch-lane navigation does not promote it as a primary module. | Shown as staged/readiness work, not launch-critical production readiness. |

## Visible Admin Smoke Gap Fixed

The manual smoke manifest previously focused on 16 launch-lane routes and missed three visible admin navigation routes:

- `/admin/users`
- `/admin/chapters`
- `/admin/access`

Those routes are now part of the launch-lane smoke contract, bringing the manifest to 19 routes.

## Event And Points Loop

The member shell now has browser coverage for:

1. Open `/app`
2. Click the home RSVP button
3. Open `Intro GBM`
4. RSVP to the event
5. See RSVP confirmation
6. Go to check-in
7. Confirm check-in
8. See `+20 points`
9. Open the member points/leaderboard view

This is still local/mock-safe behavior. It proves the path is visible and clickable, not that Luma or a production points ledger is live.

## Staff Portfolio Loop

The staff command center now has browser coverage for:

- chapter type filtering
- RSVP column visibility
- attendance column visibility
- yearly points column visibility
- filtered `Needs review` chapter rows

This supports the first-five-chapter and eventual 300-chapter event/points review model without widening the UI scope.

## External Systems

Still off unless separately approved:

- Luma event create/update writes
- Luma RSVP writeback
- Luma attendance import
- HubSpot writes
- n8n execution
- warehouse / Power BI writes
- SMS/email sends
- AI actions

## Remaining Production Risks

- This is local branch evidence until merged and deployed.
- Production data, real auth, production Supabase, and production Vercel settings still require their own rollout evidence.
- Browser smoke confirms the visible launch-lane path, not full broad-app readiness.
- Live Luma writes and production points materialization remain approval-gated.
