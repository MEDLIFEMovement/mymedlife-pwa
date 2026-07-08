# myMEDLIFE Reviewer Decision Tree

Date: 2026-07-07  
Owner lane: myMEDLIFE #5, planning/docs only  
Planning reference: MED-512  
Purpose: give Coordinator and `#4` a plain-English way to decide what a PR
actually proves, what it does not prove, and whether to merge, refresh, or send
it back.

## Sources Inspected

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/user-story-gap-report.md`
- `docs/user-stories/delivery-backlog.md`
- `docs/user-stories/story-to-test-traceability.md`
- `docs/user-stories/latest-main-builder-crosswalk.md`
- `docs/user-stories/builder-ticket-packet.md`
- `docs/user-stories/module-to-shell-acceptance-map.md`
- `docs/user-stories/narrow-launch-truth-refresh.md`

## Core Truth Rules

- Repo truth wins over screenshots, planning intent, or Figma optimism for
  implementation status.
- Figma/exported code is the visual and navigation contract, not rollout proof.
- Visible fake people, chapters, events, stories, proof, campaigns, audit
  actors, providers, and metrics must keep `TEST`.
- TEST, sandbox, Figma, local, smoke, preview, and screenshot evidence never
  counts as rollout proof.
- No PR should be credited for production readiness unless repo evidence,
  approved production proof, or rollout artifacts actually changed.

## Quick Decision Tree

### 1. What kind of PR is this?

Ask this first:

1. Is it shell-only or route/control honesty?
2. Is it blocked-state or preview-only wording/visibility?
3. Is it tests-only or test-heavy with no user-facing behavior change?
4. Does it introduce any real data/auth/write/provider behavior?
5. Does it claim rollout proof or use TEST/sandbox/Figma data as if it were
   real?

If the answer is `4` or `5`, stop and review more carefully. Those PRs are not
ordinary shell-fidelity merges.

### 2. If it is shell-only, what can move?

What it proves:

- The assigned shell looks closer to the exported/Figma contract.
- Routes, menus, and visible controls are more honest.
- The affected module may deserve modest `Scope/UI` movement after merge and
  smoke.
- If focused tests and smoke pass, the affected module may also deserve modest
  `QA/Ops` movement.

What it does not prove:

- No `Data/Auth` movement by itself.
- No `Writes/Integrations` movement by itself.
- No `Rollout Gate` movement by itself.
- No production-readiness proof, even if the shell looks complete.

Merge posture:

- Merge if the file scope stays in the assigned shell lane, the controls are
  honest, visible fake content is `TEST` labeled, and checks are green.
- Refresh first only if the PR is behind-only and the refresh is small/safe.
- Send back if the PR silently changes cross-shell/shared auth or starts
  implying live writes.

### 3. If it is blocked-state or preview-only clarity only, what does that prove?

What it proves:

- The product is more honest about what users can and cannot do.
- High-risk controls no longer read like live operations when they are not.
- This can support modest `Scope/UI` movement and sometimes modest `QA/Ops`
  movement after merge and smoke.

What it does not prove:

- It does not make the blocked action safe to enable later.
- It does not prove write readiness, provider readiness, audit readiness, or
  rollout readiness.
- It does not prove that the underlying system is operational.

Good examples:

- API Keys remain masked and clearly non-live.
- MCP Connections stay visible but blocked or preview-only.
- RSVP/check-in buttons route correctly but do not pretend to write real data.

### 4. If it adds tests only, what evidence does that create?

What it proves:

- Repo behavior is more explicitly checked.
- Regression risk is lower for the tested route, component, or service.
- The tested module may earn modest `QA/Ops` confidence if the tests are
  meaningful and pass.

What it does not prove:

- Tests do not make a preview-only feature production-ready.
- Tests do not count as production signed-in proof.
- Tests do not count as pilot proof, live counts, owner-truth proof, or invite
  gate evidence.
- Tests do not justify `Writes/Integrations` movement unless the PR actually
  adds the corresponding safety contract and boundary evidence.

Reviewer shortcut:

- If a PR is tests-only, ask whether the tests prove route behavior, control
  honesty, or service boundaries. If not, treat it as helpful QA support, not a
  readiness jump.

### 5. If a PR uses TEST/sandbox/Figma data, what can never count as rollout proof?

Never count these as rollout proof:

- TEST-labeled visible rows
- local or sandbox accounts
- Figma/exported mock content
- screenshots without real account or data provenance
- public smoke runs
- preview cookies or actor switchers
- SOP sample/template data
- fake pilot events or fake points ledgers

Those can support:

- UI review
- visual QA
- shell-fidelity checks
- blocked-state honesty
- local test confidence

They cannot support:

- production signed-in proof
- owner CSV truth
- live counts
- pilot proof
- audit/outbox zero-send proof
- final invite gate

### 6. When is a public no-write smoke run useful?

Useful when:

- a PR touches route availability
- a PR changes shell navigation
- a PR changes visible controls that could silently dead-click
- a PR changes selectors used by existing smoke coverage

Not enough on its own when:

- the question is data/auth truth
- the question is provider/write readiness
- the question is production signed-in proof
- the question is rollout evidence

Plain-English rule:

- Public no-write smoke is route-health proof, not launch-readiness proof.

### 7. When should Coordinator merge immediately vs refresh first vs send back?

#### Merge immediately

Merge when all are true:

- scope stays inside the assigned shell or planning lane
- source-backed visual contract is preserved
- controls are route-backed, read-only, blocked, disabled, or preview-only
- visible fake content is `TEST` labeled
- checks are green
- no shared auth/provider/rollout files were changed without approval

#### Refresh first

Refresh when all are true:

- the PR is behind-only
- no scope drift is present
- no new conflict risk is introduced
- the refresh can be done as a smallest-safe rebase or merge-from-main

Do not turn a behind-only PR into a redesign pass.

#### Send back to a builder

Send back when any of these are true:

- controls silently do nothing
- live wording overclaims blocked functionality
- fake visible content is missing `TEST`
- the PR crosses shell boundaries without approval
- the PR edits auth/data/provider/rollout files from a shell-only lane
- screenshots or Figma are being used to overclaim implementation truth
- the PR claims rollout progress without real evidence

## Matrix Movement Rules

### What can move from a clean shell PR?

- Usually only modest `Scope/UI`
- Sometimes modest `QA/Ops` if focused tests and smoke evidence improved

### What should not move from a clean shell PR?

- `Data/Auth`
- `Writes/Integrations`
- `Rollout Gate`

### What can move from a tests-only PR?

- Sometimes modest `QA/Ops`

### What should not move from a tests-only PR?

- `Scope/UI` unless the PR also changed real visible behavior
- `Data/Auth`
- `Writes/Integrations`
- `Rollout Gate`

## Shell Review Reminders

### #1 General Member App

- Prioritize member shell fidelity, event/detail/points handoff honesty, Stories
  posture, Profile posture, and SLT member-shell integration.
- Reject drift into leader, staff, admin, auth, provider, or rollout work.

### #2 Student Leadership / Chapter Command Center

- Prioritize leader overview, events/attendance, leaderboard, member/profile
  handoff, committees/tasks, and support/culture honesty.
- Reject drift into member shell, staff/admin shell, real role mutation, or
  rollout evidence.

### #3 Staff / DS Admin Command Center

- Prioritize staff portfolio, campaigns, proof/UGC, admin handoff, DS Admin
  menu fidelity, blocked provider/admin verbs, and read-only admin review.
- Reject drift into member/leader shell work, provider readiness claims, or
  rollout-owner truth application.

### #4 QA / Release Watch

- Verify source evidence, PR scope, focused tests, visible `TEST` labels, and
  smoke usefulness.
- Do not treat screenshots, smoke, or docs as rollout proof.

## Coordinator Shortcut

If you only have one minute, ask:

1. Did this PR stay in its lane?
2. Did it make the UI more honest without implying live writes?
3. Are fake visible rows clearly marked `TEST`?
4. Did green checks prove behavior or only formatting/tests?
5. Did anything here actually change rollout evidence?

If `1` through `4` are yes and `5` is no, it is probably a clean shell/planning
merge and should not move the rollout gate.

## Matrix Recommendation

This decision tree is planning/documentation only. It should not move readiness
percentages by itself.
