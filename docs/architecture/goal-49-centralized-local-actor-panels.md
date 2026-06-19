# Goal 49: Centralized Local Actor Panels

Goal 49 moves the existing local role context panels into the shared
`AppShell`.

## What Changed

- `AppShell` now renders the local actor notice when an actor is provided.
- `AppShell` now renders the local role switcher when an actor is provided.
- The switcher can set a local-only preview-role cookie so reviewers can move
  between fake member, leader, coach, and admin personas without changing env
  vars or enabling auth.
- Route files no longer import and render the same local actor panels by hand.

## Why

The local actor notice and role switcher are part of the review/debug frame, not
route-specific business logic. Keeping them in every route made the app harder
to maintain and easier to accidentally forget on future pages.

Centralizing them means:

- every actor-aware route shows the selected fake local role
- future routes inherit the reviewer context automatically
- route files stay focused on their page-specific work
- the role switcher message stays consistent

## Safety Boundary

This goal does not:

- enable live auth
- create production users
- enable browser writes
- save to Supabase from the browser
- upload or publish proof
- send HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI events
- change RLS policies or production database configuration

`MYMEDLIFE_LOCAL_ACTOR_EMAIL` remains a valid local-only fake role switch for
review, and the role switcher can now temporarily override it with a
browser-local preview cookie.

## Reviewer Outcome

A reviewer can open any actor-aware route and see which fake local role is being
previewed without needing each route to duplicate the same panels.
