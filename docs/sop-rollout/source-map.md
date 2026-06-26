# myMEDLIFE SOP Rollout Source Map

Status: Run A source map created from the local `Full SOP Rollout Codex`
package, the bundled MED International SOP PDF, the existing Figma route/surface
docs, and the current repo state.

Updated: 2026-06-24

## Sources Used

Priority order used for this map:

1. `00_START_HERE_CODEX_FULL_SOP_ROLLOUT.md`
2. `01_MASTER_FULL_SOP_ROLLOUT_PLAN.md`
3. `02_SOP_CAMPAIGN_CATALOG_AND_PAGE_MAP.md`
4. `03_MYMEDLIFE_PLACEMENT_MAP.md`
5. `04_PLATFORM_TRIGGERS_AND_INTEGRATIONS.md`
6. `05_SOP_IMPORT_AND_DATA_MODEL_RULES.md`
7. `06_PHASED_CODEX_GOALS_FOR_ALL_SOPS.md`
8. `07_ACCEPTANCE_TEST_PLAN.md`
9. `08_VISUAL_IMPLEMENTATION_RULE.md`
10. `data/campaign_catalog.json`
11. `data/integration_event_types.json`
12. `data/mymedlife_area_location_map.csv`
13. `attachments/MED International SOPs Jun 2026.pdf`
14. Current repo and route inventory:
    - `docs/architecture/figma-route-and-surface-map.md`
    - `docs/architecture/figma-clickthrough-screen-inventory.md`
    - `src/data/mock-campaigns.ts`
    - `src/data/mock-sop-builder.ts`
    - `src/services/sop-library-workspace.ts`

## Package-Level Rules Confirmed

- The full rollout is phased and should not be implemented all at once.
- The permissions matrix remains the authorization source of truth.
- Figma is both workflow map and visual reference.
- The MED International SOP PDF is the operating-logic source for phases, steps,
  owners, validators, risks, systems, outputs, and KPI logic.
- myMEDLIFE owns workflow state, assignments, evidence, approvals, points,
  KPIs, audit logs, integration events, and automation outbox records.
- External systems remain specialized executors:
  - HubSpot for CRM and lifecycle communications
  - Luma for event registration and attendance
  - Shopify for SLT payment state
  - GiveLively for fundraising where used
  - n8n as worker/orchestrator, never source of truth

## Confirmed Campaign Inventory

The local PDF and campaign catalog both confirm six required SOP campaign pairs
(Coach perspective + chapter/platform perspective):

| Campaign | Coach PDF | Chapter/platform PDF | Workflow | Period | Major phases |
| --- | --- | --- | --- | --- | --- |
| Chapter Organization, Planning & Goal Setting | 1-32 | 184-213 | Chapter Annual Planning Workflow / Chapter Operational Launch System | July-September | GSW Preparation; Systems Setup & Officer Training Validation; Campaign Planning Review & Action Committee Validation; GSW Execution; Launch Readiness |
| Rush Month / Recruitment & Campus Awareness | 33-59 | 214-240 | Chapter Recruitment Workflow | August-September | Campus Visibility; Lead Capture & Engagement; Member Conversion |
| Chapter Engagement / Bi-Weekly Management | 122-151 | 295-322 | Chapter Performance Management / Culture, Retention & Leadership Development Workflow | Ongoing after Rush Month | Performance Monitoring; Performance Coaching; Performance Optimization |
| SLT Promotion & Recruitment | 60-92 | 241-266 | Traveler Conversion Workflow | September-December / January-March | Trip Foundation & Launch Validation; SLT Awareness; Traveler Engagement; Traveler Conversion; Post-Conversion Monitoring |
| Moving Mountains | 93-121 | 267-294 | Chapter Fundraising Activation Workflow | November-December | Campaign Planning; Campaign Activation; Fundraising Execution |
| Leadership Transition | 152-183 | 323-343 | Chapter Leadership Continuity Workflow | January-April plus summer planning handoff | Successor Identification; Knowledge Transfer; New E-Board Activation; Summer Planning Launch |

