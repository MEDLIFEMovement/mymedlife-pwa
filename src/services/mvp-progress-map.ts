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
      "Run a stakeholder review of the local Rush Month loop and role-specific routes.",
      "Approve the production auth and onboarding boundary before real users are invited.",
      "Choose the first production write path to harden, release, and monitor.",
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
      routeEvidence: ["/", "/chapter", "/rush-month", "/campaigns"],
      plainEnglish:
        "The custom PWA exists, runs locally, and has the core mobile-first routes a reviewer can click through.",
      technicalEvidence:
        "Next.js app routes, shared layout, route metadata, PWA manifest, and route registry are in place.",
      remainingWork:
        "Final Figma polish, production deploy settings, and accessibility QA are still needed before launch.",
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
      routeEvidence: ["/chapter", "/chapter/members", "/rush-month/actions", "/coach", "/admin"],
      plainEnglish:
        "Fake member, leader, coach, admin, DS admin, and super admin users see different local information.",
      technicalEvidence:
        "Local actor context, role visibility services, route restrictions, and role-aware panels are tested.",
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
      routeEvidence: ["/admin"],
      plainEnglish:
        "The local database model and security tests exist for the first chapter, role, event, proof, and outbox boundaries.",
      technicalEvidence:
        "Local Supabase migrations, seed data, RPC functions, and RLS/security tests run in GitHub CI.",
      remainingWork:
        "Production project setup, environment secrets, migration rollout, backup posture, and final RLS review remain.",
      nextReviewStep: "Have Kiomi review schema/RLS expectations before live Supabase setup.",
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
      routeEvidence: ["/rush-month/loop", "/rush-month/events", "/rush-month/dashboard"],
      plainEnglish:
        "A reviewer can see the Rush Month path from leader assignment through member action, events/NPS, proof, points/KPIs, HQ sharing posture, and coach decision.",
      technicalEvidence:
        "Browser-local loop state, event/NPS readiness, event/outbox/audit display, dashboard summaries, and service tests cover the operating sequence.",
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
        "/rush-month/actions",
        "/rush-month/actions/[assignmentId]",
        "/rush-month/review",
        "/coach",
      ],
      plainEnglish:
        "The first local-only write paths now exist, but they are intentionally locked unless local flags, local auth, and UUID-backed data are ready.",
      technicalEvidence:
        "Server actions and result states exist for action start, proof submission, HQ proof decision, leader assignment creation, and coach decision logging.",
      remainingWork:
        "Choose the first production write path, run final security review, add rollback/monitoring, and enable it gradually.",
      nextReviewStep: "Use the admin write-readiness panel to choose the safest first production write.",
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
      routeEvidence: ["/campaigns", "/campaigns/[campaignSlug]"],
      plainEnglish:
        "The app has starter campaign shells beyond Rush Month, but those campaigns are not implemented end to end yet.",
      technicalEvidence:
        "Campaign catalog, route shells, phase language, proof prompts, and coach focus fields are present.",
      remainingWork:
        "Add detailed SOP steps, role tasks, KPIs, proof prompts, and closeout rules for each non-Rush campaign.",
      nextReviewStep: "Review campaign shells against the SOP library and decide which campaign comes after Rush Month.",
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
      routeEvidence: ["/login", "/admin"],
      plainEnglish:
        "Local sign-in groundwork exists, but real student login, join requests, membership approvals, and role approvals are not live.",
      technicalEvidence:
        "Auth planning, local sign-in helpers, and auth-derived actor context exist without production sessions enabled.",
      remainingWork:
        "Approve onboarding rules, invite/join flows, staff role assignment boundaries, and production Supabase Auth configuration.",
      nextReviewStep: "Approve the auth/onboarding plan before inviting real students.",
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
      routeEvidence: ["/proof-library", "/proof-library/upload", "/rush-month/evidence"],
      plainEnglish:
        "The app models testimonial/proof metadata, HQ sharing decisions, and proof upload requirements, but real uploads, storage, and publication are not built yet.",
      technicalEvidence:
        "Proof metadata, storage-readiness planning, upload-readiness UI, HQ decision states, and local proof routes exist.",
      remainingWork:
        "Build storage buckets, upload UI, file validation, consent fields, moderation states, and public/private proof rules.",
      nextReviewStep: "Approve bridge video consent and storage requirements.",
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
      routeEvidence: ["/admin", "/chapter/members"],
      plainEnglish:
        "Admin and leaders can inspect roster, join request, role coverage, and disabled membership controls, but cannot yet safely create or change real users, memberships, roles, chapters, or campaign templates.",
      technicalEvidence:
        "Read-only admin control center, glossary, and chapter membership workspace exist; mutation controls are intentionally absent.",
      remainingWork:
        "Build guarded admin mutations after auth/RLS review, audit logging, and approval workflows are finalized.",
      nextReviewStep: "Decide which admin operation is needed first for the pilot.",
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
      routeEvidence: ["/admin"],
      plainEnglish:
        "The app builds locally and in CI, but production deployment, final mobile QA, and close Figma matching still need a launch pass.",
      technicalEvidence:
        "Lint, typecheck, tests, build, and CI are active; production environment wiring is not complete.",
      remainingWork:
        "Set up Vercel/hosting, production environment variables, visual QA, accessibility QA, and smoke-test scripts.",
      nextReviewStep: "Run a Figma-to-app visual review after the data/auth boundary is approved.",
      totalWeight: 6,
      localReviewWeight: 0,
      liveMvpWeight: 0,
    },
    {
      key: "external_automation",
      label: "External integrations and automation",
      ownerLane: "Data Solutions",
      status: "needs_approval",
      risk: "high",
      routeEvidence: ["/admin"],
      plainEnglish:
        "Integration events, outbox rows, and audit logs are ready for later automation, but no real external systems are being written to.",
      technicalEvidence:
        "IntegrationEvent, AutomationOutbox, AuditLog, environment safety summaries, and disabled outbox displays are in place.",
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
