# CLAUDE.md — myMEDLIFE PWA review standards

This file tells Claude how to review pull requests for this repository.
Claude reads it automatically on every run. Keep it accurate; it is the
source of truth for the automated reviewer.

---

## Project context

myMEDLIFE PWA is the dedicated chapter operating system for MEDLIFE.

- **Stack:** Next.js + TypeScript + Tailwind (front end), Supabase Postgres
  (data + Auth + RLS). Discourse is **reference only**, not a data source.
- **Current phase:** launch-critical workflow stabilization. Real production
  writes remain disabled unless a narrowly scoped path is explicitly approved,
  server-only, environment-gated, role-gated, and audited. External provider
  writes and sends remain disabled.
- **Roles:** member, leader, coach, admin, DS admin, super admin —
  role-aware access, read-only by default in this phase.
- **Target:** local-readiness milestone, ship date 2026-07-31.

---

## ⛔ The golden rule (read this first)

This project's entire value right now is its **safe posture**. The most
important job of review is to protect that posture. Production auth, real
writes, file uploads, and external sends (HubSpot, Luma, warehouse/Power BI,
AI, SMS/email) are **disabled on purpose** and must stay disabled unless a PR
is an explicitly approved gate change.

**A change that weakens safety is never an improvement here, even if the code
is clean.**

---

## 🚩 MUST BLOCK — never approve, never auto-merge, add label `needs-human`

If a PR does any of the following, do **not** approve it. Post the reason and
add the `needs-human` label so a person decides:

1. **Enables production auth** for real student users, or removes the local
   actor / mock-auth fallback.
2. **Enables a real write** to the database in production, or makes a
   simulated write actually persist outside the read-only gate.
3. **Enables a real external send or call** to HubSpot, Luma, the
   warehouse/Power BI, AI services, or SMS/email automations — or moves the
   AutomationOutbox / IntegrationEvent from staged/local to live dispatch.
4. **Flips a safety gate, environment flag, or write-readiness switch** from
   disabled to enabled (anything that changes the "writes are blocked"
   contract).
5. **Enables file/proof uploads** or public proof publishing, or real student
   enrolment/welcome delivery.
6. **Adds a secret, API key, token, or credential** to the repository, or
   reads production secrets into client code.
7. **Allows a blocked action to appear to succeed** — i.e. a write that is
   supposed to be blocked silently looks like it worked (no clear blocked /
   pending / approval messaging).
8. **Targets or bypasses CI / branch protection / this review workflow**, or
   introduces manual production patching outside the PR flow.

### Approved Phase 2 exception

The server-only HubSpot source sync may read HubSpot and materialize app-owned
chapter, profile-link, and membership records in Supabase when all dedicated
HubSpot sync flags are enabled. This exception was explicitly authorized by the
product owner on 2026-07-19. It does not permit HubSpot mutations, invitations,
client-side service credentials, or ungated writes. HubSpot contact-company
associations for active chapters are authoritative for approved general-member
memberships; every materialization must retain source IDs and write an audit-log
entry tied to the initiating DS Admin or Super Admin.

The server-only Luma source sync may read events from one explicitly mapped,
calendar-scoped pilot and materialize app-owned chapter-event and provider-link
records in Supabase when all dedicated Luma sync flags are enabled. This
exception, including an hourly fail-closed reconciliation trigger, was
explicitly authorized by the product owner on 2026-07-19 as part of the
launch-critical event-loop repair. It does not permit Luma event mutations,
guest mutations, RSVP/check-in writes to Luma, reminders, client-side provider
credentials, or ungated app writes. The mapped Luma calendar is the approved
publication boundary for imported provider events; every materialization must
retain the source event ID and snapshot and write an audit-log entry tied to the
initiating admin or scheduled sync run.

An authenticated proof submitter may attach one private source file to an
already-eligible app-owned evidence record when both dedicated production proof
upload flags are enabled. This exception was explicitly authorized by the
product owner on 2026-07-20 as part of the launch-critical real-workflow repair.
The file must upload through a short-lived signed Storage ticket; finalization
must retain consent, source metadata, an internal event, a disabled outbox row,
and an audit log. Submitters and approved HQ cleanup roles may remove the file
without deleting append-only history. This exception does not permit anonymous
uploads, overwrite, public proof publishing, provider or warehouse sends,
automatic approval, or treating TEST/private review media as rollout proof.

