# Pilot Event Proof And Luma Evidence Template

Use this after the five pilot chapters are chosen and the team is ready to
collect real event-loop proof.

This is a preparation guide only. It does not request Luma access, does not
write production data, does not create users, and does not approve invites.

## What This Is For

This guide helps Nick and the rollout team collect the right evidence for the
five-chapter pilot without needing to understand packet-building details.

Each pilot chapter must show that the event loop worked in a real, reviewable,
no-send-safe way:

- the chapter had an approved event
- members could see the event
- RSVP activity existed
- attendance or check-in existed
- points read back correctly
- audit evidence was recorded
- outbox or send posture stayed zero-send or blocked
- a real reviewer signed off with a timestamp

## What Each Pilot Chapter Must Prove

For each of the five pilot chapters, collect evidence for all of these:

- chapter id and chapter name
- approved Luma calendar mapping or approved event source
- event id and event name
- member event route proof
- leader event route proof
- RSVP count proof
- attendance or check-in proof
- points readback proof
- audit proof
- outbox zero-send proof
- reviewer name or reviewer email
- checked-at timestamp
- support owner
- rollback owner

If even one of these is missing, the chapter should not count as ready.

## What Luma Can Help With Later

If the team later asks for a static export or read-only Luma access, useful
fields are:

- calendar id
- calendar name
- chapter or school mapping
- event id
- event name
- event URL
- event start time
- event end time
- event timezone
- RSVP or guest count
- RSVP status, if available
- attendance or check-in count, if available
- export timestamp or last updated timestamp
- owner or source-of-truth contact

This is enough to support chapter mapping and event proof review.

## What Luma Must Not Be Treated As

Luma does not replace myMEDLIFE evidence. Even with a clean export, Luma should
not be treated as proof of:

- member route access
- leader route access
- staff or admin route access
- production user creation
- memberships
- points ledger truth
- audit log truth
- integration outbox truth
- zero-send safety by itself
- final invite approval

Luma can support mapping and event facts. myMEDLIFE still owns the real launch
proof.

## What Must Still Come From myMEDLIFE

These items must remain myMEDLIFE-owned evidence:

- route proof from real app paths
- RSVP readback in the app or approved packet flow
- attendance or check-in readback in the app or approved packet flow
- points readback in the app
- audit log proof
- outbox proof showing zero unapproved external sends
- reviewer identity tied to a real launch user
- checked-at timestamp
- final invite gate status

If the evidence cannot be tied back to the app, audit, or outbox path, it
should not count as launch proof.

## What Should Never Count As Proof

Do not count any of these by themselves:

- screenshots with no supporting row or route
- Figma examples
- Test rows
- sandbox rows
- SOP sample rows
- preview-cookie behavior
- staging-only data
- fake attendees
- placeholder emails
- guessed chapter mappings
- reminder-send screens
- exported attendee contact lists used as proof by themselves

These can help people talk about the rollout, but they do not prove that the
launch lane is ready.

## Suggested File Naming

Keep returned pilot materials grouped by chapter and review date.

Suggested folder pattern:

```text
pilot-proof-returns/YYYY-MM-DD/<chapter-slug>/
```

Suggested file names inside each chapter folder:

```text
luma-export.csv
pilot-proof-review.md
route-proof-links.md
audit-outbox-review.md
notes.txt
```

If one export covers all five chapters, keep it at the day folder level:

```text
pilot-proof-returns/YYYY-MM-DD/luma-export-all-pilot-chapters.csv
```

Keep names simple and stable. Do not include secrets, passwords, tokens, or
private notes in file names.

## Plain-English Team Checklist

Use this checklist before anyone says a pilot chapter is ready:

1. Is this one of the approved five pilot chapters?
2. Do we have the right chapter-to-Luma calendar mapping?
3. Do we have a real event id and event name?
4. Can a member route prove the event was visible?
5. Can a leader route prove the event was visible?
6. Is there at least one RSVP?
7. Is there at least one attendance or check-in?
8. Do points match the checked-in count?
9. Is audit evidence recorded?
10. Does outbox review show zero unapproved external sends?
11. Did a real reviewer sign off?
12. Do we have a checked-at timestamp?
13. Are support and rollback owners named?

Only mark a chapter ready when the answer is yes for every line above.

## When To Ask For Luma Export Later

Do not ask for Luma access now.

Ask later only when all of these are true:

- the 30-chapter slate is approved
- returned owner packet intake makes the remaining event-proof gaps clear
- the team knows exactly which mapping or event fields are missing
- the ask can stay static-export-first or read-only only

## Safety Reminder

This template does not approve invites, replace returned owner CSVs, replace
live production counts, replace signed-in route proof, or replace the final
invite gate.
