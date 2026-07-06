import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import {
  getAuthSessionState,
  type AuthSessionState,
} from "@/services/auth-session";
import {
  getChapterEventAuthoritativeUpdateWriteConfig,
  type ChapterEventAuthoritativeUpdateInput,
  type ChapterEventAuthoritativeUpdateValue,
} from "@/services/chapter-event-authoritative-update-readiness";
import { isUuid } from "@/services/action-start-write";
import {
  getChapterEventUpdateSafetyContract,
  type ChapterEventUpdateField,
} from "@/services/chapter-event-update-safety-contract";

export type ChapterEventAuthoritativeUpdateRpcRow = {
  chapter_event_id: string;
  updated_fields: string[];
  event_id: string;
  audit_log_id: string;
};

export type ChapterEventAuthoritativeUpdateServerResult =
  | {
      success: true;
      code: "chapter_event_updated";
      chapterEventId: string;
      updatedFields: string[];
      eventId: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code:
        | "write_disabled"
        | "missing_auth"
        | "chapter_event_not_found"
        | "field_subset_invalid"
        | "audit_reason_required"
        | "permission_denied"
        | "server_error";
      chapterEventId: string;
      plainEnglishMessage: string;
    };

type ChapterEventAuthoritativeUpdateFailureCode = Extract<
  ChapterEventAuthoritativeUpdateServerResult,
  { success: false }
>["code"];

type ChapterEventAuthoritativeUpdateRpcParams = {
  chapter_event_uuid: string;
  field_patch: Partial<
    Record<ChapterEventUpdateField, ChapterEventAuthoritativeUpdateValue>
  >;
  audit_reason_input: string;
};

type ChapterEventAuthoritativeUpdateRpcClient = {
  schema: (schemaName: "app") => {
    rpc: (
      functionName: "update_chapter_event_authoritative_fields",
      params: ChapterEventAuthoritativeUpdateRpcParams,
    ) => Promise<{
      data: unknown;
      error: { code?: string; message?: string } | null;
    }>;
  };
};

type ChapterEventAuthoritativeUpdateDeps = {
  createServerClient?: () => Promise<{
    client: ChapterEventAuthoritativeUpdateRpcClient | null;
    config: { reason: string };
  }>;
  getSessionState?: (
    client: ChapterEventAuthoritativeUpdateRpcClient,
  ) => Promise<AuthSessionState>;
};

const implementedAuthoritativeFieldSet = new Set<ChapterEventUpdateField>(
  getChapterEventUpdateSafetyContract().implementedLocalAuthoritativeFields,
);

export function hasChapterEventAuthoritativeUpdateSupabaseId(
  chapterEventId: string,
): boolean {
  return isUuid(chapterEventId);
}

export function hasImplementedChapterEventAuthoritativeUpdateFields(
  patch: ChapterEventAuthoritativeUpdateInput["patch"],
): boolean {
  const keys = Object.keys(patch ?? {}) as ChapterEventUpdateField[];

  return (
    keys.length > 0 &&
    keys.every((key) => implementedAuthoritativeFieldSet.has(key))
  );
}

export async function submitChapterEventAuthoritativeUpdateForLocalSupabase(
  input: ChapterEventAuthoritativeUpdateInput,
  deps: ChapterEventAuthoritativeUpdateDeps = {},
): Promise<ChapterEventAuthoritativeUpdateServerResult> {
  const chapterEventId = input.chapterEventId.trim();
  const auditReason = input.auditReason.trim();
  const config = getChapterEventAuthoritativeUpdateWriteConfig();

  if (!config.enabled) {
    return failureResult(chapterEventId, "write_disabled", config.reason);
  }

  if (!hasChapterEventAuthoritativeUpdateSupabaseId(chapterEventId)) {
    return failureResult(
      chapterEventId,
      "chapter_event_not_found",
      "The current chapter event uses mock data instead of an approved Supabase UUID, so no chapter-event update was saved.",
    );
  }

  if (!hasImplementedChapterEventAuthoritativeUpdateFields(input.patch)) {
    return failureResult(
      chapterEventId,
      "field_subset_invalid",
      "This chapter-event patch reaches fields outside the first audited authoritative subset, so nothing was saved.",
    );
  }

  if (auditReason.length < 12) {
    return failureResult(
      chapterEventId,
      "audit_reason_required",
      "Add a clearer audit reason before saving a chapter-event update.",
    );
  }

  const createServerClient =
    deps.createServerClient ?? createSupabaseServerClientForChapterEvent;
  const { client, config: authConfig } = await createServerClient();

  if (!client) {
    return failureResult(chapterEventId, "write_disabled", authConfig.reason);
  }

  const getSessionState =
    deps.getSessionState ?? getAuthSessionStateForChapterEvent;
  const authSession = await getSessionState(client);

  if (authSession.status !== "signed_in") {
    return failureResult(
      chapterEventId,
      "missing_auth",
      "Sign in with a local Supabase chapter leader, Admin, DS Admin, or Super Admin seed user before updating chapter-event operating fields.",
    );
  }

  const { data, error } = await client
    .schema("app")
    .rpc("update_chapter_event_authoritative_fields", {
      chapter_event_uuid: chapterEventId,
      field_patch: input.patch,
      audit_reason_input: auditReason,
    });

  if (error) {
    return mapChapterEventAuthoritativeUpdateRpcError(chapterEventId, error);
  }

  const firstRow = Array.isArray(data)
    ? (data[0] as ChapterEventAuthoritativeUpdateRpcRow | undefined)
    : undefined;

  if (!firstRow) {
    return failureResult(
      chapterEventId,
      "server_error",
      "Local Supabase did not return the expected chapter-event update record. No provider call, outbox send, RSVP write, attendance import, or points materialization ran.",
    );
  }

  return mapChapterEventAuthoritativeUpdateRpcSuccess(firstRow);
}

