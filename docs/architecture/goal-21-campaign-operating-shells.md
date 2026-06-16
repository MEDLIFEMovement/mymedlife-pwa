# Goal 21: Campaign Operating Shells

Goal 21 expands the mock-safe myMEDLIFE MVP from a Rush Month-only shell into
the first reusable campaign operating system surface.

This is still not a full campaign buildout. It adds read-only campaign,
action-committee, event, and proof-library shells so the team can review the
product model before adding live auth, browser writes, production Supabase, or
external integrations.

## What Goal 21 Adds

1. A reusable campaign catalog for Rush Month and the next major campaign
   families.
2. Campaign detail pages that explain the student promise, operating rhythm,
   proof use, KPIs, action lanes, and integration posture.
3. Action committee operating data for recruitment, fundraising, local
   volunteering, social, and proof/storytelling lanes.
4. Mock chapter event plans with owners, expected student action, feedback plan,
   proof prompt, NPS question, and Luma status.
5. A proof library surface that frames bridge videos and testimonials as
   belief-building assets.
6. Role-aware campaign visibility.
7. DS Admin restrictions that keep student, campaign, proof, and KPI truth out
   of systems-admin ownership.
8. Integration posture events that stay mocked or disabled.
9. Tests for the campaign service and role boundaries.
10. README/AGENTS updates so human developers understand the new shell.

## Campaign Families Represented

- Rush Month
- Fundraising Sprint
- Local Volunteering Push
- Med Talk Series
- Social Belonging Events
- SLT Recruitment Push

These are intentionally high-level shells. They are not final campaign SOPs.
They help the team see the shape of the operating app before building each
campaign deeply.

## Action Committee Model

Action committees organize real campus events and student actions. They should
not become passive meeting groups.

Each event plan should answer:

- who owns it
- which campaign it supports
- what students are expected to do
- what feedback/NPS will be collected
- what proof/testimonial prompt will be used
- whether Luma is linked, mocked, or disabled
- how coaches can read progress and risk

## Proof Model

Proof is not ordinary homework evidence.

For myMEDLIFE, proof means bridge videos, testimonials, event stories, UGC,
photos, or recaps that help students and chapters believe action is possible.
HQ decides whether proof should be shared broadly.

Chapter leaders can help collect proof. They do not own the final broad
proof-sharing decision.

## Integration Safety

Goal 21 does not activate any real integration.

Still disabled:

- HubSpot writes
- Luma writes
- n8n workflows
- warehouse exports
- Power BI exports
- SMS/email sends
- AI summaries

The app records mock-safe posture only. Integration events shown in this goal
are not safe to send externally.

## Files

- `src/shared/types/campaigns.ts`
- `src/data/mock-campaigns.ts`
- `src/services/campaign-ops-service.ts`
- `src/components/campaign-card.tsx`
- `src/app/campaigns/page.tsx`
- `src/app/campaigns/[campaignSlug]/page.tsx`
- `src/app/action-committees/page.tsx`
- `src/app/proof-library/page.tsx`
- `tests/campaign-ops-service.test.ts`

## Open Questions For Later Goals

- Which campaign should be implemented deeply after Rush Month?
- Which proof categories and consent fields are required before upload/storage?
- Which Luma event fields are required before a real API sync?
- Which feedback/NPS form will be canonical for event outcomes?
- Which proof items should become visible to students versus coach/HQ only?
