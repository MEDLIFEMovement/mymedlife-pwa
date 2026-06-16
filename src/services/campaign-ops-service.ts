import {
  actionCommittees,
  campaignShells,
  chapterEventPlans,
  proofLibraryItems,
} from "@/data/mock-campaigns";
import type { LocalActorContext } from "@/services/local-actor-context";
import type {
  ActionCommittee,
  CampaignIntegrationPosture,
  CampaignReadinessSummary,
  CampaignShell,
  ChapterEventPlan,
  ProofLibraryItem,
} from "@/shared/types/campaigns";
import type { IntegrationEvent } from "@/shared/types/domain";

export function getCampaignShells(): CampaignShell[] {
  return campaignShells;
}

export function getCampaignShellBySlug(slug: string): CampaignShell | undefined {
  return campaignShells.find((campaign) => campaign.slug === slug);
}

export function getVisibleCampaignShellsForActor(
  actor: LocalActorContext,
  shells: CampaignShell[] = campaignShells,
): CampaignShell[] {
  if (actor.audience === "ds_admin") {
    return [];
  }

  if (actor.audience === "chapter_member") {
    return shells.filter((campaign) => campaign.status === "active");
  }

  if (actor.audience === "chapter_leader") {
    return shells.filter((campaign) => campaign.status !== "template");
  }

  return shells;
}

export function getActionCommittees(): ActionCommittee[] {
  return actionCommittees;
}

export function getChapterEventPlans(): ChapterEventPlan[] {
  return chapterEventPlans;
}

export type CommitteeWorkspaceMode =
  | "member"
  | "committee_member"
  | "committee_chair"
  | "chapter_leader"
  | "coach"
  | "admin"
  | "ds_admin"
  | "super_admin";

export type CommitteeWorkspaceSummary = {
  mode: CommitteeWorkspaceMode;
  title: string;
  nextAction: string;
  detail: string;
  visibleCommittees: ActionCommittee[];
  priorityEvents: ChapterEventPlan[];
  structuredEventsToWatch: string[];
  safetyReminders: string[];
};

export function getCommitteeWorkspaceForActor(
  actor: LocalActorContext,
  committees: ActionCommittee[] = actionCommittees,
  events: ChapterEventPlan[] = chapterEventPlans,
): CommitteeWorkspaceSummary {
  const mode = getCommitteeWorkspaceMode(actor);
  const visibleCommittees = mode === "ds_admin" ? [] : committees;

  return {
    mode,
    ...getCommitteeWorkspaceCopy(mode),
    visibleCommittees,
    priorityEvents: getPriorityCommitteeEvents(mode, events),
    structuredEventsToWatch: [
      "chapter_event_planned",
      "luma_event_linked",
      "luma_attendance_import_mocked",
      "kpi_event_recorded",
      "evidence_submitted",
      "automation_outbox_disabled",
    ],
    safetyReminders: [
      "Luma writes stay disabled.",
      "Reminder emails/texts stay disabled.",
      "Proof sharing stays HQ-reviewed.",
      "Warehouse, Power BI, HubSpot, n8n, SMS, email, and AI writes stay off.",
    ],
  };
}

export function getEventPlansForCampaign(slug: string): ChapterEventPlan[] {
  return chapterEventPlans.filter((eventPlan) => eventPlan.campaignSlug === slug);
}

export function getEventPlansForCommittee(committeeId: string): ChapterEventPlan[] {
  return chapterEventPlans.filter((eventPlan) => eventPlan.committeeId === committeeId);
}

export function getNextEventPlanForCommittee(
  committeeId: string,
): ChapterEventPlan | undefined {
  return getEventPlansForCommittee(committeeId).find(
    (eventPlan) => eventPlan.lumaStatus !== "future_sync_disabled",
  );
}

export function getProofLibraryItems(): ProofLibraryItem[] {
  return proofLibraryItems;
}

export function getProofLibraryItemsForCampaign(slug: string): ProofLibraryItem[] {
  return proofLibraryItems.filter((proofItem) => proofItem.campaignSlug === slug);
}

export function getProofLibraryItemsForActor(
  actor: LocalActorContext,
  items: ProofLibraryItem[] = proofLibraryItems,
): ProofLibraryItem[] {
  switch (actor.audience) {
    case "chapter_member":
      return items.filter((item) => item.sharingStatus !== "not_shared");
    case "chapter_leader":
    case "coach":
      return items;
    case "admin":
    case "super_admin":
      return items;
    case "ds_admin":
      return [];
  }
}

export function getCampaignReadinessSummary(
  shells: CampaignShell[] = campaignShells,
  eventPlans: ChapterEventPlan[] = chapterEventPlans,
  proofItems: ProofLibraryItem[] = proofLibraryItems,
): CampaignReadinessSummary {
  return {
    activeCampaigns: shells.filter((campaign) => campaign.status === "active").length,
    plannedCampaigns: shells.filter((campaign) => campaign.status === "planned").length,
    templateCampaigns: shells.filter((campaign) => campaign.status === "template").length,
    linkedMockEvents: eventPlans.filter((eventPlan) => eventPlan.lumaStatus === "mock_linked")
      .length,
    hqProofItems: proofItems.filter((item) => item.sharingStatus === "needs_hq_review")
      .length,
    disabledIntegrationEvents: eventPlans.filter(
      (eventPlan) => eventPlan.lumaStatus === "future_sync_disabled",
    ).length,
  };
}

