import { createClient } from "@supabase/supabase-js";

import { isUuid } from "@/services/action-start-write";
import { isMemberEventClosedStatus } from "@/services/member-event-lifecycle";

type EnvSource = Record<string, string | undefined>;
type MemberEventLoopEnvironment = "local" | "staging" | "production";
type MemberEventLoopOperation = "rsvp" | "cancel_rsvp" | "checkin";

type SupabaseQueryError = { message?: string } | null;
type SupabaseQueryResult<TData> = {
  data: TData | null;
  error: SupabaseQueryError;
};
type SupabaseQueryBuilder<TData = Record<string, unknown>[]> =
  PromiseLike<SupabaseQueryResult<TData>> & {
    select<TRow = Record<string, unknown>>(
      columns: string,
    ): SupabaseQueryBuilder<TRow[]>;
    eq(column: string, value: unknown): SupabaseQueryBuilder<TData>;
    ilike(column: string, value: string): SupabaseQueryBuilder<TData>;
    order(
      column: string,
      options?: { ascending?: boolean; nullsFirst?: boolean },
    ): SupabaseQueryBuilder<TData>;
    limit(count: number): SupabaseQueryBuilder<TData>;
    maybeSingle<TRow>(): Promise<SupabaseQueryResult<TRow>>;
    single<TRow>(): Promise<SupabaseQueryResult<TRow>>;
  };
type SupabaseTableClient = {
  select<TRow = Record<string, unknown>>(columns: string): SupabaseQueryBuilder<TRow[]>;
  insert(row: Record<string, unknown>): SupabaseQueryBuilder;
  update(row: Record<string, unknown>): SupabaseQueryBuilder;
};
export type SupabaseServiceClient = {
  schema(schemaName: "app"): {
    from(tableName: string): SupabaseTableClient;
    rpc(
      functionName: "record_member_event_loop_step",
      params: {
        actor_uuid: string;
        chapter_event_uuid: string;
        operation_input: MemberEventLoopOperation;
      },
    ): Promise<SupabaseQueryResult<unknown>>;
  };
};

export const memberEventLoopPointAward = 20;
export const memberEventLoopWriteResultParam = "memberEventLoopWriteResult";

export type MemberEventLoopWriteConfig = {
  enabled: boolean;
  environment: MemberEventLoopEnvironment;
  externalWritesEnabled: false;
  reason: string;
};

export type MemberEventLoopWriteResult =
  | {
      success: true;
      code:
        | "rsvp_recorded"
        | "already_rsvpd"
        | "rsvp_cancelled"
        | "rsvp_cancel_not_found"
        | "checked_in"
        | "already_checked_in";
      eventId: string;
      pointsAwarded: number;
      attendanceCount: number;
      externalWritesEnabled: false;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code:
        | "write_disabled"
        | "missing_auth"
        | "profile_not_found"
        | "membership_required"
        | "event_not_found"
        | "permission_denied"
        | "event_closed"
        | "rsvp_cancel_blocked_checked_in"
        | "server_error";
      eventId: string;
      externalWritesEnabled: false;
      plainEnglishMessage: string;
    };

type ProfileRow = {
  id: string;
  display_name: string;
  email: string;
  status: string;
};

type MembershipRow = {
  id: string;
  chapter_id: string;
  role_key: string;
  status: string;
};

type CampaignRow = {
  id: string;
  chapter_id: string;
  status: string;
};

type ChapterEventRow = {
  id: string;
  chapter_id: string;
  campaign_id: string | null;
  title: string;
  status: string;
  attendance_count: number | null;
};

type RsvpIntentRow = {
  id: string;
  event_type: string;
  occurred_at: string;
};

type PointsEventRow = {
  id: string;
  awarded_to_user_id: string;
  points_delta: number;
};

type RecordMemberEventLoopInput = {
  operation: MemberEventLoopOperation;
  routeEventId: string;
  actorUserId: string;
  actorEmail: string;
};

