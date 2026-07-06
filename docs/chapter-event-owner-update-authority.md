# Chapter Event Owner Update Authority Audit

This is a local, read-only audit of the current `app.chapter_events` update
boundary after PR #335.

It does **not** add production proof, change rollout evidence, or imply that a
member browser write path is production-ready.

## Current Policy Shape

The current RLS policy is:

- `chapter_events_insert_organizers`
  - only chapter leaders or admin can insert chapter-event rows
- `chapter_events_update_owner_leaders_staff`
  - an update is allowed when the signed-in actor is:
    - `owner_user_id`
    - `planned_by_user_id`
    - a chapter leader for that chapter
    - admin / DS-admin / super-admin through `app.is_admin()`

Because the update policy uses row-wide `using` and `with check` clauses,
current owner or planner access is not limited to a small field subset.

## What The Current Owner Or Planner Permission Enables

Under the present policy, an event owner or planner can update any mutable
`app.chapter_events` column as long as the resulting row still keeps them as the
owner or planner.

That includes:

- `chapter_id`
- `campaign_id`
- `phase_id`
- `action_committee_id`
- `assignment_id`
- `title`
- `event_type`
- `status`
- `owner_user_id`
- `planned_by_user_id`
- `starts_at`
- `ends_at`
- `promotion_summary`
- `attendance_count`
- `eligible_member_count`
- `attendance_rate`
- `nps_score`
- `feedback_summary`
- `warehouse_status`
- `luma_event_link_id`

There is no standalone location column on `app.chapter_events`. Member-facing
location labels are derived from chapter and Luma-linked read models, so this
table cannot directly forge a separate stored location field.

## Who Can Become Event Owner Or Planner

The table only requires `owner_user_id` and `planned_by_user_id` to reference a
valid `app.profiles` row.

That means:

- a chapter leader or admin can create an event and assign a normal member as
  owner or planner
- once assigned, that owner or planner can update the row directly under the
  current RLS policy

This is visible in local seed and read-model fixtures, where leaders create
events but ownership can point at non-leader chapter members.

## What The Current App Or Service Layer Exposes

In the audited launch lane, I did **not** find a real browser write path that
lets a member update `app.chapter_events` today.

Relevant non-UI service findings:

- `src/services/rush-month-event-detail.ts`
  - explicitly reports `browserWritesExpected: 0`
  - says no event create/update, attendance import, or provider write runs from
    that route
- `src/services/launch-lane-event-access.ts`
  - checks whether an actor belongs to the allowed chapter lane
  - does not perform a chapter-event update
- `src/services/staging-luma-event-loop.ts`
  - is local/staging-only mock state
  - keeps `externalWritesEnabled: false`

So the risk is not a currently exposed member button. The risk is that the
underlying table policy is broader than the eventual production event-loop write
lane should rely on.

## Audit Conclusion

Current honest status:

- local RLS proof exists
- no production member chapter-event update proof exists
- no current app route in this slice exposes a real member chapter-event update
  write
- the underlying policy is still too broad to count as production-ready update
  authority for authoritative event fields

## Narrow Hardening Recommendation

Do **not** rush a blind policy change in this PR. The safer next step is:

1. Keep this caveat explicit in readiness reporting.
2. Before any real event-update browser write ships, replace owner/planner
   direct table updates with an audited RPC or trigger-backed write path.
3. Split chapter-event fields into two buckets:
   - authoritative operating fields, leader/staff-only:
     - `chapter_id`
     - `campaign_id`
     - `phase_id`
     - `action_committee_id`
     - `assignment_id`
     - `status`
     - `starts_at`
     - `ends_at`
     - `attendance_count`
     - `eligible_member_count`
     - `attendance_rate`
     - `nps_score`
     - `warehouse_status`
     - `luma_event_link_id`
     - `owner_user_id`
     - `planned_by_user_id`
   - non-authoritative narrative fields, candidate for future owner workflow only
     through an audited helper:
     - `promotion_summary`
     - `feedback_summary`
     - possibly `title`, if product decides event naming can be delegated
4. Do not treat current owner/planner row-wide update access as a reason to move
   production proof, rollout gate, or writes/integrations readiness.

## What Must Not Move Because Of This Audit

This audit is still local policy proof only.

It must **not** move:

- production signed-in proof
- rollout gate
- events writes/integrations readiness
- points materialization readiness
- any production evidence status

At most, this kind of audit can improve local auth/data honesty and future
hardening clarity.
