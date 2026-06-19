import type { LocalActorContext } from "@/services/local-actor-context";

export type ReleaseReadinessStatus =
  | "ready_for_local_review"
  | "blocked_for_live_launch";

export type ReleaseReadinessItem = {
  label: string;
  status: ReleaseReadinessStatus;
  plainEnglish: string;
};

export type RoleModelReviewCheckpointItem = {
  label: string;
  route: string;
  reviewerActorEmail: string;
  passSignal: string;
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type RoleModelReviewCheckpoint = {
  title: string;
  plainEnglish: string;
  items: RoleModelReviewCheckpointItem[];
  finalDecisionPrompt: string;
};

export type MvpReleaseReadinessSummary = {
  canReadSummary: boolean;
  title: string;
  verdict: "local_review_ready_not_live";
  plainEnglishVerdict: string;
  localReviewReady: true;
  liveLaunchReady: false;
  externalWritesEnabled: 0;
  browserWritesEnabled: 0;
  achievements: ReleaseReadinessItem[];
  blockers: ReleaseReadinessItem[];
  roleModelReviewCheckpoint: RoleModelReviewCheckpoint | null;
  nextApprovals: string[];
};

export function getMvpReleaseReadinessSummary(
  actor: LocalActorContext,
): MvpReleaseReadinessSummary {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadSummary: false,
      title: "Release readiness hidden for this role",
      verdict: "local_review_ready_not_live",
      plainEnglishVerdict:
        "Release readiness is an admin review surface, not a chapter operating view.",
      localReviewReady: true,
      liveLaunchReady: false,
      externalWritesEnabled: 0,
      browserWritesEnabled: 0,
      achievements: [],
      blockers: [],
      roleModelReviewCheckpoint: null,
      nextApprovals: [],
    };
  }

  return {
    canReadSummary: true,
    title: getTitle(actor),
    verdict: "local_review_ready_not_live",
    plainEnglishVerdict:
      "The Rush Month MVP is strong enough for local stakeholder review, but it is not ready for live student launch until auth, writes, uploads, production data, and integrations are approved.",
    localReviewReady: true,
    liveLaunchReady: false,
    externalWritesEnabled: 0,
    browserWritesEnabled: 0,
    achievements: [
      {
        label: "Rush Month operating loop",
        status: "ready_for_local_review",
        plainEnglish:
          "A reviewer can see the full assignment, proof, review, points/KPI, outbox, audit, and coach decision flow locally.",
      },
      {
        label: "Role-aware views",
        status: "ready_for_local_review",
        plainEnglish:
          "Member, leader, coach, admin, DS admin, and super admin views show different information.",
      },
      {
        label: "Member leaderboard route",
        status: "ready_for_local_review",
        plainEnglish:
          "Members can open `/rush-month/leaderboard` for points, rank, recognition, chapter impact, and a next action while points writes, leaderboard mutations, member nudges, and external sends remain disabled.",
      },
      {
        label: "Rush Month event detail route",
        status: "ready_for_local_review",
        plainEnglish:
          "Members, leaders, coaches, Admin, and Super Admin can open one Rush Month event detail for owner, student action, NPS prompt, proof prompt, readiness checks, and disabled Luma/outbox posture.",
      },
      {
        label: "Member Rush Month events review coverage",
        status: "ready_for_local_review",
        plainEnglish:
          "Members can open `/rush-month/events` to inspect Rush Month event plans, expected student actions, feedback/NPS prompts, proof prompts, proof-intake handoff, disabled Luma/outbox posture, and the attend-reflect-share bridge while attendance imports, NPS reminders, proof uploads, public proof sharing, exports, AI summaries, and external sends remain disabled.",
      },
      {
        label: "Evidence submission readiness route",
        status: "ready_for_local_review",
        plainEnglish:
          "Members can open `/rush-month/evidence` to see the next proof item, submission queue, Goal 152 proof prep checklist, proof status, future structured records, and blocked upload/public-sharing/external-send posture.",
      },
      {
        label: "Proof submission packet",
        status: "ready_for_local_review",
        plainEnglish:
          "Members and chapter operators can use `/rush-month/evidence` to inspect the Goal 158 proof metadata payload, local function, result preview, readiness checks, structured event, disabled outbox, and audit action before any proof save or upload is approved.",
      },
      {
        label: "Proof storage intake packet",
        status: "ready_for_local_review",
        plainEnglish:
          "Members, chapter leaders, HQ, and Super Admin can use `/proof-library/upload` to inspect the Goal 159 private bucket, storage-path preview, required metadata, moderation queue, future structured event, disabled outbox, audit action, and locked storage controls before any upload is approved.",
      },
      {
        label: "Read-only profile route",
        status: "ready_for_local_review",
        plainEnglish:
          "Every local actor can open `/profile` to inspect identity, role scope, chapter or staff scope, next safe action, future profile events, and zero profile, membership, role, or external writes.",
      },
      {
        label: "Auth onboarding readiness route",
        status: "ready_for_local_review",
        plainEnglish:
          "Reviewers can open `/onboarding` to inspect future sign-in, profile creation, chapter join, membership approval, role assignment, coach assignment, and staff role assignment sequencing while live auth, production users, profile writes, membership writes, role writes, and external writes remain at zero.",
      },
      {
        label: "Production auth preflight checklist",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can use `/onboarding` to inspect the Goal 157 callback, role coverage, profile mapping, join approval, role assignment, coach scope, staff scope, audit/outbox, and rollback checklist before real users are invited.",
      },
      {
        label: "Membership approval packet",
        status: "ready_for_local_review",
        plainEnglish:
          "Chapter leaders, Admin, and Super Admin can use `/chapter/members` to inspect the Goal 160 future membership approval function, payload, readiness checks, structured event, disabled outbox, audit action, and locked controls before any join request is approved.",
      },
      {
        label: "Membership approval result states",
        status: "ready_for_local_review",
        plainEnglish:
          "Chapter leaders, Admin, and Super Admin can inspect Goal 161 membership approval success, disabled, welcome-disabled, CRM-disabled, duplicate, auth, permission, join-request, profile, role, audit-reason, and error states before any approval control opens.",
      },
      {
        label: "Membership approval write readiness",
        status: "ready_for_local_review",
        plainEnglish:
          "Chapter leaders, Admin, and Super Admin can inspect Goal 162 membership approval write readiness, required SQL/RLS tests, blocked function/RLS checks, disabled welcome/CRM sends, future tables, and audit/outbox posture before app.approve_chapter_membership is implemented.",
      },
      {
        label: "Local sign-in review coverage",
        status: "ready_for_local_review",
        plainEnglish:
          "Reviewers can open `/login` to inspect the fake local seed-user sign-in form, local Supabase Auth session readiness, and production-auth boundary before any real users are invited.",
      },
      {
        label: "Member chapter home review coverage",
        status: "ready_for_local_review",
        plainEnglish:
          "Members can open `/chapter` for chapter context, current campaign, visible progress, read-only points, and clear links into Rush Month, member roles, campaigns, committees, and proof library without any membership, role, points, proof, or external writes.",
      },
      {
        label: "Member Rush Month overview review coverage",
        status: "ready_for_local_review",
        plainEnglish:
          "Members can open `/rush-month` for the active campaign objective, role next action, visible action counts, proof pending posture, coach-read status, event/proof sections, operating path, and next links into dashboard, actions, and events while campaign phase changes, proof saves, points/KPI writes, Luma writes, n8n workflows, and external sends remain disabled.",
      },
      {
        label: "Member assigned-actions review coverage",
        status: "ready_for_local_review",
        plainEnglish:
          "Members can open `/rush-month/actions` for their assigned-action list, due dates, status, proof requirements, points, KPI signal, and links into action detail while assignment creation, action-start saves, proof saves, reminders, points/KPI writes, browser writes, and external sends remain disabled.",
      },
      {
        label: "Member action detail review coverage",
        status: "ready_for_local_review",
        plainEnglish:
          "Members can open `/rush-month/actions/member-push` to inspect one assigned action, due date, assignee, status, points, why-it-matters copy, steps, evidence requirements, a local confirmation checkbox, preview submit feedback, proof handoff, and outbox posture without saving proof, writing points, uploading files, or sending automation.",
      },
      {
        label: "Member walkthrough sequence",
        status: "ready_for_local_review",
        plainEnglish:
          "The no-code stakeholder review path now orders the member route sequence from local sign-in through profile scope, onboarding, chapter home, Rush Month overview, assigned actions, action detail, evidence submission, leaderboard, dashboard, events, and one event detail before leader, coach, and admin surfaces.",
      },
      {
        label: "Leader walkthrough sequence",
        status: "ready_for_local_review",
        plainEnglish:
          "The no-code stakeholder review path now opens a President / VP dashboard checkpoint before leader follow-up, member-role coverage, the operating loop, event readiness, and proof decisions so the leader review shows KPIs, assignment posture, completion tracking, evidence review, and member management in one local sequence.",
      },
      {
        label: "Coach walkthrough sequence",
        status: "ready_for_local_review",
        plainEnglish:
          "The no-code stakeholder review path now separates coach portfolio health from coach readiness so reviewers can inspect assigned chapters, campaign health, overdue work, pending evidence, KPI movement, risk alerts, advance/hold/intervene posture, support notes, and disabled coach decisions on `/coach`.",
      },
      {
        label: "Admin walkthrough sequence",
        status: "ready_for_local_review",
        plainEnglish:
          "The no-code stakeholder review path now orders admin review from control center to master data, integration outbox, audit log, system health, database security, stakeholder path, Nick final review, release readiness, launch gate, design QA, operations, and write packets while admin mutations and external sends stay disabled.",
      },
      {
        label: "Stakeholder review phase map",
        status: "ready_for_local_review",
        plainEnglish:
          "The no-code stakeholder review path now shows a phase map for member, leader, proof, coach, admin, and write-packet review before the detailed route list so non-technical reviewers can run the 46-step route review in plain English.",
      },
      {
        label: "Nick final review packet",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/nick-review` for one final local MVP review packet with owner lanes, pass signals, Goal 150 launch evidence, pilot scope, launch boundaries, local review yes, live launch no, zero writes, zero sends, and zero student invitations.",
      },
      {
        label: "Mobile visual smoke plan",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/design-qa` for the Goal 146 phone-sized route smoke plan across member, leader, coach, admin, offline, and proof routes before Nick signs off on pilot scope.",
      },
      {
        label: "Mobile route smoke manifest bridge",
        status: "ready_for_local_review",
        plainEnglish:
          "The admin route smoke manifest now carries Goal 147 mobile-review metadata for the same eight routes, including reviewer actor email, 390px viewport, target signal, pass signal, and still-blocked launch boundary.",
      },
      {
        label: "Accessibility smoke plan",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/design-qa` for the Goal 148 keyboard and screen-reader smoke plan across skip link, member actions, proof upload, leader dashboard, coach risk, offline recovery, and restricted-state checks.",
      },
      {
        label: "Device and PWA smoke matrix",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/design-qa` for the Goal 149 real-device, installed-PWA, offline recovery, tablet, desktop, and staging cross-browser smoke matrix before pilot approval.",
      },
      {
        label: "Goal 90-97 role model checkpoint",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin release readiness now gives Nick one route-by-route checkpoint for the local President / VP, E-Board, Action Committee Chair, and guarded-write responsibility model.",
      },
      {
        label: "Admin review surfaces",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin can inspect coverage, route smoke expectations, write gates, result states, outbox posture, and safety blockers.",
      },
      {
        label: "Admin review path route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/review-path` for the no-code route-by-route stakeholder walkthrough with fake local actor emails, expected review moments, safety boundaries, zero writes, and zero sends.",
      },
      {
        label: "Admin release readiness route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/release-readiness` for the focused local-review-ready versus live-launch-blocked summary while production auth, browser writes, proof uploads, external sends, and student invitations remain blocked.",
      },
      {
        label: "Discourse bake-off recommendation",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can now use `/admin/release-readiness` to compare myMEDLIFE against the Discourse prototype in plain language and keep Discourse reference-only while myMEDLIFE advances as the MVP and pilot operating system.",
      },
      {
        label: "Admin master data inventory",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can inspect fake users, named role coverage, chapter scope, and campaign template shells on `/admin` while all mutation controls and external sends remain disabled.",
      },
      {
        label: "Admin master data route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/master-data` for a focused fake-user, named-role, chapter, and campaign-template inventory with zero admin mutations and zero external writes.",
      },
      {
        label: "Admin integration outbox route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/integration-outbox` for structured integration events, automation outbox rows, destination safety, audit posture, and blocked live-send controls.",
      },
      {
        label: "Integration live-send preflight",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can inspect source-event, payload/idempotency, audit-readback, destination-policy, and secrets-boundary checks before any queue mutation, retry, payload edit, unlock, external worker, or live send is approved.",
      },
      {
        label: "Production launch gate",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin and DS Admin can inspect the missing live evidence for auth, RLS, write promotion, proof storage, integrations, observability, campaign templates, and pilot operations.",
      },
      {
        label: "Admin launch gate route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/launch-gate` for the focused eight-gate live launch review and Goal 150 launch evidence checklist while launch approval, production auth, browser writes, proof uploads, vendor switching, external sends, and student invitations remain blocked.",
      },
      {
        label: "Launch evidence checklist",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can review the Goal 150 staging and pilot evidence checklist for staging URL, Supabase posture, auth, RLS/CI, proof storage, device QA, monitoring, integration hold, and pilot support ownership before approval.",
      },
      {
        label: "Database security decision packet",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin and DS Admin can review why the MVP should stay on Supabase/Postgres, what PlanetScale/MySQL would trade off, and which DS/security approvals remain before launch.",
      },
      {
        label: "Admin database security route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/database-security` for the focused Supabase Postgres/Auth/Storage versus PlanetScale MySQL/Vitess review while launch approval, vendor switching, browser writes, proof uploads, service-key exposure, and external sends remain blocked.",
      },
      {
        label: "Admin audit log review",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin and Super Admin can inspect read-only audit-row posture while DS Admin sees summary-only audit safety without row-level chapter/member truth.",
      },
      {
        label: "Admin audit log route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/audit-log` for focused audit readback posture, mock-fallback honesty, hidden-row safety, Goal 156 write-audit preflight, and zero write/send controls.",
      },
      {
        label: "Admin write-audit preflight",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can inspect actor, target, before/after, reason, visibility, and retention/export checks before any audit-producing production write is approved.",
      },
      {
        label: "System health review",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can inspect local route, data, environment, audit, outbox, and blocked production health checks before launch.",
      },
      {
        label: "Admin system health route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/system-health` for focused route, data-source, environment, audit, outbox, auth, proof storage, integration, monitoring, backup, and incident-owner health checks.",
      },
      {
        label: "Admin design QA route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/design-qa` for focused Figma, mobile viewport, accessibility, role complexity, offline recovery, and pilot-safety review with zero writes or external sends.",
      },
      {
        label: "Production operations runbook",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can inspect first-response playbooks, owner lanes, missing live evidence, and blocked monitoring/backup/support approvals without enabling writes or sends.",
      },
      {
        label: "Admin operations route",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin, DS Admin, and Super Admin can open `/admin/operations` for focused incident triage, auth/access recovery, database/RLS recovery, write rollback, proof moderation, integration recovery, mobile PWA support, and pilot communications review with zero writes or sends.",
      },
      {
        label: "PWA offline recovery shell",
        status: "ready_for_local_review",
        plainEnglish:
          "The app has an offline fallback route and conservative service worker that use network-first navigation and static shell caching without storing private chapter data or enabling push, writes, or external sends.",
      },
      {
        label: "Coach support notes",
        status: "ready_for_local_review",
        plainEnglish:
          "Coaches and HQ staff can inspect decision rationale, pending evidence, risk response, owner check-in, and escalation-note posture on `/coach` while note saves and external escalation remain disabled.",
      },
      {
        label: "Coach intervention checklist",
        status: "ready_for_local_review",
        plainEnglish:
          "Coaches and HQ staff can inspect proof review, stalled-work, decision-note, risk-response, and escalation-boundary checks on `/coach` before any coach note save, coach decision, nudge, escalation send, or external automation is approved.",
      },
      {
        label: "Leader proof decision workspace",
        status: "ready_for_local_review",
        plainEnglish:
          "Chapter leaders and HQ staff can inspect approve, request-changes, and reject posture for proof review on `/rush-month/review` while proof decision writes, points updates, nudges, and HQ sharing remain disabled.",
      },
      {
        label: "Leader proof review rubric",
        status: "ready_for_local_review",
        plainEnglish:
          "Chapter leaders and HQ staff can inspect assignment-fit, story-context, points/KPI, and sharing-boundary checks before any proof decision save, nudge, public sharing action, or external send is approved.",
      },
      {
        label: "Leader proof decision result states",
        status: "ready_for_local_review",
        plainEnglish:
          "Chapter leaders and HQ staff can inspect disabled result states for approve, request-changes, and reject outcomes, including future event names, audit actions, points/KPI boundaries, member nudges, and proof-publishing separation.",
      },
      {
        label: "Leader proof decision local write packet",
        status: "ready_for_local_review",
        plainEnglish:
          "Data/security reviewers can inspect the local Supabase function and RLS tests for chapter proof approve, request-changes, and reject decisions while browser saves, member nudges, proof publishing, and external sends remain disabled.",
      },
      {
        label: "Leader proof decision server action",
        status: "ready_for_local_review",
        plainEnglish:
          "Chapter leaders and Super Admin can rehearse the local `/rush-month/review` proof decision server action only with local Supabase Auth and explicit localhost write flags; member nudges, public proof publishing, and external sends remain disabled.",
      },
      {
        label: "Controlled pilot decision packet",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin can see that staff dry run is ready while staging, real student pilot, and scale gates remain blocked until approval.",
      },
      {
        label: "Staff dry-run guide",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can rehearse member, leader, event/NPS, proof, coach, and DS Admin safety paths with fake local actor emails.",
      },
      {
        label: "First pilot scope planner",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can compare safe pilot sizes and see which approvals are still required before inviting real students.",
      },
      {
        label: "First-write activation drill",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can inspect the local action-start write drill before the first localhost-only save is tested.",
      },
      {
        label: "Write sequence planner",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can see which Rush Month write should be promoted next and what evidence each write must create.",
      },
      {
        label: "Proof metadata packet",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can inspect the local proof/testimonial metadata packet before the second localhost-only save is tested.",
      },
      {
        label: "HQ proof decision packet",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can inspect the local proof-sharing decision packet before the third localhost-only save is tested.",
      },
      {
        label: "Leader assignment packet",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can inspect the local chapter-leader assignment packet before the fourth localhost-only save is tested.",
      },
      {
        label: "Coach decision packet",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can inspect the local coach advance / hold / intervene packet before the fifth localhost-only save is tested.",
      },
    ],
    blockers: [
      {
        label: "Live auth and real users",
        status: "blocked_for_live_launch",
        plainEnglish:
          "The app still uses local actors and fake seed/mock data. Production sign-in is not enabled.",
      },
      {
        label: "Browser writes",
        status: "blocked_for_live_launch",
        plainEnglish:
          "Production assignment, proof, membership approval, leader proof decision, HQ decision, coach decision, and admin mutation writes remain disabled; localhost rehearsals require explicit local flags.",
      },
      {
        label: "Proof uploads and public proof sharing",
        status: "blocked_for_live_launch",
        plainEnglish:
          "Bridge videos/testimonials cannot be uploaded or published from the app yet; Goal 159 only previews the storage intake packet.",
      },
      {
        label: "External integrations",
        status: "blocked_for_live_launch",
        plainEnglish:
          "HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes remain disabled.",
      },
      {
        label: "Production environment and visual QA",
        status: "blocked_for_live_launch",
        plainEnglish:
          "Production Supabase/Vercel rollout, real data, final Goal 149 device/PWA QA, accessibility QA, route-smoke-backed Figma/mobile QA, and real-device PWA install/offline approval are still future work.",
      },
    ],
    roleModelReviewCheckpoint: getRoleModelReviewCheckpoint(),
    nextApprovals: [
      "Review the Goal 150 `/admin/launch-gate` launch evidence checklist before approving staging, pilot scope, live launch, browser writes, proof uploads, external sends, or real student invitations.",
      "Review the Goal 149 `/admin/design-qa` device/PWA smoke matrix before approving pilot scope, live launch, browser writes, proof uploads, external sends, or real student invitations.",
      "Review the Goal 148 `/admin/design-qa` accessibility smoke plan before approving pilot scope, live launch, browser writes, proof uploads, external sends, or real student invitations.",
      "Review the Goal 147 `/admin` route smoke manifest mobile metadata before approving pilot scope, live launch, browser writes, proof uploads, external sends, or real student invitations.",
      "Review the Goal 146 `/admin/design-qa` mobile visual smoke plan before approving pilot scope, live launch, browser writes, proof uploads, external sends, or real student invitations.",
      "Review the Goal 151 `/admin/nick-review` pilot scope and launch evidence checkpoint with Nick before approving a pilot, live launch, browser writes, proof uploads, external sends, or real student invitations.",
      "Review the Goal 144 stakeholder review phase map in `/admin/review-path` before final Nick review, live launch approval, browser writes, external sends, or real student invitations.",
      "Review the Goal 143 admin walkthrough sequence in `/admin/review-path` before approving user creation, role writes, chapter edits, campaign template edits, outbox queue mutations, audit exports, system-health launch claims, admin writes, external sends, or real student invitations.",
      "Review the Goal 142 coach walkthrough sequence in `/admin/review-path` before approving coach decisions, support note saves, coach reassignments, KPI writes, escalation packets, n8n workflows, external sends, or real student invitations.",
      "Review the Goal 154 `/coach` intervention checklist before approving coach note saves, coach decisions, nudges, escalation packets, external automation, or real student invitations.",
      "Review the Goal 141 leader walkthrough sequence in `/admin/review-path` before approving assignment creation, action-start activation, proof decisions, member management writes, KPI writes, reminders, external sends, or real student invitations.",
      "Review the Goal 140 member walkthrough sequence in `/admin/review-path` before final Nick review, real student pilot approval, browser writes, uploads, external sends, or student invitations.",
      "Review the Goal 139 `/rush-month/events` member event-list checkpoint before approving event attendance imports, NPS reminders, proof uploads, public proof sharing, Luma handling, warehouse exports, AI summaries, external sends, or real student invitations.",
      "Review the Goal 138 `/rush-month/actions` member assigned-actions checkpoint before approving the final member walkthrough, assignment creation, action-start activation, proof saves, reminders, points/KPI writes, or real student invitations.",
      "Review the Goal 137 `/rush-month` member Rush Month overview checkpoint before approving the final member walkthrough, campaign phase changes, assignment saves, proof saves, points/KPI writes, Luma handling, n8n workflows, or real student invitations.",
      "Review the Goal 136 `/rush-month/actions/member-push` member action detail checkpoint before approving the final member walkthrough, action-start activation, proof metadata saves, uploads, points writes, or real student invitations.",
      "Review the Goal 135 `/chapter` member chapter home checkpoint before approving the final member walkthrough or real student invitations.",
      "Review the Goal 134 `/login` route as the formal local sign-in checkpoint before approving production auth or real student invitations.",
      "Review the Goal 133 `/admin/review-path` route before the final Nick walkthrough so every role-specific route uses the right fake local actor and safety boundary.",
      "Review the Goal 132 `/admin/release-readiness` route before using deeper launch, security, operations, or pilot approval routes.",
      "Review the Goal 131 `/admin/launch-gate` production launch gate and assign owners for each blocked live evidence item before approving any live pilot.",
      "Review the Goal 130 `/admin/database-security` database security decision route with DS/security before production Supabase setup, vendor switching, service-key handling, proof storage, compliance, or launch approval.",
      "Review `/admin` audit log readback posture before approving any production write path.",
      "Review `/admin` system health before pilot approval and assign owners for every blocked production health check.",
      "Review the `/admin/operations` production operations runbook before pilot approval and confirm incident, rollback, backup, integration recovery, mobile PWA, and day-one support owners.",
      "Review the Goal 117 PWA offline shell on a real mobile browser before pilot approval.",
      "Review the Goal 118 `/admin` master data inventory before approving production user, role, chapter, or campaign-template mutations.",
      "Review the Goal 119 `/rush-month/leaderboard` member points flow before approving a student pilot.",
      "Review the Goal 120 `/rush-month/events/event-rush-social-001` event detail before approving real event, NPS, proof, or Luma handling.",
      "Review the Goal 121 `/profile` role scope route before approving production profile, membership, role, or onboarding writes.",
      "Review the Goal 122 `/onboarding` auth/onboarding readiness route before approving live auth, join requests, membership approvals, role writes, coach assignments, or staff role writes.",
      "Review the Goal 157 `/onboarding` production auth preflight checklist before approving callback URLs, real users, profile mapping, join approvals, chapter roles, coach portfolios, staff roles, onboarding automations, or support rollback.",
      "Review the Goal 160 `/chapter/members` membership approval packet before approving join request saves, membership rows, chapter role assignment, welcome messages, CRM syncs, or external sends.",
      "Review the Goal 161 `/chapter/members` membership approval result states before approving join request saves, membership rows, chapter role assignment, welcome messages, CRM syncs, or external sends.",
      "Review the Goal 162 `/chapter/members` membership approval write readiness packet before implementing app.approve_chapter_membership, SQL/RLS tests, server action, rollback, welcome outbox, CRM sync, or browser controls.",
      "Review the Goal 152 `/rush-month/evidence` proof prep checklist before approving proof metadata saves, uploads, public proof, reminders, exports, or AI summaries.",
      "Review the Goal 158 `/rush-month/evidence` proof submission packet before approving proof metadata saves, uploads, member reminders, public proof, exports, or AI summaries.",
      "Review the Goal 159 `/proof-library/upload` proof storage intake packet before approving Supabase Storage buckets, signed upload URLs, storage object writes, public proof URLs, raw proof exports, or AI summaries.",
      "Review the Goal 153 `/rush-month/review` leader proof review rubric before approving leader proof decisions, points/KPI writes, member nudges, public proof, reminders, exports, or AI summaries.",
      "Review the Goal 124 `/admin/master-data` admin inventory before approving production user creation, role writes, chapter edits, campaign template writes, coach assignment changes, or external automation sends.",
      "Review the Goal 125 `/admin/integration-outbox` integration outbox route before approving queue mutations, live-send approvals, retries, payload edits, integration secrets, exports, AI summaries, or external sends.",
      "Review the Goal 155 `/admin/integration-outbox` live-send preflight checklist before approving external workers, retry policy, destination unlocks, or live-send controls.",
      "Review the Goal 126 `/admin/audit-log` audit log route before approving audit-producing production writes, audit row exports, audit retention changes, or admin mutation controls.",
      "Review the Goal 156 `/admin/audit-log` write-audit preflight checklist before approving actor, target, before/after, reason, visibility, retention/export, or audit-producing production write controls.",
      "Review the Goal 127 `/admin/system-health` system health route before approving production auth, deployment, proof uploads, integrations, monitoring claims, backup claims, incident ownership, or live pilot launch.",
      "Review the Goal 128 `/admin/design-qa` route before approving final Figma match, mobile QA, accessibility QA, offline PWA behavior, staging visual smoke checks, or live pilot launch.",
      "Review the Goal 129 `/admin/operations` route before approving incident response, rollback, backup, integration recovery, mobile PWA support, day-one support ownership, or live pilot launch.",
      "Approve live auth/onboarding plan.",
      "Run the Goal 115 leader proof decision SQL/RLS packet before testing the Goal 116 local leader proof decision server action.",
      "Run `/admin/first-write`, then use `/admin/write-sequence`, `/admin/proof-write`, `/rush-month/review`, `/admin/hq-proof-write`, `/admin/assignment-write`, `/admin/coach-write`, and `/chapter/members` to approve the next browser write path and rollback plan.",
      "Approve proof upload/storage and consent requirements.",
      "Approve production Supabase/Vercel environment setup.",
      "Approve first pilot chapter or internal test group from `/admin/pilot-scope`.",
      "Approve any real n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, or AI integration.",
    ],
  };
}