type AtomicMemberEventLoopRow = {
  result_code: string;
  event_id: string;
  points_awarded: number;
  attendance_count: number;
};

type MemberEventWriteContext =
  | {
      success: true;
      profile: ProfileRow;
      event: ChapterEventRow;
      campaign: CampaignRow | null;
    }
  | { success: false; result: MemberEventLoopWriteResult };

const testEventRouteAliases = new Map([
  [
    "chapter-event-ucla-kickoff",
    {
      title: "TEST Intro GBM",
      eventType: "social",
      promotionSummary:
        "Production-safe TEST event loop for RSVP, check-in, attendance, and points. No Luma or external provider write runs from this event.",
      locationLabel: "TEST chapter event",
    },
  ],
]);

export function getMemberEventLoopWriteConfig(
  env: EnvSource = process.env,
): MemberEventLoopWriteConfig {
  const environment = getEnvironment(env);

  if (env.MYMEDLIFE_ENABLE_MEMBER_EVENT_LOOP_WRITE !== "true") {
    return disabled(
      environment,
      "Member event-loop writes are disabled by configuration.",
    );
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return disabled(
      environment,
      "Member event-loop writes are disabled because the server-only Supabase service-role key is missing.",
    );
  }

  const approvalFlag = getApprovalFlag(environment, env);

  if (approvalFlag !== "true") {
    return disabled(
      environment,
      `${capitalize(environment)} member event-loop writes require the explicit environment approval flag before RSVP, check-in, attendance, or points rows can be recorded.`,
    );
  }

  return {
    enabled: true,
    environment,
    externalWritesEnabled: false,
    reason:
      "Member event-loop writes are enabled for internal myMEDLIFE TEST rows only. Luma, reminders, warehouse exports, and other external provider writes remain disabled.",
  };
}

export function createMemberEventLoopWriteClient(
  env: EnvSource = process.env,
): SupabaseServiceClient | null {
  const config = getMemberEventLoopWriteConfig(env);
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!config.enabled || !url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as SupabaseServiceClient;
}

export async function recordMemberEventLoopStep(
  client: SupabaseServiceClient,
  input: RecordMemberEventLoopInput,
): Promise<MemberEventLoopWriteResult> {
  try {
    const context = await resolveMemberEventWriteContext(client, input);
    if (!context.success) return context.result;
    const { profile, event, campaign } = context;

    if (input.operation === "cancel_rsvp") {
      return cancelRsvp(client, {
        event,
        profile,
        campaignId: event.campaign_id ?? campaign?.id ?? null,
      });
    }

    const rsvpResult = await recordRsvp(client, {
      event,
      profile,
      campaignId: event.campaign_id ?? campaign?.id ?? null,
      operation: input.operation,
    });

    if (input.operation === "rsvp") {
      return {
        success: true,
        code: rsvpResult.created ? "rsvp_recorded" : "already_rsvpd",
        eventId: event.id,
        pointsAwarded: 0,
        attendanceCount: event.attendance_count ?? 0,
        externalWritesEnabled: false,
        plainEnglishMessage: rsvpResult.created
          ? "RSVP recorded in myMEDLIFE. No Luma or external provider write ran."
          : "RSVP was already recorded for this event. No duplicate RSVP row was created.",
      };
    }

    return recordCheckInAndPoints(client, {
      event,
      profile,
      campaignId: event.campaign_id ?? campaign?.id ?? null,
    });
  } catch (error) {
    return failure(
      "server_error",
      input.routeEventId,
      error instanceof Error
        ? `The app could not safely record this event-loop step: ${error.message}`
        : "The app could not safely record this event-loop step.",
    );
  }
}

