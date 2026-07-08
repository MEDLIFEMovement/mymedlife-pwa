# Member SLT Prep Placement Map

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Builder owner: `#1` General Member App

## Purpose

Clarify how SLT Prep should appear inside the General Student App while keeping
standalone SLT routes honest and blocked where they imply travel, payment,
forms, reminders, provider, or traveler writes.

## Source Evidence

- Member alias: `src/app/app/slt-prep/page.tsx`
- Standalone home: `src/app/slt-prep/page.tsx`
- Standalone routes:
  - `src/app/slt-prep/checklist/page.tsx`
  - `src/app/slt-prep/checklist/[itemId]/page.tsx`
  - `src/app/slt-prep/forms/page.tsx`
  - `src/app/slt-prep/payments/page.tsx`
  - `src/app/slt-prep/meetings/page.tsx`
  - `src/app/slt-prep/extensions/page.tsx`
  - `src/app/slt-prep/timeline/page.tsx`
  - `src/app/slt-prep/notifications/page.tsx`
  - `src/app/slt-prep/profile/page.tsx`
- SLT primitives/subnav: `src/components/slt-prep-primitives.tsx`,
  `src/components/slt-prep-subnav.tsx`
- Exported SLT route map:
  `/Users/codex/Desktop/myMEDLIFE SLT Prep Phase/src/app/routes.tsx`
- Prior planning: `docs/user-stories/member-slt-prep-source-map.md`
- Current queue context: `#523` is the active member SLT shell continuity branch.

## Placement Rule

`/app/slt-prep` is the General Member App entry/handoff. It should preserve the
student shell, account menu posture, preview banner posture, and member
navigation context.

`/slt-prep/*` is the deeper SLT workspace route family. It can use its own SLT
subnav/quick-nav, but it must still remain preview-safe unless real traveler,
payment, forms, provider, reminder, and approval evidence exists.

## Exported SLT Source Shape

The exported SLT package defines:

- home,
- checklist,
- item detail,
- forms,
- payments,
- meetings,
- extensions/tours,
- timeline,
- staff dashboard,
- notifications.

The repo maps that intent into Next routes, with additional profile route
coverage. That is meaningful `Scope/UI`, not proof of production readiness.

## What Belongs In `/app/slt-prep`

- Member-shell SLT overview/entry.
- Clear link/handoff into the deeper checklist/forms/payments/meetings route
  family.
- Visible `TEST` labels for fake traveler, trip, chapter, checklist, payment,
  form, meeting, timeline, and reminder content.
- Copy that says the workspace is preview/readback unless a real approved SLT
  data lane exists.
- Member bottom-nav continuity and return posture.

## What Belongs In Standalone `/slt-prep/*`

- Checklist status and item detail.
- Required forms readback.
- Payment status readback.
- Meetings and timeline readback.
- Extensions/tours preview.
- Notifications center preview.
- Traveler/profile readback.

These routes can be visibly rich, but risky verbs must stay blocked.

## What Must Stay Blocked / Preview-Only

- trip registration,
- traveler profile writes,
- document/form submission,
- Drive/Form writes,
- payments, checkout, payment plans, Shopify,
- scholarships,
- staff approval,
- reminders, emails, notifications,
- HubSpot, Luma, Zoom, Drive, Form, Shopify, or other provider sync,
- flight submission,
- production proof claims.

## Builder-Ready Slice

**Slice:** Complete #1's member-owned SLT shell continuity after `#523` rerun
settles.

**Likely files:**

- `src/app/app/slt-prep/page.tsx`
- `src/app/slt-prep/page.tsx`
- `src/app/slt-prep/*/page.tsx`
- `src/components/slt-prep-primitives.tsx`
- `src/components/slt-prep-subnav.tsx`
- `src/components/student-app-shell.tsx` only if member shell wrapper is the
  actual source of drift
- `tests/slt-prep-routes.test.tsx`
- `tests/slt-prep-write-safety-contract.test.ts`

**Do not touch:**

- `/leader`, `/staff`, `/admin`
- production auth/role helpers unless explicitly approved
- provider/API code
- owner CSVs, rollout packet, live counts, production signed-in proof, pilot
  proof

## Reviewer Acceptance Checks

- `/app/slt-prep` looks like a member-app destination, not a detached app.
- Deeper `/slt-prep/*` routes remain connected and route-backed.
- Payment/forms/profile/notifications copy stays blocked/read-only/preview-only.
- Visible fake SLT rows include `TEST`.
- No provider, payment, or travel readiness is claimed from shell visibility.

## Matrix Guidance

May support `Scope/UI` and possibly `QA/Ops` after implementation and focused
tests/smoke. Does not move `Data/Auth`, `Writes/Integrations`, or `Rollout
Gate`.
