# HubSpot Rollout Data Request Template

Use this only after returned owner packet intake shows exactly which chapter,
contact, or owner fields are still missing from the 30-chapter rollout packet.
This is a preparation template, not an access request and not a sync plan.

## Why We Are Asking

HubSpot can help us fill or reconcile rollout packet fields for the first
launch, but it does not by itself approve invites or count as production proof.
The production truth still lives in myMEDLIFE and Supabase after the human
packet is validated.

## Option A: Static Export First

Preferred ask:

- Please export the approved launch rows from HubSpot into a flat CSV or sheet.
- Keep the export read-only.
- Use it only to fill the missing rollout packet fields below.

Minimum fields to include:

- contact email
- first name
- last name
- chapter or school affiliation, if present
- contact owner
- HubSpot record id
- last updated timestamp
- any already-approved eligibility or opt-in field, if one exists

## Option B: Read-Only API Access Only If Export Is Not Enough

If a static export cannot supply the approved launch fields, ask for a
read-only HubSpot grant only.

Keep the scope narrow:

- contacts
- companies
- lists
- owners

Do not ask for write scopes.

## Explicitly Exclude

The HubSpot ask should not include:

- notes
- deals
- activity timelines
- marketing content
- workflow enrollment
- lifecycle changes
- task creation or mutation
- contact mutation
- unapproved custom properties
- private notes
- secrets or API tokens in shared files

## Plain-English Request Body

Copy/paste version:

> We are preparing the first myMEDLIFE rollout packet. Please send a static
> export first, and only if needed a read-only HubSpot grant. We only need the
> approved launch fields for chapters, contacts, and owners: email, first name,
> last name, chapter/school affiliation if present, contact owner, HubSpot
> record id, last updated timestamp, and any already-approved eligibility or
> opt-in field. Please exclude notes, deals, activity timelines, marketing
> content, workflows, lifecycle changes, task edits, custom fields that are not
> already approved, and all write scopes. This data will help reconcile the
> rollout packet, but it will not by itself approve invites or serve as
> production proof.

## When The Coordinator Should Ask For It

Ask Nick or the team for this export only after owner packet intake shows a
specific gap, such as:

- a missing chapter owner email
- an unresolved contact owner
- a missing chapter or school affiliation
- a dedupe mismatch on a real contact row
- an already-approved eligibility or opt-in value that needs reconciliation

Do not ask early just because HubSpot might be useful later.

## How This Fits The Rollout Matrix

- Rollout packet / 30-chapter data packet: can improve once the missing owner
  and contact fields are known.
- Human handoff / launch owners: can confirm owner emails and chapter
  assignments, but only after returned CSVs are validated.
- Invite batch readiness: can help dedupe and reconcile contact affiliation.
- Live production data count proof: HubSpot does not advance this column.
- Signed-in route proof imports: HubSpot does not replace real production
  route proof.
- Final invite gate readiness: HubSpot can support inputs, but it cannot
  substitute for the gate.

## Guardrails

- No provider connection yet.
- No production writes.
- No invites.
- No production users.
- No mixing with Test or Figma sandbox evidence.
- Keep the export or read-only grant separate from the app's operational truth.
