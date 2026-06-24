import type { LocalActorContext } from "@/services/local-actor-context";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";

export type EnvironmentSafetyInput = {
  MYMEDLIFE_DATA_SOURCE?: string;
  MYMEDLIFE_AUTH_MODE?: string;
  MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH?: string;
  MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS?: string;
  MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES?: string;
  MYMEDLIFE_ENABLE_ACTION_START_WRITE?: string;
  MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE?: string;
  MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE?: string;
  MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE?: string;
  MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE?: string;
  MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE?: string;
  MYMEDLIFE_ENABLE_COACH_DECISION_WRITE?: string;
  MYMEDLIFE_ALLOW_PROOF_UPLOADS?: string;
  MYMEDLIFE_LOCAL_ACTOR_EMAIL?: string;
};

export type EnvironmentSafetyItem = {
  label: string;
  value: string;
  status: "safe" | "watch" | "blocked";
  explanation: string;
};

export type EnvironmentSafetySummary = {
  canReadSummary: boolean;
  title: string;
  summary: string;
  items: EnvironmentSafetyItem[];
  counts: {
    safe: number;
    watch: number;
    blocked: number;
    secretsShown: 0;
    browserWritesEnabled: number;
    externalWritesEnabled: 0;
  };
};

export function getEnvironmentSafetySummary(
  actor: LocalActorContext,
  env: EnvironmentSafetyInput = readEnvironmentSafetyInput(),
): EnvironmentSafetySummary {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadSummary: false,
      title: "Environment safety hidden for this role",
      summary: "Environment safety is an admin review aid.",
      items: [],
      counts: emptyCounts(),
    };
  }

  const authConfig = getSupabaseAuthConfig(env);
  const items: EnvironmentSafetyItem[] = [
    {
      label: "Data source",
      value: env.MYMEDLIFE_DATA_SOURCE || "mock",
      status:
        env.MYMEDLIFE_DATA_SOURCE === "supabase" ? "watch" : "safe",
      explanation:
        env.MYMEDLIFE_DATA_SOURCE === "supabase"
          ? "Local Supabase reads may be active, but production Supabase remains out of scope."
          : "Mock data is the safest review mode.",
    },
    {
      label: "Supabase review auth",
      value: env.MYMEDLIFE_AUTH_MODE || "disabled",
      status: authConfig.enabled ? "watch" : isAuthModeRequested(env) ? "blocked" : "safe",
      explanation: authConfig.reason,
    },
    {
      label: "Local Supabase reads",
      value: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS || "false",
      status:
        env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS === "true" ? "watch" : "safe",
      explanation:
        "Reads can be enabled for local fake data only. This does not allow browser writes.",
    },
    {
      label: "Local Supabase writes",
      value: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES || "false",
      status:
        env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true" ? "watch" : "safe",
      explanation:
        "This only permits approved local write slices. It does not enable every browser write.",
    },
    {
      label: "Action-start write",
      value: env.MYMEDLIFE_ENABLE_ACTION_START_WRITE || "false",
      status: getActionStartWriteStatus(env),
      explanation:
        "The first local write slice can start assignments only when local Supabase writes and local auth are also ready.",
    },
    {
      label: "Assignment-create write",
      value: env.MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE || "false",
      status: getAssignmentCreateWriteStatus(env),
      explanation:
        "The leader-side local write slice can create assignments only when local Supabase writes and local auth are ready. Reminder automation still stays disabled.",
    },
    {
      label: "Proof metadata write",
      value: env.MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE || "false",
      status: getProofSubmissionWriteStatus(env),
      explanation:
        "The second local write slice can submit proof/testimonial metadata only when local Supabase writes, local auth, and upload-disabled posture are ready.",
    },
    {
      label: "HQ proof decision write",
      value: env.MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE || "false",
      status: getHqProofDecisionWriteStatus(env),
      explanation:
        "The third local write slice can record HQ proof-sharing decisions only when local Supabase writes and local auth are ready. It still does not publish proof.",
    },
    {
      label: "Coach decision write",
      value: env.MYMEDLIFE_ENABLE_COACH_DECISION_WRITE || "false",
      status: getCoachDecisionWriteStatus(env),
      explanation:
        "The coach-side local write slice can record advance/hold/intervene decisions only when local Supabase writes and local auth are ready. Escalation packets still stay disabled.",
    },
    {
      label: "Proof uploads",
      value: env.MYMEDLIFE_ALLOW_PROOF_UPLOADS || "false",
      status: env.MYMEDLIFE_ALLOW_PROOF_UPLOADS === "true" ? "blocked" : "safe",
      explanation:
        "Proof upload/storage is still a future approval path and should stay off.",
    },
    {
      label: "Local actor email",
      value: env.MYMEDLIFE_LOCAL_ACTOR_EMAIL || "member.a@mymedlife.test",
      status: "safe",
      explanation:
        "This fake email selects a local review role. It is not production auth.",
    },
    {
      label: "External sends",
      value: "disabled",
      status: "safe",
      explanation:
        "HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, and AI writes remain off.",
    },
  ];

  return {
    canReadSummary: true,
    title: getTitle(surfaceFamily),
    summary:
      "Shows safe local environment posture without exposing secrets, tokens, service keys, or passwords.",
    items,
    counts: {
      safe: items.filter((item) => item.status === "safe").length,
      watch: items.filter((item) => item.status === "watch").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      secretsShown: 0,
      browserWritesEnabled:
        getEnabledLocalWriteCount(env),
      externalWritesEnabled: 0,
    },
  };
}

