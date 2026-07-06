# Test Data Seed Map

Date: 2026-07-06

Scope: sandbox seed plan only. This document does not authorize production
writes, production users, invites, external sends, uploads, or production
rollout evidence.

## Current Seed Base

The existing deterministic seed builder is:

- `src/services/test-production-seed-environment.ts`
- `docs/test-production-seed-environment.md`
- `src/data/figma-test-seed-map.ts`

It already creates Test-prefixed chapters, fake users, local login accounts,
memberships, staff roles, campaign/event/points/evidence rows, disabled outbox
rows, and cleanup SQL. It also validates that visible seeded labels start with
`Test` and generated login emails use `test.*@example.com`.

For Figma mock isolation, keep that mechanism but add a Figma-specific seed
family/source so these rows cannot be confused with real rollout data:

- `seed_family = 'figma_seed_v1'`
- `source = 'figma_seed'`
- `is_test = true`
- `environment = 'sandbox'`

The Figma-specific map now defines these markers in code and records which shell
each mapped Test or fixture record supports. It is intentionally local/sandbox
only and does not create production users, production rows, or invites.

Local sandbox reviewers can now generate:

- `.codex-artifacts/figma-seed/figma-test-seed-manifest.json`
- `.codex-artifacts/figma-seed/figma-shell-test-logins.md`
- `.codex-artifacts/figma-seed/figma-signed-in-role-proof.json`
- `.codex-artifacts/figma-seed/figma-signed-in-role-proof.md`
- `.codex-artifacts/figma-seed/figma-sandbox-role-exercise.json`
- `.codex-artifacts/figma-seed/figma-sandbox-role-exercise.md`
- `.codex-artifacts/figma-seed/figma-sandbox-role-shell-regression.json`
- `.codex-artifacts/figma-seed/figma-sandbox-role-shell-regression.md`

Use `pnpm figma-seed:build` for the seed manifest/login map and
`pnpm figma-seed:proof` for the route-logic proof report. Use
`pnpm figma-seed:exercise` for the local-only shell exercise checklist that
maps Test logins to launch-lane review routes. These reports stay
local/sandbox-only, confirm member/leader/staff/admin landing routes, keep
`/app/slt-prep` as a sandbox review alias instead of signed-in production
evidence, and explicitly say they cannot satisfy production signed-in proof or
invite-gate proof.
Use `pnpm figma-seed:regression` for the smallest repeatable four-shell
regression summary built from those same sandbox proof/exercise services. It is
deterministic route-validation output only and must not be described as
production proof.
Run `pnpm figma-seed:exercise:check` after route/auth-readiness changes. It
fails if the sandbox exercise checklist drifts away from launch-lane route
metadata or starts using language that sounds like production proof.

Recommended local-only sandbox flow:

1. Build the Figma seed artifacts:

   ```bash
   pnpm figma-seed:build
   ```

2. Build the route-logic proof report:

   ```bash
   pnpm figma-seed:proof
   ```

3. Build the role exercise checklist:

   ```bash
   pnpm figma-seed:exercise
   ```

4. Check that the role exercise checklist still matches launch-lane route
   metadata:

   ```bash
   pnpm figma-seed:exercise:check
   ```

5. Build the repeatable four-shell regression summary:

   ```bash
   pnpm figma-seed:regression
   ```

6. If a real local browser session is needed, apply the local seed only:

   ```bash
   MYMEDLIFE_TEST_PRODUCTION_CONFIRM=CREATE_TEST_DATA pnpm test-production:seed -- --local
   ```

7. Use only the generated `figma-sandbox-role-exercise.md`,
   `figma-signed-in-role-proof.md`, and
   `figma-sandbox-role-shell-regression.md` artifacts for sandbox QA. Do not
   copy those rows, screenshots, or notes into `signed-in-route-proof.csv`, the
   rollout packet, or the invite gate.

## Proposed Model Locations

| Layer | Proposed location | Purpose |
| --- | --- | --- |
| Seed map constants | `src/data/figma-test-seed-map.ts` or a scoped section in `src/services/test-production-seed-environment.ts` | Canonical mapping from Figma names to Test records. |
| SQL builder | `src/services/test-production-seed-environment.ts` | Reuse deterministic IDs, upserts, validation, and cleanup guardrails. |
| Generated artifacts | `.codex-artifacts/test-production/` or a future `.codex-artifacts/figma-seed/` | Generated SQL, cleanup SQL, login list, and summary JSON. |
| Docs | `docs/figma-mock-data-audit.md`, `docs/test-data-seed-map.md`, `docs/test-production-seed-environment.md` | Reviewer checklist and operating constraints. |
| Future Supabase fixtures | `supabase/seed/` only after owner approval | Optional local-only SQL fixture path, not production. |

