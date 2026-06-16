# Goal 51: Page Metadata

Goal 51 adds clear browser/page metadata for the main local review routes.

## What Changed

- Added a small static route metadata registry.
- Added page titles and descriptions for the core myMEDLIFE routes.
- Updated the root layout to use a title template.
- Added tests that keep the route metadata complete and plain-English.

## Why

Reviewers should be able to tell where they are from the browser title, not
only from the page body. This also prepares the app for future install/share
polish without changing any data behavior.

## Safety Boundary

This goal does not:

- enable live auth
- enable browser writes
- change route permissions
- change RLS policies
- upload or publish proof
- add service workers, offline caching, push notifications, or external writes

The change is static metadata only.