function readEnvironmentSafetyInput(): EnvironmentSafetyInput {
  return {
    MYMEDLIFE_DATA_SOURCE: process.env.MYMEDLIFE_DATA_SOURCE,
    MYMEDLIFE_AUTH_MODE: process.env.MYMEDLIFE_AUTH_MODE,
    MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH:
      process.env.MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH,
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS:
      process.env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS,
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES:
      process.env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES,
    MYMEDLIFE_ENABLE_ACTION_START_WRITE:
      process.env.MYMEDLIFE_ENABLE_ACTION_START_WRITE,
    MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE:
      process.env.MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE,
    MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE:
      process.env.MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE,
    MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE:
      process.env.MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE,
    MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE:
      process.env.MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE,
    MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE:
      process.env.MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE,
    MYMEDLIFE_ENABLE_COACH_DECISION_WRITE:
      process.env.MYMEDLIFE_ENABLE_COACH_DECISION_WRITE,
    MYMEDLIFE_ALLOW_PROOF_UPLOADS: process.env.MYMEDLIFE_ALLOW_PROOF_UPLOADS,
    MYMEDLIFE_LOCAL_ACTOR_EMAIL: process.env.MYMEDLIFE_LOCAL_ACTOR_EMAIL,
  };
}

function getActionStartWriteStatus(
  env: EnvironmentSafetyInput,
): EnvironmentSafetyItem["status"] {
  if (
    env.MYMEDLIFE_ENABLE_ACTION_START_WRITE !== "true" &&
    env.MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE !== "true"
  ) {
    return "safe";
  }

  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") {
    return env.MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH === "true" ? "watch" : "blocked";
  }

  return env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true" ? "watch" : "blocked";
}

function getProofSubmissionWriteStatus(
  env: EnvironmentSafetyInput,
): EnvironmentSafetyItem["status"] {
  if (
    env.MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE !== "true" &&
    env.MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE !== "true"
  ) {
    return "safe";
  }

  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") {
    if (env.MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH !== "true") {
      return "blocked";
    }

    return env.MYMEDLIFE_ALLOW_PROOF_UPLOADS === "true" ? "blocked" : "watch";
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return "blocked";
  }

  return env.MYMEDLIFE_ALLOW_PROOF_UPLOADS === "true" ? "blocked" : "watch";
}

function getAssignmentCreateWriteStatus(
  env: EnvironmentSafetyInput,
): EnvironmentSafetyItem["status"] {
  if (env.MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE !== "true") {
    return "safe";
  }

  return env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true" ? "watch" : "blocked";
}

function getHqProofDecisionWriteStatus(
  env: EnvironmentSafetyInput,
): EnvironmentSafetyItem["status"] {
  if (env.MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE !== "true") {
    return "safe";
  }

  return env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true" ? "watch" : "blocked";
}

function getCoachDecisionWriteStatus(
  env: EnvironmentSafetyInput,
): EnvironmentSafetyItem["status"] {
  if (env.MYMEDLIFE_ENABLE_COACH_DECISION_WRITE !== "true") {
    return "safe";
  }

  return env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true" ? "watch" : "blocked";
}

function getEnabledLocalWriteCount(env: EnvironmentSafetyInput): number {
  const localWriteMasterEnabled =
    env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const stagingReviewEnabled =
    env.MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH === "true" &&
    env.MYMEDLIFE_AUTH_MODE === "staging_supabase";

  if (!localWriteMasterEnabled && !stagingReviewEnabled) {
    return 0;
  }

  const actionStartEnabled =
    env.MYMEDLIFE_ENABLE_ACTION_START_WRITE === "true" ||
    env.MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE === "true"
      ? 1
      : 0;
  const assignmentCreateEnabled =
    env.MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE === "true" ? 1 : 0;
  const proofSubmissionEnabled =
    (env.MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE === "true" ||
      env.MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE === "true") &&
    env.MYMEDLIFE_ALLOW_PROOF_UPLOADS !== "true"
      ? 1
      : 0;
  const hqProofDecisionEnabled =
    env.MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE === "true" ? 1 : 0;
  const coachDecisionEnabled =
    env.MYMEDLIFE_ENABLE_COACH_DECISION_WRITE === "true" ? 1 : 0;

  return (
    actionStartEnabled +
    assignmentCreateEnabled +
    proofSubmissionEnabled +
    hqProofDecisionEnabled +
    coachDecisionEnabled
  );
}

function isAuthModeRequested(env: EnvironmentSafetyInput): boolean {
  return (
    env.MYMEDLIFE_AUTH_MODE === "local_supabase" ||
    env.MYMEDLIFE_AUTH_MODE === "staging_supabase"
  );
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Admin environment safety";
    case "ds_admin":
      return "DS Admin environment safety";
    case "super_admin":
      return "Full local environment safety";
    case "member":
    case "leader":
    case "coach":
      return "Environment safety hidden for this role";
  }
}

function emptyCounts(): EnvironmentSafetySummary["counts"] {
  return {
    safe: 0,
    watch: 0,
    blocked: 0,
    secretsShown: 0,
    browserWritesEnabled: 0,
    externalWritesEnabled: 0,
  };
}
