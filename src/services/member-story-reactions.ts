import { createClient } from "@supabase/supabase-js";

type EnvSource = Record<string, string | undefined>;
type StoryReactionEnvironment = "local" | "staging" | "production";
type RpcError = { message?: string } | null;
type RpcResult<TData> = { data: TData | null; error: RpcError };

export type MemberStoryReactionReadback = {
  evidenceItemId: string;
  reactionCount: number;
  likedByActor: boolean;
};

export type MemberStoryReactionReadbackStatus = "ready" | "unavailable";

export type MemberStoryReactionReadbackResult = {
  status: MemberStoryReactionReadbackStatus;
  rows: MemberStoryReactionReadback[];
};

export type MemberStoryReactionResult = {
  success: boolean;
  code:
    | "story_liked"
    | "story_unliked"
    | "write_disabled"
    | "story_not_found"
    | "profile_not_found"
    | "server_error";
  evidenceItemId: string;
  reactionCount: number;
  likedByActor: boolean;
  message: string;
};

type StoryReactionRpcRow = {
  result_code: string;
  evidence_item_id: string;
  reaction_count: number;
  liked_by_actor: boolean;
};

type StoryReactionReadbackRow = Omit<StoryReactionRpcRow, "result_code">;

export type MemberStoryReactionClient = {
  schema(schemaName: "app"): {
    rpc(
      functionName: "set_member_story_like",
      params: {
        actor_uuid: string;
        evidence_item_uuid: string;
        liked_input: boolean;
      },
    ): Promise<RpcResult<unknown>>;
    rpc(
      functionName: "get_member_story_reactions",
      params: { actor_uuid: string },
    ): Promise<RpcResult<unknown>>;
  };
};

export function getMemberStoryReactionConfig(env: EnvSource = process.env) {
  const environment = getEnvironment(env);

  if (env.MYMEDLIFE_ENABLE_MEMBER_STORY_REACTION_WRITE !== "true") {
    return disabled(environment, "Member story reactions are disabled by configuration.");
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return disabled(
      environment,
      "Member story reactions require the server-only Supabase service-role key.",
    );
  }

  if (getApprovalFlag(environment, env) !== "true") {
    return disabled(
      environment,
      `${capitalize(environment)} member story reactions require the explicit environment approval flag.`,
    );
  }

  return {
    enabled: true,
    environment,
    reason:
      "Member story reactions are enabled for approved myMEDLIFE stories. Shares, saves, and external provider writes remain disabled.",
  } as const;
}

export function createMemberStoryReactionClient(
  env: EnvSource = process.env,
): MemberStoryReactionClient | null {
  const config = getMemberStoryReactionConfig(env);
  return config.enabled ? createMemberStoryReactionReadClient(env) : null;
}

export function createMemberStoryReactionReadClient(
  env: EnvSource = process.env,
): MemberStoryReactionClient | null {
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as MemberStoryReactionClient;
}

export async function getMemberStoryReactionReadbacks(
  client: MemberStoryReactionClient,
  actorUserId: string,
): Promise<MemberStoryReactionReadbackResult> {
  try {
    const response = await client.schema("app").rpc("get_member_story_reactions", {
      actor_uuid: actorUserId,
    });

    if (response.error || !Array.isArray(response.data)) {
      return unavailableReadback();
    }

    const rows = response.data as StoryReactionReadbackRow[];
    if (!rows.every(isValidReadbackRow)) return unavailableReadback();

    return {
      status: "ready",
      rows: rows.map((row) => ({
        evidenceItemId: row.evidence_item_id,
        reactionCount: row.reaction_count,
        likedByActor: row.liked_by_actor,
      })),
    };
  } catch {
    return unavailableReadback();
  }
}

export async function setMemberStoryLike(
  client: MemberStoryReactionClient,
  input: { actorUserId: string; evidenceItemId: string; liked: boolean },
): Promise<MemberStoryReactionResult> {
  const response = await client.schema("app").rpc("set_member_story_like", {
    actor_uuid: input.actorUserId,
    evidence_item_uuid: input.evidenceItemId,
    liked_input: input.liked,
  });

  if (response.error) {
    return mapWriteError(response.error.message, input.evidenceItemId);
  }

  const row = Array.isArray(response.data)
    ? (response.data[0] as StoryReactionRpcRow | undefined)
    : (response.data as StoryReactionRpcRow | null);

  if (!row || (row.result_code !== "story_liked" && row.result_code !== "story_unliked")) {
    return failure(
      "server_error",
      input.evidenceItemId,
      "The story reaction transaction returned an invalid result, so success was not claimed.",
    );
  }

  return {
    success: true,
    code: row.result_code,
    evidenceItemId: row.evidence_item_id,
    reactionCount: row.reaction_count,
    likedByActor: row.liked_by_actor,
    message: row.liked_by_actor
      ? "Story reaction recorded in myMEDLIFE."
      : "Story reaction removed from the active count while its audit history was preserved.",
  };
}

function getEnvironment(env: EnvSource): StoryReactionEnvironment {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") return "production";
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") return "staging";
  return "local";
}

function getApprovalFlag(environment: StoryReactionEnvironment, env: EnvSource) {
  if (environment === "production") {
    return env.MYMEDLIFE_ALLOW_PRODUCTION_MEMBER_STORY_REACTION_WRITE;
  }
  if (environment === "staging") return env.MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES;
  return env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES;
}

function disabled(environment: StoryReactionEnvironment, reason: string) {
  return { enabled: false, environment, reason } as const;
}

function failure(
  code: Extract<MemberStoryReactionResult["code"],
    "write_disabled" | "story_not_found" | "profile_not_found" | "server_error">,
  evidenceItemId: string,
  message: string,
): MemberStoryReactionResult {
  return {
    success: false,
    code,
    evidenceItemId,
    reactionCount: 0,
    likedByActor: false,
    message,
  };
}

function mapWriteError(message: string | undefined, evidenceItemId: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("profile")) {
    return failure("profile_not_found", evidenceItemId, "An active member profile is required.");
  }
  if (normalized.includes("story") || normalized.includes("evidence")) {
    return failure(
      "story_not_found",
      evidenceItemId,
      "Only approved, shareable stories can receive reactions.",
    );
  }
  return failure(
    "server_error",
    evidenceItemId,
    "The story reaction was not recorded, so the visible count was not changed.",
  );
}

function capitalize(value: string) {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

function isValidReadbackRow(row: StoryReactionReadbackRow) {
  return Boolean(
    row &&
      typeof row.evidence_item_id === "string" &&
      row.evidence_item_id.length > 0 &&
      Number.isInteger(row.reaction_count) &&
      row.reaction_count >= 0 &&
      typeof row.liked_by_actor === "boolean",
  );
}

function unavailableReadback(): MemberStoryReactionReadbackResult {
  return { status: "unavailable", rows: [] };
}
