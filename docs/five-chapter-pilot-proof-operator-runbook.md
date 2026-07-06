# Five-Chapter Pilot Proof Operator Runbook

This runbook turns the five-chapter pilot proof checklist into a simple
operator workflow.

Use it when the team has real pilot evidence for five chapters and needs to
convert that evidence into the packet-ready pilot proof rows without touching
production data.

## What This Runbook Is For

- Collecting the five-chapter proof in one reviewed source sheet.
- Converting that sheet into `pilot-event-proof.csv`.
- Running the read-only pilot proof checks before the packet is rebuilt.
- Keeping Test/Figma/sandbox rows out of rollout evidence.

## What Counts As Pilot Proof

Each pilot chapter needs:

- chapter id and chapter name
- a linked Luma calendar or read-only event source
- member route proof
- leader route proof
- RSVP proof
- attendance or check-in proof
- points readback proof
- audit proof
- outbox zero-send proof
- support owner
- rollback owner
- checked-at timestamp
- reviewer name or email

## Where Each Field Comes From

| Field | Best source | Who should confirm it |
| --- | --- | --- |
| chapter id, chapter name | Approved rollout packet or chapter roster | HQ / launch owner |
| event id, event name, event URL, Luma mapping | Luma export or read-only mapping source | Luma / DS owner |
| member route proof | App route check | Launch reviewer |
| leader route proof | App route check | Launch reviewer |
| RSVP proof | App readback or approved RSVP export | Launch reviewer |
| attendance or check-in proof | App readback or approved attendance export | Launch reviewer |
| points readback proof | App points readback | Launch reviewer |
| audit proof | App audit log or approved audit readback | DS / launch reviewer |
| outbox zero-send proof | App outbox readback | DS / launch reviewer |
| support owner | Named owner review | Nick / HQ launch owner |
| rollback owner | Named owner review | Nick / HQ launch owner |
| checked-at timestamp | Reviewer sheet timestamp | Launch reviewer |
| reviewer name or email | Reviewer sheet | Launch reviewer |

## Source Sheet Template

Use one row per pilot chapter with these source columns:

```text
chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,status,notes
```

Keep the sheet free of:

- passwords
- tokens
- API keys
- private notes
- screenshots pasted into cells
- helper columns that are not part of the rollout evidence
- Test, sandbox, or Figma markers

## Dry-Run Workflow

1. Collect the reviewer evidence sheet for the five pilot chapters.
2. Save it locally as `pilot-event-proof-source.csv`.
3. Run the local import to create `pilot-event-proof.csv`:

```bash
pnpm rollout:pilot-proof-import --proof pilot-event-proof-source.csv --out-dir rollout-csv
```

4. Read the command output and the generated file.
5. Fix any blockers in the source sheet.
6. Re-run the import until the output is ready.
7. Rebuild the rollout packet and run the packet-level proof check:

```bash
pnpm rollout:check-csv --dir rollout-csv
pnpm rollout:build --chapters rollout-csv/chapters.csv --users rollout-csv/users.csv --memberships rollout-csv/memberships.csv --staff-roles rollout-csv/staff-roles.csv --coach-assignments rollout-csv/coach-assignments.csv --campaigns rollout-csv/campaigns.csv --luma-calendars rollout-csv/luma-calendars.csv --pilot-event-proof rollout-csv/pilot-event-proof.csv --launch-owners rollout-csv/launch-owners.csv --signed-in-route-proof rollout-csv/signed-in-route-proof.csv --out production-rollout-packet.json
pnpm rollout:check production-rollout-packet.json
pnpm production:pilot-event-proof --packet production-rollout-packet.json
```

## What The Import Rejects

The pilot proof tooling rejects rows that:

- do not have at least one RSVP
- do not have at least one attendance check-in
- do not reconcile points to attendance
- do not record audit evidence
- do not show zero external sends
- use non-app routes for proof fields
- use fake, placeholder, or Test-style email addresses
- include credential-looking values such as passwords, tokens, or keys
- contain Test/Figma/sandbox evidence

## What Not To Count

Do not count these as pilot proof by themselves:

- event visibility without RSVP and attendance
- RSVP without attendance and points
- attendance without points readback
- points without audit proof
- Luma-only evidence with no app proof
- screenshots without a route check or readback
- any row marked as Test or sandbox data
- any row with external sends turned on

## What The Operator Should Say In Review

When the sheet is ready, the report should make the following clear:

- which five chapters are proven
- where each proof came from
- who reviewed the rows
- which rows still need follow-up
- that the report is read-only and does not create users or write production data

## Relation To The Launch Gates

This runbook supports the five-chapter pilot proof gate, the signed-in route
proof, the live data count proof, and the final invite gate.

It does not replace the 30-chapter rollout packet or the owner return intake
process.

