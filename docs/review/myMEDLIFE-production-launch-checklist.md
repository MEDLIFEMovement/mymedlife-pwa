# myMEDLIFE Production Launch Checklist

Date: 2026-06-25

Status:
- review-ready staging, not live-ready
- production launch is still blocked by external approvals and hosted proof

## What Is Already Proven In Repo

- Role-based shells exist for member, leader, staff, admin, and SLT Prep.
- Login and route guards keep workspace access role-aware.
- Launch-readiness surfaces exist for production gate, release readiness, pilot readiness, design QA, system health, and operations.
- Tests and build are green in the current worktree.
- The app keeps HubSpot, Luma, Shopify, n8n, warehouse, Power BI, SMS, email, and AI writes disabled by default.

## What Still Blocks Live Pilot

1. Capture staging reviewer proof on the approved access path.
2. Record the named pilot owners.
3. Approve the first hosted write.
4. Prove the smallest hosted proof/review loop.
5. Confirm the production environment path for Supabase, Vercel, domain/DNS, secrets, and backup/restore.
6. Confirm monitoring, incident response, and support ownership.
7. Keep all external integrations disabled until a later approval gate.

## Production Launch Order

### 1. Environment ownership

- Create or confirm production Supabase.
- Create or confirm production Vercel project and environment variables.
- Confirm domain and DNS ownership.
- Confirm secret ownership and backup/restore posture.

### 2. Access and auth

- Capture hosted staging proof for the approved reviewer path.
- Approve production auth callbacks and role routing.
- Verify member, leader, staff, admin, and SLT Prep access boundaries.

### 3. Safety gates

- Prove RLS and security checks.
- Confirm audit rows are written for every approved write path.
- Confirm proof storage and consent policy.
- Confirm device, accessibility, and offline/PWA review.

### 4. Pilot write path

- Approve the narrowest safe first hosted write.
- Keep the first proof/review loop small.
- Keep uploads and external sends disabled until explicitly approved.

### 5. Controlled pilot

- Start with one chapter.
- Limit the pilot to the smallest named cohort.
- Keep support, pause, and rollback ownership explicit.
- Review pilot results before any expansion.

## Human Decisions Still Needed

- Nick: pilot scope and launch decision
- Kiomi: hosted proof review and launch gate approval
- DS: external integration hold, environment ownership, and security posture
- HQ ops: pilot support and pause channel
- Pilot primary approver: pause authority and rollback authority

## Rule Before Launch

Do not treat repo readiness as launch approval.
Do not enable live external sends or broad writes until the human approvals above are recorded and the hosted proof is visible.
