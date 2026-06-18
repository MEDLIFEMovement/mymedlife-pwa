# Goal 150: Launch Evidence Checklist

## Purpose

Goal 150 adds a focused launch evidence checklist to `/admin/launch-gate`.
The checklist turns staging and pilot-readiness questions into named evidence
items without approving launch, production auth, browser writes, proof uploads,
external sends, or student invitations.

## What It Adds

- `ProductionLaunchEvidenceCheck` records on the production launch gate service.
- A nine-item checklist for:
  - staging deployment URL
  - staging Supabase posture
  - auth callback and role routing
  - RLS and CI proof
  - proof storage and consent
  - device, PWA, and accessibility QA sign-off
  - monitoring, backup, and incident owner
  - external integration hold
  - pilot support owner and stop rules
- A visible Evidence count on `/admin/launch-gate`.
- A "Staging and pilot proof" section inside the launch gate panel.
- Tests proving the checklist is admin-only, write-safe, and explicit about the
  remaining evidence required before pilot approval.

## Safety Boundary

This goal is read-only.

It does not:

- approve live launch
- enable production auth
- create production users
- enable browser writes
- upload files
- publish public proof
- expose service keys
- change database vendors
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- invite real students

The checklist must keep `launch no`, `0 writes`, and `0 sends` visible.

## Review Path

Open `/admin/launch-gate` as `admin@mymedlife.test`,
`ds.admin@mymedlife.test`, or `super.admin@mymedlife.test`.

The page should show:

- eight production launch gates
- nine launch evidence checks
- staging and pilot proof
- launch `no`
- `0` writes
- `0` sends

Chapter members, chapter leaders, and coaches should not see the launch evidence
checklist.

## Next Step

Before a pilot is approved, Nick, HQ, DS, engineering, security, product design,
and launch operations should collect the checklist evidence for staging,
Supabase/RLS, auth, proof storage, device QA, monitoring, integration holds, and
pilot support ownership.
