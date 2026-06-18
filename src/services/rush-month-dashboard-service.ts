import { rushMonthLeaderboard } from "@/data/mock-leaderboard";
import {
  getEventPlansForCampaign,
  getProofLibraryItemsForCampaign,
} from "@/services/campaign-ops-service";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadChapterData,
  canReadIntegrationOutbox,
  getVisibleAssignmentsForActor,
  getVisibleRiskFlagsForActor,
} from "@/services/role-visibility";
import type { Assignment } from "@/shared/types/domain";
import type {
  DashboardMetric,
  DashboardNextStep,
  DashboardRoleFocus,
  LeaderboardRow,
  RushMonthDashboard,
} from "@/shared/types/rush-month-dashboard";

export function getRushMonthDashboardForActor(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): RushMonthDashboard {
  const canReadTruth = canReadChapterData(actor);
  const visibleAssignments = canReadTruth
    ? getVisibleAssignmentsForActor(actor, data.assignments)
    : [];
  const eventPlans = canReadTruth ? getEventPlansForCampaign("rush-month") : [];
  const proofItems = canReadTruth ? getProofLibraryItemsForCampaign("rush-month") : [];
  const risks = getVisibleRiskFlagsForActor(actor, data.riskFlags);
  const leaderboard = getVisibleLeaderboardForActor(actor, rushMonthLeaderboard);
  const integrationEvents = canReadIntegrationOutbox(actor) ? data.integrationEvents : [];
  const outboxItems = canReadIntegrationOutbox(actor) ? data.outboxItems : [];

  return {
    audience: actor.audience,
    eyebrow: getDashboardEyebrow(actor),
    title: getDashboardTitle(actor),
    summary: getDashboardSummary(actor),
    canReadChapterTruth: canReadTruth,
    nextStep: getDashboardNextStep(actor, visibleAssignments),
    roleFocus: getDashboardRoleFocus(actor, visibleAssignments, data),
    metrics: getDashboardMetrics(actor, visibleAssignments, data, leaderboard, eventPlans.length),
    visibleAssignments,
    eventPlans,
    proofItems,
    leaderboard,
    pointsSummary: data.pointsSummary,
    kpiSummary: data.kpiSummary,
    risks,
    alerts: getDashboardAlerts(actor, visibleAssignments, proofItems.length, risks.length),
    integrationEvents,
    outboxItems,
  };
}

export function getVisibleLeaderboardForActor(
  actor: LocalActorContext,
  leaderboard: LeaderboardRow[] = rushMonthLeaderboard,
): LeaderboardRow[] {
  if (actor.audience === "ds_admin") {
    return [];
  }

  return [...leaderboard].sort((left, right) => right.points - left.points).slice(0, 5);
}

export function getAssignmentStatusCounts(assignments: Assignment[]) {
  return {
    approved: assignments.filter((assignment) => assignment.status === "approved").length,
    submitted: assignments.filter((assignment) => assignment.status === "submitted").length,
    inProgress: assignments.filter((assignment) => assignment.status === "in_progress")
      .length,
    changesRequested: assignments.filter(
      (assignment) => assignment.status === "changes_requested",
    ).length,
    notStarted: assignments.filter((assignment) => assignment.status === "not_started")
      .length,
  };
}

function getDashboardEyebrow(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "My Rush Month week";
    case "chapter_leader":
      return "Leader operating dashboard";
    case "coach":
      return "Coach campaign health";
    case "admin":
      return "HQ support dashboard";
    case "ds_admin":
      return "Integration posture only";
    case "super_admin":
      return "Super admin oversight";
  }
}

function getDashboardTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Know what to do next and how you are being recognized.";
    case "chapter_leader":
      return hasChapterRole(actor, "President / VP")
        ? "Approve the right decisions and keep the chapter accountable."
        : hasChapterRole(actor, "E-Board Member")
          ? "Move owners, events, and proof follow-up without waiting for staff."
          : "Track the week, unblock owners, and keep Rush Month moving.";
    case "coach":
      return "See whether this chapter should advance, hold, or get help.";
    case "admin":
      return "Review proof posture and chapter support signals.";
    case "ds_admin":
      return "Inspect disabled automation posture without owning student truth.";
    case "super_admin":
      return "Review the full local Rush Month operating surface.";
  }
}

function getDashboardSummary(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "This student view keeps the week simple: your next action, events to attend, points, leaderboard, and proof prompts.";
    case "chapter_leader":
      return hasChapterRole(actor, "President / VP")
        ? "This President / VP view emphasizes approval queues, member-role readiness, chapter KPIs, and the decisions that keep Rush Month safe."
        : hasChapterRole(actor, "E-Board Member")
          ? "This E-Board view emphasizes owner follow-up, event execution, proof reminders, and the next action committee moves."
          : "This leader view combines assignments, event plans, proof follow-up, member recognition, and KPI signals.";
    case "coach":
      return "This coach view focuses on readiness, overdue or stuck work, proof flow, risk signals, and the decision state.";
    case "admin":
      return "This HQ view keeps broad support and proof-sharing posture visible while leaving chapter truth in the app.";
    case "ds_admin":
      return "DS Admin can inspect integration/outbox safety only. Campaign, proof, points, and KPI truth stay hidden.";
    case "super_admin":
      return "This local oversight view shows the whole mock-safe surface for permission and operating-model review.";
  }
}

function getDashboardNextStep(
  actor: LocalActorContext,
  visibleAssignments: Assignment[],
): DashboardNextStep {
  switch (actor.audience) {
    case "chapter_member": {
      const nextMemberAssignment =
        visibleAssignments.find((assignment) => assignment.status !== "approved") ??
        visibleAssignments[0];

      return {
        label: nextMemberAssignment?.title ?? "Check your Rush Month action",
        href: nextMemberAssignment
          ? `/rush-month/actions/${nextMemberAssignment.id}`
          : "/rush-month/actions",
        summary:
          nextMemberAssignment?.evidenceRequired ??
          "Open your visible actions and confirm what proof or testimonial is needed.",
        ctaLabel: "Open my next action",
      };
    }
    case "chapter_leader":
      if (hasChapterRole(actor, "President / VP")) {
        return {
          label: "Review proof and role decisions before the week scales",
          href: "/rush-month/review",
          summary:
            "Check submitted or changes-requested proof, confirm owners are accountable, and use the member workspace before approving wider chapter movement.",
          ctaLabel: "Open approval queue",
        };
      }

      if (hasChapterRole(actor, "E-Board Member")) {
        return {
          label: "Move event owners and stuck assignments",
          href: "/rush-month/actions",
          summary:
            "Check which owners are not started or in progress, then use the events and action committee surfaces to keep work moving.",
          ctaLabel: "Open team actions",
        };
      }

      return {
        label: "Unblock pending proof and owner follow-up",
        href: "/rush-month/review",
        summary:
          "Review submitted or stuck proof, check event owners, and make sure every active action has a clear next step.",
        ctaLabel: "Open follow-up queue",
      };
    case "coach":
      return {
        label: "Review the advance / hold / intervene state",
        href: "/coach",
        summary:
          "Use assignment status, proof flow, risks, and KPI movement to decide whether the chapter needs help.",
        ctaLabel: "Open coach readout",
      };
    case "admin":
      return {
        label: "Review HQ proof-sharing posture",
        href: "/rush-month/review",
        summary:
          "HQ can decide what proof or testimonials should be shared later. No publishing happens in this mock-safe app.",
        ctaLabel: "Open HQ review",
      };
    case "ds_admin":
      return {
        label: "Inspect disabled integration posture",
        href: "/admin",
        summary:
          "Review structured events and outbox rows without reading campaign, proof, points, or KPI truth.",
        ctaLabel: "Open integration outbox",
      };
    case "super_admin":
      return {
        label: "Inspect the full local operating surface",
        href: "/admin",
        summary:
          "Review role boundaries, campaign posture, proof posture, and disabled integration safety.",
        ctaLabel: "Open super admin",
      };
  }
}

