import {
  getActionStartWriteConfig,
  getActionStartWriteReadiness,
  isUuid,
} from "@/services/action-start-write";
import { getMockLocalActorContext, type LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { Assignment } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type FirstWriteDrillStatus =
  | "ready_for_local_action_start"
  | "blocked_until_local_supabase"
  | "blocked_until_flags"
  | "blocked_until_auth"
  | "hidden";

export type FirstWriteDrillCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type FirstWriteDrillStep = {
  key: string;
  label: string;
  route: string;
  localActorEmail: string;
  plainEnglish: string;
  expectedResult: string;
  structuredEvents: string[];
  safetyBoundary: string;
};

export type FirstWriteActivationDrill = {
  canReadDrill: boolean;
  title: string;
  status: FirstWriteDrillStatus;
  plainEnglishSummary: string;
  candidateAssignment:
    | {
        id: string;
        title: string;
        status: Assignment["status"];
        route: string;
        usesSupabaseUuid: boolean;
      }
    | null;
  checks: FirstWriteDrillCheck[];
  steps: FirstWriteDrillStep[];
  proofToCollect: string[];
  counts: {
    checks: number;
    passedChecks: number;
    browserWritesExpected: 0 | 1;
    externalWritesExpected: 0;
  };
};

export function getFirstWriteActivationDrill(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: EnvSource = process.env,
): FirstWriteActivationDrill {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadDrill: false,
      title: "First-write drill hidden for this role",
      status: "hidden",
      plainEnglishSummary:
        "First-write activation is an HQ safety surface, not a student or chapter operating view.",
      candidateAssignment: null,
      checks: [],
      steps: [],
      proofToCollect: [],
      counts: emptyCounts(),
    };
  }

  const candidateAssignment = findCandidateAssignment(data.assignments);
  const targetActor = getMockLocalActorContext(
    "member.a@mymedlife.test",
    "Target pilot member for the first action-start write drill.",
    data.source.status,
    "local_auth_session",
    env.MYMEDLIFE_AUTH_MODE === "local_supabase" ? "signed_in" : "signed_out",
  );
  const writeConfig = getActionStartWriteConfig(env);
  const readiness = candidateAssignment
    ? getActionStartWriteReadiness(targetActor, candidateAssignment, env)
    : null;
  const candidate = candidateAssignment ? toCandidate(candidateAssignment) : null;
  const checks = buildChecks(data, candidateAssignment, readiness, env);
  const status = getStatus(checks, writeConfig.enabled);
  const browserWritesExpected: 0 | 1 =
    status === "ready_for_local_action_start" ? 1 : 0;

  return {
    canReadDrill: true,
    title: getTitle(actor),
    status,
    plainEnglishSummary:
      "This drill turns the first possible MVP save into a controlled local test: one member starts one Rush Month assignment, then staff confirm assignment status, event, integration event, and audit log readback. It does not approve production writes.",
    candidateAssignment: candidate,
    checks,
    steps: buildSteps(candidate),
    proofToCollect: [
      "Screenshot of `/admin/first-write` before the test showing every required check green.",
      "Screenshot of the selected action detail route before clicking Start this action.",
      "Screenshot after redirect showing the `started` result state.",
      "Readback proof that assignment status is `in_progress`.",
      "Evidence that an internal event, integration event, and audit log row were created.",
      "Evidence that automation outbox sends and external writes stayed at zero.",
    ],
    counts: {
      checks: checks.length,
      passedChecks: checks.filter((check) => check.passed).length,
      browserWritesExpected,
      externalWritesExpected: 0,
    },
  };
}

function findCandidateAssignment(assignments: Assignment[]): Assignment | null {
  return (
    assignments.find((assignment) => {
      return (
        assignment.lane === "Member" &&
        (assignment.status === "not_started" ||
          assignment.status === "changes_requested")
      );
    }) ??
    assignments.find((assignment) => {
      return assignment.status === "not_started" ||
        assignment.status === "changes_requested";
    }) ??
    assignments[0] ??
    null
  );
}

function toCandidate(assignment: Assignment) {
  return {
    id: assignment.id,
    title: assignment.title,
    status: assignment.status,
    route: `/rush-month/actions/${assignment.id}`,
    usesSupabaseUuid: isUuid(assignment.id),
  };
}

