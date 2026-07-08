# Post-Wave Next Builder Goals

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: give Coordinator paste-ready next assignments after the current shell
wave settles, while keeping the three-shell ownership model clean.

## Operating Rule

Do not start a new same-shell PR while an approved behind-only or draft PR is
still touching that shell's route family. Use #4 watch or #5 planning time
instead.

## #1 General Member App

**Start after:** `#518` and `#523` land, or Coordinator confirms the next #1
slice will not touch the same member shell, bottom-nav, profile, or
`/app/slt-prep` files.

**Next slice:** member cross-route continuity sweep for `/app`, `/app/events`,
event detail, `/app/points`, `/app/stories`, `/profile`, and `/app/slt-prep`.

**Why now:** recent member PRs improved individual surfaces, but the launch path
still depends on a student moving naturally across home, event participation
posture, points visibility, profile, Stories, and SLT entry without the shell
feeling stitched together.

**Likely file families:**

- `src/app/app/page.tsx`
- `src/app/app/member-home-page.tsx`
- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `src/app/app/stories/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/app/slt-prep/page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- member route/component tests

**Acceptance checks:**

- Bottom-nav and member shell still match exported/Figma member-app intent.
- Events -> detail -> RSVP/check-in posture -> points handoff is clear and preview-safe.
- Stories still reads as an IG-style feed/detail experience where source-backed.
- Profile and SLT entry feel like part of the member app, not separate products.
- Visible fake member/chapter/event/story/proof/points/SLT content keeps `TEST`.

**Must not touch:** `/leader`, `/staff`, `/admin`, auth/session helpers, Luma
writes, RSVP/check-in/attendance writes, points award authority, rollout
evidence, live counts, or production signed-in proof.

**Matrix limits:** `Scope/UI` and `QA/Ops` only if landed and tested/smoked.

## #2 Student Leadership / Chapter Command Center

**Start after:** `#524` lands or Coordinator confirms it will not touch the same
leader review-loop, member/profile, or support/culture files.

**Next slice:** leader cross-route continuity across Member Profile, Current
Leaders, Succession, Values, Leadership Training, and directly related
support/culture handoffs.

**Why now:** service-backed leader continuity is now base truth, and `#524`
covers the immediate review-loop follow-through. The next risk is that adjacent
leadership-development surfaces look route-backed but still imply role changes,
succession writes, member updates, or training assignment writes that are not
live.

**Likely file families:**

- `src/app/leader/page.tsx`
- `src/components/figma-leader-command-center.tsx`
- `src/components/leader-app-shell.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/components/figma-leader-stories-screen.tsx`
- `src/components/leadership-transition-campaign-panel.tsx`
- leader route/component tests

**Acceptance checks:**

- `/leader?view=*` routes reload into the expected view.
- Source-backed menu families stay visible.
- Member Profile, Current Leaders, Succession, Values, and Leadership Training
  read as one Chapter Command Center family.
- Promote, transition, assign, contact, attendance, points, and training
  controls are blocked, read-only, disabled, or preview-only.
- Visible fake leaders/members/chapters/training/succession/story rows keep
  `TEST`.

**Must not touch:** `/app`, `/staff`, `/admin`, role mutations, member writes,
event creation, attendance imports, notifications, provider sync, points awards,
or rollout proof.

**Matrix limits:** `Scope/UI` and `QA/Ops` only if landed and tested/smoked.

## #3 Staff / DS Admin Shell

**Start after:** `#516`, `#519`, `#521`, and `#522` settle or Coordinator
confirms the next #3 slice is non-overlapping.

**Next slice:** final staff/admin walkthrough continuity after the current
embedded Admin, admin-label, and Proof/UGC chapter-loop branches settle.

**Why now:** `#503`, `#515`, `#516`, `#519`, `#521`, and `#522` together form a
staff/admin walkthrough family. Once they settle, the next value is a narrow
continuity pass that checks chapter context, review posture, embedded Admin, and
dark Admin menu language agree without implying live moderation or launch-gate
authority.

**Likely file families:**

- `src/app/staff/page.tsx`
- `src/components/figma-staff-command-center.tsx`
- `src/components/staff-app-shell.tsx`
- `src/components/staff-command-center-panel.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/review-path/page.tsx`
- `src/app/admin/chapters/page.tsx`
- `src/components/figma-admin-panel.tsx`
- staff/admin route/component tests

**Acceptance checks:**

- Staff top nav, chapter drawer, embedded Admin, and dark Admin menu remain
  source-backed and recognizable.
- Command Center back/return affordances are visible and clear.
- Proof/UGC review next steps do not imply live approval, publishing, consent,
  or provider sync.
- Launch-gate, API, MCP, integration, audit, user, role, and chapter controls
  stay blocked/read-only/preview-only.
- Visible fake staff/admin/chapter/proof/audit/provider/fake metric content
  keeps `TEST`.

**Must not touch:** `/app`, `/leader`, owner CSVs, rollout packet, invite gate,
production proof rows, API key live actions, MCP live connects, provider writes,
audit mutation, or user/role/chapter production writes.

**Matrix limits:** `Scope/UI` and `QA/Ops` only if landed and tested/smoked.

## #4 Release / QA Watch

**Current watch set:** `#520`, `#518`, `#523`, `#524`, `#516`, `#519`, `#521`,
`#522`.

**Next task:** classify each PR as merged, behind-only, failing, blocked, or
ready for Coordinator action. After the product-code wave lands, run public
no-write smoke only when Coordinator asks or when route-level regression risk is
material.

**Acceptance checks:**

- Verify shell-specific PR scope stayed clean.
- Confirm visible fake content has `TEST`.
- Confirm unfinished controls are wired/read-only/blocked/preview-only, not
  silently dead.
- Confirm no PR claims production proof from smoke, screenshots, TEST content,
  or preview shells.

**Matrix limits:** `QA/Ops` only when tied to real checks, smoke, or reviewer
evidence. No rollout movement.
