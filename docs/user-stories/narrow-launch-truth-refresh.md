# myMEDLIFE Narrow-Launch Truth Refresh

Date: 2026-07-07  
Owner lane: myMEDLIFE #5, planning/docs only  
Planning reference: MED-512  
Purpose: give Coordinator a one-page current-truth snapshot of what is
genuinely built enough to review, what is still preview-only, what is blocked,
and what remains rollout-gated after the latest planning-doc merge wave.

## Sources Inspected

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/user-story-gap-report.md`
- `docs/user-stories/delivery-backlog.md`
- `docs/user-stories/story-to-test-traceability.md`
- `docs/user-stories/latest-main-builder-crosswalk.md`
- `docs/user-stories/builder-ticket-packet.md`
- `docs/user-stories/module-to-shell-acceptance-map.md`
- Repo `origin/main` at `0c22290060e33c62e0a7d65fc2cf45af97f9d590`
  (`Merge pull request #446 from MEDLIFEMovement/agent/med-512-builder-ticket-packet`)

## Reading Rules

- Repo truth wins over planning intent.
- Figma/exported code is the shell and navigation contract, not rollout proof.
- TEST, local, sandbox, screenshot, smoke, and preview evidence can support UI
  review, but not production readiness by themselves.
- Visible fake people, chapters, events, stories, proof, providers, audit
  actors, and metrics must keep `TEST`.

## Built Shell Or Launch-Reviewable Now

These are good enough for route/control review and shell fidelity review:

- Login entry and role-aware routing shell
- General Member App shell and bottom navigation
- Member event list and event detail shell
- Member points readback shell
- Student Leadership overview shell/menu
- Staff chapter portfolio shell/menu
- DS Admin dark shell/menu

What this means:

- Builders can keep polishing route fidelity and control honesty here.
- `#4` can treat these as legitimate browser-review targets.
- None of this alone proves production data, writes, or rollout readiness.

## Preview-Only Or Mock-Safe Now

These are intentionally visible but still review/demo posture rather than live
operational truth:

- RSVP preview
- QR/check-in preview
- Attendance follow-through
- Member points authority and simple leaderboard truth
- Member Stories feed interactions
- Leader event operations, create-event, leaderboard mutation, and support/culture surfaces
- Staff campaigns, proof/UGC, best practices, and SOP surfaces
- SLT Prep entry and standalone SLT route family
- DS Admin integrations, API Keys, MCP, System Health, and Audit Logs verb surfaces

What this means:

- Controls must be route-backed, blocked, disabled, read-only, or preview-only.
- Copy must not imply live writes, live sync, live secret access, or production
  proof.
- TEST labeling is a visual acceptance requirement here, not a nice-to-have.

## Blocked For Live Operations Now

These remain intentionally blocked even if the shell looks complete:

- RSVP writes
- Check-in / attendance writes
- Points awards / leaderboard mutation
- Story/proof publishing, consent approval, moderation, and social/provider sync
- Leader event creation writes and follow-up sends
- Staff intervention writes, exports, reminders, and provider-driven actions
- Admin key management verbs, provider connect/test/send, MCP writes
- User/invite/chapter/role mutation from admin review pages
- Traveler/payment/forms/provider writes in SLT Prep

What this means:

- A builder can improve honesty and fidelity, but cannot make these feel live.
- If a surface needs a future safety contract, that belongs outside shell-only
  work.

## Rollout-Gated Now

These remain outside shell planning and must not be implied solved by merged UI
or planning docs:

- Real owner-returned CSV truth
- Production signed-in proof by role
- Live data counts from app truth
- Pilot event proof for RSVP, attendance, points, and audit/outbox posture
- Zero-send audit/outbox proof
- Final invite-gate approval

What this means:

- Planning docs can explain these gates, but cannot satisfy them.
- Public smoke, screenshots, TEST cleanup, and Figma fidelity do not move this
  class of work on their own.

## Underdefined Modules To Keep Honest

### SLT Prep

- Treat as preview-only and source-confidence-limited.
- Keep it in the member shell only as an honest handoff, not as a fake-live
  traveler workflow.

### Stories

- Treat as visually rich, source-backed feed surfaces with blocked interaction
  and governance posture.
- Keep fake story rows and social proof TEST-labeled.

### DS Admin Menus

- Keep source-backed menu families visible even when the route is blocked or
  read-only.
- Do not hide complexity just because live verbs are off.

### Integrations Surfaces

- Use masked placeholders, blocked verbs, and explicit read-only posture.
- Never let the language drift into “ready to connect” or “live” unless real
  provider approval exists.

## Best Next Slices By Lane

- `#1`: member `/app/events` + detail + RSVP/check-in + `/app/points` handoff polish
- `#2`: leader event and attendance handoff closeout
- `#3`: DS Admin integrations / API Keys / MCP blocked-state clarity
- `#4`: mobile QA for the member event-to-points loop

## Coordinator Use

Use this doc when the question is:

- “Is this actually built, or just preview-safe?”
- “Can this builder keep going here without crossing into rollout or provider work?”
- “Which modules are still visually important but operationally blocked?”

Use the supporting docs this way:

- `builder-ticket-packet.md` for paste-ready assignments
- `latest-main-builder-crosswalk.md` for ranked next slices
- `module-to-shell-acceptance-map.md` for shell ownership and module posture
- `story-to-test-traceability.md` for route/test/proof distinctions

## Matrix Recommendation

This truth refresh is planning/documentation only and should not move readiness
percentages by itself.
