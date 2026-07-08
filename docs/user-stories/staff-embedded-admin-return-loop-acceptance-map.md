# Staff Embedded Admin Return Loop Acceptance Map

Date: 2026-07-08  
Owner lane: `#3` Staff / DS Admin Command Center Builder  
Planning status: docs/spec only; no product code changed here.

## Purpose

Give `#3`, `#4`, and Coordinator a narrow acceptance target for the next
Staff/Admin continuity slice after the current staff/admin wave. The reported
staff topbar overlap is no longer the main missing slice on current main. The
next visible pressure is return-loop coherence:

- chapter drawer -> embedded Admin -> Chapters
- Proof / UGC -> embedded Admin -> Proof / UGC / chapter context

This packet should help `#3` tighten those loops without making embedded Admin
look like live admin write authority.

## Sources Inspected

Repo implementation truth:

- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`
- `tests/staff-page.test.tsx`
- `tests/staff-command-center.test.ts`
- `tests/figma-missing-route-placeholders.test.tsx`
- `tests/e2e/launch-smoke.spec.ts`
- `docs/user-stories/staff-admin-shell-acceptance-packet.md`
- `docs/user-stories/staff-admin-review-queue-acceptance-packet.md`
- `docs/user-stories/staff-admin-acceptance-contradictions-map.md`
- `docs/user-stories/staff-admin-next-slice-brief.md`

Exported/source acceptance-shape signal:

- source-backed Staff Command Center top nav and embedded Admin shell in
  `figma-staff-command-center`
- dark DS Admin shell/menu in `figma-admin-panel`
- screenshots and reported demo issues as acceptance checks only, not redesign
  permission

## Current Repo Truth

- `/staff` owns the Staff Command Center shell and embedded Admin handoff.
- `figma-staff-command-center` recognizes Staff views including `chapters`,
  `campaigns`, `events`, `ugc`, `admin`, `best-practices`, and `sops`.
- Staff Proof / UGC route aliases are normalized to `view=proof_ugc`.
- The chapter drawer includes an Admin preview handoff:
  `/staff?view=admin&adminView=chapters&returnView=chapters&chapter=<id>`.
- Proof / UGC includes an Admin audit handoff:
  `/staff?view=admin&adminView=audit&returnView=proof_ugc`.
- Embedded Admin return labels distinguish `Proof / UGC`, `this chapter`, and
  `chapters`.
- `figma-admin-panel` uses embedded review copy for chapter and proof review
  handoffs.
- Tests already assert key return-loop markers including `Return to chapters`,
  `Return to Proof / UGC`, `Embedded Chapter Review`, and `Embedded Proof
  Review`.
- None of this proves proof ingestion, moderation approval, provider sync, live
  admin writes, user/role/chapter mutation, audit mutation, owner data, or
  rollout readiness.

## Source-Backed Return Loop Contract

The Staff/Admin shell should preserve:

- Staff top nav and route family inside `/staff`
- dark embedded Admin shell when Admin preview opens
- visible `Command Center` back affordance
- return labels that match the route the reviewer came from
- chapter context when the handoff began from a chapter drawer
- Proof / UGC context when the handoff began from proof review
- visible blocked/read-only posture for all Admin controls
- `TEST` labels on fake staff/admin actors, chapters, proof/UGC examples,
  placeholder owners, fake audit rows, and sample metrics

## Chapter Drawer -> Admin -> Chapters Expectations

Source-faithful:

- chapter drawer keeps the selected chapter visible before the Admin handoff
- Admin handoff URL carries `returnView=chapters` and `chapter=<id>`
- embedded Admin copy says chapter review, not generic admin
- back affordance says `Return to this chapter` when a chapter id is present
- return action restores the chapter drawer context, not only a generic
  chapters overview, when route state supports it

Merely workable:

- returning to the Chapters overview is acceptable only when no chapter id is
  present or the route cannot resolve the selected chapter
- copy may say `Return to chapters` for broad review, but not when the UI has
  enough context to say `Return to this chapter`

Not acceptable:

- chapter context disappears after the Admin preview even though the URL carried
  the chapter id
- Admin copy reads like live DS/Admin operations rather than embedded review
- the handoff grants live chapter writes, owner edits, notes, survey sends, or
  intervention writes

## Proof / UGC -> Admin -> Review Context Expectations

Source-faithful:

- Proof / UGC queue keeps review cards and consent/posture visible
- Admin audit handoff URL carries `returnView=proof_ugc`
- embedded Admin copy says proof review, not generic admin
- back affordance says `Return to Proof / UGC`
- proof/story/chapter context remains visible enough that the reviewer knows
  which moderation lane they came from

Merely workable:

- returning to the main Proof / UGC queue is acceptable when no proof/story id is
  available
- proof-specific return context can be staged if route state does not currently
  carry a proof id, but copy should not pretend it did

Not acceptable:

- proof review context becomes a generic Admin screen with no return cue
- copy implies a proof was approved, published, shared, uploaded, synced, or
  counted as rollout evidence
- social/provider controls become fake-live

## Smallest Useful #3 Slice

Smallest acceptable implementation scope:

- Tighten route/copy/back-label continuity for chapter drawer -> embedded Admin
  -> chapter/chapter list.
- Tighten route/copy/back-label continuity for Proof / UGC -> embedded Admin ->
  Proof / UGC.
- Preserve Staff top nav and dark Admin menu fidelity.
- Add or update focused tests for return labels and blocked-state copy if repo
  behavior changes.

Likely files in scope:

- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`
- `tests/staff-page.test.tsx`
- `tests/staff-command-center.test.ts`
- `tests/figma-missing-route-placeholders.test.tsx`