function getDashboardRoleFocus(
  actor: LocalActorContext,
  assignments: Assignment[],
  data: ReadOnlyAppData,
): DashboardRoleFocus | null {
  if (actor.audience !== "chapter_leader") {
    return null;
  }

  const counts = getAssignmentStatusCounts(assignments);
  const pendingFollowUp = counts.submitted + counts.changesRequested;
  const activeOwners = counts.inProgress + counts.notStarted;

  if (hasChapterRole(actor, "President / VP")) {
    return {
      roleLabel: "President / VP",
      title: "Approval and chapter-accountability focus",
      summary:
        "Use this view to decide what needs approval, which role gaps block progress, and whether the chapter is ready for the next Rush Month push.",
      primaryHref: "/rush-month/review",
      primaryLabel: "Review proof decisions",
      secondaryHref: "/chapter/members",
      secondaryLabel: "Check role coverage",
      safetyNote:
        "This is a read-only approval posture. Membership approvals, proof decisions, assignment saves, and role changes remain disabled.",
      items: [
        {
          label: "Approval queue",
          value: `${pendingFollowUp}`,
          note: "Submitted or changes-requested items need a clear decision posture.",
        },
        {
          label: "Chapter KPI",
          value: data.kpiSummary.coachDecision,
          note: "Use KPI posture before expanding the next chapter push.",
        },
        {
          label: "Role coverage",
          value: actor.chapterRoles.join(", "),
          note: "This fake persona previews President / VP accountability only.",
        },
      ],
    };
  }

  if (hasChapterRole(actor, "E-Board Member")) {
    return {
      roleLabel: "E-Board Member",
      title: "Execution and owner-follow-up focus",
      summary:
        "Use this view to keep owners moving, check event follow-through, and make sure proof reminders are concrete enough for members.",
      primaryHref: "/rush-month/actions",
      primaryLabel: "Open owner follow-up",
      secondaryHref: "/rush-month/events",
      secondaryLabel: "Check events",
      safetyNote:
        "This is a read-only execution posture. Assignment saves, reminders, Luma writes, and proof uploads remain disabled.",
      items: [
        {
          label: "Active owners",
          value: `${activeOwners}`,
          note: "Not-started or in-progress actions that need E-Board follow-up.",
        },
        {
          label: "Events linked",
          value: `${data.kpiSummary.eventsLinked}`,
          note: "Mock event posture only; no Luma write is triggered.",
        },
        {
          label: "Proof follow-up",
          value: `${pendingFollowUp}`,
          note: "Items that need clearer proof, testimonial context, or HQ review.",
        },
      ],
    };
  }

  return {
    roleLabel: "Chapter Leader",
    title: "Leader operating focus",
    summary:
      "Use this view to balance owner follow-up, proof posture, and chapter KPI movement.",
    primaryHref: "/rush-month/review",
    primaryLabel: "Open follow-up",
    secondaryHref: "/rush-month/actions",
    secondaryLabel: "Open actions",
    safetyNote:
      "This is read-only leader guidance. Browser writes and external sends remain disabled.",
    items: [
      {
        label: "Needs follow-up",
        value: `${pendingFollowUp}`,
        note: "Visible proof/action items waiting for a clearer decision.",
      },
      {
        label: "Active owners",
        value: `${activeOwners}`,
        note: "Visible owners still moving work forward.",
      },
      {
        label: "Events linked",
        value: `${data.kpiSummary.eventsLinked}`,
        note: "Mock Luma posture only.",
      },
    ],
  };
}

