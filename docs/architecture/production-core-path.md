# myMEDLIFE Production Core Path

This is the simplest way to understand the app when we are working toward production.

## Start here

If you only read a few files, start with these:

- `src/services/event-loop.ts`
- `src/services/read-only-app-data.ts`
- `src/app/login/page.tsx`
- `src/app/app`
- `src/app/leader`
- `src/app/staff`
- `src/app/admin`

The goal is one shared platform with separate role workspaces, not one giant shell with hidden menu items.

## The product backbone

The most important live workflow is:

1. leader prepares or links an event
2. member sees the event and RSVPs
3. attendance is confirmed or imported
4. points are awarded
5. leaderboard updates
6. staff and admin can audit what happened

That path should stay easier to understand than any supporting review packet.

## What is in scope right now

For the current launch lane, keep the visible product centered on:

- member mobile app
- student leader command center
- coach/staff command center
- DS/admin backend
- Luma event creation and update
- member RSVP
- attendance import
- points
- chapter leaderboard
- organization leaderboard

Other lanes can remain in the repo, but they should stay parked, hidden from the main story, or clearly marked as later work until the event loop is stable.

## What stays off right now

To keep the product understandable, these lanes should not compete with the launch story right now:

- broader proof and story workflows
- feed and content tooling
- HubSpot writeback
- warehouse / BI exports
- n8n automation
- non-core campaign modules in the visible shells
- anything that makes the member, leader, or staff workspace feel like a generic admin product

The visible product should keep saying the same thing:

`create the event -> RSVP -> attend -> award points -> watch the leaderboard move`

## What the product should feel like right now

If someone opens the app during this launch lane, they should immediately understand the value:

- members open a mobile-first app that helps them find events, RSVP, attend, and earn points
- student leaders open a chapter command center that helps them create events, watch RSVPs, confirm attendance, and move the chapter leaderboard
- staff and sales coaches open a chapter health workspace that helps them see event activity, attendance, and chapter standings across the rollout
- DS/admin stays available as the protected backend for rollout controls, audit, and safety, but it should not become the main product story

The app should not feel like a big platform with many half-on modules.
It should feel like one clear chapter operating loop with three visible role surfaces and one protected backend lane.

## Visible route contract

These are the routes the visible product should keep reinforcing during this launch lane:

- `/login`
- `/app`
- `/leader?view=overview`
- `/leader?view=events`
- `/leader?view=attendance`
- `/leader?view=leaderboard`
- `/staff?view=chapters`
- `/staff?view=events`
- `/staff?view=leaderboard`
- `/admin`

Older paths can stay in the repo if needed for review packets or parked flows, but the visible member, leader, and staff experience should keep routing back to the list above.

Practical rule:

- use `attendance`, not `members`, for the visible leader check-in lane
- use `events`, not `campaigns`, for the visible staff event lane
- keep proof, roster, and broader workflow routes parked or redirected unless they are the approved live lane

## What gets parked while we simplify

During this production path, the visible member, leader, and staff workspaces should park or hide:

- broader campaign exploration that does not help the event loop
- proof-library browsing as a primary flow
- feed/content tooling as a primary flow
- non-core committee tooling
- SOP-builder and backend configuration tools outside DS/admin
- any extra tabs that make the role shells feel like generic dashboards instead of focused workspaces

Practical product rule:

- if a screen does not help a role create an event, RSVP, confirm attendance, award points, or understand leaderboard movement, it should not sit in the primary navigation right now

## The minimum data model to keep in our heads

To scale this to 300 chapters without making the code unreadable, the live loop should stay conceptually small:

1. `chapters`
2. `chapter_luma_calendars`
3. `chapter_events`
4. `events` for activity history like RSVP and attendance
5. `points_events`
6. `audit_logs`
7. `integration_events`
8. `automation_outbox`

That is enough to answer the questions that matter:

