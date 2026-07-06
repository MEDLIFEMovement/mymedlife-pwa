# Production Readiness Glossary (Plain English)

Nick asked for a short, non-technical version of the rollout terms we use in the
matrix and handoff calls. This is a team glossary for people planning and
running launch, not for engineering implementation details.

## owner CSVs / returned owner packets

- **What it means:** The first round of chapter owner, staff, and contact data
  gathered by each chapter owner, then returned to the team in a CSV format.
- **Why it matters:** It is the first human-verification lane that tells us who can
  own launch decisions for each chapter.
- **Ready evidence:** Every assigned owner packet is clearly sent, and returns are
  received from owners with matching chapter/contact rows and owner assignment
  details.
- **What does not count:** A sent packet without a return; draft spreadsheets
  that are not tied to an owner; any rows that look like placeholders, test
  data, or ambiguous ownership.

## production rollout packet

- **What it means:** The consolidated launch packet (`users`, `memberships`,
  `chapters`, `staff roles`, `pilot proof`, etc.) that shows the launch plan is
  ready for DS review.
- **Why it matters:** Without this packet, we do not move to wide production
  invites; it is the minimum structured evidence for day-one launch shape.
- **Ready evidence:** A validated packet build plus intake/check steps passing for
  required files and counts.
- **What does not count:** Unvalidated spreadsheets, partial folders, or any
  assembly done only for smoke-screening while evidence is still missing.

## production live data counts

- **What it means:** Read counts directly from the launch app/data layer (myMEDLIFE
  + Supabase) showing real chapter/user/staff/application rows after apply.
- **Why it matters:** This is how we know the app is actually carrying live launch
  data, not only prepared files.
- **Ready evidence:** Snapshot or check that confirms real rows exist where
  expected and that checksums/rules match packet intent.
- **What does not count:** External exports, imported lead lists, or historical
  snapshots that are not reflected in the live app/database state.

## signed-in route proof

- **What it means:** A test log showing real users can sign in and land on the
  correct route for member, leader, staff, and admin screens.
- **Why it matters:** A route mismatch means the app might look deployed but be
  broken for real users.
- **Ready evidence:** Confirmed checks for each required role, with timestamp,
  workspace route, reviewer identity, and pass status.
- **What does not count:** UI screenshots of the right-looking screen without a
  sign-in path test; route checks done against fake/test accounts.

## five-chapter pilot proof

- **What it means:** Evidence for 5 chapters proving event flow, RSVP,
  attendance, points, and zero-send behavior from the app outbox path.
- **Why it matters:** It reduces risk before expanding from small pilots to
  broader 30-chapter rollout operations.
- **Ready evidence:** Completed pilot proof rows with RSVP, attendance,
  point-attribution, audit, and zero-external-send validations.
- **What does not count:** Single-chapter checks, manual assumptions,
  unsupervised screenshots, or Luma-only evidence with no app proof.

## final invite gate

- **What it means:** The last readiness checkpoint before broad real-user
  invitations are sent.
- **Why it matters:** It prevents the team from sending invites before critical
  safety and evidence checks are complete.
- **Ready evidence:** Packet validated, live counts verified, signed-in route proof
  passed, pilot proof complete, owners validated, and outbox/audit posture approved.
- **What does not count:** Deployment-only success, matrix optimism, or any
  external lead source data by itself.

## rollout gate vs deployed app

- **What it means:**  
  - **Deployed app:** Code and screens are live in production.  
  - **Rollout gate:** The human and data checks that must pass before
  operationally sending invites.
- **Why it matters:** A deployed app can be healthy while launch readiness is still
  incomplete.
- **Ready evidence:** Gate evidence checklist passing for each matrix column, not
  just CI smoke pass.
- **What does not count:** Deploy success, no errors in smoke tests, or absence of
  known UI regressions.

## Test/sandbox data vs real production data

- **What it means:**  
  - **Test/sandbox data:** Safe placeholders used for setup and validation.  
  - **Real production data:** Real chapter/user/staff records created in the
    launch truth system.
- **Why it matters:** Real launch decisions and invite eligibility must rely on real
  data only.
- **Ready evidence:** Explicit labeling and separation in evidence, plus a clear
  step where real rows replace or confirm test placeholders.
- **What does not count:** Calling sandbox rows “good enough” because they appear
  realistic.

## static export vs read-only API access

- **What it means:**  
  - **Static export:** A file snapshot (CSV/Sheet) from a system for initial
    reconciliation.  
  - **Read-only API access:** Limited permission to pull the same required fields
    directly from an external system.
- **Why it matters:** Export-first reduces connector risk and protects against
  early write/sync mistakes.
- **Ready evidence:** Field-by-field reconciliation and clear approvals about which
  fields are needed and who can use them.
- **What does not count:** Raw broad API access, broad scopes, or using these feeds
  as direct production truth before owner/packet gates.

## why external systems cannot bypass myMEDLIFE/Supabase truth

- **What it means:** HubSpot, Luma, social leads, warehouse, n8n, and Smile.io can
  support prep, not replace the app’s operational source of truth.
- **Why it matters:** Launch safety depends on one place of authority for user,
  chapter, membership, route, and invite decisions.
- **Ready evidence:** Final gating decisions must be supported by app/apply/audit
  evidence in myMEDLIFE/Supabase and not only external exports.
- **What does not count:** Using any external row as a direct invite trigger,
  membership creation signal, points write source, or final gate evidence.

## Quick one-line summary for the team

**Think of rollout readiness as “proof-first launch operations”:** external
providers can help us gather context, but the invite gate opens only when owner
returns, packet validation, pilot proof, signed-in route checks, live counts, and
app-level audit/outbox evidence are in place.
