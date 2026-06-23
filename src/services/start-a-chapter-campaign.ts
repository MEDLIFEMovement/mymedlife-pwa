import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type StartAChapterPhaseKey =
  | "expansion_interest"
  | "founding_team"
  | "first_event_plan"
  | "readiness_gate_review"
  | "coach_handoff";

export type StartAChapterPhase = {
  key: StartAChapterPhaseKey;
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

export type StartAChapterCampaignPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  route: "/campaigns/start-a-chapter";
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  phases: StartAChapterPhase[];
  closeoutChecks: string[];
  safetyReminders: string[];
};

export function getStartAChapterCampaignPlan(
  actor: LocalActorContext,
): StartAChapterCampaignPlan {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return {
      canReadPlan: false,
      title: "Start a Chapter hidden for this role",
      summary:
        "Members should see simple founding-team next steps and DS Admin should stay in integration safety views.",
      route: "/campaigns/start-a-chapter",
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
      "This deepens the Start a Chapter starter shell into a mock-safe operating plan: staff and coaches confirm campus interest, form a founding team, prepare first events, review readiness gates, and plan the handoff into normal chapter coaching before any real CRM, chapter, role, or membership writes are enabled.",
    route: "/campaigns/start-a-chapter",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    phases: startAChapterPhases,
    closeoutChecks: [
      "Campus interest has a named owner, sponsor signal, and next human follow-up.",
      "The founding team has clear roles before public chapter activity begins.",
      "First events create member action and proof, not only awareness.",
      "Readiness gates are visible before the chapter moves into normal operations.",
      "No chapter create, role update, membership change, CRM, warehouse, Power BI, SMS, email, or AI send is enabled.",
    ],
    safetyReminders: [
      "This panel does not create chapters, approve founding teams, edit roles, or contact prospects.",
      "Use it as the review shape for a future Start a Chapter campaign build.",
      "Live expansion, chapter, role, membership, and CRM writes still require auth, RLS, audit, rollback, staff approval, and explicit approval.",
    ],
  };
}

const startAChapterPhases: StartAChapterPhase[] = [
  {
    key: "expansion_interest",
    label: "Confirm campus interest",
    ownerRole: "Admin",
    studentVisibleOutcome:
      "A founding student knows the next concrete step and who is helping them start MEDLIFE on campus.",
    leaderTask:
      "Record the campus signal, sponsor status, founding student owner, next conversation, and staff follow-up need.",
    proofPrompt:
      "Capture the founding-student note that explains why this campus is ready to explore MEDLIFE.",
    kpiSignals: ["readiness_gates", "founding_team", "coach_handoff"],
    structuredEvents: [
      "chapter_expansion_interest_planned",
      "campus_sponsor_signal_reviewed",
    ],
    disabledOutboxDestinations: ["HubSpot", "CRM write", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "founding_team",
    label: "Build the founding team",
    ownerRole: "Coach",
    studentVisibleOutcome:
      "Founding students can see the first leader roles and how to invite the next committed people.",
    leaderTask:
      "Map the founding team, role gaps, outreach owners, and first shared action before the chapter is treated as active.",
    proofPrompt:
      "Capture the founding-team detail that shows the group is becoming more than one interested student.",
    kpiSignals: ["founding_team", "members_joined", "readiness_gates"],
    structuredEvents: [
      "founding_team_recruitment_planned",
      "founding_role_gap_flagged",
    ],
    disabledOutboxDestinations: ["role write", "membership update", "SMS"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "first_event_plan",
    label: "Plan first chapter events",
    ownerRole: "Action Committee Chair",
    studentVisibleOutcome:
      "New students get a first event or action that makes the chapter feel real and easy to join.",
    leaderTask:
      "Plan the first event, host, invite path, proof prompt, feedback question, and follow-up owner.",
    proofPrompt:
      "Record what made the first event feel repeatable and worth joining for a new student.",
    kpiSignals: ["first_events", "members_joined", "proof_items"],
    structuredEvents: ["first_chapter_event_planned", "founding_event_proof_planned"],
    disabledOutboxDestinations: ["Luma", "n8n", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "readiness_gate_review",
    label: "Review readiness gates",
    ownerRole: "Admin",
    studentVisibleOutcome:
      "The founding team understands what must be true before the chapter becomes active.",
    leaderTask:
      "Review sponsor signal, founding team coverage, first event plan, member interest, proof readiness, and open blockers.",
    proofPrompt:
      "Capture the readiness note that explains whether the chapter should advance, hold, or receive more support.",
    kpiSignals: ["readiness_gates", "founding_team", "open_risks"],
    structuredEvents: [
      "chapter_readiness_gate_reviewed",
      "chapter_activation_decision_planned",
    ],
    disabledOutboxDestinations: ["chapter create", "Power BI", "warehouse"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "coach_handoff",
    label: "Prepare coach handoff",
    ownerRole: "Coach",
    studentVisibleOutcome:
      "The new chapter knows who supports them next and what the first operating rhythm should be.",
    leaderTask:
      "Bring campus interest, founding team, first events, readiness gates, and open risks into the coach handoff.",
    proofPrompt:
      "Capture the coach handoff note that explains how the chapter should move into normal operating support.",
    kpiSignals: ["coach_handoff", "readiness_gates", "first_events"],
    structuredEvents: [
      "coach_expansion_handoff_prepared",
      "chapter_portfolio_entry_planned",
    ],
    disabledOutboxDestinations: ["HubSpot", "n8n", "AI summary"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
];

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Leader Start a Chapter campaign plan";
    case "coach":
      return "Coach Start a Chapter campaign plan";
    case "staff":
      return "Admin Start a Chapter campaign plan";
    case "super_admin":
      return "Full Start a Chapter campaign plan";
    case "member":
    case "ds_admin":
      return "Start a Chapter hidden for this role";
  }
}
