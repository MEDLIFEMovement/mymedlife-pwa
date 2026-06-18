# 04 · Feature Traceability — Linking Features to Commits & Pull Requests

*Part of the MEDLIFE AI Project Documentation Kit · Applies from the first line of code onwards*

## Why This Matters

Without a consistent chain from user story → Linear issue → branch → commits → PR, teams lose sight of why a change exists and whether it is complete.

This file is the project-level traceability ledger for myMEDLIFE.

---

## Current Source of Truth

- User stories: `docs/02-user-stories.md`
- GitHub repository: `MEDLIFEMovement/mymedlife-pwa`
- Snapshot date: 2026-06-17

---

## Snapshot: Branches and Pull Requests Found

### Branches

- **Local branches**: `main`, `codex/goal-5-supabase-local-rls`, `codex/goal-8-read-only-local-data`, `codex/goal-9-local-auth-role-readiness`, `codex/goal-10-role-aware-readonly`, `codex/goal-11-local-proof-action-contracts`, `codex/goal-12-disabled-write-readiness`, `codex/goal-15-proof-submission-write`, `codex/goal-16-hq-proof-sharing-decision`, `codex/goal-17-proof-storage-plan`, `codex/goal-18-leader-assignment-create`, `codex/goal-19-auth-onboarding-plan`, `codex/goal-20-live-data-connection-plan`, `codex/goal-62-proof-submission-server-action`, `codex/goal-72-staff-dry-run-guide`, `codex/goal-73-pilot-scope-planner`, `codex/goal-74-first-write-drill`, `codex/goal-75-first-write-readback-evidence`, `codex/goal-76-first-write-verification-packet`, `codex/goal-77-write-sequence-planner`, and `codex/goal-78-proof-metadata-packet`.

- **Remote active refs seen now**: `main`, `codex/goal-5-supabase-local-rls`, `codex/goal-15-proof-submission-write`, `codex/goal-16-hq-proof-sharing-decision`, `codex/goal-17-proof-storage-plan`, `codex/goal-18-leader-assignment-create`, `codex/goal-19-auth-onboarding-plan`, `codex/goal-20-live-data-connection-plan`, `codex/goal-77-write-sequence-planner`, `codex/goal-78-proof-metadata-packet`, `codex/goal-82-write-sequence-status`, and stale refs for goals 79–89 (all previously merged).

- **Open PRs**: none

- **Merged PRs**: 89 PRs currently in repo history (`#93` down to `#5`), all with `state: MERGED`.

---

## Branch ↔ PR Inventory (all merged)

