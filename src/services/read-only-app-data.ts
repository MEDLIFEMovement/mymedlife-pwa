import {
  assignments as mockAssignments,
  evidenceItems as mockEvidenceItems,
  integrationEvents,
  kpiEventRows as mockKpiEventRows,
  mockCampaign,
  mockChapter,
  outboxItems,
  pointsEventRows as mockPointsEventRows,
} from "@/data/mock-rush-month";
import {
  createSupabaseReadonlyAccess,
  type SupabaseReadonlyClient,
} from "@/lib/supabase-readonly";
import { readChapterLumaCalendarRows } from "@/services/chapter-luma-calendar-store";
import {
  buildEventPointsLedger,
  type EventMetricsPosture,
} from "@/services/event-loop";
import type {
  Assignment,
  Campaign,
  Chapter,
  ChapterRole,
  EvidenceItem,
  IntegrationEvent,
  KPIEvent,
  KpiSummary,
  OutboxItem,
  PointsEvent,
  PointsSummary,
} from "@/shared/types/domain";
import type {
  AuditLogRow,
  AutomationOutboxRow,
  AssignmentRow,
  CampaignCloseoutRow,
  CampaignPhaseTemplateRow,
  CampaignRoleAssignmentRow,
  CampaignRow,
  CampaignTemplateRow,
  ChapterEventRow,
  ChapterLumaCalendarRow,
  ChapterRow,
  EvidenceItemRow,
  EventRow,
  IntegrationDestination,
  IntegrationEventRow,
  IntegrationStatus,
  KpiEventRow,
  LumaEventLinkRow,
  MembershipRow,
  OutboxStatus,
  PhaseReadinessReviewRow,
  PhaseRow,
  PointsEventRow,
  ProfileRow,
  RiskFlagRow,
} from "@/shared/types/persistence";

export type DataSourceMode = "mock" | "supabase";
export type DataSourceStatus =
  | "mock_fallback"
  | "supabase_ready"
  | "supabase_error"
  | "auth_profile_missing"
  | "chapter_access_missing";

export type DataSourceMeta = {
  mode: DataSourceMode;
  status: DataSourceStatus;
  message: string;
};

export type ReadOnlyAppData = {
  source: DataSourceMeta;
  chapter: Chapter;
  campaign: Campaign;
  chapterRows: ChapterRow[];
  campaignRows: CampaignRow[];
  profiles: ProfileRow[];
  memberships: MembershipRow[];
  phases: PhaseRow[];
  assignments: Assignment[];
  campaignTemplates: CampaignTemplateRow[];
  campaignPhaseTemplates: CampaignPhaseTemplateRow[];
  campaignRoleAssignments: CampaignRoleAssignmentRow[];
  readinessReviews: PhaseReadinessReviewRow[];
  riskFlags: RiskFlagRow[];
  closeouts: CampaignCloseoutRow[];
  evidenceItems: EvidenceItem[];
  storyEvidenceRows: EvidenceItemRow[];
  chapterEventRows: ChapterEventRow[];
  lumaEventLinkRows: LumaEventLinkRow[];
  chapterLumaCalendarRows: ChapterLumaCalendarRow[];
  pointsEvents: PointsEvent[];
  kpiEvents: KPIEvent[];
  pointsSummary: PointsSummary;
  kpiSummary: KpiSummary;
  metricsPosture: EventMetricsPosture;
  integrationEvents: IntegrationEvent[];
  outboxItems: OutboxItem[];
  eventRows: EventRow[];
  allEventRows: EventRow[];
  allChapterEventRows: ChapterEventRow[];
  allLumaEventLinkRows: LumaEventLinkRow[];
  allPointsEventRows: PointsEventRow[];
  pointsEventRows: PointsEventRow[];
  kpiEventRows: KpiEventRow[];
  integrationEventRows: IntegrationEventRow[];
  automationOutboxRows: AutomationOutboxRow[];
  auditLogs: AuditLogRow[];
};

export type ReadOnlyAppDataScope = {
  actorUserId?: string | null;
};

type SupabaseReadOnlyAppDataOptions = {
  allowMockFallbackWhenEmpty?: boolean;
};

export async function getReadOnlyAppData(
  scope: ReadOnlyAppDataScope = {},
): Promise<ReadOnlyAppData> {
  const access = await createSupabaseReadonlyAccess();

  if (!access.enabled) {
    if (!access.isLocalOnly) {
      return getUnavailableReadOnlyAppData(access.reason);
    }

    return getMockReadOnlyAppData(access.reason);
  }

  try {
    return await getSupabaseReadOnlyAppData(access.client, access.reason, scope, {
      allowMockFallbackWhenEmpty: access.isLocalOnly,
    });
  } catch (error) {
    if (!access.isLocalOnly) {
      return getUnavailableReadOnlyAppData(
        error instanceof Error
          ? `Operational data could not be read: ${error.message}`
          : "Operational data could not be read.",
      );
    }

    return getMockReadOnlyAppData(
      error instanceof Error
        ? `Supabase read failed, so mock fallback is active: ${error.message}`
        : "Supabase read failed, so mock fallback is active.",
      "supabase_error",
    );
  }
}

export async function getSupabaseReadOnlyAppData(
  client: SupabaseReadonlyClient,
  message = "Reading local Supabase data in read-only mode.",
  scope: ReadOnlyAppDataScope = {},
  options: SupabaseReadOnlyAppDataOptions = {
    allowMockFallbackWhenEmpty: true,
  },
): Promise<ReadOnlyAppData> {
  const snapshot = await readLocalDataSnapshot(client);
  const chapter = selectChapterForActor(snapshot, scope.actorUserId);

  if (!chapter) {
    if (scope.actorUserId) {
      return getUnavailableReadOnlyAppData(
        "No approved active chapter is available for this signed-in user. Contact a myMEDLIFE administrator to verify the profile and chapter membership.",
      );
    }

    if (options.allowMockFallbackWhenEmpty ?? true) {
      return getMockReadOnlyAppData(
        "Supabase returned no chapters, so mock fallback is active.",
      );
    }

    return getUnavailableReadOnlyAppData(
      "Operational data returned no active chapters. Verify the chapter import and access configuration.",
    );
  }

  const persistedCampaign =
    snapshot.campaigns.find(
      (item) => item.chapter_id === chapter.id && item.status === "active",
    ) ?? snapshot.campaigns.find((item) => item.chapter_id === chapter.id);
  const campaign = persistedCampaign ?? buildEmptyCampaignRow(chapter);

  const scoped = buildCampaignScopedData(snapshot, {
    chapterId: chapter.id,
    campaignId: campaign.id,
    campaignTemplateId: campaign.campaign_template_id,
  });

  return {
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: persistedCampaign
        ? message
        : `${message} This chapter has no active campaign, so an honest empty campaign state is active.`,
    },
    chapter: toDomainChapter(chapter),
    campaign: toDomainCampaign(campaign, scoped.phases[0]),
    chapterRows: snapshot.chapters,
    campaignRows: snapshot.campaigns,
    profiles: snapshot.profiles,
    memberships: snapshot.memberships,
    phases: scoped.phases,
    assignments: scoped.assignments,
    campaignTemplates: snapshot.campaignTemplates,
    campaignPhaseTemplates: scoped.campaignPhaseTemplates,
    campaignRoleAssignments: scoped.campaignRoleAssignments,
    readinessReviews: scoped.readinessReviews,
    riskFlags: scoped.riskFlags,
    closeouts: scoped.closeouts,
    evidenceItems: scoped.evidenceItems,
    storyEvidenceRows: snapshot.evidenceItems.filter(isPublishedStoryEvidence),
    chapterEventRows: scoped.chapterEventRows,
    lumaEventLinkRows: scoped.lumaEventLinkRows,
    chapterLumaCalendarRows: snapshot.chapterLumaCalendarRows,
    pointsEvents: scoped.ledger.pointsEvents,
    kpiEvents: scoped.ledger.kpiEvents,
    pointsSummary: scoped.ledger.pointsSummary,
    kpiSummary: scoped.ledger.kpiSummary,
    metricsPosture: scoped.ledger.posture,
    integrationEvents: scoped.integrationEvents,
    outboxItems: scoped.outboxItems,
    eventRows: scoped.eventRows,
    allEventRows: snapshot.eventRows,
    allChapterEventRows: snapshot.chapterEventRows,
    allLumaEventLinkRows: snapshot.lumaEventLinkRows,
    allPointsEventRows: snapshot.pointsEventRows,
    pointsEventRows: scoped.pointsEventRows,
    kpiEventRows: scoped.kpiEventRows,
    integrationEventRows: scoped.integrationEventRows,
    automationOutboxRows: scoped.automationOutboxRows,
    auditLogs: scoped.auditLogs,
  };
}

