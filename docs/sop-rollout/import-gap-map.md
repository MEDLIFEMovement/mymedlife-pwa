# myMEDLIFE SOP Rollout Import Gap Map

Status: Run A gap map created from the local rollout package and current repo
state.

Updated: 2026-06-23

## Purpose

This document records the gap between:

- what the `Full SOP Rollout Codex` package requires
- what the current myMEDLIFE repo already contains
- what still needs to happen before full structured SOP imports can begin

This is a mapping artifact only. It does not change app behavior.

## Run-A Outcome

Run A from the rollout package required:

1. confirm campaign list and page ranges
2. confirm coach + chapter/platform pairings
3. confirm where each campaign belongs in myMEDLIFE
4. create `docs/sop-rollout/source-map.md`
5. create `docs/sop-rollout/import-gap-map.md`
6. identify unclear mappings, missing data, and conflicting terms
7. avoid app-behavior changes

Items 1-6 are now represented in the repo through:

- `docs/sop-rollout/source-map.md`
- this file

## What The Repo Already Has

### 1. Route-backed campaign surfaces already exist

The repo already has visible product routes for the required campaign families:

- `rush-month` via dedicated member route family
- `planning-goal-setting` via `/campaigns/planning-goal-setting`
- `chapter-engagement` via `/campaigns/chapter-engagement`
- `slt-promotion` via `/campaigns/slt-promotion` plus `/slt-prep/*`
- `moving-mountains` via `/campaigns/moving-mountains`
- `leadership-transition` via `/campaigns/leadership-transition`

### 2. An admin SOP library and builder already exist

The repo already includes:

- `/admin/sop-library`
- `/admin/sop-builder/[campaignSlug]`
- route-backed tabs for:
  - steps
  - role matrix
  - completion
  - points / KPI
  - comms
  - preview
  - version

This is enough to avoid a greenfield admin workflow editor rewrite.

### 3. A strong Figma route inventory already exists

The repo already has:

- `docs/architecture/figma-route-and-surface-map.md`
- `docs/architecture/figma-clickthrough-screen-inventory.md`
- `docs/architecture/figma-implementation-matrix.md`

That means the surface-placement side of the package is not starting from
scratch.

### 4. Mock-safe integration posture already exists

The repo already models:

- audit posture
- integration/outbox review lanes
- blocked external writes
- role-aware admin safety surfaces

This aligns well with the package rule that myMEDLIFE owns workflow state while
external systems consume approved outbox events later.

## What The Repo Does Not Yet Have

### 1. The rollout-package source map did not exist

Before this pass, the repo had SOP builder scaffolding but no explicit local
Run-A artifact showing:

- the six required campaign pairings
- the PDF page ranges
- the myMEDLIFE placement map
- the package-vs-repo open questions

### 2. The permissions matrix is still missing locally

The package repeatedly says the permissions matrix is the authorization source
of truth, but the matrix itself is not present in this local rollout package.

Practical impact:

- canonical workflow-operation permissions cannot be finalized yet
- DS/Admin publish rules cannot be fully reconciled
- role/action restrictions in the workflow model remain provisional

### 3. The current SOP builder schema is still review-first

The current builder already models:

- steps
- role rules
- completion/evidence/approval rules
- points/KPI rules
- communication rules
- preview scenarios
- audit records
- integration boundaries

But the rollout package requires additional structured objects that are not yet
first-class in the current repo model:

- `CampaignTemplate`
- `CampaignVersion`
- `CampaignPhase`
- `IntegrationTriggerRule`
- `RiskRule`
- `EscalationRule`
- `CloseoutRequirement`
- `ScriptTemplate`
- `ResourceLink`

The builder tabs exist, but the import model is not yet complete enough to say
that every SOP can be imported as structured draft data.

### 4. No campaign is yet imported from the PDF as a structured draft

The current repo includes hand-authored mock campaign definitions and campaign
panels. It does not yet prove a repeatable PDF-to-template import path that
creates:

- draft imported status
- review summary
- source certainty
- unresolved ambiguity notes
- role/phase/validator/risk extraction directly from source

### 5. Draft/live import status language is not aligned yet

The package requires import statuses:

- `draft_imported`
- `draft_reviewed`
- `live`
- `scheduled`
- `archived`

The current repo instead centers statuses such as:

- builder posture
- library status
- review-ready / mock-safe copy

These are useful, but they are not yet the same contract as the rollout package.

### 6. Closeout, scripts, and resource-link modeling is missing

The package explicitly calls for structured handling of:

- key outputs / closeout requirements
- scripts/templates
- resource links

The current repo mostly treats those areas as prose or broader campaign notes.

### 7. GiveLively is under-modeled

The package names GiveLively as a first-class system for:

- SLT fundraising readiness
- Moving Mountains
- approved fundraising progress visibility

Current repo emphasis is stronger for:

- HubSpot
- Luma
- Shopify
- n8n
- warehouse / Power BI

GiveLively needs explicit treatment in the next structured import model.

## Confirmed Sequencing Decision

There is one important sequencing conflict between the current goal posture and
the newly available rollout package:

### Current repo intuition

Rush Month is the strongest existing runtime surface and therefore the easiest
product-facing workflow proving path.

### Rollout package requirement

The lettered rollout order says:

- Run D = first full structured import should be **Chapter Organization,
  Planning & Goal Setting**
- Run E = **Rush Month** full structured import comes immediately after

### Resolved direction

Treat these as two different proving paths:

1. **Planning / Goal Setting** should be the first canonical full PDF import
   because that is what the rollout package specifies, and that ordering has now
   been confirmed.
2. **Rush Month** can still be the first runtime/UI proving surface for reading
   structured workflow data, because it already has the richest role-aware route
   family in the repo.

That keeps the package order intact without throwing away the repo’s strongest
existing workflow surface.

## Recommended Next Runs

### Run B — template data model

Next implementation should add typed support for the missing import-model
objects without publishing anything live:

- phase records
- integration trigger rules
- risk / escalation rules
- closeout requirements
- script templates
- resource links
- draft import status
- review-summary metadata

### Run C — SOP import / review surface

After the data model lands, the admin backend should gain:

- draft imported library state
- import warnings
- source certainty markers
- review summaries
- explicit unresolved ambiguity notes

### Run D — first full structured import

First full PDF-backed import should be:

- Chapter Organization, Planning & Goal Setting

### Run E — Rush Month full import

After Run D, Rush Month should become the strongest end-to-end structured
campaign import tying together:

- student actions
- leader operations
- coach validation
- event triggers
- HubSpot/Luma placeholders
- points/KPI events
- outbox-safe integration hooks

## Open Questions

1. Where is the authoritative permissions matrix file or link that the package
   references?
2. `grow-the-movement` and `start-a-chapter` should remain visible in the repo
   as adjacent non-package campaigns, but they should stay explicitly labeled as
   repo-defined structured drafts rather than being silently blended into the
   six MED International SOP imports.
3. Should GiveLively be modeled immediately in the structured template schema,
   or added in the campaign-specific import runs that actually require it?
4. Does the team want a repo-local import-review summary artifact per campaign
   under `docs/sop-rollout/reviews/`, or should those summaries live only in the
   admin UI and issue tracker once Run C starts?
