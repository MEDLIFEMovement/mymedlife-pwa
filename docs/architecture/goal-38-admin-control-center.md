# Goal 38: Admin Control Center

Goal 38 adds a read-only, mock-safe admin control center to `/admin`.

This goal does not enable admin mutation controls, production Supabase, live
auth, browser writes, uploads, public proof publishing, n8n, HubSpot, Luma,
warehouse, Power BI, SMS/email, or AI writes.

## Why This Exists

The final MVP requires admin surfaces for:

- users
- roles
- chapters
- campaign templates
- integration events
- automation outbox
- audit logs
- system health placeholders

Earlier admin work focused on integration posture and write activation. Goal 38
names the broader admin control surface while keeping it read-only.

## Current Behavior

The admin page now shows:

- fake local user count
- role audience coverage
- chapter scope
- campaign shell/template count
- disabled outbox count
- audit-log readiness posture
- system health placeholders
- explicit safety posture showing admin writes, production auth, and external
  writes are off

## Boundaries

Admin mutation controls are intentionally absent. User, role, chapter, campaign,
audit, and system-health management remain placeholders until production auth,
RLS, audit, rollback, and environment monitoring are approved.

## Files

- `src/services/admin-control-center.ts`
- `src/components/admin-control-center-panel.tsx`
- `src/app/admin/page.tsx`
- `tests/admin-control-center.test.ts`

## Next Approval Needed

A later goal should define which admin mutation, if any, is safe to activate
first after live auth and RLS are approved.