function buildEmptyCampaignRow(chapter: ChapterRow): CampaignRow {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    chapter_id: chapter.id,
    campaign_template_id: null,
    name: "No active campaign",
    slug: "no-active-campaign",
    objective: "This chapter does not have an active campaign yet.",
    status: "draft",
    semester: null,
    academic_year: null,
    opened_by: null,
    opened_at: null,
    created_at: chapter.created_at,
    updated_at: chapter.updated_at,
  };
}

function selectChapterForActor(
  snapshot: Awaited<ReturnType<typeof readLocalDataSnapshot>>,
  actorUserId: string | null | undefined,
) {
  if (actorUserId) {
    const actorMembership = snapshot.memberships.find(
      (membership) =>
        membership.user_id === actorUserId &&
        membership.status === "approved",
    );
    const actorChapter = actorMembership
      ? snapshot.chapters.find(
          (chapter) =>
            chapter.id === actorMembership.chapter_id && chapter.status === "active",
        )
      : null;

    if (actorChapter) {
      return actorChapter;
    }

    return null;
  }

  return (
    snapshot.chapters.find((chapter) => chapter.status === "active") ??
    snapshot.chapters[0]
  );
}

export async function readLocalDataSnapshot(client: SupabaseReadonlyClient) {
  const [
    profiles,
    memberships,
    chapters,
    campaigns,
    phases,
    assignments,
    campaignTemplates,
    campaignPhaseTemplates,
    campaignRoleAssignments,
    readinessReviews,
    riskFlags,
    closeouts,
    evidenceItems,
    chapterEventRows,
    lumaEventLinkRows,
    chapterLumaCalendarRows,
    eventRows,
    pointsEventRows,
    kpiEventRows,
    integrationEventRows,
    automationOutboxRows,
    auditLogs,
  ] = await Promise.all([
    readProfiles(client),
    readMemberships(client),
    readChapters(client),
    readCampaigns(client),
    readPhases(client),
    readAssignments(client),
    readCampaignTemplates(client),
    readCampaignPhaseTemplates(client),
    readCampaignRoleAssignments(client),
    readReadinessReviews(client),
    readRiskFlags(client),
    readCloseouts(client),
    readEvidenceItems(client),
    readChapterEvents(client),
    readLumaEventLinks(client),
    readChapterLumaCalendarRows(client),
    readEvents(client),
    readPointsEvents(client),
    readKpiEvents(client),
    readIntegrationEvents(client),
    readAutomationOutbox(client),
    readAuditLogs(client),
  ]);

  return {
    profiles,
    memberships,
    chapters,
    campaigns,
    phases,
    assignments,
    campaignTemplates,
    campaignPhaseTemplates,
    campaignRoleAssignments,
    readinessReviews,
    riskFlags,
    closeouts,
    evidenceItems,
    chapterEventRows,
    lumaEventLinkRows,
    chapterLumaCalendarRows,
    eventRows,
    pointsEventRows,
    kpiEventRows,
    integrationEventRows,
    automationOutboxRows,
    auditLogs,
  };
}

export function readProfiles(client: SupabaseReadonlyClient) {
  return client.selectRows<ProfileRow>("profiles", { query: { order: "email.asc" } });
}

export function readMemberships(client: SupabaseReadonlyClient) {
  return client.selectRows<MembershipRow>("memberships", {
    query: { order: "created_at.asc" },
  });
}

export function readChapters(client: SupabaseReadonlyClient) {
  return client.selectRows<ChapterRow>("chapters", { query: { order: "name.asc" } });
}

export function readCampaigns(client: SupabaseReadonlyClient) {
  return client.selectRows<CampaignRow>("campaigns", {
    query: { order: "opened_at.desc.nullslast" },
  });
}

export function readPhases(client: SupabaseReadonlyClient) {
  return client.selectRows<PhaseRow>("phases", { query: { order: "created_at.asc" } });
}

export function readAssignments(client: SupabaseReadonlyClient) {
  return client.selectRows<AssignmentRow>("assignments", {
    query: { order: "created_at.asc" },
  });
}

export function readCampaignTemplates(client: SupabaseReadonlyClient) {
  return client.selectRows<CampaignTemplateRow>("campaign_templates", {
    query: { order: "annual_order.asc.nullslast" },
  });
}

export function readCampaignPhaseTemplates(client: SupabaseReadonlyClient) {
  return client.selectRows<CampaignPhaseTemplateRow>("campaign_phase_templates", {
    query: { order: "phase_order.asc" },
  });
}

export function readCampaignRoleAssignments(client: SupabaseReadonlyClient) {
  return client.selectRows<CampaignRoleAssignmentRow>("campaign_role_assignments", {
    query: { order: "created_at.asc" },
  });
}

export function readReadinessReviews(client: SupabaseReadonlyClient) {
  return client.selectRows<PhaseReadinessReviewRow>("phase_readiness_reviews", {
    query: { order: "reviewed_at.desc" },
  });
}

export function readRiskFlags(client: SupabaseReadonlyClient) {
  return client.selectRows<RiskFlagRow>("risk_flags", {
    query: { order: "created_at.desc" },
  });
}

export function readCloseouts(client: SupabaseReadonlyClient) {
  return client.selectRows<CampaignCloseoutRow>("campaign_closeouts", {
    query: { order: "created_at.desc" },
  });
}

export function readEvidenceItems(client: SupabaseReadonlyClient) {
  return client.selectRows<EvidenceItemRow>("evidence_items", {
    query: { order: "submitted_at.desc.nullslast" },
  });
}

export function readChapterEvents(client: SupabaseReadonlyClient) {
  return client.selectRows<ChapterEventRow>("chapter_events", {
    query: { order: "starts_at.asc.nullslast" },
  });
}

export function readLumaEventLinks(client: SupabaseReadonlyClient) {
  return client.selectRows<LumaEventLinkRow>("luma_event_links", {
    query: { order: "linked_at.desc.nullslast" },
  });
}

