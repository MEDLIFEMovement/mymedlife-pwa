import type { LocalActorContext } from "@/services/local-actor-context";
import { getChapterEngagementCampaignPlan } from "@/services/chapter-engagement-campaign";
import { getLeadershipTransitionCampaignPlan } from "@/services/leadership-transition-campaign";
import { getMovingMountainsCampaignPlan } from "@/services/moving-mountains-campaign";
import { getPlanningGoalSettingCampaignPlan } from "@/services/planning-goal-setting-campaign";
import { getSltPromotionCampaignPlan } from "@/services/slt-promotion-campaign";
import { getTemplateBuilderSurface } from "@/services/sop-template-builder-read-model";

export type CampaignTemplateCoverage = {
  campaignSlug: string;
  routePhaseCount: number;
  templateStepCount: number;
  isTemplateThinnerThanRoute: boolean;
  warnings: readonly string[];
};

export function getCampaignTemplateCoverage(
  actor: LocalActorContext,
  campaignSlug: string,
): CampaignTemplateCoverage | null {
  const routePhaseCount = getRoutePhaseCount(actor, campaignSlug);
  const templateStepCount = getTemplateBuilderSurface(campaignSlug)?.steps.length ?? 0;

  if (routePhaseCount === null) {
    return null;
  }

  const isTemplateThinnerThanRoute = templateStepCount > 0 && templateStepCount < routePhaseCount;
  const warnings = isTemplateThinnerThanRoute
    ? [
        `Route-backed campaign detail currently shows ${routePhaseCount} phases while the structured SOP template exposes ${templateStepCount} step${templateStepCount === 1 ? "" : "s"}. Deepen the template import before treating the builder/runtime view as complete source-of-truth for this lane.`,
      ]
    : [];

  return {
    campaignSlug,
    routePhaseCount,
    templateStepCount,
    isTemplateThinnerThanRoute,
    warnings,
  };
}

function getRoutePhaseCount(
  actor: LocalActorContext,
  campaignSlug: string,
): number | null {
  switch (campaignSlug) {
    case "planning-goal-setting":
      return getPlanningGoalSettingCampaignPlan(actor).phases.length;
    case "chapter-engagement":
      return getChapterEngagementCampaignPlan(actor).phases.length;
    case "slt-promotion":
      return getSltPromotionCampaignPlan(actor).phases.length;
    case "moving-mountains":
      return getMovingMountainsCampaignPlan(actor).phases.length;
    case "leadership-transition":
      return getLeadershipTransitionCampaignPlan(actor).phases.length;
    default:
      return null;
  }
}
