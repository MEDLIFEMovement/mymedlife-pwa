import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import {
  getAuthSessionState,
  type AuthSessionState,
} from "@/services/auth-session";
import { isUuid } from "@/services/action-start-write";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";

type EnvSource = Record<string, string | undefined>;
type LeaderEventCreateEnvironment = "local" | "staging" | "production";

export const leaderEventTypes = [
  "info",
  "fundraiser",
  "recruitment",
  "slt",
  "volunteer",
  "workshop",
  "social",
  "other",
] as const;

export type LeaderEventType = (typeof leaderEventTypes)[number];
export type LeaderEventLocationType = "in_person" | "virtual" | "hybrid";

export type LeaderEventCreateInput = {
  requestId: string;
  chapterId: string;
  title: string;
  eventType: LeaderEventType;
  description: string;
  startsAt: string;
  endsAt: string | null;
  locationType: LeaderEventLocationType;
  locationName: string;
  virtualUrl: string;
  capacity: number | null;
  rsvpDeadline: string | null;
  organizingGroup: string;
  campaignLabel: string;
  auditReason: string;
};

export type LeaderEventCreateResult =
  | {
      success: true;
      code: "chapter_event_created";
      chapterEventId: string;
      eventId: string;
      auditLogId: string;
      deduplicated: boolean;
      externalWritesEnabled: false;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code:
        | "write_disabled"
        | "missing_auth"
        | "validation_error"
        | "permission_denied"
        | "chapter_not_found"
        | "server_error";
      chapterEventId: null;
      externalWritesEnabled: false;
      plainEnglishMessage: string;
    };

export type LeaderEventCreateWriteConfig = {
  enabled: boolean;
  environment: LeaderEventCreateEnvironment;
  externalWritesEnabled: false;
  reason: string;
};

type LeaderEventCreateRpcRow = {
  chapter_event_id: string;
  event_id: string;
  audit_log_id: string;
  deduplicated: boolean;
};

type LeaderEventCreateRpcClient = {
  schema: (schemaName: "app") => {
    rpc: (
      functionName: "create_chapter_event_for_leader",
      params: Record<string, unknown>,
    ) => Promise<{
      data: unknown;
      error: { code?: string; message?: string } | null;
    }>;
  };
};

type LeaderEventCreateDeps = {
  createServerClient?: () => Promise<{
    client: LeaderEventCreateRpcClient | null;
    config: { reason: string };
  }>;
  getSessionState?: (
    client: LeaderEventCreateRpcClient,
  ) => Promise<AuthSessionState>;
};

const eventTypeSet = new Set<string>(leaderEventTypes);
const locationTypeSet = new Set<LeaderEventLocationType>([
  "in_person",
  "virtual",
  "hybrid",
]);

export function getLeaderEventCreateWriteConfig(
  env: EnvSource = process.env,
): LeaderEventCreateWriteConfig {
  const authConfig = getSupabaseAuthConfig(env);
  const environment = authConfig.environment;

  if (!authConfig.enabled) {
    return disabled(environment, authConfig.reason);
  }

  if (env.MYMEDLIFE_ENABLE_LEADER_EVENT_CREATE_WRITE !== "true") {
    return disabled(
      environment,
      "App-owned leader event creation is disabled by configuration.",
    );
  }

  if (
    environment === "staging" &&
    env.MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES !== "true"
  ) {
    return disabled(
      environment,
      "Staging leader event creation also requires the hosted staging write master switch.",
    );
  }

  const approvalFlag = getApprovalFlag(environment, env);
  if (approvalFlag !== "true") {
    return disabled(
      environment,
      `${capitalize(environment)} leader event creation requires its explicit environment approval flag.`,
    );
  }

  return {
    enabled: true,
    environment,
    externalWritesEnabled: false,
    reason:
      "App-owned leader event creation is enabled. Luma, email, text, attendance, points, and warehouse writes remain disabled.",
  };
}

export async function createLeaderEventForSupabase(
  input: LeaderEventCreateInput,
  deps: LeaderEventCreateDeps = {},
): Promise<LeaderEventCreateResult> {
  const config = getLeaderEventCreateWriteConfig();
  if (!config.enabled) {
    return failure("write_disabled", config.reason);
  }

  const validationMessage = validateLeaderEventCreateInput(input);
  if (validationMessage) {
    return failure("validation_error", validationMessage);
  }

  const createServerClient =
    deps.createServerClient ?? createLeaderEventServerClient;
  const { client, config: authConfig } = await createServerClient();
  if (!client) {
    return failure("write_disabled", authConfig.reason);
  }

  const getSessionState =
    deps.getSessionState ?? getLeaderEventSessionState;
  const session = await getSessionState(client);
  if (session.status !== "signed_in") {
    return failure(
      "missing_auth",
      "Sign in with a chapter leader account before creating an event.",
    );
  }

  const { data, error } = await client
    .schema("app")
    .rpc("create_chapter_event_for_leader", {
      request_uuid: input.requestId,
      chapter_uuid: input.chapterId,
      title_input: input.title.trim(),
      event_type_input: input.eventType,
      description_input: input.description.trim(),
      starts_at_input: input.startsAt,
      ends_at_input: input.endsAt,
      location_type_input: input.locationType,
      location_name_input: input.locationName.trim(),
      virtual_url_input: input.virtualUrl.trim(),
      capacity_input: input.capacity,
      rsvp_deadline_input: input.rsvpDeadline,
      organizing_group_input: input.organizingGroup.trim(),
      campaign_label_input: input.campaignLabel.trim(),
      audit_reason_input: input.auditReason.trim(),
    });

  if (error) {
    return mapLeaderEventCreateRpcError(error);
  }

  const row = Array.isArray(data)
    ? (data[0] as LeaderEventCreateRpcRow | undefined)
    : undefined;

  if (
    !row ||
    !isUuid(row.chapter_event_id) ||
    !isUuid(row.event_id) ||
    !isUuid(row.audit_log_id)
  ) {
    return failure(
      "server_error",
      "Supabase did not return the event and audit records, so completion was not claimed.",
    );
  }

  return {
    success: true,
    code: "chapter_event_created",
    chapterEventId: row.chapter_event_id,
    eventId: row.event_id,
    auditLogId: row.audit_log_id,
    deduplicated: row.deduplicated === true,
    externalWritesEnabled: false,
    plainEnglishMessage:
      row.deduplicated === true
        ? "The original app-owned event was returned safely; no duplicate event or external write was created."
        : "The event was created in myMEDLIFE with an internal event and audit record. No Luma, message, attendance, points, or warehouse write ran.",
  };
}

