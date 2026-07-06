# Luma Rollout Data Request Template

Use this only after the 30-chapter slate is approved for packet assembly and
the owner-return gap report proves which Luma fields are still missing. This is
a preparation template, not an access request and not an implementation plan.

## Why We Are Asking

Luma can support the rollout packet by confirming chapter calendar mapping and
five-chapter pilot event proof, but it does not by itself approve invites or
replace:

- myMEDLIFE/Supabase as operational truth,
- packet apply and production change approvals,
- live production data count proof,
- signed-in route proof,
- outbox/audit evidence,
- final invite gate.

## Option A: Static Export First (Preferred)

Preferred ask: share a static export (CSV/Sheet) of approved rollout data only.
This is the first choice because it keeps the request read-only and easy to
review.

Minimum fields to request:

- calendar id
- calendar name
- chapter/school mapping
- chapter mapping key, if that is the field Luma actually uses
- event id
- event name
- event URL
- event start time
- event end time
- event timezone
- RSVP or guest count/status if already approved
- check-in/attendance count if already approved
- last updated or export timestamp
- owner/source-of-truth contact

## Option B: Read-Only API Access (Only if Static Export Is Insufficient)

If static export is not available or misses fields still required to move
forward, ask only for read-only API access needed to fetch the minimum fields
above.

Keep scope tight:

- read-only event/list/calendar view access only
- no write actions
- no webhooks
- no reminder/notification or event mutation permissions
- no guest-contact export beyond the approved rollout fields

## Explicitly Exclude

- event create/update/delete
- event reminders or notification sends
- webhooks
- attendee contact details unless separately approved
- any API keys/secrets in docs, sheets, or CSVs
- write scopes
- automation that notifies students
- anything that can mutate Luma data

## Plain-English Copy/Paste Ask

> We are preparing the first myMEDLIFE rollout packet. Please share a static export for rollout-confirmed chapter calendar and pilot event data first, and only if export is insufficient, provide a limited read-only Luma access path.
>
> We only need the fields needed for mapping and pilot proof: calendar id/name, chapter/school mapping, event id/name/URL, start/end time with timezone, RSVP/guest status if available, attendance/check-in count if available, last updated timestamp, and owner/source-of-truth contact.
>
> Please do not include event mutation access, reminders, webhooks, attendee contact exports, API secrets, or any write-capable scopes. This data supports rollout packet preparation only and is not a production invite approval or proof artifact.

## When to Ask

Only request Luma export/API access after:

- the 30-chapter slate is approved,
- the owner-return gap report proves the exact missing Luma fields,
- exact missing fields are known for:
  - Luma chapter calendar mapping for 30 chapters, or
  - five-chapter pilot event proof gaps (RSVP/attendance/check-in),
- the fields are needed before five-chapter pilot proof is collected.

Do not request early just because Luma might help later.

## Fit to the Rollout Matrix

- Rollout packet / 30-chapter data packet: can help only when chapter mapping
  or pilot-proof event fields are missing.
- Human handoff / launch owners: no direct impact; owner proof remains required first.
- Invite batch readiness: can improve dedupe and chapter/event validation where missing.
- Live production data count proof: no impact.
- Signed-in route proof imports: no impact; proof must come from production app routes.
- Final invite gate readiness: supports packet inputs only, never substitutes for the gate.

## Guardrails

- No provider connection changes yet.
- No provider writes.
- No invites.
- No production users.
- No production Supabase writes.
- No Luma API keys in shared artifacts.
- No mixing Luma export data with Test/Figma sandbox evidence.
