import {
  createSupabaseAppClient,
  type SupabaseAppClient,
} from "@/lib/supabase-app-client";
import type { LumaEventUpsertInput, LumaImportedAttendanceRawRow, LumaLivePilotResult, LumaRsvpWriteInput } from "@/services/luma-live-pilot";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";
import type {
  AuditLogRow,
  AutomationOutboxRow,
  EventRow,
  IntegrationEventRow,
  PointsEventRow,
  ProfileRow,
} from "@/shared/types/persistence";

type ChapterEventStatus =
  | "idea"
  | "planning"
  | "published"
  | "promoting"
  | "completed"
  | "feedback_collected"
  | "shared"
  | "canceled";

type ExternalSyncStatus =
  | "not_linked"
  | "linked"
  | "mocked"
  | "pending"
  | "failed"
  | "disabled";

type ChapterEventRow = {
  id: string;
  chapter_id: string;
  campaign_id: string | null;
  phase_id: string | null;
  action_committee_id: string | null;
  assignment_id: string | null;
  title: string;
  event_type: string;
  status: ChapterEventStatus;
  planned_by_user_id: string | null;
  owner_user_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  promotion_summary: string | null;
  attendance_count: number | null;
  eligible_member_count: number | null;
  attendance_rate: number | null;
  nps_score: number | null;
  feedback_summary: string | null;
  warehouse_status: ExternalSyncStatus;
  luma_event_link_id: string | null;
  created_at: string;
  updated_at: string;
};

type LumaEventLinkRow = {
  id: string;
  chapter_id: string;
  campaign_id: string | null;
  phase_id: string | null;
  chapter_event_id: string | null;
  luma_event_id: string | null;
  luma_event_url: string | null;
  status: ExternalSyncStatus;
  linked_by: string | null;
  linked_at: string | null;
  last_imported_at: string | null;
  created_at: string;
  updated_at: string;
};

type PersistenceDependencies = {
  createClient?: typeof createSupabaseAppClient;
  getData?: typeof getReadOnlyAppData;
  now?: () => string;
};

type PilotContext = {
  client: SupabaseAppClient;
  data: ReadOnlyAppData;
  chapterId: string;
  campaignId: string;
  phaseId: string | null;
};

const pilotSource = "luma_live_pilot";

export type LumaPilotPersistenceResult = {
  chapterEventId: string;
  lumaEventLinkId: string;
  eventId: string;
  auditLogId: string;
  pointsCreated: number;
  attendanceCount: number;
  rsvpRecorded: boolean;
};

