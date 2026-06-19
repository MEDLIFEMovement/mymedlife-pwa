# MED-471 Phase 2 Safe Prep Packet

Date: 2026-06-19

Status: safe prep can proceed while PR #94 is under Kiomi/DS review. Live
infrastructure, live auth, live writes, migrations, credentials, proof uploads,
production deploys, and external automation remain blocked.

Review packet order:

1. Review PR #94 first as the main Phase 1 MVP packet.
2. Use `/admin/review-path`, `/admin/nick-review`, `/admin/launch-gate`, and
   `/admin/database-security` to confirm the current MVP and review boundary.
3. Review PR #95 and `/admin/phase-2` as a planning packet only.
4. Confirm stack, environment, auth, and secret ownership before any live work.

## Decision

Phase 2 can start now as a prep lane. It should not wait idle for PR #94 review,
but it must stay inside documentation, issue breakdown, mock-safe contracts,
tests, and owner checklists until Kiomi/DS confirms the stack and environment
path.

The committed path remains Next.js, Supabase, and Vercel through MVP and the
first live launch. A future PlanetScale/MySQL move would be a separate
architecture project, not an implicit Phase 2 change.

## Stop And Go Boundary

Allowed now:

- Break Phase 2 into clear Linear issues.
- Document auth/onboarding, RLS/security, write sequencing, and rollback needs.
- Document env vars, callback URLs, staging/prod needs, and owner tasks.
- Prepare Supabase/Vercel setup and pilot runbook checklists.
- Tighten mock-safe service contracts and tests.
- Document mock-only boundaries for external systems.

Blocked until PR #94 review and Kiomi/DS confirmation:

- Real Supabase or Vercel project setup.
- Staging or production credentials.
- Live auth or production user creation.
- Live browser writes.
- Proof uploads or Supabase Storage buckets.
- Live database migrations.
- Production deploys.
- HubSpot, Luma, Shopify, n8n, warehouse, Power BI, SMS, email, or AI writes.
- External automation.

## Linear Issue Breakdown

| Issue | Purpose | Primary owner | Status |
| --- | --- | --- | --- |
| MED-471 | Phase 2 safe prep packet and live MVP pilot boundary | Codex | In Review |
| MED-472 | Live environment setup checklist | Kiomi/DS + Codex | Backlog |
| MED-473 | Production auth and onboarding implementation | Kiomi/DS + Codex | Backlog |
| MED-474 | RLS and security release gate | Kiomi/DS | Backlog |
| MED-475 | Write promotion sequence governance | Codex + Kiomi/DS | Backlog |
| MED-476 | Write 1: membership approval | Codex + Kiomi/DS | Backlog |
| MED-477 | Write 2: leader assignment creation | Codex + Kiomi/DS | Backlog |
| MED-478 | Write 3: student action start | Codex + Kiomi/DS | Backlog |
| MED-479 | Write 4: proof metadata submission | Codex + Kiomi/DS | Backlog |
| MED-480 | Write 5: private proof upload | Kiomi/DS + Codex | Backlog |
| MED-481 | Write 6: leader proof review decision | Codex + Kiomi/DS | Backlog |
| MED-482 | Write 7: HQ proof-sharing decision | Codex + Kiomi/DS | Backlog |
| MED-483 | Write 8: points and KPI ledger materialization | Codex + Kiomi/DS | Backlog |
| MED-484 | Write 9: SLT checklist completion | Codex + Kiomi/DS | Backlog |
| MED-485 | Write 10: staff chapter decision and coach note path | Codex + Kiomi/DS | Backlog |
| MED-486 | Pilot support runbook and rollback drill | Nick + Kiomi/DS + Codex | Backlog |

## Environment Checklist

Local:

- Keep mock mode as the default review path.
- Keep local Supabase reads/writes behind explicit local-only flags.
- Keep fake local actor emails available for reviewer walkthroughs until real
  auth is approved.
- Keep `.env.local` secrets out of source control.

Staging:

- Kiomi/DS creates or approves the staging Supabase project.
- Kiomi/DS owns staging anon and service-role key handling.
- Codex wires staging only after approved env vars exist.
- DS/security confirms migrations, seeds, RLS, storage policies, and backups.
- Vercel preview/staging env vars are configured outside source control.
- A stable staging URL is named for staff dry run and security review.

Production:

- Kiomi/DS creates or approves the production Supabase project.
- Production service-role keys stay server-only and are not exposed to browser
  code.
- Vercel production env vars are configured by the owner of production secrets.
- Production auth callbacks and redirects are explicitly approved.
- Monitoring, backups, rollback, and incident ownership are named before pilot.

Required env/callback topics:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only service key storage, if a server path later requires it
- Supabase Auth callback URL for local
- Supabase Auth callback URL for Vercel preview/staging
- Supabase Auth callback URL for production
- Post-login role route for member, leader, coach/staff, admin, DS admin, and
  super admin

## Auth And Onboarding Plan

The future live flow remains:

1. User signs in with Supabase Auth.
2. Callback creates or finds exactly one app profile for that auth user.
3. User requests to join a chapter.
4. President/VP approves chapter membership.
5. President/VP assigns chapter-scoped roles.
6. Admin/Super Admin assigns coach portfolio relationships.
7. Super Admin assigns staff roles.
8. Server actor context is derived from auth/session state instead of local
   preview email.
