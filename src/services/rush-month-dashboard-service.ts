import { rushMonthLeaderboard } from "@/data/mock-leaderboard";
import {
  getEventPlansForCampaign,
  getProofLibraryItemsForCampaign,
} from "@/services/campaign-ops-service";
import { getActorPrimaryRoleLabel } from "@/services/actor-role-display";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadChapterData,
  canReadIntegrationOutbox,
  getActorSurfaceFamily,
  getVisibleAssignmentsForActor,
  getVisibleRiskFlagsForActor,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import {
  getSopWorkflowRuntime,
  getWorkflowCheckpointLabel,
  getWorkflowCurrentPhaseExitSignal,
  getWorkflowCurrentPhaseObjective,
} from "@/services/sop-workflow-runtime";
import {
  getLaunchLaneLeaderAttendanceHref,
  getLaunchLaneLeaderEventsHref,
  getLaunchLaneLeaderPointsHref,
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
  getLaunchLaneStaffEventsHref,
  getLaunchLaneStaffPointsHref,
} from "@/services/events-points-launch-lane";
import type { Assignment } from "@/shared/types/domain";
import type {
  DashboardActionGroup,
  DashboardMetric,
  DashboardNextStep,
  DashboardPhaseSummary,
  DashboardRoleFocus,
  LeaderboardRow,
  RushMonthDashboard,
} from "@/shared/types/rush-month-dashboard";

export function getRushMonthDashboardForActor(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): RushMonthDashboard {
  const runtime = getSopWorkflowRuntime("rush-month");
  const surfaceFamily = getActorSurfaceFamily(actor);
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
    surfaceFamily,
    roleLabel: getActorPrimaryRoleLabel(actor),
    eyebrow: getDashboardEyebrow(surfaceFamily),
    title: getDashboardTitle(actor, surfaceFamily),
    summary: getDashboardSummary(actor, surfaceFamily),
    canReadChapterTruth: canReadTruth,
    phaseSummary: getDashboardPhaseSummary(
      surfaceFamily,
      data,
      visibleAssignments,
      runtime,
    ),
    whyItMatters: getDashboardWhyItMatters(
      surfaceFamily,
      data,
      visibleAssignments,
      runtime,
    ),
    nextStep: getDashboardNextStep(actor, surfaceFamily, visibleAssignments),
    actionGroups: getDashboardActionGroups(
      actor,
      surfaceFamily,
      visibleAssignments,
      eventPlans.length,
    ),
    roleFocus: getDashboardRoleFocus(actor, surfaceFamily, visibleAssignments, data),
    metrics: getDashboardMetrics(
      surfaceFamily,
      visibleAssignments,
      data,
      leaderboard,
      eventPlans.length,
    ),
    visibleAssignments,
    eventPlans,
    proofItems,
    leaderboard,
    pointsSummary: data.pointsSummary,
    kpiSummary: data.kpiSummary,
    risks,
    alerts: getDashboardAlerts(
      actor,
      surfaceFamily,
      visibleAssignments,
      proofItems.length,
      risks.length,
    ),
    integrationEvents,
    outboxItems,
  };
}