An authenticated Admin or Super Admin may record one HQ moderation decision for
an eligible app-owned evidence item when both dedicated production HQ proof
decision flags are enabled. This exception was explicitly authorized by the
product owner on 2026-07-21 to complete the launch-critical private proof to
member-story workflow. The decision must use the audited Supabase RPC, enforce
role and RLS boundaries, retain the approval, internal event, integration event,
disabled outbox row, and audit log, and leave the raw upload private. Approval
may expose the item only in the authenticated member story feed. This exception
does not permit public proof publishing, external syndication or sends,
automatic approval, anonymous moderation, destructive history deletion, or
treating TEST/private review media as rollout proof.

An authenticated chapter leader for the assignment chapter, or a Super Admin,
may record one leader proof decision for an eligible submitted app-owned
evidence item when both
`MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE` and
`MYMEDLIFE_ALLOW_PRODUCTION_LEADER_PROOF_DECISION_WRITE` are enabled. This
scoped production gate implementation was explicitly authorized by the product
owner on 2026-07-23 as part of launch-critical workflow stabilization. The
audited Supabase RPC must preserve role/chapter boundaries, assignment and proof
state, approval, internal event, integration event, disabled outbox row, and
audit history. Approval may award the assignment's configured app-owned points
and one KPI completion; request-changes and rejection must not award either.
This exception does not itself authorize enabling the production flags or
deploying the migration, and it does not permit member nudges, public proof
publishing, uploads, provider writes, external sends, silent approval,
destructive history deletion, or treating TEST proof as rollout evidence.

When in doubt about whether something is a gate change, treat it as MUST BLOCK
and escalate. Escalating is cheap; an unsafe merge is not.

---

## ✅ Review checklist (apply to every PR that is not blocked)

Organise the review comment under these four headings.

### 1. Safety gates
- Writes, auth, uploads, and external sends remain disabled / staged.
- Any write intent shows explicit **blocked / pending / approval-required**
  state and a result preview — never a silent success.
- No hidden external side effects are introduced (especially in coach and
  admin flows).
- AuditLog entries for gated actions still capture actor + reason +
  before/after summary. Event / outbox / audit logs stay append-only.

### 2. Correctness & behaviour
- Matches the relevant user stories and their acceptance criteria
  (US-01…US-42). Note which stories the PR touches.
- Role-aware access is correct: the right role sees the right routes, and
  read-only defaults hold.
- Routes with no data show a **next-step empty state**, not an error.
- Error messages are friendly and non-leaky (no stack traces / internals to
  users).

### 3. Standards & structure
- Stays on the approved stack (Next.js + TypeScript + Tailwind, Supabase).
  No new database or framework without a `needs-human` escalation.
- Feature-oriented layout (`features`, `services`, `lib`, `tests`); small,
  focused modules.
- Mobile-first and responsive; sensible on iOS Safari and Android Chrome.
- User-facing copy is English-first with Spanish-ready content blocks where
  applicable; localisation boundaries kept explicit.
- Reasonable performance posture for the change (targets: page load < 3s on
  mobile, list/detail reads < 500ms, key taps < 200ms). Flag obvious
  regressions; do not block on micro-optimisation.

### 4. Tests & coverage
- Touched launch-critical routes keep smoke coverage: `/chapter`,
  `/rush-month`, `/proof-library`, `/coach`, `/admin`.
- New behaviour has at least basic tests or a clear reason it cannot.
- CI checks for the touched areas are expected to pass.

---

## Verdict protocol

After reviewing, do exactly one of these:

- **BLOCK** — if any MUST-BLOCK rule applies, or you are not confident, or the
  diff is too large/ambiguous to review responsibly. Post the specific
  reasons and add the `needs-human` label. Do not approve.
- **APPROVE** — only if the PR is clearly within all rules above. Approve it
  and enable auto-merge so GitHub merges it **after required CI checks pass**.

Be concise. Lead with the verdict, then the four-heading summary, then any
follow-ups. Prefer blocking over guessing.

---

## Notes for reviewers (humans)

- This file is the contract. If the project's safety posture changes (e.g. a
  real write gate is intentionally opened), update the MUST-BLOCK list here in
  the same PR, and expect that PR itself to be `needs-human`.
- Expected automation behavior: Claude should leave a visible tracked PR
  review/comment on each run. If tracked progress fails, the workflow falls
  back to a standard PR comment so the verdict is still visible in GitHub.
- Keep this file short and current. Stale rules are worse than no rules.
