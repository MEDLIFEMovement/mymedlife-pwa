# Codex Operating Brief: myMEDLIFE PWA Foundation

Recommended model for this goal: GPT-5.5 Thinking.

Reason: this goal includes stack recommendation, domain modeling, role and
permission boundaries, event/outbox architecture, and Rush Month MVP planning.
Those decisions affect the long-term safety and maintainability of the app.

## Objective

Create the foundation for the custom myMEDLIFE PWA at `www.myMEDLIFE.org`.
This is a parallel build to Discourse, not a replacement. Stop after the
foundation and Rush Month MVP plan are clear.

## Build Posture

- Build a mobile-first chapter operating app.
- Make Rush Month the first acceptance test.
- Keep Discourse as prototype/reference.
- Keep external integrations mock-first.
- Keep Supabase/myMEDLIFE as the app source of truth.
- Keep n8n as a future orchestration layer, not an app dependency.

## Immediate Source Lane

GitHub repo:

- `MEDLIFEMovement/mymedlife-pwa`

Linear issues:

- MED-412: Bootstrap myMEDLIFE PWA repo lane
- MED-413: Define Supabase schema and role model
- MED-414: Build Rush Month MVP action loop
- MED-415: Build evidence submission and review workflow
- MED-416: Build points, KPI events, and leaderboard stubs
- MED-417: Build Luma, HubSpot, warehouse, and AI mock integration layer
- MED-418: Run bake-off evaluation against Discourse prototype

## Foundation Deliverables

- README explains stack, domain, build posture, and Discourse comparison.
- AGENTS explains human maintainability, model routing, stack conflict, and
  collaboration rules.
- Architecture doc explains domain model, roles, permissions, event log, and
  outbox.
- Rush Month MVP flow is clear for leader, member, and coach.
- Next build cycle has 8-12 clear tasks.

## Stop Rule

Do not continue into full Rush Month implementation until Nick approves the next
goal.
