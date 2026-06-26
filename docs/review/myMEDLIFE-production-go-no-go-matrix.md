# myMEDLIFE Production Go / No-Go Matrix

Date: 2026-06-25

Status:
- no-go for live launch
- go only after the hosted proof and named approvals below are recorded

## Summary

This matrix turns the current launch boundary into a simple approval list.
The app is review-ready, but live launch is still blocked by hosted proof and
human decisions.

## Current Decision State

| Area | Owner lane | Current status | What would clear it |
| --- | --- | --- | --- |
| Staging reviewer access path | Engineering / Security | Approved | `staging.mymedlife.org` behind the existing Vercel SSO handoff |
| Pilot chapter and cohort | Nick / HQ | Approved | One chapter only, small and controlled |
| Rollback owner | Current pilot owner / rollback owner confirmed by the reviewer | Confirmed | Packet record now matches the reviewer confirmation |
| First hosted write | Engineering / Product | Approved | `action_started` is the approved first hosted write; hosted proof still pending |
| Smallest proof/review loop | Chapter / HQ | Approved | Metadata submit -> leader review -> audit trail |
| Production environment ownership | Platform / Security | Approved | DS/platform owns production Supabase, Vercel, DNS, secrets, and backup/restore; security approval routed through GitHub/Copilot/Codex Security |
| Monitoring and incident response | Platform / Operations | Approved | One named incident owner, one backup owner, one pilot alert channel, and the existing rollback path as the stop mechanism |
| External integrations hold | DS | Approved | HubSpot, Luma, Shopify, n8n, warehouse, Power BI, SMS, email, and AI stay off |

## What Is Already True

- Role-based shells are in place for member, leader, staff, admin, and SLT Prep.
- Launch readiness surfaces exist for production gate, closeout, system health,
  operations, pilot scope, design QA, auth onboarding, and first write.
- Tests, lint, and build are green in the current worktree.
- The repo keeps live external sends and broad writes disabled by default.
- The current reviewer has confirmed they are the pilot owner and rollback owner.
- The approved defaults now cover the staging access path, pilot scope, first hosted write, proof/review loop, production ownership, and the external integration hold.

## What Must Stay True Until Approval

- No live external sends.
- No broad writes.
- No proof uploads or public proof sharing.
- No production auth claim.
- No production launch claim.

## Reviewer Reply

Reviewers can reply:

`approved as written`

Or replace only the fields they want to change.
