# Goal 45: MVP Coverage Checklist

## Purpose

Goal 45 adds an admin-facing MVP coverage checklist to `/admin`.

The checklist is meant for non-coders and reviewers. It explains:

- what the Rush Month MVP can demonstrate locally
- what is read-only
- what remains mock-only
- what is blocked until Nick/team approve live auth, browser writes, uploads,
  public proof sharing, or integrations

## Included Areas

- role-aware local actors
- Rush Month operating loop
- assignments and leader follow-up
- proof/testimonial sharing posture
- member recognition and leaderboard
- coach readiness and portfolio
- admin control center
- integration events and disabled outbox
- live auth and browser writes
- real external integrations

## Safety Boundary

This checklist is a review aid only. It does not:

- approve launch
- enable browser writes
- enable production auth
- enable uploads
- enable public proof sharing
- enable HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

## Implementation Notes

- `src/services/mvp-coverage-checklist.ts` owns the checklist rows, role
  visibility, counts, and blocked statuses.
- `src/components/mvp-coverage-checklist-panel.tsx` renders the admin panel.
- `/admin` mounts the checklist before the deeper admin control-center panels.
- `tests/mvp-coverage-checklist.test.ts` covers admin, DS admin, super admin,
  chapter-role restrictions, and blocked live-write/integration items.