| PR | Branch | State | Headline |
|---|---|---|---|
| 93 | codex/goal-89-leader-evidence-follow-up | MERGED | Goal 89: leader evidence follow-up board |
| 92 | codex/goal-88-member-proof-status | MERGED | Goal 88: member proof status |
| 91 | codex/goal-87-action-proof-handoff | MERGED | Goal 87: action proof handoff |
| 90 | codex/goal-86-event-proof-bridge | MERGED | Goal 86: event proof bridge |
| 89 | codex/goal-85-action-committee-workspace | MERGED | Goal 85: action committee workspace |
| 88 | codex/goal-84-action-committee-roles | MERGED | Goal 84: action committee role personas |
| 87 | codex/goal-83-five-write-dry-run | MERGED | Goal 83: five-write staff dry-run rehearsal |
| 86 | codex/goal-82-write-sequence-status | MERGED | Goal 82: write sequence packet status |
| 85 | codex/goal-81-coach-decision-packet | MERGED | Goal 81: coach decision packet |
| 84 | codex/goal-80-leader-assignment-packet | MERGED | Goal 80: leader assignment packet |
| 83 | codex/goal-79-hq-proof-decision-packet | MERGED | Goal 79: HQ proof decision packet |
| 82 | codex/goal-78-proof-metadata-packet | MERGED | Goal 78: proof metadata operator packet |
| 81 | codex/goal-77-write-sequence-planner | MERGED | Goal 77: write sequence planner |
| 80 | codex/goal-76-first-write-verification-packet | MERGED | Goal 76: first-write verification packet |
| 79 | codex/goal-75-first-write-readback-evidence | MERGED | Goal 75: first-write readback evidence |
| 78 | codex/goal-74-first-write-drill | MERGED | Goal 74: first-write activation drill |
| 77 | codex/goal-73-pilot-scope-planner | MERGED | Goal 73: pilot scope planner |
| 76 | codex/goal-72-staff-dry-run-guide | MERGED | Goal 72: staff dry-run guide |
| 75 | codex/goal-71-controlled-pilot-readiness | MERGED | Goal 71: controlled pilot readiness |
| 74 | codex/goal-70-design-qa-readiness | MERGED | Goal 70: design QA readiness |
| 73 | codex/goal-69-rush-month-event-readiness | MERGED | Goal 69: Rush Month event readiness |
| 72 | codex/goal-68-proof-upload-intake | MERGED | Goal 68: proof upload intake readiness |
| 71 | codex/goal-67-chapter-membership-workspace | MERGED | Goal 67: chapter membership workspace |
| 70 | codex/goal-66-mvp-progress-map | MERGED | Goal 66: MVP progress map |
| 69 | codex/goal-65-coach-decision-server-action | MERGED | Goal 65: coach decision server action |
| 68 | codex/goal-64-leader-assignment-server-action | MERGED | Goal 64: leader assignment server action |
| 67 | codex/goal-63-hq-proof-decision-server-action | MERGED | Goal 63: HQ proof decision server action |
| 66 | codex/goal-62-proof-submission-server-action | MERGED | Goal 62: proof submission server action |
| 65 | codex/goal-61-action-start-readback | MERGED | Goal 61: action-start readback proof |
| 64 | codex/goal-60-action-start-server-action | MERGED | Goal 60: local action-start server action |
| 63 | codex/goal-59-auth-derived-actor-context | MERGED | Goal 59: auth-derived actor context |
| 62 | codex/goal-58-local-auth-sign-in | MERGED | Goal 58: local Supabase auth sign-in |
| 61 | codex/goal-57-local-review-guide | MERGED | Goal 57: local MVP review guide |
| 60 | codex/goal-56-environment-safety-summary | MERGED | Goal 56: environment safety summary |
| 59 | codex/goal-55-admin-glossary | MERGED | Goal 55: admin glossary |
| 58 | codex/goal-54-stakeholder-review-path | MERGED | Goal 54: stakeholder review path |
| 57 | codex/goal-53-route-coverage-summary | MERGED | Goal 53: route coverage summary |
| 56 | codex/goal-52-route-registry-guard | MERGED | Goal 52: route registry guard |
| 55 | codex/goal-51-page-metadata | MERGED | Goal 51: page metadata |
| 54 | codex/goal-50-pwa-install-readiness | MERGED | Goal 50: PWA install readiness |
| 53 | codex/goal-49-centralize-actor-panels | MERGED | Goal 49: centralize local actor panels |
| 52 | codex/goal-48-mobile-navigation-polish | MERGED | Goal 48: mobile navigation polish |
| 51 | codex/goal-47-release-readiness-summary | MERGED | Goal 47: MVP release readiness |
| 50 | codex/goal-46-route-smoke-manifest | MERGED | Goal 46: route smoke manifest |
| 49 | codex/goal-45-mvp-coverage-checklist | MERGED | Goal 45: MVP coverage checklist |
| 48 | codex/goal-44-campaign-closeout-readiness | MERGED | Goal 44: campaign closeout readiness |
| 47 | codex/goal-43-member-recognition | MERGED | Goal 43: member recognition |
| 46 | codex/goal-42-proof-sharing-review-states | MERGED | Goal 42: proof sharing review states |
| 45 | codex/goal-41-coach-portfolio-readiness | MERGED | Goal 41: coach portfolio readiness |
| 44 | codex/goal-40-leader-follow-up-board | MERGED | Goal 40: leader follow-up board |
| 43 | codex/goal-39-role-next-actions | MERGED | Goal 39: role next-action guidance |
| 42 | codex/goal-38-admin-control-center | MERGED | Goal 38: admin control center |
| 41 | codex/goal-37-rush-month-local-loop | MERGED | Goal 37: Rush Month local operating loop |
| 40 | codex/goal-36-assignment-create-result-states | MERGED | Goal 36: assignment creation result states |
| 39 | codex/goal-35-result-state-coverage | MERGED | Goal 35: result-state coverage review |
| 38 | codex/goal-34-coach-decision-result-states | MERGED | Goal 34: coach decision result states |
| 37 | codex/goal-33-hq-proof-decision-result-states | MERGED | Goal 33: HQ proof decision result states |
| 36 | codex/goal-32-proof-submission-result-states | MERGED | Goal 32: proof submission result states |
| 35 | codex/goal-31-action-start-result-states | MERGED | Goal 31: action-start result states |
| 34 | codex/goal-30-action-start-activation-contract | MERGED | Goal 30 action-start activation contract |
| 33 | codex/goal-29-write-activation-approval-plan | MERGED | Goal 29 write activation approval plan |
| 32 | codex/goal-28-write-activation-readiness | MERGED | Goal 28 write activation readiness |
| 31 | codex/goal-27-coach-decision-write-gate | MERGED | Goal 27 coach decision write gate |
| 30 | codex/goal-26-hq-proof-decision-write-gate | MERGED | Goal 26 HQ proof decision write gate |
| 29 | codex/goal-25-proof-submission-write-gate | MERGED | Goal 25 proof submission write gate |
| 28 | codex/goal-24-leader-assignment-write-gate | MERGED | Goal 24 leader assignment write gate |
| 27 | codex/goal-23-action-start-write-gate | MERGED | Goal 23 action start write gate |
| 26 | codex/goal-22-rush-month-dashboard | MERGED | Goal 22 Rush Month dashboard |
| 25 | codex/goal-21-next-10-mvp-items | MERGED | Goal 21 campaign operating shells |
| 24 | codex/goal-20-live-data-connection-plan | MERGED | Goal 20 live data connection plan |
| 23 | codex/goal-19-auth-onboarding-plan | MERGED | Goal 19 auth onboarding plan |
| 22 | codex/goal-18-leader-assignment-create | MERGED | Goal 18 leader assignment creation |
| 21 | codex/goal-17-proof-storage-plan | MERGED | Goal 17 proof storage readiness |
| 20 | codex/goal-16-hq-proof-sharing-decision | MERGED | Goal 16 HQ proof sharing decision |
| 19 | codex/goal-15-proof-submission-write | MERGED | Goal 15 proof metadata write |
| 18 | codex/goal-14-action-start-write | MERGED | Goal 14 action start write |
| 17 | codex/goal-13-local-write-plan | MERGED | Goal 13 write plan matrix |
| 16 | codex/goal-12-disabled-write-readiness | MERGED | Goal 12: Disabled write-readiness airlock |
| 15 | codex/goal-11-local-proof-action-contracts | MERGED | Goal 11: Local proof/action contracts |
| 14 | codex/goal-10-role-aware-readonly | MERGED | Goal 10: Role-aware read-only experience |
| 13 | codex/goal-9-local-auth-role-readiness | MERGED | Goal 9: Local actor role context |
| 12 | codex/goal-8-read-only-local-data | MERGED | Goal 8: Read-only local Supabase data bridge |
| 11 | codex/goal-7-campaign-operating-model | MERGED | Goal 7 campaign operating model refinement |
| 10 | codex/goal-6-supabase-review-plan | MERGED | Goal 6 Supabase foundation review and Goal 7 plan |
| 9 | codex/goal-5-supabase-local-rls | MERGED | Goal 5 Supabase local RLS foundation |
| 8 | codex/goal-4-supabase-rls-plan | MERGED | Goal 4 Supabase schema, auth, and RLS design plan |
| 7 | codex/goal-3-domain-validation-tests | MERGED | Add Rush Month domain validation and service tests |
| 6 | codex/goal-2-rush-month-shell | MERGED | Build myMEDLIFE Rush Month mock shell |
| 5 | codex/foundation-rush-month-plan | MERGED | Document myMEDLIFE foundation and Rush Month MVP plan |