Files and lanes out of scope:

- `/app` member shell files
- `/leader` shell files
- auth/session/RLS helpers
- provider services, proof upload services, moderation writes, admin actions
- rollout packets, owner CSVs, production signed-in proof, live counts

## Acceptance Checklist

Reviewer acceptance for `#3`:

- `/staff?view=chapters&chapter=<id>` keeps chapter detail/drawer context
  visible and preview-safe.
- The chapter drawer Admin handoff opens
  `/staff?view=admin&adminView=chapters&returnView=chapters&chapter=<id>`.
- Embedded Admin shows chapter-review copy and a return label that matches the
  chapter context.
- Returning from Admin restores the chapter drawer when the route carried a
  chapter id, or the Chapters overview when no chapter id exists.
- `/staff?view=proof_ugc` keeps the Proof / UGC queue route-backed.
- Proof / UGC Admin handoff opens
  `/staff?view=admin&adminView=audit&returnView=proof_ugc`.
- Embedded Admin shows proof-review copy and `Return to Proof / UGC`.
- Staff top nav remains visible and source-backed.
- Dark Admin menu families remain visible where source-backed.
- Visible fake staff/admin actors, chapters, proof/UGC samples, placeholder
  owners, fake audit rows, and fake metrics remain `TEST` labeled.
- Product/provider/menu labels stay clean: `MEDLIFE`, `myMEDLIFE`, `Proof /
  UGC`, `Admin`, `DS Admin`, `Super Admin`, `HubSpot`, `Luma`, `Hootsuite`,
  `Smile.io`, `n8n`, `BigQuery`, `Databricks`, and menu labels are not prefixed
  with `TEST`.

## What Must Stay Preview-Safe Or Blocked

- chapter writes, owner changes, intervention status writes, survey sends
- coach-note saves or follow-up task writes
- proof ingestion, consent approval, moderation approval, publishing, sharing,
  upload, or social/provider sync
- Admin user/role/chapter writes
- API key rotation, MCP execution, integration writes, audit mutation, system
  health repair actions
- owner CSVs, rollout packets, live counts, invite-gate approval, or production
  proof

## What Counts As Real Progress

Real progress from this slice:

- Staff/Admin `Scope/UI` progress if the embedded Admin return loops become
  clearer, source-backed, and reversible.
- Possible `QA/Ops` progress if focused tests or browser review cover the
  chapter and Proof / UGC return loops.
- Better demo confidence that Staff/Admin is one walkthrough, not disconnected
  preview panels.

Not progress from this slice:

- Data/Auth readiness
- Writes/Integrations readiness
- production proof
- provider readiness
- rollout readiness

## Reviewer Checks

Suggested `#4` or Coordinator review:

- Open `/staff?view=chapters&chapter=chapter-test`.
- Click or inspect the Admin preview handoff and confirm the URL includes
  `returnView=chapters` and `chapter=chapter-test`.
- Confirm embedded Admin uses chapter-review copy and a chapter-aware return
  label.
- Return and confirm chapter context is restored or explicitly falls back to
  Chapters when no chapter id exists.
- Open `/staff?view=proof_ugc`.
- Click or inspect the Admin audit handoff and confirm the URL includes
  `returnView=proof_ugc`.
- Confirm embedded Admin uses proof-review copy and `Return to Proof / UGC`.
- Confirm no copy says a proof, chapter, owner, note, provider, audit, or admin
  write actually happened.
- Confirm visible fake rows retain `TEST`.

## Matrix Guidance

Planning alone moves nothing.

If implemented and tested cleanly, this can support modest Staff/Admin
`Scope/UI` and possibly `QA/Ops` movement. It must not move Data/Auth,
Writes/Integrations, production proof, provider readiness, or Rollout Gate.