function getDashboardPhaseSummary(
  surfaceFamily: ActorSurfaceFamily,
  data: ReadOnlyAppData,
  assignments: Assignment[],
  runtime: ReturnType<typeof getSopWorkflowRuntime>,
): DashboardPhaseSummary {
  const counts = getAssignmentStatusCounts(assignments);
  const runtimeCheckpointLabel = getWorkflowCheckpointLabel(runtime, data.campaign.weekLabel);
  const runtimePhaseStatus = runtime?.currentPhase?.label ?? runtime?.currentStep?.phaseLabel ?? "Current phase";
  const runtimeCheckpointExit = getWorkflowCurrentPhaseExitSignal(
    runtime,
    "Current workflow exit signal stays visible here.",
  );
  const runtimeWhyItMatters = getWorkflowCurrentPhaseObjective(
    runtime,
    "Keep the current campaign step legible before the chapter scales the next push.",
  );

  switch (surfaceFamily) {
    case "member":
      return {
        label: runtimeCheckpointLabel,
        status: runtimePhaseStatus,
        note: `${runtimeWhyItMatters} ${runtimeCheckpointExit}`,
      };
    case "leader":
      return {
        label: runtimeCheckpointLabel,
        status: runtimePhaseStatus,
        note: `${counts.inProgress + counts.notStarted} visible action owner${counts.inProgress + counts.notStarted === 1 ? "" : "s"} still need movement before the chapter can scale the next push. Exit signal: ${runtimeCheckpointExit}`,
      };
    case "coach":
      return {
        label: runtimeCheckpointLabel,
        status: runtimePhaseStatus,
        note: `Use assignment movement, proof quality, and risk posture to decide whether the chapter should advance, hold, or get support. Exit signal: ${runtimeCheckpointExit}`,
      };
    case "staff":
      return {
        label: runtimeCheckpointLabel,
        status: runtimePhaseStatus,
        note: `Review whether the chapter is creating believable proof and support signals before any broader sharing or follow-up path is approved. Exit signal: ${runtimeCheckpointExit}`,
      };
    case "ds_admin":
      return {
        label: "Integration posture",
        status: "Student truth stays hidden",
        note:
          "This role can inspect disabled and mocked rows only. Campaign, proof, points, and KPI truth stay owned by the app.",
      };
    case "super_admin":
      return {
        label: runtimeCheckpointLabel,
        status: runtimePhaseStatus,
        note: `Use the full surface to review role boundaries, mock data shape, and disabled integration posture before any write approval. Exit signal: ${runtimeCheckpointExit}`,
      };
  }
}

function getDashboardWhyItMatters(
  surfaceFamily: ActorSurfaceFamily,
  data: ReadOnlyAppData,
  assignments: Assignment[],
  runtime: ReturnType<typeof getSopWorkflowRuntime>,
): string {
  const counts = getAssignmentStatusCounts(assignments);
  const runtimeStepTitle = runtime?.currentStep?.title ?? "current Rush Month step";
  const runtimeWhyItMatters = getRuntimeWhyItMatters(runtime);
  const runtimeCompletionSignal = getWorkflowCurrentPhaseExitSignal(
    runtime,
    "Keep the current workflow exit signal readable before the chapter moves on.",
  );

  switch (surfaceFamily) {
    case "member":
      return `Why it matters: ${runtimeWhyItMatters} ${runtimeCompletionSignal}`;
    case "leader":
      return `Why it matters: leaders turn scattered effort into a chapter operating system. The current workflow step is "${runtimeStepTitle}." ${runtimeWhyItMatters} Right now ${counts.submitted + counts.changesRequested} visible proof or review item${counts.submitted + counts.changesRequested === 1 ? "" : "s"} still need a decision posture before the next push feels believable.`;
    case "coach":
      return `Why it matters: the coach decision should reflect real chapter movement, not optimism. The current workflow step is "${runtimeStepTitle}." ${runtimeWhyItMatters} ${data.kpiSummary.proofPending} proof item${data.kpiSummary.proofPending === 1 ? "" : "s"} and the current ${data.kpiSummary.coachDecision} posture still shape whether this chapter is actually ready.`;
    case "staff":
      return `Why it matters: HQ support only helps when it stays grounded in what the chapter actually did. The current workflow step is "${runtimeStepTitle}." ${runtimeWhyItMatters} Keep broader sharing, follow-up, and external systems blocked until the chapter truth is believable.`;
    case "ds_admin":
      return "Why it matters: systems work should make the app safer, not take over campaign truth. This role exists to inspect disabled integration posture without owning student operations.";
    case "super_admin":
      return `Why it matters: this full local view is the fastest way to verify role boundaries, UX clarity, and mock-safe operating logic. The current workflow step is "${runtimeStepTitle}." ${runtimeWhyItMatters}`;
  }
}