Do not add production migrations for this seed map unless the Coordinator
explicitly assigns a schema goal.

## Seed Groups

| Group | Examples from Figma/current app | Target rows | Seed status |
| --- | --- | --- | --- |
| Proof accounts | General member, traveler, committee member, committee chair, leader, vice president, e-board, coach, sales coach, staff/support, DS admin, super admin | `auth.users`, `auth.identities`, `app.profiles`, `app.memberships`, `app.staff_role_assignments` | Seeded sandbox records. Required for signed-in browser proof. |
| Chapters and schools | UCLA, McGill, Boston College, UT Austin, UBC, NYU, Emory, UC Berkeley, Yale, University of Florida, Howard, Morehouse, Spelman, Michigan State | `app.chapters`, `app.memberships`, coach/chapter assignment rows | Seed a small representative set first. Use `Test ...` labels for every fake chapter instance. |
| Role membership | President, vice president, e-board, committee chair, committee member, general member, traveler, coach, staff/support, DS admin | `app.memberships`, `app.staff_role_assignments`, any role proof helper views | Seeded sandbox records. These are the minimum proof classes. |
| Campaign instances | Rush Month for Test UCLA, Safe Homes fundraiser for Test UCLA, Moving Mountains kickoff, SLT interest campaign | `app.campaigns`, campaign phase/task rows, KPI/readiness rows | Seed instance rows only. Keep campaign templates fixture-only. |
| Events and attendance | Test Intro GBM, Test Tabling, Test Rush Week Social, Test Fundraising Bake Sale, Test Community Meal Service | `app.chapter_events`, Luma link/readback rows, RSVP rows, attendance rows, points rows | Seed minimal launch-lane rows. Keep real Luma writes disabled. |
| Points and leaderboards | Sofia R. points, chapter points, member leaderboard, chapter leaderboard | `app.points_events`, `app.kpi_events`, leaderboard/read model rows if present | Seed enough rows for member, leader, staff, and admin route proof. |
| Evidence and proof review | Proof packs, screenshots, Bridge Videos, UGC cards, story submissions | `app.evidence_items`, review/status rows where schema exists | Seed only safe metadata. External URLs, images, patient stories, quotes, and social captions stay fixture-only unless consent/storage rules are approved. |
| Staff portfolio summaries | Chapter health, risk, campaign status, coach assignments, analytics cards | `app.chapters`, `app.kpi_events`, app events/activity rows, staff review rows if present | Seed representative summaries. Broad global portfolio examples can stay fixture-only. |
| Integrations/outbox | Luma, HubSpot, BigQuery, Shopify, GiveLively, n8n, OpenAI, Power BI, Meta, Hootsuite, Smile.io | `app.integration_events`, `app.automation_outbox`, `app.audit_logs` | Seed disabled/mock-safe status rows only. Never seed live credentials or enabled sends. |
| Admin API keys | `secret-ref:luma:staging:v1`, `secret-ref:hubspot:disabled:v1`, plus exported live-looking mock tokens such as `luma_live_*`, `pat-na1-*`, `sk-proj-*`, `n8n_whsec_*`, and BigQuery-style service-key strings | Fixture-only unless a secure secret-reference model is approved | Keep fixture-only. Do not seed real API keys or realistic mock key strings. Sanitize exported admin key examples before any persisted adapter is approved. |
| SLT Prep | Test traveler, Test Peru SLT trip, checklist, payments, meetings, traveler success notes | Future SLT prep schema or fixture adapters | Fixture-only until schema and Figma source are approved. |
| Leader resource library | MEDLIFE Bridge Videos, Greenleaf, VitalSmarts, Ashoka, Gallup, Coursera, external training/resource URLs | Future content-library schema only if Coordinator assigns it | Fixture-only. Do not seed third-party resource titles, org names, or URLs into rollout evidence paths. |

## Minimum Proof Account Classes

| Class | Example Test account shape | Browser proof required |
| --- | --- | --- |
| Member | `test.<chapter>.general.member@example.com`, display `Test ...` | Can sign in, land on `/app`, see only own Test chapter data, events, points, campaign actions, and proof status. Cannot access staff/admin routes. |
| Leader | `test.<chapter>.president@example.com`, display `Test ...` | Can sign in, route to `/leader`, see Test chapter roster, committee, events, points, evidence, succession, and feed analytics. Cannot access admin-only controls. |
| Staff/support | `test.staff.member@example.com` or coach account, display `Test ...` | Can sign in, route to `/staff`, see assigned Test chapters or staff portfolio, review mock-safe proof/events/points, and cannot perform live sends/uploads. |
| DS/admin | `test.revops.systems.manager@example.com` or `test.administrator@example.com`, display `Test ...` | Can sign in, route to `/admin`, see users/chapters/modules/integrations/audit/API key fixture views, with production writes and external sends disabled. |

