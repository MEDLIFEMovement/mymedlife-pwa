import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type PlanningGoalSettingPhaseKey =
  | "goal_alignment"
  | "owner_map"
  | "action_calendar"
  | "risk_review"
  | "coach_checkin";

export type PlanningGoalSettingPhase = {
  key: PlanningGoalSettingPhaseKey;
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

export type PlanningGoalSettingCampaignPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  route: "/campaigns/planning-goal-setting";
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  phases: PlanningGoalSettingPhase[];
  closeoutChecks: string[];
  safetyReminders: string[];
};

export function getPlanningGoalSettingCampaignPlan(
  actor: LocalActorContext,
): PlanningGoalSettingCampaignPlan {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return {
      canReadPlan: false,
      title: "Planning / Goal Setting hidden for this role",
      summary:
        "Members should see the active campaign and DS Admin should stay in integration safety views.",
      route: "/campaigns/planning-goal-setting",
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      phases: [],
      closeoutChecks: [],
      safetyReminders: [],
    };
  }

  return {
    canReadPlan: true,
    title: getTitle(surfaceFamily),
    summary:
      "This deepens the Planning / Goal Setting starter shell into a mock-safe operating plan: leaders define goals, assign owners, publish the first action calendar, review risks, and prepare a coach check-in before any real campaign writes are enabled.",
    route: "/campaigns/planning-goal-setting",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    phases: planningGoalSettingPhases,
    closeoutChecks: [
      "Every chapter goal has one accountable owner.",
      "The first two weeks of student-facing actions are visible.",
      "Risks have a named next step instead of becoming vague blockers.",
      "Coach check-in notes can be translated into future KPI events.",
      "No reminder, CRM, warehouse, Power BI, SMS, email, or AI send is enabled.",
    ],
    safetyReminders: [
      "This panel does not create goals, assignments, meetings, or campaign templates.",
      "Use it as the review shape for a future Planning / Goal Setting campaign build.",
      "Live writes still require auth, RLS, audit, rollback, and explicit approval.",
    ],
  };
}

const planningGoalSettingPhases: PlanningGoalSettingPhase[] = [
  {
    key: "goal_alignment",
    label: "Set the chapter goal",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Members can understand what the chapter is trying to accomplish this month.",
    leaderTask:
      "Write one specific growth, engagement, fundraising, or SLT goal with a deadline and accountable owner.",
    proofPrompt:
      "Capture the before/after leadership note that explains why this goal matters.",
    kpiSignals: ["goals_set", "deadline_defined", "owner_named"],
    structuredEvents: ["campaign_goal_defined", "kpi_event_planned"],
    disabledOutboxDestinations: ["n8n", "Power BI", "warehouse"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "owner_map",
    label: "Assign owner lanes",
    ownerRole: "E-Board Member",
    studentVisibleOutcome:
      "Students see who owns outreach, events, proof, and follow-up instead of guessing.",
    leaderTask:
      "Map each goal to an E-Board owner, Action Committee Chair, and student-facing lane.",
    proofPrompt:
      "Record what changed once ownership became visible to the chapter.",
    kpiSignals: ["owners_assigned", "lanes_covered", "committee_roles_named"],
    structuredEvents: ["campaign_owner_assigned", "role_lane_reviewed"],
    disabledOutboxDestinations: ["HubSpot", "n8n", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "action_calendar",
    label: "Publish first actions",
    ownerRole: "Action Committee Chair",
    studentVisibleOutcome:
      "Members know the first concrete action or event they can join this week.",
    leaderTask:
      "Turn each owner lane into a first action, event, proof prompt, and follow-up date.",
    proofPrompt:
      "Collect a short student or leader note explaining which first action felt easiest to start.",
    kpiSignals: ["calendar_published", "actions_opened", "proof_prompts_ready"],
    structuredEvents: ["campaign_action_calendar_planned", "proof_prompt_planned"],
    disabledOutboxDestinations: ["Luma", "SMS", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "risk_review",
    label: "Name the risks",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Members experience fewer dropped commitments because leaders name blockers early.",
    leaderTask:
      "List the top risks, decide who owns each follow-up, and mark what would require coach support.",
    proofPrompt:
      "Capture one concrete risk that became easier to handle because it was named early.",
    kpiSignals: ["risks_identified", "followups_assigned", "coach_support_needed"],
    structuredEvents: ["campaign_risk_flagged", "leader_followup_planned"],
    disabledOutboxDestinations: ["n8n", "Power BI", "warehouse"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "coach_checkin",
    label: "Prepare coach check-in",
    ownerRole: "Coach",
    studentVisibleOutcome:
      "The chapter gets practical support before the campaign loses momentum.",
    leaderTask:
      "Bring goals, owner lanes, first actions, proof prompts, and risks into the coach review.",
    proofPrompt:
      "Capture the coach note that explains whether the chapter should advance, hold, or receive intervention.",
    kpiSignals: ["coach_checkins", "readiness_status", "intervention_needed"],
    structuredEvents: ["coach_checkin_prepared", "coach_decision_planned"],
    disabledOutboxDestinations: ["HubSpot", "n8n", "AI summary"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
];

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Leader Planning / Goal Setting campaign plan";
    case "coach":
      return "Coach Planning / Goal Setting campaign plan";
    case "staff":
      return "Admin Planning / Goal Setting campaign plan";
    case "super_admin":
      return "Full Planning / Goal Setting campaign plan";
    case "member":
    case "ds_admin":
      return "Planning / Goal Setting hidden for this role";
  }
}
