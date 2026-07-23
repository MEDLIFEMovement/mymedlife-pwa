import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type {
  CampaignFamily,
  CampaignReadinessSummary,
  CampaignShell,
  CampaignShellStatus,
} from "@/shared/types/campaigns";
import type { CampaignStatus } from "@/shared/types/persistence";

export type MemberCampaignActionGroup = {
  role: string;
  actionSummary: string;
  completionLabel: string;
};

export type MemberCampaignEvent = {
  id: string;
  title: string;
  statusLabel: string;
};

export type AppOwnedCampaignReadback = {
  campaigns: CampaignShell[];
  summary: CampaignReadinessSummary;
  currentPhaseLabel: string;
  currentPhaseDetail: string;
  progressPercent: number;
  progressLabel: string;
  actionGroups: MemberCampaignActionGroup[];
  goodLooksLike: string[];
  nextEvent: MemberCampaignEvent | null;
  sourceMessage: string;
};

export function getAppOwnedCampaignReadback(
  data: ReadOnlyAppData,
): AppOwnedCampaignReadback {
  const campaignRow = data.campaignRows.find(
    (campaign) =>
      campaign.id === data.campaign.id &&
      campaign.chapter_id === data.chapter.id,
  );
  const campaigns = campaignRow
    ? [toCampaignShell(data, campaignRow)]
    : [];
  const activePhase =
    data.phases.find((phase) => phase.status === "active") ??
    data.phases.find((phase) => phase.status === "not_started") ??
    data.phases[0];
  const completedAssignments = data.assignments.filter(
    (assignment) => assignment.status === "approved",
  ).length;
  const progressPercent =
    data.assignments.length === 0
      ? 0
      : Math.round((completedAssignments / data.assignments.length) * 100);
  const nextEvent =
    data.chapterEventRows.find(
      (event) => event.status !== "completed" && event.status !== "canceled",
    ) ?? data.chapterEventRows[0];

  return {
    campaigns,
    summary: {
      activeCampaigns: campaigns.filter((campaign) => campaign.status === "active")
        .length,
      plannedCampaigns: campaigns.filter((campaign) => campaign.status === "planned")
        .length,
      templateCampaigns: 0,
      linkedMockEvents: data.lumaEventLinkRows.length,
      hqProofItems: data.evidenceItems.filter(
        (item) =>
          item.status === "pending_review" ||
          item.status === "changes_requested",
      ).length,
      disabledIntegrationEvents: data.integrationEventRows.filter(
        (event) => event.status === "disabled" || event.status === "failed",
      ).length,
    },
    currentPhaseLabel: activePhase?.title ?? "No active phase",
    currentPhaseDetail:
      activePhase?.objective ?? "No app-owned phase is scheduled for this campaign.",
    progressPercent,
    progressLabel: `${completedAssignments}/${data.assignments.length} assignments approved`,
    actionGroups: buildActionGroups(data),
    goodLooksLike: buildGoodLooksLike(data),
    nextEvent: nextEvent
      ? {
          id: nextEvent.id,
          title: nextEvent.title,
          statusLabel: nextEvent.status.replaceAll("_", " "),
        }
      : null,
    sourceMessage: data.source.message,
  };
}

