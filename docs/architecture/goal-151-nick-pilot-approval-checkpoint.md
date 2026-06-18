# Goal 151: Nick Pilot Approval Checkpoint

## Purpose

Goal 151 tightens `/admin/nick-review` into the final local checkpoint before a
pilot decision. The route already gathered member, leader, coach, DS/security,
design QA, launch, and operations review items. This goal adds the missing
pilot-scope decision and names the Goal 150 launch evidence checklist directly
inside Nick's final packet.

## What It Adds

- A new Nick review item for `/admin/pilot-scope`.
- Goal 150 launch evidence language inside the `/admin/launch-gate` Nick review
  item.
- A final decision prompt that asks whether launch evidence, pilot group,
  support owner, and stop rules are named.
- Route-smoke and release-readiness text that treats `/admin/nick-review` as the
  Goal 151 pilot approval checkpoint.
- Tests proving the packet now contains nine review items, five launch-blocked
  items, pilot scope, and zero writes/sends/invitations.

## Safety Boundary

This goal is read-only.

It does not:

- approve live launch
- enable production auth
- create production users
- enable browser writes
- upload proof
- publish public proof
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- invite real students
- approve broad launch

## Review Path

Open `/admin/nick-review` as `admin@mymedlife.test`,
`ds.admin@mymedlife.test`, or `super.admin@mymedlife.test`.

The page should show:

- member flow
- leader flow
- coach flow
- DS/security posture
- Goal 150 launch evidence
- pilot scope
- design QA
- operations support
- `local review yes`
- `live launch no`
- `0` writes
- `0` sends
- `0` student invitations

## Next Step

Nick should review this packet with `/admin/review-path`, `/admin/launch-gate`,
`/admin/pilot-scope`, `/admin/design-qa`, `/admin/database-security`, and
`/admin/operations` before any staging, pilot, write, upload, external send, or
student invitation approval.
