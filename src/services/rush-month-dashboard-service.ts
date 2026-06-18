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
    phaseSummary: getDashboardPhaseSummary(actor, data, visibleAssignments),
    whyItMatters: getDashboardWhyItMatters(actor, data, visibleAssignments),
    nextStep: getDashboardNextStep(actor, visibleAssignments),
    actionGroups: getDashboardActionGroups(actor, visibleAssignments, eventPlans.length),
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

function getDashboardPhaseSummary(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  assignments: Assignment[],
): DashboardPhaseSummary {
  const counts = getAssignmentStatusCounts(assignments);

  switch (actor.audience) {
    case "chapter_member":
      return {
        label: data.campaign.weekLabel,
        status: "Invite and prove the first push",
        note:
          "Move one concrete invite action, keep the event visible, and show proof that the chapter actually reached students.",
      };
    case "chapter_leader":
      return {
        label: data.campaign.weekLabel,
        status: "Owner follow-up and chapter accountability",
        note: `${counts.inProgress + counts.notStarted} visible action owner${counts.inProgress + counts.notStarted === 1 ? "" : "s"} still need movement before the chapter can scale the next push.`,
      };
    case "coach":
      return {
        label: data.campaign.weekLabel,
        status: "Coach readiness check",
        note:
          "Use assignment movement, proof quality, and risk posture to decide whether the chapter should advance, hold, or get support.",
      };
    case "admin":
      return {
        label: data.campaign.weekLabel,
        status: "HQ review posture",
        note:
          "Review whether the chapter is creating believable proof and support signals before any broader sharing or follow-up path is approved.",
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
        label: data.campaign.weekLabel,
        status: "Full local oversight",
        note:
          "Use the full surface to review role boundaries, mock data shape, and disabled integration posture before any write approval.",
      };
  }
}

function getDashboardWhyItMatters(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  assignments: Assignment[],
): string {
  const counts = getAssignmentStatusCounts(assignments);

  switch (actor.audience) {
    case "chapter_member":
      return "Why it matters: one student action plus one clean proof note is what turns Rush Month from a plan into visible chapter momentum. This view keeps the week understandable so you can act without guessing what counts.";
    case "chapter_leader":
      return `Why it matters: leaders turn scattered effort into a chapter operating system. Right now ${counts.submitted + counts.changesRequested} visible proof or review item${counts.submitted + counts.changesRequested === 1 ? "" : "s"} still need a decision posture before the next push feels believable.`;
    case "coach":
      return `Why it matters: the coach decision should reflect real chapter movement, not optimism. ${data.kpiSummary.proofPending} proof item${data.kpiSummary.proofPending === 1 ? "" : "s"} and the current ${data.kpiSummary.coachDecision} posture still shape whether this chapter is actually ready.`;
    case "admin":
      return "Why it matters: HQ support only helps when it stays grounded in what the chapter actually did, what proof exists, and what should remain internal until broader sharing is approved.";
    case "ds_admin":
      return "Why it matters: systems work should make the app safer, not take over campaign truth. This role exists to inspect disabled integration posture without owning student operations.";
    case "super_admin":
      return "Why it matters: this full local view is the fastest way to verify role boundaries, UX clarity, and mock-safe operating logic before anybody asks for live writes.";
  }
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

function getDashboardActionGroups(
  actor: LocalActorContext,
  assignments: Assignment[],
  eventCount: number,
): DashboardActionGroup[] {
  const nextAssignment =
    assignments.find((assignment) => assignment.status !== "approved") ?? assignments[0];
  const proofFollowUpCount = getAssignmentStatusCounts(assignments).submitted +
    getAssignmentStatusCounts(assignments).changesRequested;

  switch (actor.audience) {
    case "chapter_member":
      return [
        {
          label: "Invite push",
          summary:
            nextAssignment?.instructions ??
            "Open your next action and finish the outreach step that moves the week forward.",
          href: nextAssignment ? `/rush-month/actions/${nextAssignment.id}` : "/rush-month/actions",
          linkLabel: "Open action",
        },
        {
          label: "Rush event",
          summary: `${eventCount} event plan${eventCount === 1 ? "" : "s"} stay visible here so the invite push, RSVP moment, and in-person follow-through all connect.`,
          href: "/rush-month/events",
          linkLabel: "See events",
        },
        {
          label: "Proof and points",
          summary:
            "Submit a clean proof note, then track how your work shows up in recognition and leaderboard posture.",
          href: "/rush-month/leaderboard",
          linkLabel: "See points",
        },
      ];
    case "chapter_leader":
      return [
        {
          label: "Owner follow-up",
          summary:
            "Keep each visible assignment owned by a real person with a due date and proof expectation.",
          href: "/rush-month/actions",
          linkLabel: "Open actions",
        },
        {
          label: "Proof review",
          summary: `${proofFollowUpCount} visible proof or review item${proofFollowUpCount === 1 ? "" : "s"} still need a clear chapter decision posture.`,
          href: "/rush-month/review",
          linkLabel: "Open review",
        },
        {
          label: "Event readiness",
          summary:
            "Use the event surface to keep invite energy tied to actual chapter moments and Luma-safe follow-up.",
          href: "/rush-month/events",
          linkLabel: "Check events",
        },
      ];
    case "coach":
      return [
        {
          label: "Campaign health",
          summary:
            "Review the chapter decision posture, open work, and whether the phase should advance or pause.",
          href: "/coach",
          linkLabel: "Open coach view",
        },
        {
          label: "Assignments",
          summary:
            "Check whether visible owners are moving or whether the chapter is stalling behind overdue work.",
          href: "/rush-month/actions",
          linkLabel: "Review assignments",
        },
        {
          label: "Proof and events",
          summary:
            "Use evidence and event posture to decide whether the chapter has believable student momentum.",
          href: "/rush-month/events",
          linkLabel: "Open events",
        },
      ];
    case "admin":
      return [
        {
          label: "HQ review",
          summary:
            "Inspect proof and chapter support posture before broader sharing is considered.",
          href: "/rush-month/review",
          linkLabel: "Open review",
        },
        {
          label: "Proof library",
          summary:
            "Check what stories or testimonials are strong enough to help other chapters later.",
          href: "/rush-month/evidence",
          linkLabel: "Open evidence",
        },
        {
          label: "Support signals",
          summary:
            "Use the command-center routes to understand which chapters need help and what remains mock-only.",
          href: "/staff",
          linkLabel: "Open staff view",
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