export async function recordMemberEventLoopStepAtomically(
  client: SupabaseServiceClient,
  input: RecordMemberEventLoopInput,
): Promise<MemberEventLoopWriteResult> {
  try {
    const context = await resolveMemberEventWriteContext(client, input);
    if (!context.success) return context.result;
    const { profile, event } = context;

    const response = await client.schema("app").rpc("record_member_event_loop_step", {
      actor_uuid: profile.id,
      chapter_event_uuid: event.id,
      operation_input: input.operation,
    });

    if (response.error) {
      return mapAtomicWriteError(response.error.message, event.id);
    }

    const row = Array.isArray(response.data)
      ? (response.data[0] as AtomicMemberEventLoopRow | undefined)
      : (response.data as AtomicMemberEventLoopRow | null);

    if (!row || !isAtomicSuccessCode(row.result_code)) {
      return failure(
        "server_error",
        event.id,
        "The transactional event-loop write returned an invalid result, so completion was not claimed.",
      );
    }

    if (row.result_code === "rsvp_cancel_blocked_checked_in") {
      return failure(
        "rsvp_cancel_blocked_checked_in",
        row.event_id,
        "RSVP cancellation is locked after check-in because attendance and points are already recorded.",
      );
    }

    return {
      success: true,
      code: row.result_code,
      eventId: row.event_id,
      pointsAwarded: row.points_awarded,
      attendanceCount: row.attendance_count,
      externalWritesEnabled: false,
      plainEnglishMessage:
        mapMemberEventLoopWriteResultMessage(row.result_code)?.message ??
        "The internal myMEDLIFE event-loop step completed. External writes stayed off.",
    };
  } catch (error) {
    return failure(
      "server_error",
      input.routeEventId,
      error instanceof Error
        ? `The app could not safely record this event-loop step: ${error.message}`
        : "The app could not safely record this event-loop step.",
    );
  }
}

export function mapMemberEventLoopWriteResultMessage(
  code: string | undefined,
): { code: string; tone: "success" | "info" | "warning"; message: string } | null {
  switch (code) {
    case "rsvp_recorded":
      return {
        code,
        tone: "success",
        message:
          "RSVP recorded in myMEDLIFE. No Luma or external provider write ran.",
      };
    case "already_rsvpd":
      return {
        code,
        tone: "info",
        message:
          "RSVP was already recorded for this event, so no duplicate RSVP row was created.",
      };
    case "rsvp_cancelled":
      return {
        code,
        tone: "success",
        message:
          "RSVP canceled in myMEDLIFE. No Luma or external provider write ran.",
      };
    case "rsvp_cancel_not_found":
      return {
        code,
        tone: "info",
        message:
          "No active RSVP was found for this event. Nothing was canceled.",
      };
    case "checked_in":
      return {
        code,
        tone: "success",
        message:
          "Check-in recorded, attendance updated, and points awarded once in the myMEDLIFE ledger. External writes stayed off.",
      };
    case "already_checked_in":
      return {
        code,
        tone: "info",
        message:
          "This check-in was already recorded. Duplicate points were blocked.",
      };
    case "write_disabled":
      return {
        code,
        tone: "warning",
        message:
          "Event-loop writes are disabled for this environment, so this screen remains read-only.",
      };
    case "missing_auth":
      return {
        code,
        tone: "warning",
        message:
          "Sign in before recording RSVP, check-in, attendance, or points.",
      };
    case "profile_not_found":
    case "membership_required":
    case "event_not_found":
    case "permission_denied":
    case "server_error":
      return {
        code,
        tone: "warning",
        message:
          "The app could not safely record this event-loop step. No RSVP, attendance, points, Luma, or external provider write ran.",
      };
    case "event_closed":
      return {
        code,
        tone: "warning",
        message:
          "This event is completed or canceled. Member RSVP and check-in are closed, so no attendance or points write ran.",
      };
    case "rsvp_cancel_blocked_checked_in":
      return {
        code,
        tone: "warning",
        message:
          "RSVP cancellation is locked after check-in because attendance and points are already recorded.",
      };
    default:
      return null;
  }
}