PDF spot-checks against the local file confirm the page boundaries above:

- page 1 starts the Coach Planning / Goal Setting SOP
- page 33 starts the Coach Rush Month SOP
- page 60 starts the Coach SLT Promotion SOP
- page 93 starts the Coach Moving Mountains SOP
- page 122 starts the Coach Chapter Engagement SOP
- page 152 starts the Coach Leadership Transition SOP
- page 184 starts the chapter/platform Planning / Goal Setting SOP
- page 214 starts the chapter/platform Rush Month SOP
- page 241 starts the chapter/platform SLT Promotion SOP
- page 267 starts the chapter/platform Moving Mountains SOP
- page 295 starts the chapter/platform Chapter Engagement SOP
- page 323 starts the chapter/platform Leadership Transition SOP

## Current Repo Coverage Against Required Campaigns

Current repo state already includes route-backed campaign shells or builder
entries for all six required campaigns:

| Required campaign | Current repo slug | Current visible repo location |
| --- | --- | --- |
| Chapter Organization, Planning & Goal Setting | `planning-goal-setting` | `/campaigns/planning-goal-setting`, `/admin/sop-library`, `/admin/sop-builder/planning-goal-setting` |
| Rush Month / Recruitment & Campus Awareness | `rush-month` | Dedicated member route family under `/rush-month/*`, plus `/admin/sop-library`, `/admin/sop-builder/rush-month` |
| Chapter Engagement / Bi-Weekly Management | `chapter-engagement` | `/campaigns/chapter-engagement`, `/admin/sop-library`, `/admin/sop-builder/chapter-engagement` |
| SLT Promotion & Recruitment | `slt-promotion` | `/campaigns/slt-promotion`, `/slt-prep/*`, `/admin/sop-library`, `/admin/sop-builder/slt-promotion` |
| Moving Mountains | `moving-mountains` | `/campaigns/moving-mountains`, `/admin/sop-library`, `/admin/sop-builder/moving-mountains` |
| Leadership Transition | `leadership-transition` | `/campaigns/leadership-transition`, `/admin/sop-library`, `/admin/sop-builder/leadership-transition` |

Current repo state also includes extra campaign shells not part of the six-SOP
rollout package:

- `grow-the-movement`
- `start-a-chapter`
- `fundraising-sprint`
- `local-volunteering-push`
- `med-talk-series`
- `social-belonging-events`

Those should stay explicit as adjacent product work, not silently folded into
the six required MED International SOP imports.

As of 2026-06-24, two of those adjacent campaigns now have explicit structured
draft-template coverage in the SOP library and builder:

| Adjacent campaign | Current repo slug | Current structured status | Current visible repo location |
| --- | --- | --- | --- |
| Grow the Movement | `grow-the-movement` | Structured draft template with repo-defined campaign-plan provenance and package-level placement/integration guidance; no campaign-catalog or PDF page mapping yet | `/campaigns/grow-the-movement`, `/admin/sop-library`, `/admin/sop-builder/grow-the-movement` |
| Start a Chapter | `start-a-chapter` | Structured draft template with repo-defined campaign-plan provenance and package-level placement/integration guidance; no campaign-catalog or PDF page mapping yet | `/campaigns/start-a-chapter`, `/admin/sop-library`, `/admin/sop-builder/start-a-chapter` |

These lanes are now part of the workflow-engine backbone, but they remain
source-gap-aware imports rather than false MED International PDF-backed
campaigns.

## Surface Placement Map

The rollout package and local CSV align on these product destinations:

