# myMEDLIFE Narrow Launch Delivery Backlog

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Planning base: `origin/main` commit `8a2a7f4` (`Add active builder lane truth
refresh (#548)`)

Purpose: compact, execution-ready backlog for the next narrow-launch build wave.
This document translates the repo-truth story package into PR-sized slices while
keeping shell/UI progress, QA progress, data/write readiness, and rollout proof
separate.

Event-loop companion packet:

- `docs/user-stories/narrow-launch-event-loop-truth.md`
- `docs/user-stories/narrow-launch-event-loop-gap-sequence.md`

## Current PR Context

Coordinator's fresh live truth for this refresh:

- `#548` is merged; this backlog starts from the active builder truth refresh.
- Member queue: `#523` is rerunning, with `#536` rerunning behind it.
- Leader queue: `#545` is clean behind-only, and `#547` is Codecov-only red.
- Staff/Admin queue: `#522` is clean, with `#521`, `#534`, and `#538` fully
  green and behind-only, plus the broader continuity PR `#550`.

Those PRs are active coordination context, not implementation truth until they
land on `main`.

## Truth Rules

- Repo truth wins for implementation status.
- Figma/exported code shapes source-fidelity expectations but does not prove
  production wiring.
- Visible fake people, chapters, events, stories, proof rows, campaigns, SOPs,
  audit actors, placeholder owners, providers, and fake metrics must keep
  `TEST` visible until replaced by approved real data or hidden.
- Public no-write smoke, screenshots, local actors, TEST rows, sandbox rows,
  and Figma data never count as rollout proof.
- Planning docs do not move readiness percentages by themselves.

## Matrix Column Legend

- `Scope/UI`: source-backed shell fidelity, route continuity, visible-control
  honesty, and TEST-label compliance.
- `Data/Auth`: role, privacy, readback, signed-in readiness, or server-boundary
  safety contracts.
- `Writes/Integrations`: fail-closed write/provider/outbox contracts or
  explicitly approved live-write enablement.
- `QA/Ops`: focused tests, browser smoke, visual QA, mobile QA, and release
  watch evidence.
- `Rollout Gate`: owner-approved data, live counts, production signed-in proof,
  pilot proof, audit/outbox zero-send proof, and final approval.

## Compact Backlog Table