- which chapter owns this calendar
- which event is live
- who RSVP'd
- who attended
- who got points
- what moved on the leaderboard
- what the app told Luma
- what stayed blocked on purpose

If a change makes this harder to explain, it is probably the wrong production move.

## Production path in plain terms

### Step 0: simplify staging before we widen

Before we talk about more live chapters, staging should look like the product we are trying to launch:

1. `/login` is one clean sign-in page
2. `/app` is the mobile-first member workspace
3. `/leader` is the leader event-and-points workspace
4. `/staff` is the chapter rollout and leaderboard workspace
5. non-core modules are hidden, parked, or redirected out of the main flow
6. the app language stays centered on events, RSVP, attendance, points, and leaderboard movement

This is the first simplification gate. If staging still looks sprawling, the right move is more cleanup, not more features.

### Step 1: one chapter

Prove the full event loop for one real chapter:

1. leader creates or updates the event in Luma
2. member RSVPs from myMEDLIFE
3. attendance is imported back into myMEDLIFE
4. points are awarded once per attendee
5. chapter and org leaderboard readbacks update
6. audit and outbox surfaces still show safe posture

Definition of success:

- one named chapter has one explicit Luma calendar mapping
- one leader can run the loop without backend help
- one member can RSVP and later see attendance-backed points
- one staff reviewer can explain where the points came from

### Step 2: first five chapters

Repeat the exact same loop for five chapters with clear chapter-to-Luma mapping.

The goal here is not new features. The goal is repeatability:

- each chapter has a known calendar
- staff can see event health across chapters
- leaderboard totals still make sense
- support can explain the workflow without engineering translation
- every chapter leader can understand where points came from without opening backend tooling

Definition of success:

- five chapters each have explicit calendar assignments
- the same event loop works without chapter-specific code branches
- staff can compare chapter health from one simple chapters view
- chapter and org leaderboard numbers stay believable after multiple attendance imports

### Step 3: first twenty-five chapters

Widen only after the five-chapter lane is boring.

At this stage the priority is operational quality:

- explicit chapter calendar ownership
- clearer chapter onboarding
- chapter-level rollout checklist
- stable attendance-to-points behavior
- simple support playbook for leaders and staff

### Step 4: three hundred chapters

Treat 300 chapters as an operations problem, not just a code problem.

That means:

- every chapter needs an explicit Luma calendar assignment
- onboarding has to be repeatable
- leaderboard logic has to stay understandable
- audit and rollback posture has to stay simple
- staff must be able to see who is healthy, who is blocked, and why

If those conditions are not true, we are not ready for a broad network rollout even if the UI looks finished.

## Simple build order from here

This is the recommended implementation order to reach production without growing the product sideways:

### Slice 1: visible simplification

- keep only the member, leader, staff, and admin shells in the main story
- park non-core navigation and non-core tabs
- make the member, leader, and staff home views obviously event-and-points first

### Slice 2: chapter calendar mapping

- make chapter-to-Luma mapping explicit and easy to review
- move from a few seeded chapters toward real chapter mapping discipline
- keep the rollout stages visible: 1, 5, 25, 300

### Slice 3: leader live event controls

- leader creates or updates the chapter event from the leader workspace
- leader can see event status, RSVP count, attendance count, and points awarded from the same surface

### Slice 4: member RSVP path

- member home and event detail both lead clearly to RSVP
- RSVP state is obvious after submission
- member sees how attendance affects point eligibility

### Slice 5: attendance and points proof

- import attendance from Luma
- create one points record per confirmed attendee
- keep duplicates blocked
- show the updated counts in member, leader, staff, and admin readback

### Slice 6: leaderboards that people trust

- chapter leaderboard is obvious to members and leaders
- organization leaderboard is obvious to staff
- leaderboard copy explains what the points mean and where they came from

### Slice 7: first five chapters go-live kit

- explicit mappings for five chapters
- staff playbook
- rollback playbook
- simple support script
- named owner for pilot pause if the loop misbehaves