function getDashboardMetrics(
  actor: LocalActorContext,
  assignments: Assignment[],
  data: ReadOnlyAppData,
  leaderboard: LeaderboardRow[],
  eventCount: number,
): DashboardMetric[] {
  if (actor.audience === "ds_admin") {
    return [
      {
        label: "External sends",
        value: "0",
        note: "No live n8n, Luma, HubSpot, warehouse, or Power BI writes.",
      },
      {
        label: "Outbox rows",
        value: `${data.outboxItems.length}`,
        note: "Inspectable only through the admin integration posture.",
      },
      {
        label: "Student truth",
        value: "Hidden",
        note: "Assignments, points, KPIs, and proof stay app-owned.",
      },
    ];
  }

  const counts = getAssignmentStatusCounts(assignments);

  return [
    {
      label: "Visible actions",
      value: `${assignments.length}`,
      note: `${counts.inProgress + counts.notStarted} still need movement.`,
    },
    {
      label: "Proof pending",
      value: `${counts.submitted + counts.changesRequested}`,
      note: "Testimonials/proof that need follow-up or HQ posture.",
    },
    {
      label: "Points earned",
      value: `${data.pointsSummary.earned}`,
      note: `${leaderboard.length} students visible on the friendly leaderboard.`,
    },
    {
      label: "Rush events",
      value: `${eventCount}`,
      note: "Action-committee event plans, Luma still mock/disabled.",
    },
    {
      label: "Coach decision",
      value: data.kpiSummary.coachDecision,
      note: "Local read-only decision state.",
    },
    {
      label: "Events linked",
      value: `${data.kpiSummary.eventsLinked}`,
      note: "Mock Luma posture only.",
    },
  ];
}

function getDashboardAlerts(
  actor: LocalActorContext,
  assignments: Assignment[],
  proofItemCount: number,
  riskCount: number,
): string[] {
  if (actor.audience === "ds_admin") {
    return [
      "DS Admin can inspect disabled/mock integration rows only.",
      "Student truth, proof content, points, and KPIs remain hidden.",
    ];
  }

  const counts = getAssignmentStatusCounts(assignments);

  switch (actor.audience) {
    case "chapter_member":
      return [
        "Finish your visible action before the due date.",
        "Submit a testimonial or bridge video only when you can explain what happened and why it mattered.",
      ];
    case "chapter_leader":
      if (hasChapterRole(actor, "President / VP")) {
        return [
          `${counts.submitted + counts.changesRequested} proof/action item${counts.submitted + counts.changesRequested === 1 ? "" : "s"} need a decision posture before the chapter scales.`,
          "Use the member workspace to inspect role coverage before approving new work.",
        ];
      }

      if (hasChapterRole(actor, "E-Board Member")) {
        const activeOwnerCount = counts.inProgress + counts.notStarted;

        return [
          `${activeOwnerCount} owner${activeOwnerCount === 1 ? "" : "s"} ${activeOwnerCount === 1 ? "needs" : "need"} execution follow-up.`,
          "Keep action committees focused on events and student action, not passive meetings.",
        ];
      }

      return [
        `${counts.submitted + counts.changesRequested} visible proof/action item${counts.submitted + counts.changesRequested === 1 ? "" : "s"} need follow-up.`,
        "Keep action committees focused on events and student action, not passive meetings.",
      ];
    case "coach":
      return [
        `${riskCount} visible risk signal${riskCount === 1 ? "" : "s"} need coach attention.`,
        "Use proof, event movement, and assignment status before logging advance / hold / intervene.",
      ];
    case "admin":
      return [
        `${proofItemCount} Rush Month proof item${proofItemCount === 1 ? "" : "s"} can be reviewed for future sharing posture.`,
        "Do not publish proof or trigger external syncs from this mock-safe app.",
      ];
    case "super_admin":
      return [
        "Use this view to inspect role boundaries before enabling real auth or writes.",
        "External automations remain disabled until explicitly approved.",
      ];
  }
}

function hasChapterRole(actor: LocalActorContext, role: string): boolean {
  return actor.chapterRoles.includes(role);
}