| ID | Owner | Suggested model | Module | Status now | Next slice | Can move | Must not move / boundaries |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DB-001 | `#1` | `gpt-5.4` medium/high | Member events -> points | preview-only / partial | After `#523/#536` settle, return to `/app/events` -> detail -> RSVP/check-in posture -> `/app/points` continuity if the member lane is free. | `Scope/UI`, `QA/Ops` if tested/smoked | No real RSVP, check-in, attendance, points ledger, Luma write, or rollout proof. |
| DB-002 | `#1` | `gpt-5.4` medium | Member SLT / profile continuity | active queue | Let `#523` clear before another overlapping member-shell slice; keep SLT/profile shell continuity source-backed and preview-safe. | `Scope/UI`, `QA/Ops` | No profile/contact/emergency/traveler writes, SLT trip registration, payment/provider writes, or signed-in proof claims. |
| DB-003 | `#1` | `gpt-5.4` medium | Member Stories | active queue / preview-only | Let `#536` clear, then use `member-stories-ig-feed-acceptance-map.md` only for remaining IG-style feed/detail fidelity gaps. | `Scope/UI`, `QA/Ops` | No publishing, consent approval, comments, shares, provider sync, or production proof. |
| DB-004 | `#1` | `gpt-5.4` medium | Member mobile QA | needs QA evidence | Mobile browser review for member events/detail/points/home/profile continuity. | `QA/Ops` | Screenshots do not prove Data/Auth, Writes/Integrations, or Rollout Gate. |
| DB-005 | `#2` | `gpt-5.4` high | Leader shell/menu | active queue | Keep `/leader?view=*` route/menu continuity as the base; `#545` and `#547` should finish training/event review continuity before new overlapping leader slices. | `Scope/UI`, `QA/Ops` | No member/staff/admin files, role changes, event writes, attendance imports, or production proof. |
| DB-006 | `#2` | `gpt-5.4` medium/high | Leader succession/support | partial / preview-only | After `#545/#547`, verify succession, values, leadership training, member/profile handoffs, and event review remain route-backed and preview-safe. | `Scope/UI`, `QA/Ops` | No succession writes, promotion, assignment, contact sends, or proof claims. |
| DB-007 | `#2` | `gpt-5.4` medium | Leader events/attendance | partial / preview-only | Event-adjacent follow-through: attendance, committee ownership, and follow-up controls read as preview/read-only. Prioritize only after the current leader review branches settle. | `Scope/UI`, `QA/Ops` | No Luma sync, event creation writes, attendance imports, notifications, or points awards. |
| DB-008 | `#2` | `gpt-5.4-mini` medium | Leader visual QA support | needs review | Produce reviewer notes for `/leader?view=*` continuity after the `#545/#547` wave settles. | `QA/Ops` | QA notes do not move rollout proof. |
| DB-009 | `#3` | `gpt-5.4` high | Staff chapter drawer / embedded Admin | partial / preview-only | Use `#521` and the embedded-admin return-loop map for chapter drawer -> embedded Admin -> Chapters loop coherence. | `Scope/UI`, `QA/Ops` | No rollout packet ownership, owner CSV apply, invites, provider writes, or admin mutations. |
| DB-010 | `#3` | `gpt-5.4` medium/high | Staff Proof / UGC | active queue / preview-only | Let `#522` land first; then review queue next-step clarity and Proof/UGC handoff copy can continue if source drift remains. | `Scope/UI`, `QA/Ops` | No proof ingestion, consent approval, publish, social/provider sync, or production evidence claims. |
| DB-011 | `#3` | `gpt-5.4` medium | Staff/Admin walkthrough | partial | Renato-facing staff/admin walkthrough continuity: staff top nav, embedded dark Admin, back affordance, admin menu family. | `Scope/UI`, `QA/Ops` | No live admin/provider writes, secrets, user/role/chapter mutations, or launch gate advancement. |
| DB-012 | `#3` | `gpt-5.4` medium | Admin integrations/API/MCP | preview-only | Keep provider/API/MCP verbs masked, blocked, or preview-only with TEST sample content. | `Scope/UI`, `QA/Ops` | No API key reveal/copy/rotate/revoke, MCP connect, provider test/send, or production readiness claims. |
| DB-013 | `#4` | `gpt-5.3-codex-spark` or `gpt-5.4-mini` | PR board watch | ongoing | Watch `#523/#536`, `#545/#547`, and `#522/#521/#534/#538/#550`; call out behind-only vs failing vs blocked without treating draft branches as merged truth. | `QA/Ops` only when tied to checks | No implementation, matrix edits, rollout proof claims, or provider access. |
| DB-014 | `#4` | `gpt-5.4-mini` | Three-shell visual QA | needs current pass | Verify TEST labels, no silent controls, and shell-specific source fidelity after each shell PR. | `QA/Ops` | QA screenshots alone do not prove production readiness. |
| DB-015 | `#5` | `gpt-5.5` medium | Story/backlog truth | this lane | Refresh story package, delivery backlog, and stale-steering notes after each merge wave. | none from docs alone | No product code, no matrix edits, no rollout proof capture. |
| DB-016 | Data/Safety | `gpt-5.5` medium | Production signed-in proof readiness | partial / staged | Confirm tooling separates real production accounts from preview cookies/TEST actors. | `Data/Auth`, `QA/Ops` if tested | No production account creation or proof rows without approval. |
| DB-017 | Data/Safety | `gpt-5.5` medium | RSVP/check-in/attendance/points authority | preview-only | Fail-closed contract for RSVP, QR/check-in, attendance, points prerequisites, audit, and duplicate protection. | `Data/Auth`, maybe `Writes/Integrations` only if contract-backed | No browser-facing live writes or pilot proof movement. |
| DB-018 | Data/Safety | `gpt-5.5` medium | Proof/UGC consent/storage | preview-only | Consent, storage, moderation, identity, and publish boundaries. | `Data/Auth` | No proof upload, consent approval, story publish, provider sync, or rollout evidence. |
| DB-019 | Rollout Evidence | human/Coordinator-led | Owner data | blocked | Owner CSV return monitor and validation. | `Rollout Gate` only when real data arrives | TEST/Figma/sandbox rows cannot populate packet, counts, invite gate, or proof. |
| DB-020 | Rollout Evidence | human/Coordinator-led | Production proof | blocked | Live counts, signed-in proof by role, pilot proof, audit/outbox zero-send, final approval. | `Rollout Gate` | No planning doc, smoke pass, screenshot, or UI merge opens launch gate. |

## Access Boundary

Work that does **not** need production/provider access now:

- Shell/source-fidelity slices for `#1`, `#2`, and `#3`.
- TEST-label cleanup and visual QA.
- Public no-write smoke and PR-board classification.
- Planning/story/backlog updates.
- Local-only or contract-only safety tests that do not touch production.

Work that eventually needs real access or returned data:

- Owner-returned CSV validation and production rollout packet assembly.
- Production Supabase/myMEDLIFE live counts.
- Production signed-in proof using real approved accounts and roles.
- Pilot event proof tying RSVP, attendance, points, audit, and zero-send.
- HubSpot/Luma/static export comparison only if Coordinator/Nick approves the
  access request and it is used as read-only context.

## Immediate Use

If the current queue settles cleanly, the next strongest shell queue is:

1. `#1 DB-001`: member event/detail/RSVP-check-in/points continuity after
   `#523/#536` clear.
2. `#2 DB-006`: leader succession/support/member-profile/event review
   continuity after `#545/#547` clear.
3. `#3 DB-010`: staff Proof/UGC review-queue next-step clarity after `#522`
   clears, with embedded Admin return loops from `#521` preserved.
4. `#4 DB-013`: PR-board watch and evidence classification for the active wave.

If only one builder can move first, prioritize `#1 DB-001`; it is the clearest
narrow-launch user path and connects directly to the rollout-critical event and
points proof that still cannot be claimed from UI alone.

Use the event-loop companion packet before assigning DB-001, DB-007, DB-017, or
DB-020 so the builder and reviewer do not confuse route-backed preview, local
readback tests, staging proof, production signed-in proof, and rollout-gate
proof.

## Matrix Recommendation

This backlog is planning-only. It should not move percentages by itself.