export async function persistLumaEventUpsertProof(
  input: {
    actor: LocalActorContext;
    request: LumaEventUpsertInput;
    result: LumaLivePilotResult;
  },
  deps: PersistenceDependencies = {},
): Promise<LumaPilotPersistenceResult> {
  const context = await loadPilotContext(deps);
  const now = getNow(deps);
  const eventId = requireEventId(input.result);
  const correlationId = `luma-pilot:event:${eventId}:${now}`;
  const existingLink = await findLumaEventLink(context.client, eventId);
  const existingEvent = existingLink?.chapter_event_id
    ? await findChapterEventById(context.client, existingLink.chapter_event_id)
    : null;

  const chapterEvent = existingEvent
    ? await updateChapterEvent(context.client, existingEvent.id, {
        title: input.request.name,
        starts_at: input.request.startAt,
        ends_at: input.request.endAt ?? null,
        status: "published",
        promotion_summary: "Published from the myMEDLIFE staging Luma pilot.",
        owner_user_id: input.actor.user.id,
        planned_by_user_id: input.actor.user.id,
      })
    : await createChapterEvent(context.client, {
        chapter_id: context.chapterId,
        campaign_id: context.campaignId,
        phase_id: context.phaseId,
        action_committee_id: null,
        assignment_id: null,
        title: input.request.name,
        event_type: "luma_event",
        status: "published",
        planned_by_user_id: input.actor.user.id,
        owner_user_id: input.actor.user.id,
        starts_at: input.request.startAt,
        ends_at: input.request.endAt ?? null,
        promotion_summary: "Published from the myMEDLIFE staging Luma pilot.",
        attendance_count: null,
        eligible_member_count: null,
        attendance_rate: null,
        nps_score: null,
        feedback_summary: null,
        warehouse_status: "disabled",
      });

  const link = existingLink
    ? await updateLumaEventLink(context.client, existingLink.id, {
        chapter_event_id: chapterEvent.id,
        luma_event_url: input.result.eventUrl,
        status: "linked",
        linked_by: input.actor.user.id,
        linked_at: now,
      })
    : await createLumaEventLink(context.client, {
        chapter_id: context.chapterId,
        campaign_id: context.campaignId,
        phase_id: context.phaseId,
        chapter_event_id: chapterEvent.id,
        luma_event_id: eventId,
        luma_event_url: input.result.eventUrl,
        status: "linked",
        linked_by: input.actor.user.id,
        linked_at: now,
        last_imported_at: null,
      });

  if (chapterEvent.luma_event_link_id !== link.id) {
    await updateChapterEvent(context.client, chapterEvent.id, {
      luma_event_link_id: link.id,
    });
  }

  const eventRow = await createEventRow(context.client, {
    event_type: "luma_event_upserted",
    actor_user_id: input.actor.user.id,
    chapter_id: context.chapterId,
    campaign_id: context.campaignId,
    assignment_id: null,
    chapter_event_id: chapterEvent.id,
    payload: {
      source: pilotSource,
      operation: input.result.operation,
      lumaEventId: eventId,
      lumaEventUrl: input.result.eventUrl,
      notificationsSuppressed: Boolean(input.request.eventId),
    },
    correlation_id: correlationId,
    occurred_at: now,
  });

  await createIntegrationEventRow(context.client, {
    source_event_id: eventRow.id,
    chapter_id: context.chapterId,
    event_type: "luma_event_linked",
    destination: "luma",
    external_object_type: "event",
    external_object_id: eventId,
    status: "recorded",
    payload: {
      source: pilotSource,
      operation: input.result.operation,
      lumaEventUrl: input.result.eventUrl,
    },
    created_by: input.actor.user.id,
  });

  await createIntegrationEventRow(context.client, {
    source_event_id: eventRow.id,
    chapter_id: context.chapterId,
    event_type: "event_shared_to_feed",
    destination: "internal",
    external_object_type: "chapter_event",
    external_object_id: chapterEvent.id,
    status: "recorded",
    payload: {
      source: pilotSource,
      channel: "member_event_feed",
    },
    created_by: input.actor.user.id,
  });

  await createOutboxRow(context.client, {
    source_event_id: eventRow.id,
    integration_event_id: null,
    chapter_id: context.chapterId,
    destination: "n8n",
    event_type: "luma_event_external_send_blocked",
    payload: {
      source: pilotSource,
      blockedDestination: "n8n",
      reason: "Luma pilot does not enable downstream automation.",
    },
    idempotency_key: `luma-pilot:event:${eventId}:blocked:${now}`,
    status: "disabled",
  });

  const auditLog = await createAuditLog(context.client, {
    actor_user_id: input.actor.user.id,
    chapter_id: context.chapterId,
    action: "luma_event_upsert_recorded",
    target_table: "luma_event_links",
    target_id: link.id,
    before_value: {
      source: pilotSource,
      previousLinkId: existingLink?.id ?? null,
      previousChapterEventId: existingLink?.chapter_event_id ?? null,
    },
    after_value: {
      source: pilotSource,
      chapterEventId: chapterEvent.id,
      lumaEventId: eventId,
      lumaEventUrl: input.result.eventUrl,
      operation: input.result.operation,
    },
    reason: "Recorded the staging Luma event proof in app tables.",
  });

  return {
    chapterEventId: chapterEvent.id,
    lumaEventLinkId: link.id,
    eventId,
    auditLogId: auditLog.id,
    pointsCreated: 0,
    attendanceCount: 0,
    rsvpRecorded: false,
  };
}

