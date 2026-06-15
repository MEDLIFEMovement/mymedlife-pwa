# Goal 6 Supabase Foundation Review And Goal 7 Plan

Planning status: Goal 6 review document. This is not a production migration
approval and it does not connect the app UI to live Supabase auth or real
integrations.

Recommended model for this review: GPT-5.5 Thinking or the strongest available
reasoning model.

Reason: the review affects schema direction, role boundaries, RLS scope,
integration safety, and the order in which the team should move from mock data
to real persistence.

## Sources Reviewed

- Goal 4 Supabase architecture plan.
- Goal 5 local migration, seed data, and pgTAP RLS tests.
- README, AGENTS, and local Supabase setup docs.
- Sales SOP knowledge base:
  - canonical operating model
  - coach campaign playbook
  - chapter campaign playbook
  - product platform KB
  - roles and permissions KB
  - KPI, readiness, evidence, and escalation KB
  - agent response patterns
  - source map, campaign registry, and alias route map

Data Solutions knowledge bases were not yet available in this repo. They should
be reviewed before finalizing HubSpot, Luma, warehouse, Power BI, n8n, reporting,
or AI contracts.

## Plain-English Conclusion

Goal 5 is a good local database foundation. It already protects chapters from
seeing each other's work, separates student roles from staff roles, supports
coach chapter portfolios, keeps MEDLIFE HQ in control of proof sharing
decisions, and keeps integration/outbox records disabled from real external
sends.

The next safe step should not be live auth yet. The next step should refine the
local schema so it better matches how MEDLIFE chapters actually operate:
campaign templates, action committee lanes, readiness gates, risks, closeouts,
and campaign officer ownership.

Recommended next path:

1. Goal 7: local schema refinement migration and RLS tests only.
2. Goal 8: first read-only Supabase connection from the app to local data.
3. Goal 9: live auth bootstrap only after the schema and RLS tests are stable.

## What Goal 5 Already Handles Well

- Local-only Supabase project structure.
- Profiles mapped to Supabase Auth users.
- Chapter-scoped memberships.
- Staff roles for Coach, Admin, DS Admin, and Super Admin.
- Time-bounded coach chapter assignments for expansion and portfolio coaches.
- Rush Month campaigns, phases, action templates, assignments, and Action
  Committees.
- Chapter events with Luma link metadata, attendance, participation rate, NPS,
  feedback summary, and warehouse status.
- Evidence/proof records that support testimonial-style proof metadata.
- HQ sharing decisions through approvals.
- Points events and KPI events as ledger-style records.
- Internal events, integration events, automation outbox rows, and audit logs.
- RLS tests for chapter isolation, member self-access, leader access, coach
  portfolio access, admin and DS admin boundaries, HQ proof sharing, and
  disabled external-send boundaries.

## Key SOP Alignment Notes

### Campaigns Should Be Template-Driven

The Sales SOP KB treats campaigns as repeatable operating systems, not one-off
rows. Campaigns need immutable HQ-owned templates plus chapter-specific campaign
instances.

Current state:

- `campaigns` are chapter-scoped instances.
- `action_templates` are also chapter-scoped.
- There is no first-class global campaign template table yet.

Recommended refinement:

- Add global `campaign_templates`.
- Add global `campaign_phase_templates`.
- Keep chapter-specific `campaigns`, `phases`, and `assignments` as instances.
- Seed templates from `machine_readable/campaign_registry.json` later.
- Let HQ/Admin own templates; chapters should work from approved instances.

### Campaign Officer Lanes Need First-Class Support

The current broad student roles are useful, but the SOPs name operating lanes
such as Recruitment Director, SLT Officer, Fundraising Officer, Engagement
Director, Secretary, Treasurer, Social Media, Vice President, Follow-Up Chair,
Past Traveler, and Ambassador.

Current state:

- Student role keys are broad: General Member, Action Committee Member, Action
  Committee Chair, E-Board Member, President/VP.
- `action_committees` and assignments can approximate lanes, but not enough for
  production permissions or reporting.

Recommended refinement:

- Add `campaign_role_assignments` for campaign-specific owners and support
  roles.
- Keep role keys stable, but allow human-readable labels and lanes.
- Use the table to answer: who owns Rush follow-up, SLT info sessions,
  fundraising Power Hour, engagement, and leadership transition?

### Readiness Gates Should Be Explicit

The SOPs repeatedly ask whether a campaign or phase is ready, what outputs are
required, whether a coach validated readiness, and what happens if readiness is
missing.

Current state:

- `phases` have status and dates.
- Readiness criteria, required outputs, and coach validation are not
  first-class.

Recommended refinement:

- Add phase template fields for entry criteria, exit criteria, required outputs,
  and whether coach validation is required.
- Add `phase_readiness_reviews` for chapter-specific validation decisions.
- Use statuses like `not_ready`, `ready`, `validated`, `blocked`, and
  `waived`.

### Risks And Coach Interventions Need Their Own Records

Coach SOPs use green/yellow/red health, escalations, and specific risk signals.
These should not live only as generic JSON events.

Current state:

- Coaches can log internal events.
- There is no first-class risk or intervention table.

Recommended refinement:

- Add `risk_flags` or `coach_interventions`.
- Include severity, campaign, phase, related assignment/event, signal, owner,
  response plan, status, due date, and coach notes.
- Keep coach-only notes private from general members.

### Closeouts Are A Product Object, Not Just A Note

Campaign closeouts are how MEDLIFE learns what worked, what failed, who
contributed, what proof exists, and what should be handed off.