## Proposed Figma Replacement Map

| Current Figma/mock value | Proposed persisted Test value |
| --- | --- |
| Sofia Alvarez, Sofia R., Sofia Reyes | `Test Sofia Alvarez` or route-specific `Test Sofia Reyes` |
| Marcus Chen, Marcus T., Marcus Rivera, Marcus Webb | `Test Marcus ...` |
| Priya Sharma, Priya Nair, Priya Patel | `Test Priya ...` |
| Amara Okonkwo, Jordan Kim, DeShawn Williams, Elena Vasquez, Theo Nakamura, Nadia Osei, Aaliyah Brooks, Caleb Torres | `Test ...` equivalents |
| Coaches and staff such as Renato Coach, Coach Cam, Maria Santos, James Okafor, Carlos Quispe, Soledad Vega, Chen Wei | `Test ...` equivalents |
| UCLA MEDLIFE | `Test UCLA MEDLIFE` |
| McGill MEDLIFE, Boston College MEDLIFE, UT Austin MEDLIFE, UBC MEDLIFE, NYU MEDLIFE, Emory MEDLIFE | `Test ... MEDLIFE` chapter records |
| UC Berkeley, Yale, University of Florida, Howard, Morehouse, Spelman, Michigan State, Stanford, Johns Hopkins, MIT, and international university examples | `Test ... MEDLIFE` chapter records when seeded, otherwise fixture-only |
| Intro GBM, Tabling at Bruin Walk, Rush Week Social, Fundraising Bake Sale, Community Meal Service, Bridge Video Workshop | `Test ...` event/proof instances |
| Peru SLT \| July 2026 | `Test Peru SLT \| July 2026` if persisted as a trip instance |
| Story/proof titles, patient/student quotes, external social links | Fixture-only until consent/source/storage rules are approved |
| Leader training titles and external learning links | Fixture-only until a content-library/storage model is approved |
| Export-only member prototype names such as Sofia Chen, Alex Kim, and legacy UCF/FIU chapter copy | Fixture-only unless a later UI wiring task normalizes them into explicit `Test ...` records |

Do not rename MEDLIFE, Luma, Events, Points, SLT Prep, High School Chapter,
College / University Chapter, provider names, campaign template names, or module
names.

## Exclusion Rules For Production Evidence

Production rollout builders and approval packets should reject any row that
matches one or more of these markers:

- `is_test = true`
- `source = 'figma_seed'`
- `seed_family = 'figma_seed_v1'`
- display/name/title/chapter starts with `Test `
- email matches `test.%@example.com`
- email domain ends in `.test`
- payload contains `mock`, `figma_seed`, or `test_production_seed`
- outbox/integration status is `disabled`, `mock`, `mocked`, or `staging-only`

Recommended future tests:

- Figma seed validation fails if a fake visible entity lacks `Test `.
- Production rollout packet builder excludes `figma_seed` and `is_test` rows.
- Signed-in route proof rejects preview-cookie/local actor proof as production
  proof.
- Cleanup SQL removes only Figma/Test rows and never targets non-Test chapters
  or real production users.
- Browser smoke confirms seeded Test data renders without changing the Figma
  shell layout.

Current focused coverage:

- `tests/figma-test-seed-map.test.ts`
- `tests/production-rollout-packet-builder.test.ts`
- `tests/production-rollout-bootstrap.test.ts`

Additional audit findings from the exported Figma code folders:

- `/Users/codex/Desktop/Staff Command Center Dashboard/` still contains
  production-shaped mock API keys in the admin fixture export. Those values
  must stay fixture-only and should be sanitized before any future persisted
  sandbox adapter is allowed.
- `/Users/codex/Desktop/Student Leadership Command Center/` includes a leader
  training/resource surface with external URLs and third-party org names. Those
  values should stay fixture-only rather than being pulled into seeded sandbox
  rows.
- `/Users/codex/Desktop/myMEDLIFE App Prototype/` still contains older UCF/FIU
  member prototype names and events that are not part of the current
  `figma_seed_v1` login/report path. They should remain fixture-only unless a
  later UI wiring pass intentionally maps them into `Test ...` records.

## First Implementation Goal

The next safe code goal should be a read-only/local seed adapter pass:

1. Add a Figma seed family/source to the existing test-production seed builder.
2. Normalize local actor display names to `Test ...` in sandbox-only contexts.
3. Add validation that every persisted fake visible entity starts with `Test `.
4. Add a production packet guard test proving `figma_seed` and `is_test` rows
   cannot enter rollout evidence.
5. Run only local seed generation/checks and browser smoke against local/sandbox
   data. Do not write production data.
