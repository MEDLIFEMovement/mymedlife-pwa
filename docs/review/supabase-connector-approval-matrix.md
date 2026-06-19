# Supabase Connector Approval Matrix

Date: 2026-06-19

Purpose: give Kiomi, DS, Nick, and Renato one clear source of truth for what
the myMEDLIFE Supabase connector can do today, what remains blocked, and what
must be explicitly approved before any live implementation starts.

## Current Read

The Supabase connector is working in this thread and can see a hosted project
named `myMEDLIFE`.

- Project ref: `rceupryepjgkdeqgxzrc`
- Region: `us-east-1`
- Status: `ACTIVE_HEALTHY`
- Environment identity: unknown from the connector alone

The connector is not a lightweight browser read. It can execute SQL as
`postgres`, which means it has database-owner style power and must be treated as
an admin console, not a safe default app client.

## Plain-English Summary

Right now the connector is useful for inspection only.

It is safe to use for:

- checking what project exists
- checking whether tables, policies, functions, triggers, and buckets exist
- checking counts and schema shape
- comparing the hosted project against repo migrations
- collecting review evidence for PRs and Linear

It is not safe to use without explicit approval for:

- changing the database
- changing security rules
- changing auth
- changing storage
- uploading files
- writing user or chapter data
- enabling real integrations or automation

## Technical Summary

Confirmed connector capabilities in this thread:

- read project metadata
- read schema
- read data
- run SQL
- apply migrations
- deploy Edge Functions
- create projects
- create branches
- pause or restore projects

Current permission evidence:

- `current_user = postgres`
- `session_user = postgres`

This means the connector should be treated as admin-capable.

## Remote State Observed Read-Only

The hosted project currently looks closer to a fresh Supabase project than to
the repo's app-schema migrations.

Read-only findings:

- `public` base tables: `0`
- `auth.users` count: `0`
- storage buckets: `0`
- storage objects: `0`
- app-specific repo tables: not present
- app-specific policies: not visible

Repo migrations expect a populated `app` schema with:

- profiles
- chapters
- roles
- memberships
- campaigns
- assignments
- evidence items
- approvals
- points events
- KPI events
- integration outbox
- audit logs
- additional campaign and review tables

So the hosted project does not currently match the repo migrations.

## Allowed Read-Only Actions Now

- list projects and inspect project metadata
- read project URL, status, and version
- run read-only catalog SQL against schemas, tables, columns, indexes,
  functions, triggers, policies, buckets, and counts
- run Supabase security advisors
- compare the hosted schema posture to repo migrations
- summarize findings in PRs, docs, and Linear

## Blocked Until Approval

These actions stay blocked until Nick, Kiomi, and DS explicitly approve the
live lane:

- applying migrations
- any SQL that writes, alters, drops, grants, revokes, or deletes
- changing RLS policies
- changing auth settings
- changing storage policies
- uploading files
- deploying Edge Functions
- creating Supabase branches or projects
- writing user, chapter, campaign, assignment, event, or proof data
- enabling browser writes
- enabling HubSpot, Luma, Shopify, n8n, warehouse, Power BI, SMS, email, or AI
  writes

## Approval Questions

Kiomi / DS need to answer these before any live implementation begins:

1. What environment is project `rceupryepjgkdeqgxzrc`?
   - staging
   - production
   - another environment

2. Should the connector remain read-only until further approval?

3. Who owns:
   - Supabase project administration
   - Vercel project administration
   - production keys
   - callback-domain approval
   - rollback and incident ownership

4. What is the first approved live lane?
   - schema and environment setup
   - auth
   - one narrow write path
   - staging-only work
   - another explicitly named lane

5. What evidence is required in GitHub and Linear before a live lane can start?

## Approval Matrix

| Area | Current state | Allowed now | Needs approval before live use |
| --- | --- | --- | --- |
| Project identity | Hosted project visible, environment label unknown | Read-only inspection | Confirm staging vs production |
| Schema comparison | Repo and hosted project do not match | Read-only comparison | Approval before migrations |
| SQL access | Admin-capable | Read-only SQL only | Any write SQL |
| RLS and policy review | Safe to inspect | Read-only catalog checks | Any policy change |
| Auth | No app users visible | Read-only inspection | Any auth or user change |
| Storage | No buckets or objects visible | Read-only inspection | Buckets, policies, uploads |
| Edge Functions | None visible | Read-only inventory | Any deploy |
| External integrations | Mock-only | Documentation and review only | Any live enablement |

## Evidence Standard For PRs And Linear

Every connector-backed review note should include:

- project ref inspected
- date of inspection
- whether environment identity is confirmed or still unknown
- what was inspected
- counts and schema-level facts only
- no private row contents
- explicit statement that no remote writes were performed

## Recommended Policy For Phase 2

Until live implementation is explicitly approved:

- use the connector only for read-only inspection and comparison
- do not apply migrations
- do not write data
- do not change RLS
- do not change auth
- do not change storage
- do not deploy functions
- do not create branches or projects
- do not touch production configuration

The local Docker + Supabase path remains the correct place for reproducible
database tests. The connector is for hosted-environment visibility only.
