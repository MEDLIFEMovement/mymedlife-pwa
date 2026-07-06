# Visible Controls Honesty Audit

Date: 2026-07-06

Status: review audit for the current Figma-derived shells. This document does
not approve production writes, invitations, Luma writes, or Supabase production
data changes.

## Rule

The Figma mockups remain the visual and functional map. Do not redesign the
member, leader, staff, or admin shells to make the launch lane simpler. Instead,
keep the visible controls in place and make each one honest:

- `wired` - opens a real route, real shell state, local filter, drawer, modal, or
  production-safe readback.
- `disabled` - visible but unavailable with disabled styling/copy.
- `read-only` - displays or filters existing/mock-safe data without saving.
- `explicitly blocked` - visible, but clearly says the action is blocked until a
  later approval or write gate.
- `outside invite gate` - allowed to remain visible, but not scored for the
  30-chapter invite decision.

Existing evidence:

- `tests/figma-shell-cta-safety.test.ts` checks copied Figma shells for fake
  `href="#"`, empty click handlers, `javascript:void`, raw buttons without a
  handler/submit/disabled state, and unsafe production-live integration copy.
- Detailed source button maps remain in:
  - `docs/figma-member-mobile-app-button-map.md`
  - `docs/figma-leader-command-center-button-map.md`
  - `docs/figma-staff-command-center-button-map.md`
  - `docs/figma-admin-panel-button-map.md`

## Summary Counts

Counts below are control groups, not every repeated row/card instance.

| Classification | Control groups | Current status |
|---|---:|---|
| `wired` | 33 | Real route, shell state, filter, drawer, modal, or readback behavior exists. |
| `disabled` | 15 | Visible controls are unavailable by design. |
| `read-only` | 11 | Safe local/mock readback or filter behavior only. |
| `explicitly blocked` | 18 | Action is visible but blocked until approval/write gates. |
| `outside invite gate` | 12 | Visible module/control is not part of 30-chapter invite scoring. |
| Silent-dead controls found in this pass | 0 | No code fix made; existing CTA safety test covers the copied Figma shell files. |

## Route Audit

