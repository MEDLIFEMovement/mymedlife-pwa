import { getCampaignShells } from "@/services/campaign-ops-service";
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

export type CampaignStarterShellReadinessStatus =
  | "workflow_backed_draft"
  | "shell_ready"
  | "missing";

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
  workflowSource: "builder_definition" | "template_version" | "not_attached";
  workflowVersionLabel: string | null;
  currentPhaseLabel: string | null;
  currentPhaseObjective: string | null;
  currentPhaseExitSignal: string | null;
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
  workflowBackedCount: number;
  shellOnlyCount: number;
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
  shells: readonly CampaignShell[] = getCampaignShells(),
): CampaignStarterShellReadiness {
  const surfaceFamily = getActorSurfaceFamily(actor);
  const catalogShells = getCampaignShells();
  const normalizedShells = shells.map(
    (shell) =>
      shell.workflowSnapshot === undefined
        ? catalogShells.find((item) => item.slug === shell.slug) ?? shell
        : shell,
  );

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return {
      canReadReadiness: false,
      title: "Campaign workflow readiness hidden for this role",
      summary:
        "Members should see the active campaign. DS Admin should use integration and outbox safety views, not campaign truth.",
      requiredCount: requiredStarterCampaigns.length,
      presentCount: 0,
      workflowBackedCount: 0,
      shellOnlyCount: 0,
      missingCount: requiredStarterCampaigns.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      items: [],
    };
  }

  const items = requiredStarterCampaigns.map((required) => {
    const shell = normalizedShells.find((campaign) => campaign.slug === required.slug);

    return toReadinessItem(required, shell);
  });

  return {
    canReadReadiness: true,
    title: getTitle(surfaceFamily),
    summary: getReadinessSummary(items),
    requiredCount: requiredStarterCampaigns.length,
    presentCount: items.filter((item) => item.status !== "missing").length,
    workflowBackedCount: items.filter((item) => item.status === "workflow_backed_draft").length,
    shellOnlyCount: items.filter((item) => item.status === "shell_ready").length,
    missingCount: items.filter((item) => item.status === "missing").length,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    items,
  };
}

function getReadinessSummary(
  items: readonly CampaignStarterShellReadinessItem[],
) {
  const workflowBackedCount = items.filter(
    (item) => item.status === "workflow_backed_draft",
  ).length;

  if (workflowBackedCount === items.length && items.length > 0) {
    return "These are the exact non-Rush campaign lanes required for the MVP foundation. All required lanes are now workflow-backed drafts tied to the existing SOP runtime, while browser writes, external sends, and production behavior remain blocked.";
  }

  return "These are the exact non-Rush campaign lanes required for the MVP foundation. Some are now workflow-backed draft templates tied to the SOP runtime, while others are still shell-only review surfaces. None are production write-enabled workflows yet.";
}

function toReadinessItem(
  required: RequiredStarterCampaign,
  shell: CampaignShell | undefined,
): CampaignStarterShellReadinessItem {
  const workflowSnapshot = shell?.workflowSnapshot ?? null;
  const status: CampaignStarterShellReadinessStatus = !shell
    ? "missing"
    : workflowSnapshot
      ? "workflow_backed_draft"
      : "shell_ready";

  return {
    slug: required.slug,
    name: shell?.name ?? required.name,
    family: required.family,
    route: `/campaigns/${required.slug}`,
    status,
    templateStatus: shell?.status ?? null,
    actionLaneCount: shell?.actionCommitteeLanes.length ?? 0,
    kpiCount: shell?.primaryKpis.length ?? 0,
    hasStudentPromise: Boolean(shell?.studentPromise.trim()),
    hasOperatingRhythm: Boolean(shell?.operatingRhythm.trim()),
    workflowSource: workflowSnapshot?.sourceKind ?? "not_attached",
    workflowVersionLabel: workflowSnapshot?.versionLabel ?? null,
    currentPhaseLabel: workflowSnapshot?.currentPhaseLabel ?? null,
    currentPhaseObjective: workflowSnapshot?.currentPhaseObjective ?? null,
    currentPhaseExitSignal: workflowSnapshot?.currentPhaseExitSignal ?? null,
    safeToSendExternally: false,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    nextBuildStep: getNextBuildStep(required.family, status),
  };
}

function getNextBuildStep(
  family: CampaignFamily,
  status: CampaignStarterShellReadinessStatus,
): string {
  if (status === "workflow_backed_draft") {
    switch (family) {
      case "planning_goal_setting":
        return "Keep the draft template as the source of truth, then promote approvals, role-matrix enforcement, and runtime-owned reads before any write path opens.";
      case "chapter_engagement":
        return "Keep recurring engagement behavior inside the draft template, then promote runtime-owned leader/staff reads before any write path opens.";
      case "slt_promotion":
        return "Keep recruitment and traveler-readiness behavior inside the draft template, then promote the next read paths before any approval-gated writes open.";
      case "moving_mountains":
        return "Keep mission, fundraising, and proof posture inside the draft template, then promote runtime-owned chapter/staff reads before any write path opens.";
      case "leadership_transition":
        return "Keep succession, handoff, and coach validation inside the draft template, then promote runtime-owned review lanes before any write path opens.";
      case "grow_the_movement":
        return "Keep chapter-expansion, referral, and follow-up behavior inside the existing SOP draft so leader and staff reads stop depending on shell-only copy before any write path opens.";
      case "start_a_chapter":
        return "Keep chapter-launch scaffolding inside the existing SOP draft so role review, launch readiness, and support posture stay workflow-owned before any write path opens.";
      case "rush_month":
      case "fundraising":
      case "local_volunteering":
      case "med_talk":
      case "social":
      case "mobile_clinic":
      case "proof_storytelling":
        return "This campaign is outside the current workflow-backed draft checkpoint.";
    }
  }

  switch (family) {
    case "planning_goal_setting":
      return "Keep the shell readable for review, but move goal phases, owner review, risk check, and coach check-in behavior fully under workflow-owned data.";
    case "chapter_engagement":
      return "Promote this shell into a structured draft template so engagement actions, retention signals, recognition rules, and closeout review stop living as shell-only copy.";
    case "slt_promotion":
      return "Promote this shell into a structured draft template so info-session tasks, follow-up states, question tracking, and proof prompts stop living as shell-only copy.";
    case "moving_mountains":
      return "Promote this shell into a structured draft template so movement actions, fundraising posture, participation signals, and closeout rules stop living as shell-only copy.";
    case "leadership_transition":
      return "Promote this shell into a structured draft template so successor confirmation, handoff notes, coach validation, and risk tracking stop living as shell-only copy.";
    case "grow_the_movement":
      return "Decide whether this campaign should become the next structured draft template or remain a shell-only review lane for now.";
    case "start_a_chapter":
      return "Decide whether this campaign should become the next structured draft template or remain a shell-only review lane for now.";
    case "rush_month":
    case "fundraising":
    case "local_volunteering":
    case "med_talk":
    case "social":
    case "mobile_clinic":
    case "proof_storytelling":
      return "This campaign is outside the required workflow-readiness checkpoint.";
  }
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Leader campaign workflow readiness checkpoint";
    case "coach":
      return "Coach campaign workflow readiness checkpoint";
    case "staff":
      return "Admin campaign workflow readiness checkpoint";
    case "super_admin":
      return "Full campaign workflow readiness checkpoint";
    case "member":
    case "ds_admin":
      return "Campaign workflow readiness hidden for this role";
  }
}
