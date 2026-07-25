# myMEDLIFE Figma Acceptance Checklists

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: reviewer-ready source-fidelity checklists for the current shell
ownership model.

## Universal Figma Acceptance Rules

- Exported/Figma-derived code and repo source are the visual contract.
- Screenshots are acceptance references, not redesign permission.
- Repo truth wins for what is implemented now.
- Source-backed menu items should stay visible even when unfinished.
- Unfinished controls must be route-backed, read-only, disabled, blocked, or
  preview-only. No silent dead controls.
- Visible fake/sandbox/Figma-derived content must include `TEST`.
- Product/provider/module/menu labels stay clean: MEDLIFE, myMEDLIFE, Luma,
  Events, RSVP, Attendance, Points, SLT Prep, HubSpot, Hootsuite, Smile.io,
  n8n, BigQuery, Databricks, role labels, and menu labels should not be
  prefixed.

## #1 Member App Checklist

Source intent to compare:

- `src/components/figma-member-mobile-home.tsx`
- `src/components/figma-member-stories-page.tsx`
- member routes under `src/app/app/*`
- `/profile`
- member acceptance docs in `docs/user-stories/*member*`

Must keep:

- Mobile-first member shell and bottom-nav family.
- Home, Events, Stories, Points, Profile, and SLT entry where source-backed.
- Event cards, event detail, RSVP/check-in posture, and points handoff.
- IG-style Stories/feed feel where source-backed.

Controls that must stay honest:

- RSVP, check-in, attendance, points award, leaderboard, story reaction, save,
  share, comment, publish, profile edit, SLT forms/payment/provider controls.

TEST-label expectations:

- Fake member names, chapters, events, stories/proof cards, points rows,
  leaderboard rows, campaign examples, SLT/traveler sample rows, and fake
  metrics show `TEST`.

Reviewer checks:

- Does the changed route still feel like the exported member app rather than a
  generic web page?
- Can a reviewer click through the touched path without silent dead taps?
- Does copy avoid claiming live RSVP, attendance, points, story publish, profile
  write, or SLT provider behavior?
- Did the PR stay out of leader/staff/admin/auth/rollout files?

Matrix:

- May support `Scope/UI` and `QA/Ops`.
- Does not support `Data/Auth`, `Writes/Integrations`, or `Rollout Gate`.

## #2 Student Leadership Checklist

Source intent to compare:

- `src/components/figma-leader-command-center.tsx`
- `src/components/figma-leader-create-event-screen.tsx`
- `src/components/figma-leader-stories-screen.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/app/leader/page.tsx`
- leader routing and support tests

Must keep:

- Student Leadership / Chapter Command Center shell and menu families.
- `/leader?view=*` canonical route behavior.
- Overview, events, attendance, leaderboard, members/profile, create event,
  committees, values, succession, training, impact, bridge videos, and stories
  where source-backed.

Controls that must stay honest:

- Create/publish event, attendance import, assign/promote, role/member updates,
  succession, committee ownership, follow-up/contact, points award, export, and
  provider-looking controls.

TEST-label expectations:

- Fake leaders, members, chapters, events, leaderboard rows, profile previews,
  succession examples, story/training samples, and fake metrics show `TEST`.

Reviewer checks:

- Do direct `/leader?view=*` links, reloads, and menu clicks land on the intended
  view?
- Are source-backed menu items preserved even if unfinished?
- Are operation-looking controls blocked/read-only/preview-only?
- Did the PR avoid member/staff/admin files and production role/data writes?

Matrix:

- May support `Scope/UI` and `QA/Ops`.
- Does not support `Data/Auth`, `Writes/Integrations`, or `Rollout Gate`.

## #3 Staff / DS Admin Checklist

Source intent to compare:

- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`
- `src/app/staff/page.tsx`
- `src/app/admin/*`
- staff/admin shell acceptance docs

Must keep:

- Staff top nav and chapter portfolio.
- Chapter drawer/detail handoffs.
- Campaigns, Proof/UGC, Best Practices, SOPs, and embedded Admin handoff where
  source-backed.
- Dark DS Admin shell/menu family, including Overview, Users, Chapters,
  Modules, Luma Events, Points, Integrations, Audit Logs, System Health, API
  Keys, MCP Connections, Settings, and disabled modules where source-backed.

Controls that must stay honest:

- Intervention, survey, export, proof review/moderation/publish, SOP
  publish/rollback, provider sync, API key, MCP, system health, audit/outbox,
  user/role/chapter, module toggle, launch gate, invite, and owner-data
  controls.

TEST-label expectations:

- Fake staff/admin users, chapters/schools, portfolio rows, proof/UGC cards,
  campaign/SOP samples, audit actors, admin changes, provider/API placeholders,
  placeholder owners, and fake metrics show `TEST`.

Reviewer checks:

- Does the staff/admin walkthrough look source-backed and demo-safe?
- Is the top-right alert/profile/header area readable and non-overlapping?
- Does embedded Admin preserve the dark admin menu family and back affordance?
- Are live-looking admin/provider controls blocked/read-only/preview-only?
- Did the PR avoid member/leader files and rollout evidence ownership?

Matrix:

- May support `Scope/UI` and `QA/Ops`.
- Does not support `Data/Auth`, `Writes/Integrations`, or `Rollout Gate`.

## #4 QA Checklist

Before merge, #4 should verify:

- PR scope stays inside the assigned shell lane.
- Source/Figma evidence is named; screenshots are secondary.
- Visible fake content has `TEST`.
- Product/provider/menu/module labels are not incorrectly prefixed.
- Unfinished controls are not silent and do not imply live writes.
- Tests/checks are focused and relevant.
- Any public no-write smoke is described as route/shell confidence only.

Red flags for Coordinator:

- Shared auth/routing helpers changed without approval.
- Provider/API/Supabase production access requested or used.
- Rollout packet, owner CSV, signed-in proof, pilot proof, or live counts are
  claimed from a shell PR.
- TEST/sandbox/Figma data is presented as production evidence.
- A builder touches another shell family.