async function resolveMemberEventWriteContext(
  client: SupabaseServiceClient,
  input: RecordMemberEventLoopInput,
): Promise<MemberEventWriteContext> {
  const profile = await resolveActorProfile(client, input.actorUserId, input.actorEmail);

  if (profile?.status !== "active") {
    return {
      success: false,
      result: failure(
        "profile_not_found",
        input.routeEventId,
        "The signed-in user does not have an active myMEDLIFE profile, so no RSVP, attendance, or points rows were recorded.",
      ),
    };
  }

  const membership = await resolveActorMembership(client, profile.id);

  if (!membership) {
    return {
      success: false,
      result: failure(
        "membership_required",
        input.routeEventId,
        "The signed-in user needs an approved chapter membership before RSVP, attendance, or points can be recorded.",
      ),
    };
  }

  const campaign = await resolveActiveCampaign(client, membership.chapter_id);
  const event = await resolveOrCreateEvent(client, {
    routeEventId: input.routeEventId,
    profileId: profile.id,
    chapterId: membership.chapter_id,
    campaignId: campaign?.id ?? null,
  });

  if (!event) {
    return {
      success: false,
      result: failure(
        "event_not_found",
        input.routeEventId,
        "The event could not be found or safely materialized, so no event-loop write ran.",
      ),
    };
  }

  if (event.chapter_id !== membership.chapter_id) {
    return {
      success: false,
      result: failure(
        "permission_denied",
        input.routeEventId,
        "The signed-in member cannot write RSVP, attendance, or points rows for a different chapter.",
      ),
    };
  }

  if (isMemberEventClosedStatus(event.status)) {
    return {
      success: false,
      result: failure(
        "event_closed",
        input.routeEventId,
        "This event is completed or canceled, so member RSVP, cancellation, check-in, attendance, and points writes are closed.",
      ),
    };
  }

  return { success: true, profile, event, campaign };
}

async function resolveActorProfile(
  client: SupabaseServiceClient,
  actorUserId: string,
  actorEmail: string,
): Promise<ProfileRow | null> {
  const byId = await client
    .schema("app")
    .from("profiles")
    .select("id,display_name,email,status")
    .eq("id", actorUserId)
    .maybeSingle<ProfileRow>();

  if (byId.data && !byId.error) {
    return byId.data;
  }

  const byEmail = await client
    .schema("app")
    .from("profiles")
    .select("id,display_name,email,status")
    .ilike("email", actorEmail)
    .maybeSingle<ProfileRow>();

  return byEmail.data && !byEmail.error ? byEmail.data : null;
}

