# Goal 89: Leader Evidence Follow-Up

Goal 89 adds a read-only leader evidence follow-up board to
`/rush-month/review`.

The purpose is to separate two ideas that were easy to blur:

- Chapter leaders can help students and action committee owners improve missing
  or unclear proof/testimonial context.
- MEDLIFE HQ owns the decision about whether proof should be shared broadly
  across chapters, universities, or future public surfaces.

## What Changed

- `getLeaderEvidenceFollowUpBoard(...)` classifies visible Rush Month
  assignments into four lanes:
  - `member_follow_up`
  - `hq_review`
  - `not_ready`
  - `closed_internal`
- `/rush-month/review` now shows this board before the HQ proof-sharing queue.
- The board names future structured events and disabled outbox destinations so
  n8n, warehouse, Power BI, and AI integration posture stays visible without
  turning on external writes.
- Tests prove members and DS Admin cannot read the leader follow-up board.

## Role Behavior

- General Member: hidden; members use their own proof status screen.
- Chapter Leader / E-Board: can inspect follow-up rows and future nudge posture.
- Coach: can inspect follow-up as a chapter-health signal.
- Admin: can inspect the board and see where HQ review applies.
- DS Admin: hidden from student proof follow-up truth.
- Super Admin: full local read posture.

## Safety Posture

This goal does not:

- send member nudges
- approve or publish proof
- upload files
- write to production Supabase
- trigger HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI workflows

All external destinations remain disabled.

## Why This Matters

Rush Month needs chapter leaders to keep proof/testimonial follow-up moving
without accidentally making them the final proof-sharing authority. This board
supports that operating distinction while keeping the future event/outbox model
ready for automation after approval.
