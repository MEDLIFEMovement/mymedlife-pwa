# Goal 509: Workspace Access and Admin Management Closeout

Status: local implementation complete, hosted staging proof still required.

Goal 509 is the production-blocking access and admin-management lane for
myMEDLIFE. It covers permanent workspace access rules, the profile view
switcher/logout path, staff preview mode, DS/Super Admin user management, DS/Super
Admin chapter management, and audited access changes.

This packet records what is proven in the repo today and what still needs
hosted staging evidence before the goal can be called launch-ready.

## Implemented Scope

- Central workspace helpers:
  - `getAllowedWorkspaces`
  - `getDefaultWorkspace`
  - `canAccessWorkspace`
  - `isStudentLeader`
  - `isStaffUser`
- Workspace keys:
  - `student_app`
  - `leader_command_center`
  - `staff_command_center`
  - `admin_backend`
  - `slt_prep`
- Profile/account menu with:
  - name and email
  - current workspace
  - available workspace links from the centralized helper
  - read-only preview labels
  - logout action
- Server-rendered route guards for:
  - `/app`
  - `/leader`
  - `/staff`
  - `/admin`
  - `/admin/users`
  - `/admin/chapters`
  - `/admin/access`
- Staff/admin preview posture:
  - staff can read student and leader surfaces
  - preview surfaces show `Preview Mode - read-only`
  - submit, approve, reject, message, integration-trigger, check-in,
    points-change, delete, and other write intents are blocked in
    `canAccessWorkspace`
- Admin user management:
  - list/search/filter
  - access summary
  - role and chapter membership changes
  - staff role changes
  - coach portfolio changes
  - deactivation/reactivation
  - destructive-action safeguards
  - audited local Supabase RPC path
- Admin chapter management:
  - list/search/filter
  - create chapter
  - edit chapter name, school, region, and status
  - assign/remove coach
  - assign/remove student leader
  - archive/disable chapter
  - hard delete blocked
  - audited local Supabase RPC path

## Evidence Map

| Requirement | Current evidence |
| --- | --- |
| General member defaults to `/app` | `tests/workspace-access.test.ts`, `tests/home-page.test.tsx` |
| Student leader defaults to `/leader` | `tests/workspace-access.test.ts`, `tests/leader-page.test.tsx` |
| All goal-listed student leader roles map to `/leader` plus `/app` access | `tests/workspace-access.test.ts` |
| Student leader keeps `/app` access | `tests/workspace-access.test.ts`, `tests/home-page.test.tsx` |
| Staff defaults to `/staff` | `tests/workspace-access.test.ts`, `tests/staff-page.test.tsx` |
| All goal-listed staff roles get student-surface preview access | `tests/workspace-access.test.ts` |
| Staff can preview `/app` and `/leader` read-only | `tests/workspace-access.test.ts`, `tests/home-page.test.tsx`, `tests/leader-page.test.tsx`, `src/components/workspace-preview-banner.tsx` |
| DS/Super Admin can access `/admin` | `tests/workspace-access.test.ts`, `tests/admin-management-pages.test.tsx` |
| Profile menu includes views and logout | `tests/workspace-account-menu.test.tsx`, `src/components/workspace-account-menu.tsx` |
| Logout redirects to `/login` and clears preview state | `tests/login-actions.test.ts`, `src/app/login/actions.ts` |
| Unauthorized cross-shell access is blocked server-side | `tests/leader-page.test.tsx`, `tests/staff-page.test.tsx`, `tests/admin-management-pages.test.tsx` |
| `/admin/users` exists and is DS/Super Admin only | `src/app/admin/users/page.tsx`, `tests/admin-management-pages.test.tsx` |
| Admin can view/search users | `src/components/admin-users-management-panel.tsx`, `tests/admin-management-pages.test.tsx`, `tests/admin-management-data.test.ts` |
| Admin can change user roles/access/chapter membership | `src/app/admin/users/actions.ts`, `src/services/admin-management-write.ts`, `supabase/tests/database/rls_goal_509.test.sql` |
| Admin can promote/demote student leaders | `supabase/tests/database/rls_goal_509.test.sql`, `tests/admin-users-actions.test.ts` |
| User deactivate/delete safeguards exist | `src/services/admin-management.ts`, `tests/admin-management.test.ts`, `tests/admin-users-actions.test.ts` |
| `/admin/chapters` exists and is DS/Super Admin only | `src/app/admin/chapters/page.tsx`, `tests/admin-management-pages.test.tsx` |
| Admin can create/edit/archive chapters | `src/app/admin/chapters/actions.ts`, `supabase/tests/database/rls_goal_509_chapters.test.sql` |
| Admin can assign coaches and student leaders | `supabase/tests/database/rls_goal_509_chapters.test.sql`, `tests/admin-chapters-actions.test.ts` |
| Chapter destructive safeguards exist | `src/services/admin-chapter-management-write.ts`, `tests/admin-chapters-actions.test.ts`, `supabase/tests/database/rls_goal_509_chapters.test.sql` |
| Hosted staging admin user and chapter actions stay behind the approved staging flag posture | `tests/admin-users-actions.test.ts`, `tests/admin-chapters-actions.test.ts`, `tests/admin-management-write.test.ts`, `tests/supabase-auth-config.test.ts` |
| Access changes immediately affect allowed/default workspace | `tests/admin-management.test.ts`, `supabase/tests/database/rls_goal_509.test.sql`, RPC readback fields `default_workspace` and `allowed_workspaces` |
| Tests cover access, admin, role, chapter, and destructive safeguards | `tests/workspace-access.test.ts`, `tests/admin-management.test.ts`, `tests/admin-users-actions.test.ts`, `tests/admin-chapters-actions.test.ts`, `supabase/tests/database/rls_goal_509.test.sql`, `supabase/tests/database/rls_goal_509_chapters.test.sql` |
| Admin access matrix shows audit posture fields | `tests/admin-management-pages.test.tsx`, `src/components/admin-access-management-panel.tsx` |
| `/admin`, `/admin/users`, `/admin/chapters`, and `/admin/access` render for DS Admin and Super Admin | `tests/admin-management-pages.test.tsx` |
| `/admin`, `/admin/users`, `/admin/chapters`, and `/admin/access` block member, leader, and non-DS staff actors server-side | `tests/admin-management-pages.test.tsx` |

