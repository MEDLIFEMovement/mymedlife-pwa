import {
  assignments as mockAssignments,
  evidenceItems as mockEvidenceItems,
  integrationEvents,
  mockCampaign,
  mockChapter,
  outboxItems,
} from "@/data/mock-rush-month";
import {
  createSupabaseReadonlyClient,
  getSupabaseReadConfig,
  type SupabaseReadonlyClient,
} from "@/lib/supabase-readonly";
import {
  calculateKpiSummary,
  calculatePointsSummary,
} from "@/services/rush-month-service";
import type {
  Assignment,
  Campaign,
  Chapter,
  ChapterRole,
  EvidenceItem,
  IntegrationEvent,
  KpiSummary,
  OutboxItem,
  PointsSummary,
} from "@/shared/types/domain";
import type {
  AssignmentRow,
  CampaignCloseoutRow,
  CampaignPhaseTemplateRow,
  CampaignRoleAssignmentRow,
  CampaignRow,
  CampaignTemplateRow,
  ChapterRow,
  EvidenceItemRow,
  PhaseReadinessReviewRow,
  PhaseRow,
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
  phases: PhaseRow[];
  assignments: Assignment[];
  campaignTemplates: CampaignTemplateRow[];
  campaignPhaseTemplates: CampaignPhaseTemplateRow[];
  campaignRoleAssignments: CampaignRoleAssignmentRow[];
  readinessReviews: PhaseReadinessReviewRow[];
  riskFlags: RiskFlagRow[];
  closeouts: CampaignCloseoutRow[];
  evidenceItems: EvidenceItem[];
  pointsSummary: PointsSummary;
  kpiSummary: KpiSummary;
  integrationEvents: IntegrationEvent[];
  outboxItems: OutboxItem[];
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
    snapshot.chapters.find((item) => item.name.includes("Northview")) ??
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

  return {
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message,
    },
    chapter: toDomainChapter(chapter),
    campaign: toDomainCampaign(campaign, phases[0]),
    phases,
    assignments,
    campaignTemplates,
    campaignPhaseTemplates,
    campaignRoleAssignments,
    readinessReviews,
    riskFlags,
    closeouts,
    evidenceItems,
    pointsSummary: calculatePointsSummary(assignments),
    kpiSummary: calculateKpiSummary(assignments, integrationEvents),
    integrationEvents,
    outboxItems,
  };
}

export async function readLocalDataSnapshot(client: SupabaseReadonlyClient) {
  const [
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
  ] = await Promise.all([
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
  ]);

  return {
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
  };
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

export function getMockReadOnlyAppData(
  message: string,
  status: DataSourceStatus = "mock_fallback",
): ReadOnlyAppData {
  return {
    source: {
      mode: "mock",
      status,
      message,
    },
    chapter: mockChapter,
    campaign: mockCampaign,
    phases: [],
    assignments: mockAssignments,
    campaignTemplates: [],
    campaignPhaseTemplates: [],
    campaignRoleAssignments: [],
    readinessReviews: [],
    riskFlags: [],
    closeouts: [],
    evidenceItems: mockEvidenceItems,
    pointsSummary: calculatePointsSummary(mockAssignments),
    kpiSummary: calculateKpiSummary(mockAssignments, integrationEvents),
    integrationEvents,
    outboxItems,
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
    status: row.status === "rejected" ? "changes_requested" : row.status,
  };
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