export function readEvents(client: SupabaseReadonlyClient) {
  return client.selectRows<EventRow>("events", {
    query: { order: "occurred_at.desc" },
  });
}

export function readPointsEvents(client: SupabaseReadonlyClient) {
  return client.selectRows<PointsEventRow>("points_events", {
    query: { order: "created_at.desc" },
  });
}

export function readKpiEvents(client: SupabaseReadonlyClient) {
  return client.selectRows<KpiEventRow>("kpi_events", {
    query: { order: "created_at.desc" },
  });
}

export function readIntegrationEvents(client: SupabaseReadonlyClient) {
  return client.selectRows<IntegrationEventRow>("integration_events", {
    query: { order: "created_at.desc" },
  });
}

export function readAutomationOutbox(client: SupabaseReadonlyClient) {
  return client.selectRows<AutomationOutboxRow>("automation_outbox", {
    query: { order: "created_at.desc" },
  });
}

export function readAuditLogs(client: SupabaseReadonlyClient) {
  return client.selectRows<AuditLogRow>("audit_logs", {
    query: { order: "created_at.desc" },
  });
}

const mockChapterRows: ChapterRow[] = [
  {
    id: "chapter-northview",
    name: "UCLA MEDLIFE",
    campus: "UCLA",
    region: "West Coast",
    status: "active",
    created_by: "admin-1",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "chapter-lakeside",
    name: "Lakeside MEDLIFE",
    campus: "Lakeside College",
    region: "Northeast",
    status: "active",
    created_by: "admin-1",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "chapter-boston",
    name: "Boston College MEDLIFE",
    campus: "Boston College",
    region: "Northeast",
    status: "active",
    created_by: "admin-1",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "chapter-san-diego",
    name: "UC San Diego MEDLIFE",
    campus: "UC San Diego",
    region: "West Coast",
    status: "active",
    created_by: "admin-1",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "chapter-mcgill",
    name: "McGill MEDLIFE",
    campus: "McGill University",
    region: "Canada",
    status: "active",
    created_by: "admin-1",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
];

const mockCampaignRows: CampaignRow[] = [
  {
    id: "rush-month-2026",
    chapter_id: "chapter-northview",
    campaign_template_id: null,
    name: "Rush Month",
    slug: "rush-month-2026",
    objective: mockCampaign.objective,
    status: "active",
    semester: "Fall",
    academic_year: "2026-2027",
    opened_by: "leader-1",
    opened_at: "2026-06-15T00:00:00Z",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "rush-month-2026-lakeside",
    chapter_id: "chapter-lakeside",
    campaign_template_id: null,
    name: "Rush Month",
    slug: "rush-month-2026-lakeside",
    objective: "Keep a second pilot chapter visible in the org scoreboard.",
    status: "active",
    semester: "Fall",
    academic_year: "2026-2027",
    opened_by: "leader-2",
    opened_at: "2026-06-15T00:00:00Z",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "rush-month-2026-boston",
    chapter_id: "chapter-boston",
    campaign_template_id: null,
    name: "Rush Month",
    slug: "rush-month-2026-boston",
    objective: "Give Boston College a clean event-and-points loop for the first expansion wave.",
    status: "active",
    semester: "Fall",
    academic_year: "2026-2027",
    opened_by: "leader-3",
    opened_at: "2026-06-15T00:00:00Z",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "rush-month-2026-ucsd",
    chapter_id: "chapter-san-diego",
    campaign_template_id: null,
    name: "Rush Month",
    slug: "rush-month-2026-ucsd",
    objective: "Make the UC San Diego pilot event visible before widening the chapter rollout.",
    status: "active",
    semester: "Fall",
    academic_year: "2026-2027",
    opened_by: "leader-4",
    opened_at: "2026-06-15T00:00:00Z",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "rush-month-2026-mcgill",
    chapter_id: "chapter-mcgill",
    campaign_template_id: null,
    name: "Rush Month",
    slug: "rush-month-2026-mcgill",
    objective: "Keep McGill visible in the rollout plan even before the first chapter event is linked.",
    status: "active",
    semester: "Fall",
    academic_year: "2026-2027",
    opened_by: "leader-5",
    opened_at: "2026-06-15T00:00:00Z",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
];

const mockProfileRows: ProfileRow[] = [
  {
    id: "member-a",
    display_name: "Sofia Alvarez",
    email: "member.a@mymedlife.test",
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "committee-member",
    display_name: "Nia Committee",
    email: "committee.member@mymedlife.test",
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "traveler-a",
    display_name: "Taylor Traveler",
    email: "traveler.a@mymedlife.test",
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "member-b",
    display_name: "Maya Lakeside",
    email: "member.b@mymedlife.test",
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "member-c",
    display_name: "Ben Boston",
    email: "member.c@mymedlife.test",
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "member-d",
    display_name: "Uma UCSD",
    email: "member.d@mymedlife.test",
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "member-e",
    display_name: "Eli Boston",
    email: "member.e@mymedlife.test",
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "member-f",
    display_name: "Fiona UCSD",
    email: "member.f@mymedlife.test",
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "member-g",
    display_name: "Gabrielle McGill",
    email: "member.g@mymedlife.test",
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
];

const mockChapterEventRows: ChapterEventRow[] = [
  {
    id: "chapter-event-ucla-kickoff",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    phase_id: null,
    action_committee_id: null,
    assignment_id: "member-push",
    title: "Rush Month kickoff social",
    event_type: "social",
    status: "feedback_collected",
    planned_by_user_id: "leader-1",
    owner_user_id: "member-a",
    starts_at: "2026-11-15T18:00:00Z",
    ends_at: "2026-11-15T20:00:00Z",
    promotion_summary: "RSVP, attendance, and points are all visible from one event.",
    attendance_count: 24,
    eligible_member_count: 80,
    attendance_rate: 0.3,
    nps_score: 72,
    feedback_summary: "Students said the kickoff made MEDLIFE feel welcoming.",
    warehouse_status: "disabled",
    luma_event_link_id: "luma-link-ucla-kickoff",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "chapter-event-lakeside-welcome",
    chapter_id: "chapter-lakeside",
    campaign_id: "rush-month-2026-lakeside",
    phase_id: null,
    action_committee_id: null,
    assignment_id: null,
    title: "Lakeside welcome table",
    event_type: "social",
    status: "published",
    planned_by_user_id: "leader-2",
    owner_user_id: "member-b",
    starts_at: "2026-11-19T16:00:00Z",
    ends_at: "2026-11-19T18:00:00Z",
    promotion_summary: "Lakeside is using the same RSVP, attendance, and points loop as the first pilot chapter.",
    attendance_count: 18,
    eligible_member_count: 54,
    attendance_rate: 0.33,
    nps_score: null,
    feedback_summary: null,
    warehouse_status: "disabled",
    luma_event_link_id: "luma-link-lakeside-welcome",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "chapter-event-boston-info-night",
    chapter_id: "chapter-boston",
    campaign_id: "rush-month-2026-boston",
    phase_id: null,
    action_committee_id: null,
    assignment_id: null,
    title: "Boston kickoff info night",
    event_type: "med_talk",
    status: "feedback_collected",
    planned_by_user_id: "leader-3",
    owner_user_id: "member-c",
    starts_at: "2026-11-18T23:00:00Z",
    ends_at: "2026-11-19T01:00:00Z",
    promotion_summary: "Boston is using the same event, RSVP, attendance, and points loop as UCLA.",
    attendance_count: 12,
    eligible_member_count: 40,
    attendance_rate: 0.3,
    nps_score: 68,
    feedback_summary: "Students said the speaker and chapter stories made the mission concrete.",
    warehouse_status: "disabled",
    luma_event_link_id: "luma-link-boston-info-night",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "chapter-event-ucsd-service-social",
    chapter_id: "chapter-san-diego",
    campaign_id: "rush-month-2026-ucsd",
    phase_id: null,
    action_committee_id: null,
    assignment_id: null,
    title: "UCSD service social",
    event_type: "local_volunteering",
    status: "published",
    planned_by_user_id: "leader-4",
    owner_user_id: "member-d",
    starts_at: "2026-11-21T02:00:00Z",
    ends_at: "2026-11-21T04:00:00Z",
    promotion_summary: "UCSD is linked but still needs attendance-backed points proof before widening.",
    attendance_count: null,
    eligible_member_count: 36,
    attendance_rate: null,
    nps_score: null,
    feedback_summary: null,
    warehouse_status: "disabled",
    luma_event_link_id: "luma-link-ucsd-service-social",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "chapter-event-mcgill-coffee-chat",
    chapter_id: "chapter-mcgill",
    campaign_id: "rush-month-2026-mcgill",
    phase_id: null,
    action_committee_id: null,
    assignment_id: null,
    title: "McGill newcomer coffee chat",
    event_type: "social",
    status: "completed",
    planned_by_user_id: "leader-5",
    owner_user_id: "member-g",
    starts_at: "2026-11-22T20:00:00Z",
    ends_at: "2026-11-22T21:30:00Z",
    promotion_summary: "McGill gives the first-five rollout a small completed event with attendance-backed points.",
    attendance_count: 9,
    eligible_member_count: 28,
    attendance_rate: 0.32,
    nps_score: 71,
    feedback_summary: "Students said the smaller event helped them ask questions before joining.",
    warehouse_status: "disabled",
    luma_event_link_id: "luma-link-mcgill-coffee-chat",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
];

const mockLumaEventLinkRows: LumaEventLinkRow[] = [
  {
    id: "luma-link-ucla-kickoff",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    phase_id: null,
    chapter_event_id: "chapter-event-ucla-kickoff",
    luma_event_id: "mock-luma-rush-kickoff",
    luma_event_url: "https://lu.ma/mock-rush-kickoff",
    status: "mocked",
    linked_by: "leader-1",
    linked_at: "2026-06-15T00:00:00Z",
    last_imported_at: null,
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "luma-link-lakeside-welcome",
    chapter_id: "chapter-lakeside",
    campaign_id: "rush-month-2026-lakeside",
    phase_id: null,
    chapter_event_id: "chapter-event-lakeside-welcome",
    luma_event_id: "mock-luma-lakeside-welcome",
    luma_event_url: "https://lu.ma/mock-lakeside-welcome",
    status: "mocked",
    linked_by: "leader-2",
    linked_at: "2026-06-15T00:00:00Z",
    last_imported_at: "2026-11-19T18:15:00Z",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "luma-link-boston-info-night",
    chapter_id: "chapter-boston",
    campaign_id: "rush-month-2026-boston",
    phase_id: null,
    chapter_event_id: "chapter-event-boston-info-night",
    luma_event_id: "mock-luma-boston-info-night",
    luma_event_url: "https://lu.ma/mock-boston-info-night",
    status: "mocked",
    linked_by: "leader-3",
    linked_at: "2026-06-15T00:00:00Z",
    last_imported_at: "2026-11-19T01:10:00Z",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "luma-link-ucsd-service-social",
    chapter_id: "chapter-san-diego",
    campaign_id: "rush-month-2026-ucsd",
    phase_id: null,
    chapter_event_id: "chapter-event-ucsd-service-social",
    luma_event_id: "mock-luma-ucsd-service-social",
    luma_event_url: "https://lu.ma/mock-ucsd-service-social",
    status: "mocked",
    linked_by: "leader-4",
    linked_at: "2026-06-15T00:00:00Z",
    last_imported_at: null,
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "luma-link-mcgill-coffee-chat",
    chapter_id: "chapter-mcgill",
    campaign_id: "rush-month-2026-mcgill",
    phase_id: null,
    chapter_event_id: "chapter-event-mcgill-coffee-chat",
    luma_event_id: "mock-luma-mcgill-coffee-chat",
    luma_event_url: "https://lu.ma/mock-mcgill-coffee-chat",
    status: "mocked",
    linked_by: "leader-5",
    linked_at: "2026-06-15T00:00:00Z",
    last_imported_at: "2026-11-22T21:40:00Z",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
];

const mockChapterLumaCalendarRows: ChapterLumaCalendarRow[] = [
  {
    id: "chapter-luma-ucla",
    chapter_id: "chapter-northview",
    environment: "staging",
    calendar_id: "cal-ucla-1234",
    calendar_label: "UCLA chapter calendar",
    is_default: false,
    status: "linked",
    linked_by: "admin-1",
    linked_at: "2026-06-20T00:00:00Z",
    notes: "Pilot chapter mapping saved in app.",
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
  {
    id: "chapter-luma-boston",
    chapter_id: "chapter-boston",
    environment: "staging",
    calendar_id: "cal-boston-5678",
    calendar_label: "Boston chapter calendar",
    is_default: false,
    status: "linked",
    linked_by: "admin-1",
    linked_at: "2026-06-20T00:00:00Z",
    notes: "Ready for the first-five-chapter rollout wave.",
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
  {
    id: "chapter-luma-lakeside",
    chapter_id: "chapter-lakeside",
    environment: "staging",
    calendar_id: "cal-lakeside-3456",
    calendar_label: "Lakeside chapter calendar",
    is_default: false,
    status: "linked",
    linked_by: "admin-1",
    linked_at: "2026-06-20T00:00:00Z",
    notes: "First-five pilot mapping saved in app.",
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
  {
    id: "chapter-luma-ucsd",
    chapter_id: "chapter-san-diego",
    environment: "staging",
    calendar_id: "cal-ucsd-9012",
    calendar_label: "UCSD chapter calendar",
    is_default: false,
    status: "linked",
    linked_by: "admin-1",
    linked_at: "2026-06-20T00:00:00Z",
    notes: "Mapped, but attendance-backed points are still pending.",
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
  {
    id: "chapter-luma-mcgill",
    chapter_id: "chapter-mcgill",
    environment: "staging",
    calendar_id: "cal-mcgill-7890",
    calendar_label: "McGill chapter calendar",
    is_default: false,
    status: "linked",
    linked_by: "admin-1",
    linked_at: "2026-06-20T00:00:00Z",
    notes: "First-five pilot mapping saved in app.",
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
];

const mockEventRows: EventRow[] = [
  {
    id: "event-row-rsvp-ucla-1",
    event_type: "event_rsvp_recorded",
    actor_user_id: "member-a",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucla-kickoff",
    payload: {
      userId: "member-a",
      userEmailHint: "me***@mymedlife.test",
    },
    correlation_id: "mock-rsvp-ucla-1",
    occurred_at: "2026-11-14T12:00:00Z",
    created_at: "2026-11-14T12:00:00Z",
  },
  {
    id: "event-row-rsvp-ucla-2",
    event_type: "event_rsvp_recorded",
    actor_user_id: "committee-member",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucla-kickoff",
    payload: {
      userId: "committee-member",
      userEmailHint: "co***@mymedlife.test",
    },
    correlation_id: "mock-rsvp-ucla-2",
    occurred_at: "2026-11-14T12:10:00Z",
    created_at: "2026-11-14T12:10:00Z",
  },
  {
    id: "event-row-attendance-ucla-1",
    event_type: "event_attendance_recorded",
    actor_user_id: "leader-1",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucla-kickoff",
    payload: {
      attendanceCount: 24,
    },
    correlation_id: "mock-attendance-ucla-1",
    occurred_at: "2026-11-15T21:00:00Z",
    created_at: "2026-11-15T21:00:00Z",
  },
  {
    id: "event-row-rsvp-lakeside-1",
    event_type: "event_rsvp_recorded",
    actor_user_id: "member-b",
    chapter_id: "chapter-lakeside",
    campaign_id: "rush-month-2026-lakeside",
    assignment_id: null,
    chapter_event_id: "chapter-event-lakeside-welcome",
    payload: {
      userId: "member-b",
      userEmailHint: "la***@mymedlife.test",
    },
    correlation_id: "mock-rsvp-lakeside-1",
    occurred_at: "2026-11-18T18:00:00Z",
    created_at: "2026-11-18T18:00:00Z",
  },
  {
    id: "event-row-attendance-lakeside-1",
    event_type: "event_attendance_recorded",
    actor_user_id: "leader-2",
    chapter_id: "chapter-lakeside",
    campaign_id: "rush-month-2026-lakeside",
    assignment_id: null,
    chapter_event_id: "chapter-event-lakeside-welcome",
    payload: {
      attendanceCount: 18,
    },
    correlation_id: "mock-attendance-lakeside-1",
    occurred_at: "2026-11-19T18:15:00Z",
    created_at: "2026-11-19T18:15:00Z",
  },
  {
    id: "event-row-rsvp-boston-1",
    event_type: "event_rsvp_recorded",
    actor_user_id: "member-c",
    chapter_id: "chapter-boston",
    campaign_id: "rush-month-2026-boston",
    assignment_id: null,
    chapter_event_id: "chapter-event-boston-info-night",
    payload: {
      userId: "member-c",
      userEmailHint: "bo***@mymedlife.test",
    },
    correlation_id: "mock-rsvp-boston-1",
    occurred_at: "2026-11-18T19:00:00Z",
    created_at: "2026-11-18T19:00:00Z",
  },
  {
    id: "event-row-rsvp-boston-2",
    event_type: "event_rsvp_recorded",
    actor_user_id: "member-e",
    chapter_id: "chapter-boston",
    campaign_id: "rush-month-2026-boston",
    assignment_id: null,
    chapter_event_id: "chapter-event-boston-info-night",
    payload: {
      userId: "member-e",
      userEmailHint: "bo***@mymedlife.test",
    },
    correlation_id: "mock-rsvp-boston-2",
    occurred_at: "2026-11-18T19:15:00Z",
    created_at: "2026-11-18T19:15:00Z",
  },
  {
    id: "event-row-attendance-boston-1",
    event_type: "event_attendance_recorded",
    actor_user_id: "leader-3",
    chapter_id: "chapter-boston",
    campaign_id: "rush-month-2026-boston",
    assignment_id: null,
    chapter_event_id: "chapter-event-boston-info-night",
    payload: {
      attendanceCount: 12,
    },
    correlation_id: "mock-attendance-boston-1",
    occurred_at: "2026-11-19T01:05:00Z",
    created_at: "2026-11-19T01:05:00Z",
  },
  {
    id: "event-row-rsvp-ucsd-1",
    event_type: "event_rsvp_recorded",
    actor_user_id: "member-d",
    chapter_id: "chapter-san-diego",
    campaign_id: "rush-month-2026-ucsd",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucsd-service-social",
    payload: {
      userId: "member-d",
      userEmailHint: "uc***@mymedlife.test",
    },
    correlation_id: "mock-rsvp-ucsd-1",
    occurred_at: "2026-11-20T17:00:00Z",
    created_at: "2026-11-20T17:00:00Z",
  },
  {
    id: "event-row-rsvp-ucsd-2",
    event_type: "event_rsvp_recorded",
    actor_user_id: "member-f",
    chapter_id: "chapter-san-diego",
    campaign_id: "rush-month-2026-ucsd",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucsd-service-social",
    payload: {
      userId: "member-f",
      userEmailHint: "uc***@mymedlife.test",
    },
    correlation_id: "mock-rsvp-ucsd-2",
    occurred_at: "2026-11-20T17:10:00Z",
    created_at: "2026-11-20T17:10:00Z",
  },
  {
    id: "event-row-attendance-ucsd-1",
    event_type: "event_attendance_recorded",
    actor_user_id: "leader-4",
    chapter_id: "chapter-san-diego",
    campaign_id: "rush-month-2026-ucsd",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucsd-service-social",
    payload: {
      attendanceCount: 16,
    },
    correlation_id: "mock-attendance-ucsd-1",
    occurred_at: "2026-11-21T04:10:00Z",
    created_at: "2026-11-21T04:10:00Z",
  },
  {
    id: "event-row-rsvp-mcgill-1",
    event_type: "event_rsvp_recorded",
    actor_user_id: "member-g",
    chapter_id: "chapter-mcgill",
    campaign_id: "rush-month-2026-mcgill",
    assignment_id: null,
    chapter_event_id: "chapter-event-mcgill-coffee-chat",
    payload: {
      userId: "member-g",
      userEmailHint: "mc***@mymedlife.test",
    },
    correlation_id: "mock-rsvp-mcgill-1",
    occurred_at: "2026-11-22T17:30:00Z",
    created_at: "2026-11-22T17:30:00Z",
  },
  {
    id: "event-row-attendance-mcgill-1",
    event_type: "event_attendance_recorded",
    actor_user_id: "leader-5",
    chapter_id: "chapter-mcgill",
    campaign_id: "rush-month-2026-mcgill",
    assignment_id: null,
    chapter_event_id: "chapter-event-mcgill-coffee-chat",
    payload: {
      attendanceCount: 9,
    },
    correlation_id: "mock-attendance-mcgill-1",
    occurred_at: "2026-11-22T21:40:00Z",
    created_at: "2026-11-22T21:40:00Z",
  },
];

const mockAllPointsEventRows: PointsEventRow[] = [
  ...mockPointsEventRows,
  {
    id: "points-ucla-attendance-001",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucla-kickoff",
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "member-a",
    points_delta: 20,
    reason: "Attendance confirmed for the Rush Month kickoff social.",
    created_by: "leader-1",
    created_at: "2026-11-15T21:01:00Z",
  },
  {
    id: "points-ucla-attendance-002",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucla-kickoff",
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "committee-member",
    points_delta: 20,
    reason: "Attendance confirmed for the Rush Month kickoff social.",
    created_by: "leader-1",
    created_at: "2026-11-15T21:01:30Z",
  },
  {
    id: "points-lakeside-attendance-001",
    chapter_id: "chapter-lakeside",
    campaign_id: "rush-month-2026-lakeside",
    assignment_id: null,
    chapter_event_id: "chapter-event-lakeside-welcome",
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "member-b",
    points_delta: 20,
    reason: "Attendance confirmed for the Lakeside welcome table.",
    created_by: "leader-2",
    created_at: "2026-11-19T18:16:00Z",
  },
  {
    id: "points-boston-001",
    chapter_id: "chapter-boston",
    campaign_id: "rush-month-2026-boston",
    assignment_id: null,
    chapter_event_id: "chapter-event-boston-info-night",
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "member-c",
    points_delta: 20,
    reason: "Attendance confirmed for the Boston kickoff info night.",
    created_by: "leader-3",
    created_at: "2026-11-19T01:06:00Z",
  },
  {
    id: "points-boston-002",
    chapter_id: "chapter-boston",
    campaign_id: "rush-month-2026-boston",
    assignment_id: null,
    chapter_event_id: "chapter-event-boston-info-night",
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "member-e",
    points_delta: 20,
    reason: "Attendance confirmed for the Boston kickoff info night.",
    created_by: "leader-3",
    created_at: "2026-11-19T01:06:30Z",
  },
  {
    id: "points-ucsd-attendance-001",
    chapter_id: "chapter-san-diego",
    campaign_id: "rush-month-2026-ucsd",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucsd-service-social",
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "member-d",
    points_delta: 20,
    reason: "Attendance confirmed for the UCSD service social.",
    created_by: "leader-4",
    created_at: "2026-11-21T04:11:00Z",
  },
  {
    id: "points-ucsd-attendance-002",
    chapter_id: "chapter-san-diego",
    campaign_id: "rush-month-2026-ucsd",
    assignment_id: null,
    chapter_event_id: "chapter-event-ucsd-service-social",
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "member-f",
    points_delta: 20,
    reason: "Attendance confirmed for the UCSD service social.",
    created_by: "leader-4",
    created_at: "2026-11-21T04:11:30Z",
  },
  {
    id: "points-mcgill-attendance-001",
    chapter_id: "chapter-mcgill",
    campaign_id: "rush-month-2026-mcgill",
    assignment_id: null,
    chapter_event_id: "chapter-event-mcgill-coffee-chat",
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "member-g",
    points_delta: 20,
    reason: "Attendance confirmed for the McGill newcomer coffee chat.",
    created_by: "leader-5",
    created_at: "2026-11-22T21:41:00Z",
  },
];

const mockIntegrationEventRows: IntegrationEventRow[] = [
  {
    id: "integration-luma-ucla-linked",
    source_event_id: "event-row-rsvp-ucla-1",
    chapter_id: "chapter-northview",
    event_type: "luma_event_linked",
    destination: "luma",
    external_object_type: "event",
    external_object_id: "mock-luma-rush-kickoff",
    status: "mocked",
    payload: { chapterEventId: "chapter-event-ucla-kickoff", liveWrite: false },
    created_by: "leader-1",
    created_at: "2026-11-15T20:55:00Z",
    updated_at: "2026-11-15T20:55:00Z",
  },
  {
    id: "integration-luma-lakeside-linked",
    source_event_id: "event-row-rsvp-lakeside-1",
    chapter_id: "chapter-lakeside",
    event_type: "luma_event_linked",
    destination: "luma",
    external_object_type: "event",
    external_object_id: "mock-luma-lakeside-welcome",
    status: "mocked",
    payload: { chapterEventId: "chapter-event-lakeside-welcome", liveWrite: false },
    created_by: "leader-2",
    created_at: "2026-11-19T18:14:00Z",
    updated_at: "2026-11-19T18:14:00Z",
  },
  {
    id: "integration-luma-boston-linked",
    source_event_id: "event-row-rsvp-boston-1",
    chapter_id: "chapter-boston",
    event_type: "luma_event_linked",
    destination: "luma",
    external_object_type: "event",
    external_object_id: "mock-luma-boston-info-night",
    status: "mocked",
    payload: { chapterEventId: "chapter-event-boston-info-night", liveWrite: false },
    created_by: "leader-3",
    created_at: "2026-11-19T01:04:00Z",
    updated_at: "2026-11-19T01:04:00Z",
  },
  {
    id: "integration-luma-ucsd-linked",
    source_event_id: "event-row-rsvp-ucsd-1",
    chapter_id: "chapter-san-diego",
    event_type: "luma_event_linked",
    destination: "luma",
    external_object_type: "event",
    external_object_id: "mock-luma-ucsd-service-social",
    status: "mocked",
    payload: { chapterEventId: "chapter-event-ucsd-service-social", liveWrite: false },
    created_by: "leader-4",
    created_at: "2026-11-21T04:09:00Z",
    updated_at: "2026-11-21T04:09:00Z",
  },
  {
    id: "integration-luma-mcgill-linked",
    source_event_id: "event-row-rsvp-mcgill-1",
    chapter_id: "chapter-mcgill",
    event_type: "luma_event_linked",
    destination: "luma",
    external_object_type: "event",
    external_object_id: "mock-luma-mcgill-coffee-chat",
    status: "mocked",
    payload: { chapterEventId: "chapter-event-mcgill-coffee-chat", liveWrite: false },
    created_by: "leader-5",
    created_at: "2026-11-22T21:39:00Z",
    updated_at: "2026-11-22T21:39:00Z",
  },
];

const mockAutomationOutboxRows: AutomationOutboxRow[] = mockIntegrationEventRows.map(
  (row) => ({
    id: `outbox-${row.id.replace("integration-", "")}`,
    source_event_id: row.source_event_id,
    integration_event_id: row.id,
    chapter_id: row.chapter_id,
    destination: "luma",
    event_type: "luma_event_write_blocked",
    payload: {
      chapterEventId:
        typeof row.payload === "object" && row.payload !== null && !Array.isArray(row.payload)
          ? row.payload.chapterEventId
          : null,
      blockedBy: "event_loop_pilot_foundation",
    },
    idempotency_key: `disabled-${row.id}`,
    status: "disabled",
    attempt_count: 0,
    available_at: row.created_at,
    locked_at: null,
    sent_at: null,
    last_error: null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }),
);

const mockAuditLogs: AuditLogRow[] = [
  {
    id: "audit-event-ucla-points",
    actor_user_id: "leader-1",
    chapter_id: "chapter-northview",
    action: "event_points_awarded",
    target_table: "points_events",
    target_id: "points-ucla-attendance-001",
    before_value: { points: 0 },
    after_value: { points: 20, chapterEventId: "chapter-event-ucla-kickoff" },
    reason: "Attendance-backed points were recorded locally; no Luma write or external send ran.",
    created_at: "2026-11-15T21:01:00Z",
  },
  {
    id: "audit-event-lakeside-points",
    actor_user_id: "leader-2",
    chapter_id: "chapter-lakeside",
    action: "event_points_awarded",
    target_table: "points_events",
    target_id: "points-lakeside-attendance-001",
    before_value: { points: 0 },
    after_value: { points: 20, chapterEventId: "chapter-event-lakeside-welcome" },
    reason: "Attendance-backed points were recorded locally; no Luma write or external send ran.",
    created_at: "2026-11-19T18:16:00Z",
  },
  {
    id: "audit-event-boston-points",
    actor_user_id: "leader-3",
    chapter_id: "chapter-boston",
    action: "event_points_awarded",
    target_table: "points_events",
    target_id: "points-boston-001",
    before_value: { points: 0 },
    after_value: { points: 20, chapterEventId: "chapter-event-boston-info-night" },
    reason: "Attendance-backed points were recorded locally; no Luma write or external send ran.",
    created_at: "2026-11-19T01:06:00Z",
  },
  {
    id: "audit-event-ucsd-points",
    actor_user_id: "leader-4",
    chapter_id: "chapter-san-diego",
    action: "event_points_awarded",
    target_table: "points_events",
    target_id: "points-ucsd-attendance-001",
    before_value: { points: 0 },
    after_value: { points: 20, chapterEventId: "chapter-event-ucsd-service-social" },
    reason: "Attendance-backed points were recorded locally; no Luma write or external send ran.",
    created_at: "2026-11-21T04:11:00Z",
  },
  {
    id: "audit-event-mcgill-points",
    actor_user_id: "leader-5",
    chapter_id: "chapter-mcgill",
    action: "event_points_awarded",
    target_table: "points_events",
    target_id: "points-mcgill-attendance-001",
    before_value: { points: 0 },
    after_value: { points: 20, chapterEventId: "chapter-event-mcgill-coffee-chat" },
    reason: "Attendance-backed points were recorded locally; no Luma write or external send ran.",
    created_at: "2026-11-22T21:41:00Z",
  },
];

export function getMockReadOnlyAppData(
  message: string,
  status: DataSourceStatus = "mock_fallback",
): ReadOnlyAppData {
  const ledger = buildEventPointsLedger({
    assignments: mockAssignments,
    integrationEvents,
    pointsEventRows: mockPointsEventRows,
    kpiEventRows: mockKpiEventRows,
  });

  return {
    source: {
      mode: "mock",
      status,
      message,
    },
    chapter: mockChapter,
    campaign: mockCampaign,
    chapterRows: mockChapterRows,
    campaignRows: mockCampaignRows,
    profiles: mockProfileRows,
    memberships: [],
    phases: [],
    assignments: mockAssignments,
    campaignTemplates: [],
    campaignPhaseTemplates: [],
    campaignRoleAssignments: [],
    readinessReviews: [],
    riskFlags: [],
    closeouts: [],
    evidenceItems: mockEvidenceItems,
    storyEvidenceRows: [],
    chapterEventRows: mockChapterEventRows.filter((row) => row.chapter_id === mockChapter.id),
    lumaEventLinkRows: mockLumaEventLinkRows.filter((row) => row.chapter_id === mockChapter.id),
    chapterLumaCalendarRows: mockChapterLumaCalendarRows,
    pointsEvents: ledger.pointsEvents,
    kpiEvents: ledger.kpiEvents,
    pointsSummary: ledger.pointsSummary,
    kpiSummary: ledger.kpiSummary,
    metricsPosture: ledger.posture,
    integrationEvents,
    outboxItems,
    eventRows: mockEventRows.filter((row) => row.chapter_id === mockChapter.id),
    allEventRows: mockEventRows,
    allChapterEventRows: mockChapterEventRows,
    allLumaEventLinkRows: mockLumaEventLinkRows,
    allPointsEventRows: mockAllPointsEventRows,
    pointsEventRows: mockAllPointsEventRows.filter(
      (row) => row.chapter_id === mockChapter.id,
    ),
    kpiEventRows: mockKpiEventRows,
    integrationEventRows: mockIntegrationEventRows,
    automationOutboxRows: mockAutomationOutboxRows,
    auditLogs: mockAuditLogs,
  };
}

export function getUnavailableReadOnlyAppData(message: string): ReadOnlyAppData {
  const ledger = buildEventPointsLedger({
    assignments: [],
    integrationEvents: [],
    pointsEventRows: [],
    kpiEventRows: [],
  });

  return {
    source: {
      mode: "supabase",
      status: "chapter_access_missing",
      message,
    },
    chapter: {
      id: "chapter-access-missing",
      name: "Chapter access unavailable",
      campus: "No approved chapter",
      region: "Unavailable",
      coachName: "Unavailable",
    },
    campaign: {
      id: "campaign-access-missing",
      name: "No active campaign",
      objective: "Chapter access must be restored before campaign data can load.",
      weekLabel: "Unavailable",
      status: "draft",
    },
    chapterRows: [],
    campaignRows: [],
    profiles: [],
    memberships: [],
    phases: [],
    assignments: [],
    campaignTemplates: [],
    campaignPhaseTemplates: [],
    campaignRoleAssignments: [],
    readinessReviews: [],
    riskFlags: [],
    closeouts: [],
    evidenceItems: [],
    storyEvidenceRows: [],
    chapterEventRows: [],
    lumaEventLinkRows: [],
    chapterLumaCalendarRows: [],
    pointsEvents: ledger.pointsEvents,
    kpiEvents: ledger.kpiEvents,
    pointsSummary: ledger.pointsSummary,
    kpiSummary: ledger.kpiSummary,
    metricsPosture: ledger.posture,
    integrationEvents: [],
    outboxItems: [],
    eventRows: [],
    allEventRows: [],
    allChapterEventRows: [],
    allLumaEventLinkRows: [],
    allPointsEventRows: [],
    pointsEventRows: [],
    kpiEventRows: [],
    integrationEventRows: [],
    automationOutboxRows: [],
    auditLogs: [],
  };
}

type LocalDataSnapshot = Awaited<ReturnType<typeof readLocalDataSnapshot>>;

type CampaignScopeInput = {
  chapterId: string;
  campaignId: string;
  campaignTemplateId: string | null;
};

function buildCampaignScopedData(
  snapshot: LocalDataSnapshot,
  scope: CampaignScopeInput,
) {
  const phases = snapshot.phases.filter((item) => item.campaign_id === scope.campaignId);
  const assignments = snapshot.assignments
    .filter((item) => item.campaign_id === scope.campaignId)
    .map(toDomainAssignment);
  const assignmentIds = new Set(assignments.map((item) => item.id));

  const evidenceItems = snapshot.evidenceItems
    .filter((item) => isChapterEvidenceRow(item, scope.chapterId, assignmentIds))
    .map(toDomainEvidenceItem);
  const chapterEventRows = snapshot.chapterEventRows.filter(
    (item) => item.chapter_id === scope.chapterId && item.campaign_id === scope.campaignId,
  );
  const chapterEventIds = new Set(chapterEventRows.map((item) => item.id));
  const lumaEventLinkRows = snapshot.lumaEventLinkRows.filter((item) =>
    item.chapter_id === scope.chapterId ||
    (item.chapter_event_id !== null && chapterEventIds.has(item.chapter_event_id)),
  );
  const eventRows = snapshot.eventRows.filter((item) =>
    isChapterAssignmentOrEventRow(item, scope.chapterId, assignmentIds, chapterEventIds),
  );
  const pointsEventRows = snapshot.pointsEventRows.filter((item) =>
    isChapterAssignmentOrEventRow(item, scope.chapterId, assignmentIds, chapterEventIds),
  );
  const kpiEventRows = snapshot.kpiEventRows.filter((item) =>
    isChapterAssignmentOrEventRow(item, scope.chapterId, assignmentIds, chapterEventIds),
  );

  const eventIds = new Set(eventRows.map((item) => item.id));
  const integrationEventRows = snapshot.integrationEventRows.filter((item) =>
    item.chapter_id === scope.chapterId ||
    (item.source_event_id !== null && eventIds.has(item.source_event_id)),
  );
  const integrationEventIds = new Set(integrationEventRows.map((item) => item.id));
  const automationOutboxRows = snapshot.automationOutboxRows.filter((item) =>
    item.chapter_id === scope.chapterId ||
    (item.source_event_id !== null && eventIds.has(item.source_event_id)) ||
    (item.integration_event_id !== null && integrationEventIds.has(item.integration_event_id)),
  );
  const auditLogs = snapshot.auditLogs.filter((item) =>
    item.chapter_id === scope.chapterId ||
    (item.target_table === "assignments" &&
      item.target_id !== null &&
      assignmentIds.has(item.target_id)),
  );

  const integrationEvents = integrationEventRows.map(toDomainIntegrationEvent);
  const outboxItems = automationOutboxRows.map(toDomainOutboxItem);
  const ledger = buildEventPointsLedger({
    assignments,
    integrationEvents,
    pointsEventRows,
    kpiEventRows,
  });

  return {
    phases,
    assignments,
    campaignPhaseTemplates: snapshot.campaignPhaseTemplates.filter(
      (item) => item.campaign_template_id === scope.campaignTemplateId,
    ),
    campaignRoleAssignments: snapshot.campaignRoleAssignments.filter(
      (item) => item.campaign_id === scope.campaignId,
    ),
    readinessReviews: snapshot.readinessReviews.filter(
      (item) => item.campaign_id === scope.campaignId,
    ),
    riskFlags: snapshot.riskFlags.filter((item) => item.campaign_id === scope.campaignId),
    closeouts: snapshot.closeouts.filter((item) => item.campaign_id === scope.campaignId),
    evidenceItems,
    chapterEventRows,
    lumaEventLinkRows,
    eventRows,
    pointsEventRows,
    kpiEventRows,
    integrationEventRows,
    automationOutboxRows,
    auditLogs,
    integrationEvents,
    outboxItems,
    ledger,
  };
}

function isChapterAssignmentOrEventRow(
  row: {
    chapter_id: string | null;
    assignment_id: string | null;
    chapter_event_id: string | null;
  },
  chapterId: string,
  assignmentIds: Set<string>,
  chapterEventIds: Set<string>,
) {
  return row.chapter_id === chapterId ||
    (row.assignment_id !== null && assignmentIds.has(row.assignment_id)) ||
    (row.chapter_event_id !== null && chapterEventIds.has(row.chapter_event_id));
}

function isChapterEvidenceRow(
  row: {
    chapter_id: string | null;
    assignment_id: string | null;
  },
  chapterId: string,
  assignmentIds: Set<string>,
) {
  return row.chapter_id === chapterId &&
    (row.assignment_id === null || assignmentIds.has(row.assignment_id));
}

function toDomainChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    name: row.name,
    campus: row.campus,
    region: row.region ?? "Unassigned",
    coachName: "Local Supabase coach portfolio",
  };
}

function toDomainCampaign(row: CampaignRow, phase?: PhaseRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    objective: row.objective,
    weekLabel: phase?.title ?? "Local Supabase campaign phase",
    status: row.status === "archived" ? "complete" : row.status,
  };
}

function toDomainAssignment(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    title: row.title,
    ownerRole: roleKeyToChapterRole(row.assigned_to_role_key),
    lane: roleKeyToLane(row.assigned_to_role_key),
    dueLabel: row.due_at ? new Date(row.due_at).toLocaleDateString("en-US") : "No due date",
    status: row.status === "canceled" ? "not_started" : row.status,
    evidenceRequired: row.evidence_required,
    instructions: row.instructions,
    points: row.points,
    kpi: row.kpi_key,
  };
}

function toDomainEvidenceItem(row: EvidenceItemRow): EvidenceItem {
  return {
    id: row.id,
    assignmentId: row.assignment_id ?? row.chapter_event_id ?? row.id,
    submittedBy: "Local Supabase member",
    evidenceType: row.evidence_type,
    summary: row.summary,
    status: row.status,
  };
}

function isPublishedStoryEvidence(row: EvidenceItemRow) {
  return row.status === "approved" && row.sharing_status === "approved_for_sharing";
}

function toDomainIntegrationEvent(row: IntegrationEventRow): IntegrationEvent {
  const destination = toDomainIntegrationDestination(row.destination);

  return {
    id: row.id,
    eventType: row.event_type,
    title: toReadableEventTitle(row.event_type),
    destination,
    status: toDomainIntegrationStatus(row.status),
    detail: `${destination} ${row.status}; external writes stay controlled by approval flags.`,
    occurredAt: toReadableTime(row.created_at),
  };
}

function toDomainOutboxItem(row: AutomationOutboxRow): OutboxItem {
  return {
    id: row.id,
    sourceEventId: row.source_event_id ?? row.integration_event_id ?? row.id,
    destination: toDomainOutboxDestination(row.destination),
    status: toDomainOutboxStatus(row.status),
    payloadSummary: `${toReadableEventTitle(row.event_type)} outbox row is ${row.status}. Attempts: ${row.attempt_count}.`,
  };
}

function toDomainIntegrationDestination(
  destination: IntegrationDestination,
): IntegrationEvent["destination"] {
  switch (destination) {
    case "hubspot":
      return "HubSpot";
    case "luma":
      return "Luma";
    case "warehouse":
    case "power_bi":
      return "warehouse";
    case "n8n":
      return "n8n";
    case "internal":
      return "internal";
  }
}

function toDomainOutboxDestination(
  destination: IntegrationDestination,
): OutboxItem["destination"] {
  switch (destination) {
    case "hubspot":
      return "HubSpot";
    case "luma":
      return "Luma";
    case "warehouse":
    case "power_bi":
      return "warehouse";
    case "n8n":
    case "internal":
      return "n8n";
  }
}

function toDomainIntegrationStatus(
  status: IntegrationStatus,
): IntegrationEvent["status"] {
  if (status === "disabled") {
    return "disabled";
  }

  if (status === "approved_for_mock" || status === "mocked") {
    return "mocked";
  }

  return "recorded";
}

function toDomainOutboxStatus(status: OutboxStatus): OutboxItem["status"] {
  if (status === "disabled") {
    return "disabled";
  }

  if (status === "approved_for_mock" || status === "mocked") {
    return "mocked";
  }

  return "recorded";
}

function toReadableEventTitle(eventType: string): string {
  return eventType
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toReadableTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function roleKeyToChapterRole(roleKey: AssignmentRow["assigned_to_role_key"]): ChapterRole {
  switch (roleKey) {
    case "action_committee_member":
      return "Action Committee Member";
    case "action_committee_chair":
      return "Action Committee Chair";
    case "e_board_member":
      return "E-Board Member";
    case "president_vp":
      return "Chapter President / Vice President";
    case "coach":
      return "Coach";
    case "admin":
      return "Admin";
    case "ds_admin":
    case "super_admin":
      return "Super Admin";
    case "general_member":
    default:
      return "General Member";
  }
}

function roleKeyToLane(roleKey: AssignmentRow["assigned_to_role_key"]): Assignment["lane"] {
  if (roleKey === "coach") {
    return "Coach";
  }

  if (
    roleKey === "action_committee_chair" ||
    roleKey === "e_board_member" ||
    roleKey === "president_vp"
  ) {
    return "Leader";
  }

  return "Member";
}