export function validateLeaderEventCreateInput(
  input: LeaderEventCreateInput,
): string | null {
  if (!isUuid(input.requestId) || !isUuid(input.chapterId)) {
    return "Use a real chapter and a valid event creation request.";
  }

  const title = input.title.trim();
  if (title.length < 3 || title.length > 160) {
    return "Event name must be between 3 and 160 characters.";
  }

  if (!eventTypeSet.has(input.eventType)) {
    return "Choose a supported event type.";
  }

  const startsAt = parseDate(input.startsAt);
  const endsAt = input.endsAt ? parseDate(input.endsAt) : null;
  if (!startsAt) {
    return "Add a valid event date and start time.";
  }
  if (input.endsAt && !endsAt) {
    return "Add a valid event end time or leave it blank.";
  }
  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    return "Event end time cannot be before the start time.";
  }

  if (!locationTypeSet.has(input.locationType)) {
    return "Choose in-person, virtual, or hybrid.";
  }
  if (
    (input.locationType === "in_person" ||
      input.locationType === "hybrid") &&
    input.locationName.trim().length < 2
  ) {
    return "Add the in-person location.";
  }
  if (
    (input.locationType === "virtual" ||
      input.locationType === "hybrid") &&
    !isHttpsUrl(input.virtualUrl)
  ) {
    return "Add a valid HTTPS meeting link.";
  }

  if (
    input.capacity !== null &&
    (!Number.isInteger(input.capacity) || input.capacity <= 0)
  ) {
    return "Capacity must be a whole number greater than zero.";
  }

  const rsvpDeadline = input.rsvpDeadline
    ? parseDate(input.rsvpDeadline)
    : null;
  if (input.rsvpDeadline && !rsvpDeadline) {
    return "Add a valid RSVP deadline or leave it blank.";
  }
  if (rsvpDeadline && rsvpDeadline.getTime() > startsAt.getTime()) {
    return "RSVP deadline cannot be after the event starts.";
  }

  if (input.organizingGroup.trim().length < 3) {
    return "Choose the organizing action committee.";
  }
  if (input.auditReason.trim().length < 12) {
    return "Add a clear audit reason of at least 12 characters.";
  }

  return null;
}

export function mapLeaderEventCreateRpcError(error: {
  code?: string;
  message?: string;
}): LeaderEventCreateResult {
  const message = error.message?.toLowerCase() ?? "";

  if (message.includes("authenticated user required")) {
    return failure(
      "missing_auth",
      "Sign in with a chapter leader account before creating an event.",
    );
  }
  if (
    error.code === "P0002" ||
    message.includes("active chapter not found")
  ) {
    return failure(
      "chapter_not_found",
      "The active chapter was not found, so no event was created.",
    );
  }
  if (
    error.code === "42501" ||
    message.includes("actor cannot create chapter events")
  ) {
    return failure(
      "permission_denied",
      "This account is not allowed to create events for that chapter.",
    );
  }
  if (
    error.code === "22023" ||
    message.includes("event title") ||
    message.includes("event start") ||
    message.includes("event end") ||
    message.includes("location") ||
    message.includes("meeting link") ||
    message.includes("capacity") ||
    message.includes("rsvp deadline") ||
    message.includes("organizing group") ||
    message.includes("reason")
  ) {
    return failure(
      "validation_error",
      "The event details did not pass the safe creation contract, so nothing was saved.",
    );
  }

  return failure(
    "server_error",
    "The app could not safely create the event. No external provider or member-loop write ran.",
  );
}

async function createLeaderEventServerClient() {
  return createLocalSupabaseServerClient();
}

async function getLeaderEventSessionState(
  client: LeaderEventCreateRpcClient,
) {
  return getAuthSessionState(
    client as Awaited<
      ReturnType<typeof createLocalSupabaseServerClient>
    >["client"],
  );
}

function getApprovalFlag(
  environment: LeaderEventCreateEnvironment,
  env: EnvSource,
) {
  switch (environment) {
    case "production":
      return env.MYMEDLIFE_ALLOW_PRODUCTION_LEADER_EVENT_CREATE_WRITE;
    case "staging":
      return env.MYMEDLIFE_ALLOW_STAGING_LEADER_EVENT_CREATE_WRITE;
    case "local":
      return env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES;
  }
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function disabled(
  environment: LeaderEventCreateEnvironment,
  reason: string,
): LeaderEventCreateWriteConfig {
  return {
    enabled: false,
    environment,
    externalWritesEnabled: false,
    reason,
  };
}

function failure(
  code: Extract<LeaderEventCreateResult, { success: false }>["code"],
  plainEnglishMessage: string,
): LeaderEventCreateResult {
  return {
    success: false,
    code,
    chapterEventId: null,
    externalWritesEnabled: false,
    plainEnglishMessage,
  };
}