| Route / surface | Visible control | Current behavior | Classification | Required fix, if any | Status |
|---|---|---|---|---|---|
| `/app` | Bottom nav: Home, Campaign, Events, Points, Profile | Opens copied Figma mobile shell states / route-backed member views. | `wired` | None. | Pass |
| `/app` | Start next action / action cards | Opens local action detail state; real action-start write remains gated. | `explicitly blocked` | Keep blocked until approved action-start write path. | Pass |
| `/app` | Submit evidence entry points | Opens local evidence/confirmation states; upload/write remains gated. | `explicitly blocked` | Keep blocked until proof metadata/upload approval. | Pass |
| `/app` | Event cards and RSVP affordances | Opens events/detail and local RSVP/check-in/points path; no live Luma write. | `wired` / `explicitly blocked` | Wire live RSVP only in later approved Luma write lane. | Pass |
| `/app` | Points card, full board, leaderboard | Opens member points/leaderboard readback. | `wired` | None. | Pass |
| `/app` | Role preview controls | Preview-only local states for staff/admin review. | `read-only` | Add audit only if sensitive preview grows. | Pass |
| `/app` | Upload/share/story source/export controls | Visible but disabled/blocked where upload, external share, or story source would imply a live write. | `disabled` / `explicitly blocked` | Later proof/feed/story/Luma share approval. | Pass |
| `/app/events` | Campaign filters | Local filtering across visible member events. | `wired` | None. | Pass |
| `/app/events` | Event cards and event action buttons | Open event detail or local RSVP path. | `wired` | None for current local/readback lane. | Pass |
| `/app/events/[eventId]` | Back, RSVP, add-to-calendar/share/map-style controls | Back/RSVP are wired locally; share/export/map-style controls are disabled until Luma sharing/export approval. | `wired` / `disabled` | Later calendar/share integration decision. | Pass |
| `/app/points` | Earn-more CTA, ranking cards, point category rows | Earn-more opens Campaign state; ranking/category rows are readback. | `wired` / `read-only` | None. | Pass |
| `/leader` | Sidebar navigation groups | `/leader?view=` deep links open matching copied Figma screens. | `wired` | None. | Pass |
| `/leader` | Bell notification affordance | Visible disabled/blocked affordance. | `disabled` | Later notification center decision. | Pass |
| `/leader?view=overview` | Create Event | Opens event performance/create-event flow. | `wired` | None for staged flow. | Pass |
| `/leader?view=overview` | Assign Task | Opens local assign-action modal; no approved write. | `explicitly blocked` | Later assignment-create write approval. | Pass |
| `/leader?view=overview` | Review Members | Visible quick action; should focus member pipeline when future work resumes. | `outside invite gate` | Documented follow-up; not blocking invite gate. | Watch |
| `/leader?view=overview` | Promote Emerging Leader | Opens local modal; no role mutation. | `explicitly blocked` | Later role/pipeline approval. | Pass |
| `/leader?view=overview` | Share Bridge Video | Visible quick action toward Bridge Videos; feed/share writes blocked. | `outside invite gate` | Later feed/share approval. | Watch |
| `/leader?view=leaderboard` | Metric filter buttons | Switch local leaderboard metric. | `wired` | None. | Pass |
| `/leader?view=leaderboard` | Ranking/member/chapter rows | Display ranking details; no mutation. | `read-only` | Optional future profile drill-in. | Pass |
| `/leader?view=members` | Member rows | Open member profile shell state. | `wired` | None. | Pass |
| `/leader?view=member_profile` | Promote, assign, nominate, add note | Visible profile actions; mutations/notes remain blocked. | `explicitly blocked` | Later role/note/assignment approvals. | Pass |
| `/leader?view=committees` | Add Committee, Add Chair, Promote Member, Assign Task, Create Event, Review Committee | Local shell actions or blocked future mutations. | `explicitly blocked` / `outside invite gate` | Later committee/write approval. | Pass |
| `/leader?view=events` | Create Event, NPS preview, NPS score/submit modal | Create opens staged event form; NPS preview is local; sends remain blocked. | `wired` / `explicitly blocked` | Later Luma/NPS send approval. | Pass |
| `/leader?view=create_event` | Back, create another, event type/location/channel choices | Local staged event workflow. | `wired` / `read-only` | None for staged state. | Pass |
| `/leader?view=create_event` | Preview RSVP, copy/share/social/WhatsApp/SMS, footer publish | Visible controls are disabled/blocked where they imply live Luma, messaging, or external sharing. | `disabled` / `explicitly blocked` | Later Luma create/update and messaging approvals. | Pass |
| `/leader?view=impact` | Share Impact Story, Create Bridge Video, filters, cards, modal close | Local shell/content behavior; publishing remains blocked. | `outside invite gate` | Later impact/story workflow. | Pass |
| `/leader?view=bridge_videos` | Category filters, video cards, watch/share/feature/submit controls | Local filtering/cards; share/feature/submit controls blocked. | `outside invite gate` / `explicitly blocked` | Later feed/moderation approval. | Pass |
| `/leader?view=stories` | Add Story, filters, like/play/cards/share/bookmark/source controls | Local shell; share/bookmark/source controls disabled/blocked. | `outside invite gate` / `disabled` | Later story/feed approval. | Pass |
| `/leader?view=succession` | Start Transition Plan and transition builder controls | Local shell state; activation is not a live role change. | `outside invite gate` / `explicitly blocked` | Later leadership transition approval. | Pass |
| `/leader?view=training` | Add Resource, filters, expand cards, Watch/View Deck/share/send/list controls | Local shell/readback; external share/send controls blocked. | `outside invite gate` / `disabled` | Later resource/feed approval. | Pass |
| `/staff` | Top nav: Chapters, Campaigns, Proof/UGC, Best Practices, Campaign SOPs, Admin | Opens copied Figma staff shell states. | `wired` | None. | Pass |
| `/staff?view=chapters` | Search, clear, region/coach/sort filters | Local filtering. | `wired` | None. | Pass |
| `/staff?view=chapters` | Export | Visible control; should not imply production export. | `explicitly blocked` | Add/keep disabled or blocked copy before live export approval. | Watch |
| `/staff?view=chapters` | Chapter table rows | Open local chapter detail drawer. | `wired` | None. | Pass |
| `/staff?view=chapters` | Preview Survey / NPS modal / score buttons / feedback / submit | Local preview only; no external send. | `read-only` / `explicitly blocked` | Later NPS send/write approval. | Pass |
| `/staff?view=chapters` | Send Content / Send NPS Survey / external-link footer buttons | Visible but no live sends. | `disabled` / `explicitly blocked` | Later content/NPS send approval. | Pass |
| `/staff?view=campaigns` | Campaign tab buttons and filters | Local staff campaign tables. | `wired` | None. | Pass |
| `/staff?view=campaigns` | At-risk hover suggested actions | Read-only support guidance. | `read-only` | None. | Pass |
| `/staff?view=proof_ugc` | Story link input, platform quick-fill, submit, status/platform filters, story cards | Local review UI; no publishing. | `wired` / `read-only` | None for shell. | Pass |
| `/staff?view=proof_ugc` | Share targets, Mark as Best Practice, Request Changes, Reject, coach note | Visible local intent only; publish/review writes blocked. | `explicitly blocked` | Later proof/UGC approval gates. | Pass |
| `/staff?view=best_practices` | Campaign/region filters | Local filtering. | `wired` | None. | Pass |
| `/staff?view=best_practices` | Share to Feed, Send to Coaches, bookmark | Visible disabled until feed/outbox writes are approved. | `disabled` | Later feed/outbox approval. | Pass |
| `/staff?view=sops` / Campaign SOPs | Library filters, search, open builder | Local builder shell. | `outside invite gate` / `wired` | Not part of 30-chapter invite gate. | Pass |
| `/staff?view=sops` / Campaign SOPs | New Campaign SOP, copy/archive, publish/schedule/rollback, rule toggles | Local shell or blocked workflow-config controls. | `outside invite gate` / `explicitly blocked` | Later workflow publish approval. | Pass |
| `/staff?view=admin` | DS/Super Admin role radios, Enter Admin Panel, Return to dashboard | Opens gated redacted admin overlay only after role choice. | `wired` | None. | Pass |
| `/admin` | Vertical nav: Overview, Users, Chapters, Luma Events, Points, Audit Logs, System Health, Settings | Local admin shell screens and route-backed review surfaces. | `wired` / `read-only` | None. | Pass |
| `/admin` | Modules, Integrations, API Keys, disabled modules group | Visible but blocked/disabled where they imply feature toggles, provider tests, secrets, or production writes. | `disabled` / `explicitly blocked` / `outside invite gate` | Later DS/Admin integration security lane. | Pass |
| `/admin` | Notification bell, user chip/logout icon | Notification disabled; user chip informational in copied shell. | `disabled` | Future account menu/logout if this shell becomes the session owner. | Watch |
| `/admin/users` | User search/filter/table row | Local/admin route-backed search/detail posture. | `wired` / `read-only` | None. | Pass |
| `/admin/users` | Change Role / Edit Modules / Resend Invite / Disable User | Disabled/blocked unless audited write flags are approved. | `disabled` / `explicitly blocked` | Later admin write and invite approval. | Pass |
| `/admin/chapters` | Chapter search/table row | Local/admin route-backed search/detail posture. | `wired` / `read-only` | None. | Pass |
| `/admin/chapters` | View Events / Edit Modules / Audit History | Disabled/blocked or route-backed review where safe. | `disabled` / `explicitly blocked` | Later module workflow approval. | Pass |
| `/admin/integrations/luma` | Mode, test posture, sync/readback, error log, outbox link | Secret-free provider review; no raw secret or live write. | `read-only` / `explicitly blocked` | Later Luma write approval. | Pass |
| `/admin/audit-log` | Audit search/status filters | Local/readback filter surface. | `wired` / `read-only` | None. | Pass |
| `/admin/integration-outbox` | Outbox filters/readback and live-send preflight controls | Read-only outbox review; live sends blocked. | `read-only` / `explicitly blocked` | Later external-send approval. | Pass |
| `/admin/pilot-scope` | Pilot scope/readiness controls | Review-only planning surface. | `read-only` | None for this lane. | Pass |
| Visible parked/non-launch routes | `/campaigns`, `/rush-month/*`, `/proof-library`, `/app/slt-prep`, `/slt-prep/*`, `/coach`, workflow/SOP/admin review routes | Routes may remain visible/known, but are not scored by the 30-chapter invite gate. | `outside invite gate` | Keep controls disabled, read-only, or explicitly blocked until their own launch slice. | Pass |

## Required Fixes

No code fix was made in this pass. The audit found no confirmed silent-dead
controls in the copied Figma shell files that would require a tiny safe patch.

Watch items for the next control-wiring lane:

1. Staff `Export` should stay disabled or explicitly blocked until there is an
   approved export story.
2. Admin copied-shell user chip/logout affordance should remain informational
   unless the Figma admin shell becomes the real session/account-menu owner.
3. Leader quick actions such as `Review Members` and `Share Bridge Video` should
   keep their Figma placement but receive route-backed focus behavior in a later
   small PR.

## Figma Preservation Statement

This audit did not move controls, change navigation structure, replace Figma
layouts, alter colors, or redesign member, leader, staff, or admin shells. Future
implementation should wire behavior behind the existing Figma controls and keep
blocked/read-only states visually honest.
