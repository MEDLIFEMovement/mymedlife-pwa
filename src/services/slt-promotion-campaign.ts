import type { LocalActorContext } from "@/services/local-actor-context";

export type SltPromotionPhaseKey =
  | "belief_proof_setup"
  | "info_session_ready"
  | "question_followup"
  | "commitment_path"
  | "coach_slt_review";

export type SltPromotionPhase = {
  key: SltPromotionPhaseKey;
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

export type SltPromotionCampaignPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  route: "/campaigns/slt-promotion";
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  phases: SltPromotionPhase[];
  closeoutChecks: string[];
  safetyReminders: string[];
};

export function getSltPromotionCampaignPlan(
  actor: LocalActorContext,
): SltPromotionCampaignPlan {
  if (actor.audience === "chapter_member" || actor.audience === "ds_admin") {
    return {
      canReadPlan: false,
      title: "SLT Promotion hidden for this role",
      summary:
        "Members should see simple SLT interest paths and DS Admin should stay in integration safety views.",
      route: "/campaigns/slt-promotion",
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      phases: [],
      closeoutChecks: [],
      safetyReminders: [],
    };
  }

  return {
    canReadPlan: true,
    title: getTitle(actor),
    summary:
      "This deepens the SLT Promotion starter shell into a mock-safe operating plan: leaders prepare belief-building proof, run an info session, track student hesitations, move interested students to a next step, and bring a clean readiness view to coach review before any real deposits, reminders, or CRM writes exist.",
    route: "/campaigns/slt-promotion",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    phases: sltPromotionPhases,
    closeoutChecks: [
      "The info session has one next action a student can take after attending.",
      "Common cost, time, travel, and parent questions are tracked with owners.",
      "Interested students have a human follow-up owner before any automation exists.",
      "At least one proof item explains why an SLT is worth considering.",
      "No deposit, reminder, CRM, warehouse, Power BI, SMS, email, or AI send is enabled.",
    ],
    safetyReminders: [
      "This panel does not collect deposits, send reminders, create HubSpot records, or enroll students.",
      "Use it as the review shape for a future SLT Promotion campaign build.",
      "Live SLT promotion writes still require auth, RLS, audit, rollback, consent, and explicit approval.",
    ],
  };
}

const sltPromotionPhases: SltPromotionPhase[] = [
  {
    key: "belief_proof_setup",
    label: "Prepare belief-building proof",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Students see why an SLT is meaningful before they are asked to commit time or money.",
    leaderTask:
      "Choose one student story, trip outcome, or partner-community proof point that answers why SLT matters.",
    proofPrompt:
      "Capture the short story or quote that makes the SLT feel real, specific, and worth discussing.",
    kpiSignals: ["proof_items", "interest_signals", "questions_collected"],
    structuredEvents: ["slt_belief_proof_planned", "slt_question_bank_started"],
    disabledOutboxDestinations: ["AI summary", "Power BI", "warehouse"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "info_session_ready",
    label: "Run the SLT info session",
    ownerRole: "Action Committee Chair",
    studentVisibleOutcome:
      "Students get a clear, low-pressure way to learn about the trip, costs, timeline, and next step.",
    leaderTask:
      "Set the session objective, host, question prompts, proof item, and follow-up owner before the session.",
    proofPrompt:
      "Capture what made the session shift a student from curious to interested or from unsure to clearer.",
    kpiSignals: ["info_sessions", "session_attendance", "interested_students"],
    structuredEvents: ["slt_info_session_planned", "slt_interest_capture_planned"],
    disabledOutboxDestinations: ["Luma", "SMS", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "question_followup",
    label: "Track questions and hesitations",
    ownerRole: "Action Committee Member",
    studentVisibleOutcome:
      "Students with real questions receive a human answer instead of falling out of the process.",
    leaderTask:
      "Sort open questions by cost, time, travel, parent concerns, and fit, then assign follow-up owners.",
    proofPrompt:
      "Record the question or hesitation that changed after a useful student-to-student follow-up.",
    kpiSignals: ["followups_completed", "open_questions", "hesitations_resolved"],
    structuredEvents: ["slt_question_followup_planned", "slt_hesitation_logged"],
    disabledOutboxDestinations: ["HubSpot", "n8n", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "commitment_path",
    label: "Move interested students to next step",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Interested students know the next real step without being pressured by hidden automation.",
    leaderTask:
      "Decide which students need a personal follow-up, financial aid explanation, parent answer, or deposit-readiness conversation.",
    proofPrompt:
      "Capture the next-step explanation that helped a student understand whether they were ready to move forward.",
    kpiSignals: ["interested_students", "deposits", "followups_completed"],
    structuredEvents: ["slt_commitment_path_planned", "slt_deposit_readiness_reviewed"],
    disabledOutboxDestinations: ["HubSpot", "SMS", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "coach_slt_review",
    label: "Prepare SLT promotion review",
    ownerRole: "Coach",
    studentVisibleOutcome:
      "The chapter gets support when interest is high but the next-step path is unclear.",
    leaderTask:
      "Bring session attendance, questions, follow-ups, proof, and next-step readiness into coach review.",
    proofPrompt:
      "Capture the coach note that explains whether SLT promotion should keep going, adjust, or pause.",
    kpiSignals: ["coach_review_ready", "slt_health", "intervention_needed"],
    structuredEvents: ["coach_slt_review_prepared", "slt_next_step_decision_planned"],
    disabledOutboxDestinations: ["HubSpot", "n8n", "AI summary"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
];

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_leader":
      return "Leader SLT Promotion campaign plan";
    case "coach":
      return "Coach SLT Promotion campaign plan";
    case "admin":
      return "Admin SLT Promotion campaign plan";
    case "super_admin":
      return "Full SLT Promotion campaign plan";
    case "chapter_member":
    case "ds_admin":
      return "SLT Promotion hidden for this role";
  }
}
