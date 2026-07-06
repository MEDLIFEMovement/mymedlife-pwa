## Login + SLT Prep Figma Fidelity Review

Date: 2026-07-06

This pass reviews only the two routes called out by the Coordinator:

1. `/login`
2. `/app/slt-prep` and the related `/slt-prep/*` family

This is a fidelity and drift review, not a redesign spec. The goal is to keep
the Figma shell contract honest and identify the smallest safe next move.

Fidelity evidence standard: actual Figma/exported code first; screenshots/mockups
only as secondary context.

## Sources Used

### Login

- Local export prompt:
  `/Users/codex/Desktop/Create mockups for text.zip`
  - `src/imports/pasted_text/my-medlife-role-based-login.md`
- Raw redacted Figma code reference in repo:
  `docs/figma-code/raw/figma-export-source-redacted-2026-07-04.zip`
  - `docs/figma-code/raw/login/App.tsx`
  - relevant exported structures: `AppView`, `ProfileKey`, `PROFILE_META`,
    `LoginPage`
- Current implementation:
  - `src/app/login/page.tsx`
  - `src/components/login-form.tsx`
  - `src/components/auth-session-panel.tsx`
  - `tests/login-page.test.tsx`

### SLT Prep

- Repo contract and route map:
  - `docs/figma-shell-contract-map.md`
  - `docs/figma-code-contract.md`
- Current implementation:
  - `src/app/app/slt-prep/page.tsx`
  - `src/app/slt-prep/page.tsx`
  - `src/app/slt-prep/*`
  - `src/services/owned-route-redirect.ts`
  - `src/services/slt-trip-prep-workspace.ts`
  - `src/services/slt-trip-prep-staff-workspace.ts`
  - `src/data/mock-slt-trip-prep.ts`
  - `tests/slt-trip-prep-workspace.test.ts`
- Local source clue check:
  - `/Users/codex/Desktop/source_chunks/chapter_04_slt_promotion_recruitment.md`
  - `/Users/codex/Desktop/source_chunks/coach_04_slt_promotion_recruitment.md`
- Local visual clue:
  - `.tmp-figma-slt-prep.png`

## Findings

| Route / shell reviewed | Source / export reference | Current status | Controls / data areas that must stay in place | Drift risks | Smallest safe next task | Safe to fix now? |
| --- | --- | --- | --- | --- | --- | --- |
| `/login` | Actual exported login source from `docs/figma-code/raw/figma-export-source-redacted-2026-07-04.zip` (`docs/figma-code/raw/login/App.tsx`) plus the paired prompt bundle | `likely drift` | myMEDLIFE brand mark, email, password, sign-in CTA, workspace-entry framing, explicit rule that card choice is not the access authority, role-aware post-auth redirect | This finding is source-based, not screenshot-based. The exported `App.tsx` defines a `LoginPage`, `PROFILE_META`, and a workspace-oriented entry flow with multiple role cards before routing into separate shells. The current app instead renders a much narrower dark sign-in card in `src/app/login/page.tsx` and `src/components/login-form.tsx`. `tests/login-page.test.tsx` also explicitly forbids the workspace-card copy from the export. | Review and align the current `/login` shell against the exported login package before more auth/workspace changes. The smallest safe code task is to port the exported login shell structure while keeping real auth and server redirect rules intact. | `No` for a tiny patch. This needs a deliberate UI/source-alignment slice, not a small opportunistic edit. |
| `src/components/auth-session-panel.tsx` signed-in continuation state on `/login` | Actual exported login source plus current role-routing rules | `likely drift` | signed-in continuation state, role-based redirect copy, sign-out affordance | The exported login package is organized around a broader workspace-entry flow. The current signed-in continuation panel is honest from a behavior standpoint, but it stays inside the older dark review-card framing rather than the exported structure. | Fold signed-in continuation into the same login-shell alignment slice so signed-out and signed-in states share one export-backed contract. | `No`; keep bundled with the broader login alignment task. |
| `/app/slt-prep` alias route | No exact exported SLT Prep code found in the local raw export package; repo contract plus current route/service layer only | `missing source` | traveler-only access boundary, mobile-first prep framing, distinct SLT shell ownership | There is not enough exact exported code to compare this route structurally. The repo's own Figma code contract says SLT Prep has no current raw export and should use an explicit missing-source posture instead of pretending parity. The current route redirects through `getSltPrepRouteRedirectHref()` to the launch-lane events focus. | Decide whether the near-term contract is `explicit blocked placeholder` or `real SLT shell`. Until exact source is available, the smallest honest move is to restore the explicit blocked/missing-source state instead of redirecting silently. | `Possibly`, but only as a scoped follow-up after approval because it changes visible route behavior. |
| `/slt-prep/*` route family (`checklist`, `forms`, `payments`, `meetings`, `extensions`, `timeline`, `notifications`, `profile`, `staff`) | No exact exported SLT Prep route code found; route files plus SLT workspace services and mock traveler data only | `blocked/source confidence low` | subnav structure, traveler readiness categories, staff dashboard distinction, mock-safe notes, no live writes | This is not a “visual drift” call from screenshots. It is a source-confidence call. Every route file in this family currently redirects via `getSltPrepRouteRedirectHref()`, while the service layer already contains a rich traveler/staff workspace model. That means the domain model exists, but there is no exact local export code in hand to name the final shell structure confidently. | Pick one honest posture and hold it consistently: either explicit blocked placeholder until source lands, or route-backed SLT shell built from the existing workspace services and later refined against source. | `No` as a tiny fix; this is a small product slice, not a one-line preservation patch. |
| SLT Prep source confidence overall | `docs/figma-code-contract.md`, `.tmp-figma-slt-prep.png`, desktop source chunks | `blocked` | traveler countdown, readiness score, checklist, forms, payments, flights, meetings, notifications, staff dashboard | The local SLT visual clue available in this pass is not a usable full export. `.tmp-figma-slt-prep.png` appears to be a loading/blank Figma state, and the desktop source chunks are SOP content, not exact UI code. That is enough to support workflow semantics, but not enough to claim exact Figma parity. | Obtain or confirm the actual SLT Prep export/code bundle before calling any UI parity complete. Until then, keep language conservative and avoid pretending current markup is final Figma fidelity. | `No`; needs source confirmation. |