export async function persistLumaRsvpProof(
  input: {
    actor: LocalActorContext;
    request: LumaRsvpWriteInput;
    result: LumaLivePilotResult;
  },
  deps: PersistenceDependencies = {},
): Promise<LumaPilotPersistenceResult> {
  const context = await loadPilotContext(deps);
  const now = getNow(deps);
  const eventId = requireEventId(input.result, input.request.eventId);
  const link = await requireLumaEventLink(context.client, eventId);
  const chapterEventId = requireLinkedChapterEventId(link);
  const existingEventRows = await context.client.selectRows<EventRow>("events", {
    select: "id,event_type,actor_user_id,chapter_id,campaign_id,assignment_id,chapter_event_id,payload,correlation_id,occurred_at,created_at",
    query: {
      chapter_event_id: `eq.${chapterEventId}`,
      event_type: "eq.event_rsvp_recorded",
    },
  });
  const matchingProfile = findProfileByEmail(context.data.profiles, input.request.email);
  const alreadyRecorded = existingEventRows.some((row) => {
    const payload = asRecord(row.payload);
    return (
      payload.userEmail === input.request.email ||
      (matchingProfile && payload.userId === matchingProfile.id)
    );
  });

  if (alreadyRecorded) {
    return {
      chapterEventId,
      lumaEventLinkId: link.id,
      eventId,
      auditLogId: "existing-rsvp-proof",
      pointsCreated: 0,
      attendanceCount: 0,
      rsvpRecorded: false,
    };
  }

  const eventRow = await createEventRow(context.client, {
    event_type: "event_rsvp_recorded",
    actor_user_id: matchingProfile?.id ?? input.actor.user.id,
    chapter_id: context.chapterId,
    campaign_id: context.campaignId,
    assignment_id: null,
    chapter_event_id: chapterEventId,
    payload: {
      source: pilotSource,
      userId: matchingProfile?.id ?? null,
      userEmail: input.request.email,
      userEmailHint: maskEmail(input.request.email),
      lumaEventId: eventId,
      rsvpCount: 1,
    },
    correlation_id: `luma-pilot:rsvp:${eventId}:${matchingProfile?.id ?? maskEmail(input.request.email)}`,
    occurred_at: now,
  });

  const integrationEvent = await createIntegrationEventRow(context.client, {
    source_event_id: eventRow.id,
    chapter_id: context.chapterId,
    event_type: "luma_rsvp_recorded",
    destination: "luma",
    external_object_type: "guest",
    external_object_id: eventId,
    status: "recorded",
    payload: {
      source: pilotSource,
      userEmailHint: maskEmail(input.request.email),
    },
    created_by: input.actor.user.id,
  });

  await createOutboxRow(context.client, {
    source_event_id: eventRow.id,
    integration_event_id: integrationEvent.id,
    chapter_id: context.chapterId,
    destination: "n8n",
    event_type: "luma_rsvp_external_send_blocked",
    payload: {
      source: pilotSource,
      blockedDestination: "n8n",
      reason: "RSVP writeback does not open downstream sends in the pilot.",
    },
    idempotency_key: `luma-pilot:rsvp:${eventId}:${matchingProfile?.id ?? maskEmail(input.request.email)}`,
    status: "disabled",
  });

  const auditLog = await createAuditLog(context.client, {
    actor_user_id: input.actor.user.id,
    chapter_id: context.chapterId,
    action: "luma_rsvp_recorded",
    target_table: "luma_event_links",
    target_id: link.id,
    before_value: {
      source: pilotSource,
      userEmailHint: maskEmail(input.request.email),
      recorded: false,
    },
    after_value: {
      source: pilotSource,
      userId: matchingProfile?.id ?? null,
      userEmailHint: maskEmail(input.request.email),
      lumaEventId: eventId,
      recorded: true,
    },
    reason: "Recorded the staging Luma RSVP proof in app tables.",
  });

  return {
    chapterEventId,
    lumaEventLinkId: link.id,
    eventId,
    auditLogId: auditLog.id,
    pointsCreated: 0,
    attendanceCount: 0,
    rsvpRecorded: true,
  };
}

