# Goal 134: Local Sign-In Review Coverage

Status: focused review coverage for the local sign-in route.

Goal 134 makes `/login` a first-class route in the MVP review path. The route
already existed for fake local Supabase Auth users; this goal makes it visible
in route smoke checks, stakeholder walkthroughs, live-data sequencing, and
release-readiness approval language.

## Purpose

The full MVP requires a login flow. For the current mock-safe build, `/login`
must demonstrate the fake local seed-user sign-in path without implying that
production users, production auth, profile writes, membership writes, browser
writes, or external sends are approved.

## What Changed

- `src/services/route-smoke-manifest.ts` includes `/login` as a critical route.
- `src/services/stakeholder-review-plan.ts` includes a local sign-in step.
- `src/services/live-data-connection-plan.ts` puts `/login` first in the route
  migration order.
- MVP coverage, progress, and release-readiness services now call out local
  sign-in as a formal review checkpoint.
- Tests cover the new route counts, review step, read-only sequencing, and
  release-readiness language.

## Safety Boundary

This does not enable production auth, production users, profile saves,
membership writes, browser writes, proof uploads, student invitations, or
external sends. Local sign-in remains a fake-seed-user review and localhost
testing path only.
