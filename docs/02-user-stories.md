# 02 · User Requirements — User Stories

*Part of the MEDLIFE AI Project Documentation Kit · Complete before moving to Architecture stage*

## What Is a User Story?

A user story captures a feature or requirement from the perspective of the person who needs it. It keeps the focus on **why** something is being built, not just what.

Format:

> As a **[type of user]**, I want **[do something]** so that **[I get this outcome]**.

Each story should be small enough to build and test independently.

---

## User Type 1: Chapter Member / Participant

*Primary need: know what to do, submit proof, and see clear status in a safe mock/guide experience.*

| # | User Story | Priority | Notes |
|---|-----------|----------|-------|
| US-01 | As a **chapter member**, I want to see a role-aware home screen so that I can find the next action without guessing. | High | Covers `/chapter` and `/rush-month` entry experiences. |
| US-02 | As a **chapter member**, I want to open my assigned actions so that I know what is due and who owns each task. | High | Includes progress and overdue visibility rules. |
| US-03 | As a **chapter member**, I want to submit proof metadata in a guided flow so that I can move actions forward confidently. | High | Includes clear blocked-write messaging while writes are in read-only mode. |
| US-04 | As a **chapter member**, I want transparent proof status messaging so that I understand what is accepted, pending, or needing changes. | High | Keeps feedback human-readable and localized to chapter context. |
| US-05 | As a **chapter member**, I want useful empty states on routes with no data so that I know what to do next instead of seeing an error. | Med | Includes `/rush-month`, `/proof-library`, and campaign screens. |

Acceptance Criteria for this user type:
- I can identify my chapter role and current task without manual instruction.
- Every screen with no data shows a next-step message.
- Actions I cannot complete in mock mode are clearly marked and never appear to succeed silently.

---

## User Type 2: Chapter Leader / Action Committee

*Primary need: coordinate assignment flow and coaching readiness at chapter level.*

| # | User Story | Priority | Notes |
|---|-----------|----------|-------|
| US-10 | As a **chapter leader**, I want to see the chapter action board so that I can monitor completion and coach members quickly. | High | Includes assignment ownership and urgency posture. |
| US-11 | As a **chapter leader**, I want to create and assign actions to the right people so that responsibilities are clear before the next campaign step. | High | Keeps role-aware constraints visible in UI. |
| US-12 | As a **chapter leader**, I want to review member proof and status so that I can decide advance, request changes, or escalate. | High | Read-only today, write gate ready for later release. |
| US-13 | As a **leader**, I want a follow-up board for unresolved items so that nothing drops after deadlines. | Med | Includes follow-up lane and risk flags. |
| US-14 | As a **coach lead / action committee**, I want role-focused member and leader workflows so that coordination is consistent across campaigns. | Med | Supports consistency checks and training. |

Acceptance Criteria for this user type:
- I can inspect who owns each open action and when it is due.
- Proof review decisions are clear, trackable, and repeatable across routes.
- Unfinished items are surfaced as follow-up tasks.

---

## User Type 3: Coach

*Primary need: see where coaching support is most useful right now and provide safe recommendations.*

| # | User Story | Priority | Notes |
|---|-----------|----------|-------|
| US-20 | As a **coach**, I want to view portfolio-level chapter readiness so that I can focus interventions where they are needed. | High | Includes proof posture, campaign progress, and flags. |
| US-21 | As a **coach**, I want a coach-only guidance view (advance/hold/intervene) so that I can route support quickly. | High | Aligns recommendations with chapter state and risk. |
| US-22 | As a **coach**, I want to review review-path checkpoints so that I can prepare handoff confidence for the team. | Med | Includes review sequence and non-production safety checks. |

Acceptance Criteria for this user type:
- The coach can quickly see high-risk chapters in one pass.
- The guidance state is visible and explainable (not just a color code).
- No coach action currently triggers hidden external side effects in mock mode.

---

## User Type 4: Admin / DS Admin / Super Admin

*Primary need: maintain safe operational posture and release readiness.*

| # | User Story | Priority | Notes |
|---|-----------|----------|-------|
| US-30 | As an **admin**, I want a control center and route map so that I can verify app readiness before any launch review. | High | Includes `/admin` route grouping and sequencing. |
| US-31 | As a **DS admin**, I want explicit safety controls (write gates, audits, outbox posture, auth posture) so that no unsafe production change can slip through. | High | Covers environment policy and disabled-write contract. |
| US-32 | As a **super admin**, I want release and launch-readiness checklists so that decisions are reproducible and auditable. | High | Includes smoke matrix and evidence packet checks. |
| US-33 | As an **admin**, I want membership, auth, and role visibility routes so that role transitions can be verified before real operations. | Med | Read-only review orientation until explicit go-aheads. |
| US-34 | As an **admin**, I want outbox, audit, and integration signals visible so that downstream handoff readiness is clear. | Med | Prevents blind writes and unknown automation states. |

Acceptance Criteria for this user type:
- I can review readiness artifacts without invoking real writes.
- Safety posture is obvious from route and banner-level states.
- Any write-related intent shows explicit blocked/approval requirements and resulting effect preview.

---

## User Type 5: QA / Product Steward

*Primary need: verify feature integrity and coverage before handoff.*

| # | User Story | Priority | Notes |
|---|-----------|----------|-------|
| US-40 | As a **QA steward**, I want role-aware smoke coverage and mobile checks so that regressions are caught before handoff. | High | Includes device matrix and route manifest. |
| US-41 | As a **product steward**, I want documented user-story acceptance criteria mapped to routes so that review is repeatable. | High | Supports non-developer reviewers. |
| US-42 | As a **release steward**, I want a final review path with clear handoff checkpoints so that review and decision ownership stay visible. | Med | Includes stakeholder review and local pilot readiness sequence. |

Acceptance Criteria for this user type:
- I can run one stable review sequence before requesting go/no-go.
- Each route checked has purpose and owner.
- No hidden feature is reviewed out of sequence.