| Surface | Primary roles | SOP-owned behavior |
| --- | --- | --- |
| Student Mobile App | `general_member`, `action_committee_member`, `traveler` | Visible active campaign steps, assigned actions, events, proof submission, personal points, leaderboard, campaign progress, SLT Prep entry |
| Student Leadership Command Center | `E-board`, `action_committee_chair` | Chapter campaign execution, assignments, committees, event planning, evidence review, chapter points/KPIs, leadership pipeline |
| Coach Command Center | `sales_coach`, `sales_admin` | Portfolio campaign health, phase validation, risk flags, coach notes, hold/advance/intervene posture, external-system context |
| Staff/Admin Command Center | `sales_admin`, `general_staff`, `ds_admin`, `super_admin` | Cross-chapter campaign status, proof/UGC review, support queues, rollout oversight |
| DS/Admin Backend | `ds_admin`, `super_admin` | SOP Builder, template library, versioning, permissions, integration mappings, outbox, audit logs, feature flags |
| SLT Prep View | `traveler`, authorized staff/admin | Traveler readiness, payments, forms, deadlines, travel prep, sensitive-data-aware summaries |

## Figma Surface Alignment

The rollout package and repo docs point to the same major Figma-backed surface
families:

| Figma source | Product role / area | Current repo route family |
| --- | --- | --- |
| `myMEDLIFE App Prototype` | student member mobile | `/`, `/campaigns`, `/rush-month/*`, `/profile` |
| `Student Leadership Command Center` | chapter leader / e-board | `/chapter?view=...` |
| `Staff Command Center Dashboard` | coach/staff/admin | `/coach?view=...`, `/staff?view=...` |
| `myMEDLIFE SLT Prep Phase` | traveler and staff readiness | `/slt-prep/*`, `/slt-prep/staff` |
| `SOP Creation Section` | DS/Admin backend | `/admin/sop-library`, `/admin/sop-builder/[campaignSlug]`, `/admin/permissions`, `/admin/committees`, `/admin/workflows` |

Repo-side Figma mapping references already in place:

- `docs/architecture/figma-route-and-surface-map.md`
- `docs/architecture/figma-clickthrough-screen-inventory.md`
- `docs/architecture/figma-implementation-matrix.md`

## Integration And Event Taxonomy Confirmed

The package confirms that the workflow engine needs a structured event/outbox
layer. The local `integration_event_types.json` already gives a starter event
taxonomy:

- template/version events:
  - `sop.version.draft_created`
  - `sop.version.published`
- campaign execution events:
  - `campaign.activated`
  - `campaign.phase.started`
  - `campaign.phase.completed`
  - `campaign.step.assigned`
  - `campaign.step.completed`
- evidence/points/KPI events:
  - `evidence.submitted`
  - `evidence.approved`
  - `points.awarded`
  - `kpi.event.created`
- risk/coach decisions:
  - `risk.flagged`
  - `coach.decision.advance_hold_intervene`
- external outbox requests:
  - `hubspot.stage_sync.requested`
  - `hubspot.communication_trigger.requested`
  - `luma.event_sync.requested`
- inbound integration examples:
  - `shopify.deposit_detected`
  - `givelively.fundraising_progress_synced`
- platform safety:
  - `audit.record.created`

## Current Run-A Open Questions

These remain unresolved after the package intake:

1. The permissions matrix is referenced repeatedly as the authorization source
   of truth, but the matrix itself is not bundled in this local package.
2. The package defines both Coach and chapter/platform perspectives for every
   campaign; the current repo captures some of that split in route ownership but
   does not yet store a normalized dual-perspective import artifact.
3. The package says Planning / Goal Setting should be the first full structured
   campaign import, and that sequence has now been confirmed. The current repo
   is still strongest in Rush Month runtime parity, so those two facts should
   stay explicit rather than blended together.
4. The package includes GiveLively as a first-class external system for some
   campaigns, while the current repo’s builder/integration posture mostly
   emphasizes HubSpot, Luma, Shopify, and n8n.
5. The package requires structured closeout requirements, script templates, and
   resource links; those concepts are not yet modeled in the current builder
   schema.
