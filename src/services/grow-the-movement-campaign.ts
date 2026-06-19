import type { LocalActorContext } from "@/services/local-actor-context";

export type GrowTheMovementPhaseKey =
  | "referral_owner_map"
  | "partnership_outreach"
  | "alumni_proof_setup"
  | "conversion_followup"
  | "coach_growth_review";

export type GrowTheMovementPhase = {
  key: GrowTheMovementPhaseKey;
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

export type GrowTheMovementCampaignPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  route: "/campaigns/grow-the-movement";
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  phases: GrowTheMovementPhase[];
  closeoutChecks: string[];
  safetyReminders: string[];
};

export function getGrowTheMovementCampaignPlan(
  actor: LocalActorContext,
): GrowTheMovementCampaignPlan {
  if (actor.audience === "chapter_member" || actor.audience === "ds_admin") {
    return {
      canReadPlan: false,
      title: "Grow the Movement hidden for this role",
      summary:
        "Members should see simple invite actions and DS Admin should stay in integration safety views.",
      route: "/campaigns/grow-the-movement",
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
      "This deepens the Grow the Movement starter shell into a mock-safe operating plan: leaders assign referral owners, prepare partnership outreach, use alumni proof, follow up with interested students, and bring conversion health into coach review before any real CRM, referral, message, or alumni workflow is enabled.",
    route: "/campaigns/grow-the-movement",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    phases: growTheMovementPhases,
    closeoutChecks: [
      "Every referral or partnership push has a named human owner.",
      "Alumni and peer proof explain why joining MEDLIFE feels credible and active.",
      "Interested students have a clear next action before any automation exists.",
      "Coach review can separate outreach confidence, proof quality, and follow-up discipline.",
      "No referral, CRM, alumni, reminder, warehouse, Power BI, SMS, email, or AI send is enabled.",
    ],
    safetyReminders: [
      "This panel does not create contacts, send invites, update HubSpot, publish proof, or message alumni.",
      "Use it as the review shape for a future Grow the Movement campaign build.",
      "Live referral, partnership, membership, and alumni writes still require auth, RLS, audit, rollback, consent, and explicit approval.",
    ],
  };
}

const growTheMovementPhases: GrowTheMovementPhase[] = [
  {
    key: "referral_owner_map",
    label: "Map referral owners",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Members know who is inviting friends and which chapter action new students should join first.",
    leaderTask:
      "Assign referral owners, target groups, invite prompts, and the first follow-up action before outreach begins.",
    proofPrompt:
      "Capture the invite story that helped a student understand why MEDLIFE was worth joining.",
    kpiSignals: ["referrals", "new_members", "followups_completed"],
    structuredEvents: ["growth_referral_owner_map_planned", "member_invite_path_planned"],
    disabledOutboxDestinations: ["HubSpot", "SMS", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "partnership_outreach",
    label: "Open campus partnerships",
    ownerRole: "Action Committee Chair",
    studentVisibleOutcome:
      "Students encounter MEDLIFE through trusted campus groups and know the next low-friction step.",
    leaderTask:
      "Choose campus partners, assign an outreach owner, write the shared action, and decide how follow-up will stay human.",
    proofPrompt:
      "Record which partnership message made MEDLIFE feel relevant to another student group.",
    kpiSignals: ["partnerships_opened", "referrals", "new_members"],
    structuredEvents: [
      "growth_partnership_outreach_planned",
      "partner_next_action_planned",
    ],
    disabledOutboxDestinations: ["n8n", "SMS", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "alumni_proof_setup",
    label: "Prepare alumni proof",
    ownerRole: "E-Board Member",
    studentVisibleOutcome:
      "Prospective members see credible proof that MEDLIFE changes students, campuses, and communities.",
    leaderTask:
      "Choose one alumni or peer proof item, connect it to the invite path, and decide where leaders can use it.",
    proofPrompt:
      "Capture the alumni or peer proof that answers why joining MEDLIFE is worth a student's time.",
    kpiSignals: ["proof_items", "referrals", "new_members"],
    structuredEvents: ["growth_alumni_proof_planned", "proof_invite_use_planned"],
    disabledOutboxDestinations: ["AI summary", "warehouse", "Power BI"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "conversion_followup",
    label: "Follow up with interested students",
    ownerRole: "Action Committee Member",
    studentVisibleOutcome:
      "Interested students receive a specific next step instead of being left with a general invitation.",
    leaderTask:
      "Sort interested students by source, assign follow-up owners, and decide the next action each group should take.",
    proofPrompt:
      "Capture the follow-up detail that moved a student from interest to their first chapter action.",
    kpiSignals: ["followups_completed", "new_members", "referrals"],
    structuredEvents: [
      "growth_conversion_followup_planned",
      "new_member_next_action_planned",
    ],
    disabledOutboxDestinations: ["HubSpot", "n8n", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "coach_growth_review",
    label: "Prepare growth review",
    ownerRole: "Coach",
    studentVisibleOutcome:
      "The chapter gets support when growth is blocked by weak invitations, proof, or follow-up.",
    leaderTask:
      "Bring referral, partnership, alumni proof, conversion, and follow-up signals into coach review.",
    proofPrompt:
      "Capture the coach note that explains whether the chapter should advance, adjust, or pause the growth push.",
    kpiSignals: ["coach_review_ready", "growth_health", "intervention_needed"],
    structuredEvents: ["coach_growth_review_prepared", "growth_next_step_decision_planned"],
    disabledOutboxDestinations: ["HubSpot", "n8n", "AI summary"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
];

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_leader":
      return "Leader Grow the Movement campaign plan";
    case "coach":
      return "Coach Grow the Movement campaign plan";
    case "admin":
      return "Admin Grow the Movement campaign plan";
    case "super_admin":
      return "Full Grow the Movement campaign plan";
    case "chapter_member":
    case "ds_admin":
      return "Grow the Movement hidden for this role";
  }
}