## Simple PR rules

To keep the repo understandable, each PR in this lane should do only one kind of work:

1. visible shell simplification
2. calendar mapping
3. leader event write path
4. member RSVP path
5. attendance import plus points
6. leaderboard readback
7. rollout docs and support playbook

Avoid PRs that mix:

- UI redesign plus database changes
- multiple write paths at once
- production setup plus product behavior
- core event loop work plus unrelated modules

## Production blockers that still matter

We are not production-ready until all of these are true:

1. staging visibly matches the narrowed product story
2. one real chapter completes the end-to-end Luma -> RSVP -> attendance -> points -> leaderboard loop
3. five chapters have explicit Luma calendar mapping
4. points are explainable at chapter and org level
5. rollback is written, tested, and owned
6. support can explain the app without engineering translation
7. the code paths for the live loop are easy enough that a new engineer can follow them quickly

## One-sentence test

If a chapter leader asks, "What is myMEDLIFE for?", the answer should be:

`It helps your chapter create events, get people to RSVP, confirm attendance, award points, and move your leaderboard.`

## The first-five-chapter go-live gate

We should not broaden beyond the pilot until all of these are boring:

1. every pilot chapter has one explicit Luma calendar mapping
2. leader event create/update works from the leader workspace
3. member RSVP writes back cleanly
4. attendance import produces one clean points result per attendee
5. chapter leaderboard and org leaderboard agree with the imported attendance
6. audit and outbox views stay understandable to staff and DS
7. rollback steps are written down and owned by a human

If one of those is shaky, the right move is not more features. The right move is making the loop simpler.

## Canonical service ownership

### `src/services/event-loop.ts`
Public entrypoint for the event production path.

Use this file when a route or page needs the core loop:

- event RSVP posture
- Luma pilot read model
- cross-role event proof
- points and KPI ledger

Older narrow services still exist underneath it, but new code should prefer this entrypoint first.

### `src/services/read-only-app-data.ts`
Builds the chapter-scoped read model used by the app.

Its job is to:

- read from Supabase in read-only mode
- choose the active chapter and campaign
- collect the rows that belong to that chapter/campaign
- build the event/points ledger once
- hand pages one understandable object

This file should stay readable. If logic starts to feel like plumbing instead of product behavior, simplify it before adding more.

### `src/services/chapter-luma-rollout-workspace.ts`
Explains the scaling posture for chapter-to-Luma mapping.

Use this file when staff or admin surfaces need to answer:

- which chapter is the current pilot default
- which chapters are ready now
- which chapters should be mapped next for the first five
- how far we are from explicit mapping at 25 and 300 chapters

This keeps the rollout story in one plain-English place instead of repeating the same logic across staff and admin pages.

### Write-path services

These are the important write lanes to keep explicit and auditable:

- `src/services/action-start-write.ts`
- `src/services/proof-submission-write.ts`
- `src/services/leader-proof-decision-write.ts`
- `src/services/membership-approval-write.ts`
- `src/services/coach-decision-write.ts`

Each write path should stay narrow, server-owned, and easy to test.

## Structure rules

- Prefer obvious names over clever abstraction.
- Keep business logic in services, not in page components.
- Keep role routing simple: login decides the user, backend decides the workspace.
- Keep Luma, points, and leaderboard logic close together conceptually.
- Keep chapter-to-calendar mapping explicit and reviewable.
- Keep scaling logic human-readable. A staff reviewer should be able to tell whether we are ready for 1, 5, 25, or 300 chapters without reading implementation details.
- Treat review packets and launch gates as support tooling, not the center of the app architecture.

## Production direction

Before broad rollout, we should be able to explain the app in one sentence:

`myMEDLIFE is a role-based operating system where events, RSVP, attendance, points, and leaderboards drive the chapter experience.`

If a new change does not help that sentence become clearer, it probably belongs later.
