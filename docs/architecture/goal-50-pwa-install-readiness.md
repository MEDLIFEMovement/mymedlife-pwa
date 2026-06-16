# Goal 50: PWA Install Readiness

Goal 50 adds the first safe install-readiness layer for the custom myMEDLIFE
PWA.

## What Changed

- Added a Next.js manifest route.
- Added app metadata that points browsers to the manifest and icon.
- Added one local SVG app icon.
- Added a test that verifies the manifest stays install-oriented.

## What This Enables

This helps browsers understand that myMEDLIFE is intended to behave like an app:

- app name
- short app name
- start URL
- app scope
- standalone display mode
- theme and background colors
- install icon

## What This Does Not Enable

This goal does not add:

- offline caching
- a service worker
- push notifications
- background sync
- live auth
- browser writes
- uploads
- public proof sharing
- external HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI writes

Offline behavior and notification behavior should be separate production
decisions because they affect reliability, privacy, cache invalidation, and
student-facing expectations.

## Safety Boundary

The app remains local/mock-safe. The manifest and icon are static app-shell
metadata only.
