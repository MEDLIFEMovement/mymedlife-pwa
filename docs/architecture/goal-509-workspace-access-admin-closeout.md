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
| Student leader keeps `/app` access | `tests/workspace-access.test.ts`, `tests/home-page.test.tsx` |
| Staff defaults to `/staff` | `tests/workspace-access.test.ts`, `tests/staff-page.test.tsx` |
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
| Access changes immediately affect allowed/default workspace | `tests/admin-management.test.ts`, `supabase/tests/database/rls_goal_509.test.sql`, RPC readback fields `default_workspace` and `allowed_workspaces` |
| Tests cover access, admin, role, chapter, and destructive safeguards | `tests/workspace-access.test.ts`, `tests/admin-management.test.ts`, `tests/admin-users-actions.test.ts`, `tests/admin-chapters-actions.test.ts`, `supabase/tests/database/rls_goal_509.test.sql`, `supabase/tests/database/rls_goal_509_chapters.test.sql` |
| Admin access matrix shows audit posture fields | `tests/admin-management-pages.test.tsx`, `src/components/admin-access-management-panel.tsx` |

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

## Closeout Decision

Local code and tests support the Goal 509 access/admin model. The goal should
remain open until hosted staging evidence proves the same behavior against the
approved staging Supabase project and reviewer sign-in path.
