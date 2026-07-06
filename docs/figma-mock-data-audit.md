# Figma Mock Data Audit

Date: 2026-07-06

Scope: audit/docs only. No production users were created, no production Supabase
rows were written, no invites were sent, and no UI shell/layout changes were
made.

Product rule: Figma remains the visual and functional contract. Mock content
from Figma-derived shells must not blend into production rollout evidence. Fake
people, chapters, schools, staff, coaches, events, stories, and chapter metrics
should either become isolated `Test ...` records or remain explicitly fixture
only.

Do not prefix real system concepts such as MEDLIFE, Luma, Events, Points, SLT
Prep, High School Chapter, College / University Chapter, campaign templates, or
integration provider names.

## Required Safeguards

Every seeded Figma-derived review record should have:

- `is_test = true`
- `source = 'figma_seed'`
- a sandbox/environment marker, for example `environment = 'sandbox'`
- visible `name`, `display_name`, `chapter`, `title`, or equivalent labels that
  start with `Test ` when they represent fake entities
- fake login emails under a reserved test domain, preferably
  `test.*@example.com` for generated Supabase auth users or `.test` only for
  local fixture personas
- disabled external writes, uploads, sends, provider syncs, and invite paths
- exclusion from production rollout packets, live-data-counts, signed-in proof
  rows, owner CSVs, and invite-gate approval evidence

## Route And Component Audit

