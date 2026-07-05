import { describe, expect, it } from "vitest";
import {
  formatCoreProductionLaunchReadiness,
  getCoreProductionLaunchReadiness,
} from "@/services/core-production-launch-readiness";
import type { ProductionCoreRouteSmokeResult } from "@/services/production-core-route-smoke";
import type { ProductionDomainReadinessResult } from "@/services/production-domain-readiness";
import type { ProductionRolloutBootstrapReadiness } from "@/services/production-rollout-bootstrap";
import type { ProductionRolloutHandoff } from "@/services/production-rollout-handoff";

describe("core production launch readiness", () => {
  it("passes only when app routes, domain, packet, and handoff are ready", () => {
    const readiness = getCoreProductionLaunchReadiness({
      appUrl: "https://mymedlife-pwa.vercel.app",
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      domainReadiness: createReadyDomainReadiness(),
      rolloutReadiness: createReadyRolloutReadiness(),
      rolloutHandoff: createReadyRolloutHandoff(),
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.checks).toHaveLength(4);
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
    expect(readiness.nextSteps).toEqual([]);
    expect(formatCoreProductionLaunchReadiness(readiness)).toContain(
      "Core production launch readiness: READY",
    );
  });

  it("fails honestly when the packet has not been provided", () => {
    const readiness = getCoreProductionLaunchReadiness({
      appUrl: "https://mymedlife-pwa.vercel.app",
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      domainReadiness: createReadyDomainReadiness(),
      rolloutReadiness: null,
      rolloutHandoff: null,
    });
    const report = formatCoreProductionLaunchReadiness(readiness);

    expect(readiness.ready).toBe(false);
    expect(readiness.checks).toContainEqual({
      key: "rollout_packet",
      label: "30-chapter rollout packet",
      passed: false,
      detail: "packet was not provided",
    });
    expect(report).toContain(
      "Create the real 30-chapter production rollout packet",
    );
  });

  it("surfaces the public domain as the first launch blocker when DNS is parked", () => {
    const readiness = getCoreProductionLaunchReadiness({
      appUrl: "https://mymedlife-pwa.vercel.app",
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      domainReadiness: {
        ready: false,
        checks: [
          {
            label: "Root domain no longer points to GoDaddy parking",
            passed: false,
            detail: "found GoDaddy parking address 15.197.148.33, 3.33.130.190",
          },
          {
            label: "Public login page returns HTTP 200",
            passed: true,
            detail: "received HTTP 200",
          },
        ],
      },
      rolloutReadiness: createReadyRolloutReadiness(),
      rolloutHandoff: createReadyRolloutHandoff(),
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.checks).toContainEqual({
      key: "production_domain",
      label: "Public production domain",
      passed: false,
      detail:
        "1/2 checks passed; first failure: Root domain no longer points to GoDaddy parking - found GoDaddy parking address 15.197.148.33, 3.33.130.190",
    });
    expect(readiness.nextSteps).toContain(
      "Update GoDaddy DNS, wait for propagation, then rerun `pnpm production:domain https://www.mymedlife.org`.",
    );
  });

  it("keeps rollout packet blockers visible", () => {
    const readiness = getCoreProductionLaunchReadiness({
      appUrl: "https://mymedlife-pwa.vercel.app",
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      domainReadiness: createReadyDomainReadiness(),
      rolloutReadiness: {
        ...createReadyRolloutReadiness(),
        ready: false,
        blockers: [
          "Add at least 30 active chapters before production rollout. Current active chapters: 3.",
          "Chapter 01 MEDLIFE needs one active coach assignment.",
        ],
        nextSteps: [
          "Fix the blockers in the rollout packet.",
          "Re-run the readiness check before creating production users or app data.",
        ],
      },
      rolloutHandoff: {
        ...createReadyRolloutHandoff(),
        ready: false,
        summary: "Fix the readiness blockers before creating production users or app data.",
      },
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.checks.find((check) => check.key === "rollout_packet"))
      .toEqual({
        key: "rollout_packet",
        label: "30-chapter rollout packet",
        passed: false,
        detail:
          "Add at least 30 active chapters before production rollout. Current active chapters: 3.; 1 more blocker(s)",
      });
    expect(readiness.nextSteps).toEqual(
      expect.arrayContaining([
        "Fix the blockers in the rollout packet.",
        "Re-run the readiness check before creating production users or app data.",
      ]),
    );
  });
});

function createReadyRouteSmoke(): ProductionCoreRouteSmokeResult {
  return {
    ready: true,
    checks: [
      {
        label: "Login page returns HTTP 200",
        passed: true,
        detail: "received HTTP 200",
      },
      {
        label: "Student feed redirects unauthenticated users to login",
        passed: true,
        detail: "received HTTP 307",
      },
    ],
  };
}

function createReadyDomainReadiness(): ProductionDomainReadinessResult {
  return {
    ready: true,
    checks: [
      {
        label: "Root domain points to Vercel apex address",
        passed: true,
        detail: "mymedlife.org addresses: 216.150.1.1, 216.150.16.1",
      },
      {
        label: "Public login page serves myMEDLIFE app copy",
        passed: true,
        detail: "expected app copy found",
      },
    ],
  };
}

function createReadyRolloutReadiness(): ProductionRolloutBootstrapReadiness {
  return {
    ready: true,
    counts: {
      activeChapters: 30,
      users: 503,
      approvedMemberships: 500,
      activeStaffRoles: 3,
      activeCoachAssignments: 30,
      activeCampaigns: 30,
      approvedStudentMemberships: 500,
      linkedLumaCalendars: 30,
      readyPilotEventProofChapters: 5,
      activeLaunchOwners: 4,
    },
    blockers: [],
    warnings: [],
    nextSteps: [
      "Create Supabase Auth users through invite or approved admin flow.",
      "Insert matching profiles, chapters, memberships, staff roles, coach assignments, campaigns, and Luma calendar mappings.",
      "Run the 5-chapter Luma event, RSVP, attendance, points, and leaderboard pilot proof before inviting all chapters.",
      "Run signed-in route checks for /app, /leader, /staff, and /admin before inviting all chapters.",
    ],
  };
}

function createReadyRolloutHandoff(): ProductionRolloutHandoff {
  return {
    ready: true,
    title: "Production rollout handoff: READY FOR HUMAN APPLY",
    summary:
      "30 chapters are ready for the first production data apply. This report is a review handoff only.",
    sections: [],
  };
}
