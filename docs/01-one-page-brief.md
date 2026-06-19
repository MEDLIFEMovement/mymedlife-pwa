# 01 · One-Page Brief: myMEDLIFE PWA

| Project Name | myMEDLIFE PWA |
| --- | --- |
| Date | 2026-06-17 |
| Author / Builder | MEDLIFE Product + myMEDLIFE Engineering Team |
| Target Ship Date | 2026-07-31 *(mock-first to local-readiness milestone)* |

## 1 · Problem & Solution

### Problem Statement
The team is building a custom, mobile-first chapter operating experience for MEDLIFE, but the current production reference layer (Discourse) is not a purpose-built operating system for member workflows, chapter leadership, evidence review, and launch safety posture. As a result, proof submission, assignment status, membership/process governance, and release-readiness checks are spread across tools and are hard to audit.

### Proposed Solution
Build and stabilize myMEDLIFE PWA as the dedicated app source of truth for chapter operations, with role-aware read-only review flows now and a planned, gated path to safe local writes. Keep Supabase as the app data model and source of truth, keep Discourse as reference only, and keep external integrations modelled through disabled outbox events until approvals are complete.

## 2 · Users & Use Cases

- **Primary users**
  - Chapter Members
  - Action Committee members/chairs
  - Chapter Leaders / President & VP / Admin
  - Coaches
  - DS Admin / Super Admin

- **Key use cases**
  - As a chapter member, I want to open the app and see my active campaign, assigned actions, and what to do next so I can stay aligned with chapter expectations.
  - As a chapter member, I want to submit assignment proof/testimonial content through a guided flow so that my progress can be reviewed consistently.
  - As a chapter leader, I want to inspect members, assignments, and proof state so I can coach follow-up actions quickly.
  - As a coach, I want to review chapter action posture and evidence signals so I can intervene early.
  - As an admin, I want read-only launch-check routes (control center, outbox, audit log, release readiness) so I can authorize pilot readiness safely.

## 3 · Success Metrics & Acceptance Criteria

- **Works when**
  - Role-aware app routes load on mobile for fake local actor profiles and return stable, expected read-only content.
  - Core flows around members/actions/proof/review are viewable with consistent empty states and clear blocked-write posture.
  - Release posture remains explicit and safe: production auth, real writes, uploads, external sends, and CRM/Luma actions remain disabled unless explicitly enabled in later gates.
  - Route inventory and smoke coverage include the launch-critical screens from the operating plan.
  - CI checks relevant to docs/code changes continue to pass for touched areas.

## 4 · Out of Scope

- Production authentication for real student users.
- Real external writes/sends (HubSpot, Luma, warehouse/power BI, AI, SMS/email automations).
- Public proof publishing and real student enrollment/welcome delivery.
- Full n8n workflow automation or third-party orchestration ownership of app truth.

