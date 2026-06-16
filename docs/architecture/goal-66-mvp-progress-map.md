# Goal 66: MVP Progress Map

## Purpose

Goal 66 adds a plain-English MVP progress map for admin reviewers. The project
has enough layers now that stakeholders need a clear answer to: what is locally
reviewable, what is partially ready, what needs explicit approval, and what is
still future build work?

This goal does not enable production auth, production data, app writes beyond
the already approved local slices, uploads, public proof sharing, admin
mutations, or external integrations.

## What It Adds

- `getMvpProgressMap(actor)` in `src/services/mvp-progress-map.ts`
- `MvpProgressMapPanel` on `/admin`
- tested status buckets for:
  - local review ready
  - partially ready
  - needs approval
  - future build
- directional local-review and live-MVP percentages
- route evidence, owner lanes, risk labels, remaining work, and next review
  steps for each subproject

## Subprojects Tracked

- app foundation and mobile routes
- role-aware read experience
- Supabase schema, seed data, and RLS foundation
- Rush Month operating loop
- guarded local write paths
- reusable campaign shells
- production auth and onboarding
- bridge video and proof upload system
- admin operations for users, roles, chapters, and templates
- production deployment, Figma polish, and QA
- external integrations and automation

## Safety Rules

- Percentages are directional planning estimates, not launch promises.
- The live MVP remains incomplete.
- External systems remain disabled:
  - n8n
  - HubSpot
  - Luma
  - warehouse
  - Power BI
  - SMS
  - email
  - AI writes
- DS Admin can read automation posture but does not own student/chapter truth.
- Chapter and coach roles do not see the build-status map.

## Why This Matters

This gives Nick, Kiomi, Renato, and future reviewers a shared project map inside
the app. It should reduce the "black hole" feeling without pretending the MVP is
done or weakening the approval boundary around auth, data, uploads, and
integrations.
