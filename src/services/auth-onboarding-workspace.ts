import {
  authOnboardingSteps,
  canActorOwnOnboardingStep,
  getAuthOnboardingPlan,
  type OnboardingActor,
  type OnboardingStep,
} from "@/services/auth-onboarding-plan";
import {
  localActorOptions,
  type LocalActorContext,
} from "@/services/local-actor-context";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import type { IntegrationEvent } from "@/shared/types/domain";

export type AuthOnboardingStepRow = {
  key: string;
  label: string;
  ownerLabel: string;
  actorCanOwn: boolean;
  browserEnabled: false;
  createsEvent: true;
  notes: string;
  futureEventType: string;
};

export type AuthOnboardingPreflightStatus = "ready" | "watch" | "blocked";

export type AuthOnboardingPreflightItem = {
  key: string;
  label: string;
  ownerLane: string;
  status: AuthOnboardingPreflightStatus;
  question: string;
  requiredEvidence: string;
  currentPosture: string;
  routeEvidence: string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type AuthOnboardingLaunchPreflight = {
  title: string;
  summary: string;
  items: AuthOnboardingPreflightItem[];
  blockedControls: string[];
  counts: {
    total: number;
    ready: number;
    watch: number;
    blocked: number;
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
    productionUsersEnabled: 0;
  };
};

export type AuthOnboardingWorkspace = {
  title: string;
  summary: string;
  actorLabel: string;
  nextStep: {
    label: string;
    href: string;
    detail: string;
  };
  stepRows: AuthOnboardingStepRow[];
  launchPreflight: AuthOnboardingLaunchPreflight | null;
  futureStructuredEvents: IntegrationEvent[];
  blockedWrites: string[];
  safetyNotes: string[];
  counts: {
    steps: number;
    actorOwnedSteps: number;
    browserEnabledSteps: 0;
    liveAuthEnabled: 0;
    productionUsersEnabled: 0;
    externalWritesExpected: 0;
  };
};

export function getAuthOnboardingWorkspace(
  actor: LocalActorContext,
): AuthOnboardingWorkspace {
  const surfaceFamily = getActorSurfaceFamily(actor);
  const plan = getAuthOnboardingPlan();
  const onboardingActor = getOnboardingActor(actor);
  const stepRows = authOnboardingSteps.map((step) =>
    toStepRow(step, onboardingActor),
  );
  const launchPreflight = canReadLaunchPreflight(surfaceFamily)
    ? buildLaunchPreflight()
    : null;

  return {
    title: getTitle(surfaceFamily),
    summary:
      "This route makes the future sign-in, profile, join-request, membership approval, role assignment, coach assignment, and staff-role assignment path reviewable before any production auth or onboarding writes are enabled.",
    actorLabel: getOwnerLabel(onboardingActor),
    nextStep: getNextStep(actor),
    stepRows,
    launchPreflight,
    futureStructuredEvents: buildFutureEvents(authOnboardingSteps),
    blockedWrites: [
      "production Supabase Auth sessions",
      "production user creation",
      "profile saves",
      "chapter join requests",
      "membership approvals",
      "chapter role assignments",
      "coach assignments",
      "staff role assignments",
      "external automation sends",
    ],
    safetyNotes: [
      plan.approvalRequired,
      "Every onboarding step stays Supabase-owned and browser-disabled here.",
      "DS Admin can inspect safety posture but cannot own app-truth onboarding decisions.",
      "No HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI write runs from this route.",
    ],
    counts: {
      steps: stepRows.length,
      actorOwnedSteps: stepRows.filter((step) => step.actorCanOwn).length,
      browserEnabledSteps: 0,
      liveAuthEnabled: 0,
      productionUsersEnabled: 0,
      externalWritesExpected: 0,
    },
  };
}

function toStepRow(
  step: OnboardingStep,
  actor: OnboardingActor,
): AuthOnboardingStepRow {
  return {
    key: step.key,
    label: step.label,
    ownerLabel: getOwnerLabel(step.owner),
    actorCanOwn: canActorOwnOnboardingStep(actor, step.key),
    browserEnabled: step.browserEnabled,
    createsEvent: step.createsEvent,
    notes: step.notes,
    futureEventType: step.key,
  };
}

function buildFutureEvents(steps: readonly OnboardingStep[]): IntegrationEvent[] {
  return steps.map((step) => ({
    id: `future-${step.key}`,
    eventType: step.key,
    title: `Future ${step.label.toLowerCase()}`,
    destination: "internal",
    status: "disabled",
    detail: `${step.notes} No production auth, profile, membership, role, or staff assignment write runs now.`,
    occurredAt: "local-mock-time",
  }));
}

function canReadLaunchPreflight(surfaceFamily: ActorSurfaceFamily): boolean {
  return (
    surfaceFamily === "staff" ||
    surfaceFamily === "ds_admin" ||
    surfaceFamily === "super_admin"
  );
}

function buildLaunchPreflight(): AuthOnboardingLaunchPreflight {
  const roleCoverage = getRequiredRoleCoverage();
  const items: AuthOnboardingPreflightItem[] = [
    {
      key: "callback_url_plan",
      label: "Approve auth callback URLs",
      ownerLane: "Security and Student Access",
      status: "blocked",
      question: "Can a real user sign in and return to the correct myMEDLIFE route?",
      requiredEvidence:
        "Production and staging callback URLs, invite redirect URLs, and restricted-state fallback routes must be approved before live auth.",
      currentPosture:
        "Local preview still uses fake actor email selection; production callbacks are not enabled.",
      routeEvidence: ["/login", "/onboarding", "/admin/launch-gate"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "role_coverage_matrix",
      label: "Confirm every launch role",
      ownerLane: "Product and Permissions",
      status: roleCoverage.missingRoles.length === 0 ? "ready" : "watch",
      question: "Can reviewers preview every role required for the Rush Month MVP?",
      requiredEvidence:
        "General Member, Action Committee Member, Action Committee Chair, E-Board, President / VP, Coach, Admin, and Super Admin need explicit review actors.",
      currentPosture:
        roleCoverage.missingRoles.length === 0
          ? `${roleCoverage.coveredRoles.length} of ${requiredLaunchRoles.length} required roles have local reviewer actors.`
          : `Missing local reviewer actors for: ${roleCoverage.missingRoles.join(", ")}.`,
      routeEvidence: ["/login", "/profile", "/admin/review-path"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "auth_profile_mapping",
      label: "Map auth user to profile",
      ownerLane: "Engineering and Data",
      status: "watch",
      question: "Does a signed-in auth identity map to one app profile and one chapter/staff scope?",
      requiredEvidence:
        "Supabase Auth user id, profile row, membership row, and staff/coach assignment reads must agree before real users are invited.",
      currentPosture:
        "Local auth-derived actor context exists, but production Auth/profile mapping still needs staging proof.",
      routeEvidence: ["/profile", "/onboarding", "/admin/system-health"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "join_membership_approval",
      label: "Keep join approval explicit",
      ownerLane: "Chapter Operations",
      status: "watch",
      question: "Can a student request a chapter and wait for President / VP approval?",
      requiredEvidence:
        "Join requests, membership approval rules, wrong-chapter handling, and manual support fallback must be approved.",
      currentPosture:
        "The onboarding sequence names join and approval steps, but browser join/approval writes remain disabled.",
      routeEvidence: ["/onboarding", "/chapter/members"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "chapter_role_assignment",
      label: "Separate chapter role assignment",
      ownerLane: "Chapter Operations",
      status: "watch",
      question:
        "Are member, action committee, E-Board, and President / VP roles assigned by the right owner?",
      requiredEvidence:
        "President / VP-owned chapter role approvals, DS Admin restrictions, audit payloads, and rollback steps must be documented.",
      currentPosture:
        "Role ownership is visible in local review, but production role writes remain disabled.",
      routeEvidence: ["/chapter/members", "/admin/review-path"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "coach_assignment",
      label: "Confirm coach portfolio assignment",
      ownerLane: "Coach Lead",
      status: "watch",
      question: "Can a coach see only assigned chapters and the right support surfaces?",
      requiredEvidence:
        "Coach assignment rules, portfolio read scope, reassignment owner, and support escalation path must be approved.",
      currentPosture:
        "Coach portfolio preview exists locally; production coach assignment writes and reassignment controls remain disabled.",
      routeEvidence: ["/coach", "/profile", "/admin/operations"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "staff_role_assignment",
      label: "Lock staff role assignment",
      ownerLane: "HQ Operations",
      status: "watch",
      question: "Are Admin, DS Admin, and Super Admin roles separated before launch?",
      requiredEvidence:
        "Staff role assignment rules, DS Admin read boundaries, Super Admin escalation, and service-key handling must be approved.",
      currentPosture:
        "Staff preview roles are separated locally; production staff-role writes remain disabled.",
      routeEvidence: ["/admin", "/admin/database-security", "/admin/master-data"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "event_audit_outbox_boundary",
      label: "Preserve event and audit boundary",
      ownerLane: "Data and Security",
      status: "ready",
      question: "Will onboarding changes create structured app events without triggering external writes?",
      requiredEvidence:
        "Future onboarding events must stay app-owned, audit-ready, and external-write disabled until each integration is approved.",
      currentPosture:
        "Future onboarding events are internal and disabled; browser writes, production users, and external sends remain at 0.",
      routeEvidence: ["/onboarding", "/admin/audit-log", "/admin/integration-outbox"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "support_rollback",
      label: "Name support and rollback owner",
      ownerLane: "Launch and HQ Operations",
      status: "watch",
      question: "If a real user lands in the wrong role, who fixes it and how?",
      requiredEvidence:
        "Pilot support owner, wrong-role correction path, rollback process, and student communication fallback must be named.",
      currentPosture:
        "Operations and pilot-scope surfaces describe support needs, but owner sign-off is still missing before pilot.",
      routeEvidence: ["/admin/pilot-scope", "/admin/operations", "/admin/launch-gate"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  ];

  return {
    title: "Production auth preflight checklist",
    summary:
      "Use this before inviting real users to confirm callbacks, role coverage, profile mapping, join approval, role assignment, coach scope, staff scope, audit/outbox posture, and rollback ownership.",
    items,
    blockedControls: [
      "create production users",
      "approve join requests",
      "assign chapter roles",
      "assign coach portfolios",
      "assign staff roles",
      "send onboarding automations",
      "enable external writes",
    ],
    counts: {
      total: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      watch: items.filter((item) => item.status === "watch").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      productionUsersEnabled: 0,
    },
  };
}

const requiredLaunchRoles = [
  "General Member",
  "Action Committee Member",
  "Action Committee Chair",
  "E-Board Member",
  "President / VP",
  "Coach",
  "Admin",
  "Super Admin",
] as const;

function getRequiredRoleCoverage() {
  const coveredRoles = requiredLaunchRoles.filter((role) => {
    return localActorOptions.some((option) => {
      return option.chapterRoles.includes(role) || option.staffRoles.includes(role);
    });
  });

  return {
    coveredRoles,
    missingRoles: requiredLaunchRoles.filter((role) => !coveredRoles.includes(role)),
  };
}

function getOnboardingActor(actor: LocalActorContext): OnboardingActor {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member") {
    return "student";
  }

  if (
    actor.chapterRoles.includes("President / VP") ||
    actor.chapterRoles.includes("Chapter President / Vice President")
  ) {
    return "chapter_president_vp";
  }

  switch (surfaceFamily) {
    case "leader":
      return "student";
    case "coach":
      return "coach";
    case "staff":
      return "admin";
    case "ds_admin":
      return "ds_admin";
    case "super_admin":
      return "super_admin";
  }
}

function getNextStep(actor: LocalActorContext): AuthOnboardingWorkspace["nextStep"] {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return {
        label: "Open local sign-in",
        href: "/login",
        detail:
          "Preview the fake local sign-in path, then return to Profile to verify role scope.",
      };
    case "leader":
      return {
        label: "Review member roles",
        href: "/chapter/members",
        detail:
          "Use the roster to review join-request and role-coverage posture before approving any real membership flow.",
      };
    case "coach":
      return {
        label: "Open coach readout",
        href: "/coach",
        detail:
          "Confirm coach portfolio scope and support boundaries before real coach assignments exist.",
      };
    case "staff":
    case "ds_admin":
    case "super_admin":
      return {
        label: "Open admin readiness",
        href: "/admin",
        detail:
          "Use admin readiness surfaces to decide whether production auth and onboarding can be approved later.",
      };
  }
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "member":
      return "Your future onboarding path";
    case "leader":
      return "Chapter onboarding approval path";
    case "coach":
      return "Coach onboarding and portfolio path";
    case "staff":
      return "Admin auth and onboarding readiness";
    case "ds_admin":
      return "DS Admin onboarding safety review";
    case "super_admin":
      return "Full auth and onboarding readiness";
  }
}

function getOwnerLabel(actor: OnboardingActor): string {
  switch (actor) {
    case "student":
      return "Student";
    case "chapter_president_vp":
      return "President / VP";
    case "coach":
      return "Coach";
    case "admin":
      return "Admin";
    case "ds_admin":
      return "DS Admin";
    case "super_admin":
      return "Super Admin";
  }
}
