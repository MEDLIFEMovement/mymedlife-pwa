import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getPreferredCampaignVersion,
  getSopTemplateBySlug,
} from "@/services/sop-template-registry";
import { getSopWorkflowRuntime } from "@/services/sop-workflow-runtime";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type MovingMountainsPhaseKey =
  | "movement_story_setup"
  | "advocacy_action_ready"
  | "fundraising_momentum"
  | "supporter_followup"
  | "coach_movement_review";

export type MovingMountainsPhase = {
  key: MovingMountainsPhaseKey;
  label: string;
  ownerRole: string;
  studentVisibleOutcome: string;
  leaderTask: string;
  proofPrompt: string;
  kpiSignals: string[];
  structuredEvents: string[];
  disabledOutboxDestinations: string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type MovingMountainsCampaignPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  workflowSource: "builder_definition" | "template_version" | "missing" | "hidden";
  workflowName: string;
  workflowVersionLabel: string;
  importStatus: string;
  currentPhaseLabel: string;
  currentPhaseObjective: string;
  currentPhaseExitSignal: string;
  route: "/campaigns/moving-mountains";
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  phases: MovingMountainsPhase[];
  closeoutChecks: string[];
  safetyReminders: string[];
};

export function getMovingMountainsCampaignPlan(
  actor: LocalActorContext,
): MovingMountainsCampaignPlan {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return {
      canReadPlan: false,
      title: "Moving Mountains hidden for this role",
      summary:
        "Members should see simple movement actions and DS Admin should stay in integration safety views.",
      workflowSource: "hidden",
      workflowName: "Moving Mountains",
      workflowVersionLabel: "unknown",
      importStatus: "hidden",
      currentPhaseLabel: "hidden",
      currentPhaseObjective: "hidden",
      currentPhaseExitSignal: "hidden",
      route: "/campaigns/moving-mountains",
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      phases: [],
      closeoutChecks: [],
      safetyReminders: [],
    };
  }

  const template = getSopTemplateBySlug("moving-mountains");
  const preferredVersion = template
    ? getPreferredCampaignVersion(template)
    : null;
  const runtime = getSopWorkflowRuntime("moving-mountains");

  return {
    canReadPlan: true,
    title: getTitle(surfaceFamily),
    summary: buildMovingMountainsSummary(runtime, preferredVersion),
    workflowSource: runtime?.sourceKind ?? "missing",
    workflowName:
      preferredVersion?.workflowName ??
      runtime?.operatingRhythm ??
      "Chapter Fundraising Activation Workflow",
    workflowVersionLabel: runtime?.sourceVersionLabel ?? preferredVersion?.label ?? "fallback",
    importStatus: preferredVersion?.status ?? "repo_only_placeholder",
    currentPhaseLabel: runtime?.currentPhase?.label ?? "Movement phase",
    currentPhaseObjective:
      runtime?.currentPhase?.objective ??
      "Keep the current mission and fundraising phase visible before live supporter writes exist.",
    currentPhaseExitSignal:
      runtime?.currentPhase?.exitCriteria[0] ??
      "Current movement exit criteria stay visible before launch review.",
    route: "/campaigns/moving-mountains",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    phases: movingMountainsPhases,
    closeoutChecks: [
      "The campaign story connects campus action to MEDLIFE's broader mission.",
      "Advocacy and fundraising actions each have a named owner and next step.",
      "New supporters have human follow-up owners before any automation exists.",
      "Proof items show real student action, not only inspirational language.",
      "No donation, reminder, CRM, warehouse, Power BI, SMS, email, or AI send is enabled.",
    ],
    safetyReminders: [
      "This panel does not process payments, send appeals, publish stories, or update supporter records.",
      "Use it as the review shape for a future Moving Mountains campaign build.",
      "Live fundraising, supporter, and proof writes still require auth, RLS, audit, rollback, consent, and explicit approval.",
    ],
  };
}

