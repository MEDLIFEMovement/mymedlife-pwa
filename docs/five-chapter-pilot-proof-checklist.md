# Five-Chapter Pilot Proof Checklist

This checklist is the human-friendly version of the five-chapter pilot proof
gate. It helps the team collect the exact evidence needed for the first five
chapters before the broader invite gate opens.

This proof is about the event loop working end to end:

- event visibility
- RSVP
- attendance or check-in
- points readback
- audit log proof
- outbox zero-send proof
- named support owner
- named rollback owner

## What Each Pilot Chapter Must Have

For each of the five pilot chapters, collect:

- chapter id
- chapter name
- approved event or Luma mapping, or a read-only event URL
- member route proof
- leader route proof
- RSVP proof
- attendance or check-in proof
- points readback proof
- audit log proof
- outbox zero-send proof
- support owner
- rollback owner
- checked-at timestamp
- reviewer name or email

## Where The Evidence Can Come From

### App or Supabase

These should come from the app, the rollout packet, or approved readback data:

- member route proof
- leader route proof
- RSVP proof
- attendance or check-in proof
- points readback proof
- audit log proof
- outbox zero-send proof
- checked-at timestamp
- reviewer name or email

### Luma Export Or Read-Only Source

These can come from a static export or read-only mapping source:

- approved event or Luma mapping
- event URL
- event id
- event name

### Human Owner Review

These need a named person to confirm them:

- support owner
- rollback owner
- reviewer name or email
- whether the row is ready or needs follow-up

## What Should Not Count

Do not count any of these as pilot proof by themselves:

- event visibility without RSVP or attendance
- RSVP without attendance or points
- attendance without points readback
- points without audit proof
- any row with external sends turned on
- screenshots alone with no route or readback evidence
- Test or sandbox data
- Luma-only evidence with no app proof
- a pilot chapter that is missing support owner or rollback owner

## Per-Chapter Checklist

Use one row per pilot chapter and confirm all of these before marking it
ready:

1. The chapter is one of the approved five pilot chapters.
2. The chapter has a real event id or approved Luma mapping.
3. The member route proof passes.
4. The leader route proof passes.
5. RSVP is present.
6. Attendance or check-in is present.
7. Points readback matches the attendance count.
8. Audit log proof is recorded.
9. Outbox proof shows zero unapproved external sends.
10. A support owner is named.
11. A rollback owner is named.
12. The row has a checked-at timestamp.
13. The row has a reviewer.

## Good Five-Chapter Outcome

The five-chapter pilot proof is ready when all five pilot chapters satisfy the
checklist above and the report clearly shows that RSVP, attendance, points,
audit, and zero-send proof are complete.

## Relation To The Launch Matrix

This checklist supports the matrix columns for:

- five-chapter pilot proof
- live production data count proof
- signed-in route proof
- final invite gate readiness

It does not replace the 30-chapter rollout packet or the returned owner CSV
process. It only makes the pilot proof evidence easier to collect and review.

