import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type LeadershipTransitionPhaseKey =
  | "successor_map"
  | "role_notes_handoff"
  | "committee_chair_confirm"
  | "coach_handoff"
  | "transition_risk_closeout";

export type LeadershipTransitionPhase = {
  key: LeadershipTransitionPhaseKey;
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

export type LeadershipTransitionCampaignPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  route: "/campaigns/leadership-transition";
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  phases: LeadershipTransitionPhase[];
  closeoutChecks: string[];
  safetyReminders: string[];
};

export function getLeadershipTransitionCampaignPlan(
  actor: LocalActorContext,
): LeadershipTransitionCampaignPlan {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return {
      canReadPlan: false,
      title: "Leadership Transition hidden for this role",
      summary:
        "Members should see simple handoff confidence signals and DS Admin should stay in integration safety views.",
      route: "/campaigns/leadership-transition",
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
      "This deepens the Leadership Transition starter shell into a mock-safe operating plan: outgoing leaders name successors, write role handoff notes, confirm committee chairs, prepare coach validation, and close open risks before any real role, membership, or notification writes are enabled.",
    route: "/campaigns/leadership-transition",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    phases: leadershipTransitionPhases,
    closeoutChecks: [
      "Each critical chapter role has a named successor or a documented gap.",
      "Role notes explain what the next leader should do first, not just what the prior leader did.",
      "Action Committee Chair handoff is visible before committee work restarts.",
      "Coach validation captures whether the chapter can advance, hold, or needs intervention.",
      "No role update, membership change, reminder, CRM, warehouse, Power BI, SMS, email, or AI send is enabled.",
    ],
    safetyReminders: [
      "This panel does not change roles, approve successors, edit memberships, or notify anyone.",
      "Use it as the review shape for a future Leadership Transition campaign build.",
      "Live transition writes still require auth, RLS, audit, rollback, staff review, and explicit approval.",
    ],
  };
}

const leadershipTransitionPhases: LeadershipTransitionPhase[] = [
  {
    key: "successor_map",
    label: "Map successor coverage",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Incoming leaders know which roles are covered and which gaps need attention.",
    leaderTask:
      "Name confirmed successors, open role gaps, current owners, and the first responsibility each successor must understand.",
    proofPrompt:
      "Capture the handoff note that explains why the successor is ready or what support they still need.",
    kpiSignals: ["successors_confirmed", "open_risks", "roles_handed_off"],
    structuredEvents: [
      "leadership_successor_map_planned",
      "transition_role_gap_flagged",
    ],
    disabledOutboxDestinations: ["role write", "membership update", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "role_notes_handoff",
    label: "Write role handoff notes",
    ownerRole: "E-Board Member",
    studentVisibleOutcome:
      "New leaders can see the first actions, recurring responsibilities, and useful context for each role.",
    leaderTask:
      "Turn each outgoing role into a short handoff note with first actions, recurring work, key relationships, and open decisions.",
    proofPrompt:
      "Record the role note another chapter could copy to make its own leadership transition clearer.",
    kpiSignals: ["handoff_notes", "roles_handed_off", "open_risks"],
    structuredEvents: ["leadership_role_notes_planned", "handoff_note_review_planned"],
    disabledOutboxDestinations: ["AI summary", "warehouse", "Power BI"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "committee_chair_confirm",
    label: "Confirm committee chair handoff",
    ownerRole: "Action Committee Chair",
    studentVisibleOutcome:
      "Committee work can continue because chairs understand owner lanes, proof expectations, and next actions.",
    leaderTask:
      "Confirm each committee chair, the first committee action, proof responsibility, and the outgoing owner who can answer questions.",
    proofPrompt:
      "Capture the committee handoff detail that prevents a new chair from restarting from zero.",
    kpiSignals: ["roles_handed_off", "successors_confirmed", "handoff_notes"],
    structuredEvents: [
      "action_committee_chair_handoff_planned",
      "committee_next_action_planned",
    ],
    disabledOutboxDestinations: ["n8n", "SMS", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "coach_handoff",
    label: "Prepare coach validation",
    ownerRole: "Coach",
    studentVisibleOutcome:
      "The chapter gets a clear support decision before the new leadership team fully takes over.",
    leaderTask:
      "Bring successor coverage, role notes, committee chair status, and open risks into a coach validation review.",
    proofPrompt:
      "Capture the coach note that explains whether the transition is ready, should hold, or needs intervention.",
    kpiSignals: ["coach_validations", "open_risks", "successors_confirmed"],
    structuredEvents: [
      "coach_transition_review_prepared",
      "transition_validation_decision_planned",
    ],
    disabledOutboxDestinations: ["HubSpot", "n8n", "AI summary"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "transition_risk_closeout",
    label: "Close transition risks",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Incoming leaders see the unresolved risks and who owns the next follow-up.",
    leaderTask:
      "Name each open risk, assign a follow-up owner, decide what must happen before handoff closes, and mark what needs staff attention.",
    proofPrompt:
      "Capture the risk that changed from vague concern into a clear owner, action, and deadline.",
    kpiSignals: ["open_risks", "followups_completed", "coach_validations"],
    structuredEvents: [
      "transition_risk_closeout_planned",
      "transition_staff_review_planned",
    ],
    disabledOutboxDestinations: ["HubSpot", "Power BI", "warehouse"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
];

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Leader Leadership Transition campaign plan";
    case "coach":
      return "Coach Leadership Transition campaign plan";
    case "staff":
      return "Admin Leadership Transition campaign plan";
    case "super_admin":
      return "Full Leadership Transition campaign plan";
    case "member":
    case "ds_admin":
      return "Leadership Transition hidden for this role";
  }
}