## Safety Boundary

Goal 509 does not approve production writes.

The server-backed admin actions stay locked unless both local-only flags are
enabled:

- `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`
- `MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE=true`

For the hosted staging rehearsal, the same admin action code can be enabled only
on the approved staging auth path and only when both staging flags are present:

- `MYMEDLIFE_AUTH_MODE=staging_supabase`
- `MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES=true`
- `MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE=true`

The write config keeps external writes disabled in both local and hosted staging
rehearsals. Production auth refuses the admin write flag. No HubSpot, Luma, n8n,
warehouse, Power BI, SMS, email, AI, proof-upload, or production-auth behavior is
enabled by this lane.

Hard chapter delete is not exposed through the live chapter management RPC.
User destructive actions require confirmation, a reason, actor checks, and Super
Admin safeguards.

## Remaining Hosted Evidence

The following evidence is still required before Goal 509 can be closed as
launch-ready:

1. Hosted staging reviewer signs in as DS Admin or Super Admin.
2. Hosted `/admin/users` renders the server-backed access panel.
3. Hosted `/admin/chapters` renders the server-backed chapter panel.
4. A staging-only role promotion changes the target user's allowed workspaces and
   default workspace in readback.
5. A staging-only role demotion removes leader access from readback.
6. A staging-only chapter create/edit/archive flow writes one audit row per
   operation.
7. A staging-only coach or student leader chapter assignment writes one audit row.
8. The target user signs in after access changes and lands on the updated default
   workspace.
9. Manual URL tests confirm unauthorized workspace access redirects server-side.
10. Admin write flags are turned back off after the rehearsal.

## Hosted Staging Rehearsal Script

Run this only after PR 181 is approved and merged, and only against
`https://staging.mymedlife.org`.

Pre-check:

1. Confirm the staging app is using the staging Supabase project, not production.
2. Confirm a DS Admin or Super Admin reviewer can sign in on staging.
3. Confirm the staging database has one safe target test user and one safe target
   test chapter. Use test records only; do not rehearse on real students or live
   chapter data.
4. Confirm external sends, uploads, HubSpot, Luma, n8n, warehouse, Power BI, SMS,
   email, and AI actions remain disabled.
5. Turn on both staging rehearsal flags for the narrow rehearsal window:
   - `MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES=true`
   - `MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE=true`

User access rehearsal:

1. Sign in as DS Admin or Super Admin.
2. Open `/admin/users`.
3. Confirm the page shows `Server-backed access changes`.
4. Search for the safe target test user.
5. Use `Save chapter role` to promote the target user to a student leader role,
   such as `action_committee_chair`, with a clear audit reason.
6. Capture the result URL or screen showing
   `adminAccessResult=admin_access_changed`.
7. Open `/admin/access` and capture readback showing the target user's updated
   allowed workspaces and default workspace.
8. Sign in as the target user and confirm the user lands on `/leader`, can open
   `/app`, and cannot open `/admin`.
9. Return to `/admin/users`, use the demotion/removal control to remove leader
   access, and capture readback showing leader access is removed.

Chapter management rehearsal:

1. Open `/admin/chapters`.
2. Confirm the page shows `Server-backed chapter changes`.
3. Use a safe test chapter to run one create or edit operation with a clear audit
   reason.
4. Use `Assign student leader` or the coach assignment control against a safe
   test user and capture the success result.
5. Use `Archive chapter` only on the safe test chapter and capture the success
   result.
6. Confirm hard delete remains blocked or unavailable for active/historical data.
7. Open `/admin/access` or `/admin/audit-log` and capture audit rows for each
   operation, including actor, actor role, target, action, old value, new value,
   reason, timestamp, and environment.

Manual route guard rehearsal:

1. As a general member, manually open `/leader` and confirm redirect to `/app`.
2. As a student leader, manually open `/app` and confirm access is allowed.
3. As a student leader, manually open `/admin` and confirm redirect to
   `/leader?view=overview`.
4. As non-DS staff, manually open `/admin` and confirm redirect to
   `/staff?view=chapters`.
5. As staff, manually open `/app` and `/leader` and confirm the preview banner
   says `Preview Mode - read-only`.

Rollback:

1. Turn off both staging rehearsal flags:
   - `MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES=false`
   - `MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE=false`
2. Redeploy or refresh staging environment configuration as required by Vercel.
3. Re-open `/admin/users` and `/admin/chapters` and confirm write controls return
   to the locked posture.
4. Confirm no external sends, uploads, or integration outbox sends fired during
   the rehearsal.
5. Post screenshots, result URLs, audit row IDs, and the flag-off confirmation to
   MED-509 before marking the issue complete.

## Closeout Decision

Local code and tests support the Goal 509 access/admin model. The goal should
remain open until hosted staging evidence proves the same behavior against the
approved staging Supabase project and reviewer sign-in path.