function getRuntimeWhyItMatters(runtime: ReturnType<typeof getSopWorkflowRuntime>) {
  const stepWhyItMatters = runtime?.currentStep?.whyItMatters;
  const phaseObjective = runtime?.currentPhase?.objective;

  if (stepWhyItMatters && phaseObjective) {
    return `${stepWhyItMatters} Current phase objective: ${phaseObjective}`;
  }

  return (
    stepWhyItMatters ??
    phaseObjective ??
    "Rush Month works when the chapter can point to one visible step that students and leaders both understand."
  );
}

export function getVisibleLeaderboardForActor(
  actor: LocalActorContext,
  leaderboard: LeaderboardRow[] = rushMonthLeaderboard,
): LeaderboardRow[] {
  if (getActorSurfaceFamily(actor) === "ds_admin") {
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

function getDashboardEyebrow(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "member":
      return "My Rush Month week";
    case "leader":
      return "Leader operating dashboard";
    case "coach":
      return "Coach campaign health";
    case "staff":
      return "HQ support dashboard";
    case "ds_admin":
      return "Integration posture only";
    case "super_admin":
      return "Super admin oversight";
  }
}

function getDashboardTitle(
  actor: LocalActorContext,
  surfaceFamily: ActorSurfaceFamily,
): string {
  switch (surfaceFamily) {
    case "member":
      return "Know what to do next and how you are being recognized.";
    case "leader":
      return hasChapterRole(actor, "President / VP")
        ? "Approve the right decisions and keep the chapter accountable."
        : hasChapterRole(actor, "E-Board Member")
          ? "Move owners, events, and proof follow-up without waiting for staff."
          : "Track the week, unblock owners, and keep Rush Month moving.";
    case "coach":
      return "See whether this chapter should advance, hold, or get help.";
    case "staff":
      return "Review proof posture and chapter support signals.";
    case "ds_admin":
      return "Inspect disabled automation posture without owning student truth.";
    case "super_admin":
      return "Review the full local Rush Month operating surface.";
  }
}

function getDashboardSummary(
  actor: LocalActorContext,
  surfaceFamily: ActorSurfaceFamily,
): string {
  switch (surfaceFamily) {
    case "member":
      return "This student view keeps the week simple: your next action, events to attend, points, leaderboard, and proof prompts.";
    case "leader":
      return hasChapterRole(actor, "President / VP")
        ? "This President / VP view emphasizes attendance, chapter coverage, and the decisions that keep points believable."
        : hasChapterRole(actor, "E-Board Member")
          ? "This E-Board view emphasizes owner follow-up, event execution, attendance, and the next chapter move."
          : "This leader view stays centered on events, attendance, and points.";
    case "coach":
      return "This coach view focuses on readiness, overdue or stuck work, proof flow, risk signals, and the decision state.";
    case "staff":
      return "This HQ view keeps broad support and proof-sharing posture visible while leaving chapter truth in the app.";
    case "ds_admin":
      return "DS Admin can inspect integration/outbox safety only. Campaign, proof, points, and KPI truth stay hidden.";
    case "super_admin":
      return "This local oversight view shows the whole mock-safe surface for permission and operating-model review.";
  }
}

function getDashboardNextStep(
  actor: LocalActorContext,
  surfaceFamily: ActorSurfaceFamily,
  visibleAssignments: Assignment[],
): DashboardNextStep {
  switch (surfaceFamily) {
    case "member": {
      return {
        label: "Open the next Rush Month event",
        href: getLaunchLaneMemberEventsHref("home"),
        summary:
          "Keep the member loop simple: open the event, RSVP, show up, and let attendance drive points instead of sending members into side modules.",
        ctaLabel: "Open events",
      };
    }
    case "leader":
      if (hasChapterRole(actor, "President / VP")) {
        return {
          label: "Confirm attendance before the chapter scales",
          href: getLaunchLaneLeaderAttendanceHref(),
          summary:
            "Keep the launch lane grounded in real behavior: who RSVP'd, who showed up, and whether the chapter has earned the next points move.",
          ctaLabel: "Open attendance",
        };
      }

      if (hasChapterRole(actor, "E-Board Member")) {
        return {
          label: "Run the next event and attendance cycle",
          href: getLaunchLaneLeaderEventsHref(),
          summary:
            "Stay inside one leader loop: set the event, watch RSVP posture, confirm attendance, and let points follow from the same view.",
          ctaLabel: "Open event loop",
        };
      }

      return {
        label: "Keep the chapter event loop moving",
        href: getLaunchLaneLeaderEventsHref(),
        summary:
          "Use leader events, attendance, and points to keep the chapter simple enough to run every week without extra side modules.",
        ctaLabel: "Open leader events",
      };
    case "coach":
      return {
        label: "Review chapter event health",
        href: "/staff?view=chapters",
        summary:
          "Use chapter-by-chapter event, RSVP, attendance, and points posture before deciding where support is needed.",
        ctaLabel: "Open chapters",
      };
    case "staff":
      return {
        label: "Review event, attendance, and points across the pilot",
        href: "/staff?view=chapters",
        summary:
          "Keep the staff story narrow: which chapter has the next event, who RSVPd, who attended, and how points moved.",
        ctaLabel: "Open staff view",
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

function getDashboardActionGroups(
  actor: LocalActorContext,
  surfaceFamily: ActorSurfaceFamily,
  assignments: Assignment[],
  eventCount: number,
): DashboardActionGroup[] {
  const proofFollowUpCount = getAssignmentStatusCounts(assignments).submitted +
    getAssignmentStatusCounts(assignments).changesRequested;

  switch (surfaceFamily) {
    case "member":
      return [
        {
          label: "Next event",
          summary:
            "Open the upcoming event first so RSVP, attendance, and chapter momentum stay in one visible member loop.",
          href: getLaunchLaneMemberEventsHref("home"),
          linkLabel: "Open events",
        },
        {
          label: "Rush event",
          summary: `${eventCount} event plan${eventCount === 1 ? "" : "s"} stay visible here so the invite push, RSVP moment, and in-person follow-through all connect.`,
          href: "/rush-month/events",
          linkLabel: "See events",
        },
        {
          label: "Points and leaderboard",
          summary:
            "Use the leaderboard to confirm how attendance-backed activity shows up for you and for the chapter.",
          href: getLaunchLaneMemberPointsHref("points"),
          linkLabel: "See points",
        },
      ];
    case "leader":
      return [
        {
          label: "Event setup",
          summary:
            "Create the next chapter event or tighten the current one before the week drifts.",
          href: getLaunchLaneLeaderEventsHref(),
          linkLabel: "Open events",
        },
        {
          label: "Attendance confirm",
          summary: `${proofFollowUpCount} visible follow-up item${proofFollowUpCount === 1 ? "" : "s"} still signal where attendance, no-shows, or next-owner follow-through need attention.`,
          href: getLaunchLaneLeaderAttendanceHref(),
          linkLabel: "Check attendance",
        },
        {
          label: "Chapter leaderboard",
          summary:
            "Use points to confirm that attendance is turning into visible chapter momentum.",
          href: getLaunchLaneLeaderPointsHref(),
          linkLabel: "See points",
        },
      ];
    case "coach":
      return [
        {
          label: "Portfolio chapters",
          summary:
            "Use the chapter list first so the support story stays grounded in event health and points movement.",
          href: "/staff?view=chapters",
          linkLabel: "Open chapters",
        },
        {
          label: "Live events",
          summary:
            "Check which chapter event is next, where RSVP posture is soft, and where attendance could fall off.",
          href: getLaunchLaneStaffEventsHref({ campaignSlug: "rush-month" }),
          linkLabel: "Open events",
        },
        {
          label: "Points watch",
          summary:
            "Use chapter and org leaderboard movement to spot which chapters need intervention.",
          href: getLaunchLaneStaffPointsHref(),
          linkLabel: "See points",
        },
      ];
    case "staff":
      return [
        {
          label: "Chapter list",
          summary:
            "Keep the staff view anchored in a simple rollout question: which chapters are actually running the loop well.",
          href: "/staff?view=chapters",
          linkLabel: "Open chapters",
        },
        {
          label: "Event pulse",
          summary:
            "Review chapter events, RSVP counts, attendance counts, and the next moments that need support.",
          href: getLaunchLaneStaffEventsHref({ campaignSlug: "rush-month" }),
          linkLabel: "Open events",
        },
        {
          label: "Organization leaderboard",
          summary:
            "Use chapter and org points to see whether event energy is turning into consistent chapter movement.",
          href: getLaunchLaneStaffPointsHref(),
          linkLabel: "See points",
        },
      ];
    case "ds_admin":
      return [
        {
          label: "Outbox posture",
          summary:
            "Inspect disabled and mocked rows without reading student truth or campaign content.",
          href: "/admin",
          linkLabel: "Open admin",
        },
        {
          label: "Safety checks",
          summary:
            "Review environment and browser-write gates before any local write drill is approved.",
          href: "/admin/system-health",
          linkLabel: "Open system health",
        },
        {
          label: "Route coverage",
          summary:
            "Use the reviewer path to confirm each role can see the right surface while writes stay blocked.",
          href: "/admin/review-path",
          linkLabel: "Open review path",
        },
      ];
    case "super_admin":
      return [
        {
          label: "Student flow",
          summary:
            "Review the member-facing route sequence from chapter home through action, proof, points, and events.",
          href: "/rush-month/dashboard",
          linkLabel: "Stay on dashboard",
        },
        {
          label: "Leader and coach",
          summary:
            "Check how chapter leadership and staff decisions connect before any write path is promoted.",
          href: "/coach",
          linkLabel: "Open coach view",
        },
        {
          label: "Admin health",
          summary:
            "Inspect outbox, audit, environment, and route safety from the admin surfaces.",
          href: "/admin",
          linkLabel: "Open admin",
        },
      ];
  }
}

function getDashboardRoleFocus(
  actor: LocalActorContext,
  surfaceFamily: ActorSurfaceFamily,
  assignments: Assignment[],
  data: ReadOnlyAppData,
): DashboardRoleFocus | null {
  if (surfaceFamily !== "leader") {
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
        "Use this view to decide whether the chapter is ready to scale the next event based on attendance, role coverage, and points movement.",
      primaryHref: getLaunchLaneLeaderAttendanceHref(),
      primaryLabel: "Check attendance",
      secondaryHref: getLaunchLaneLeaderPointsHref(),
      secondaryLabel: "See points",
      safetyNote:
        "This is a read-only launch posture. Attendance, points, event saves, and role changes still require the approved live path.",
      items: [
        {
          label: "Attendance to confirm",
          value: `${pendingFollowUp}`,
          note: "Visible follow-up items still need the chapter to confirm who actually showed up or closed the loop.",
        },
        {
          label: "Chapter points",
          value: `${data.pointsSummary.earned}`,
          note: "Use chapter points movement before expanding the next chapter push.",
        },
        {
          label: "Role coverage",
          value: actor.chapterRoles.join(", "),
          note: "Role coverage should help the chapter run the loop without extra modules.",
        },
      ],
    };
  }

  if (hasChapterRole(actor, "E-Board Member")) {
    return {
      roleLabel: "E-Board Member",
      title: "Execution and owner-follow-up focus",
      summary:
        "Use this view to keep the event loop moving: create or adjust the event, confirm attendance, and make sure points follow a real chapter moment.",
      primaryHref: getLaunchLaneLeaderEventsHref(),
      primaryLabel: "Open events",
      secondaryHref: getLaunchLaneLeaderAttendanceHref(),
      secondaryLabel: "Check attendance",
      safetyNote:
        "This is a read-only execution posture. Event saves, attendance imports, and point writes still depend on the approved live path.",
      items: [
        {
          label: "Active owners",
          value: `${activeOwners}`,
          note: "Not-started or in-progress work that still needs E-Board follow-through around the event loop.",
        },
        {
          label: "Events linked",
          value: `${data.kpiSummary.eventsLinked}`,
          note: "Mock Luma posture only; no live write is triggered from this surface.",
        },
        {
          label: "Attendance + points",
          value: `${pendingFollowUp}`,
          note: "Use the attendance lane to clear the items keeping the next points move from feeling believable.",
        },
      ],
    };
  }

  return {
    roleLabel: "Chapter Leader",
    title: "Leader operating focus",
    summary:
      "Use this view to balance event readiness, attendance follow-through, and chapter points movement.",
    primaryHref: getLaunchLaneLeaderEventsHref(),
    primaryLabel: "Open events",
    secondaryHref: getLaunchLaneLeaderPointsHref(),
    secondaryLabel: "See points",
    safetyNote:
      "This is read-only leader guidance. Browser writes, attendance imports, and external sends remain disabled.",
    items: [
      {
        label: "Needs follow-up",
        value: `${pendingFollowUp}`,
        note: "Visible follow-up items waiting for the chapter to close the event loop clearly.",
      },
      {
        label: "Active owners",
        value: `${activeOwners}`,
        note: "Visible owners still moving the chapter event loop forward.",
      },
      {
        label: "Chapter points",
        value: `${data.pointsSummary.earned}`,
        note: "Use points movement to confirm whether the chapter loop is working.",
      },
    ],
  };
}

function getDashboardMetrics(
  surfaceFamily: ActorSurfaceFamily,
  assignments: Assignment[],
  data: ReadOnlyAppData,
  leaderboard: LeaderboardRow[],
  eventCount: number,
): DashboardMetric[] {
  if (surfaceFamily === "ds_admin") {
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
  surfaceFamily: ActorSurfaceFamily,
  assignments: Assignment[],
  proofItemCount: number,
  riskCount: number,
): string[] {
  if (surfaceFamily === "ds_admin") {
    return [
      "DS Admin can inspect disabled/mock integration rows only.",
      "Student truth, proof content, points, and KPIs remain hidden.",
    ];
  }

  const counts = getAssignmentStatusCounts(assignments);

  switch (surfaceFamily) {
    case "member":
      return [
        "Finish your visible action before the due date.",
        "Submit a testimonial or bridge video only when you can explain what happened and why it mattered.",
      ];
    case "leader":
      if (hasChapterRole(actor, "President / VP")) {
        return [
          `${counts.submitted + counts.changesRequested} follow-up item${counts.submitted + counts.changesRequested === 1 ? "" : "s"} still affects whether the chapter is really ready to scale.`,
          "Use attendance and points before widening the next event push.",
        ];
      }

      if (hasChapterRole(actor, "E-Board Member")) {
        const activeOwnerCount = counts.inProgress + counts.notStarted;

        return [
          `${activeOwnerCount} owner${activeOwnerCount === 1 ? "" : "s"} ${activeOwnerCount === 1 ? "needs" : "need"} execution follow-up.`,
          "Keep the visible leader work centered on events, attendance, and points.",
        ];
      }

      return [
        `${counts.submitted + counts.changesRequested} visible follow-up item${counts.submitted + counts.changesRequested === 1 ? "" : "s"} still needs the event loop to be closed clearly.`,
        "Keep the visible leader work centered on events, attendance, and points.",
      ];
    case "coach":
      return [
        `${riskCount} visible risk signal${riskCount === 1 ? "" : "s"} need coach attention.`,
        "Use event movement, attendance posture, and points before logging advance / hold / intervene.",
      ];
    case "staff":
      return [
        `${proofItemCount} follow-up item${proofItemCount === 1 ? "" : "s"} still sits behind the visible event loop, but the staff lane stays focused on chapters, events, and points.`,
        "Do not trigger external syncs from this pilot lane.",
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
