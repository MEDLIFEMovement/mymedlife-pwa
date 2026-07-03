# myMEDLIFE Copilot Instructions

Use these instructions for Copilot code review, Copilot coding agent work, and
Copilot Chat answers about this repository.

## Project Shape

myMEDLIFE is the dedicated MEDLIFE chapter operating system. Keep it separate
from Discourse: Discourse is reference/prototype context, not the product
source of truth.

The current launch lane is Events + Points:

- one sign-in area, with backend role/session routing after sign-in
- chapter events, RSVP, attendance, points, and leaderboards
- staff/leader views centered on events, leads, attendance, points, and
  post-event follow-up
- non-launch modules hidden behind flags or held out of launch scope

Treat the Figma mockups and existing app screens as the visual contract. Avoid
inventing new UX unless the task explicitly asks for it.

## Safety Gates

Default to mock-safe, review-safe behavior.

Block or flag changes that:

- enable production auth for real users
- enable production writes, uploads, or external sends
- send live data to HubSpot, Luma, warehouse/Data Hub, Power BI, n8n, AI
  services, SMS, or email automation
- flip safety gates from disabled to enabled without an explicit approved gate
  change
- expose secrets, service-role keys, private env vars, or production tokens to
  client code
- make a blocked action look successful instead of clearly blocked, pending, or
  approval-required

If a task requires a real external write, suggest an IntegrationEvent,
AutomationOutbox, audit log, or disabled preview path instead.

## Engineering Standards

Prefer boring, readable code that the MEDLIFE DS team can maintain.

- Keep UI, business logic, data access, schemas/types, and config separated.
- Keep functions and files small.
- Use clear names and typed boundaries.
- Validate external inputs.
- Avoid hidden side effects and clever framework-like abstractions.
- Avoid unnecessary dependencies.
- Add or update focused tests for important behavior.
- Preserve unrelated files and formatting.

Use the existing stack unless the issue explicitly approves a change:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Postgres/Auth/RLS
- Vercel
- GitHub PR workflow
- Linear issue tracking

## Review Focus

For code review, lead with issues that affect launch safety, role access,
data correctness, security, or missing tests.

Pay special attention to:

- auth/session routing and role boundaries
- Supabase RLS assumptions
- client/server separation
- event RSVP, attendance, points, and leaderboard logic
- admin feature flags and launch gates
- environment-variable handling
- mobile usability on iOS Safari and Android Chrome
- empty, blocked, pending, and error states

Do not encourage scope expansion into SOP, UGC, task, coach-program, HubSpot, or
warehouse automation unless the issue explicitly asks for that module.
