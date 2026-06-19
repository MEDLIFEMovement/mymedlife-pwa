# Goal 117: PWA Offline Recovery Shell

Goal 117 adds the first production-style offline recovery layer for the
myMEDLIFE PWA without changing auth, persistence, uploads, or integrations.

## What Changed

- Added `/offline` as a mobile-first recovery route.
- Added `public/sw.js` as a conservative service worker.
- Added `ServiceWorkerRegistration` to the root app shell.
- Added `pwa-offline-support` so registration rules and caching policy are
  typed and testable.
- Added route-registry coverage for `/offline`.
- Added `.env.example` guidance for local service-worker rehearsal.

## Registration Rules

The service worker registers automatically in production builds.

Local development registration requires:

```text
NEXT_PUBLIC_MYMEDLIFE_ENABLE_SERVICE_WORKER=true
```

This keeps normal local browser testing free from stale service-worker state
unless a reviewer is intentionally checking the PWA offline shell.

## Cache Policy

The service worker:

- uses network-first navigation
- falls back to `/offline` only when the app cannot be reached
- caches `/offline`, `/manifest.webmanifest`, `/icons/my-medlife-icon.svg`, and
  Next static assets
- ignores non-GET requests
- ignores cross-origin requests

It does not cache:

- Supabase reads
- API responses
- auth/session state
- chapter/member truth
- proof details
- audit rows
- integration/outbox payloads

## Still Disabled

Goal 117 does not enable:

- push notifications
- background sync
- offline assignment submission
- offline proof uploads
- offline points/KPI writes
- member nudges
- public proof publishing
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

## Review Path

1. Build or run the app with service-worker registration enabled.
2. Open `/offline` directly to review the fallback shell.
3. In a browser PWA/offline test, load the app once, go offline, and navigate to
   an app route.
4. Confirm `/offline` appears instead of stale private data.
5. Reconnect and confirm normal app routes load from the network.

## Launch Boundary

This is local/product readiness, not final launch proof. Real device install
checks, staging PWA QA, cache update behavior, accessibility checks, and support
owner approval are still required before a student pilot.
