# myMEDLIFE PWA

myMEDLIFE is the custom, mobile-first MEDLIFE chapter operating app for
`www.myMEDLIFE.org`.

This repo is a parallel build to the current Discourse prototype. Do not replace
or modify Discourse from this repo unless Nick explicitly approves that change.
Discourse remains a reference/prototype/community layer while this app explores
the production-style custom PWA path.

## Current Goal

The current goal is Goal 12: disabled write-readiness airlock.

Goal 5 turned the approved Goal 4 database plan into a local-only Supabase
foundation:

- local Supabase project structure
- first migration for core tables, role helpers, RLS policies, and safety
  triggers
- fake seed data for Rush Month, chapters, roles, proof/testimonials, coach
  portfolio access, and disabled/mock integration rows
- pgTAP RLS/security tests
- documentation for local setup and reset/test commands

Goal 6 reviewed that foundation against MEDLIFE Sales SOP knowledge bases and
defines the next safe local schema refinement plan before live auth or real
integrations.

Goal 7 implements that plan locally by adding campaign templates, phase
templates, campaign officer lanes, readiness reviews, risk flags, closeouts,
expanded proof/evidence types, fake seed data, and RLS/security tests.

Goal 8 added the first safe read-only bridge from the app to local Supabase data
while keeping mock data as the default fallback.

Goal 9 adds a local-only actor context layer so developers can test fake member,
leader, coach, admin, DS admin, and super admin read context without enabling
production auth or app writes.

Goal 10 turns that local actor context into role-aware navigation, restricted
state messaging, read filters, and permission tests for the Rush Month shell.

Goal 11 adds local-only contracts for starting an action, submitting proof,
previewing HQ proof-sharing decisions, recording audit intent, and shaping
disabled outbox rows. It updates the action detail, proof, and review screens
without adding real persistence, uploads, auth sessions, or integrations.

Goal 12 adds an explicit disabled write-readiness layer. It documents which
tables future action/proof/HQ decisions would touch, shows those future write
targets in the UI, and keeps every app write blocked until Nick approves a
later security-reviewed implementation goal.

Do not connect production Supabase, enable live auth in the student UI, create
real users, implement app writes, or enable external writes until Nick approves
a later implementation goal.

## Recommended Stack

Recommended model for this stack decision: GPT-5.5 Thinking.
Reason: stack choice affects the long-term architecture, hosting, data model,
integrations, and security posture.

Recommended stack for this repo:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Postgres/Auth/Storage
- Vercel deployment
- GitHub PR workflow
- Linear issue tracking

Why this recommendation:

- The myMEDLIFE build handoff explicitly recommends Next.js, Supabase, and
  Vercel for this custom PWA.
- The repo is already scaffolded as a Next.js app.
- Supabase is the planned app source of truth for auth, chapter membership,
  permissions, assignments, evidence, points, KPIs, and events.
- Vercel fits the public PWA deployment path for `www.myMEDLIFE.org`.

Stack conflict to keep visible:

- Kiomi's general project standard defaults to Vite, TanStack Router, TanStack
  Query, Hono, Cloudflare services, and evlog.
- Do not silently mix these stacks.
- If the team wants to switch to Kiomi's default stack, confirm that decision
  with Nick/team before changing this repo.

## Product Posture

myMEDLIFE should turn MEDLIFE campaign SOPs into distributed student action. It
should not become a passive SOP library, a generic marketing site, or a forum.

The first acceptance test is Rush Month:

leader assigns action -> member completes action -> evidence is submitted ->
leader/coach reviews -> points/KPIs update -> coach sees advance/hold/intervene.

All external integrations are mock-first until explicitly approved.

## Important Docs

- [Agent standards](./AGENTS.md)
- [Foundation and Rush Month MVP architecture](./docs/architecture/foundation-and-rush-month-mvp.md)
- [Supabase schema, auth, and RLS design plan](./docs/architecture/supabase-schema-auth-rls-plan.md)
- [Goal 6 Supabase foundation review and Goal 7 plan](./docs/architecture/goal-6-supabase-foundation-review.md)
- [Future RLS test plan](./docs/testing/rls-test-plan.md)
- [Supabase local development](./docs/supabase-local-development.md)
- [Codex operating brief](./docs/operating-brief.md)

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Run checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run local Supabase when Docker is available:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:test
```

To test the read-only local Supabase path:

```bash
cp .env.example .env.local
# Set MYMEDLIFE_DATA_SOURCE=supabase
# Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true
# Set SUPABASE_SERVICE_ROLE_KEY to the local service role key printed by Supabase
# Optional: set MYMEDLIFE_LOCAL_ACTOR_EMAIL to one of the fake seed users.
# This also works when the app is using mock fallback data.
pnpm supabase:start
pnpm supabase:reset
pnpm dev
```

## Environment Variables

No live external services are required for the current mock app or local
database foundation. The app uses mock data unless local Supabase reads are
explicitly enabled.

```bash
MYMEDLIFE_DATA_SOURCE=mock
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=false
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=false
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MYMEDLIFE_LOCAL_ACTOR_EMAIL=member.a@mymedlife.test
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Rules:

- Never commit real secrets.
- Keep `MYMEDLIFE_DATA_SOURCE=mock` unless you are intentionally testing local
  Supabase.
- Goal 8 only permits localhost Supabase reads. Non-local Supabase URLs fall
  back to mock data.
- Goal 9 actor switching is local-only and reads fake seed users by email. It
  does not add browser sign-in, sessions, cookies, or production auth.
