import type { LocalActorContext } from "@/services/local-actor-context";

export type EnvironmentSafetyInput = {
  MYMEDLIFE_DATA_SOURCE?: string;
  MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS?: string;
  MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES?: string;
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
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
  };
};

export function getEnvironmentSafetySummary(
  actor: LocalActorContext,
  env: EnvironmentSafetyInput = readEnvironmentSafetyInput(),
): EnvironmentSafetySummary {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadSummary: false,
      title: "Environment safety hidden for this role",
      summary: "Environment safety is an admin review aid.",
      items: [],
      counts: emptyCounts(),
    };
  }

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
        env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true" ? "blocked" : "safe",
      explanation:
        "Browser writes must remain disabled until live auth and approval are complete.",
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
    title: getTitle(actor),
    summary:
      "Shows safe local environment posture without exposing secrets, tokens, service keys, or passwords.",
    items,
    counts: {
      safe: items.filter((item) => item.status === "safe").length,
      watch: items.filter((item) => item.status === "watch").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      secretsShown: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
    },
  };
}

function readEnvironmentSafetyInput(): EnvironmentSafetyInput {
  return {
    MYMEDLIFE_DATA_SOURCE: process.env.MYMEDLIFE_DATA_SOURCE,
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS:
      process.env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS,
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES:
      process.env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES,
    MYMEDLIFE_ALLOW_PROOF_UPLOADS: process.env.MYMEDLIFE_ALLOW_PROOF_UPLOADS,
    MYMEDLIFE_LOCAL_ACTOR_EMAIL: process.env.MYMEDLIFE_LOCAL_ACTOR_EMAIL,
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin environment safety";
    case "ds_admin":
      return "DS Admin environment safety";
    case "super_admin":
      return "Full local environment safety";
    case "chapter_member":
    case "chapter_leader":
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
