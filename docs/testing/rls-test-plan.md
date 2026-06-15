# Future RLS Test Plan

Planning status: Goal 4 test plan only. No live Supabase project is wired in
this goal.

## Purpose

Before myMEDLIFE uses live Supabase data, the team should prove that row-level
security protects chapter data, role boundaries, coach assignment access,
testimonial/proof submissions, admin actions, event logs, and outbox records.

## Recommended Test Setup

Use a local Supabase database in Goal 5 or later.

Seed these users:

- General Member in Chapter A
- Action Committee Member in Chapter A
- Action Committee Chair in Chapter A
- E-Board Member in Chapter A
- President / VP in Chapter A
- Coach assigned to Chapter A
- Expansion Coach assigned to Chapter A
- General Member in Chapter B
- Coach assigned to Chapter B
- Admin
- DS Admin
- Super Admin
- Unrelated authenticated user

Seed these records:

- two chapters
- approved and requested memberships
- one active Rush Month campaign per chapter
- phases, action templates, assignments, testimonial/proof submissions, HQ
  sharing decisions, coach assignments, points events, KPI events, NPS records,
  internal events, Luma links, integration events, outbox rows, and audit logs

## Test Groups

### Chapter Isolation

- A Chapter A member cannot read Chapter B assignments, private
  testimonial/proof, HQ sharing decisions, points events, KPI events, or raw
  outbox rows.
- A Chapter B member cannot infer private Chapter A testimonial/proof through
  joined tables.
- An unrelated authenticated user can only read their own profile and allowed
  public/static data.

### Membership And Role Approval

- A user can create a chapter join request for self.
- A requested member cannot read member-only chapter data until approved.
- President/VP can approve chapter-scoped membership roles for their chapter.
- President/VP cannot approve roles for another chapter.
- General Members cannot approve roles.

### Assignment Access

- General Members can read assignments assigned directly to them or to
  `general_member` in their approved chapter.
- Action Committee Members can read committee assignments for their role.
- Chapter leaders can create and update chapter assignments.
- Assigned users can update only allowed status fields, not points, ownership,
  or review state.

### Testimonial And Proof Access

- Assigned users can create testimonial/proof submissions for visible
  assignments or chapter activities.
- Submitters can read their own testimonial/proof submissions.
- Chapter leaders can see chapter activity proof status where appropriate, but
  not HQ-only sharing controls by default.
- Action Committee Chairs and E-Board members cannot approve proof.
- Authorized MEDLIFE HQ staff can mark a testimonial/proof item as approved for
  sharing or not shared.
- Reviewed testimonial/proof cannot be silently edited by the submitter.
- NPS scores are visible only at the appropriate aggregation level for each
  role.

### Points And KPI Ledgers

- Points and KPI events are append-only for normal app roles.
- Completed action and HQ sharing flows can create points and KPI rows where
  product rules allow.
- Members can read their own points and approved recognition.
- Chapter leaders and coaches can read chapter/portfolio summaries.
- Corrections should create new ledger events instead of mutating old rows.

### Coach Portfolio Access

- A coach can read chapters where they have active `coach_chapter_assignments`.
- A coach cannot read chapters outside their portfolio.
- A coach handoff from expansion coach to portfolio coach changes access on the
  correct start/end dates.
- A coach can create coach decision logs for portfolio chapters.
- A coach cannot approve student membership truth unless a later scope grants it.

### Admin, DS Admin, And Super Admin

- Admin can read and support allowed operational data.
- DS Admin can manage integration connection settings and outbox controls.
- Chapter leaders cannot manage HubSpot, Luma, n8n, warehouse, Power BI, or API
  connection settings.
- Super Admin can manage platform-level role/configuration records.
- Admin, DS Admin, and Super Admin writes create audit logs.
- Service-role-only actions cannot be performed from browser sessions.

### Events And Outbox

- Meaningful app actions create structured internal events.
- Integration events and outbox rows are recorded or mocked by default.
- Normal chapter users cannot set outbox rows to `approved_for_live_send` or
  `sent`.
- Only DS Admin, Super Admin, or approved service-side workers can manage real
  external-send status.
- Raw payload access is limited to Admin, DS Admin, Super Admin, or service-side
  workers.
- Idempotency keys prevent duplicate outbox work.

## Suggested Tooling

Use the smallest standard setup consistent with the repo when Goal 5 begins:

- local Supabase CLI database
- SQL seed file for role scenarios
- SQL assertions or pgTAP-style tests
- app-level tests for permission helper functions if helper functions are
  mirrored in TypeScript

## Pass Criteria

The RLS test suite should pass only when:

- chapter access is isolated
- coach assignments and coach handoffs are isolated
- role approvals are limited to authorized roles
- testimonial/proof and HQ sharing rules match the product plan
- ledger rows are append-only for normal users
- outbox rows cannot trigger real external sends without explicit approval
- admin, DS admin, and super-admin changes are audit logged