export function mapChapterEventAuthoritativeUpdateRpcSuccess(
  row: ChapterEventAuthoritativeUpdateRpcRow,
): ChapterEventAuthoritativeUpdateServerResult {
  return {
    success: true,
    code: "chapter_event_updated",
    chapterEventId: row.chapter_event_id,
    updatedFields: row.updated_fields,
    eventId: row.event_id,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Chapter-event authoritative fields were updated through the audited local server-only wrapper. The app recorded one internal event and one audit log entry. No provider call, outbox send, RSVP write, attendance import, or points materialization ran.",
  };
}

export function mapChapterEventAuthoritativeUpdateRpcError(
  chapterEventId: string,
  error: { code?: string; message?: string },
): ChapterEventAuthoritativeUpdateServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (
    error.code === "P0002" ||
    message.includes("chapter event not found")
  ) {
    return failureResult(
      chapterEventId,
      "chapter_event_not_found",
      "The selected chapter event was not found in local Supabase, so nothing was saved.",
    );
  }

  if (message.includes("authenticated user required")) {
    return failureResult(
      chapterEventId,
      "missing_auth",
      "Sign in with a local Supabase chapter leader, Admin, DS Admin, or Super Admin seed user before updating chapter-event operating fields.",
    );
  }

  if (
    error.code === "42501" ||
    message.includes("actor cannot update authoritative chapter event fields")
  ) {
    return failureResult(
      chapterEventId,
      "permission_denied",
      "This signed-in role is not allowed to update authoritative chapter-event fields in the current server-only path.",
    );
  }

  if (
    message.includes("reason must be at least") ||
    message.includes("audit reason")
  ) {
    return failureResult(
      chapterEventId,
      "audit_reason_required",
      "Add a clearer audit reason before saving a chapter-event update.",
    );
  }

  if (
    message.includes("authoritative chapter event patch must be a non-empty object") ||
    message.includes("outside the first audited chapter event update subset") ||
    message.includes("narrative chapter event updates remain blocked") ||
    message.includes("status cannot be null") ||
    message.includes("event end time cannot be before start time") ||
    message.includes("attendance count must be zero or greater") ||
    message.includes("eligible member count must be zero or greater") ||
    message.includes("attendance rate must be between 0 and 1") ||
    message.includes("nps score must be between -100 and 100") ||
    message.includes("no authoritative chapter event changes were requested")
  ) {
    return failureResult(
      chapterEventId,
      "field_subset_invalid",
      "This chapter-event patch did not satisfy the first audited authoritative subset, so nothing was saved.",
    );
  }

  return failureResult(
    chapterEventId,
    "server_error",
    "The app could not safely update the chapter event. No provider call, outbox send, RSVP write, attendance import, or points materialization ran.",
  );
}

async function createSupabaseServerClientForChapterEvent() {
  return createLocalSupabaseServerClient();
}

async function getAuthSessionStateForChapterEvent(
  client: ChapterEventAuthoritativeUpdateRpcClient,
) {
  return getAuthSessionState(client as Awaited<
    ReturnType<typeof createLocalSupabaseServerClient>
  >["client"]);
}

function failureResult(
  chapterEventId: string,
  code: ChapterEventAuthoritativeUpdateFailureCode,
  plainEnglishMessage: string,
): ChapterEventAuthoritativeUpdateServerResult {
  return {
    success: false,
    code,
    chapterEventId,
    plainEnglishMessage,
  };
}
