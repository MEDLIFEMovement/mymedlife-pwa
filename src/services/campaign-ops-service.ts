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