Current state:

- Campaigns can be completed.
- There is no campaign closeout table.

Recommended refinement:

- Add `campaign_closeouts`.
- Include goals versus actuals, KPI summary, proof summary, top contributors,
  lessons learned, unresolved risks, recommendations, and next campaign
  handoff.

### Evidence And Proof Need Two Related Meanings

The app should support both:

- operational evidence that something happened, such as attendance logs,
  screenshots, event photos, trackers, or recap notes
- belief-building proof/testimonials, such as bridge videos, student quotes, and
  stories HQ may share across chapters

Current state:

- `evidence_items` already supports proof/testimonial metadata.
- The enum is still narrow: `text`, `link`, `mock_file`.

Recommended refinement:

- Expand evidence types before production storage.
- Keep HQ sharing decisions separate from chapter execution status.
- Preserve proof metadata such as target audience, hesitation addressed,
  messenger type, category, format, consent, and source event.

### Leads, Travelers, Donors, And Follow-Up Need A Data Solutions Review

Rush Month, SLT, Moving Mountains, and engagement workflows depend on lead
capture, follow-up, traveler conversion, donor/fundraising activity, HubSpot,
Luma, and warehouse/reporting logic.

Current state:

- Goal 5 intentionally does not model those pipelines deeply.
- Integration rows and outbox rows are mock-safe and disabled.

Recommended refinement:

- Do not add production lead/traveler/donor sync tables until Data Solutions
  reviews canonical objects, IDs, sync direction, and privacy rules.
- If local placeholders are needed, keep them clearly draft-only and
  integration-disabled.

## RLS Gaps To Test Before Live Auth

Add tests for these before any real student UI uses Supabase data:

- Campaign officer lane access by campaign and chapter.
- Coach-only notes and risk records hidden from general members.
- Interested student / onboarding visibility.
- Leadership transition candidate and evaluation privacy.
- Lead, traveler, donor, and fundraising privacy once those tables exist.
- HQ-only campaign template management.
- Readiness review creation, validation, waiver, and blocking rules.
- Closeout draft, submit, validate, and publish boundaries.
- Proof editing lock after HQ review.
- Aggregated member-facing impact metrics versus leadership-only SOP/KPI data.

## Data Solutions KB Dependencies

Before real integrations, reporting, or warehouse exports, request Data
Solutions guidance for:

- canonical HubSpot objects, properties, lifecycle stages, and ownership rules
- canonical Luma event identifiers, import cadence, and attendance fields
- Data Hub or warehouse table grains for chapters, campaigns, events, leads,
  travelers, donors, points, KPIs, proof, and closeouts
- sync direction for each object: app-to-HubSpot, HubSpot-to-app, Luma-to-app,
  app-to-warehouse, or read-only reference
- idempotency keys and retry rules for n8n/AutomationOutbox
- which fields are safe for student-facing display
- which fields require Admin, DS Admin, Super Admin, or service-role access
- Power BI dataset expectations and refresh cadence
- consent and privacy rules for testimonials, bridge videos, student contact
  data, traveler data, and fundraising data
- AI summary sources, allowed audiences, and review requirements

## Recommended Goal 7

Use GPT-5.5 Thinking or the strongest available reasoning model for Goal 7.

Suggested title:

`CODEX GOAL 7 - LOCAL CAMPAIGN OPERATING MODEL REFINEMENT`

Goal:

Refine the local Supabase schema and RLS tests so myMEDLIFE better matches the
MEDLIFE campaign operating model before live auth or real persistence is wired
into the app.

Recommended scope:

1. Start from Goal 6 review on main.
2. Create a Goal 7 branch.
3. Add local migration tables for:
   - campaign templates
   - phase templates
   - campaign role assignments
   - phase readiness reviews
   - risk flags or coach interventions
   - campaign closeouts
4. Add or update seed data using obviously fake Rush Month examples.
5. Add RLS policies for the new tables.
6. Add pgTAP tests for campaign officer access, coach-only risk privacy,
   readiness review boundaries, closeout boundaries, and HQ-only template
   management.
7. Update TypeScript persistence types only where needed.
8. Update docs.

Goal 7 non-goals:

- No production Supabase connection.
- No live student auth.
- No real HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes.
- No all-campaign UI buildout.
- No custom data-access framework.

Definition of done:

Goal 7 is complete when local migrations, fake seed data, RLS policies, and
tests prove the refined campaign operating model works locally and remains safe
for later app wiring.

## Open Questions For Nick And Team

- Should campaign officer roles be standardized globally, or should each
  chapter be allowed to customize labels while preserving stable system keys?
- Should coaches be able to validate readiness directly, or should they only
  recommend a validation state that Admin/HQ can finalize?
- Which proof/testimonial fields must be required before HQ can approve sharing?
- Which student-facing impact metrics are safe to show broadly versus limited
  to leaders/coaches?
- Which Data Solutions KB should define the first integration contract:
  HubSpot, Luma, warehouse/Data Hub, Power BI, or n8n?

## Assumptions

- Goal 5 was intentionally local-only and should remain so.
- MEDLIFE/Supabase remains the source of truth for app permissions, chapter
  memberships, assignments, points, KPIs, campaign status, proof metadata, and
  HQ sharing decisions.
- n8n should later orchestrate approved external workflows, not own app truth.
- Sales SOP KBs describe operating intent, but Data Solutions KBs are needed
  before final integration and analytics contracts.
- Discourse remains a prototype/reference path and is not modified by this repo.
