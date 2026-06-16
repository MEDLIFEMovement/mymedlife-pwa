import type { AssignmentLane, ChapterRole, IntegrationEvent } from "@/shared/types/domain";

export type CampaignShellStatus = "active" | "planned" | "template";

export type CampaignFamily =
  | "rush_month"
  | "planning_goal_setting"
  | "chapter_engagement"
  | "fundraising"
  | "local_volunteering"
  | "med_talk"
  | "social"
  | "slt_promotion"
  | "moving_mountains"
  | "leadership_transition"
  | "grow_the_movement"
  | "start_a_chapter"
  | "mobile_clinic"
  | "proof_storytelling";

export type CampaignShell = {
  slug: string;
  name: string;
  family: CampaignFamily;
  status: CampaignShellStatus;
  summary: string;
  studentPromise: string;
  operatingRhythm: string;
  actionCommitteeLanes: string[];
  proofUse: string;
  coachFocus: string;
  primaryKpis: string[];
  integrationPosture: string;
};

export type ActionCommittee = {
  id: string;
  name: string;
  lane: string;
  purpose: string;
  typicalOwnerRole: ChapterRole;
  sampleMonthlyActions: string[];
};

export type ChapterEventPlan = {
  id: string;
  title: string;
  campaignSlug: string;
  committeeId: string;
  eventType: "fundraiser" | "local_volunteering" | "med_talk" | "social" | "slt_info" | "clinic_support";
  ownerRole: ChapterRole;
  supportLane: AssignmentLane;
  timing: string;
  lumaStatus: "mock_linked" | "not_linked" | "future_sync_disabled";
  expectedStudentAction: string;
  feedbackPlan: string;
  proofPrompt: string;
  npsQuestion: string;
};

export type ProofLibraryItem = {
  id: string;
  campaignSlug: string;
  sourceLabel: string;
  proofType: "bridge_video" | "testimonial_text" | "event_photo" | "alumni_ugc" | "chapter_recap";
  hesitationAddressed: string;
  summary: string;
  sharingStatus: "needs_hq_review" | "approved_for_internal_learning" | "not_shared" | "future_public_candidate";
  recommendedUse: string;
};

export type CampaignReadinessSummary = {
  activeCampaigns: number;
  plannedCampaigns: number;
  templateCampaigns: number;
  linkedMockEvents: number;
  hqProofItems: number;
  disabledIntegrationEvents: number;
};

export type CampaignIntegrationPosture = {
  campaignSlug: string;
  safeToSendExternally: false;
  events: IntegrationEvent[];
};
