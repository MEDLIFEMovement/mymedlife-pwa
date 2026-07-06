# Luma Pilot Event Proof Data Request Template

Use this only after the approved chapter slate exists and the pilot-event gap
report shows exactly which Luma fields are still missing.

This is a preparation template, not an access request and not a send action.
Do not use it to request access yet. Do not use it to write production data.

## Why We Would Ask

Luma can help confirm chapter calendar mapping and pilot event facts for the
five-chapter proof, but it does not by itself approve invites or replace:

- myMEDLIFE/Supabase as operational truth
- rollout packet approval
- live production data count proof
- signed-in route proof
- audit/outbox zero-send proof
- final invite gate approval

## Preferred Path: Static Export First

Ask for a static export first. A CSV or sheet export is the cleanest way to
review the minimum data without opening a provider connection.

Minimum fields to request:

- calendar id
- calendar name
- event id
- event name
- event URL
- event start time
- event end time
- chapter mapping key or chapter/school mapping
- RSVP count or guest count, if available and approved
- checked-in or attendance count, if available and approved
- last updated timestamp or export timestamp
- owner/exporter
- source file name

## Fallback: Read-Only API Access Only If Export Is Not Enough

If a static export is missing fields that are still required for review, ask
for read-only API access only.

Keep the request narrow:

- read-only calendar, event, and guest lookup only
- no event create/update/delete
- no reminders
- no messaging
- no webhooks
- no write scopes

## Explicit Exclusions

Do not ask for or include:

- event creation, update, or delete access
- reminders or notification sends
- webhooks
- write scopes
- API keys in CSVs, browser fields, or shared docs
- sensitive guest details beyond the approved launch proof fields
- any data that would let Luma mutate launch evidence on its own

## What Luma Can Help Prove

Luma can support:

- which chapter maps to which calendar
- whether the approved pilot event existed
- whether RSVP or guest counts were present
- whether attendance or check-in counts were present
- when the export was taken

That is useful evidence, but it is still support evidence only.

## What Luma Cannot Prove By Itself

Luma should not be treated as proof of:

- member route access
- leader route access
- staff or admin route access
- production user creation
- memberships
- points ledger truth
- audit log truth
- outbox zero-send truth
- final invite gate readiness

If the evidence cannot be tied back to the app, audit, or outbox path, it does
not count as launch proof.

## When To Request It

Ask only when all of these are true:

- the 30-chapter slate is approved
- the pilot-event gap report identifies the exact missing Luma fields
- the ask can stay static-export-first or read-only only

Do not ask early just because Luma might be useful later.

## Plain-English Copy/Paste Ask

> We are preparing the myMEDLIFE rollout evidence for the five-chapter pilot.
> Please share a static export first for the approved chapter/event data, and
> only if the export is insufficient, provide a limited read-only Luma access
> path.
>
> We only need the fields needed for mapping and pilot proof: calendar id,
> calendar name, event id, event name, event URL, event start and end time,
> chapter mapping key, RSVP or guest count if approved, checked-in or
> attendance count if approved, last updated or export timestamp, owner or
> exporter, and source file name.
>
> Please do not include event mutation access, reminders, webhooks, write
> scopes, API keys, sensitive guest details beyond the approved fields, or any
> access that could mutate launch evidence.

## Fit To The Rollout Matrix

- Rollout packet / 30-chapter data packet: helps only if Luma mapping fields are
  missing.
- Human handoff / launch owners: no direct impact.
- Invite batch readiness: can help validate chapter/event alignment.
- Live production data count proof: no impact.
- Signed-in route proof imports: no impact; this proof must come from the app.
- Final invite gate readiness: supports event mapping inputs only and never
  substitutes for the gate.

## Safety Reminder

This template does not approve invites, replace returned owner CSVs, replace
live production counts, replace signed-in route proof, or replace the final
invite gate.