## Route Notes

### `/login`

What is source-backed:

- one platform, separate role-based workspaces after auth
- email + password sign-in
- auth decides the real destination
- workspace choice is display/entry framing, not authority

What currently drifts:

- the repo still renders and tests a narrower dark sign-in card
- `tests/login-page.test.tsx` explicitly rejects the workspace-card language from
  the export
- the exported login `App.tsx` includes a broader workspace-entry structure
  (`PROFILE_META`, multi-role card framing, and shell selection flow) that is
  not currently reflected in the live page structure

Recommendation:

- treat login as a real Figma-alignment task next, not a tiny fix
- keep real server auth and redirect behavior
- port the exported login shell structure without reintroducing fake
  client-side access control

### `/app/slt-prep` and `/slt-prep/*`

What is source-backed:

- traveler workflow semantics from SOP content and mock workspace services
- traveler/staff split
- countdown, readiness, checklist, forms, payments, meetings, extensions,
  notifications, profile, and staff review concepts

What is not source-confirmed:

- all visible SLT routes are redirect wrappers
- `getSltPrepRouteRedirectHref()` currently returns the launch-lane events focus
  route rather than an SLT surface
- the repo Figma contract already says missing exact source should be explicit,
  not silently rerouted
- the local visual clue is only a loading shell, not a usable exported screen
- the desktop source chunks are campaign/SOP content, not exact SLT page code

Recommendation:

- do not widen into a speculative SLT redesign
- first decide the honest near-term posture:
  1. explicit blocked/missing-source placeholder, or
  2. route-backed mock-safe SLT shell using the existing workspace services
- only pursue full visual parity after the real SLT export/code source is
  available

## Small Safe Fix Assessment

No code change was made in this pass.

Reason:

- Login needs a deliberate source-alignment slice, not a tiny patch.
- SLT Prep has a real contract mismatch, but changing it safely affects visible
  route behavior and should be a small approved coding task rather than a
  quiet review-pass edit.

## Recommended Next #1 Goal

`CODEX GOAL — Login Figma Shell Alignment, Preserve Real Auth`

Scope:

- port `/login` from the exported login shell structure
- keep email/password auth, server-side redirect truth, and sign-out behavior
- preserve the rule that clicked workspace is not the access authority
- update focused login tests accordingly
- no production writes, no invite changes, no provider changes

After that:

`CODEX GOAL — SLT Prep Honest Route Posture`

Scope:

- choose and implement one honest near-term posture for `/app/slt-prep` and
  `/slt-prep/*`: explicit blocked placeholder or route-backed mock-safe shell
- do not claim final Figma parity until exact SLT source is confirmed
