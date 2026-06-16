# Goal 70: Design QA Readiness

## Purpose

Goal 70 adds an explicit Figma and mobile QA readiness layer to the admin
review path. The MVP already has a strong local app, role model, database
foundation, and guarded write posture. The next launch risk is making sure the
running app feels like a simple, warm, mobile-first student product rather than
an internal technical dashboard.

## What It Adds

- `getDesignQaReadiness(actor)`
- `DesignQaReadinessPanel`
- `/admin` design QA section for admin, DS admin, and super admin review
- stakeholder review step for Figma/mobile QA
- MVP coverage and progress-map entries for design QA readiness
- tests covering Figma target visibility, phone viewport, zero writes/sends,
  operating-role restrictions, and launch blockers

## Figma Context

The target remains:

`https://www.figma.com/make/YeIALD6FoYqw2G1YDdbMgl/myMEDLIFE-App-Prototype?p=f`

The Figma connector currently returns Figma Make source-resource links rather
than a compact screen-by-screen pixel spec. This goal therefore does not claim
pixel-perfect matching. It adds a review surface that makes the remaining
side-by-side Figma comparison explicit.

## Review Standards

Reviewers should confirm:

- the first mobile screen answers "what should I do next?"
- student routes stay simpler than leader, coach, and admin routes
- navigation works on a phone-sized viewport without zooming
- tone is warm, mission-driven, and plain English
- proof, event, and automation safety boundaries are visible
- keyboard, focus, contrast, and screen-reader basics are checked before launch
- final production visual QA stays blocked until staging/mobile review passes

## Safety Rules

- No production auth is enabled.
- No browser writes are enabled.
- No proof upload or public sharing is enabled.
- No Luma, HubSpot, n8n, warehouse, Power BI, SMS, email, or AI writes are
  enabled.
- Design QA is a review gate, not a launch approval.

## Why This Matters

The final MVP must be technically safe and understandable to non-coders, but it
also has to feel good enough for students to use on their phones. This goal
turns that standard into something the admin review flow can inspect and test.