function toCampaignShell(
  data: ReadOnlyAppData,
  row: ReadOnlyAppData["campaignRows"][number],
): CampaignShell {
  const activePhase =
    data.phases.find((phase) => phase.status === "active") ?? data.phases[0];
  const roleLabels = Array.from(
    new Set(data.assignments.map((assignment) => assignment.ownerRole)),
  );
  const kpis = Array.from(
    new Set(
      data.assignments
        .map((assignment) => assignment.kpi.trim())
        .filter(Boolean),
    ),
  );
  const openRisks = data.riskFlags.filter(
    (risk) => risk.status === "open" || risk.status === "escalated",
  ).length;

  return {
    slug: row.slug,
    name: row.name,
    family: inferCampaignFamily(row.slug),
    status: toCampaignShellStatus(row.status),
    summary: row.objective,
    studentPromise: row.objective,
    operatingRhythm: activePhase
      ? `${activePhase.title}: ${activePhase.objective}`
      : "No app-owned phase is scheduled.",
    actionCommitteeLanes: roleLabels,
    proofUse:
      data.evidenceItems.length > 0
        ? `${data.evidenceItems.length} app-owned proof ${data.evidenceItems.length === 1 ? "record" : "records"} attached to this campaign.`
        : "No app-owned proof records are attached yet.",
    coachFocus:
      openRisks > 0
        ? `${openRisks} open campaign ${openRisks === 1 ? "risk needs" : "risks need"} attention.`
        : "No open app-owned campaign risks are recorded.",
    primaryKpis: kpis,
    integrationPosture:
      data.lumaEventLinkRows.length > 0
        ? `${data.lumaEventLinkRows.length} app-owned Luma event ${data.lumaEventLinkRows.length === 1 ? "link is" : "links are"} recorded. Provider writes remain separately gated.`
        : "No app-owned Luma event link is recorded.",
    workflowSnapshot: activePhase
      ? {
          sourceKind: "builder_definition",
          versionLabel: "App-owned campaign",
          workflowName: row.name,
          currentPhaseLabel: activePhase.title,
          currentPhaseObjective: activePhase.objective,
          currentPhaseExitSignal: getExitSignal(activePhase.exit_criteria),
        }
      : null,
  };
}

function buildActionGroups(
  data: ReadOnlyAppData,
): MemberCampaignActionGroup[] {
  const groups = new Map<
    string,
    { titles: string[]; complete: number; total: number }
  >();

  for (const assignment of data.assignments) {
    const group = groups.get(assignment.ownerRole) ?? {
      titles: [],
      complete: 0,
      total: 0,
    };
    group.titles.push(assignment.title);
    group.total += 1;
    if (assignment.status === "approved") group.complete += 1;
    groups.set(assignment.ownerRole, group);
  }

  return Array.from(groups.entries()).map(([role, group]) => ({
    role,
    actionSummary: group.titles.slice(0, 3).join(" · "),
    completionLabel: `${group.complete}/${group.total} approved`,
  }));
}

function buildGoodLooksLike(data: ReadOnlyAppData) {
  return [
    data.chapterEventRows.length > 0
      ? `${data.chapterEventRows.length} app-owned chapter ${data.chapterEventRows.length === 1 ? "event is" : "events are"} recorded`
      : "No app-owned chapter event is recorded yet",
    data.assignments.length > 0
      ? `${data.assignments.length} app-owned ${data.assignments.length === 1 ? "assignment is" : "assignments are"} visible`
      : "No app-owned assignments are visible yet",
    data.evidenceItems.length > 0
      ? `${data.evidenceItems.length} proof ${data.evidenceItems.length === 1 ? "record is" : "records are"} attached`
      : "No proof records are attached yet",
    data.pointsEventRows.length > 0
      ? `${data.pointsEventRows.length} points ledger ${data.pointsEventRows.length === 1 ? "entry is" : "entries are"} recorded`
      : "No points ledger entries are recorded yet",
  ];
}

function toCampaignShellStatus(
  status: CampaignStatus,
): CampaignShellStatus {
  return status === "draft" ? "planned" : status;
}

function inferCampaignFamily(slug: string): CampaignFamily {
  if (slug.includes("rush")) return "rush_month";
  if (slug.includes("fundrais")) return "fundraising";
  if (slug.includes("volunteer")) return "local_volunteering";
  if (slug.includes("med-talk")) return "med_talk";
  if (slug.includes("social")) return "social";
  if (slug.includes("slt")) return "slt_promotion";
  if (slug.includes("mountain")) return "moving_mountains";
  if (slug.includes("leadership")) return "leadership_transition";
  if (slug.includes("grow")) return "grow_the_movement";
  if (slug.includes("start-a-chapter")) return "start_a_chapter";
  if (slug.includes("clinic")) return "mobile_clinic";
  if (slug.includes("proof")) return "proof_storytelling";
  if (slug.includes("planning") || slug.includes("goal")) {
    return "planning_goal_setting";
  }
  return "chapter_engagement";
}

function getExitSignal(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").join("; ");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join("; ");
  }
  return "No exit criteria recorded.";
}