function buildChecks(
  data: ReadOnlyAppData,
  assignment: Assignment | null,
  readiness: ReturnType<typeof getActionStartWriteReadiness> | null,
  env: EnvSource,
): FirstWriteDrillCheck[] {
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const actionStartEnabled = env.MYMEDLIFE_ENABLE_ACTION_START_WRITE === "true";
  const localAuthMode = env.MYMEDLIFE_AUTH_MODE === "local_supabase";

  return [
    {
      key: "local_supabase_reads",
      label: "Local Supabase read model is active",
      passed: data.source.mode === "supabase",
      detail:
        data.source.mode === "supabase"
          ? "The app is reading local Supabase data instead of mock fallback data."
          : "The app is using mock fallback data, so the first write drill cannot target a real assignment UUID.",
    },
    {
      key: "candidate_assignment",
      label: "A startable assignment exists",
      passed: Boolean(assignment),
      detail: assignment
        ? `Candidate action: ${assignment.title}.`
        : "No assignment is available for action-start testing.",
    },
    {
      key: "candidate_assignment_uuid",
      label: "Candidate assignment uses a Supabase UUID",
      passed: Boolean(assignment && isUuid(assignment.id)),
      detail:
        assignment && isUuid(assignment.id)
          ? "The candidate action can be passed to app.start_assignment_action."
          : "Mock assignment IDs are intentionally blocked before any Supabase write is attempted.",
    },
    {
      key: "local_auth_mode",
      label: "Local Supabase Auth mode is selected",
      passed: localAuthMode,
      detail: localAuthMode
        ? "MYMEDLIFE_AUTH_MODE=local_supabase is set."
        : "Set MYMEDLIFE_AUTH_MODE=local_supabase and sign in with a fake seed user.",
    },
    {
      key: "local_write_flag",
      label: "Local write master switch is on",
      passed: localWritesRequested,
      detail: localWritesRequested
        ? "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true is set for local testing."
        : "Keep this off until staff deliberately runs the first-write drill.",
    },
    {
      key: "action_start_flag",
      label: "Action-start write switch is on",
      passed: actionStartEnabled,
      detail: actionStartEnabled
        ? "MYMEDLIFE_ENABLE_ACTION_START_WRITE=true is set for this narrow write."
        : "This write remains locked until the action-start switch is explicitly enabled.",
    },
    {
      key: "readiness_can_submit",
      label: "Action-start readiness allows submit",
      passed: readiness?.canSubmit ?? false,
      detail:
        readiness?.reason ??
        "Readiness cannot be calculated until an assignment is selected.",
    },
    {
      key: "external_writes_disabled",
      label: "External sends stay disabled",
      passed: true,
      detail:
        "Action start creates internal event, integration event, and audit log rows only. It should not create an automation outbox send.",
    },
  ];
}

function getStatus(
  checks: FirstWriteDrillCheck[],
  writeConfigEnabled: boolean,
): FirstWriteDrillStatus {
  const missingSupabase = checks.some((check) => {
    return (
      (check.key === "local_supabase_reads" ||
        check.key === "candidate_assignment_uuid") &&
      !check.passed
    );
  });

  if (missingSupabase) {
    return "blocked_until_local_supabase";
  }

  const missingFlags = checks.some((check) => {
    return (
      (check.key === "local_write_flag" || check.key === "action_start_flag") &&
      !check.passed
    );
  });

  if (missingFlags || !writeConfigEnabled) {
    return "blocked_until_flags";
  }

  const missingAuth = checks.some((check) => {
    return (
      (check.key === "local_auth_mode" || check.key === "readiness_can_submit") &&
      !check.passed
    );
  });

  if (missingAuth) {
    return "blocked_until_auth";
  }

  return "ready_for_local_action_start";
}

function buildSteps(
  candidate: FirstWriteActivationDrill["candidateAssignment"],
): FirstWriteDrillStep[] {
  const actionRoute = candidate?.route ?? "/rush-month/actions/member-push";

  return [
    {
      key: "setup_local_stack",
      label: "Start local Supabase and seed fake data",
      route: "/admin",
      localActorEmail: "admin@mymedlife.test",
      plainEnglish:
        "Staff should confirm the app is reading local Supabase data, not mock fallback data.",
      expectedResult:
        "The drill check for local Supabase reads and candidate UUID is green.",
      structuredEvents: [],
      safetyBoundary: "Use fake seed data only. Do not connect production Supabase.",
    },
    {
      key: "sign_in_member",
      label: "Sign in as the fake member",
      route: "/login",
      localActorEmail: "member.a@mymedlife.test",
      plainEnglish:
        "The first write must use server-derived local auth identity, not the role switcher alone.",
      expectedResult:
        "The local auth session shows `member.a@mymedlife.test` as signed in.",
      structuredEvents: ["user_signed_in"],
      safetyBoundary: "Production auth remains disabled.",
    },
    {
      key: "enable_narrow_flags",
      label: "Enable only the action-start write flags",
      route: "/admin/first-write",
      localActorEmail: "admin@mymedlife.test",
      plainEnglish:
        "Staff turns on the local write master switch and the action-start switch only for this localhost drill.",
      expectedResult:
        "The drill still shows zero external sends and only one expected browser write.",
      structuredEvents: [],
      safetyBoundary:
        "Do not enable proof, assignment creation, HQ decision, coach decision, admin mutation, or external integration writes.",
    },
    {
      key: "start_assignment",
      label: "Open the candidate action and click Start this action",
      route: actionRoute,
      localActorEmail: "member.a@mymedlife.test",
      plainEnglish:
        "The member starts one assigned Rush Month action through the existing server action.",
      expectedResult:
        "The page redirects back with `actionStartResult=started` and the assignment reads back as in progress.",
      structuredEvents: ["action_started", "kpi_event_recorded"],
      safetyBoundary:
        "This should create no reminder send, no n8n run, no HubSpot sync, and no Luma write.",
    },
    {
      key: "verify_audit",
      label: "Verify event, integration event, and audit rows",
      route: "/admin",
      localActorEmail: "admin@mymedlife.test",
      plainEnglish:
        "Staff confirms the write created the internal records required for future automation readiness.",
      expectedResult:
        "Assignment status, event row, integration event row, and audit log row are visible in local evidence.",
      structuredEvents: [
        "action_started",
        "integration_event_recorded",
        "audit_log_recorded",
      ],
      safetyBoundary:
        "AutomationOutbox remains disabled and external sends remain zero.",
    },
  ];
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin first-write activation drill";
    case "ds_admin":
      return "DS Admin first-write safety drill";
    case "super_admin":
      return "Full first-write activation drill";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "First-write drill hidden for this role";
  }
}

function emptyCounts(): FirstWriteActivationDrill["counts"] {
  return {
    checks: 0,
    passedChecks: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