export async function persistLumaAttendanceImportProof(
  input: {
    actor: LocalActorContext;
    eventId: string;
    result: LumaLivePilotResult;
    attendanceRows: LumaImportedAttendanceRawRow[];
  },
  deps: PersistenceDependencies = {},
): Promise<LumaPilotPersistenceResult> {
  const context = await loadPilotContext(deps);
  const now = getNow(deps);
  const link = await requireLumaEventLink(context.client, input.eventId);
  const chapterEventId = requireLinkedChapterEventId(link);
  const chapterEvent = await findChapterEventById(context.client, chapterEventId);

  if (!chapterEvent) {
    throw new Error("The linked chapter event could not be found for this Luma attendance import.");
  }

  const attendedRows = input.attendanceRows.filter((row) => row.attended);
  const matchingProfiles = new Map(
    context.data.profiles
      .filter((profile) =>
        attendedRows.some((row) => normalizeEmail(row.email) === normalizeEmail(profile.email)))
      .map((profile) => [normalizeEmail(profile.email), profile]),
  );
  const existingPointsRows = await context.client.selectRows<PointsEventRow>("points_events", {
    select: "id,chapter_id,campaign_id,assignment_id,chapter_event_id,evidence_item_id,approval_id,awarded_to_user_id,points_delta,reason,created_by,created_at",
    query: {
      chapter_event_id: `eq.${chapterEventId}`,
    },
  });
  const existingAwardedUserIds = new Set(
    existingPointsRows.map((row) => row.awarded_to_user_id),
  );
  const nextPointsRows = attendedRows.flatMap((row) => {
    const profile = row.email ? matchingProfiles.get(normalizeEmail(row.email)) : undefined;

    if (!profile || existingAwardedUserIds.has(profile.id)) {
      return [];
    }

    return [
      {
        chapter_id: context.chapterId,
        campaign_id: context.campaignId,
        assignment_id: null,
        chapter_event_id: chapterEventId,
        evidence_item_id: null,
        approval_id: null,
        awarded_to_user_id: profile.id,
        points_delta: 20,
        reason: `Luma pilot attendance confirmed for ${chapterEvent.title}`,
        created_by: input.actor.user.id,
      },
    ];
  });

  if (nextPointsRows.length > 0) {
    await context.client.insertRows<PointsEventRow>("points_events", nextPointsRows);
  }

  await updateChapterEvent(context.client, chapterEventId, {
    attendance_count: attendedRows.length,
    status: attendedRows.length > 0 ? "completed" : chapterEvent.status,
  });

  await updateLumaEventLink(context.client, link.id, {
    last_imported_at: now,
    status: "linked",
  });

  const eventRow = await createEventRow(context.client, {
    event_type: "event_attendance_recorded",
    actor_user_id: input.actor.user.id,
    chapter_id: context.chapterId,
    campaign_id: context.campaignId,
    assignment_id: null,
    chapter_event_id: chapterEventId,
    payload: {
      source: pilotSource,
      lumaEventId: input.eventId,
      attendanceCount: attendedRows.length,
      importedGuestCount: input.attendanceRows.length,
      matchedUserCount: nextPointsRows.length,
      pointsCreatedCount: nextPointsRows.length,
    },
    correlation_id: `luma-pilot:attendance:${input.eventId}:${now}`,
    occurred_at: now,
  });

  const integrationEvent = await createIntegrationEventRow(context.client, {
    source_event_id: eventRow.id,
    chapter_id: context.chapterId,
    event_type: "luma_attendance_imported",
    destination: "luma",
    external_object_type: "event",
    external_object_id: input.eventId,
    status: "recorded",
    payload: {
      source: pilotSource,
      importedGuestCount: input.attendanceRows.length,
      attendanceCount: attendedRows.length,
    },
    created_by: input.actor.user.id,
  });

  await createOutboxRow(context.client, {
    source_event_id: eventRow.id,
    integration_event_id: integrationEvent.id,
    chapter_id: context.chapterId,
    destination: "n8n",
    event_type: "luma_attendance_external_send_blocked",
    payload: {
      source: pilotSource,
      blockedDestination: "n8n",
      reason: "Attendance import does not open downstream automation in the pilot.",
    },
    idempotency_key: `luma-pilot:attendance:${input.eventId}:${now}`,
    status: "disabled",
  });

  const auditLog = await createAuditLog(context.client, {
    actor_user_id: input.actor.user.id,
    chapter_id: context.chapterId,
    action: "luma_attendance_import_recorded",
    target_table: "chapter_events",
    target_id: chapterEventId,
    before_value: {
      source: pilotSource,
      attendanceCount: chapterEvent.attendance_count,
    },
    after_value: {
      source: pilotSource,
      attendanceCount: attendedRows.length,
      importedGuestCount: input.attendanceRows.length,
      pointsCreatedCount: nextPointsRows.length,
    },
    reason: "Recorded the staging Luma attendance proof in app tables.",
  });

  return {
    chapterEventId,
    lumaEventLinkId: link.id,
    eventId: input.eventId,
    auditLogId: auditLog.id,
    pointsCreated: nextPointsRows.length,
    attendanceCount: attendedRows.length,
    rsvpRecorded: false,
  };
}