- Goal 10 role filtering is read-only and local-only. It uses
  `MYMEDLIFE_LOCAL_ACTOR_EMAIL` to preview member, leader, coach, admin, DS
  admin, and super admin views.
- Goal 11 local action/proof contracts are preview-only. They shape future
  events, audit logs, and disabled outbox rows but do not save data, upload
  files, publish proof, or trigger automation.
- Goal 12 write-readiness is an airlock. `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES`
  is documented but still blocked by code until a later approved goal adds
  real local writes with RLS tests.
- Keep real HubSpot, Luma, warehouse, Power BI, and n8n writes disabled until
  explicitly approved.
- Use mock-safe integration events and outbox rows before adding real syncs.

## Current App State

The app currently uses mock data by default. When local Supabase env vars are
explicitly enabled, these server-rendered routes can read fake local Supabase
data and fake local actor context. With or without local Supabase running,
`MYMEDLIFE_LOCAL_ACTOR_EMAIL` can preview the Goal 10 local role views:

- `/chapter`
- `/rush-month`
- `/rush-month/actions`
- `/rush-month/actions/[assignmentId]`
- `/rush-month/evidence`
- `/rush-month/review`
- `/coach`
- `/admin`

There is no live Supabase auth, enabled app write path, production database connection,
HubSpot write, Luma write, warehouse export, Power BI export, n8n workflow, or
AI summary.

Goal 2 route shells:

- `/`: mobile-first app front door
- `/chapter`: chapter home shell
- `/rush-month`: Rush Month campaign shell
- `/rush-month/actions`: role-aware visible assignments
- `/rush-month/actions/[assignmentId]`: role-aware action detail and local proof contract preview
- `/rush-month/evidence`: role-aware proof/testimonial list
- `/rush-month/review`: HQ proof-sharing review preview
- `/coach`: coach dashboard shell
- `/admin`: admin/super-admin integration placeholder

Mock data lives in `src/data/mock-rush-month.ts`. Shared domain types live in
`src/shared/types/domain.ts`. Validation schemas live in
`src/shared/schemas/domain.ts`. Pure mock workflow logic lives in
`src/services/rush-month-service.ts`. Local action/proof contract previews live
in `src/services/local-action-contracts.ts`. Disabled future write boundaries
live in `src/services/write-readiness.ts`. Small reusable UI components live in
`src/components`.

Goal 4 Supabase planning lives in
`docs/architecture/supabase-schema-auth-rls-plan.md`. The draft SQL sketch lives
in `docs/architecture/drafts/0001_supabase_schema_draft.sql` and is not an
applied migration.

Goal 5 local Supabase implementation lives in:

- `.github/workflows/goal-5-ci.yml`
- `supabase/config.toml`
- `supabase/migrations/20260615110000_initial_supabase_foundation.sql`
- `supabase/seed.sql`
- `supabase/tests/database/rls_goal_5.test.sql`
- `docs/supabase-local-development.md`

Goal 6 planning lives in:

- `docs/architecture/goal-6-supabase-foundation-review.md`
- `docs/architecture/drafts/0002_goal_6_schema_refinements_draft.sql`

Goal 7 local schema refinement lives in:

- `supabase/migrations/20260615130000_goal_7_campaign_operating_model.sql`
- `supabase/tests/database/rls_goal_7.test.sql`
- additional fake Goal 7 records in `supabase/seed.sql`

Goal 8 read-only app foundation lives in:

- `.env.example`
- `src/lib/supabase-readonly.ts`
- `src/services/read-only-app-data.ts`
- `src/components/data-source-notice.tsx`
- `tests/supabase-readonly.test.ts`
- `tests/read-only-app-data.test.ts`

Goal 10 role-aware read-only proof lives in:

- `src/services/role-visibility.ts`
- `src/components/local-role-switcher.tsx`
- `src/components/restricted-state.tsx`
- role-aware updates to `/chapter`, `/rush-month`, `/rush-month/actions`,
  `/coach`, and `/admin`
- `tests/role-visibility.test.ts`

Goal 11 local proof/action contracts live in:

- `src/services/local-action-contracts.ts`
- `tests/local-action-contracts.test.ts`
- expanded proof evidence types in `src/shared/types/domain.ts` and
  `src/shared/schemas/domain.ts`
- role-aware updates to `/rush-month/actions/[assignmentId]`,
  `/rush-month/evidence`, and `/rush-month/review`

Goal 12 disabled write-readiness lives in:

- `src/services/write-readiness.ts`
- `src/components/write-readiness-notice.tsx`
- `tests/write-readiness.test.ts`
- visible write-readiness notices on action detail and HQ review screens

Goal 9 local actor context lives in:

- `src/services/local-actor-context.ts`
- `src/components/local-actor-notice.tsx`
- `tests/local-actor-context.test.ts`

## Linear Lane

Primary live issues:

- MED-412: Bootstrap myMEDLIFE PWA repo lane
- MED-413: Define Supabase schema and role model
- MED-414: Build Rush Month MVP action loop
- MED-415: Build evidence submission and review workflow
- MED-416: Build points, KPI events, and leaderboard stubs
- MED-417: Build Luma, HubSpot, warehouse, and AI mock integration layer
- MED-418: Run bake-off evaluation against Discourse prototype

## Definition of Done for Goal 12

Goal 12 is complete when a human developer can run the app locally, switch fake
roles with `MYMEDLIFE_LOCAL_ACTOR_EMAIL`, and see exactly which future tables an
action start, proof submission, or HQ sharing decision would touch while the app
still refuses to write.

The app remains mock-first by default. Goal 12 does not wire production
Supabase, enable live auth, implement app writes, upload files, publish proof,
or activate real integrations.
