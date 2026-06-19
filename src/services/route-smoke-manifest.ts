import type { ActorAudience, LocalActorContext } from "@/services/local-actor-context";
import {
  getMobileVisualSmokeChecks,
  type MobileVisualSmokeCheck,
} from "@/services/design-qa-readiness";

export type RouteSmokePriority = "critical" | "important" | "support";

export type RouteSmokeMobileReview = {
  designQaKey: string;
  reviewerActorEmail: string;
  viewport: string;
  targetSignal: string;
  passSignal: string;
  blockedUntil: string;
};

export type RouteSmokeItem = {
  path: string;
  label: string;
  priority: RouteSmokePriority;
  audiences: ActorAudience[];
  expectedResult: string;
  safetyAssertion: string;
  mobileReview?: RouteSmokeMobileReview;
};

export type RouteSmokeManifest = {
  canReadManifest: boolean;
  title: string;
  summary: string;
  routes: RouteSmokeItem[];
  counts: {
    totalRoutes: number;
    criticalRoutes: number;
    mobileVisualChecks: number;
    roleVariants: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getRouteSmokeManifest(
  actor: LocalActorContext,
): RouteSmokeManifest {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadManifest: false,
      title: "Route smoke manifest hidden for this role",
      summary:
        "Chapter and coach roles should use operating routes rather than release-check manifests.",
      routes: [],
      counts: emptyCounts(),
    };
  }

  const routes = withMobileReviewMetadata(routeSmokeItems);

  return {
    canReadManifest: true,
    title: getTitle(actor),
    summary:
      "Use this manifest for manual browser smoke checks across the core Rush Month and SLT Prep MVP routes, local actor roles, and Goal 147 mobile-review metadata.",
    routes,
    counts: {
      totalRoutes: routes.length,
      criticalRoutes: routes.filter((route) => route.priority === "critical").length,
      mobileVisualChecks: routes.filter((route) => route.mobileReview).length,
      roleVariants: routes.reduce((total, route) => total + route.audiences.length, 0),
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function withMobileReviewMetadata(routes: RouteSmokeItem[]): RouteSmokeItem[] {
  const mobileChecksByRoute = new Map(
    getMobileVisualSmokeChecks().map((check) => [check.route, check]),
  );

  return routes.map((route) => {
    const mobileCheck = mobileChecksByRoute.get(route.path);

    if (!mobileCheck) {
      return route;
    }

    return {
      ...route,
      mobileReview: toRouteSmokeMobileReview(mobileCheck),
    };
  });
}

function toRouteSmokeMobileReview(
  check: MobileVisualSmokeCheck,
): RouteSmokeMobileReview {
  return {
    designQaKey: check.key,
    reviewerActorEmail: check.reviewerActorEmail,
    viewport: check.viewport,
    targetSignal: check.targetSignal,
    passSignal: check.passSignal,
    blockedUntil: check.blockedUntil,
  };
}

const routeSmokeItems: RouteSmokeItem[] = [
  {
    path: "/",
    label: "Role-aware home",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "ds_admin"],
    expectedResult: "Shows the selected local actor and the role next-action panel.",
    safetyAssertion: "No login, browser write, or external send is expected.",
  },
  {
    path: "/offline",
    label: "PWA offline recovery",
    priority: "support",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "ds_admin"],
    expectedResult:
      "Shows a mobile recovery shell without private chapter data when the app cannot reach the network.",
    safetyAssertion:
      "Offline mode must not submit work, upload proof, update points, nudge members, cache private data, or send external automation.",
  },
  {
    path: "/login",
    label: "Local sign-in",
    priority: "critical",
    audiences: [
      "chapter_member",
      "chapter_leader",
      "coach",
      "admin",
      "ds_admin",
      "super_admin",
    ],
    expectedResult:
      "Shows the fake local seed-user sign-in form, local Supabase Auth session readiness, fake account suggestions, and the disabled production-auth boundary.",
    safetyAssertion:
      "Production auth, production users, profile writes, membership writes, browser writes, and external sends remain disabled.",
  },
  {
    path: "/profile",
    label: "Role profile and scope",
    priority: "critical",
    audiences: [
      "chapter_member",
      "chapter_leader",
      "coach",
      "admin",
      "ds_admin",
      "super_admin",
    ],
    expectedResult:
      "Shows the selected local actor, role/chapter or staff scope, next safe action, future profile events, and zero profile, membership, role, or external writes.",
    safetyAssertion:
      "Profile saves, join requests, role approvals, membership changes, coach assignments, and external sends remain disabled.",
  },
  {
    path: "/onboarding",
    label: "Auth onboarding readiness",
    priority: "critical",
    audiences: [
      "chapter_member",
      "chapter_leader",
      "coach",
      "admin",
      "ds_admin",
      "super_admin",
    ],
    expectedResult:
      "Shows the future sign-in, profile, join request, membership approval, role assignment, coach assignment, and staff role assignment sequence with owner roles, disabled events, plus the Goal 157 staff production auth preflight for Admin, DS Admin, and Super Admin.",
    safetyAssertion:
      "Live auth, production users, profile saves, join requests, membership approvals, role assignments, coach assignments, staff role assignments, browser writes, and external sends remain disabled.",
  },
  {
    path: "/chapter",
    label: "Chapter home",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "ds_admin"],
    expectedResult:
      "Chapter roles see chapter context, current campaign, visible progress, read-only points, and next links into Rush Month, members and roles, campaigns, committees, and proof library; DS Admin sees restricted integration-only messaging.",
    safetyAssertion:
      "Chapter membership writes, role approvals, points writes, campaign writes, proof uploads, and external sends remain disabled.",
  },
  {
    path: "/chapter/members",
    label: "Chapter members and roles",
    priority: "critical",
    audiences: ["chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Leaders and staff see roster health, join requests, the Goal 160 membership approval packet, Goal 161 membership result states, role coverage, and disabled membership controls.",
    safetyAssertion:
      "Join approvals, role changes, committee moves, and member deactivation remain disabled.",
  },
  {
    path: "/slt-prep",
    label: "Traveler trip prep home",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Reviewers see the Peru SLT countdown, readiness score, alerts, flights, checklist, forms, payments, meetings, extensions, notifications, and profile links for one traveler packet.",
    safetyAssertion:
      "Traveler readiness writes, payment updates, flight edits, meeting RSVPs, reminders, CRM writes, and external sends remain disabled.",
  },
  {
    path: "/slt-prep/staff",
    label: "Staff traveler readiness dashboard",
    priority: "critical",
    audiences: ["coach", "admin", "super_admin"],
    expectedResult:
      "Coach and staff can filter travelers by risk, change focus views, preview bulk support actions, inspect one traveler summary, and keep all writes blocked.",
    safetyAssertion:
      "Bulk traveler follow-up, Luma changes, HubSpot writes, Shopify edits, audit writes, and external sends remain disabled.",
  },
  {
    path: "/rush-month",
    label: "Rush Month campaign",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "ds_admin"],
    expectedResult:
      "Allowed roles see the active Rush Month objective, role next action, visible actions, proof pending, coach-read posture, closeout readiness, event/proof sections, operating path, and links to dashboard, actions, and events; DS Admin is restricted.",
    safetyAssertion:
      "No campaign phase advance, assignment save, proof save, points/KPI write, Luma write, n8n workflow, or external send is expected.",
  },
  {
    path: "/rush-month/dashboard",
    label: "Role dashboard",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "ds_admin"],
    expectedResult:
      "Members see phase, KPIs, why-it-matters context, role action groups, recognition, and next action; leaders/coaches see operating health; DS Admin sees integration posture only.",
    safetyAssertion: "No points write, KPI write, or leaderboard mutation is expected.",
  },
  {
    path: "/rush-month/leaderboard",
    label: "Member points and leaderboard",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Members see points, rank, recognition, and chapter impact; leaders/coaches/HQ can inspect recognition context.",
    safetyAssertion:
      "No points ledger write, KPI write, leaderboard mutation, member nudge, or external send is expected.",
  },
  {
    path: "/rush-month/events",
    label: "Event and NPS readiness",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Members see Rush Month event plans, expected student actions, feedback/NPS prompts, proof prompts, proof-intake link, disabled Luma syncs, disabled outbox rows, and the attend-reflect-share bridge; leaders and staff can inspect readiness.",
    safetyAssertion:
      "No Luma event create/update, attendance import, NPS reminder, proof upload, public proof share, warehouse export, AI summary, external send, or n8n workflow is expected.",
  },
  {
    path: "/rush-month/events/event-rush-social-001",
    label: "Event detail readiness",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Reviewers can open one Rush Month event and see owner, student action, NPS prompt, proof prompt, readiness checks, and disabled outbox rows.",
    safetyAssertion:
      "No Luma write, attendance import, NPS reminder, proof upload, event recap write, warehouse export, or n8n workflow is expected.",
  },
  {
    path: "/rush-month/actions",
    label: "Assignments and follow-up",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "ds_admin"],
    expectedResult:
      "Members see their assigned-action list, due dates, status, proof requirements, points, KPI signals, and links into action detail; leaders see follow-up board; DS Admin sees restricted assignment state.",
    safetyAssertion:
      "Assignment creation, action-start saves, proof saves, reminder sends, points/KPI writes, browser writes, and external sends remain disabled unless explicitly approved.",
  },
  {
    path: "/rush-month/actions/member-push",
    label: "Member action detail",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Reviewers can open one assigned action and see due date, assignee, status, 30-point posture, why it matters, steps, evidence requirements, local confirmation checkbox, preview submit state, proof handoff, outbox preview, and next action.",
    safetyAssertion:
      "Action-start saves, proof metadata saves, file uploads, direct points/KPI writes, reminders, and external sends remain disabled unless localhost-only write flags are explicitly approved.",
  },
  {
    path: "/rush-month/evidence",
    label: "Evidence submission readiness",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Reviewers see the next proof item, submission queue, proof prep checklist, Goal 158 proof submission packet, proof status, future structured records, blocked writes, and disabled upload/public-sharing posture.",
    safetyAssertion:
      "Proof metadata saves, file uploads, public publishing, direct points/KPI writes, member reminders, warehouse exports, AI summaries, and external sends remain disabled unless explicitly approved for localhost-only testing.",
  },
  {
    path: "/rush-month/loop",
    label: "Local operating-loop demo",
    priority: "critical",
    audiences: ["chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Reviewer can click through the local Rush Month loop without Supabase or external writes.",
    safetyAssertion: "All events/outbox rows remain browser-local and disabled/mock-safe.",
  },
  {
    path: "/proof-library",
    label: "Proof library",
    priority: "important",
    audiences: ["chapter_member", "chapter_leader", "admin", "ds_admin"],
    expectedResult:
      "Members see proof cards; HQ roles see sharing posture; DS Admin sees restricted proof messaging.",
    safetyAssertion: "No upload, public publish, warehouse export, or AI summary is expected.",
  },
  {
    path: "/proof-library/upload",
    label: "Proof upload readiness",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "admin", "super_admin"],
    expectedResult:
      "Reviewers see file requirements, consent checklist, the Goal 159 proof storage intake packet, disabled upload controls, future events, and disabled outbox posture.",
    safetyAssertion:
      "No file upload, storage bucket write, public proof URL, external export, or AI summary is expected.",
  },
  {
    path: "/rush-month/review",
    label: "HQ proof-sharing review",
    priority: "important",
    audiences: ["chapter_leader", "admin", "super_admin"],
    expectedResult:
      "Leaders can track proof posture, the Goal 153 review rubric, gated local approve/request/reject controls, and leader proof decision result states; admin/super admin see disabled HQ decision controls.",
    safetyAssertion:
      "Production leader proof decision saves, result-state saves, HQ decision saves, nudges, direct points writes, and public sharing remain disabled; local leader proof decisions require explicit localhost flags.",
  },
  {
    path: "/coach",
    label: "Coach readout",
    priority: "critical",
    audiences: ["coach", "chapter_leader", "ds_admin"],
    expectedResult:
      "Coach sees readiness, portfolio, the Goal 154 intervention checklist, support notes, and decision posture; leader does not see portfolio rows; DS Admin is restricted.",
    safetyAssertion:
      "Coach note saves, decisions, reassignment, nudges, escalation packets, and external automation remain disabled.",
  },
  {
    path: "/admin",
    label: "Admin control center",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin roles see coverage/readiness panels according to role; outbox remains restricted.",
    safetyAssertion: "Admin mutations, production auth, and external writes remain disabled.",
  },
  {
    path: "/admin/phase-2",
    label: "Phase 2 safe prep review",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see the Phase 2 issue map, readiness groups, environment checklist, auth/onboarding plan, write-promotion sequence, mock-only boundary, and next approval steps for MED-471 through MED-486.",
    safetyAssertion:
      "Phase 2 review must not enable live Supabase or Vercel setup, credentials, live auth, browser writes, proof uploads, DB migrations, production deploys, or external automation.",
  },
  {
    path: "/admin/environment-setup",
    label: "Environment setup foundation",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see the MED-472 environment plan for local, preview, staging, and production, plus env-var boundaries, callback patterns, and owner expectations.",
    safetyAssertion:
      "Environment review must not create live projects, add secrets, promote deployments, change DNS, or expose service-role credentials.",
  },
  {
    path: "/admin/auth-onboarding",
    label: "Auth and onboarding foundation",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see the MED-473 callback route, identity source of truth, role-routing plan, profile rules, ownership decisions, and blocked live-auth actions.",
    safetyAssertion:
      "Auth review must not create hosted users, auto-approve membership, trust browser-only identity, or enable production sign-in flows.",
  },
  {
    path: "/admin/security-gate",
    label: "RLS and security release gate",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see the MED-474 security gate checks, current local evidence, hosted proof requirements, and blocked live security actions before any write is approved.",
    safetyAssertion:
      "Security review must not run hosted migrations, enable storage/uploads, allow production browser writes, or point the app at production Supabase without sign-off.",
  },
  {
    path: "/admin/review-path",
    label: "Admin stakeholder review path",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see the no-code stakeholder review path, fake local actor emails, route-by-route steps, safety boundaries, zero writes, and zero sends.",
    safetyAssertion:
      "Review path must not enable production auth, browser writes, proof uploads, public proof sharing, external sends, or student invitations.",
  },
  {
    path: "/admin/nick-review",
    label: "Nick final local review",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see the final local MVP review packet with owner lanes, pass signals, Goal 150 launch evidence, pilot scope, launch boundaries, local review yes, live launch no, zero writes, zero sends, and zero student invitations.",
    safetyAssertion:
      "Nick review must not approve live launch, production auth, browser writes, proof uploads, external sends, or student invitations.",
  },
  {
    path: "/admin/release-readiness",
    label: "Admin release readiness",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see local review yes, live launch no, ready items, blockers, next approvals, zero writes, and zero sends.",
    safetyAssertion:
      "Release readiness review must not approve live launch, production auth, browser writes, proof uploads, external sends, or student invitations.",
  },
  {
    path: "/admin/launch-gate",
    label: "Admin launch gate",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see the eight production launch gates, Goal 150 launch evidence checklist, missing live evidence, review routes, launch no, zero writes, and zero sends.",
    safetyAssertion:
      "Launch gate review must not approve live launch, production auth, browser writes, proof uploads, vendor switching, external sends, or student invitations.",
  },
  {
    path: "/admin/audit-log",
    label: "Admin audit log",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin and Super Admin can inspect audit readback posture and the Goal 156 write-audit preflight checklist; DS Admin sees audit safety without row-level chapter/member audit details.",
    safetyAssertion:
      "Audit row edits, audit deletion, audit exports, retention changes, production writes, external sends, and secrets remain disabled.",
  },
  {
    path: "/admin/integration-outbox",
    label: "Admin integration outbox",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "DS and HQ reviewers see structured integration events, automation outbox rows, the Goal 155 live-send preflight checklist, destination safety, audit posture, and blocked live controls.",
    safetyAssertion:
      "Queue mutations, live-send approvals, retries, payload edits, integration secrets, external workers, exports, AI summaries, and external sends remain disabled.",
  },
  {
    path: "/admin/master-data",
    label: "Admin master data inventory",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ reviewers see fake users, named role coverage, chapter scope, campaign templates, blocked admin writes, and zero mutation controls.",
    safetyAssertion:
      "Production user creation, profile edits, role writes, membership approvals, chapter edits, campaign template edits, coach assignment changes, and external sends remain disabled.",
  },
  {
    path: "/admin/database-security",
    label: "Admin database security",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see Supabase Postgres/Auth/Storage recommended for the MVP, PlanetScale MySQL/Vitess reviewed as a tradeoff, chapter-scoped RLS approvals, service-key handling, proof storage, compliance contracts, launch no, zero writes, and zero sends.",
    safetyAssertion:
      "Database security review must not approve live launch, production Supabase, vendor switching, browser writes, proof uploads, service-key exposure, external sends, or PHI/ePHI processing.",
  },
  {
    path: "/admin/system-health",
    label: "Admin system health",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see route registry, data-source, environment, audit, outbox, auth, proof storage, integration, monitoring, backup, and incident-owner health checks.",
    safetyAssertion:
      "Live launch, production auth, production writes, proof uploads, external sends, secrets, monitoring claims, and backup claims remain blocked until proven.",
  },
  {
    path: "/admin/design-qa",
    label: "Admin design QA",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see the Figma target, 390px phone viewport, mobile next-action, role complexity, accessibility, mission tone, offline recovery, eight-route mobile visual smoke plan, and production visual QA checks.",
    safetyAssertion:
      "Design review must not enable launch approval, production auth, browser writes, proof uploads, public proof sharing, external sends, or staging claims.",
  },
  {
    path: "/admin/operations",
    label: "Admin operations runbook",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin reviewers see incident triage, auth/access recovery, database/RLS recovery, write rollback, proof moderation, integration recovery, mobile PWA support, pilot communications, launch no, zero writes, zero sends, and zero secrets.",
    safetyAssertion:
      "Operations review must not approve live launch, production auth, browser writes, proof uploads, outbox sends, monitoring claims, backup claims, support owner claims, or student invitations.",
  },
  {
    path: "/admin/first-write",
    label: "First-write activation drill",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can see whether the first local action-start write is blocked by mock data, missing flags, missing auth, or ready for localhost-only testing.",
    safetyAssertion:
      "The drill must not enable production auth, broad browser writes, uploads, public proof sharing, or external automation.",
  },
  {
    path: "/admin/write-sequence",
    label: "Rush Month write sequence planner",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can see the implemented Phase 2 subset order for membership approval, leader assignment, action-start, proof metadata, leader proof decisions, HQ proof decisions, and coach decisions.",
    safetyAssertion:
      "The planner must not enable production auth, browser writes, proof uploads, public proof sharing, or external automation.",
  },
  {
    path: "/admin/proof-write",
    label: "Proof metadata operator packet",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can see whether proof/testimonial metadata submission is blocked, ready for localhost-only testing, or has readback evidence.",
    safetyAssertion:
      "The packet must not enable production auth, file uploads, public proof sharing, warehouse export, AI summary, or external automation.",
  },
  {
    path: "/admin/hq-proof-write",
    label: "HQ proof decision operator packet",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can see whether proof metadata readback is proven, whether a local HQ decision is blocked or ready, and what readback evidence must appear.",
    safetyAssertion:
      "The packet must not enable production auth, public proof publishing, warehouse export, AI summary, or external automation.",
  },
  {
    path: "/admin/assignment-write",
    label: "Leader assignment operator packet",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can see whether HQ decision readback is proven, whether local assignment creation is blocked or ready, and what readback evidence must appear.",
    safetyAssertion:
      "The packet must not enable production auth, reminders, HubSpot handoffs, n8n workflows, Luma writes, or external automation.",
  },
  {
    path: "/admin/coach-write",
    label: "Coach decision operator packet",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can see whether leader assignment readback is proven, whether local coach decision logging is blocked or ready, and what readback evidence must appear.",
    safetyAssertion:
      "The packet must not enable production auth, coach reassignment, n8n escalation packets, HubSpot notes, warehouse exports, AI summaries, or external automation.",
  },
  {
    path: "/admin/pilot-scope",
    label: "First pilot scope planner",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can compare pilot-scope options, minimum pilot routes, decision owners, and safety boundaries before naming real pilot users.",
    safetyAssertion:
      "The planner must not approve student invitations, enable browser writes, upload proof, or send external automation.",
  },
  {
    path: "/admin/staff-dry-run",
    label: "Staff dry-run guide",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can rehearse the Rush Month MVP with fake actor emails, pass criteria, structured events to notice, and zero-write safety assertions.",
    safetyAssertion:
      "The dry run must not invite students, enable production auth, upload proof, save browser writes, or send external automation.",
  },
];

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin route smoke manifest";
    case "ds_admin":
      return "DS Admin route safety manifest";
    case "super_admin":
      return "Full local route smoke manifest";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Route smoke manifest hidden for this role";
  }
}

function emptyCounts(): RouteSmokeManifest["counts"] {
  return {
    totalRoutes: 0,
    criticalRoutes: 0,
    mobileVisualChecks: 0,
    roleVariants: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