---

## User Story Traceability Status (against `docs/02-user-stories.md`)

| User Story | Branch exists | Branch naming matches template? | PR | PR status | Linear issue | Trace State |
|---|---|---|---|---|---|---|
| US-01 | codex/goal-10, goal-39 | Yes | No (`feat/MED-xx` expected) | #14, #43 | **Missing** (no `MED-` reference) | In Review-blocked by traceability |
| US-02 | codex/goal-11, goal-62 | Yes | No (`feat/MED-xx` expected) | #15, #66 | Missing | In Review-blocked by traceability |
| US-03 | codex/goal-67, goal-68 | Yes | No (`feat/MED-xx` expected) | #71, #72 | Missing | In Review-blocked by traceability |
| US-04 | codex/goal-60, goal-15 | Yes | No (`feat/MED-xx` expected) | #64, #19 | Missing | In Review-blocked by traceability |
| US-05 | codex/goal-48, goal-50 | Yes | No (`feat/MED-xx` expected) | #52, #54 | Missing | In Review-blocked by traceability |
| US-10 | codex/goal-18, goal-24 | Yes | No (`feat/MED-xx` expected) | #22, #28 | Missing | In Review-blocked by traceability |
| US-11 | codex/goal-22, goal-23 | Yes | No (`feat/MED-xx` expected) | #26, #27 | Missing | In Review-blocked by traceability |
| US-12 | codex/goal-33, goal-42 | Yes | No (`feat/MED-xx` expected) | #37, #46 | Missing | In Review-blocked by traceability |
| US-13 | codex/goal-40, goal-44 | Yes | No (`feat/MED-xx` expected) | #44, #48 | Missing | In Review-blocked by traceability |
| US-14 | codex/goal-37, goal-71 | Yes | No (`feat/MED-xx` expected) | #41, #77 | Missing | In Review-blocked by traceability |
| US-20 | codex/goal-41, goal-65 | Yes | No (`feat/MED-xx` expected) | #45, #69 | Missing | In Review-blocked by traceability |
| US-21 | codex/goal-45, goal-74 | Yes | No (`feat/MED-xx` expected) | #49, #78 | Missing | In Review-blocked by traceability |
| US-22 | codex/goal-42, goal-43 | Yes | No (`feat/MED-xx` expected) | #46, #47 | Missing | In Review-blocked by traceability |
| US-30 | codex/goal-38, goal-53 | Yes | No (`feat/MED-xx` expected) | #42, #57 | Missing | In Review-blocked by traceability |
| US-31 | codex/goal-47, goal-56 | Yes | No (`feat/MED-xx` expected) | #51, #60 | Missing | In Review-blocked by traceability |
| US-32 | codex/goal-47, goal-59 | Yes | No (`feat/MED-xx` expected) | #51, #63 | Missing | In Review-blocked by traceability |
| US-33 | codex/goal-42, goal-34 | Yes | No (`feat/MED-xx` expected) | #46, #38 | Missing | In Review-blocked by traceability |
| US-34 | codex/goal-47, goal-53 | Yes | No (`feat/MED-xx` expected) | #51, #57 | Missing | In Review-blocked by traceability |
| US-40 | codex/goal-46, goal-50 | Yes | No (`feat/MED-xx` expected) | #50, #54 | Missing | In Review-blocked by traceability |
| US-41 | codex/goal-30, goal-54 | Yes | No (`feat/MED-xx` expected) | #34, #58 | Missing | In Review-blocked by traceability |
| US-42 | codex/goal-55, goal-58 | Yes | No (`feat/MED-xx` expected) | #59, #62 | Missing | In Review-blocked by traceability |

