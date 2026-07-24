# Luma Idempotent Reconciliation Proof

Date: 2026-07-24

Verdict: **LOCAL PASS / PRODUCTION PROMOTION REQUIRED**

## Defect

The signed-in production DS-admin page showed a successful hourly Luma run with:

- 1 configured calendar
- 67 imported events
- 67 materialized events
- 0 conflicts
- 0 open failures
- `67 source · 0 new · 67 updated`
- 0 provider writes

The same unchanged source set was being written to all 67 app-owned chapter
events every hour. The production page also showed an unscoped `81 linked
events`, while the configured mapping had 67 materialized events.

## Repair

The reconciliation path now:

1. reads the linked app-owned event;
2. compares all provider-owned fields by value and timestamp;
3. skips the chapter-event update when nothing changed;
4. skips the reconciliation audit insert when nothing changed;
5. still advances import and link freshness;
6. records the result in `unchanged_event_count`;
7. renders new, updated, and unchanged counts separately in DS-admin.

## Automated Proof

- Vitest: 396 files, 2,549 tests passed
- Database: 22 files, 380 pgTAP assertions passed
- Typecheck: passed
- Lint: passed with two unrelated pre-existing warnings
- Production build: passed
- `git diff --check`: passed

The focused unchanged-event regression proves:

- source 1
- new 0
- updated 0
- unchanged 1
- no chapter-event update
- no reconciliation audit insert
- link freshness update remains

## Browser Proof

Browser: signed-in Chrome

Fresh-main reproof:

- branch base: `22138ce` (`origin/main`, PR #844)
- screenshot: `fresh-main-local-after.png`
- a same-chapter mocked event link was intentionally present and did not inflate
  the real linked-event count
- no Luma provider call or provider write was made

Local roles and routes:

- Member `member.a@mymedlife.test`
  - `/app`
  - `/app/events/85000000-0000-4000-8000-000000000001?source=events`
  - `/app/events/85000000-0000-4000-8000-000000000001?source=events&step=rsvp`
  - event detail, Luma-linked state, TEST location, RSVP, check-in, points,
    profile, and exact event return passed
  - the write-disabled RSVP control returned an honest read-only result
  - the write-disabled check-in control returned an honest read-only result
- Leader `leader.a@mymedlife.test`
  - `/leader?view=events&event=85000000-0000-4000-8000-000000000001`
  - event performance, selected-event detail, all-events return, and event
    reopen passed
- Staff `admin@mymedlife.test`
  - `/staff?view=events&campaign=rush-month&event=85000000-0000-4000-8000-000000000001`
  - chapter event table, selected staff detail, and all-events return passed
- Super Admin `super.admin@mymedlife.test`
  - `/admin/integrations/luma`
  - recent event readback and
    `1 source · 0 new · 0 updated · 1 unchanged` passed
  - one real configured calendar, one real linked event, and one future
    member-loop event passed
  - provider writes remained disabled
  - outbox and audit-log links opened their signed-in routes
  - empty backfill and reconcile confirmations returned
    `lumaSyncResult=confirmation_required` without starting a provider read

Screenshots:

- `production-before.png`
- `local-after.png`
- `fresh-main-local-after.png`
- `member-detail-local.png`
- `member-rsvp-local.png`
- `leader-event-local.png`
- `staff-event-local.png`

The fresh-main browser pass exercised every visible control on the affected
admin page and the linked event controls on member, leader, and staff surfaces.
It also exposed two adjacent defects that are not claimed as fixed here:

- Leader `Create Event Preview` did not navigate or visibly change state.
- Staff `Next event` ordering still preferred an older Rush Month event over
  the future Luma fixture.

The local TEST fixture was removed before the clean database reproof.

## Production Boundary

No migration, branch, or application deployment was promoted in this work.
Production still serves release commit
`91aa855080cd818d2adefd32c54b518876476118`.

Do not close this defect until the exact artifact is promoted and a subsequent
production reconciliation proves:

- 67 source
- 0 new
- 0 updated
- 67 unchanged
- no unchanged-event audit churn
- unchanged chapter-event timestamps
- advanced import/link freshness
- configured-scope linked-event counts
- passing member, leader, staff, and admin deployed-site readback
