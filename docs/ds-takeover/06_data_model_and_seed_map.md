# Data Model And Seed Map

Last updated: 2026-07-07

This file explains what data structures exist and how DS should separate real production data from Test/Figma/sandbox data.

## Supabase Structure In Repo

Core files:

- `supabase/config.toml`
- `supabase/seed.sql`
- `supabase/migrations/*`
- `supabase/tests/database/*`

Important migration families:

| Area | Migration examples | Purpose |
| --- | --- | --- |
| Foundation | `20260615110000_initial_supabase_foundation.sql` | Base app schema. |
| Campaign operating model | `20260615130000_goal_7_campaign_operating_model.sql` | Campaign/action foundation. |
| Action/proof/assignment writes | `goal_14`, `goal_15`, `goal_16`, `goal_18` migrations | Early write-gated app behaviors. |
| Coach decision | `20260616120000_goal_27_coach_decision.sql` | Coach decision path. |
| Leader proof decision | `20260617010000_goal_115_leader_proof_decision.sql` | Leader proof decision path. |
| Membership approval | `20260619120000_goal_476_membership_approval_write.sql` | Membership approval write posture. |
| Private proof upload | `20260619214518_goal_160_private_proof_upload_write.sql` | Proof upload storage/write model. |
| Admin access/chapter management | `20260704191334_goal_509_admin_access_management_rpc.sql`, `20260704201401_goal_509_admin_chapter_management_rpc.sql` | Audited admin management RPCs. |
| Chapter event update | `20260706214500_goal_344_chapter_event_authoritative_update.sql` | Server-side chapter event update boundary. |

## Current Data Truth Levels

| Level | Can be used for UI review? | Can be used for production rollout proof? | Examples |
| --- | --- | --- | --- |
| Fixture/Figma data | Yes, if visibly marked. | No. | Exported shell names, fake chapters, sample events. |
| Local/Test seed data | Yes, for sandbox QA. | No. | `Test ...` people/chapters/events, `test.*@example.com`. |
| Vercel preview data | Yes, for route/check proof. | No by itself. | Preview smoke, screenshot QA. |
| Production app rows | Yes, if read through approved path. | Only with owner/reviewer evidence. | Real approved users, chapters, memberships, event proof rows. |
| External provider data | Supporting evidence only. | No unless passed through approved app/audit/outbox flow. | Luma exports, HubSpot exports. |

## Test/Figma Seed Rules

Sandbox and Figma-derived seed data must stay clearly labeled:

- `seed_family = 'figma_seed_v1'`
- `source = 'figma_seed'`
- `is_test = true`
- `environment = 'sandbox'`
- visible fake names, chapters, events, stories, and content start with `Test `
- generated login emails use `test.*@example.com`

Production evidence must reject rows with any of these markers:

- `is_test = true`
- `source = 'figma_seed'`
- `seed_family = 'figma_seed_v1'`
- visible name/title/chapter starts with `Test `
- email matches `test.%@example.com`
- payload contains `mock`, `figma_seed`, or `test_production_seed`
- integration/outbox status is `disabled`, `mock`, `mocked`, or `staging-only`

## Seed And Proof Scripts

Relevant scripts from `package.json`:

- `figma-seed:build`
- `figma-seed:proof`
- `figma-seed:exercise`
- `figma-seed:regression`
- `figma-seed:qa-bundle`
- `figma-seed:proof-separation`
- `test-production:build`
- `test-production:check`
- `test-production:seed`
- `test-production:cleanup`

These are sandbox/Test proof tools. They must not be described as production rollout proof.

## Production Rollout Evidence Still Needed

The production gate still needs:

- approved 30-chapter packet
- validated users, memberships, staff roles, coach assignments, campaigns, Luma calendars
- production data apply/readback
- production live data count proof
- signed-in route proof for real production roles
- five-chapter RSVP, attendance, points, audit, and zero-send pilot proof
- support, rollback, production apply, and final approval owners

## DS Takeover Questions To Resolve Later

1. Which DS owner approves production schema changes?
2. Which DS owner reviews RLS policy changes?
3. Which DS owner can read production counts without writing?
4. Which DS owner approves secure account invite flow?
5. Which DS owner controls production apply and rollback?
6. Which DS owner reviews provider access requests?

## Do Not Do From This Lane

- Do not apply production seed data.
- Do not create production users from raw SQL shortcuts.
- Do not use Test/Figma proof as rollout proof.
- Do not request broad provider API keys.
- Do not store or expose raw provider keys in browser routes, docs, screenshots, logs, or CSVs.
