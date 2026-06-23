import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type MvpCoverageStatus =
  | "covered_mock"
  | "covered_readonly"
  | "blocked_until_approval"
  | "future_work";

export type MvpCoverageItem = {
  key: string;
  label: string;
  status: MvpCoverageStatus;
  plainEnglish: string;
  routeEvidence: string[];
  nextStep: string;
};

export type MvpCoverageChecklist = {
  canReadChecklist: boolean;
  title: string;
  summary: string;
  items: MvpCoverageItem[];
  counts: {
    total: number;
    coveredMock: number;
    coveredReadonly: number;
    blockedUntilApproval: number;
    futureWork: number;
  };
};

export function getMvpCoverageChecklist(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): MvpCoverageChecklist {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadChecklist: false,
      title: "MVP coverage checklist hidden for this role",
      summary:
        "Chapter members, leaders, and coaches should use operating routes instead of admin coverage reviews.",
      items: [],
      counts: emptyCounts(),
    };
  }

  const items = buildCoverageItems(data);

  return {
    canReadChecklist: true,
    title: getTitle(surfaceFamily),
    summary:
      "This checklist explains what the Rush Month MVP can demonstrate locally, what is read-only, and what remains blocked until Nick/team approve live auth, writes, uploads, or integrations.",
    items,
    counts: {
      total: items.length,
      coveredMock: items.filter((item) => item.status === "covered_mock").length,
      coveredReadonly: items.filter((item) => item.status === "covered_readonly")
        .length,
      blockedUntilApproval: items.filter(
        (item) => item.status === "blocked_until_approval",
      ).length,
      futureWork: items.filter((item) => item.status === "future_work").length,
    },
  };
}

