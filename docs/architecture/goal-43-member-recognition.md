# Goal 43: Member Recognition

## Purpose

Goal 43 adds a clearer member recognition panel to `/rush-month/dashboard`.

This supports the product rule that general members should see:

- their own actions
- their points and recognition
- friendly leaderboard context
- chapter-level impact they can understand

They should not see leadership-only SOP/KPI management details.

## What Changed

- `src/services/member-recognition.ts` computes a mock read-only recognition
  summary.
- `src/components/member-recognition-panel.tsx` renders the recognition panel.
- `/rush-month/dashboard` now uses the panel instead of the older compact
  leaderboard card.
- `tests/member-recognition.test.ts` covers rank selection, sorting, leader
  visibility, DS Admin restriction, and chapter impact cards.

## Safety Boundary

This is not the final points ledger. It does not:

- write points
- award recognition
- expose private leadership KPIs to members
- enable browser writes
- connect production auth
- trigger HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

The panel reports `pointsLedgerPosture: mock_read_only`.
