# Owner Return Waiting-State Follow-Up Package

This is a manual, no-send operator package for the myMEDLIFE owner-return
lane.

It is read-only. Codex does not send the follow-up, apply returned files, or
touch production systems.

## Current State

- owner packets: 7/7 sent
- returned owner CSVs: 0/7 returned
- validated owner CSVs: 0/7 validated

The project is still waiting on owner returns tied to the canonical handoff
thread `19f36afa1eb273a4`.

## Who We Are Waiting On

We are waiting on the seven owner packet recipients associated with the
canonical rollout handoff:

- Nick / HQ launch owner
- DS / launch owner
- chapter launch owners
- sales coaching lead
- campaign launch owner
- Luma / DS owner
- launch owner / DS

## Draft Follow-Up Copy Only

Use this text only if Nick or the team wants to send a manual reminder.
Codex should not send it.

> Hi team,
>
> Quick reminder on the owner packet returns for the rollout lane. The handoff
> was sent, and we are still waiting on the returned CSV folders for the seven
> owner packets.
>
> Please return the completed files in the approved owner packet format when
> you have them. If anything is blocked or needs clarification, reply in this
> thread so we can keep the rollout evidence clean and current.
>
> Thank you.

## Exact File / Folder Instructions For Returned CSVs

When real files arrive, save them here:

```text
returned-owner-packets/<owner-slug>/
```

Use the owner slug that matches the generated handoff kit. Do not scatter files
across other folders.

Keep the returned CSV filename and header aligned with the generated owner
packet.

## What To Do First When Files Arrive

The first safe step is:

1. Put the returned folder under the matching `returned-owner-packets/<owner-slug>/`.
2. Run the owner-return intake dry run only.
3. Review the dry-run report before any `--apply` step.

If the dry run is not clean, stop and keep the files un-applied.

## What Coordinator Must Approve

Coordinator approval is required before any of these happen:

- `--apply` for owner-return intake
- shared CSV assembly
- production rollout packet build

The dry-run report is the review gate. It is not the apply gate.

## What Must Not Happen

- No sends by Codex
- No invites
- No production users
- No production writes
- No provider access
- No live counts
- No packet build while owner returns are still incomplete

## Operator Reminder

The waiting-state answer remains simple:

the owner lane is still blocked on returned CSV folders, and nothing should
move until the returns are real and the dry-run report is clean.