| Route/surface | Files inspected | Mock data found | Proposed Test replacements | Seeded vs fixture-only |
| --- | --- | --- | --- | --- |
| `/app` member home | `src/components/figma-member-mobile-home.tsx`, `src/data/mock-rush-month.ts`, `src/services/local-actor-context.ts` | `UCLA MEDLIFE`, `Sofia`, `Sofia R.`, `Renato Coach`, `Kiomi Leader`, placeholder friend names in proof text, local actors such as Sofia Alvarez and Taylor Traveler. Member leaderboards, Rush Month tasks, action proof, HubSpot and warehouse mocked activity, and static UCLA event context. | `Test UCLA MEDLIFE`, `Test Sofia Alvarez` or `Test Sofia R.`, `Test Renato Coach`, `Test Kiomi Leader`, `Test Marcus`, `Test Priya`, and local actor emails using test-only domains. Keep MEDLIFE, Events, Points, Rush Month, HubSpot, Luma, and warehouse concepts unprefixed. | Seed core signed-in member/traveler profiles, chapter membership, points, campaign assignment, RSVP, attendance, and evidence rows. Keep QR SVG, in-component placeholder text, and disabled integration timeline as fixture-only until adapters read seed rows. |
| `/app/events` and event detail flows | `src/components/figma-member-mobile-home.tsx`, `src/data/mock-rush-month.ts` | Event instances such as `Intro GBM`, `Tabling at Bruin Walk`, `Rush Week Social`, `Spring Showcase Kickoff`, `Fundraising Bake Sale`, `Community Health Fair`, UCLA locations, and organizer `Marcus T.`. | Event instances should become `Test Intro GBM`, `Test Tabling at Bruin Walk`, `Test Rush Week Social`, etc. Organizer becomes `Test Marcus T.`. Chapter and venue context becomes `Test UCLA MEDLIFE` and test campus locations when persisted. | Seed launch-lane event, RSVP, attendance, points, and Luma-link readback rows in sandbox. Keep real Luma writes disabled and keep provider names unprefixed. |
| `/campaigns` member campaign page | `src/components/figma-member-campaigns-page.tsx`, `src/data/mock-campaigns.ts`, `src/data/mock-rush-month.ts` | Campaign templates and launch phases for Rush Month, Spring Showcase, Safe Homes Fundraiser, Community Health Fair, Moving Mountains, SLT Promotion, Local Volunteering Push, Leadership Transition, and similar campaign concepts. | Do not rename template/system concepts. Seeded campaign instances should be labeled by owning test chapter, for example `Test UCLA MEDLIFE - Rush Month`. Fake assignees, owners, and proof submitters should be `Test ...` people. | Campaign templates remain fixture/mock-only. One or more instantiated sandbox campaign rows per Test chapter should be seeded for browser proof. |
| `/proof-library`, feed, and stories | `src/components/figma-member-mobile-home.tsx`, `src/components/figma-leader-stories-screen.tsx`, `src/components/figma-member-stories-page.tsx`, `src/components/figma-leader-command-center.tsx` | Story/proof examples include Penn State, UConn, Florida State, Rutgers, Miami MEDLIFE, Yale, Program Staff, National Campaign, patient/student quotes, external-looking Loom/YouTube links, and stock Unsplash imagery. | Student/author/patient names should be `Test ...`; chapter instances should be `Test Penn State MEDLIFE`, `Test UConn MEDLIFE`, `Test Florida State MEDLIFE`, `Test Rutgers MEDLIFE`, `Test Miami MEDLIFE`, `Test Yale MEDLIFE`. Patient stories should be fixture-only unless consent and storage rules are approved. | Seed only safe proof/evidence metadata needed for role routing and review queues. Keep public stories, patient voices, external embed URLs, quotes, stock image URLs, and social proof cards fixture-only until content consent/storage schema is approved. |
| `/app/slt-prep` and `/slt-prep` | `src/data/mock-slt-trip-prep.ts`, `docs/figma-route-audit.md` | Traveler `Sofia Alvarez`, `UCLA MEDLIFE`, trip instance `Peru SLT | July 2026`, `Coach Cam`, traveler success staff, and Drive/Form, HubSpot, Shopify, Luma, Zoom, and scholarship review mock ledgers. Route currently documents missing exact Figma source. | `Test Sofia Alvarez`, `Test UCLA MEDLIFE`, `Test Peru SLT | July 2026`, `Test Coach Cam`, and `Test Traveler Success Staff`. Keep SLT Prep, Peru SLT as a program concept, MEDLIFE staff team, HubSpot, Shopify, Luma, and Zoom unprefixed. | Seed a minimal sandbox traveler profile plus read-only checklist/payment/meeting fixture rows only after the SLT schema is approved. Until then, keep this surface fixture-only and explicitly outside production proof. |
| `/leader` command center | `src/components/figma-leader-command-center.tsx`, `src/services/local-actor-context.ts` | Member roster includes Sofia Reyes, Marcus Chen, Amara Okonkwo, Jordan Kim, Priya Sharma, DeShawn Williams, Elena Vasquez, Theo Nakamura, Nadia Osei, Ryan O'Brien, Aaliyah Brooks, Caleb Torres. Chapter leaderboard includes UCLA, McGill, Boston College, UT Austin, UBC, NYU, Emory. Events include Moving Mountains Kickoff, SLT Interest Meeting, Tabling, Fundraising Bake Sale, Community Meal Service, Chapter General Meeting, Bridge Video Workshop. | Prefix fake people and chapter instances: `Test Sofia Reyes`, `Test Marcus Chen`, etc.; `Test UCLA MEDLIFE`, `Test McGill MEDLIFE`, `Test Boston College MEDLIFE`, `Test UT Austin MEDLIFE`, `Test UBC MEDLIFE`, `Test NYU MEDLIFE`, `Test Emory MEDLIFE`; event instances as `Test ...`. Keep MEDLIFE, committee names, Events, Points, SLT, Moving Mountains, and Safe Homes concepts unprefixed. | Seed leader, committee chair, member, chapter, membership, committee, event, points, evidence, and campaign rows for at least one test chapter. Keep bridge video bodies, field stories, and national leaderboard benchmark copy fixture-only until a content model exists. |
| `/staff` command center | `src/components/figma-staff-command-center.tsx`, `src/services/local-actor-context.ts` | Portfolio chapters and schools include UC Berkeley, Yale, University of Florida, McGill, PUCP Lima, UNMSM Lima, USP Sao Paulo, UFMG Belo Horizonte, UNAH Tegucigalpa, UNAN Managua, University of Nairobi, Makerere, Stanford, Johns Hopkins, UPCH Lima, Universidad de Chile, UNAM Mexico City, University of Ghana, University of Toronto, and MIT. Coaches/leaders include Maria Santos, James Okafor, Carlos Quispe, Fernanda Lima, Lucia Herrera, Samuel Mutua, Aisha Kamara, Priya Nair, Ethan Liu, Sofia Chen, and others. UGC cards include social links, student names, proof titles, consent states, and external domains. | Prefix fake portfolio rows as `Test UC Berkeley MEDLIFE`, `Test Yale MEDLIFE`, etc.; coaches and leaders as `Test ...`. UGC/proof cards should use `Test ...` chapter, student, and title labels when persisted. Keep provider names, campaign concepts, consent states, staff analytics, and integration labels unprefixed. | Seed only the staff/coach/admin profiles, coach-chapter assignments, chapter summary rows, read-only campaign/event/points/evidence summaries, disabled outbox rows, and safe audit rows required for browser proof. Keep UGC social URLs, external domains, social captions, best-practice library copy, and broad global portfolio examples fixture-only. |
| `/admin` DS admin shell | `src/components/figma-admin-panel.tsx` | Users include Aaliyah Johnson, Marcus Rivera, Priya Nair, Devon Carter, Fatima Hassan, James Okafor, Soledad Vega, Chen Wei. Chapters include Howard University, UCLA MEDLIFE, Emory University, Morehouse College, Michigan State, Spelman College. Coaches include Dr. S. Williams, Dr. R. Patel, Dr. K. Brown, Dr. T. Jackson, Dr. L. Chen, Dr. N. Osei. Audit logs reference Chen Wei, Soledad Vega, Marcus Rivera, Michigan State, Devon Carter, Priya Nair, and Morehouse College. API keys use `secret-ref:*` placeholders. | Prefix fake users/coaches/chapter instances: `Test Aaliyah Johnson`, `Test Marcus Rivera`, `Test Priya Nair`, `Test Soledad Vega`, `Test Chen Wei`, `Test Howard University MEDLIFE`, `Test Morehouse College MEDLIFE`, etc. Keep DS Admin, Super Admin, Luma, HubSpot, BigQuery, OpenAI, Power BI, Smile.io, Meta, Hootsuite, API Keys, Audit Logs, and module names unprefixed. | Seed DS/admin/staff/support accounts, profiles, role assignments, Test chapter summary data, disabled integrations/outbox rows, and safe audit rows. API key rows should remain fixture-only with `secret-ref` placeholders and must never become real secrets in seed output. |

