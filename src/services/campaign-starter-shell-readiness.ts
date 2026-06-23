import { campaignShells } from "@/data/mock-campaigns";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import type {
  CampaignFamily,
  CampaignShell,
  CampaignShellStatus,
} from "@/shared/types/campaigns";

type RequiredStarterCampaign = {
  slug: string;
  name: string;
  family: CampaignFamily;
};

export type CampaignStarterShellReadinessStatus = "shell_ready" | "missing";

export type CampaignStarterShellReadinessItem = {
  slug: string;
  name: string;
  family: CampaignFamily;
  route: string;
  status: CampaignStarterShellReadinessStatus;
  templateStatus: CampaignShellStatus | null;
  actionLaneCount: number;
  kpiCount: number;
  hasStudentPromise: boolean;
  hasOperatingRhythm: boolean;
  safeToSendExternally: false;
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  nextBuildStep: string;
};

export type CampaignStarterShellReadiness = {
  canReadReadiness: boolean;
  title: string;
  summary: string;
  requiredCount: number;
  presentCount: number;
  missingCount: number;
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  items: CampaignStarterShellReadinessItem[];
};

export const requiredStarterCampaigns = [
  {
    slug: "planning-goal-setting",
    name: "Planning / Goal Setting",
    family: "planning_goal_setting",
  },
  {
    slug: "chapter-engagement",
    name: "Chapter Engagement",
    family: "chapter_engagement",
  },
  {
    slug: "slt-promotion",
    name: "SLT Promotion",
    family: "slt_promotion",
  },
  {
    slug: "moving-mountains",
    name: "Moving Mountains",
    family: "moving_mountains",
  },
  {
    slug: "leadership-transition",
    name: "Leadership Transition",
    family: "leadership_transition",
  },
  {
    slug: "grow-the-movement",
    name: "Grow the Movement",
    family: "grow_the_movement",
  },
  {
    slug: "start-a-chapter",
    name: "Start a Chapter",
    family: "start_a_chapter",
  },
] as const satisfies readonly RequiredStarterCampaign[];

export function getCampaignStarterShellReadiness(
  actor: LocalActorContext,
  shells: readonly CampaignShell[] = campaignShells,
): CampaignStarterShellReadiness {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return {
      canReadReadiness: false,
      title: "Starter campaign readiness hidden for this role",
      summary:
        "Members should see the active campaign. DS Admin should use integration and outbox safety views, not campaign truth.",
      requiredCount: requiredStarterCampaigns.length,
      presentCount: 0,
      missingCount: requiredStarterCampaigns.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      items: [],
    };
  }

  const items = requiredStarterCampaigns.map((required) => {
    const shell = shells.find((campaign) => campaign.slug === required.slug);

    return toReadinessItem(required, shell);
  });

  return {
    canReadReadiness: true,
    title: getTitle(surfaceFamily),
    summary:
      "These are the exact non-Rush starter campaign shells required for the MVP foundation. They are ready for local review, but they are not end-to-end campaign builds yet.",
    requiredCount: requiredStarterCampaigns.length,
    presentCount: items.filter((item) => item.status === "shell_ready").length,
    missingCount: items.filter((item) => item.status === "missing").length,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    items,
  };
}

function toReadinessItem(
  required: RequiredStarterCampaign,
  shell: CampaignShell | undefined,
): CampaignStarterShellReadinessItem {
  return {
    slug: required.slug,
    name: shell?.name ?? required.name,
    family: required.family,
    route: `/campaigns/${required.slug}`,
    status: shell ? "shell_ready" : "missing",
    templateStatus: shell?.status ?? null,
    actionLaneCount: shell?.actionCommitteeLanes.length ?? 0,
    kpiCount: shell?.primaryKpis.length ?? 0,
    hasStudentPromise: Boolean(shell?.studentPromise.trim()),
    hasOperatingRhythm: Boolean(shell?.operatingRhythm.trim()),
    safeToSendExternally: false,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    nextBuildStep: getNextBuildStep(required.family),
  };
}

function getNextBuildStep(family: CampaignFamily): string {
  switch (family) {
    case "planning_goal_setting":
      return "Add detailed goal phases, owner review, risk check, and coach check-in states.";
    case "chapter_engagement":
      return "Add recurring engagement actions, retention signals, recognition rules, and closeout review.";
    case "slt_promotion":
      return "Add SLT info-session tasks, follow-up states, question tracking, and proof prompts.";
    case "moving_mountains":
      return "Add movement actions, fundraising/advocacy tasks, chapter participation signals, and closeout rules.";
    case "leadership_transition":
      return "Add successor confirmation, role-note handoff, coach validation, and open-risk tracking.";
    case "grow_the_movement":
      return "Add referral/partnership tasks, alumni proof, conversion signals, and follow-up ownership.";
    case "start_a_chapter":
      return "Add expansion phases, founding-team tasks, readiness gates, and coach handoff states.";
    case "rush_month":
    case "fundraising":
    case "local_volunteering":
    case "med_talk":
    case "social":
    case "mobile_clinic":
    case "proof_storytelling":
      return "This campaign is outside the required starter-shell checkpoint.";
  }
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Leader starter campaign shell checkpoint";
    case "coach":
      return "Coach starter campaign shell checkpoint";
    case "staff":
      return "Admin starter campaign shell checkpoint";
    case "super_admin":
      return "Full starter campaign shell checkpoint";
    case "member":
    case "ds_admin":
      return "Starter campaign readiness hidden for this role";
  }
}