function getRoleModelReviewCheckpoint(): RoleModelReviewCheckpoint {
  return {
    title: "Goal 90-97 role model checkpoint",
    plainEnglish:
      "Use this checkpoint to review the accumulated role/persona work as one coherent local MVP role model before approving any live auth, browser writes, or external automation.",
    items: [
      {
        label: "President / VP dashboard accountability",
        route: "/rush-month/dashboard",
        reviewerActorEmail: "leader.a@mymedlife.test",
        passSignal:
          "Dashboard emphasizes approval guardrails, chapter accountability, and what should be reviewed next.",
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
      {
        label: "E-Board dashboard execution follow-up",
        route: "/rush-month/dashboard",
        reviewerActorEmail: "eboard.a@mymedlife.test",
        passSignal:
          "Dashboard emphasizes owner/event execution and proof follow-up without granting President / VP approvals.",
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
      {
        label: "Leader assignment and action follow-up",
        route: "/rush-month/actions",
        reviewerActorEmail: "leader.a@mymedlife.test",
        passSignal:
          "Actions separate President / VP assignment guardrails from E-Board owner follow-up.",
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
      {
        label: "Leader proof follow-up",
        route: "/rush-month/review",
        reviewerActorEmail: "eboard.a@mymedlife.test",
        passSignal:
          "Review page keeps chapter proof follow-up separate from HQ proof-sharing decisions.",
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
      {
        label: "Roster and membership posture",
        route: "/chapter/members",
        reviewerActorEmail: "leader.a@mymedlife.test",
        passSignal:
          "Roster distinguishes President / VP role coverage from E-Board member follow-up and shows the Goal 160 membership approval packet plus Goal 161 result states while membership writes stay disabled.",
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
      {
        label: "Assignment responsibility packet",
        route: "/admin/assignment-write",
        reviewerActorEmail: "admin@mymedlife.test",
        passSignal:
          "Packet names President / VP approval, E-Board owner handoff, and Action Committee Chair coordination.",
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
      {
        label: "Seven-write responsibility sequence",
        route: "/admin/write-sequence",
        reviewerActorEmail: "admin@mymedlife.test",
        passSignal:
          "Every guarded local write names the responsible role, review prompt, and safety boundary.",
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
      {
        label: "Admin responsibility summary",
        route: "/admin",
        reviewerActorEmail: "admin@mymedlife.test",
        passSignal:
          "Admin summarizes the same seven guarded-write responsibilities before deeper packet review.",
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
    ],
    finalDecisionPrompt:
      "After this checkpoint, Nick should decide whether the local role model is clear enough to proceed to auth/onboarding approval, not whether live writes should be enabled immediately.",
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin release-readiness summary";
    case "ds_admin":
      return "DS Admin release-readiness summary";
    case "super_admin":
      return "Full local release-readiness summary";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Release readiness hidden for this role";
  }
}
