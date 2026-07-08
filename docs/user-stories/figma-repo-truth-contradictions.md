# myMEDLIFE Figma vs Repo-Truth Contradictions And Gaps

Date: 2026-07-08  
Owner lane: myMEDLIFE #5, planning/docs only  
Planning reference: MED-512  
Purpose: show where visible Figma/exported UI intent is ahead of repo truth,
where repo truth is stronger than the current visible shell might suggest, and
what that means for builder scope, QA, and rollout claims.

## Sources Inspected

- `docs/figma-code-contract.md`
- `docs/figma-shell-contract-map.md`
- `docs/figma-fidelity-review-login-slt.md`
- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/user-story-gap-report.md`
- `docs/user-stories/delivery-backlog.md`
- `docs/user-stories/latest-main-builder-crosswalk.md`
- `docs/user-stories/builder-ticket-packet.md`
- `docs/user-stories/module-to-shell-acceptance-map.md`
- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `src/app/app/stories/page.tsx`
- `src/app/app/slt-prep/page.tsx`
- `src/app/leader/page.tsx`
- `src/app/staff/page.tsx`
- `src/app/admin/page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- `src/components/figma-member-stories-page.tsx`
- `src/components/figma-leader-command-center.tsx`
- `src/components/figma-leader-stories-screen.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`

## Reading Rules

- Repo truth wins for implementation status.
- Figma/exported code is the UX acceptance contract, not production proof.
- Visible `TEST` rows are required for fake content and do not count as rollout
  evidence.
- Contradiction does not automatically mean bug. Sometimes it means “keep
  visible, but keep blocked.”

## Where Visible UI Intent Is Ahead Of Repo Truth

### 1. Member event loop looks closer to live than the data proof actually is

- Figma/exported intent:
  - member events, event detail, RSVP, check-in, and points read like one
    coherent journey
- Repo truth:
  - the routes are real and reviewable, but RSVP, attendance, and points truth
    are still preview-only or partial
- Coordination meaning:
  - `#1` can keep polishing route/control honesty
  - `#4` can smoke and capture UI evidence
  - no one should claim production RSVP, attendance, or points proof from this
    shell alone

### 2. Stories feels product-rich before governance is product-real

- Figma/exported intent:
  - member and leader Stories surfaces are rich, feed-like, and socially legible
- Repo truth:
  - Stories is source-backed visually, but story governance, consent, storage,
    moderation, publishing, and provider distribution remain blocked
- Coordination meaning:
  - `#1` and `#2` can keep feed fidelity and preview-safe controls
  - do not let reactions, shares, saves, comments, or publishing language sound
    live unless those contracts exist

### 3. DS Admin menus can look more operational than the platform truly is

- Figma/exported intent:
  - DS Admin shows a full backend-style menu family including integrations, API
    keys, MCP, audit, and system health
- Repo truth:
  - the shell and routes are strong, but the verbs remain blocked, masked,
    read-only, or preview-only
- Coordination meaning:
  - `#3` should preserve the menu family instead of hiding it
  - blocked-state clarity matters more than decorative polish
  - no rollout or provider readiness claim should come from menu completeness

### 4. Staff support surfaces imply operations breadth before write approval exists

- Figma/exported intent:
  - campaigns, proof/UGC, best practices, and SOPs look like working staff tools
- Repo truth:
  - these surfaces are mostly preview-only and must not imply publish,
    moderation, outreach, export, or provider send authority
- Coordination meaning:
  - `#3` can keep them route-backed and visible
  - provider/export/moderation verbs should stay explicitly blocked

### 5. SLT Prep is the biggest source-confidence mismatch

- Figma/exported intent:
  - a traveler readiness workflow exists conceptually
- Repo truth:
  - route family exists, but exact local exported UI source confidence is weaker
    than for member, leader, and admin shells
- Coordination meaning:
  - keep `/app/slt-prep` honest and preview-only
  - do not oversell parity
  - if a stronger source bundle arrives later, SLT can be re-scoped as a fuller
    UI lane

## Where Repo Truth Is Stronger Than The Visible Shell Might Suggest

### 1. Tests and blocked-state contracts are stronger than the UI posture alone shows

- The repo has meaningful route/component/e2e coverage around member event
  detail, points readback, leader routing, staff shell, DS Admin review pages,
  and blocked safety posture.
- Coordination meaning:
  - the product is not “just mockups”
  - UI honesty work can move with confidence even when rollout proof is still missing

### 2. Launch gating logic is more explicit than the frontend shells imply

- Readiness and gate services exist and already encode that owner CSVs, signed-in
  proof, live counts, pilot proof, and final approval are still missing.
- Coordination meaning:
  - rollout claims should defer to those services and docs, not to what a demo
    shell feels like

### 3. TEST labeling policy is now a stronger source of truth than many older mock views

- The planning and QA system now treats visible `TEST` markers as a product
  requirement.
- Coordination meaning:
  - a shell that looks polished but drops `TEST` on fake rows is less truthful,
    not more ready

## Highest-Risk Contradictions For Builder Drift

1. Member event and points surfaces reading as live participation proof
2. Stories/feed surfaces reading as live community publishing
3. DS Admin integrations/API/MCP surfaces reading as live operational control
4. Staff campaign/proof/SOP surfaces reading as live workflow execution
5. SLT Prep reading as source-complete when it is still source-confidence-limited

## What Each Contradiction Means By Lane

### `#1` General Member App

- Safe:
  - events/detail/points shell fidelity
  - Stories feed fidelity
  - SLT handoff honesty
- Unsafe:
  - turning preview-safe controls into live-looking writes
  - using Stories or SLT as production-proof evidence

### `#2` Student Leadership

- Safe:
  - event/attendance/leaderboard route honesty
  - support/culture surface parity
- Unsafe:
  - letting create-event, succession, or story verbs read as production-enabled

### `#3` Staff / DS Admin

- Safe:
  - visible admin/staff shell fidelity
  - blocked-state clarity for integrations, keys, MCP, audit, health
  - preview-only staff support surfaces
- Unsafe:
  - anything that sounds like real secret access, provider writes, admin
    mutation, or owner-truth application

### `#4` QA / Release Watch

- Safe:
  - public no-write smoke
  - mobile QA
  - TEST-label checks
  - visual drift notes against exported/Figma contract
- Unsafe:
  - treating screenshots, preview routes, or green smoke as rollout proof

## Best Next Uses Of This Doc

- Use it before assigning a new shell PR when the UI looks more finished than
  the operating truth.
- Use it during review when a builder PR sounds more live than the repo proof
  supports.
- Use it to explain to non-technical stakeholders why a polished screen can
  still be preview-only.

## Matrix Recommendation

This contradictions map is planning/documentation only and should not move
readiness percentages by itself.