async function loadPilotContext(
  deps: PersistenceDependencies,
): Promise<PilotContext> {
  const createClient = deps.createClient ?? createSupabaseAppClient;
  const getData = deps.getData ?? getReadOnlyAppData;
  const [{ client, persistence }, data] = await Promise.all([
    createClient(),
    getData(),
  ]);

  if (!client || persistence.mode !== "supabase") {
    throw new Error(
      "A signed-in Supabase reviewer session is required before myMEDLIFE can record staging Luma proof rows.",
    );
  }

  if (data.source.mode !== "supabase") {
    throw new Error("Staging Luma proof requires Supabase-backed read data, but the app is still using mock fallback.");
  }

  const activePhase =
    data.phases.find((phase) => phase.status === "active") ?? data.phases[0] ?? null;

  return {
    client,
    data,
    chapterId: data.chapter.id,
    campaignId: data.campaign.id,
    phaseId: activePhase?.id ?? null,
  };
}

async function findLumaEventLink(
  client: SupabaseAppClient,
  lumaEventId: string,
): Promise<LumaEventLinkRow | null> {
  const rows = await client.selectRows<LumaEventLinkRow>("luma_event_links", {
    select:
      "id,chapter_id,campaign_id,phase_id,chapter_event_id,luma_event_id,luma_event_url,status,linked_by,linked_at,last_imported_at,created_at,updated_at",
    query: {
      luma_event_id: `eq.${lumaEventId}`,
    },
    limit: 1,
  });

  return rows[0] ?? null;
}

async function requireLumaEventLink(
  client: SupabaseAppClient,
  lumaEventId: string,
): Promise<LumaEventLinkRow> {
  const row = await findLumaEventLink(client, lumaEventId);

  if (!row) {
    throw new Error("Create or update the Luma event first so myMEDLIFE can map the event id to a chapter event.");
  }

  return row;
}

async function findChapterEventById(
  client: SupabaseAppClient,
  id: string,
): Promise<ChapterEventRow | null> {
  const rows = await client.selectRows<ChapterEventRow>("chapter_events", {
    select:
      "id,chapter_id,campaign_id,phase_id,action_committee_id,assignment_id,title,event_type,status,planned_by_user_id,owner_user_id,starts_at,ends_at,promotion_summary,attendance_count,eligible_member_count,attendance_rate,nps_score,feedback_summary,warehouse_status,luma_event_link_id,created_at,updated_at",
    query: {
      id: `eq.${id}`,
    },
    limit: 1,
  });

  return rows[0] ?? null;
}

async function createChapterEvent(
  client: SupabaseAppClient,
  values: Omit<ChapterEventRow, "id" | "created_at" | "updated_at" | "luma_event_link_id">,
): Promise<ChapterEventRow> {
  const rows = await client.insertRows<ChapterEventRow>("chapter_events", [
    {
      ...values,
    },
  ], {
    select:
      "id,chapter_id,campaign_id,phase_id,action_committee_id,assignment_id,title,event_type,status,planned_by_user_id,owner_user_id,starts_at,ends_at,promotion_summary,attendance_count,eligible_member_count,attendance_rate,nps_score,feedback_summary,warehouse_status,luma_event_link_id,created_at,updated_at",
  });

  const row = rows[0];

  if (!row) {
    throw new Error("Supabase did not return the created chapter event row.");
  }

  return row;
}

async function updateChapterEvent(
  client: SupabaseAppClient,
  id: string,
  values: Partial<ChapterEventRow>,
): Promise<ChapterEventRow> {
  const rows = await client.updateRows<ChapterEventRow>("chapter_events", values, {
    select:
      "id,chapter_id,campaign_id,phase_id,action_committee_id,assignment_id,title,event_type,status,planned_by_user_id,owner_user_id,starts_at,ends_at,promotion_summary,attendance_count,eligible_member_count,attendance_rate,nps_score,feedback_summary,warehouse_status,luma_event_link_id,created_at,updated_at",
    query: {
      id: `eq.${id}`,
    },
  });

  const row = rows[0];

  if (!row) {
    throw new Error("Supabase did not return the updated chapter event row.");
  }

  return row;
}

