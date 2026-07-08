# myMEDLIFE Member SLT Prep Source Map

Date: 2026-07-07  
Owner lane: myMEDLIFE #5, planning/docs only  
Planning reference: MED-512  
Purpose: clarify how SLT Prep fits the General Student App truthfully, using
repo implementation plus the exported-source map without making SLT look more
live than it is.

## Source Files And Docs Inspected

- `src/app/app/slt-prep/page.tsx`
- `src/app/slt-prep/page.tsx`
- `src/app/slt-prep/checklist/page.tsx`
- `src/app/slt-prep/checklist/[itemId]/page.tsx`
- `src/app/slt-prep/forms/page.tsx`
- `src/app/slt-prep/payments/page.tsx`
- `src/app/slt-prep/meetings/page.tsx`
- `src/app/slt-prep/extensions/page.tsx`
- `src/app/slt-prep/timeline/page.tsx`
- `src/app/slt-prep/notifications/page.tsx`
- `src/app/slt-prep/profile/page.tsx`
- `src/app/app/member-mobile-shell-page.tsx`
- `src/components/slt-prep-primitives.tsx`
- `src/components/slt-prep-subnav.tsx`
- `tests/slt-prep-routes.test.tsx`
- `tests/home-page.test.tsx`
- `tests/figma-missing-route-placeholders.test.tsx`
- `tests/slt-prep-write-safety-contract.test.ts`
- `docs/slt-prep-figma-source-map.md`
- `docs/slt-prep-exported-source-implementation-acceptance.md`
- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/module-to-shell-acceptance-map.md`

## Purpose In Plain English

This packet explains where SLT Prep belongs today: connected to the General
Student App, but still partly its own preview-safe route family. It helps
builders and reviewers avoid two bad outcomes:

- making SLT feel like a fully live travel/payments/forms system
- treating it like a totally separate app with no member-shell relationship

## Current Truth

- `Shell state`: member-shell handoff plus standalone connected route family
- `Data state`: TEST/fixture-driven preview workspace
- `Implementation truth`: partial but source-backed route family exists
- `Launch posture`: blocked/read-only preview, not narrow-launch rollout proof

## Where The Source Places SLT Prep

- `/app/slt-prep` is the member-owned entry and alias inside the General Student
  App shell.
- `/slt-prep/*` is the richer connected route family for the SLT workspace:
  checklist, forms, payments, meetings, extensions, timeline, notifications,
  and profile.
- The member home shell can show an SLT Prep handoff when traveler access is
  available.
- The repo tests explicitly distinguish the member-shell alias from the
  standalone SLT quick-nav experience.

## Plain-English Product Shape

Best current reading:

- SLT Prep belongs inside the General Student App as a route-backed handoff for
  eligible traveler users.
- It also keeps its own connected route family because the SLT workspace is
  deeper than a single member-home card.
- So it is not just a home-card link, and it is not just a separate app. It is
  a connected member experience with a deeper preview-safe route family.

## What Should Stay True In The Member Shell

- the member bottom-nav family remains the primary student navigation contract
- `/app/slt-prep` feels like a student-app destination, not a random redirect
- SLT entry cards and traveler preview content keep visible `TEST` labels
- the member shell does not overclaim travel/payment/provider readiness

## What Data/Auth/Write/Safety Stages Would Be Needed Before SLT Can Honestly Look Live

### Stage 1: source-faithful shell

- route family exists
- member-shell handoff is clear
- visual/source contract is preserved
- fake visible content is `TEST` labeled

### Stage 2: safety contract

- role/eligibility boundaries are explicit
- write paths fail closed
- forms/payments/notifications/provider verbs are blocked by policy, not just
  by vibes
- TEST/Figma/sandbox SLT rows are excluded from production proof

### Stage 3: data/auth truth

- real eligible traveler identity and profile rules
- approved traveler data model
- auditable update authority
- real signed-in production proof for the allowed route family

### Stage 4: write/integration readiness

- approved flows for payments, forms, reminders, meetings, traveler profile
  updates, and any provider-bound actions
- no-write/rollback/audit posture for each risky action

### Stage 5: rollout evidence

- real production data
- real signed-in route proof
- approved operational evidence
- explicit inclusion in rollout scope if the team wants SLT to count toward a
  launch gate

Right now the repo is mostly in Stages 1 and 2 for SLT.

## What Should Remain Fixture-Only For Now

- trip readiness counts driven by fake traveler rows
- payment status
- form completion/submission state
- meetings/reminders as operational truth
- notifications as real send history
- traveler profile mutation
- staff approval state
- provider-branded actions or sync confidence

These can stay visible for shell review, but they should remain TEST-labeled,
preview-safe, and excluded from rollout proof.

## Next Likely Builder Owner

- `#1` General Member App Builder for member-shell SLT handoff fidelity
- later `Data/Safety` lane for deeper SLT write/readiness work

## Suggested Model

- `gpt-5.4` medium for member-shell fidelity work
- `gpt-5.4` medium or mini for safety-contract follow-through

## What Must Not Be Overstated As Production Proof

- traveler readiness
- payment readiness
- forms completion
- meeting attendance truth
- reminder/notification sends
- provider connectivity
- trip registration
- signed-in production proof
- rollout readiness

## Practical Reviewer Checks

- Does `/app/slt-prep` still read like a member-shell destination?
- Do the deeper `/slt-prep/*` routes stay connected and honest?
- Are traveler/trip labels visibly `TEST` when fake?
- Are risky verbs blocked, preview-only, or read-only instead of fake-live?
- Did the PR stay out of leader, staff/admin, rollout, auth, and provider lanes
  unless explicitly approved?

## Matrix Recommendation

This packet is planning-only and should not move readiness percentages by
itself. A clean SLT member-shell implementation PR may support modest
`Scope/UI` and `QA/Ops` movement only, not `Data/Auth`,
`Writes/Integrations`, or `Rollout Gate`.