### Traceability status interpretation for this project phase

Because none of the branch names include `MED-XX`, and no commit titles currently carry `MED-XX`, the Linear issue chain cannot be constructed automatically. In this pass, every implemented feature is `MERGED` in GitHub but **not traceable through the required Linear naming chain**.

---

## Branch naming convention and governance actions

- Required format in traceability plan: `feat|fix|chore|docs/MED-XX-...`
- Current format in GitHub: `codex/goal-XX-...` (and earlier `codex/goal-2...`).
- This breaks two governance checks:
  1. No `MED-XX` issue ID in branch/commit surface.
  2. No consistent traceability link to Linear from branch and PR titles.

Recommended comment text to add where conventions differ:

> This branch does not follow the traceability naming convention in `docs/04-feature-traceability.md`. Please rename/rebase this work into a `feat/MED-XX-...` (or `fix/`, `chore/`, `docs/`) branch and link it to an existing `MED-XX` Linear issue, then update PR title/description accordingly.

---

## Step 5: Untracked work (current)

- **User-story/Linear tracking check:** current user stories in `docs/02-user-stories.md` are high-level and do not map 1:1 to `MED-XX`-coded Linear issues.
- **Observed branch outcome:** there are **89 merged branches/features** in GitHub history with no visible `MED-XX` issue linkage.
- **Action required:** either (a) create matching Linear issues for each branch-feature using the existing goal context, or (b) create/align new `MED-XX` user stories first and rebase future work using the template convention.

---

## Step 6: Linear attachment requirement

Per project rules, the four documentation files should be attached to the Linear project for living traceability:
- `docs/01-one-page-brief.md`
- `docs/02-user-stories.md`
- `docs/03-architecture-nfr.md`
- `docs/04-feature-traceability.md`

**Not executed in this environment yet (no Linear API/tool credentials found here).**
