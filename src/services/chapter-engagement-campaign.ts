import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type ChapterEngagementPhaseKey =
  | "participation_pulse"
  | "event_momentum"
  | "recognition_loop"
  | "retention_followup"
  | "coach_engagement_review";

export type ChapterEngagementPhase = {
  key: ChapterEngagementPhaseKey;
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

export type ChapterEngagementCampaignPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  route: "/campaigns/chapter-engagement";
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  phases: ChapterEngagementPhase[];
  closeoutChecks: string[];
  safetyReminders: string[];
};

export function getChapterEngagementCampaignPlan(
  actor: LocalActorContext,
): ChapterEngagementCampaignPlan {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return {
      canReadPlan: false,
      title: "Chapter Engagement hidden for this role",
      summary:
        "Members should see simple participation opportunities and DS Admin should stay in integration safety views.",
      route: "/campaigns/chapter-engagement",
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
      "This deepens the Chapter Engagement starter shell into a mock-safe operating plan: leaders create weekly participation, action committees host useful moments, members get recognized, and coaches can spot retention risk before the chapter goes quiet.",
    route: "/campaigns/chapter-engagement",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    phases: chapterEngagementPhases,
    closeoutChecks: [
      "Active members have at least one clear participation path.",
      "Events create a follow-up action instead of ending as attendance only.",
      "Recognition points to real student action, not vanity metrics.",
      "Retention risks have a named owner and next follow-up.",
      "No reminder, CRM, warehouse, Power BI, SMS, email, or AI send is enabled.",
    ],
    safetyReminders: [
      "This panel does not award points, send nudges, edit memberships, or publish proof.",
      "Use it as the review shape for a future Chapter Engagement campaign build.",
      "Live engagement writes still require auth, RLS, audit, rollback, and explicit approval.",
    ],
  };
}

const chapterEngagementPhases: ChapterEngagementPhase[] = [
  {
    key: "participation_pulse",
    label: "Find this week's participation pulse",
    ownerRole: "E-Board Member",
    studentVisibleOutcome:
      "Members see the simplest way to participate this week without reading leader planning detail.",
    leaderTask:
      "Pick one clear participation path for the week and decide which members need a personal invite.",
    proofPrompt:
      "Capture a short member note about why the participation path felt worth showing up for.",
    kpiSignals: ["active_members", "member_invites", "participation_path_open"],
    structuredEvents: ["engagement_pulse_planned", "member_invite_planned"],
    disabledOutboxDestinations: ["SMS", "email", "n8n"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "event_momentum",
    label: "Turn events into follow-up",
    ownerRole: "Action Committee Chair",
    studentVisibleOutcome:
      "Students leave an event knowing the next action, not just that attendance was counted.",
    leaderTask:
      "Assign a host, feedback prompt, proof prompt, and next action before the engagement event happens.",
    proofPrompt:
      "Ask one attendee to describe the moment that made the chapter feel active or welcoming.",
    kpiSignals: ["event_attendance", "next_actions_opened", "nps_score"],
    structuredEvents: ["engagement_event_planned", "event_followup_planned"],
    disabledOutboxDestinations: ["Luma", "warehouse", "Power BI"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "recognition_loop",
    label: "Recognize useful action",
    ownerRole: "Action Committee Member",
    studentVisibleOutcome:
      "Members can see which helpful actions count and feel noticed for doing them.",
    leaderTask:
      "Name the behaviors worth recognizing and connect recognition back to chapter goals.",
    proofPrompt:
      "Capture a recognition story that shows a member moved from passive attendance to action.",
    kpiSignals: ["actions_completed", "points_awarded", "recognition_moments"],
    structuredEvents: ["recognition_moment_planned", "points_signal_planned"],
    disabledOutboxDestinations: ["Power BI", "warehouse", "AI summary"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "retention_followup",
    label: "Follow up before members disappear",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Members who are drifting receive human follow-up before they feel disconnected.",
    leaderTask:
      "Identify quiet members, assign follow-up owners, and decide which action would help each person reconnect.",
    proofPrompt:
      "Record what kind of follow-up helped a member re-engage with the chapter.",
    kpiSignals: ["retention_signals", "followups_assigned", "members_reengaged"],
    structuredEvents: ["retention_risk_flagged", "member_followup_planned"],
    disabledOutboxDestinations: ["HubSpot", "SMS", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "coach_engagement_review",
    label: "Prepare engagement review",
    ownerRole: "Coach",
    studentVisibleOutcome:
      "The chapter gets support when engagement is slipping instead of waiting for a failed campaign closeout.",
    leaderTask:
      "Bring participation, event, recognition, and retention signals into the coach review.",
    proofPrompt:
      "Capture the coach note that explains whether engagement is building, stalled, or needs intervention.",
    kpiSignals: ["coach_review_ready", "engagement_health", "intervention_needed"],
    structuredEvents: ["coach_engagement_review_prepared", "coach_decision_planned"],
    disabledOutboxDestinations: ["HubSpot", "n8n", "AI summary"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
];

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Leader Chapter Engagement campaign plan";
    case "coach":
      return "Coach Chapter Engagement campaign plan";
    case "staff":
      return "Admin Chapter Engagement campaign plan";
    case "super_admin":
      return "Full Chapter Engagement campaign plan";
    case "member":
    case "ds_admin":
      return "Chapter Engagement hidden for this role";
  }
}
