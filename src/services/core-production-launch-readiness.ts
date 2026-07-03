import type {
  ProductionCoreRouteSmokeResult,
} from "@/services/production-core-route-smoke";
import type {
  ProductionDomainReadinessResult,
} from "@/services/production-domain-readiness";
import type {
  ProductionRolloutBootstrapReadiness,
} from "@/services/production-rollout-bootstrap";
import type {
  ProductionRolloutHandoff,
} from "@/services/production-rollout-handoff";

export type CoreProductionLaunchCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type CoreProductionLaunchReadinessInput = {
  appUrl: string;
  publicUrl: string;
  routeSmoke: ProductionCoreRouteSmokeResult;
  domainReadiness: ProductionDomainReadinessResult;
  rolloutReadiness: ProductionRolloutBootstrapReadiness | null;
  rolloutHandoff: ProductionRolloutHandoff | null;
};

export type CoreProductionLaunchReadiness = {
  ready: boolean;
  appUrl: string;
  publicUrl: string;
  checks: CoreProductionLaunchCheck[];
  nextSteps: string[];
};

export function getCoreProductionLaunchReadiness(
  input: CoreProductionLaunchReadinessInput,
): CoreProductionLaunchReadiness {
  const checks = [
    createRouteSmokeCheck(input.routeSmoke),
    createDomainCheck(input.domainReadiness),
    createRolloutPacketCheck(input.rolloutReadiness),
    createRolloutHandoffCheck(input.rolloutHandoff),
  ];

  return {
    ready: checks.every((check) => check.passed),
    appUrl: input.appUrl,
    publicUrl: input.publicUrl,
    checks,
    nextSteps: getNextSteps({
      domainReadiness: input.domainReadiness,
      rolloutReadiness: input.rolloutReadiness,
      rolloutHandoff: input.rolloutHandoff,
      routeSmoke: input.routeSmoke,
    }),
  };
}

export function formatCoreProductionLaunchReadiness(
  readiness: CoreProductionLaunchReadiness,
): string {
  const passedCount = readiness.checks.filter((check) => check.passed).length;
  const lines = [
    readiness.ready
      ? "Core production launch readiness: READY"
      : "Core production launch readiness: NOT READY",
    `App URL: ${readiness.appUrl}`,
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

function createRouteSmokeCheck(
  routeSmoke: ProductionCoreRouteSmokeResult,
): CoreProductionLaunchCheck {
  return {
    key: "route_smoke",
    label: "Core role routes",
    passed: routeSmoke.ready,
    detail: summarizeChecks(routeSmoke.checks.length, routeSmoke.checks),
  };
}

function createDomainCheck(
  domainReadiness: ProductionDomainReadinessResult,
): CoreProductionLaunchCheck {
  return {
    key: "production_domain",
    label: "Public production domain",
    passed: domainReadiness.ready,
    detail: summarizeChecks(domainReadiness.checks.length, domainReadiness.checks),
  };
}

function createRolloutPacketCheck(
  rolloutReadiness: ProductionRolloutBootstrapReadiness | null,
): CoreProductionLaunchCheck {
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
      ? `${rolloutReadiness.counts.activeChapters} active chapters, ${rolloutReadiness.counts.users} users, ${rolloutReadiness.counts.approvedMemberships} approved memberships`
      : summarizeList(rolloutReadiness.blockers),
  };
}

function createRolloutHandoffCheck(
  rolloutHandoff: ProductionRolloutHandoff | null,
): CoreProductionLaunchCheck {
  if (!rolloutHandoff) {
    return {
      key: "rollout_handoff",
      label: "Human apply handoff",
      passed: false,
      detail: "handoff was not created because no packet was provided",
    };
  }

  return {
    key: "rollout_handoff",
    label: "Human apply handoff",
    passed: rolloutHandoff.ready,
    detail: rolloutHandoff.ready
      ? "review-only handoff is ready for human apply"
      : rolloutHandoff.summary,
  };
}

function getNextSteps(input: {
  routeSmoke: ProductionCoreRouteSmokeResult;
  domainReadiness: ProductionDomainReadinessResult;
  rolloutReadiness: ProductionRolloutBootstrapReadiness | null;
  rolloutHandoff: ProductionRolloutHandoff | null;
}) {
  const nextSteps: string[] = [];

  if (!input.routeSmoke.ready) {
    nextSteps.push("Fix the production app route smoke failures on the Vercel app URL.");
  }

  if (!input.domainReadiness.ready) {
    nextSteps.push(
      "Update GoDaddy DNS, wait for propagation, then rerun `pnpm production:domain https://www.mymedlife.org`.",
    );
  }

  if (!input.rolloutReadiness) {
    nextSteps.push(
      "Create the real 30-chapter production rollout packet and pass it to this command with `--packet`.",
    );
  } else if (!input.rolloutReadiness.ready) {
    nextSteps.push(...input.rolloutReadiness.nextSteps);
  }

  if (input.rolloutReadiness?.ready && !input.rolloutHandoff?.ready) {
    nextSteps.push("Create and review the rollout handoff before applying production data.");
  }

  return nextSteps;
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
