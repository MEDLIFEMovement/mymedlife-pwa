import type {
  ProductionCoreRouteSmokeResult,
} from "@/services/production-core-route-smoke";
import type {
  ProductionRolloutBootstrapPacket,
  ProductionRolloutBootstrapReadiness,
} from "@/services/production-rollout-bootstrap";
import type {
  ProductionRolloutHandoff,
} from "@/services/production-rollout-handoff";
import {
  getProductionSignedInRouteProofReadiness,
} from "@/services/production-signed-in-route-proof";
import { isKnownAppRouteHref } from "@/services/app-route-registry";
import { isEventsPointsLaunchLaneEnabled } from "@/services/launch-lane-product-focus";

export type ProductionInviteGateCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type ProductionInviteGateInput = {
  publicUrl: string;
  routeSmoke: ProductionCoreRouteSmokeResult;
  rolloutPacket?: ProductionRolloutBootstrapPacket | null;
  rolloutReadiness: ProductionRolloutBootstrapReadiness | null;
  rolloutHandoff: ProductionRolloutHandoff | null;
  minimumPilotChapterCount?: number;
};

export type ProductionInviteGateReadiness = {
  ready: boolean;
  publicUrl: string;
  checks: ProductionInviteGateCheck[];
  nextSteps: string[];
};

export function getProductionInviteGateReadiness(
  input: ProductionInviteGateInput,
): ProductionInviteGateReadiness {
  const minimumPilotChapterCount = input.minimumPilotChapterCount ?? 5;
  const checks = [
    createLaunchLaneFocusCheck(),
    createRouteSmokeCheck(input.routeSmoke),
    createRolloutPacketCheck(input.rolloutReadiness),
    createWorkspaceAccessCheck(input.rolloutReadiness),
    createSignedInRouteProofCheck(input.rolloutPacket ?? null),
    createPilotEventLoopCheck(input.rolloutReadiness, minimumPilotChapterCount),
    createLaunchOwnerCheck(input.rolloutReadiness),
    createHandoffCheck(input.rolloutHandoff),
  ];

  return {
    ready: checks.every((check) => check.passed),
    publicUrl: input.publicUrl,
    checks,
    nextSteps: getInviteGateNextSteps({
      checks,
      rolloutReadiness: input.rolloutReadiness,
    }),
  };
}

export function formatProductionInviteGateReadiness(
  readiness: ProductionInviteGateReadiness,
): string {
  const passedCount = readiness.checks.filter((check) => check.passed).length;
  const lines = [
    readiness.ready
      ? "30-chapter invite gate: READY"
      : "30-chapter invite gate: NOT READY",
    `Public URL: ${readiness.publicUrl}`,
    `${passedCount}/${readiness.checks.length} checks passed`,
    "",
    ...readiness.checks.map(
      (check) =>
        `${check.passed ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`,
    ),
    "",
    "Next steps:",
    ...formatList(readiness.nextSteps, "None"),
  ];

  return lines.join("\n");
}

const requiredLaunchLaneRoutes = [
  "/login",
  "/app",
  "/app/events",
  "/app/events/chapter-event-ucla-kickoff",
  "/app/points",
  "/leader?view=overview",
  "/staff?view=chapters",
  "/admin",
  "/admin/users",
  "/admin/chapters",
  "/admin/access",
  "/admin/integrations/luma",
  "/admin/audit-log",
  "/admin/integration-outbox",
  "/admin/pilot-scope",
];

const parkedNonLaunchRoutes = [
  "/campaigns/rush-month",
  "/chapter",
  "/coach",
  "/rush-month",
  "/rush-month/leaderboard",
  "/proof-library",
  "/proof-library/upload",
  "/app/slt-prep",
  "/slt-prep",
  "/admin/phase-2",
  "/admin/design-qa",
  "/admin/sop-library",
];

