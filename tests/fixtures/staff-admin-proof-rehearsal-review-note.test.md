# Staff/Admin TEST rehearsal reviewer note

This note is reviewer-facing only. It helps copy/paste the TEST rehearsal packet output without turning it into production evidence.

CSV source: tests/fixtures/staff-admin-proof-rehearsal.test.csv
Command: pnpm staff-admin-proof-rehearsal --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv --out /tmp/staff-admin-proof-rehearsal.md --review-note-out /tmp/staff-admin-proof-rehearsal-review-note.md

## What this is

- A deterministic wrapper around the TEST rehearsal snapshot CLI output.
- A local or staging-only handoff aid.
- A reminder that production evidence is still blocked.

## What this is not

- Production signed-in proof.
- A live route smoke result.
- A rollout artifact.

## Route Targets

- /staff?view=chapters
- /admin
- /app

## Reviewer Checklist

- Confirm the packet is TEST-only and does not count as production proof.
- Confirm the rows map to /staff?view=chapters for staff/support and /admin for DS Admin and Super Admin.
- Confirm the unauthorized member row still fails and stays visible in the packet.
- Confirm production evidence remains blocked until real hosted proof replaces the rehearsal rows.

## Snapshot Summary

- Ready: yes
- Staff rows: 2
- Admin rows: 2
- Passed rows: 3
- Failed rows: 1

## Safety Boundary

- TEST-only rehearsal output.
- Blocked from production proof.
- Keep the negative member row visible so the packet remains honest.
