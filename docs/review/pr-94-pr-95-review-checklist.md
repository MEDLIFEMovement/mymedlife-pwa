# PR #94 And PR #95 Review Checklist

Date: 2026-06-19

Purpose: keep the current myMEDLIFE review packets easy for Nick, Kiomi, DS,
and Renato to review and approve without expanding scope.

## Review Order

1. Review PR #94 first.
2. Walk the focused Phase 1 review routes in the app.
3. Review PR #95 as a prep packet only.
4. Confirm the stack, environment, and auth decision path.
5. Hold the live boundary until review comments are resolved.

## PR #94 Reviewer Checklist

Use PR #94 to answer one question: is the local Phase 1 MVP understandable,
coherent, and safe to approve as a mock-first review build?

Review:

- PR #94 summary, scope, and validation notes.
- `/admin/review-path` for the no-code walkthrough.
- `/admin/nick-review` for the final local MVP packet.
- `/admin/launch-gate` for what is still blocked before pilot/live work.
- `/admin/database-security` for the stack and security posture review.

Approve PR #94 when reviewers agree that:

- the four MVP surfaces are present and reviewable
- role context is understandable
- the launch boundary is honest
- no live auth, browser writes, uploads, or external sends were silently enabled

## PR #95 Reviewer Checklist

Use PR #95 to answer one question: does the team agree with the Phase 2 prep
boundary and the order of future implementation lanes?

Review:

- PR #95 summary, scope, and validation notes.
- `/admin/phase-2` for the issue map, review order, and approval gates.
- `docs/architecture/phase-2-safe-prep-packet.md` for the detailed prep packet.

Approve PR #95 when reviewers agree that:

- MED-471 through MED-486 are the right prep/foundation/write/runbook slices
- the stack path remains Next.js, Supabase, and Vercel unless explicitly reopened
- environment, auth, and secret ownership questions are clearly assigned
- Phase 2 is still mock-only and does not imply live implementation approval

## Explicit Non-Goals During Review

Do not start any of the following while PR #94 and PR #95 are still the active
review packets:

- Phase 3 prep
- new feature slices
- live auth
- live writes
- Supabase or Vercel environment setup
- migrations
- proof uploads
- production deploys
- HubSpot, Luma, Shopify, n8n, warehouse, or Power BI writes

## Decision Output Needed From Reviewers

Nick:

- confirm whether PR #94 is approved as the Phase 1 MVP review packet
- confirm which implementation lane should start after Kiomi/DS approval lands

Kiomi / DS:

- confirm the stack and environment path
- confirm secret ownership and callback-domain expectations
- confirm whether real auth/foundation work can begin after review feedback is resolved

Renato:

- confirm the packets are understandable for stakeholder review
- call out anything that would make the approval path or rollout story confusing
