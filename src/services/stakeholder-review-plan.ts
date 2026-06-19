import type { LocalActorContext } from "@/services/local-actor-context";

export type StakeholderReviewStep = {
  id: string;
  title: string;
  route: string;
  localActorEmail: string;
  actorLabel: string;
  expectedReview: string;
  safetyBoundary: string;
};

export type StakeholderReviewPhase = {
  id: string;
  title: string;
  summary: string;
  stepIds: string[];
  stepCount: number;
  stepRange: string;
};

export type StakeholderReviewPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  phases: StakeholderReviewPhase[];
  steps: StakeholderReviewStep[];
  counts: {
    steps: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

const reviewPhaseDefinitions: Omit<
  StakeholderReviewPhase,
  "stepCount" | "stepRange"
>[] = [
  {
    id: "member-walkthrough",
    title: "Member walkthrough",
    summary:
      "Review local sign-in, chapter context, Rush Month actions, proof submission, points, leaderboard, dashboard, events, and one event detail.",
    stepIds: [
      "local-sign-in",
      "profile-scope",
      "auth-onboarding",
      "member-chapter-home",
      "member-rush-month-overview",
      "member-assigned-actions",
      "member-action-detail",
      "member-evidence-submission",
      "member-leaderboard",
      "member-week",
      "member-events-list",
      "event-detail",
    ],
  },
  {
    id: "leader-walkthrough",
    title: "Leader walkthrough",
    summary:
      "Review leader dashboard context, assignment follow-up, member-role coverage, the operating loop, event readiness, and proof decisions.",
    stepIds: [
      "leader-dashboard",
      "leader-follow-up",
      "member-role-coverage",
      "operating-loop",
      "event-readiness",
      "leader-proof-decisions",
    ],
  },
  {
    id: "proof-readiness",
    title: "Proof readiness",
    summary:
      "Review HQ proof-sharing posture and upload requirements while uploads, publishing, exports, and AI summaries stay disabled.",
    stepIds: ["proof-review", "proof-upload-readiness"],
  },
  {
    id: "coach-walkthrough",
    title: "Coach walkthrough",
    summary:
      "Review portfolio health, risk, evidence, KPI movement, support notes, and disabled advance / hold / intervene controls.",
    stepIds: ["coach-portfolio", "coach-readiness"],
  },
  {
    id: "admin-walkthrough",
    title: "Admin walkthrough",
    summary:
      "Review control center, users and roles, chapters, campaign templates, outbox, audit, system health, security, Nick review, release readiness, launch gates, design QA, and operations.",
    stepIds: [
      "admin-safety",
      "admin-master-data",
      "admin-integration-outbox",
      "admin-audit-log",
      "admin-system-health",
      "database-security",
      "stakeholder-review-path",
      "nick-final-review",
      "release-readiness",
      "production-launch-gate",
      "design-qa",
      "pilot-readiness",
      "production-operations",
    ],
  },
  {
    id: "write-packets",
    title: "Write packets",
    summary:
      "Review staff dry run, pilot scope, first write, write sequence, proof metadata, HQ proof, points/KPI, SLT checklist, leader assignment, and coach decision packets.",
    stepIds: [
      "staff-dry-run",
      "pilot-scope",
      "first-write-drill",
      "write-sequence",
      "proof-metadata-packet",
      "hq-proof-decision-packet",
      "points-kpi-packet",
      "slt-checklist-packet",
      "leader-assignment-packet",
      "coach-decision-packet",
    ],
  },
];

const reviewSteps: StakeholderReviewStep[] = [
  {
    id: "local-sign-in",
    title: "Review local sign-in bridge",
    route: "/login",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A reviewer can see the fake local seed-user sign-in form, password guidance, local Supabase Auth session readiness, and why production users remain blocked.",
    safetyBoundary:
      "No production auth, production user creation, profile save, membership write, browser write, or external send should happen.",
  },
  {
    id: "profile-scope",
    title: "Review profile and role scope",
    route: "/profile",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A member can see identity, chapter role, chapter scope, next safe action, future profile events, and zero profile, membership, role, or external writes.",
    safetyBoundary:
      "No profile save, join request, role approval, membership change, coach assignment, or external send should happen.",
  },
  {
    id: "auth-onboarding",
    title: "Review auth and onboarding path",
    route: "/onboarding",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A reviewer can see the future sign-in, profile, chapter join, membership approval, role assignment, coach assignment, and staff role assignment sequence before production onboarding is approved; staff can repeat `/onboarding` as Admin, DS Admin, or Super Admin to inspect the Goal 157 production auth preflight.",
    safetyBoundary:
      "No live auth, production user, profile save, join request, membership approval, role assignment, coach assignment, staff role assignment, browser write, or external send should happen.",
  },
  {
    id: "member-chapter-home",
    title: "Open the member chapter home",
    route: "/chapter",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A member can see chapter context, current campaign, visible progress, read-only points, and clear next links into Rush Month, members and roles, campaigns, committees, and proof library.",
    safetyBoundary:
      "No membership write, role approval, points write, campaign write, proof upload, or external send should happen.",
  },
  {
    id: "member-rush-month-overview",
    title: "Open the Rush Month overview",
    route: "/rush-month",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A member can see the active Rush Month objective, visible actions count, proof pending count, coach-read posture, event/proof sections, operating path, and clear next links into dashboard, actions, and events.",
    safetyBoundary:
      "No campaign phase advance, assignment save, proof save, points/KPI write, Luma write, n8n workflow, or external send should happen.",
  },
  {
    id: "member-assigned-actions",
    title: "Review member assigned actions",
    route: "/rush-month/actions",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A member can see their visible assigned-action list, due dates, status, proof requirements, points, KPI signal, and links into the next action detail.",
    safetyBoundary:
      "No assignment creation, action-start save, proof save, reminder send, points/KPI write, browser write, or external send should happen.",
  },
  {
    id: "member-action-detail",
    title: "Open one assigned action detail",
    route: "/rush-month/actions/member-push",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A member can open one assigned action and see owner, status, points, evidence requirements, proof/testimonial handoff, local action-start posture, disabled upload controls, and future outbox/audit posture.",
    safetyBoundary:
      "No action-start save, proof metadata save, file upload, points/KPI write, reminder send, or external send should happen.",
  },
  {
    id: "member-evidence-submission",
    title: "Review member proof submission",
    route: "/rush-month/evidence",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A member can see the next proof item, submission queue, proof prep checklist, Goal 158 proof submission packet, story prompt, review lane, proof status, future structured records, and the linked proof-intake preview for the local-only proof metadata write gate.",
    safetyBoundary:
      "No proof metadata save, file upload, public proof publish, direct points/KPI write, reminder send, warehouse export, AI summary, or external send should happen.",
  },
  {
    id: "member-leaderboard",
    title: "Check the member leaderboard",
    route: "/rush-month/leaderboard",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A student can open a direct points, rank, recognition, chapter impact, and next-action readout.",
    safetyBoundary:
      "No points ledger write, KPI write, leaderboard mutation, member nudge, or external send should happen.",
  },
  {
    id: "member-week",
    title: "Start with the member week",
    route: "/rush-month/dashboard",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A student can see what to do next, their points, recognition, and chapter-level impact.",
    safetyBoundary: "No points write, proof save, login, or external send should happen.",
  },
  {
    id: "member-events-list",
    title: "Review member Rush Month events",
    route: "/rush-month/events",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A member can see Rush Month event plans, expected student actions, feedback/NPS prompts, proof prompts, proof-intake link, disabled Luma posture, disabled outbox destinations, and the attend-reflect-share bridge.",
    safetyBoundary:
      "No Luma write, attendance import, NPS reminder, proof upload, public proof share, warehouse export, AI summary, or external send should happen.",
  },
  {
    id: "event-detail",
    title: "Open one Rush Month event detail",
    route: "/rush-month/events/event-rush-social-001",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "Member",
    expectedReview:
      "A member can open one event and see the next action, owner, student action, feedback/NPS prompt, proof prompt, readiness checks, and disabled event outbox rows.",
    safetyBoundary:
      "No Luma write, attendance import, NPS reminder, proof upload, event recap write, warehouse export, or n8n workflow should happen.",
  },
  {
    id: "leader-dashboard",
    title: "Review leader dashboard",
    route: "/rush-month/dashboard",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "President / VP",
    expectedReview:
      "A leader can see chapter KPIs, completion posture, proof queues, role-coverage signals, and the next President / VP decisions before assigning or reviewing work.",
    safetyBoundary:
      "No assignment save, proof decision, membership change, points/KPI write, reminder send, browser write, or external send should happen.",
  },
  {
    id: "leader-follow-up",
    title: "Review leader follow-up",
    route: "/rush-month/actions",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "Chapter Leader",
    expectedReview:
      "A leader can see assignment follow-up, owner nudges, proof needs, and disabled assignment creation posture.",
    safetyBoundary: "No assignment creation, reminder send, or browser write should happen.",
  },
  {
    id: "member-role-coverage",
    title: "Review member and role coverage",
    route: "/chapter/members",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "Chapter Leader",
    expectedReview:
      "A leader can see roster follow-up, join requests, action committee role coverage, the Goal 160 membership approval packet, Goal 161 membership result states, and disabled membership controls.",
    safetyBoundary:
      "No join approval, role assignment, committee move, or member deactivation should happen.",
  },
  {
    id: "operating-loop",
    title: "Click through the Rush Month loop",
    route: "/rush-month/loop",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "Chapter Leader",
    expectedReview:
      "A reviewer can walk through assignment, action start, proof, review, points/KPIs, coach decision, events, outbox, and audit logs.",
    safetyBoundary: "The loop stays browser-local and does not save to Supabase or send automation.",
  },
  {
    id: "event-readiness",
    title: "Review Rush Month events and NPS",
    route: "/rush-month/events",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "Chapter Leader",
    expectedReview:
      "A reviewer can see Rush Month event owners, student actions, NPS prompts, proof prompts, disabled Luma posture, and disabled outbox rows.",
    safetyBoundary:
      "No Luma event write, attendance import, NPS reminder, warehouse export, or n8n workflow should happen.",
  },
  {
    id: "leader-proof-decisions",
    title: "Review leader proof decisions",
    route: "/rush-month/review",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "Chapter Leader",
    expectedReview:
      "A leader can see the Goal 153 review rubric, gated local approve, request-changes, and reject controls plus disabled result states for chapter proof decisions while HQ sharing remains separate and the Goal 116 server action depends on the Goal 115 SQL/RLS packet.",
    safetyBoundary:
      "No production proof decision save, result-state save, direct points ledger/KPI browser write, member nudge, public sharing, export, or AI summary should happen.",
  },
  {
    id: "proof-review",
    title: "Check HQ proof-sharing posture",
    route: "/proof-library",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see which proof/testimonials need consent, context, internal learning review, or future public review.",
    safetyBoundary: "No proof upload, public publish, AI summary, or warehouse export should happen.",
  },
  {
    id: "proof-upload-readiness",
    title: "Preview proof upload requirements",
    route: "/proof-library/upload",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A student can understand consent, file requirements, context requirements, the Goal 159 storage packet, and why uploads are still locked.",
    safetyBoundary:
      "No file upload, storage object, public URL, external export, or AI summary should happen.",
  },
  {
    id: "coach-portfolio",
    title: "Review coach portfolio health",
    route: "/coach",
    localActorEmail: "coach@mymedlife.test",
    actorLabel: "Coach",
    expectedReview:
      "A coach can compare assigned chapters, campaign health, overdue work, pending evidence, KPI movement, risk alerts, and advance / hold / intervene signals before the next chapter check-in.",
    safetyBoundary:
      "No coach reassignment, coach decision save, KPI write, note save, escalation packet, browser write, or external send should happen.",
  },
  {
    id: "coach-readiness",
    title: "Inspect coach readiness",
    route: "/coach",
    localActorEmail: "coach@mymedlife.test",
    actorLabel: "Coach",
    expectedReview:
      "A coach can inspect the Goal 154 intervention checklist, support notes, decision rationale, risk response, owner check-in posture, closeout readiness, disabled advance / hold / intervene controls, and local-only readback expectations.",
    safetyBoundary:
      "No coach note save, coach decision save, reassignment, member nudge, escalation packet, n8n workflow, or external send should happen.",
  },
  {
    id: "admin-safety",
    title: "Open admin control center",
    route: "/admin",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "Admin can inspect the control center for users, named role coverage, chapters, campaign templates, route coverage, smoke manifest, integration/outbox safety, and release posture.",
    safetyBoundary:
      "No user creation, role write, chapter edit, campaign template edit, browser write, or external send should happen.",
  },
  {
    id: "admin-master-data",
    title: "Review admin master data",
    route: "/admin/master-data",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can inspect fake users, named role coverage, chapter scope, campaign templates, blocked admin writes, and zero mutation controls from one focused route.",
    safetyBoundary:
      "No production user creation, profile edit, role write, membership approval, chapter edit, campaign template edit, coach assignment change, or external send should happen.",
  },
  {
    id: "admin-integration-outbox",
    title: "Review integration outbox",
    route: "/admin/integration-outbox",
    localActorEmail: "ds.admin@mymedlife.test",
    actorLabel: "DS Admin",
    expectedReview:
      "DS can inspect structured integration events, automation outbox rows, the Goal 155 live-send preflight checklist, destination safety, audit posture, and blocked live controls from one focused route.",
    safetyBoundary:
      "No queue mutation, live-send approval, retry, payload edit, secret exposure, external worker, export, AI summary, or external send should happen.",
  },
  {
    id: "admin-audit-log",
    title: "Review audit log posture",
    route: "/admin/audit-log",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "Admin can inspect persisted audit readback posture, Goal 156 write-audit preflight, mock fallback honesty, hidden-row posture for DS Admin, and zero write/send controls from one focused route.",
    safetyBoundary:
      "No audit row edit, audit deletion, audit export, retention change, production write, external send, or secret exposure should happen.",
  },
  {
    id: "admin-system-health",
    title: "Review system health",
    route: "/admin/system-health",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "Admin can inspect route registry, data source, environment, audit, outbox, auth, proof storage, integration, monitoring, backup, and incident-owner health checks from one focused route.",
    safetyBoundary:
      "No launch approval, production auth, production write, proof upload, external send, secret exposure, monitoring claim, or backup claim should happen.",
  },
  {
    id: "database-security",
    title: "Review database security decision",
    route: "/admin/database-security",
    localActorEmail: "ds.admin@mymedlife.test",
    actorLabel: "DS Admin",
    expectedReview:
      "DS can inspect why Supabase Postgres/Auth/Storage stays recommended for the MVP, what PlanetScale MySQL/Vitess would trade off, and which RLS, service-key, proof-storage, compliance, and migration approvals remain.",
    safetyBoundary:
      "No live launch approval, production Supabase connection, vendor switch, browser write, proof upload, secret exposure, external send, or PHI/ePHI processing should happen.",
  },
  {
    id: "stakeholder-review-path",
    title: "Review the full no-code path",
    route: "/admin/review-path",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can inspect the full route-by-route stakeholder review sequence, fake local actor emails, expected review moments, safety boundaries, zero writes, and zero sends from one focused route.",
    safetyBoundary:
      "No production auth, browser write, proof upload, public proof sharing, external send, or student invitation should happen.",
  },
  {
    id: "nick-final-review",
    title: "Run Nick final local review",
    route: "/admin/nick-review",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "Nick and HQ can inspect the final local MVP review packet, owner lanes, pass signals, launch boundaries, and explicit no-live-launch posture from one focused route.",
    safetyBoundary:
      "No live launch approval, production auth, browser write, proof upload, external send, or student invitation should happen.",
  },
  {
    id: "release-readiness",
    title: "Review MVP release readiness",
    route: "/admin/release-readiness",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can inspect the local review yes, live launch no, ready items, blocked items, next approvals, role checkpoint, zero writes, and zero sends from one focused route.",
    safetyBoundary:
      "No live launch approval, production auth, browser write, proof upload, external send, or student invitation should happen.",
  },
  {
    id: "production-launch-gate",
    title: "Review production launch gate",
    route: "/admin/launch-gate",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can inspect the eight production launch gates, missing live evidence, review routes, owner sign-off needs, rollback posture, launch no, zero writes, and zero sends from one focused route.",
    safetyBoundary:
      "No live launch approval, production auth, browser write, proof upload, vendor switch, external send, or student invitation should happen.",
  },
  {
    id: "design-qa",
    title: "Run Figma and mobile QA",
    route: "/admin/design-qa",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "A reviewer can compare the running app to the Figma target, phone viewport, accessibility expectations, role complexity, plain-English next-action clarity, offline recovery, and pilot-safety copy from one focused route.",
    safetyBoundary:
      "Design QA must not enable auth, browser writes, uploads, public proof sharing, or external sends.",
  },
  {
    id: "pilot-readiness",
    title: "Decide controlled pilot readiness",
    route: "/admin",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "A reviewer can see that staff dry run is ready, but staging, real student pilot, proof/storage, auth, writes, and external integration gates still need approval.",
    safetyBoundary:
      "The pilot readiness panel is a decision packet, not approval to invite students or enable production writes.",
  },
  {
    id: "production-operations",
    title: "Review production operations",
    route: "/admin/operations",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can inspect incident triage, auth/access recovery, database/RLS recovery, write rollback, proof moderation, integration recovery, mobile PWA support, and pilot communications from one focused route.",
    safetyBoundary:
      "The operations route must not approve live launch, production auth, browser writes, proof uploads, external sends, monitoring claims, backup claims, support-owner claims, or student invitations.",
  },
  {
    id: "staff-dry-run",
    title: "Run the staff dry-run guide",
    route: "/admin/staff-dry-run",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ staff can rehearse the member, leader, event/NPS, proof, coach, and DS Admin safety path with fake local actors.",
    safetyBoundary:
      "The dry run is rehearsal evidence only and must not enable real auth, writes, uploads, student invitations, or external sends.",
  },
  {
    id: "pilot-scope",
    title: "Choose the smallest safe pilot scope",
    route: "/admin/pilot-scope",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can compare staff-only, one-chapter, two-chapter, and broad-launch options and see which approvals block real student use.",
    safetyBoundary:
      "The pilot planner is a decision surface only and must not invite students, enable writes, upload proof, or send external automation.",
  },
  {
    id: "first-write-drill",
    title: "Review the first-write activation drill",
    route: "/admin/first-write",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see the exact local checks, fake member route, and proof needed before action-start becomes the first localhost-only write.",
    safetyBoundary:
      "The drill does not approve production writes and must keep proof uploads, other browser writes, and external sends disabled.",
  },
  {
    id: "write-sequence",
    title: "Review the Rush Month write sequence",
    route: "/admin/write-sequence",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see why action-start is the first write to prove, which writes follow, what evidence each write must create, and what external sends stay disabled.",
    safetyBoundary:
      "The sequence planner is a promotion map only and must not enable auth, uploads, browser writes, public proof sharing, or external automation.",
  },
  {
    id: "proof-metadata-packet",
    title: "Review the proof metadata packet",
    route: "/admin/proof-write",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see the second local write packet for member proof/testimonial metadata, including first-write prerequisites, disabled upload posture, and readback evidence.",
    safetyBoundary:
      "The proof packet must not enable file uploads, public proof sharing, warehouse export, AI summary, or external automation.",
  },
  {
    id: "hq-proof-decision-packet",
    title: "Review the HQ proof decision packet",
    route: "/admin/hq-proof-write",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see the third local write packet for deciding whether submitted proof/testimonials can be shared later, including proof metadata prerequisites and disabled publish/send posture.",
    safetyBoundary:
      "The HQ decision packet must not publish proof, export proof, generate AI summaries, or send external automation.",
  },
  {
    id: "points-kpi-packet",
    title: "Review the points and KPI packet",
    route: "/admin/points-write",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see the points/KPI review packet for confirming one approved proof path maps to one points row and one KPI row, with duplicate protection and disabled downstream sends.",
    safetyBoundary:
      "The points/KPI packet must not trigger warehouse exports, Power BI updates, member nudges, or external automation.",
  },
  {
    id: "slt-checklist-packet",
    title: "Review the SLT checklist packet",
    route: "/admin/slt-checklist-write",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see the SLT checklist completion packet for one traveler-owned readiness item, including the readiness delta, staff follow-up visibility, and locked external travel-system posture.",
    safetyBoundary:
      "The SLT checklist packet must not change Shopify, HubSpot, Luma, flight, payment, form, meeting, upload, or external automation state.",
  },
  {
    id: "leader-assignment-packet",
    title: "Review the leader assignment packet",
    route: "/admin/assignment-write",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see the fourth local write packet for chapter-leader assignment creation, including HQ decision prerequisites, duplicate checks, disabled reminder posture, and readback evidence.",
    safetyBoundary:
      "The leader assignment packet must not send reminders, HubSpot handoffs, n8n workflows, Luma writes, or external automation.",
  },
  {
    id: "coach-decision-packet",
    title: "Review the coach decision packet",
    route: "/admin/coach-write",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see the fifth local write packet for coach advance / hold / intervene logging, including leader assignment prerequisites, disabled escalation posture, and readback evidence.",
    safetyBoundary:
      "The coach decision packet must not send n8n escalation packets, HubSpot notes, email, SMS, warehouse exports, Power BI updates, AI summaries, or external automation.",
  },
];

export function getStakeholderReviewPlan(
  actor: LocalActorContext,
): StakeholderReviewPlan {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadPlan: false,
      title: "Stakeholder review path hidden for this role",
      summary: "This no-code review guide is for admin review contexts.",
      phases: [],
      steps: [],
      counts: emptyCounts(),
    };
  }

  return {
    canReadPlan: true,
    title: getTitle(actor),
    summary:
      "Use this sequence to review the local MVP in plain English without turning on auth, writes, uploads, public proof sharing, or integrations.",
    phases: buildReviewPhases(reviewSteps),
    steps: reviewSteps,
    counts: {
      steps: reviewSteps.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function buildReviewPhases(steps: StakeholderReviewStep[]): StakeholderReviewPhase[] {
  return reviewPhaseDefinitions.map((phase) => {
    const stepNumbers = phase.stepIds
      .map((stepId) => steps.findIndex((step) => step.id === stepId) + 1)
      .filter((stepNumber) => stepNumber > 0);
    if (stepNumbers.length === 0) {
      return {
        ...phase,
        stepCount: 0,
        stepRange: "missing",
      };
    }

    const firstStep = Math.min(...stepNumbers);
    const lastStep = Math.max(...stepNumbers);

    return {
      ...phase,
      stepCount: stepNumbers.length,
      stepRange: `${firstStep}-${lastStep}`,
    };
  });
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin stakeholder review path";
    case "ds_admin":
      return "DS Admin stakeholder review path";
    case "super_admin":
      return "Full local stakeholder review path";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Stakeholder review path hidden for this role";
  }
}

function emptyCounts(): StakeholderReviewPlan["counts"] {
  return {
    steps: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