async function resolveActorMembership(
  client: SupabaseServiceClient,
  profileId: string,
): Promise<MembershipRow | null> {
  const result = await client
    .schema("app")
    .from("memberships")
    .select("id,chapter_id,role_key,status")
    .eq("user_id", profileId)
    .eq("status", "approved")
    .order("approved_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle<MembershipRow>();

  return result.data && !result.error ? result.data : null;
}

async function resolveActiveCampaign(
  client: SupabaseServiceClient,
  chapterId: string,
): Promise<CampaignRow | null> {
  const active = await client
    .schema("app")
    .from("campaigns")
    .select("id,chapter_id,status")
    .eq("chapter_id", chapterId)
    .eq("status", "active")
    .order("opened_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle<CampaignRow>();

  if (active.data && !active.error) {
    return active.data;
  }

  const fallback = await client
    .schema("app")
    .from("campaigns")
    .select("id,chapter_id,status")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CampaignRow>();

  return fallback.data && !fallback.error ? fallback.data : null;
}

async function resolveOrCreateEvent(
  client: SupabaseServiceClient,
  input: {
    routeEventId: string;
    profileId: string;
    chapterId: string;
    campaignId: string | null;
  },
): Promise<ChapterEventRow | null> {
  if (isUuid(input.routeEventId)) {
    const existing = await client
      .schema("app")
      .from("chapter_events")
      .select("id,chapter_id,campaign_id,title,status,attendance_count")
      .eq("id", input.routeEventId)
      .maybeSingle<ChapterEventRow>();

    return existing.data && !existing.error ? existing.data : null;
  }

  const template =
    testEventRouteAliases.get(input.routeEventId) ??
    testEventRouteAliases.get("chapter-event-ucla-kickoff");

  if (!template) {
    return null;
  }

  const existing = await client
    .schema("app")
    .from("chapter_events")
    .select("id,chapter_id,campaign_id,title,status,attendance_count")
    .eq("chapter_id", input.chapterId)
    .eq("title", template.title)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ChapterEventRow>();

  if (existing.data && !existing.error) {
    return existing.data;
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const created = await client
    .schema("app")
    .from("chapter_events")
    .insert({
      chapter_id: input.chapterId,
      campaign_id: input.campaignId,
      title: template.title,
      event_type: template.eventType,
      status: "published",
      planned_by_user_id: input.profileId,
      owner_user_id: input.profileId,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      promotion_summary: template.promotionSummary,
      attendance_count: 0,
      eligible_member_count: 1,
      attendance_rate: 0,
      warehouse_status: "disabled",
    })
    .select("id,chapter_id,campaign_id,title,status,attendance_count")
    .single<ChapterEventRow>();

  return created.data && !created.error ? created.data : null;
}

async function recordRsvp(
  client: SupabaseServiceClient,
  input: {
    event: ChapterEventRow;
    profile: ProfileRow;
    campaignId: string | null;
    operation: MemberEventLoopOperation;
  },
) {
  const latestIntent = await resolveLatestRsvpIntent(client, input.event.id, input.profile.id);

  if (latestIntent?.event_type === "event_rsvp_recorded") {
    return { created: false };
  }

  const inserted = await client
    .schema("app")
    .from("events")
    .insert({
      event_type: "event_rsvp_recorded",
      actor_user_id: input.profile.id,
      chapter_id: input.event.chapter_id,
      campaign_id: input.campaignId,
      chapter_event_id: input.event.id,
      payload: {
        source: "member_event_loop",
        operation: input.operation,
        userId: input.profile.id,
        userEmail: input.profile.email,
        liveExternalWrite: false,
      },
      correlation_id: `member_event_loop:rsvp:${input.event.id}:${input.profile.id}`,
    });

  if (inserted.error) {
    throw new Error(`RSVP insert failed: ${inserted.error.message}`);
  }

  return { created: true };
}

async function cancelRsvp(
  client: SupabaseServiceClient,
  input: {
    event: ChapterEventRow;
    profile: ProfileRow;
    campaignId: string | null;
  },
): Promise<MemberEventLoopWriteResult> {
  const existingPoints = await client
    .schema("app")
    .from("points_events")
    .select("id,awarded_to_user_id,points_delta")
    .eq("chapter_event_id", input.event.id)
    .eq("awarded_to_user_id", input.profile.id)
    .limit(1)
    .maybeSingle<PointsEventRow>();

  if (existingPoints.data && !existingPoints.error) {
    return failure(
      "rsvp_cancel_blocked_checked_in",
      input.event.id,
      "RSVP cancellation is locked after check-in because attendance and points are already recorded.",
    );
  }

  const latestIntent = await resolveLatestRsvpIntent(client, input.event.id, input.profile.id);

  if (latestIntent?.event_type !== "event_rsvp_recorded") {
    return {
      success: true,
      code: "rsvp_cancel_not_found",
      eventId: input.event.id,
      pointsAwarded: 0,
      attendanceCount: input.event.attendance_count ?? 0,
      externalWritesEnabled: false,
      plainEnglishMessage:
        "No active RSVP was found for this event. Nothing was canceled.",
    };
  }

  const inserted = await client
    .schema("app")
    .from("events")
    .insert({
      event_type: "event_rsvp_cancelled",
      actor_user_id: input.profile.id,
      chapter_id: input.event.chapter_id,
      campaign_id: input.campaignId,
      chapter_event_id: input.event.id,
      payload: {
        source: "member_event_loop",
        operation: "cancel_rsvp",
        userId: input.profile.id,
        userEmail: input.profile.email,
        previousRsvpEventId: latestIntent.id,
        liveExternalWrite: false,
      },
      correlation_id: `member_event_loop:cancel_rsvp:${input.event.id}:${input.profile.id}`,
    });

  if (inserted.error) {
    throw new Error(`RSVP cancellation insert failed: ${inserted.error.message}`);
  }

  return {
    success: true,
    code: "rsvp_cancelled",
    eventId: input.event.id,
    pointsAwarded: 0,
    attendanceCount: input.event.attendance_count ?? 0,
    externalWritesEnabled: false,
    plainEnglishMessage:
      "RSVP canceled in myMEDLIFE. No Luma or external provider write ran.",
  };
}

async function resolveLatestRsvpIntent(
  client: SupabaseServiceClient,
  chapterEventId: string,
  profileId: string,
) {
  const [recorded, cancelled] = await Promise.all([
    resolveLatestRsvpIntentByType(client, chapterEventId, profileId, "event_rsvp_recorded"),
    resolveLatestRsvpIntentByType(client, chapterEventId, profileId, "event_rsvp_cancelled"),
  ]);

  if (!recorded) {
    return cancelled;
  }

  if (!cancelled) {
    return recorded;
  }

  return new Date(recorded.occurred_at).getTime() >= new Date(cancelled.occurred_at).getTime()
    ? recorded
    : cancelled;
}

async function resolveLatestRsvpIntentByType(
  client: SupabaseServiceClient,
  chapterEventId: string,
  profileId: string,
  eventType: "event_rsvp_recorded" | "event_rsvp_cancelled",
) {
  const result = await client
    .schema("app")
    .from("events")
    .select("id,event_type,occurred_at")
    .eq("event_type", eventType)
    .eq("chapter_event_id", chapterEventId)
    .eq("actor_user_id", profileId)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle<RsvpIntentRow>();

  return result.data && !result.error ? result.data : null;
}

async function recordCheckInAndPoints(
  client: SupabaseServiceClient,
  input: {
    event: ChapterEventRow;
    profile: ProfileRow;
    campaignId: string | null;
  },
): Promise<MemberEventLoopWriteResult> {
  const existingPoints = await client
    .schema("app")
    .from("points_events")
    .select("id,awarded_to_user_id,points_delta")
    .eq("chapter_event_id", input.event.id)
    .eq("awarded_to_user_id", input.profile.id)
    .limit(1)
    .maybeSingle<PointsEventRow>();

  if (existingPoints.data && !existingPoints.error) {
    const attendanceCount = await countUniquePointRecipients(client, input.event.id);

    return {
      success: true,
      code: "already_checked_in",
      eventId: input.event.id,
      pointsAwarded: existingPoints.data.points_delta,
      attendanceCount,
      externalWritesEnabled: false,
      plainEnglishMessage:
        "This member was already checked in for the event. Duplicate points were blocked.",
    };
  }

  const pointInsert = await client
    .schema("app")
    .from("points_events")
    .insert({
      chapter_id: input.event.chapter_id,
      campaign_id: input.campaignId,
      assignment_id: null,
      chapter_event_id: input.event.id,
      evidence_item_id: null,
      approval_id: null,
      awarded_to_user_id: input.profile.id,
      points_delta: memberEventLoopPointAward,
      reason: "Attendance confirmed through the production-safe TEST event loop.",
      created_by: input.profile.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (pointInsert.error || !pointInsert.data) {
    return failure(
      "server_error",
      input.event.id,
      "The app could not record the points row, so check-in was not completed.",
    );
  }

  const attendanceCount = await countUniquePointRecipients(client, input.event.id);

  const attendanceEvent = await client
    .schema("app")
    .from("events")
    .insert({
      event_type: "event_attendance_recorded",
      actor_user_id: input.profile.id,
      chapter_id: input.event.chapter_id,
      campaign_id: input.campaignId,
      chapter_event_id: input.event.id,
      payload: {
        source: "member_event_loop",
        checkedInUserId: input.profile.id,
        attendanceCount,
        pointsEventId: pointInsert.data.id,
        pointsDelta: memberEventLoopPointAward,
        duplicatePointsPrevented: true,
        liveExternalWrite: false,
      },
      correlation_id: `member_event_loop:checkin:${input.event.id}:${input.profile.id}`,
    });

  if (attendanceEvent.error) {
    throw new Error(`Attendance event insert failed: ${attendanceEvent.error.message}`);
  }

  const eventUpdate = await client
    .schema("app")
    .from("chapter_events")
    .update({
      status: "feedback_collected",
      attendance_count: attendanceCount,
      attendance_rate: 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.event.id);

  if (eventUpdate.error) {
    throw new Error(`Chapter event attendance update failed: ${eventUpdate.error.message}`);
  }

  return {
    success: true,
    code: "checked_in",
    eventId: input.event.id,
    pointsAwarded: memberEventLoopPointAward,
    attendanceCount,
    externalWritesEnabled: false,
    plainEnglishMessage:
      "Check-in recorded, attendance updated, and points awarded once in myMEDLIFE. No Luma or external provider write ran.",
  };
}

async function countUniquePointRecipients(
  client: SupabaseServiceClient,
  chapterEventId: string,
) {
  const rows = await client
    .schema("app")
    .from("points_events")
    .select("awarded_to_user_id")
    .eq("chapter_event_id", chapterEventId);

  if (rows.error || !rows.data) {
    return 0;
  }

  return new Set(
    rows.data
      .map((row) => row.awarded_to_user_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  ).size;
}

function getEnvironment(env: EnvSource): MemberEventLoopEnvironment {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") return "production";
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") return "staging";
  return "local";
}

function getApprovalFlag(environment: MemberEventLoopEnvironment, env: EnvSource) {
  if (environment === "production") {
    return env.MYMEDLIFE_ALLOW_PRODUCTION_MEMBER_EVENT_LOOP_WRITE;
  }

  if (environment === "staging") {
    return env.MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES;
  }

  return env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES;
}

function disabled(
  environment: MemberEventLoopEnvironment,
  reason: string,
): MemberEventLoopWriteConfig {
  return {
    enabled: false,
    environment,
    externalWritesEnabled: false,
    reason,
  };
}

function failure(
  code: Extract<MemberEventLoopWriteResult, { success: false }>["code"],
  eventId: string,
  plainEnglishMessage: string,
): MemberEventLoopWriteResult {
  return {
    success: false,
    code,
    eventId,
    externalWritesEnabled: false,
    plainEnglishMessage,
  };
}

function capitalize(value: string) {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

function isAtomicSuccessCode(
  code: string,
): code is Extract<MemberEventLoopWriteResult, { success: true }>["code"] | "rsvp_cancel_blocked_checked_in" {
  return [
    "rsvp_recorded",
    "already_rsvpd",
    "rsvp_cancelled",
    "rsvp_cancel_not_found",
    "checked_in",
    "already_checked_in",
    "rsvp_cancel_blocked_checked_in",
  ].includes(code);
}

function mapAtomicWriteError(message: string | undefined, eventId: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("membership")) {
    return failure(
      "membership_required",
      eventId,
      "The signed-in user needs an approved membership in this event's chapter.",
    );
  }

  if (normalized.includes("closed")) {
    return failure(
      "event_closed",
      eventId,
      "This event is completed or canceled, so member event-loop writes are closed.",
    );
  }

  if (normalized.includes("profile") || normalized.includes("not found")) {
    return failure(
      "profile_not_found",
      eventId,
      "The active member profile or event could not be found.",
    );
  }

  return failure(
    "server_error",
    eventId,
    "The transactional event-loop write failed, so no partial completion was claimed.",
  );
}
