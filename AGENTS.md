# AGENTS.md

This repo is governed by a Codex-owned architecture workflow for the custom
myMEDLIFE PWA at `www.myMEDLIFE.org`.

Build the smallest clear Rush Month operating loop first. Do not overbuild. Do
not replace or modify the Discourse prototype from this repo unless Nick
explicitly approves that change.

## Model Routing

For every Linear issue, begin by stating the recommended model and the reason.

Use GPT-5.4 mini for:

- routine scaffolding
- simple UI
- TypeScript components
- Tailwind styling
- mock data
- simple forms
- documentation updates
- minor bug fixes
- simple tests

Recommend GPT-5.5 Thinking or the strongest available reasoning model before:

- repo or architecture decisions
- Supabase schema, RLS, auth, or security decisions
- role and permission decisions
- integration contracts or n8n outbox design
- AI/event design
- points or KPI ledger design
- major refactors
- final PR review before merge

Use this wording when escalation is needed:

```text
Nick, switch me to GPT-5.5 Thinking for this next step because this affects the
long-term architecture, security, integrations, or review safety of the app.
```

## Stack Boundary

The current myMEDLIFE plan recommends:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Postgres/Auth/Storage
- Vercel deployment
- GitHub PR workflow
- Linear issue tracking

Kiomi's general standard defaults to Vite, TanStack Router, TanStack Query, Hono,
Cloudflare services, and evlog.

Do not silently mix stacks. If the team wants to switch from the current Next.js
path to Kiomi's default stack, pause and confirm with Nick/team first.

## Source Of Truth

GitHub is canonical for code and implementation evidence.

Linear is canonical for issue scope, ownership, acceptance criteria, and status.

Discourse is a prototype/reference layer, not the final source of truth for this
custom PWA.

Supabase should become the app source of truth for:

- users
- chapters
- memberships
- role approvals
- assignments
- evidence/proof reviews
- points ledger
- KPI ledger
- campaign status
- structured app events

n8n should remain an external orchestration layer, not the owner of app truth.

## Integration Boundary

External writes are disabled until explicitly approved.

Do not trigger real writes to:

- HubSpot
- Luma
- warehouse or Data Hub
- Power BI
- n8n

Instead, record structured `IntegrationEvent` and `AutomationOutbox` rows so
future automation can safely pick up approved events.

## Human Maintainability Rules

Build in a standard, boring, conventional way that a human developer team can
maintain without AI.

Rules:

- Keep files small.
- Keep functions small.
- Use clear names.
- Avoid `any` unless there is a documented reason.
- Keep UI, business logic, data access, shared types, validation, and config
  separated.
- Validate external inputs.
- Avoid hidden side effects.
- Avoid clever abstractions and custom framework-like systems.
- Avoid unnecessary dependencies.
- Document environment variables before using them.
- Add tests for important logic when implementation begins.

Preferred future structure:

```text
src/
  app/
  components/
  features/
    assignments/
    campaigns/
    evidence/
    integrations/
    points/
  lib/
  services/
  shared/
    schemas/
    types/
tests/
```

## Collaboration Rules

- Use one branch per issue or focused work packet.
- Use PRs for material changes.
- Keep `main` protected when branch protection is available.
- Do not commit secrets, tokens, passwords, API keys, or private credentials.
- Do not reformat unrelated files.
- Do not rename files unless needed.
- Stop and ask if the task crosses a forbidden boundary or scope becomes
  unclear.

Material PRs should include:

- Linear issue ID
- scope summary
- files changed
- validation summary
- assumptions
- risks or blockers
- handoff note

## Current Goal Guardrail

The active goal is Goal 4: Supabase schema, auth, and RLS design planning.

Allowed:

- Supabase architecture documentation
- proposed table and relationship model
- role and permission boundary documentation
- RLS policy strategy documentation
- chapter, coach, admin, and super-admin access planning
- audit logging requirements
- TypeScript-to-database mapping notes
- future RLS test-plan notes
- draft SQL files clearly marked as not applied
- README and documentation updates

Not allowed without Nick's next approval:

- live Supabase auth wiring
- applied production migrations
- real database persistence from the app
- real users or role assignments
- real HubSpot writes
- real Luma writes
- real n8n workflows
- warehouse or Power BI exports
- complex AI workflows
- all-campaign buildout
- native iOS or Android apps
