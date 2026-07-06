# Social Lead Source Readiness Template (Hootsuite / Instagram)

Use this only after the 30-chapter slate is approved and the owner-return gap
report or HubSpot/static review shows exact recruitment-source fields are still
missing. This is a preparation template, not an access request and not an
implementation plan.

## Why We Are Asking

Hootsuite and Instagram lead data can help with recruitment attribution and
dedupe support, but it cannot be used as production app truth for rollout
invites or user proof.

We still keep:

- myMEDLIFE/Supabase as operational truth
- owner packet validation as rollout authority
- live production data count proof as invitation proof
- signed-in route proof as route authority
- audit/outbox proof as change authority
- the final invite gate as the final launch gate

## Option A: Static Export First (Preferred)

Preferred ask: share a static export (CSV/Sheet) from the team’s existing
social lead source process.
This keeps the request read-only and easy to review.

Minimum fields to request:

- source platform/account/page handle
- chapter/page mapping
- campaign/post/source label (if available)
- referral label or post label if that is the field used
- lead/contact email or form field (only if already collected and approved)
- consent, opt-in, or recruitment-source flag (only if already approved)
- source record id or export row id
- owner/contact for the export
- export timestamp

## Option B: Read-Only Access Only If Static Export Is Not Enough

If static export is not available or still misses required fields, request only
read-only access as a follow-up after Coordinator approval:

- campaign/page export read access
- lead/contact export read access
- read-only list/report access if that is the narrowest supported path

Keep scope strict:

- read-only only
- no write/publish/reply/comment permissions
- no profile writes
- no direct messages or notification permissions
- no posting, publishing, or DM permissions

## Explicitly Exclude

The social lead ask should not include:

- direct messages/private comments
- passwords, tokens, API secrets, private handles in shared artifacts
- any API keys in docs, sheets, CSVs, or browser fields
- publishing/reply rights
- follower/message automation or triggers
- any production create/update rights
- direct invite/member/membership creation
- point/attendance updates
- any action that can change app membership, invites, points, attendance,
  audit/outbox, or rollout proof
- claims that social data alone proves production rollout readiness

## Plain-English Request Body

> We are preparing the first myMEDLIFE rollout packet and need safe recruitment
> lead context only. Please share a static export first (and only if needed,
> then read-only access) with the minimum fields for routing and dedupe.
>
> We need the source platform/page, chapter or page mapping, campaign source
> label, approved contact identifiers, consent/opt-in/recruitment-source flags if
> already approved, source record id, owner/contact, and export timestamp.
>
> Please exclude private message content, DMs, token/secret fields, publishing
> rights, write permissions, and anything that can post, message, or create
> production users/memberships.

## When to Ask

Only request this after:

- owner packet return intake and current HubSpot/static review identify a real
  recruitment-source gap, and
- the exact missing fields are known and approved for this rollout step, or
- HQ approves a recruitment-source pilot.

Do not ask early just because social leads may be helpful later.

## Fit to the Rollout Matrix

- Rollout packet / 30-chapter data packet: no direct impact; can support
  ownership/contact research only after gaps are proven.
- Human handoff / launch owners: can support ownership and recruitment context,
  but does not replace returned owner CSV validation.
- Invite batch readiness: can support non-authoritative funnel context and
  dedupe/reach analysis after required gaps are known.
- Live production data count proof: no impact.
- Signed-in route proof imports: no impact.
- Final invite gate readiness: social leads can never substitute for the gate.

## Guardrails

- No Hootsuite/Instagram/Meta API calls in this lane.
- No provider writes or production changes.
- No invites.
- No production users.
- No production Supabase writes.
- No direct app user creation, membership creation, or points writes.
- No claims that social data is rollout evidence by itself.
- No social automation, DMs, or invite creation before final invite gate.
- Keep social artifacts separate from Test/Figma/sandbox evidence.
