# Figma Shell Contract Map

Date: 2026-07-06

This map ties the live myMEDLIFE routes to the Figma-derived shells and the
local export bundles found on this machine. It is a contract map, not a redesign
spec. The goal is to preserve the shell layout and navigation while showing
where wiring is already honest and where the next safe task should go.

## Local Figma / Export Sources Found

- `/Users/codex/Desktop/myMEDLIFE App Prototype`
- `/Users/codex/Desktop/Student Leadership Command Center`
- `/Users/codex/Desktop/Staff Command Center Dashboard`
- `/Users/codex/Desktop/Create mockups for text.zip`

Used here only to confirm bundle names, screen families, and top-level structure.
I did not modify any export files.

## Contract Map

| Route / shell | Source component or mockup reference | Fidelity status | Key visible controls / data areas | Next safe wiring task | In invite gate? |
|---|---|---|---|---|---|
| `/login` workspace entry | `Create mockups for text.zip` (`src/imports/pasted_text/my-medlife-role-based-login.md`), `src/app/login/page.tsx`, `src/components/auth-session-panel.tsx` | `needs visual review` | Workspace cards, sign-in entry, redirect-aware session state | Keep role-card selection as a preview only and always defer to the real role after auth | Yes |
| `/app`, `/app/events`, `/app/events/[eventId]`, `/app/points`, `/profile` | `myMEDLIFE App Prototype`, `src/components/figma-member-mobile-home.tsx`, `src/app/app/events/page.tsx`, `src/app/app/events/[eventId]/page.tsx`, `src/app/app/points/page.tsx`, `src/app/profile/page.tsx` | `preserved` | Mobile home, bottom nav, assigned actions, events, points, profile, SLT Prep card when eligible | Keep event RSVP, attendance, and points readbacks honest; keep upload/share actions blocked until approved | Yes |
| `/campaigns`, `/campaigns/[campaignSlug]` | `myMEDLIFE App Prototype`, `src/components/figma-member-campaigns-page.tsx`, `src/app/campaigns/page.tsx`, `src/app/campaigns/[campaignSlug]/page.tsx` | `likely drift` | Campaign cards, starter campaigns, campaign detail shells | Keep each campaign card route-backed and read-only until its own launch slice is approved | No |
| `/leader?view=*` | `Student Leadership Command Center`, `src/components/figma-leader-command-center.tsx`, `src/components/chapter-leader-command-center-panel.tsx`, support screens in `src/components/figma-leader-create-event-screen.tsx`, `src/components/figma-leader-stories-screen.tsx`, `src/components/figma-leader-training-screen.tsx` | `preserved` | Sidebar nav, chapter home, members, committees, events, leaderboard, impact, bridge videos, stories, succession, training | Keep route-backed focus behavior honest for member pipeline and bridge-video handoffs; wire one action family at a time | Yes |
| `/staff?view=*` | `Staff Command Center Dashboard`, `src/components/figma-staff-command-center.tsx`, `src/components/staff-command-center-panel.tsx`, `src/components/staff-portfolio-toolbar.tsx` | `preserved` | Portfolio overview, chapter filters, events, leaderboard, campaigns, proof/UGC, best practices, SOPs, admin gate | Keep staff readbacks and review queues route-backed; leave export/provider actions blocked unless approved | Yes |
| `/staff?view=proof_ugc`, `/leader?view=stories`, `/proof-library`, `/proof-library/upload` | `myMEDLIFE App Prototype`, `Student Leadership Command Center`, `src/components/figma-leader-stories-screen.tsx`, `src/components/proof-upload-intake-panel.tsx` | `needs visual review` | Proof queues, story cards, share/feature/review controls, upload entry points | Keep publishing, share, and external-link actions visibly blocked until the relevant approvals exist | No |
| `/admin`, `/admin/users`, `/admin/chapters`, `/admin/audit-log`, `/admin/integration-outbox`, `/admin/system-health`, `/admin/integrations/luma`, `/admin/pilot-scope` | Redacted admin shell embedded in the staff export, `src/components/figma-admin-panel.tsx`, `src/app/admin/*` | `needs visual review` | Vertical DS/Admin nav, modules, integrations, API keys, audit logs, system health, disabled modules, account/logout affordance | Preserve the vertical admin shell, keep secret/provider actions blocked or disabled, and keep session/account behavior honest | Yes |
| `/app/slt-prep`, `/slt-prep/*` | No standalone desktop export bundle found; route family exists in repo via `src/app/app/slt-prep/page.tsx`, `src/app/slt-prep/*`, and the role-based login prompt bundle | `missing source` | Traveler readiness, checklist, forms, payments, meetings, timeline, notifications, profile | Keep the traveler shell parked and readable; compare against the source chunks before expanding behavior | No |

## Drift Backlog

1. Finish the login workspace-entry copy so the visible cards and redirect rules stay aligned with the role-based login contract.
2. Keep the member mobile shell focused on the event loop first: event detail, RSVP, attendance, points, and profile.
3. Keep leader quick actions route-backed without moving the Figma layout: member pipeline and bridge-video handoffs first.
4. Keep the staff shell honest around export and review controls while preserving the existing top nav and table layout.
5. Keep the admin shell visually strict and backend-like, with account/session behavior delegated to the real top-right menu.
6. Reconcile SLT Prep against its missing local source bundle before adding any more behavior.

## Notes

- This map is intentionally conservative. A screen marked `preserved` still may
  need functional wiring, but its Figma structure is being respected.
- A screen marked `needs visual review` is not necessarily wrong. It just has
  enough uncertainty that we should confirm the shell against the export again
  before we treat it as fully locked.
- I did not touch the rollout or test-data guard files for this pass.
