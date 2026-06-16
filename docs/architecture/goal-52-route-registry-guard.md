# Goal 52: Route Registry Guard

Goal 52 adds a small route registry and tests that keep role-aware navigation
and manual smoke-test routes pointed at known app routes.

## What Changed

- Added an app route registry for the current local review routes.
- Added tests proving primary navigation links are known routes.
- Added tests proving mobile quick navigation links are known routes.
- Added tests proving the admin route smoke manifest only references known
  routes.

## Why

As the app adds more role-aware navigation, it is easy to accidentally create a
broken link. This guard catches broken internal route references before they
reach a reviewer or student.

## Safety Boundary

This goal does not:

- add routes
- change route permissions
- change navigation labels or visibility
- change data loading
- enable auth, writes, uploads, public proof sharing, or external integrations

It is a testable maintainability guard only.