function buildMovingMountainsSummary(
  runtime: ReturnType<typeof getSopWorkflowRuntime>,
  preferredVersion: ReturnType<typeof getPreferredCampaignVersion>,
) {
  if (runtime?.currentPhase) {
    const parts = [
      `This route now reads its operating phases from the ${runtime.sourceKind === "template_version" ? "structured" : "builder-backed"} ${runtime.sourceVersionLabel} Moving Mountains workflow runtime.`,
      `Current phase objective: ${runtime.currentPhase.objective}`,
    ];

    if (runtime.currentPhase.exitCriteria[0]) {
      parts.push(`Exit signal: ${runtime.currentPhase.exitCriteria[0]}`);
    }

    return parts.join(" ");
  }

  if (preferredVersion) {
    return `This route now reads its operating phases from the structured ${preferredVersion.label} Moving Mountains template, so mission storytelling, fundraising posture, supporter follow-up, and coach review stay inside the current app without enabling real writes.`;
  }

  return "This deepens the Moving Mountains starter shell into a mock-safe operating plan: leaders choose a mission story, run advocacy and fundraising actions, follow up with new supporters, and bring participation proof into coach review before any payment, message, CRM, or reporting write is enabled.";
}

const movingMountainsPhases: MovingMountainsPhase[] = [
  {
    key: "movement_story_setup",
    label: "Set the movement story",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Students understand how one campus action connects to MEDLIFE's larger movement against poverty.",
    leaderTask:
      "Pick the campaign story, desired student action, and one proof point that makes the mission feel concrete.",
    proofPrompt:
      "Capture the short explanation that helps a student connect a local action to MEDLIFE's broader mission.",
    kpiSignals: ["proof_items", "chapter_participation", "actions_completed"],
    structuredEvents: ["moving_mountains_story_planned", "mission_proof_planned"],
    disabledOutboxDestinations: ["AI summary", "Power BI", "warehouse"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "advocacy_action_ready",
    label: "Run the advocacy action",
    ownerRole: "Action Committee Chair",
    studentVisibleOutcome:
      "Students get one clear advocacy action they can take without needing leader context.",
    leaderTask:
      "Define the action, owner, student-facing prompt, participation target, and proof collection plan.",
    proofPrompt:
      "Capture why a student chose to participate and what made the advocacy action feel meaningful.",
    kpiSignals: ["actions_completed", "chapter_participation", "new_supporters"],
    structuredEvents: [
      "movement_advocacy_action_planned",
      "movement_participation_signal_planned",
    ],
    disabledOutboxDestinations: ["n8n", "SMS", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "fundraising_momentum",
    label: "Build fundraising momentum",
    ownerRole: "Action Committee Member",
    studentVisibleOutcome:
      "Students can join a fundraising push that feels doable and tied to mission impact.",
    leaderTask:
      "Name the fundraising action, campus moment, owner, proof prompt, and follow-up owner before launch.",
    proofPrompt:
      "Record the chapter detail another campus could copy to make the fundraising action repeatable.",
    kpiSignals: ["funds_raised", "actions_completed", "proof_items"],
    structuredEvents: [
      "movement_fundraising_push_planned",
      "fundraising_proof_prompt_planned",
    ],
    disabledOutboxDestinations: ["payment processor", "Power BI", "warehouse"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "supporter_followup",
    label: "Follow up with new supporters",
    ownerRole: "E-Board Member",
    studentVisibleOutcome:
      "New supporters know the next chapter action instead of being left as a one-time interaction.",
    leaderTask:
      "Sort supporters by interest, assign personal follow-up owners, and decide which next action fits each group.",
    proofPrompt:
      "Capture the follow-up moment that moved a supporter from awareness into chapter participation.",
    kpiSignals: ["new_supporters", "followups_completed", "chapter_participation"],
    structuredEvents: [
      "movement_supporter_followup_planned",
      "supporter_next_action_planned",
    ],
    disabledOutboxDestinations: ["HubSpot", "n8n", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "coach_movement_review",
    label: "Prepare Moving Mountains review",
    ownerRole: "Coach",
    studentVisibleOutcome:
      "The chapter gets coaching when movement energy is high but action, proof, or follow-up is weak.",
    leaderTask:
      "Bring story, advocacy, fundraising, supporter follow-up, proof, and participation signals into coach review.",
    proofPrompt:
      "Capture the coach note that explains whether the chapter should advance, adjust, or pause the movement push.",
    kpiSignals: ["coach_review_ready", "movement_health", "intervention_needed"],
    structuredEvents: [
      "coach_moving_mountains_review_prepared",
      "movement_next_step_decision_planned",
    ],
    disabledOutboxDestinations: ["HubSpot", "n8n", "AI summary"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
];

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Leader Moving Mountains campaign plan";
    case "coach":
      return "Coach Moving Mountains campaign plan";
    case "staff":
      return "Admin Moving Mountains campaign plan";
    case "super_admin":
      return "Full Moving Mountains campaign plan";
    case "member":
    case "ds_admin":
      return "Moving Mountains hidden for this role";
  }
}