function buildCoverageItems(data: ReadOnlyAppData): MvpCoverageItem[] {
  return [
    {
      key: "roles",
      label: "Role-aware local actors",
      status: "covered_readonly",
      plainEnglish:
        "Reviewers can use local sign-in or switch between member, leader, coach, admin, DS admin, and super admin local roles, each role has a read-only chapter home, Rush Month overview, and read-only profile/scope route, and the auth/onboarding path includes a staff-only production auth preflight without writes.",
      routeEvidence: [
        "/",
        "/login",
        "/profile",
        "/onboarding",
        "/chapter",
        "/rush-month",
        "/admin",
      ],
      nextStep: "Replace local actor switching only after live auth is approved.",
    },
    {
      key: "rush_loop",
      label: "Rush Month operating loop",
      status: "covered_mock",
      plainEnglish:
        "The app can demonstrate a clear Rush Month front door plus assignment, action start, proof submission, review, points/KPI movement, HQ sharing posture, coach decision, events, outbox, and audit rows locally.",
      routeEvidence: ["/rush-month", "/rush-month/loop", "/rush-month/events"],
      nextStep: "Keep this as the reviewer demo path until real writes are approved.",
    },
    {
      key: "events_nps",
      label: "Rush Month events, NPS, and Luma posture",
      status: "covered_mock",
      plainEnglish:
        "Students and leaders can see the member event list plus a direct event detail with expected student actions, feedback/NPS prompts, proof prompts, mock Luma posture, disabled future outbox rows, and the attend-reflect-share proof bridge.",
      routeEvidence: [
        "/rush-month/events",
        "/rush-month/events/[eventId]",
        "/action-committees",
      ],
      nextStep:
        "Keep Luma event writes, attendance imports, NPS reminders, and warehouse exports disabled until approved.",
    },
    {
      key: "assignments",
      label: "Assignments and leader follow-up",
      status: "covered_mock",
      plainEnglish:
        "Members can open an assigned-actions list and one assigned action detail, and leaders can see visible assignments, disabled assignment creation posture, and a prioritized follow-up board.",
      routeEvidence: ["/rush-month/actions", "/rush-month/actions/[assignmentId]"],
      nextStep: "Do not enable assignment saves until live auth and write activation are approved.",
    },
    {
      key: "first_write_drill",
      label: "First action-start write drill",
      status: "covered_readonly",
      plainEnglish:
        "Admins can inspect the local checks, fake member route, expected readback, and proof required before action-start becomes the first localhost-only write.",
      routeEvidence: ["/admin/first-write", "/rush-month/actions/[assignmentId]"],
      nextStep:
        "Run this only with local Supabase, local auth, explicit local write flags, and zero external sends.",
    },
    {
      key: "member_management",
      label: "Member and role management visibility",
      status: "covered_readonly",
      plainEnglish:
        "Leaders and staff can inspect roster follow-up, join requests, the Goal 160 membership approval packet, Goal 161 membership result states, role coverage, and disabled membership controls without changing membership truth.",
      routeEvidence: ["/chapter/members"],
      nextStep:
        "Do not enable join approvals or role changes until production auth, RLS, audit, and rollback are approved.",
    },
    {
      key: "proof",
      label: "Proof/testimonial sharing posture",
      status: "covered_mock",
      plainEnglish:
        "The proof library, evidence submission route, and review route distinguish member proof queues, Goal 152 proof prep checklists, Goal 158 proof submission packets, Goal 159 proof storage intake packets, Goal 153 leader proof review rubrics, leader proof decisions, leader decision result states, Goal 115 SQL/RLS coverage, Goal 116 local server-action coverage, consent/context needs, HQ review, internal learning, future public candidates, private proof, and upload-readiness requirements.",
      routeEvidence: [
        "/proof-library",
        "/proof-library/upload",
        "/rush-month/evidence",
        "/rush-month/review",
      ],
      nextStep:
        "Keep production leader proof browser decisions, direct points/KPI browser outcomes, uploads, public proof publishing, and external exports disabled until auth, RLS, storage, consent, audit, and rollback are approved.",
    },
    {
      key: "recognition",
      label: "Member recognition and friendly leaderboard",
      status: "covered_mock",
      plainEnglish:
        "Members can open a direct leaderboard route for local points, rank, recognition, next action, and understandable chapter impact without seeing leadership-only KPI management.",
      routeEvidence: ["/rush-month/dashboard", "/rush-month/leaderboard"],
      nextStep: "Treat this as mock recognition until the production points ledger is approved.",
    },
    {
      key: "coach",
      label: "Coach readiness and portfolio",
      status: "covered_mock",
      plainEnglish:
        "Coaches can review portfolio chapters, readiness, pending evidence, risk, Goal 154 intervention checklists, support notes, closeout posture, and advance / hold / intervene state without changing coach assignments.",
      routeEvidence: ["/coach", "/rush-month"],
      nextStep:
        "Keep coach decisions, coach note saves, nudges, escalation sends, and reassignment controls disabled until write approval.",
    },
    {
      key: "admin",
      label: "Admin control center",
      status: "covered_readonly",
      plainEnglish:
        "Admins can inspect the control center plus focused read-only stakeholder review path, Nick final review packet, release readiness, launch gate, focused read-only master data inventory, integration outbox, audit log, database security, system health, design QA, and operations routes for users, roles, chapters, campaign templates, result states, write gates, auth preflight, outbox posture, audit readback posture, Goal 156 write-audit preflight, Supabase/PlanetScale tradeoffs, system health review, production operations runbook, and production recovery.",
      routeEvidence: [
        "/admin",
        "/admin/review-path",
        "/admin/nick-review",
        "/admin/release-readiness",
        "/admin/launch-gate",
        "/admin/audit-log",
        "/admin/integration-outbox",
        "/admin/master-data",
        "/admin/database-security",
        "/admin/system-health",
        "/admin/design-qa",
        "/admin/operations",
      ],
      nextStep: "Keep admin mutation controls disabled until auth, RLS, audit, and rollback are approved.",
    },
    {
      key: "design_qa",
      label: "Figma and mobile design QA",
      status: "covered_readonly",
      plainEnglish:
        "Admins can inspect the Figma/mobile QA expectations, eight-route mobile smoke plan, matching route-smoke metadata, seven-check accessibility smoke plan, and seven-check device/PWA smoke matrix for next-action clarity, role complexity, accessibility, mission tone, offline recovery, proof intake, final review, and pilot safety.",
      routeEvidence: [
        "/admin",
        "/admin/design-qa",
        "/admin/nick-review",
        "/admin/system-health",
        "/rush-month",
        "/rush-month/actions",
        "/rush-month/evidence",
        "/rush-month/dashboard",
        "/coach",
        "/offline",
        "/proof-library/upload",
      ],
      nextStep:
        "Run the Goal 149 real-device, installed-PWA, offline recovery, cross-browser staging, keyboard, screen-reader, side-by-side Figma, proof-intake, and final-review checks before launch.",
    },
    {
      key: "controlled_pilot",
      label: "Controlled pilot readiness",
      status: "covered_readonly",
      plainEnglish:
        "Admins can see the difference between local review, staff dry run, staging review, first student pilot, later expansion, launch evidence collection, and the operations runbook needed before day-one support.",
      routeEvidence: [
        "/admin",
        "/admin/operations",
        "/admin/staff-dry-run",
        "/admin/pilot-scope",
      ],
      nextStep:
        "Run a staff dry run, choose one pilot group, collect the Goal 150 launch evidence checklist, then approve staging, auth, write, proof, operations, and support gates before student invitations.",
    },
    {
      key: "integration_outbox",
      label: "Integration events and disabled outbox",
      status: "covered_readonly",
      plainEnglish: `${data.outboxItems.length} local outbox rows plus the Goal 155 live-send preflight can be inspected from the admin dashboard and focused integration outbox route, but real external sends remain off.`,
      routeEvidence: ["/admin", "/admin/integration-outbox", "/rush-month/loop"],
      nextStep:
        "Do not enable n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, AI, queue retries, or live-send approvals yet.",
    },
    {
      key: "live_auth_writes",
      label: "Live auth and browser writes",
      status: "blocked_until_approval",
      plainEnglish:
        "Production auth, browser sessions, onboarding writes, and browser writes are intentionally not enabled; the Goal 157 `/onboarding` staff preflight makes callback, role coverage, profile mapping, join approval, role assignment, coach scope, staff scope, audit/outbox, and rollback evidence visible first.",
      routeEvidence: [
        "/onboarding",
        "docs/architecture/goal-29-write-activation-approval-plan.md",
      ],
      nextStep:
        "Review the Goal 157 production auth preflight, then Nick/team must approve the next write activation goal before this changes.",
    },
    {
      key: "real_integrations",
      label: "Real external integrations",
      status: "blocked_until_approval",
      plainEnglish:
        "HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes remain disabled.",
      routeEvidence: ["AGENTS.md", "README.md"],
      nextStep: "Turn these on only after the Rush Month operating loop is stable and explicitly approved.",
    },
  ];
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Admin MVP coverage checklist";
    case "ds_admin":
      return "DS Admin MVP safety checklist";
    case "super_admin":
      return "Full local MVP coverage checklist";
    case "member":
    case "leader":
    case "coach":
      return "MVP coverage checklist hidden for this role";
  }
}

function emptyCounts(): MvpCoverageChecklist["counts"] {
  return {
    total: 0,
    coveredMock: 0,
    coveredReadonly: 0,
    blockedUntilApproval: 0,
    futureWork: 0,
  };
}