9. Meaningful auth/onboarding changes create structured events and audit rows.

Before coding live auth, approve:

- Sign-in provider and email/domain assumptions.
- Profile creation and duplicate handling.
- Join request UX.
- Membership approval owner and fallback owner.
- Chapter role assignment owner.
- Coach assignment owner.
- Staff role assignment owner.
- Support and rollback owner.

## RLS And Security Test Plan

Before each write promotion, prove:

- Default deny posture for app tables.
- Role and chapter isolation.
- Direct table writes are denied.
- Approved RPC/function writes succeed only for authorized actors.
- Audit rows persist with actor, target, before/after state, and reason.
- Duplicate/error states do not create duplicate truth.
- Storage policies are approved before private proof upload.
- Service-role secrets never reach browser code.
- CI or documented local/staging evidence is attached to Linear/GitHub.

Supabase-specific review notes:

- Keep business tables in the `app` schema with RLS enabled.
- Pair Data API access with explicit grants and RLS, not implicit trust.
- Treat views carefully; use security-invoker behavior where a view must obey
  the caller's RLS.
- Storage uploads require policies on `storage.objects`; no proof upload is
  approved until those policies are reviewed.

## Write Promotion Sequence

Only one write is promoted at a time. Every write requires staging proof,
RLS/security coverage, audit readback, duplicate/error handling, rollback, and
Linear/GitHub evidence before the next write is enabled.

| Order | Issue | Write | Must stay disabled unless separately approved |
| --- | --- | --- | --- |
| 1 | MED-476 | Membership approval | Welcome send, CRM sync, external automation |
| 2 | MED-477 | Leader assignment creation | Reminders and external automation |
| 3 | MED-478 | Student action start | Points materialization, proof upload, reminders |
| 4 | MED-479 | Proof metadata submission | File uploads, public publishing, AI summaries |
| 5 | MED-480 | Private proof upload | Public URLs, publishing, external exports |
| 6 | MED-481 | Leader proof review decision | HQ sharing, public publishing, external sends |
| 7 | MED-482 | HQ proof-sharing decision | Public publishing, social sharing, AI summaries |
| 8 | MED-483 | Points and KPI ledger materialization | Warehouse/Power BI export |
| 9 | MED-484 | SLT checklist completion | Shopify, HubSpot, Luma, flight/form writes |
| 10 | MED-485 | Staff chapter decision and coach note path | Member nudges, escalation packets, HubSpot/n8n sends |

## Pilot Scope And Runbook

The first live pilot stays intentionally small:

- One chapter.
- Five to fifteen students.
- One chapter leader owner.
- One coach owner.
- One HQ/admin owner.
- One DS owner.
- Manual-first event attendance and NPS unless a narrow Luma read/import path is
  separately approved.

Before invitations:

- Staff dry run is complete.
- Phone/tablet/desktop staging smoke is complete.
- Accessibility pass is complete.
- Rollback drill is complete.
- Support rota and escalation channel are named.
- Stop conditions and student communication plan are approved.
- Nick gives final go/no-go.

## Mock-Only Boundaries

- HubSpot remains CRM/follow-up reference only.
- Luma remains event registration/attendance reference only unless a read/import
  path is approved.
- Shopify remains SLT payment status reference only.
- n8n can later consume approved outbox events, but it is not source of truth.
- Warehouse/Power BI remain downstream analytics only.
- AI recommendations must be logged, bounded, and never unsupervised.
- Proof/UGC publishing requires consent, moderation, takedown, deletion, and
  public/private separation.

## Owner Tasks

Nick:

- Confirm pilot scope.
- Choose final go/no-go.
- Name the launch decision owner and support owner.

Kiomi / DS:

- Confirm stack/environment path.
- Own Supabase and Vercel project setup.
- Own production credentials and key handling.
- Approve RLS/storage/security posture.
- Approve backup, monitoring, and incident expectations.

Codex:

- Keep building mock-safe code, tests, docs, and route/state wiring.
- Add live code only after the relevant Linear issue is unblocked.
- Update Linear and GitHub after each completed item.
- Keep external integrations disabled unless explicitly approved.

## Open Questions

For Kiomi / DS:

- Are we confirmed on Next.js, Supabase, and Vercel through MVP and first live
  launch?
- Who will own Supabase and Vercel production keys?
- Should staging use a separate Supabase project or a Supabase branch/project
  pattern?
- Which sign-in providers and callback domains are approved?
- What monitoring, backup, and incident tooling should be used for pilot?

For Nick:

- Which chapter should be the first pilot chapter?
- Who are the pilot leader, coach, HQ/admin, and DS owners?
- What is the stop condition for pausing the pilot?

## Next Implementation Goal

After Kiomi/DS reviews PR #94 and confirms the environment path, start MED-472,
MED-473, and MED-474 together as a controlled foundation lane. Do not start
MED-476 or any later write ticket until the foundation lane has staging, auth,
RLS/security, audit, and rollback evidence.

## Official References Checked

- [Supabase server-side auth client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase row level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase changelog](https://supabase.com/changelog)
- [Vercel environments](https://vercel.com/docs/deployments/environments)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Managing Vercel environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [Vercel deployment protection](https://vercel.com/docs/deployment-protection)
