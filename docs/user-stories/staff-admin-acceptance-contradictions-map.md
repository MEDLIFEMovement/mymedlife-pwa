# Staff / Admin Acceptance Contradictions Map

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Builder owner: `#3` Staff / DS Admin Command Center

## Purpose

Name the Staff/Admin places where the visible shell can look operational even
though repo truth is still preview-safe, blocked, or mock-safe. This helps #3
restore menu depth and DS Admin continuity without creating fake live admin
behavior.

## Source Evidence

- Staff route: `src/app/staff/page.tsx`
- Admin route: `src/app/admin/page.tsx`
- Staff source shell: `src/components/figma-staff-command-center.tsx`
- Admin source shell: `src/components/figma-admin-panel.tsx`
- Current Staff nav source: Chapters, Campaigns, Proof / UGC, Best Practices,
  Campaign SOPs, Admin.
- Current Admin menu source: Overview, Users, Chapters, Modules, Luma Events,
  Points, Integrations, Audit Logs, System Health, API Keys, MCP Connections,
  Settings, disabled modules.
- Prior planning: `docs/user-stories/staff-admin-review-queue-acceptance-packet.md`
- Current queue context: `#521`, `#522`, `#528`, and `#530` are clean; #3 should
  avoid launching another overlapping staff/admin slice until those settle.

## Contradictions To Keep Honest

| Visible surface | Why it can look complete | Repo-truth caveat | Acceptance rule |
| --- | --- | --- | --- |
| Staff Chapters / drawer | Portfolio metrics, risk states, survey preview, Admin handoff are visible. | Chapter rows are TEST/mock-safe; notes, interventions, follow-ups, outreach, owner changes, and survey sends are blocked. | Preserve drawer depth, but every write-like control must say preview/readback/blocked. |
| Proof / UGC review | Review queue, cards, consent posture, share targets, and Admin audit handoff are visible. | Proof ingestion, consent approval, moderation writes, provider fetch, publishing, sharing, and coach-note saves are blocked. | Keep review queue visible, but do not imply real moderation or evidence approval. |
| Embedded Admin | Dark Admin shell can open from staff and includes Command Center return cues. | Embedded Admin is preview/review posture, not staff-side admin write authority. | Preserve back/return affordance and role gate; block live admin operations. |
| DS Admin menu depth | API Keys, MCP Connections, Integrations, Audit Logs, System Health, Settings are visible. | Provider connect/test/send, API key reveal/copy/rotate/revoke, MCP live connect, audit mutation, and incident repair are blocked. | Keep menu items visible if source-backed; controls must be read-only/blocked/preview-only. |
| Launch Gate / release labels | Launch-gate review surfaces can sound official. | Owner CSVs, live counts, signed-in proof, pilot proof, audit/outbox proof, and final approval are still separate. | Labels must say review/blocked/posture, not approval or launch readiness. |

## Menu / Depth Gaps To Watch

- Staff top nav must not lose source-backed items because a route is unfinished.
- Embedded Admin must not collapse into a generic preview panel; it should keep
  dark DS Admin menu family, Command Center/back affordance, and role posture.
- Disabled Admin modules should stay visible when source-backed, including SOP
  Builder, Task Assignment, UGC / Feed, and MCP Analytics.
- API/MCP/provider verbs should stay visibly blocked instead of disappearing or
  pretending readiness.
- The known top-right alert/account collision remains a demo-quality acceptance
  check, not a redesign request.

## TEST Label Requirements

Visible fake/mock staff/admin content must keep `TEST`, including:

- staff/admin actors,
- chapters and schools,
- portfolio rows and fake metrics,
- proof/UGC cards,
- campaign/SOP examples,
- audit/admin-change actors,
- provider/API placeholders,
- placeholder owners.

Clean labels should stay clean: MEDLIFE, myMEDLIFE, Luma, HubSpot, Hootsuite,
Smile.io, n8n, BigQuery/Databricks, API Keys, MCP Connections, roles, modules,
and menu labels.

## Builder-Ready Slice

**Slice:** After `#521/#522/#528/#530` settle, run a final Staff/Admin
walkthrough contradiction pass.

**Likely files:**

- `src/app/staff/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/review-path/page.tsx`
- `src/app/admin/chapters/page.tsx`
- `src/app/admin/system-health/page.tsx`
- `src/app/admin/audit-log/page.tsx`
- `src/app/admin/integration-outbox/page.tsx`
- `src/app/admin/integrations/luma/page.tsx`
- `src/app/admin/launch-gate/page.tsx`
- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`
- focused staff/admin tests

**Do not touch:**

- `/app`, `/leader`
- owner CSVs, invite gate, rollout packet, live counts, production proof rows
- provider/API live writes or secret actions
- proof approval/publishing/social sync
- user/role/chapter production writes

## Reviewer Acceptance Checks

- Staff top nav and dark Admin menu depth remain visible.
- Embedded Admin has clear return/back posture.
- Chapter drawer and Proof/UGC copy say preview/readback/blocked where needed.
- API/MCP/integration/audit/system-health/launch-gate controls do not imply live
  production operation.
- Visible fake data includes `TEST`.
- No smoke/screenshot/TEST/admin-preview evidence is described as rollout proof.

## Matrix Guidance

May support `Scope/UI` and possibly `QA/Ops` after implementation and focused
tests/smoke. Does not move `Data/Auth`, `Writes/Integrations`, or `Rollout
Gate`.