function createLaunchLaneFocusCheck(): ProductionInviteGateCheck {
  const missingLaunchRoutes = requiredLaunchLaneRoutes.filter(
    (href) => !isKnownAppRouteHref(href),
  );
  const visibleParkedRoutes = parkedNonLaunchRoutes.filter(isKnownAppRouteHref);
  const passed =
    isEventsPointsLaunchLaneEnabled() &&
    missingLaunchRoutes.length === 0 &&
    visibleParkedRoutes.length === 0;

  return {
    key: "launch_lane_focus",
    label: "Events RSVP attendance points launch focus",
    passed,
    detail: passed
      ? `${requiredLaunchLaneRoutes.length} launch routes visible; ${parkedNonLaunchRoutes.length} non-launch route families parked`
      : [
          isEventsPointsLaunchLaneEnabled()
            ? null
            : "events-and-points launch lane is disabled",
          missingLaunchRoutes.length > 0
            ? `missing launch routes: ${missingLaunchRoutes.join(", ")}`
            : null,
          visibleParkedRoutes.length > 0
            ? `non-launch routes still visible: ${visibleParkedRoutes.join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join("; "),
  };
}

function createRouteSmokeCheck(
  routeSmoke: ProductionCoreRouteSmokeResult,
): ProductionInviteGateCheck {
  return {
    key: "public_route_smoke",
    label: "Public login and workspace route smoke",
    passed: routeSmoke.ready,
    detail: summarizeChecks(routeSmoke.checks.length, routeSmoke.checks),
  };
}

function createRolloutPacketCheck(
  rolloutReadiness: ProductionRolloutBootstrapReadiness | null,
): ProductionInviteGateCheck {
  if (!rolloutReadiness) {
    return {
      key: "rollout_packet",
      label: "30-chapter rollout packet",
      passed: false,
      detail: "packet was not provided",
    };
  }

  return {
    key: "rollout_packet",
    label: "30-chapter rollout packet",
    passed: rolloutReadiness.ready,
    detail: rolloutReadiness.ready
      ? `${rolloutReadiness.counts.activeChapters} chapters, ${rolloutReadiness.counts.approvedStudentMemberships} approved student/leader users, ${rolloutReadiness.counts.linkedLumaCalendars} linked Luma calendars`
      : summarizeList(rolloutReadiness.blockers),
  };
}

function createWorkspaceAccessCheck(
  rolloutReadiness: ProductionRolloutBootstrapReadiness | null,
): ProductionInviteGateCheck {
  if (!rolloutReadiness) {
    return {
      key: "workspace_access",
      label: "Workspace access coverage",
      passed: false,
      detail: "packet was not provided",
    };
  }

  const counts = rolloutReadiness.counts;
  const passed =
    counts.activeChapters > 0 &&
    counts.chaptersWithMemberWorkspaceAccess === counts.activeChapters &&
    counts.chaptersWithLeaderWorkspaceAccess === counts.activeChapters &&
    counts.staffWorkspaceUsers > 0 &&
    counts.adminWorkspaceUsers > 0;

  return {
    key: "workspace_access",
    label: "Workspace access coverage",
    passed,
    detail: [
      `${counts.chaptersWithMemberWorkspaceAccess}/${counts.activeChapters} chapters have member workspace access`,
      `${counts.chaptersWithLeaderWorkspaceAccess}/${counts.activeChapters} chapters have leader workspace access`,
      `${counts.staffWorkspaceUsers} staff workspace user(s)`,
      `${counts.adminWorkspaceUsers} admin workspace user(s)`,
    ].join("; "),
  };
}

function createPilotEventLoopCheck(
  rolloutReadiness: ProductionRolloutBootstrapReadiness | null,
  minimumPilotChapterCount: number,
): ProductionInviteGateCheck {
  if (!rolloutReadiness) {
    return {
      key: "pilot_event_loop",
      label: "5-chapter Luma RSVP attendance points proof",
      passed: false,
      detail: "packet was not provided",
    };
  }

  const pilotBlockers = rolloutReadiness.blockers.filter(isPilotEventLoopBlocker);
  const readyPilotChapters = rolloutReadiness.counts.readyPilotEventProofChapters;
  const passed =
    readyPilotChapters >= minimumPilotChapterCount && pilotBlockers.length === 0;

  return {
    key: "pilot_event_loop",
    label: "5-chapter Luma RSVP attendance points proof",
    passed,
    detail: passed
      ? `${readyPilotChapters} pilot chapters prove RSVP, attendance, points, audit, and zero external sends`
      : `${readyPilotChapters}/${minimumPilotChapterCount} ready pilot chapters; ${summarizeList(pilotBlockers)}`,
  };
}

function createSignedInRouteProofCheck(
  rolloutPacket: ProductionRolloutBootstrapPacket | null,
): ProductionInviteGateCheck {
  const readiness = getProductionSignedInRouteProofReadiness(rolloutPacket);

  return {
    key: "signed_in_route_proof",
    label: "Signed-in member leader staff and admin route proof",
    passed: readiness.ready,
    detail: readiness.ready
      ? `${readiness.counts.passedProofRows} signed-in route proof row(s) passed`
      : summarizeList(readiness.blockers),
  };
}

function createLaunchOwnerCheck(
  rolloutReadiness: ProductionRolloutBootstrapReadiness | null,
): ProductionInviteGateCheck {
  if (!rolloutReadiness) {
    return {
      key: "launch_owners",
      label: "Support rollback and production apply owners",
      passed: false,
      detail: "packet was not provided",
    };
  }

  const ownerBlockers = rolloutReadiness.blockers.filter(isLaunchOwnerBlocker);
  const passed = rolloutReadiness.counts.activeLaunchOwners >= 3 && ownerBlockers.length === 0;

  return {
    key: "launch_owners",
    label: "Support rollback and production apply owners",
    passed,
    detail: passed
      ? `${rolloutReadiness.counts.activeLaunchOwners} active launch owner row(s) include support, rollback, and production apply`
      : summarizeList(ownerBlockers),
  };
}

function createHandoffCheck(
  rolloutHandoff: ProductionRolloutHandoff | null,
): ProductionInviteGateCheck {
  if (!rolloutHandoff) {
    return {
      key: "handoff",
      label: "Review-only human handoff",
      passed: false,
      detail: "handoff was not created because no packet was provided",
    };
  }

  return {
    key: "handoff",
    label: "Review-only human handoff",
    passed: rolloutHandoff.ready,
    detail: rolloutHandoff.ready
      ? "handoff is ready for human apply review"
      : rolloutHandoff.summary,
  };
}

function getInviteGateNextSteps(input: {
  checks: ProductionInviteGateCheck[];
  rolloutReadiness: ProductionRolloutBootstrapReadiness | null;
}) {
  const nextSteps: string[] = [];

  for (const check of input.checks) {
    if (!check.passed) {
      nextSteps.push(getNextStepForCheck(check.key));
    }
  }

  if (input.rolloutReadiness && !input.rolloutReadiness.ready) {
    nextSteps.push(...input.rolloutReadiness.nextSteps);
  }

  return Array.from(new Set(nextSteps));
}

function getNextStepForCheck(key: string) {
  switch (key) {
    case "launch_lane_focus":
      return "Keep the visible app contract focused on login, member app, leader command center, staff command center, Luma events, RSVP, attendance, points, leaderboards, audit, and outbox.";
    case "public_route_smoke":
      return "Fix public production route smoke failures before inviting chapters.";
    case "rollout_packet":
      return "Fill and validate the real 30-chapter/500-student rollout packet.";
    case "workspace_access":
      return "Add member, leader, staff, and admin access coverage to the rollout packet.";
    case "signed_in_route_proof":
      return "Complete signed-in route proof for one member, leader, staff user, and admin after production data is applied.";
    case "pilot_event_loop":
      return "Complete the five-chapter Luma RSVP, attendance, points, audit, and outbox proof.";
    case "launch_owners":
      return "Name active support, rollback, and production apply owners in launch-owners.csv.";
    case "handoff":
      return "Create and review the production rollout handoff before applying production data.";
    default:
      return "Fix the failed invite-gate check.";
  }
}

function isPilotEventLoopBlocker(blocker: string) {
  return (
    blocker.includes("event-loop proof") ||
    blocker.includes("pilot event") ||
    blocker.includes("RSVP") ||
    blocker.includes("attendance check-in") ||
    blocker.includes("points award") ||
    blocker.includes("audit evidence") ||
    blocker.includes("zero external sends")
  );
}

function isLaunchOwnerBlocker(blocker: string) {
  return (
    blocker.includes("support owner") ||
    blocker.includes("rollback owner") ||
    blocker.includes("production apply owner")
  );
}

function summarizeChecks(
  totalCount: number,
  checks: Array<{ passed: boolean; label: string; detail: string }>,
) {
  const passedCount = checks.filter((check) => check.passed).length;
  const failedChecks = checks.filter((check) => !check.passed);

  if (failedChecks.length === 0) {
    return `${passedCount}/${totalCount} checks passed`;
  }

  return `${passedCount}/${totalCount} checks passed; first failure: ${failedChecks[0].label} - ${failedChecks[0].detail}`;
}

function summarizeList(items: string[]) {
  if (items.length === 0) {
    return "not ready";
  }

  const [first, ...rest] = items;
  const suffix = rest.length > 0 ? `; ${rest.length} more blocker(s)` : "";

  return `${first}${suffix}`;
}

function formatList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}
