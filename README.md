# myMEDLIFE PWA

myMEDLIFE is the custom, mobile-first MEDLIFE chapter operating app for
`www.myMEDLIFE.org`.

This repo is a parallel build to the current Discourse prototype. Do not replace
or modify Discourse from this repo unless Nick explicitly approves that change.
Discourse remains a reference/prototype/community layer while this app explores
the production-style custom PWA path.

## Current Goal

The current goal is Goal 3: domain validation plus service tests for the Rush
Month mock shell.

Goal 3 keeps the app mock-only while adding maintainable foundations:

- typed validation schemas for core domain objects
- pure service/helper functions for Rush Month mock workflows
- tests for role visibility, evidence review, points, KPIs, coach decisions,
  and event/outbox creation

Do not continue into real database, auth, RLS, or integration implementation
until Nick approves the next goal.

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

## Environment Variables

No live external services are required for the Goal 2 mock shell.

Future Supabase work should document required variables here before use:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Rules:

- Never commit real secrets.
- Keep real HubSpot, Luma, warehouse, Power BI, and n8n writes disabled until
  explicitly approved.
- Use mock-safe integration events and outbox rows before adding real syncs.

## Current App State

The app currently uses mock data only. There is no live Supabase auth, RLS,
database persistence, HubSpot write, Luma write, warehouse export, Power BI
export, n8n workflow, or AI summary.

Goal 2 route shells:

- `/`: mobile-first app front door
- `/chapter`: chapter home shell
- `/rush-month`: Rush Month campaign shell
- `/rush-month/actions`: this week's actions and role-grouped assignments
- `/rush-month/actions/[assignmentId]`: member action detail and mock proof UI
- `/rush-month/evidence`: mock evidence list
- `/rush-month/review`: leader/coach review queue
- `/coach`: coach dashboard shell
- `/admin`: admin/super-admin integration placeholder

Mock data lives in `src/data/mock-rush-month.ts`. Shared domain types live in
`src/shared/types/domain.ts`. Validation schemas live in
`src/shared/schemas/domain.ts`. Pure mock workflow logic lives in
`src/services/rush-month-service.ts`. Small reusable UI components live in
`src/components`.

## Linear Lane

Primary live issues:

- MED-412: Bootstrap myMEDLIFE PWA repo lane
- MED-413: Define Supabase schema and role model
- MED-414: Build Rush Month MVP action loop
- MED-415: Build evidence submission and review workflow
- MED-416: Build points, KPI events, and leaderboard stubs
- MED-417: Build Luma, HubSpot, warehouse, and AI mock integration layer
- MED-418: Run bake-off evaluation against Discourse prototype

## Definition of Done for This Foundation Goal

This goal is complete when the repo has:

- chosen or recommended stack
- README and AGENTS guidance
- architecture note for domain model, roles, permissions, event log, and outbox
- Rush Month MVP flow for leader/member/coach
- prioritized next-cycle task list
- open questions and assumptions
- checks run and recorded
