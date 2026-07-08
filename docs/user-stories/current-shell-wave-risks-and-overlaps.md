# Current Shell Wave Risks And Overlaps

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: identify the current overlap risks across the open shell wave so
Coordinator can choose refresh, merge, or send-back actions without rereading
the whole story package.

## Current Overlap Map

| Lane | Current PRs | Main overlap risk | Recommended guardrail |
| --- | --- | --- | --- |
| `#1` Member | `#518`, `#523` | Member profile/bottom-nav and SLT shell continuity can collide if both touch shared member shell files. | Prefer #518 before #523 unless #1 confirms file separation. Hold new member continuity work until both settle. |
| `#2` Leader | `#524` plus merged `#512` base | Older leaderboard-first steering could distract from leader review-loop and `/leader?view=*` continuity. | Use #512 as base; finish #524 before launching a new leader support/culture slice. |
| `#3` Staff/Admin | `#516`, `#519`, `#521`, `#522` plus merged `#503/#515` | Admin label/copy work can collide with embedded Admin and Proof/UGC chapter follow-through if merged out of order. | Prefer #516 -> #519 -> #521 -> #522 unless #3 confirms no shared files/copy. |
| `#4` Watch | current PR board | Treating behind-only or rerunning PRs as product blockers, or treating smoke/screenshots as rollout proof. | Separate merge hygiene from product failure; classify evidence category explicitly. |
| `#5` Planning | `#520` | Letting docs-only #520 block product-code repairs, or letting stale docs steer the next wave. | Refresh/merge #520 when convenient; do not let docs outrank red product checks. |

## Highest-Risk Drift Patterns

1. **Member UI looks launch-ready, but participation is still preview-only.**
   RSVP, QR/check-in, attendance, and points award authority still need real
   data/write/proof boundaries before launch claims.
2. **Leader command center looks service-backed, but leader writes remain
   blocked.** Succession, member updates, role changes, training assignment,
   contact, attendance, and points actions should not become fake-live.
3. **Staff/Admin demo looks operational, but proof/admin/provider operations are
   still blocked.** Proof/UGC moderation, embedded Admin review, launch-gate,
   API, MCP, integration, audit, user, role, and chapter operations must stay
   read-only/preview-safe.
4. **Launch-gate labels can accidentally sound like launch readiness.** Any
   launch-gate review copy must stay explicit that owner data, live counts,
   signed-in proof, pilot proof, and final approval are still separate.
5. **TEST content can become visually polished and therefore misleading.**
   Every visible sandbox/Figma/mock person, chapter, event, story/proof item,
   campaign, sample admin actor, placeholder owner, provider example, and fake
   metric must keep `TEST` until replaced with approved real data or hidden.

## Same-File / Same-Surface Risks

| Risk | Why it matters | Coordinator action |
| --- | --- | --- |
| `#518` vs `#523` | Member profile/bottom-nav and SLT shell continuity may touch shared member shell route families. | Merge/refresh #518 first unless #1 confirms no same-file overlap. |
| `#518/#523` vs future #1 member continuity PR | Same member shell, profile, bottom-nav, `/app`, or `/app/slt-prep` route family can collide. | Wait for both or assign only planning/QA. |
| `#524` vs future #2 leader support/culture PR | Same leader review-loop, member/profile, succession, values, or training surfaces can collide. | Wait for #524 to go green/merge before new leader code. |
| `#516` vs `#519` | Both are admin review/launch-gate label work. | Merge #516 first if both are ready; then refresh #519. |
| `#519` vs `#521` | Embedded Admin review posture may reference launch-gate or review labels. | If shared copy/files appear, settle #519 first. |
| `#521` vs `#522` | Embedded Admin review posture and Proof/UGC chapter follow-through may share review copy and chapter context. | Prefer #521 before #522 unless #3 confirms independence. |
| `#521/#522` vs future #3 Proof/UGC follow-up | Same staff/admin review posture, chapter loop, and embedded Admin route family can collide. | Do not launch the next staff/admin slice until both land or are explicitly paused. |
| `#520` vs future planning docs | Story package refresh is docs-only but can make later planning branches behind. | Merge/refresh #520 before opening another broad story docs PR when possible. |

## What Counts As Real Progress

- A shell PR that restores source-backed routes, menu items, visible controls,
  and blocked/read-only states can count as `Scope/UI` progress.
- Focused tests, green checks, browser smoke, or visual QA can count as
  `QA/Ops` evidence when tied to the changed route family.
- A docs PR can improve coordination clarity, but it does not move readiness
  percentages by itself.

## What Is Fake Polish

- Making a blocked control look active without a safe write path.
- Removing `TEST` from fake content without approved real replacement data.
- Using launch-gate, admin, provider, proof, or points language that implies
  live operations.
- Treating screenshots, public no-write smoke, preview data, or route labels as
  production proof.
- Expanding a shell PR into auth, rollout, provider, owner CSV, or live-count
  work without explicit Coordinator reassignment.

## Access Boundary

No new production, provider, Supabase, owner CSV, or rollout-packet access is
needed for the current shell wave.

Access is only needed later for:

- real owner-returned data,
- production signed-in role proof,
- live counts,
- pilot event proof,
- audit/outbox zero-send proof,
- approved read-only provider export comparisons.

Until then, all shell work should stay source-backed, TEST-labeled, and
preview-safe.
