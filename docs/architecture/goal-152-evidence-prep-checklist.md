# Goal 152: Evidence Prep Checklist

## Purpose

Goal 152 makes `/rush-month/evidence` a clearer member-facing proof preparation
surface. The route already showed the next proof item, submission queue, proof
status, future structured records, and blocked write posture. This goal adds the
story prompt, prep checklist, review lane, proof-intake link, and disabled
controls for every visible evidence row.

## What It Adds

- Reuses the action proof handoff service from action detail pages.
- Adds proof prep fields to each evidence submission row:
  - story prompt
  - preparation checklist
  - review lane
  - proof-intake link and label
  - disabled controls
- Updates `/rush-month/evidence` so the recommended proof item points to the
  proof-intake preview, not just the action detail.
- Shows disabled proof metadata save, file upload, public publish, and external
  send controls on each row.
- Goal 158 adds the recommended proof submission packet with metadata payload,
  result preview, readiness checks, structured event, disabled outbox, and audit
  action.
- Adds tests for the member next-proof packet, leader changes-requested packet,
  coach read-only posture, and DS Admin restriction.

## Safety Boundary

This goal is read-only.

It does not:

- save proof metadata
- upload files
- publish proof
- write points or KPIs
- send reminders
- export proof
- run AI summaries
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- invite real students

## Review Path

Open `/rush-month/evidence` as `member.a@mymedlife.test`.

The page should show:

- next proof item
- story prompt
- prep checklist
- proof-intake preview link
- review lane
- disabled write/upload/publish/send controls
- future structured records
- blocked writes
- Goal 158 proof submission packet

Leaders can also review changes-requested proof. Coaches, Admin, and Super Admin
can inspect posture. DS Admin remains out of student proof truth.