## Static Fake Text That Remains

The Figma-derived components still hold in-component constants because this pass
is docs-only and preserving the visual shell was required. Static content can
remain temporarily when it is:

- part of the approved Figma visual contract
- not used as production rollout evidence
- blocked by missing adapters or missing schema
- explicitly mock-safe, disabled, or read-only

Provider names, module names, product concepts, campaign template names, and
MEDLIFE program concepts should remain unprefixed. Fake entity instances should
be prefixed when they are persisted or used in signed-in browser proof.

## Required Smoke Checks Before Using Seeded Rows As Proof

- Verify `/app`, `/app/events`, `/campaigns`, `/proof-library`, `/app/slt-prep`,
  `/leader`, `/staff`, and `/admin` render with the same Figma shell shape.
- Verify signed-in member, leader, staff/support, and DS/admin accounts can only
  see the routes expected for their role.
- Verify all seeded visible records in those routes start with `Test ` when they
  represent fake entities.
- Verify no row with `is_test = true`, `source = 'figma_seed'`, a `Test ` label,
  or test email can enter production rollout packet evidence.
- Verify provider writes, uploads, invites, and outbox sends remain disabled for
  Figma seed data.
- Verify cleanup removes only Figma/Test seed rows and leaves real rollout rows
  untouched.

## Open Gaps

- The current test-production seed uses `test_production_seed`; Figma-specific
  sandbox data should add or migrate to `source = 'figma_seed'` when implemented.
- Several Figma story/proof examples look realistic and should remain
  fixture-only until consent, source attribution, and storage rules are approved.
- `/app/slt-prep` still depends on mock SLT prep data and documented missing
  exact Figma source; it should not count as production signed-in proof.
- Existing local actor personas use `.test` emails and realistic names. They
  should be normalized to `Test ...` display names before any production-style
  browser evidence uses them.

