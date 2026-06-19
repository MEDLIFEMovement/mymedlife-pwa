# 03 · Non-Functional Requirements & System Architecture

*Part of the MEDLIFE AI Project Documentation Kit · Complete alongside or after the User Stories document*

---

## What Are Non-Functional Requirements?

User stories describe **what** the system does. Non-functional requirements describe **how well** it does it.

These matters just as much as features. A platform that works but loses data, runs slowly, or is hard to maintain will fail in the field.

---

## Non-Functional Requirements

### ⚡ Performance

| Requirement | Target | Notes |
|------------|--------|-------|
| Page load time | < 3 seconds on a standard mobile connection | Core screens (`/chapter`, `/coach`, `/admin`) should remain usable under moderate packet loss |
| API response time | < 500ms for list/detail reads on local seeded data | 95th percentile target on local dev + CI smoke checks |
| Concurrent users supported | 200+ concurrent sessions per chapter campaign view | Early target for pilot environments |
| Mobile interaction latency | < 200ms for key taps and route transitions | Important for field use during event windows |

### 🔒 Security & Privacy

| Requirement | Description |
|------------|-------------|
| Authentication | Supabase Auth for identity mapping, with local actor simulation mode for local-only testing. |
| Authorisation | Role-based access by chapter and role (`member`, `leader`, `coach`, `admin`, `DS admin`, `super admin`) with explicit read-only defaults in current phase. |
| Data encryption | HTTPS in transit, encrypted DB storage through managed provider defaults. |
| PII handling | Personal data used only in app-scoped tables/services needed for role lookup and proof review; no raw exports by default. |
| Compliance | Respect local data-retention and access controls; keep production writes disabled until manual approval gates pass. |

### 🏗️ Reliability & Availability

| Requirement | Target |
|------------|--------|
| Uptime | 99.5% monthly availability target for pilot environment | Includes route availability and auth health checks |
| Backup frequency | Daily backup for state tables + nightly backup verification | Supabase-managed backups + periodic restore drill checks |
| Recovery time | Restore critical read paths within 4 hours | Non-production posture can be reduced later but must be proven. |
| Error handling | Friendly, non-leaky error messages for users; structured logs for support triage. |

### 📱 Compatibility

| Requirement | Description |
|------------|-------------|
| Device support | Mobile-first, responsive in recent iPhone/Android form factors | iOS Safari and Android Chrome tested |
| Browser support | Recent stable Chrome, Safari, Firefox | Minimum last-2 stable releases |
| Offline capability | Route shell and mock data views should remain clear with fallback when backend is unavailable. | Real persistence work planned in next wave |
| Language | English first; Spanish-ready content blocks where copy is user-facing. | Keep localization boundaries explicit in route text layers |

### 🔧 Maintainability

| Requirement | Description |
|------------|-------------|
| Code organization | Feature-oriented structure (`features`, `services`, `lib`, `tests`) with small modules. |
| Deployment | CI-validated PR-based deployment with no manual production patching. |
| Logging | Append-only event, outbox, and audit logs for key actions and failed attempts. |
| Monitoring | PR checklists and branch-level review notes include evidence and decision checkpoints. |

## System Architecture

### Architecture Overview

The app is currently a mobile-first role-aware Rush Month operating surface backed by a Next.js front end and Supabase local data paths. It is in a mock-safe local-first posture: behavior is intentionally present, but production-side writes and external sends are currently disabled. The architecture is split so product safety and review can progress without requiring full production integration at this stage.

### Component Map

| Component | Type | Purpose | Technology / Tool |
|-----------|------|---------|-------------------|
| Web App | Front-end | Member, leader, coach, and admin interfaces | Next.js, TypeScript, Tailwind |
| Data Service | API layer + server logic | Route handlers and local contract utilities | Next.js route handlers + service layer |
| Database | Storage | User, chapter, assignment, evidence, and event records | Supabase Postgres |
| Auth | Service | Login/session/role identity mapping and local actor fallback | Supabase Auth |
| Audit & Events | Event stream | Internal review/audit trace of actions and outcomes | Supabase tables and local event schema |
| Integration Layer | Workflow bridge | Future external sync orchestration plan (HubSpot, Luma, n8n, etc.) | Outbox + AutomationEvent patterns |
| Storage | File layer | Media and proof-related assets (planned/disabled in current phase) | Supabase Storage (planned) |
| Monitoring | Observability | QA/review evidence and safety posture checks | App-level checks + code review checklist |

### Data Flow Diagram

```mermaid
flowchart LR
  actor[User
(Member / Leader / Coach / Admin)] -->|Browse UI| web[Next.js App]
  web -->|read queries| supa[Supabase Read Paths]
  web -->|simulated write requests| gate[Write Readiness Gate]
  gate -->|blocked currently| preview[Result Preview + Audit Draft]
  supa -->|events| db[(Postgres)]
  db --> log[(IntegrationEvent + AuditLog + outbox)]
```

### Integration Points

| From | To | Data Sent | Trigger | Notes |
|------|----|-----------|---------|-------|
| App actions | IntegrationEvent | Structured action payloads | Any completed review/decision intent | Read-only by default in current phase |
| App actions | AutomationOutbox | Job-ready event envelope | Optional staging for future worker pickup | Currently stays local/staged |
| Admin controls | AuditLog | Actor + reason + before/after summary | Manual review and gated actions | Required for review trace |
| Local test tooling | Smoke check manifests | Route results and regression evidence | CI + reviewer checks | Keeps launch sequence reproducible |

### Environments

| Environment | Purpose | URL / Location |
|------------|---------|----------------|
| Production | Live platform target (currently gated) | `https://www.myMEDLIFE.org` |
| Staging | Pilot/review environment for team handoff | `https://mymedlife.vercel.app` |
| Development | Local build + data-backed local dev | `localhost:3000` |
| Test | CI + automated route and service checks | GitHub Actions + local test harness |

### Decisions Log

| Decision | Option Chosen | Reason | Date |
|----------|--------------|--------|------|
| Database platform | Supabase (Postgres + PostgREST/Auth/RLS) | Strong row-level security, evented schema pattern, outbox model fit | 2026-06-15 |
| App stack | Next.js + TypeScript + Tailwind | Existing repo baseline + stable team onboarding path | 2026-06-15 |
| Delivery pattern | Read-only local-first + staged write gates | Reduces risk while feature coverage grows before real writes | 2026-06-16 |
| External actions | Keep writes to HubSpot/Luma/warehouse disabled | Safety, governance, and approval requirements not yet finalized | 2026-06-16 |