export function getCampaignIntegrationPosture(
  slug: string,
): CampaignIntegrationPosture {
  const eventPlans = getEventPlansForCampaign(slug);
  const proofItems = getProofLibraryItemsForCampaign(slug);
  const lumaEvents = eventPlans.map((eventPlan): IntegrationEvent => ({
    id: `evt-${eventPlan.id}-luma-disabled`,
    eventType: "luma_event_linked",
    title: `${eventPlan.title} Luma posture`,
    destination: "Luma",
    status: eventPlan.lumaStatus === "mock_linked" ? "mocked" : "disabled",
    detail:
      eventPlan.lumaStatus === "mock_linked"
        ? "Mock Luma event link is represented locally. No Luma API write happened."
        : "Future Luma create/check-in workflow is intentionally disabled.",
    occurredAt: "local-mock-time",
  }));
  const proofEvents = proofItems.map((proofItem): IntegrationEvent => ({
    id: `evt-${proofItem.id}-proof-disabled`,
    eventType: "evidence_submitted",
    title: `${proofItem.sourceLabel} proof posture`,
    destination: "warehouse",
    status: "disabled",
    detail:
      "Future proof library or warehouse export event is recorded as intent only. No external write happened.",
    occurredAt: "local-mock-time",
  }));

  return {
    campaignSlug: slug,
    safeToSendExternally: false,
    events: [...lumaEvents, ...proofEvents],
  };
}

export function getCommitteeOperatingSummary(committee: ActionCommittee): string {
  const events = getEventPlansForCommittee(committee.id);
  const eventCount = events.length;
  const nextEvent = getNextEventPlanForCommittee(committee.id);

  if (!nextEvent) {
    return `${committee.name} has ${eventCount} template event${eventCount === 1 ? "" : "s"} and no mock-linked next event yet.`;
  }

  return `${committee.name} owns ${eventCount} event${eventCount === 1 ? "" : "s"}; next visible event is ${nextEvent.title}.`;
}

function getCommitteeWorkspaceMode(actor: LocalActorContext): CommitteeWorkspaceMode {
  if (actor.chapterRoles.includes("Action Committee Chair")) {
    return "committee_chair";
  }

  if (actor.chapterRoles.includes("Action Committee Member")) {
    return "committee_member";
  }

  switch (actor.audience) {
    case "chapter_leader":
      return "chapter_leader";
    case "coach":
      return "coach";
    case "admin":
      return "admin";
    case "ds_admin":
      return "ds_admin";
    case "super_admin":
      return "super_admin";
    case "chapter_member":
    default:
      return "member";
  }
}

function getCommitteeWorkspaceCopy(mode: CommitteeWorkspaceMode) {
  switch (mode) {
    case "committee_member":
      return {
        title: "Help one event become real this week.",
        nextAction:
          "Pick the event you are supporting, take one promotion or hosting task, and know what proof/testimonial should be collected afterward.",
        detail:
          "Committee members should not need the whole operating system at once. They need the next event, the expected student action, and the proof prompt.",
      };
    case "committee_chair":
      return {
        title: "Turn committee plans into assigned event work.",
        nextAction:
          "Confirm the event owner, promotion task, feedback plan, and proof prompt before the chapter meeting.",
        detail:
          "Committee chairs are treated like local chapter leaders for read-only review because they coordinate people and event execution.",
      };
    case "chapter_leader":
      return {
        title: "Keep committees from becoming passive meeting groups.",
        nextAction:
          "Check which committee has a real event, owner, student action, feedback plan, and proof prompt.",
        detail:
          "Leaders should use this page to spot thin ownership and assign the next concrete Rush Month action.",
      };
    case "coach":
      return {
        title: "Look for action committees that need coaching.",
        nextAction:
          "Watch for committees with no visible event, no owner, or no feedback/proof loop before deciding advance, hold, or intervene.",
        detail:
          "Coach review focuses on whether the chapter is creating real student action rather than only running meetings.",
      };
    case "admin":
      return {
        title: "Review committee operations without owning chapter truth.",
        nextAction:
          "Inspect event, proof, and integration posture before approving any broader staff workflow.",
        detail:
          "Admins can support the operating model, but student/chapter truth stays owned by the app and approved role boundaries.",
      };
    case "super_admin":
      return {
        title: "Review the full committee operating model.",
        nextAction:
          "Confirm every committee event can create structured app events while external automation stays disabled.",
        detail:
          "Super admins can see the complete local review surface, including permission and integration safety posture.",
      };
    case "ds_admin":
      return {
        title: "Integration posture only.",
        nextAction:
          "Use the admin outbox screens instead of student committee truth.",
        detail:
          "DS Admin should not own committee, event, proof, point, KPI, or chapter execution truth.",
      };
    case "member":
    default:
      return {
        title: "Find one real thing to join.",
        nextAction:
          "Choose a Rush Month event or committee action, show up, and submit a short proof/testimonial afterward if asked.",
        detail:
          "General members should see action opportunities without needing leadership-level SOP or KPI complexity.",
      };
  }
}

function getPriorityCommitteeEvents(
  mode: CommitteeWorkspaceMode,
  events: ChapterEventPlan[],
): ChapterEventPlan[] {
  if (mode === "ds_admin") {
    return [];
  }

  if (mode === "committee_chair") {
    return events.filter((eventPlan) => eventPlan.ownerRole === "Action Committee Chair");
  }

  if (mode === "committee_member" || mode === "member") {
    return events.filter((eventPlan) => eventPlan.campaignSlug === "rush-month");
  }

  if (mode === "coach") {
    return events.filter((eventPlan) => eventPlan.lumaStatus !== "mock_linked");
  }

  return events;
}
