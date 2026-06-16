# Goal 48: Mobile Navigation And Reviewer UX Polish

Goal 48 improves the mobile-first review experience without changing data
ownership, auth, writes, uploads, public proof sharing, or external automation.

## What Changed

- Added role-aware mobile quick navigation for local fake actors.
- Added active route styling for the primary navigation.
- Added a fixed mobile bottom navigation so phone reviewers can reach the most
  important route for their role quickly.
- Added a skip link and shared focus-visible styling for keyboard review.
- Added tests for member, chapter leader, DS Admin, and Super Admin mobile
  shortcut behavior.

## Role-Specific Shortcuts

General Member:

- My Week
- Actions
- Proof
- Chapter

Chapter Leader:

- Rush
- Team
- Review
- Loop

Coach:

- Health
- Work
- Coach
- Proof

Admin:

- Admin
- Proof
- Rush
- Coach

DS Admin:

- Outbox
- Checks

Super Admin:

- Admin
- Rush
- Loop
- Coach

## Safety Boundary

This goal does not:

- enable live auth
- enable browser writes
- save to Supabase from the browser
- upload proof files
- publish proof publicly
- send HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI events
- change RLS policies or production database configuration

The DS Admin mobile shortcuts intentionally stay focused on disabled outbox
safety checks and do not expose student, chapter, points, KPI, or proof truth.

## Reviewer Outcome

A reviewer can switch `MYMEDLIFE_LOCAL_ACTOR_EMAIL`, open the app locally, and
see mobile-friendly shortcuts that match the selected role. The app remains
read-only and mock/local-safe.
