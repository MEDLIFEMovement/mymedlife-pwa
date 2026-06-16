# Goal 47: MVP Release Readiness

## Purpose

Goal 47 adds a plain-English release-readiness summary to `/admin`.

The key distinction:

- ready for local stakeholder review: yes
- ready for live student launch: no

## Why This Matters

The app now has many mock-safe Rush Month MVP surfaces. Reviewers need a clear
bottom line so "the local MVP is reviewable" does not accidentally become "the
production app is approved for launch."

## Blockers Before Live Launch

- live auth and real users
- browser writes
- proof uploads and public proof sharing
- real external integrations
- production environment setup and final visual/mobile QA

## Safety Boundary

The panel does not:

- approve launch
- enable production auth
- enable browser writes
- enable uploads
- publish proof
- trigger HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

It keeps browser writes and external sends at `0`.

## Implementation Notes

- `src/services/mvp-release-readiness.ts` owns the verdict, achievements,
  blockers, and next approvals.
- `src/components/mvp-release-readiness-panel.tsx` renders the admin panel.
- `/admin` mounts the panel above the detailed coverage and route manifests.
- `tests/mvp-release-readiness.test.ts` covers the conservative verdict,
  blockers, DS admin visibility, and chapter/coach restrictions.
