import type { LocalActorContext } from "@/services/local-actor-context";

export type MvpProgressStatus =
  | "local_review_ready"
  | "partially_ready"
  | "needs_approval"
  | "future_build";

export type MvpProgressRisk = "low" | "medium" | "high";

export type MvpSubprojectProgress = {
  key: string;
  label: string;
  ownerLane: string;
  status: MvpProgressStatus;
  risk: MvpProgressRisk;
  routeEvidence: string[];
  plainEnglish: string;
  technicalEvidence: string;
  remainingWork: string;
  nextReviewStep: string;
  totalWeight: number;
  localReviewWeight: number;
  liveMvpWeight: number;
};

export type MvpProgressMap = {
  canReadProgressMap: boolean;
  title: string;
  plainEnglishSummary: string;
  confidenceNote: string;
  localReviewPercent: number;
  liveMvpPercent: number;
  counts: {
    total: number;
    localReviewReady: number;
    partiallyReady: number;
    needsApproval: number;
    futureBuild: number;
  };
  subprojects: MvpSubprojectProgress[];
  nextBestSteps: string[];
};

export function getMvpProgressMap(actor: LocalActorContext): MvpProgressMap {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadProgressMap: false,
      title: "MVP progress hidden for this role",
      plainEnglishSummary:
        "MVP build status is an HQ planning surface, not a student or chapter operating view.",
      confidenceNote:
        "This hidden state prevents chapter roles from seeing implementation details they do not need.",
      localReviewPercent: 0,
      liveMvpPercent: 0,
      counts: {
        total: 0,
        localReviewReady: 0,
        partiallyReady: 0,
        needsApproval: 0,
        futureBuild: 0,
      },
      subprojects: [],
      nextBestSteps: [],
    };
  }

  const subprojects = getSubprojects();

  return {
    canReadProgressMap: true,
    title: getTitle(actor),
    plainEnglishSummary:
      "The app has a strong local Rush Month foundation and several guarded local-write paths, but it is still not a live student launch until production auth, uploads, admin operations, deployment, and external integrations are approved and implemented.",
    confidenceNote:
      "Percentages are directional planning estimates, not a promise. They help the team see the shape of the remaining MVP work without hiding safety blockers.",
    localReviewPercent: calculatePercent(
      subprojects.reduce((sum, item) => sum + item.localReviewWeight, 0),
      subprojects,
    ),
    liveMvpPercent: calculatePercent(
      subprojects.reduce((sum, item) => sum + item.liveMvpWeight, 0),
      subprojects,
    ),
    counts: countStatuses(subprojects),
    subprojects,
    nextBestSteps: [
      "Use `/login` to review fake local seed-user sign-in and confirm production auth remains blocked.",
      "Use `/onboarding` as Admin, DS Admin, or Super Admin to review the Goal 157 production auth preflight before inviting real users.",
      "Use `/admin/review-path` to run the no-code stakeholder walkthrough with the right fake local actors.",
      "Use `/admin/nick-review` for the Goal 151 final local MVP review packet before any pilot, live launch, write, upload, external send, or invitation decision.",
      "Use `/admin/release-readiness` to confirm local review readiness, live-launch blockers, and next approvals before deeper launch review.",
      "Use the `/admin/launch-gate` production launch gate to assign owners for the missing live evidence before approving a pilot.",
      "Use the `/admin/database-security` database security decision route to resolve the DS Supabase versus PlanetScale/MySQL concern before production setup.",
      "Use the `/admin` production operations runbook to confirm incident, rollback, backup, integration recovery, and day-one support owners.",
      "Run a stakeholder review of the local Rush Month loop and role-specific routes.",
      "Approve the production auth and onboarding boundary before real users are invited.",
      "Use `/admin/write-sequence` to choose and prove each production write path in order.",
      "Approve proof upload, storage, consent, and public sharing rules before bridge videos go live.",
      "Keep n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, and AI writes disabled until each integration has an explicit approval plan.",
    ],
  };
}

