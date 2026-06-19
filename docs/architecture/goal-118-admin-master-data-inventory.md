# Goal 118: Admin Master Data Inventory

Goal 118 deepens the existing `/admin` control center with a read-only master
data inventory for the MVP admin requirement.

The inventory exposes:

- fake local review users from `localActorOptions`
- named MVP role coverage from the admin control center role map
- current chapter scope from the read-only app data source
- campaign template shells from the reusable campaign catalog

This keeps one source of truth for local review data. The admin page does not
create users, change roles, edit chapters, edit templates, enable production
auth, enable browser writes, or send data to external systems.

## Files

- `src/services/admin-control-center.ts`
- `src/components/admin-control-center-panel.tsx`
- `tests/admin-control-center.test.ts`
- `docs/review/local-mvp-review-guide.md`
- `README.md`

## Safety

Expected writes remain zero:

- `mutationControlsEnabled: 0`
- `externalWritesExpected: 0`
- production auth disabled
- admin mutation controls absent
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes disabled

## Review

Open `/admin` as `admin@mymedlife.test`, `ds.admin@mymedlife.test`, or
`super.admin@mymedlife.test`.

The admin control center should show the master data inventory with users,
roles, chapter scope, and campaign templates. Every item should be inspectable
without exposing any mutation control.