async function createLumaEventLink(
  client: SupabaseAppClient,
  values: Omit<LumaEventLinkRow, "id" | "created_at" | "updated_at">,
): Promise<LumaEventLinkRow> {
  const rows = await client.insertRows<LumaEventLinkRow>("luma_event_links", [
    values,
  ], {
    select:
      "id,chapter_id,campaign_id,phase_id,chapter_event_id,luma_event_id,luma_event_url,status,linked_by,linked_at,last_imported_at,created_at,updated_at",
  });
  const row = rows[0];

  if (!row) {
    throw new Error("Supabase did not return the created Luma link row.");
  }

  return row;
}

async function updateLumaEventLink(
  client: SupabaseAppClient,
  id: string,
  values: Partial<LumaEventLinkRow>,
): Promise<LumaEventLinkRow> {
  const rows = await client.updateRows<LumaEventLinkRow>("luma_event_links", values, {
    select:
      "id,chapter_id,campaign_id,phase_id,chapter_event_id,luma_event_id,luma_event_url,status,linked_by,linked_at,last_imported_at,created_at,updated_at",
    query: {
      id: `eq.${id}`,
    },
  });
  const row = rows[0];

  if (!row) {
    throw new Error("Supabase did not return the updated Luma link row.");
  }

  return row;
}

async function createEventRow(
  client: SupabaseAppClient,
  values: Omit<EventRow, "id" | "created_at">,
): Promise<EventRow> {
  const rows = await client.insertRows<EventRow>("events", [values], {
    select:
      "id,event_type,actor_user_id,chapter_id,campaign_id,assignment_id,chapter_event_id,payload,correlation_id,occurred_at,created_at",
  });
  const row = rows[0];

  if (!row) {
    throw new Error("Supabase did not return the created event row.");
  }

  return row;
}

async function createIntegrationEventRow(
  client: SupabaseAppClient,
  values: Omit<IntegrationEventRow, "id" | "created_at" | "updated_at">,
): Promise<IntegrationEventRow> {
  const rows = await client.insertRows<IntegrationEventRow>("integration_events", [values], {
    select:
      "id,source_event_id,chapter_id,event_type,destination,external_object_type,external_object_id,status,payload,created_by,created_at,updated_at",
  });
  const row = rows[0];

  if (!row) {
    throw new Error("Supabase did not return the created integration event row.");
  }

  return row;
}

async function createOutboxRow(
  client: SupabaseAppClient,
  values: Omit<AutomationOutboxRow, "id" | "attempt_count" | "available_at" | "locked_at" | "sent_at" | "last_error" | "created_at" | "updated_at">,
): Promise<void> {
  await client.insertRows("automation_outbox", [values], {
    select: "id",
  });
}

async function createAuditLog(
  client: SupabaseAppClient,
  values: Omit<AuditLogRow, "id" | "created_at">,
): Promise<AuditLogRow> {
  const rows = await client.insertRows<AuditLogRow>("audit_logs", [values], {
    select:
      "id,actor_user_id,chapter_id,action,target_table,target_id,before_value,after_value,reason,created_at",
  });
  const row = rows[0];

  if (!row) {
    throw new Error("Supabase did not return the created audit log row.");
  }

  return row;
}

function requireEventId(result: LumaLivePilotResult, fallback?: string): string {
  const value = result.eventId ?? fallback;

  if (!value) {
    throw new Error("Luma returned no event id, so myMEDLIFE could not record the staging proof rows.");
  }

  return value;
}

function requireLinkedChapterEventId(link: LumaEventLinkRow): string {
  if (!link.chapter_event_id) {
    throw new Error("The staged Luma event is missing its chapter-event link inside myMEDLIFE.");
  }

  return link.chapter_event_id;
}

function findProfileByEmail(
  profiles: ProfileRow[],
  email: string,
): ProfileRow | null {
  const normalized = normalizeEmail(email);
  return profiles.find((profile) => normalizeEmail(profile.email) === normalized) ?? null;
}

function normalizeEmail(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function maskEmail(email: string): string {
  const normalized = normalizeEmail(email);
  const [localPart, domainPart = "unknown"] = normalized.split("@");
  const safePrefix = localPart.slice(0, 2) || "us";
  return `${safePrefix}***@${domainPart}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getNow(deps: PersistenceDependencies): string {
  return (deps.now ?? (() => new Date().toISOString()))();
}
