import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

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
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
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
    title: getTitle(actor),
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
        "Reviewers can switch between member, leader, coach, admin, DS admin, and super admin local roles.",
      routeEvidence: ["/", "/chapter", "/admin"],
      nextStep: "Replace local actor switching only after live auth is approved.",
    },
    {
      key: "rush_loop",
      label: "Rush Month operating loop",
      status: "covered_mock",
      plainEnglish:
        "The app can demonstrate assignment, action start, proof submission, review, points/KPI movement, HQ sharing posture, coach decision, events, outbox, and audit rows locally.",
      routeEvidence: ["/rush-month/loop"],
      nextStep: "Keep this as the reviewer demo path until real writes are approved.",
    },
    {
      key: "assignments",
      label: "Assignments and leader follow-up",
      status: "covered_mock",
      plainEnglish:
        "Leaders can see visible assignments, disabled assignment creation posture, and a prioritized follow-up board.",
      routeEvidence: ["/rush-month/actions"],
      nextStep: "Do not enable assignment saves until live auth and write activation are approved.",
    },
    {
      key: "proof",
      label: "Proof/testimonial sharing posture",
      status: "covered_mock",
      plainEnglish:
        "The proof library distinguishes consent/context needs, HQ review, internal learning, future public candidates, and private proof.",
      routeEvidence: ["/proof-library", "/rush-month/review"],
      nextStep: "Keep uploads, public proof publishing, and external exports disabled.",
    },
    {
      key: "recognition",
      label: "Member recognition and friendly leaderboard",
      status: "covered_mock",
      plainEnglish:
        "Members can see local points, rank, recognition, and understandable chapter impact without seeing leadership-only KPI management.",
      routeEvidence: ["/rush-month/dashboard"],
      nextStep: "Treat this as mock recognition until the production points ledger is approved.",
    },
    {
      key: "coach",
      label: "Coach readiness and portfolio",
      status: "covered_mock",
      plainEnglish:
        "Coaches can review risk, readiness, closeout posture, and fake portfolio chapters without changing coach assignments.",
      routeEvidence: ["/coach", "/rush-month"],
      nextStep: "Keep coach decisions and reassignment controls disabled until write approval.",
    },
    {
      key: "admin",
      label: "Admin control center",
      status: "covered_readonly",
      plainEnglish:
        "Admins can inspect users, roles, chapters, campaign templates, result states, write gates, outbox posture, and system health placeholders.",
      routeEvidence: ["/admin"],
      nextStep: "Keep admin mutation controls disabled until auth, RLS, audit, and rollback are approved.",
    },
    {
      key: "integration_outbox",
      label: "Integration events and disabled outbox",
      status: "covered_readonly",
      plainEnglish: `${data.outboxItems.length} local outbox rows can be inspected, but real external sends remain off.`,
      routeEvidence: ["/admin", "/rush-month/loop"],
      nextStep: "Do not enable n8n, HubSpot, Luma, warehouse, or Power BI writes yet.",
    },
    {
      key: "live_auth_writes",
      label: "Live auth and browser writes",
      status: "blocked_until_approval",
      plainEnglish:
        "Production auth, browser sessions, and browser writes are intentionally not enabled.",
      routeEvidence: ["docs/architecture/goal-29-write-activation-approval-plan.md"],
      nextStep: "Nick/team must approve the next write activation goal before this changes.",
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

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin MVP coverage checklist";
    case "ds_admin":
      return "DS Admin MVP safety checklist";
    case "super_admin":
      return "Full local MVP coverage checklist";
    case "chapter_member":
    case "chapter_leader":
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