function getSubprojects(): MvpSubprojectProgress[] {
  return [
    {
      key: "app_foundation",
      label: "App foundation and mobile routes",
      ownerLane: "Product",
      status: "local_review_ready",
      risk: "low",
      routeEvidence: ["/", "/offline", "/chapter", "/rush-month", "/campaigns"],
      plainEnglish:
        "The custom PWA exists, runs locally, has the core mobile-first routes a reviewer can click through, includes the member chapter home and Rush Month overview, and now has a conservative offline recovery shell.",
      technicalEvidence:
        "Next.js app routes, shared layout, chapter home route, Rush Month overview route coverage, route metadata, PWA manifest, offline route, service-worker registration, and route registry are in place.",
      remainingWork:
        "Final Figma polish, production deploy settings, real-device PWA install/offline QA, and accessibility QA are still needed before launch.",
      nextReviewStep: "Review the main routes on a phone-sized viewport.",
      totalWeight: 8,
      localReviewWeight: 8,
      liveMvpWeight: 7,
    },
    {
      key: "role_aware_views",
      label: "Role-aware read experience",
      ownerLane: "Product and Permissions",
      status: "local_review_ready",
      risk: "medium",
      routeEvidence: [
        "/login",
        "/profile",
        "/onboarding",
        "/chapter",
        "/chapter/members",
        "/rush-month",
        "/rush-month/actions",
        "/rush-month/actions/[assignmentId]",
        "/rush-month/events",
        "/rush-month/leaderboard",
        "/coach",
        "/admin",
      ],
      plainEnglish:
        "Fake member, leader, coach, admin, DS admin, and super admin users see different local information, local sign-in can be reviewed without production auth, each role has a read-only chapter home, Rush Month overview, and profile/scope route, auth/onboarding can be reviewed without writes, staff can inspect the Goal 157 production auth preflight, and members now have assigned-actions, action-detail, event-list, points, and leaderboard routes.",
      technicalEvidence:
        "Local actor context, local sign-in route coverage, chapter home route coverage, Rush Month overview review coverage, profile workspace, auth onboarding workspace, Goal 157 production auth preflight, role visibility services, route restrictions, member assigned-actions review coverage, member action detail review coverage, member event-list review coverage, member leaderboard workspace, and role-aware panels are tested.",
      remainingWork:
        "Replace local actor switching with production Supabase Auth sessions and database-backed membership truth.",
      nextReviewStep: "Switch fake local actors and verify each role sees only the right surfaces.",
      totalWeight: 10,
      localReviewWeight: 10,
      liveMvpWeight: 7,
    },
    {
      key: "supabase_rls_foundation",
      label: "Supabase schema, seed data, and RLS foundation",
      ownerLane: "Data and Security",
      status: "local_review_ready",
      risk: "high",
      routeEvidence: ["/admin", "/admin/database-security"],
      plainEnglish:
        "The local database model, security tests, and focused database security decision route exist for the first chapter, role, event, proof, and outbox boundaries.",
      technicalEvidence:
        "Local Supabase migrations, seed data, RPC functions, RLS/security tests, and the focused Supabase versus PlanetScale decision route are ready for DS/security review.",
      remainingWork:
        "Production project setup, environment secrets, migration rollout, backup posture, DS database decision sign-off, and final RLS review remain.",
      nextReviewStep:
        "Have Kiomi and DS/security review `/admin/database-security` and the schema/RLS expectations before live Supabase setup.",
      totalWeight: 12,
      localReviewWeight: 12,
      liveMvpWeight: 8,
    },
    {
      key: "rush_month_loop",
      label: "Rush Month operating loop",
      ownerLane: "Chapter Operations",
      status: "local_review_ready",
      risk: "medium",
      routeEvidence: [
        "/rush-month",
        "/rush-month/loop",
        "/rush-month/actions",
        "/rush-month/events",
        "/rush-month/events/[eventId]",
        "/rush-month/actions/[assignmentId]",
        "/rush-month/dashboard",
        "/rush-month/leaderboard",
      ],
      plainEnglish:
        "A reviewer can see the Rush Month path from the campaign front door through assigned actions, leader assignment, one member action detail, member events/NPS, event detail, proof, points/KPIs, HQ sharing posture, and coach decision.",
      technicalEvidence:
        "Browser-local loop state, Rush Month overview review coverage, member assigned-actions review coverage, member event-list review coverage, event/NPS readiness, direct event detail, action-detail review coverage, event/outbox/audit display, dashboard summaries, member leaderboard route, and service tests cover the operating sequence.",
      remainingWork:
        "Connect the loop to live Supabase reads/writes, real users, and production-safe review states.",
      nextReviewStep: "Click through `/rush-month/loop` and compare it to the intended chapter operating process.",
      totalWeight: 12,
      localReviewWeight: 12,
      liveMvpWeight: 6,
    },
    {
      key: "local_write_paths",
      label: "Guarded local write paths",
      ownerLane: "App and Data",
      status: "partially_ready",
      risk: "high",
      routeEvidence: [
        "/admin/first-write",
        "/admin/write-sequence",
        "/admin/proof-write",
        "/admin/hq-proof-write",
        "/admin/assignment-write",
        "/admin/coach-write",
        "/chapter/members",
        "/rush-month/actions",
        "/rush-month/actions/[assignmentId]",
        "/rush-month/review",
        "/coach",
      ],
      plainEnglish:
        "The first local-only write paths now exist, and staff packets explain exactly when action-start, proof metadata, the leader proof decision server action, HQ proof decisions, leader assignment creation, Goal 154 coach intervention checklists, coach support notes, coach decisions, and Goal 162 membership approval readiness can be tested or reviewed on localhost.",
      technicalEvidence:
        "Server actions, result states, browser gates, first-write drill coverage, write-sequence planning, proof metadata packet coverage, leader proof decision workspace coverage, leader proof decision result-state coverage, Goal 115 leader proof SQL/RLS coverage, Goal 116 leader proof server-action coverage, HQ decision packet coverage, leader assignment packet coverage, Goal 154 coach intervention checklist coverage, coach support notes coverage, coach decision packet coverage, and Goal 162 membership approval write readiness coverage exist for the first local write sequence.",
      remainingWork:
        "Run the localhost action-start drill, review readback/audit proof, then use the proof metadata, Goal 115 SQL/RLS packet, Goal 116 leader proof server-action packet, HQ decision, assignment, coach notes, coach packets, and Goal 162 membership approval readiness packet to test or scope the next writes safely.",
      nextReviewStep:
        "Open `/admin/first-write`, `/admin/write-sequence`, `/admin/proof-write`, `/rush-month/review`, `/admin/hq-proof-write`, `/admin/assignment-write`, `/admin/coach-write`, and `/chapter/members` in that order.",
      totalWeight: 14,
      localReviewWeight: 10,
      liveMvpWeight: 7,
    },
    {
      key: "campaign_templates",
      label: "Reusable campaign shells",
      ownerLane: "Campaign Operations",
      status: "partially_ready",
      risk: "medium",
      routeEvidence: [
        "/campaigns",
        "/campaigns/[campaignSlug]",
        "/campaigns/planning-goal-setting",
        "/campaigns/chapter-engagement",
        "/campaigns/slt-promotion",
        "/campaigns/moving-mountains",
        "/campaigns/leadership-transition",
        "/campaigns/grow-the-movement",
        "/campaigns/start-a-chapter",
      ],
      plainEnglish:
        "The app has the exact required starter campaign shells beyond Rush Month, a review checkpoint for them, and deeper local plans for all seven required non-Rush campaigns, but those campaigns are still not implemented as production write-enabled workflows.",
      technicalEvidence:
        "Campaign catalog, route shells, starter-shell readiness service, and all seven non-Rush phase plans, proof prompts, structured events, KPI signals, and coach focus fields are present.",
      remainingWork:
        "Turn the read-only campaign plans into production campaign-template workflows only after auth, RLS, audit, rollback, and integration approval are complete.",
      nextReviewStep:
        "Open `/campaigns`, then review all seven non-Rush campaign detail routes as a leader, coach, admin, or super admin.",
      totalWeight: 8,
      localReviewWeight: 5,
      liveMvpWeight: 4,
    },
    {
      key: "production_auth",
      label: "Production auth and onboarding",
      ownerLane: "Security and Student Access",
      status: "needs_approval",
      risk: "high",
      routeEvidence: ["/login", "/profile", "/onboarding", "/admin"],
      plainEnglish:
        "Local sign-in is now part of the formal review path alongside read-only profile/scope, auth/onboarding readiness, the Goal 157 production auth preflight, the Goal 160 membership approval packet, Goal 161 membership approval result states, and Goal 162 membership approval write readiness, but real student login, join requests, membership approvals, and role approvals are not live.",
      technicalEvidence:
        "Auth planning, local sign-in helpers, route smoke coverage, stakeholder review coverage, profile workspace, auth onboarding workspace, production auth preflight coverage, Goal 160 membership approval packet coverage, Goal 161 membership approval result-state coverage, Goal 162 membership approval write readiness coverage, and auth-derived actor context exist without production sessions enabled.",
      remainingWork:
        "Approve onboarding rules, invite/join flows, staff role assignment boundaries, production Supabase Auth configuration, and the preflight evidence before real users are invited.",
      nextReviewStep:
        "Open `/login`, `/profile`, and `/onboarding` as staff, then approve the auth/onboarding plan before inviting real students.",
      totalWeight: 12,
      localReviewWeight: 4,
      liveMvpWeight: 2,
    },
    {
      key: "proof_upload_storage",
      label: "Bridge video and proof upload system",
      ownerLane: "Proof Library and HQ Review",
      status: "partially_ready",
      risk: "high",
      routeEvidence: [
        "/proof-library",
        "/proof-library/upload",
        "/rush-month/evidence",
        "/rush-month/review",
      ],
      plainEnglish:
        "The app models testimonial/proof metadata, member evidence submission queues, Goal 152 proof prep packets, Goal 158 proof submission packets, Goal 159 proof storage intake packets, Goal 153 leader proof review rubrics, HQ sharing decisions, and proof upload requirements, but real uploads, storage, and publication are not built yet.",
      technicalEvidence:
        "Proof metadata, member evidence submission workspace, Goal 152 proof prep checklist, Goal 158 proof submission packet, Goal 159 proof storage intake packet, Goal 153 leader proof review rubric, storage-readiness planning, upload-readiness UI, HQ decision states, and local proof routes exist.",
      remainingWork:
        "Build storage buckets, upload UI, file validation, consent fields, moderation states, and public/private proof rules.",
      nextReviewStep:
        "Open `/rush-month/evidence`, review the Goal 152 proof prep checklist and Goal 158 proof submission packet, open `/proof-library/upload` for the Goal 159 proof storage intake packet, open `/rush-month/review` for the Goal 153 leader proof review rubric, then approve bridge video consent and storage requirements.",
      totalWeight: 8,
      localReviewWeight: 3,
      liveMvpWeight: 0,
    },
    {
      key: "admin_operations",
      label: "Admin operations for users, roles, chapters, and templates",
      ownerLane: "HQ Operations",
      status: "partially_ready",
      risk: "high",
      routeEvidence: [
        "/admin",
        "/admin/audit-log",
        "/admin/master-data",
        "/chapter/members",
      ],
      plainEnglish:
        "Admin and leaders can inspect roster, join request, Goal 160 membership approval packets, Goal 161 membership result states, Goal 162 membership approval write readiness, focused master data inventory, focused audit log readback, Goal 156 write-audit preflight, role coverage, disabled membership controls, and audit-readback posture, but cannot yet safely create or change real users, memberships, roles, chapters, or campaign templates.",
      technicalEvidence:
        "Read-only admin control center, admin master data workspace, focused audit log route, audit log review, Goal 156 write-audit preflight checklist, glossary, chapter membership workspace, Goal 160 membership approval packet, Goal 161 membership approval result states, and Goal 162 membership approval write readiness exist; mutation controls are intentionally absent.",
      remainingWork:
        "Build guarded admin mutations after auth/RLS review, audit logging, and approval workflows are finalized.",
      nextReviewStep:
        "Review `/chapter/members` for the Goal 160 membership approval packet, Goal 161 result states, and Goal 162 write readiness, then decide which admin operation is needed first for the pilot.",
      totalWeight: 4,
      localReviewWeight: 2,
      liveMvpWeight: 1,
    },
    {
      key: "production_deploy_qa",
      label: "Production deployment, Figma polish, and QA",
      ownerLane: "Launch",
      status: "future_build",
      risk: "medium",
      routeEvidence: [
        "/admin",
        "/admin/review-path",
        "/admin/nick-review",
        "/admin/release-readiness",
        "/admin/launch-gate",
        "/admin/database-security",
        "/admin/design-qa",
        "/admin/system-health",
        "/admin/operations",
      ],
      plainEnglish:
        "The app builds locally and in CI, and admins can inspect focused stakeholder review path, Goal 151 Nick final review, release readiness, launch gate with Goal 150 launch evidence checklist, system health, design QA, route smoke with mobile-review metadata, and operations routes plus the PWA offline shell, but production deployment, final mobile QA, monitoring, backup, and close Figma matching still need a launch pass.",
      technicalEvidence:
        "Lint, typecheck, tests, build, CI, route smoke coverage with Goal 147 mobile-review metadata, PWA offline support, design QA readiness, focused stakeholder review path, focused Goal 151 Nick final review route, focused release readiness route, focused launch gate route, Goal 150 launch evidence checklist, focused design QA route, focused system health route, focused operations route, system health review, and production operations runbook are active; production environment wiring is not complete.",
      remainingWork:
        "Set up Vercel/hosting, production environment variables, monitoring, backups, alert channels, visual QA, accessibility QA, real-device PWA QA, smoke-test scripts, and collect the Goal 150 staging/pilot evidence packet.",
      nextReviewStep:
        "Review `/admin/review-path`, `/admin/nick-review`, `/admin/release-readiness`, `/admin/launch-gate`, `/admin/design-qa`, `/admin/system-health`, and `/admin/operations`, then collect the Goal 150 launch evidence packet before pilot approval.",
      totalWeight: 6,
      localReviewWeight: 0,
      liveMvpWeight: 0,
    },
    {
      key: "design_qa_readiness",
      label: "Figma and mobile design QA readiness",
      ownerLane: "Product Design and Launch",
      status: "partially_ready",
      risk: "medium",
      routeEvidence: [
        "/admin",
        "/admin/design-qa",
        "/admin/nick-review",
        "/rush-month",
        "/rush-month/actions",
        "/rush-month/evidence",
        "/rush-month/dashboard",
        "/coach",
        "/offline",
        "/proof-library/upload",
      ],
      plainEnglish:
        "The app now has an admin-visible focused route for Figma comparison, mobile next-action clarity, phone-sized route smoke checks, accessibility smoke checks, device/PWA smoke checks, role complexity, and pilot-safe messaging, and the admin smoke manifest now carries the same mobile-review metadata.",
      technicalEvidence:
        "Design QA readiness service, admin panel, focused design QA route, and route smoke manifest track review prompts, evidence routes, eight mobile visual smoke checks, seven accessibility smoke checks, seven device/PWA smoke checks, reviewer actor emails, zero expected writes, and launch blockers.",
      remainingWork:
        "Complete side-by-side Figma review, the Goal 147 mobile route smoke bridge, the Goal 148 accessibility smoke plan, the Goal 149 device/PWA smoke matrix, real phone QA, keyboard/screen-reader checks, and staging visual smoke tests.",
      nextReviewStep:
        "Open `/admin/design-qa` as admin and review the Goal 149 device/PWA smoke matrix before Nick signs off on pilot scope.",
      totalWeight: 6,
      localReviewWeight: 3,
      liveMvpWeight: 1,
    },
    {
      key: "controlled_pilot_readiness",
      label: "Controlled pilot readiness",
      ownerLane: "Launch and HQ Operations",
      status: "partially_ready",
      risk: "high",
      routeEvidence: [
        "/admin",
        "/admin/operations",
        "/admin/first-write",
        "/admin/staff-dry-run",
        "/admin/pilot-scope",
        "/rush-month/loop",
        "/rush-month/events",
        "/rush-month/events/[eventId]",
      ],
      plainEnglish:
        "The app can support a staff dry run now, has a hosted staging review path, and has a first-pilot scope planner, production operations runbook, direct event detail, leader proof decision workspace, local leader proof server action, leader proof decision result states, Goal 154 coach intervention checklists, coach support notes, and launch evidence checklist, but a real student pilot still needs a named group, auth, writes, proof consent/storage, event/NPS handling, device/accessibility evidence, and support ownership decisions.",
      technicalEvidence:
        "Controlled pilot readiness service, staff dry-run guide, pilot scope planner, focused operations route, production operations runbook, Rush Month event detail workspace, leader proof decision workspace, Goal 116 local leader proof server action, leader proof decision result states, Goal 154 coach intervention checklists, coach support notes, Goal 150 launch evidence checklist, and admin panels separate local review, staff dry run, staging, first student pilot, and later expansion gates.",
      remainingWork:
        "Pick the first pilot group, collect the Goal 150 launch evidence checklist on staging, approve production auth/onboarding, choose the first hosted write path, approve proof consent/storage, and name incident, coach, and support ownership.",
      nextReviewStep:
        "Open `/admin/launch-gate`, then `/admin/operations` and `/admin/pilot-scope`, and collect launch evidence before inviting any students.",
      totalWeight: 8,
      localReviewWeight: 4,
      liveMvpWeight: 2,
    },
    {
      key: "external_automation",
      label: "External integrations and automation",
      ownerLane: "Data Solutions",
      status: "needs_approval",
      risk: "high",
      routeEvidence: ["/admin", "/admin/integration-outbox"],
      plainEnglish:
        "Integration events, outbox rows, audit posture, Goal 155 live-send preflight, and a focused integration outbox route are ready for later automation review, but no real external systems are being written to.",
      technicalEvidence:
        "IntegrationEvent, AutomationOutbox, AuditLog, admin integration outbox workspace, Goal 155 live-send preflight checklist, environment safety summaries, and disabled outbox displays are in place.",
      remainingWork:
        "Approve contracts and workflows for n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, and AI after the app loop is stable.",
      nextReviewStep: "Keep external writes disabled until the first production app loop is approved.",
      totalWeight: 6,
      localReviewWeight: 1,
      liveMvpWeight: 0,
    },
  ];
}

function countStatuses(subprojects: MvpSubprojectProgress[]): MvpProgressMap["counts"] {
  return {
    total: subprojects.length,
    localReviewReady: subprojects.filter(
      (item) => item.status === "local_review_ready",
    ).length,
    partiallyReady: subprojects.filter((item) => item.status === "partially_ready")
      .length,
    needsApproval: subprojects.filter((item) => item.status === "needs_approval")
      .length,
    futureBuild: subprojects.filter((item) => item.status === "future_build").length,
  };
}

function calculatePercent(value: number, subprojects: MvpSubprojectProgress[]) {
  const total = subprojects.reduce((sum, item) => sum + item.totalWeight, 0);

  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin MVP progress map";
    case "ds_admin":
      return "DS Admin MVP progress and automation map";
    case "super_admin":
      return "Full MVP progress map";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "MVP progress hidden for this role";
  }
}
