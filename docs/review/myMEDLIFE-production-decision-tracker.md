# myMEDLIFE Production Decision Tracker

Date: 2026-06-26

Status:
- review-only
- defaults approved in chat

## Purpose

This tracker condenses the remaining launch decisions into one place so the team
can see what is already known, what is still pending, and what reply would move
the packet forward.

## Current Reply

The current packet defaults are approved by the primary approver in chat. That
means the review packet can keep using the approved defaults unless a named
approver changes a field later.

The current reviewer has also confirmed they are the pilot owner and rollback
owner. That removes one of the biggest ownership gaps and leaves the packet
focused on the launch coordination details rather than the core go/no-go
decisions.

## Current Decisions

| Item | Current evidence | Reply needed | Owner lane |
| --- | --- | --- | --- |
| Staging reviewer access path | `staging.mymedlife.org` behind Vercel SSO is the approved reviewer path. | None; default approved. | Security / HQ |
| Pilot chapter and cohort | One chapter only, small and controlled. | None; default approved. | Nick / HQ |
| Support / pause channel | One dedicated launch Slack channel with email backup and the primary approver as pause authority is approved. | None; default approved. | HQ ops |
| First hosted write | `action_started` is the approved first hosted write. | None; default approved. | Engineering / Product |
| Smallest proof/review loop | Metadata submit -> leader review -> audit trail is the approved loop. | None; default approved. | Chapter / HQ |
| Luma event loop | The first event loop is Luma-backed: event create/update, RSVP writeback, attendance import, points and leaderboard readback, with no n8n or broad external sends. | Hosted staging proof is recorded; remaining work is final signoff plus production environment and owner readiness. | Events / DS |
| Production environment ownership | DS/platform owns production Supabase, Vercel, DNS, secrets, and backup/restore; security approval is routed through GitHub/Copilot/Codex Security. | None; default approved. | Platform / Security |
| Monitoring and incident response | One named incident owner, one backup owner, one pilot alert channel, and the existing rollback path as the stop mechanism are approved. | None; default approved. | Platform / Operations |
| External integration hold | HubSpot, Shopify, n8n, warehouse, Power BI, SMS, email, AI, and non-approved Luma behavior stay off. | None; default approved. | DS |

## What Would Count As Progress

- The staging access path, pilot scope, first hosted write, proof/review loop, production ownership, external integration hold, support / pause, and monitoring / incident response defaults are approved.
- Hosted proof is recorded for the approved narrow write, proof/review path, and Luma event/RSVP/attendance/points loop.
- The next production-facing work is environment ownership, callbacks, DNS, backups, support coverage, and live-pilot go/no-go discipline.

## What This Does Not Do

- It does not approve live launch.
- It does not change any write, upload, or external-send setting.
- It does not replace the approval request or the staging access guide.
