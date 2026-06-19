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
  createSupabaseReadonlyClient,
  getSupabaseReadConfig,
  type SupabaseReadonlyClient,
} from "@/lib/supabase-readonly";
import {
  buildPointsKpiLedger,
  type MetricsPosture,
} from "@/services/points-kpi-ledger";
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
  ChapterRow,
  EvidenceItemRow,
  EventRow,
  IntegrationDestination,
  IntegrationEventRow,
  IntegrationStatus,
  KpiEventRow,
  MembershipRow,
  OutboxStatus,
  PhaseReadinessReviewRow,
  PhaseRow,
  PointsEventRow,
  ProfileRow,
  RiskFlagRow,
} from "@/shared/types/persistence";

export type DataSourceMode = "mock" | "supabase";
export type DataSourceStatus = "mock_fallback" | "supabase_ready" | "supabase_error";

export type DataSourceMeta = {
  mode: DataSourceMode;
  status: DataSourceStatus;
  message: string;
};

export type ReadOnlyAppData = {
  source: DataSourceMeta;
  chapter: Chapter;
  campaign: Campaign;
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
  pointsEvents: PointsEvent[];
  kpiEvents: KPIEvent[];
  pointsSummary: PointsSummary;
  kpiSummary: KpiSummary;
  metricsPosture: MetricsPosture;
  integrationEvents: IntegrationEvent[];
  outboxItems: OutboxItem[];
  eventRows: EventRow[];
  pointsEventRows: PointsEventRow[];
  kpiEventRows: KpiEventRow[];
  integrationEventRows: IntegrationEventRow[];
  automationOutboxRows: AutomationOutboxRow[];
  auditLogs: AuditLogRow[];
};

export async function getReadOnlyAppData(): Promise<ReadOnlyAppData> {
  const config = getSupabaseReadConfig();

  if (!config.enabled) {
    return getMockReadOnlyAppData(config.reason);
  }

  try {
    return await getSupabaseReadOnlyAppData(
      createSupabaseReadonlyClient(config),
      config.reason,
    );
  } catch (error) {
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
): Promise<ReadOnlyAppData> {
  const snapshot = await readLocalDataSnapshot(client);
  const chapter =
    snapshot.chapters.find((item) => item.status === "active") ??
    snapshot.chapters[0];

  if (!chapter) {
    return getMockReadOnlyAppData("Supabase returned no chapters, so mock fallback is active.");
  }

  const campaign =
    snapshot.campaigns.find(
      (item) => item.chapter_id === chapter.id && item.status === "active",
    ) ?? snapshot.campaigns.find((item) => item.chapter_id === chapter.id);

  if (!campaign) {
    return getMockReadOnlyAppData("Supabase returned no active campaign, so mock fallback is active.");
  }

  const phases = snapshot.phases.filter((item) => item.campaign_id === campaign.id);
  const assignments = snapshot.assignments
    .filter((item) => item.campaign_id === campaign.id)
    .map(toDomainAssignment);
  const campaignTemplates = snapshot.campaignTemplates;
  const campaignPhaseTemplates = snapshot.campaignPhaseTemplates.filter(
    (item) => item.campaign_template_id === campaign.campaign_template_id,
  );
  const campaignRoleAssignments = snapshot.campaignRoleAssignments.filter(
    (item) => item.campaign_id === campaign.id,
  );
  const readinessReviews = snapshot.readinessReviews.filter(
    (item) => item.campaign_id === campaign.id,
  );
  const riskFlags = snapshot.riskFlags.filter((item) => item.campaign_id === campaign.id);
  const closeouts = snapshot.closeouts.filter((item) => item.campaign_id === campaign.id);
  const assignmentIds = new Set(assignments.map((item) => item.id));
  const evidenceItems = snapshot.evidenceItems
    .filter((item) => {
      return item.chapter_id === chapter.id &&
        (item.assignment_id === null || assignmentIds.has(item.assignment_id));
    })
    .map(toDomainEvidenceItem);
  const eventRows = snapshot.eventRows.filter((item) => {
    return item.chapter_id === chapter.id ||
      (item.assignment_id !== null && assignmentIds.has(item.assignment_id));
  });
  const pointsEventRows = snapshot.pointsEventRows.filter((item) => {
    return item.chapter_id === chapter.id ||
      (item.assignment_id !== null && assignmentIds.has(item.assignment_id));
  });
  const kpiEventRows = snapshot.kpiEventRows.filter((item) => {
    return item.chapter_id === chapter.id ||
      (item.assignment_id !== null && assignmentIds.has(item.assignment_id));
  });
  const eventIds = new Set(eventRows.map((item) => item.id));
  const integrationEventRows = snapshot.integrationEventRows.filter((item) => {
    return item.chapter_id === chapter.id ||
      (item.source_event_id !== null && eventIds.has(item.source_event_id));
  });
  const integrationEventIds = new Set(integrationEventRows.map((item) => item.id));
  const automationOutboxRows = snapshot.automationOutboxRows.filter((item) => {
    return item.chapter_id === chapter.id ||
      (item.source_event_id !== null && eventIds.has(item.source_event_id)) ||
      (item.integration_event_id !== null && integrationEventIds.has(item.integration_event_id));
  });
  const auditLogs = snapshot.auditLogs.filter((item) => {
    return item.chapter_id === chapter.id ||
      (item.target_table === "assignments" &&
        item.target_id !== null &&
        assignmentIds.has(item.target_id));
  });
  const mappedIntegrationEvents = integrationEventRows.map(toDomainIntegrationEvent);
  const mappedOutboxItems = automationOutboxRows.map(toDomainOutboxItem);
  const ledger = buildPointsKpiLedger({
    assignments,
    integrationEvents: mappedIntegrationEvents,
    pointsEventRows,
    kpiEventRows,
  });

  return {
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message,
    },
    chapter: toDomainChapter(chapter),
    campaign: toDomainCampaign(campaign, phases[0]),
    profiles: snapshot.profiles,
    memberships: snapshot.memberships,
    phases,
    assignments,
    campaignTemplates,
    campaignPhaseTemplates,
    campaignRoleAssignments,
    readinessReviews,
    riskFlags,
    closeouts,
    evidenceItems,
    pointsEvents: ledger.pointsEvents,
    kpiEvents: ledger.kpiEvents,
    pointsSummary: ledger.pointsSummary,
    kpiSummary: ledger.kpiSummary,
    metricsPosture: ledger.posture,
    integrationEvents: mappedIntegrationEvents,
    outboxItems: mappedOutboxItems,
    eventRows,
    pointsEventRows,
    kpiEventRows,
    integrationEventRows,
    automationOutboxRows,
    auditLogs,
  };
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

export function getMockReadOnlyAppData(
  message: string,
  status: DataSourceStatus = "mock_fallback",
): ReadOnlyAppData {
  const ledger = buildPointsKpiLedger({
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
    profiles: [],
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
    pointsEvents: ledger.pointsEvents,
    kpiEvents: ledger.kpiEvents,
    pointsSummary: ledger.pointsSummary,
    kpiSummary: ledger.kpiSummary,
    metricsPosture: ledger.posture,
    integrationEvents,
    outboxItems,
    eventRows: [],
    pointsEventRows: mockPointsEventRows,
    kpiEventRows: mockKpiEventRows,
    integrationEventRows: [],
    automationOutboxRows: [],
    auditLogs: [],
  };
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
