# Returned Owner CSV Intake Triage Checklist

Use this when real owner CSVs finally arrive for the canonical rollout handoff
thread `19f36afa1eb273a4`.

This is a no-write checklist. It tells the operator how to sort, name, dry-run,
and decide whether Coordinator can approve `--apply`.

## Where Returned Files Should Go

Save returned files under:

```text
returned-owner-packets/<owner-slug>/
```

Use the owner slugs from the generated handoff kit:

- `nick-hq-launch-owner`
- `ds-launch-owner`
- `chapter-launch-owners`
- `sales-coaching-lead`
- `campaign-launch-owner`
- `luma-ds-owner`
- `launch-owner-ds`

Do not scatter returned files elsewhere.

## How To Tell A File Belongs To The Approved Handoff

A returned file is tied to the approved handoff when all of these are true:

- it matches one of the generated owner packet filenames
- it belongs in the matching owner slug folder
- it uses the generated header for that file
- it came back in the canonical owner handoff thread or a clearly linked owner
  return

If the filename belongs to a different owner slug, treat that as a blocker.
If the header does not match, treat that as a blocker.
If the file has no data rows, treat that as a blocker.

## Dry-Run-Only Sequence

First, place the returned folders in `returned-owner-packets/<owner-slug>/`.
Then run the dry run only:

```bash
pnpm rollout:owner-return-intake --returns-dir returned-owner-packets --owner-dir .codex-artifacts/production-rollout-owner-handoff/rollout-owner-packets --out production-rollout-owner-return-intake.md
```

The dry run is the review step. It does not apply anything.

After review, if and only if the report is clean and Coordinator approves, run
the apply step:

```bash
pnpm rollout:owner-return-intake --returns-dir returned-owner-packets --owner-dir .codex-artifacts/production-rollout-owner-handoff/rollout-owner-packets --out production-rollout-owner-return-intake.md --apply
```

## What A Clean Dry Run Should Show

A clean dry run should show:

- `READY TO APPLY`
- `Mode: DRY RUN`
- no issues
- one or more returned files with row counts
- the expected owner packet target path for each file
- the next status commands to rerun after review

If the dry run is not clean, do not apply.

## What Must Block Apply

The apply step must be blocked if any of these show up:

- wrong owner folder
- unknown filename
- header mismatch
- zero data rows
- duplicate returned files
- malformed row counts or row shape
- placeholder text
- Test/Figma sandbox evidence
- secret-like values such as passwords, tokens, or API keys
- any file not tied to the approved handoff

## What Coordinator Must Approve Before `--apply`

Coordinator approval is required only after the dry-run report is reviewed and
is clean.

Before `--apply`, confirm:

- the dry-run report says `READY TO APPLY`
- the returned folders are in the right owner slug path
- no issues remain
- the triage report matches the canonical handoff thread

## What Still Must Not Happen

- No invites
- No user creation
- No production writes
- No production live counts
- No packet build if returns are incomplete
- No provider API access
- No email sends from this triage step

## Recommended Review Order

1. Save the returned folder under the matching owner slug.
2. Run the dry run.
3. Check for wrong owner, wrong header, zero rows, duplicates, placeholders, or
   secrets.
4. Ask Coordinator to review the dry-run report.
5. Run `--apply` only after approval.
6. Rerun owner status and current status after apply.

## Safe Result

The safe result is a clean dry run that shows the files are tied to the
approved handoff and are ready to apply without surprises.
