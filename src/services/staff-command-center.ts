import { getAdminControlCenterSummary } from "@/services/admin-control-center";
import {
  getCampaignShells,
} from "@/services/campaign-ops-service";
import { getCoachPortfolioReadiness } from "@/services/coach-portfolio-readiness";
import type { LocalActorContext } from "@/services/local-actor-context";
import { buildStudentHomePreviewHref } from "@/services/local-preview-route";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadIntegrationOutbox,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import type { IntegrationEvent, OutboxItem } from "@/shared/types/domain";

export type StaffCommandCenterView =
  | "chapters"
  | "campaigns"
  | "proof_ugc"
  | "feed_studio"
  | "feed_analytics"
  | "hubspot"
  | "best_practices"
  | "admin";

export type StaffRiskFilter = "all" | "high" | "medium" | "low";
export type StaffCountryFilter =
  | "all"
  | "usa"
  | "canada"
  | "peru"
  | "brazil"
  | "honduras"
  | "nicaragua"
  | "kenya"
  | "uganda"
  | "chile"
  | "mexico"
  | "ghana";
export type StaffCoachFilter =
  | "all"
  | "cam_coach"
  | "maria"
  | "james"
  | "aisha"
  | "carlos"
  | "fernanda"
  | "lucia"
  | "samuel";
export type StaffPortfolioCampaignFilter =
  | "all"
  | "leadership_transition"
  | "grow_the_movement"
  | "rush_month"
  | "start_a_chapter"
  | "slt_promotion"
  | "moving_mountains"
  | "chapter_engagement";
export type StaffCampaignRiskGroup =
  | "all"
  | "no_event"
  | "low_rsvp"
  | "low_attendance"
  | "no_follow_up"
  | "evidence_stuck";
export type StaffProofQueueFilter =
  | "all"
  | "pending"
  | "chapter_only"
  | "selected"
  | "rejected";
export type StaffProofTypeFilter =
  | "all"
  | "proof_video"
  | "bridge_video"
  | "event_recap"
  | "best_practice"
  | "student_story";
export type StaffProofApprovalTier =
  | "chapter_only"
  | "selected"
  | "all_chapters"
  | "global_public";
export type StaffFeedPreviewRole = "member" | "leader";
export type StaffFeedAudienceMode =
  | "one_chapter"
  | "selected_chapters"
  | "country_region"
  | "campaign_chapters"
  | "all_chapters";
export type StaffBestPracticeCountryFilter =
  | "all"
  | "usa"
  | "canada"
  | "peru"
  | "mexico"
  | "brazil";
export type StaffBestPracticeCampaignFilter =
  | "all"
  | "rush_month"
  | "chapter_engagement"
  | "moving_mountains"
  | "grow_the_movement";

export type StaffCommandCenterMetric = {
  label: string;
  value: string;
  note: string;
};

export type StaffCommandCenterQuickAction = {
  label: string;
  href: string;
  helper: string;
  tone: "primary" | "secondary";
};

export type StaffCommandCenterViewOption = {
  key: StaffCommandCenterView;
  label: string;
  href: string;
};

export type StaffRiskFilterOption = {
  key: StaffRiskFilter;
  label: string;
  href: string;
};

export type StaffPortfolioFilterOption<T extends string> = {
  key: T;
  label: string;
  href: string;
};

export type StaffPortfolioSummaryCard = {
  label: string;
  value: string;
  note: string;
  tone: "blue" | "yellow" | "red";
};

export type StaffChapterPortfolioRow = {
  chapterId: string;
  chapterName: string;
  campus: string;
  country: string;
  coachName: string;
  leadName: string;
  campaignName: string;
  statusLabel: "On Track" | "Behind" | "Not Started" | "Paused" | "Complete";
  statusTone: "good" | "warning" | "danger" | "neutral";
  readinessScore: number;
  decision: "advance" | "hold" | "intervene";
  risk: "low" | "medium" | "high";
  leadsCount: number;
  rsvpCount: number;
  attendanceCount: number;
  assignmentsCount: number;
  proofPending: number;
  openFollowUps: number;
  pointsPerWeek: number;
  hubspotStageLabel: "MQL" | "Lead" | "SQL";
  lastActiveLabel: string;
  nextStep: string;
  supportSummary: string;
  detailHref: string;
};

const DEFAULT_STAFF_PORTFOLIO_CHAPTER_IDS = [
  "chapter-uc-berkeley",
  "chapter-yale",
  "chapter-florida",
  "chapter-mcgill",
  "chapter-pucp",
  "chapter-unmsm",
  "chapter-usp",
  "chapter-ufmg",
  "chapter-unah",
  "chapter-unan",
  "chapter-nairobi",
  "chapter-makerere",
  "chapter-stanford",
  "chapter-johns-hopkins",
  "chapter-upch",
  "chapter-u-chile",
  "chapter-unam",
  "chapter-ghana",
  "chapter-toronto",
  "chapter-mit",
] as const;

export type StaffChapterDrawerSignal = {
  label: string;
  status: string;
  detail: string;
};

export type StaffDecisionPreview = "advance" | "hold" | "intervene";

export type StaffChapterDrawerMetric = {
  label: string;
  value: string;
};

export type StaffChapterDrawerPanel = {
  title: string;
  accent: "amber" | "violet" | "sky";
  metrics: StaffChapterDrawerMetric[];
  summary: string;
};

export type StaffChapterDrawerAction = {
  label: string;
  href: string;
  tone: "primary" | "secondary";
};

export type StaffChapterDrawer = {
  chapterId: string;
  chapterName: string;
  campus: string;
  country: string;
  risk: StaffChapterPortfolioRow["risk"];
  leadName: string;
  coachName: string;
  memberCount: number;
  lastActiveLabel: string;
  campaignName: string;
  healthScore: number;
  statusLabel: StaffChapterPortfolioRow["statusLabel"];
  summary: string;
  recommendedDecision: string;
  selectedDecision: StaffDecisionPreview;
  decisionOptions: Array<{
    key: StaffDecisionPreview;
    label: string;
    href: string;
  }>;
  campaignKpis: StaffChapterDrawerMetric[];
  hubspotPanel: StaffChapterDrawerPanel;
  lumaPanel: StaffChapterDrawerPanel;
  activityPanel: StaffChapterDrawerPanel;
  coachNotePlaceholder: string;
  footerActions: StaffChapterDrawerAction[];
  closeHref: string;
  focusItems: string[];
  quickLinks: {
    label: string;
    href: string;
  }[];
  recentSignals: StaffChapterDrawerSignal[];
  sourceContext: {
    eyebrow: string;
    title: string;
    summary: string;
    actionLabel: string;
    actionHref: string;
  } | null;
};

export type StaffCampaignOperationCard = {
  slug: string;
  name: string;
  status: "active" | "planned" | "template";
  summary: string;
  primaryKpis: string[];
  actionCommitteeLanes: string[];
  recommendedStaffMove: string;
  integrationPosture: string;
  href: string;
};

export type StaffCampaignOperationsTab = {
  slug: string;
  name: string;
  href: string;
};

export type StaffCampaignRiskCard = {
  key: StaffCampaignRiskGroup;
  title: string;
  count: number;
  chapterLabels: string[];
  href: string;
  isActive: boolean;
};

export type StaffCampaignBulkAction = {
  label: string;
  href: string;
};

export type StaffCampaignExecutionRow = {
  chapterName: string;
  country: string;
  coachName: string;
  planningStatus: "complete" | "missing";
  eventCreatedLabel: string;
  eventCreatedStatus: "complete" | "missing";
  leadsCount: number;
  followUpsCompleted: number;
  followUpsTarget: number;
  evidenceReviewedCount: number;
  kpiTargetStatus: "hit" | "missed";
  decision: "advance" | "hold" | "intervene";
  href?: string;
  selected?: boolean;
};

export type StaffCampaignOperationsOverview = {
  activeCampaignCountLabel: string;
  timestampLabel: string;
  selectedCampaignSlug: string;
  selectedCampaignName: string;
  selectedRiskGroup: StaffCampaignRiskGroup;
  selectedRiskGroupLabel: string;
  clearRiskGroupHref: string;
  sourceContext: {
    eyebrow: string;
    title: string;
    summary: string;
    actionLabel: string;
    actionHref: string;
  } | null;
  tabs: StaffCampaignOperationsTab[];
  riskCards: StaffCampaignRiskCard[];
  bulkActions: StaffCampaignBulkAction[];
  executionRows: StaffCampaignExecutionRow[];
};

export type StaffProofReviewItem = {
  id: string;
  chapterLabel: string;
  contributorLabel: string;
  timeLabel: string;
  sourceLabel: string;
  proofTypeLabel: string;
  proofTypeKey: StaffProofTypeFilter;
  qualityScore: number;
  durationLabel: string;
  visibilityLabel: string;
  reviewStatus: StaffProofQueueFilter;
  consentStatusLabel: string;
  hesitationAddressed: string;
  summary: string;
  recommendedUse: string;
  engagementLabel: "high potential" | "medium potential" | "low potential";
  engagementStatsLabel?: string;
  availableApprovalTiers: StaffProofApprovalTier[];
  reviewHref: string;
};

export type StaffProofReviewPanel = {
  itemId: string;
  title: string;
  subtitle: string;
  consentLabel: string;
  consentSummary: string;
  recommendedUse: string;
  approvalOptions: Array<{
    key: StaffProofApprovalTier;
    label: string;
    href: string;
    enabled: boolean;
    statusLabel: string;
    reason: string;
    helper: string;
  }>;
  requestChangesHref: string;
  rejectHref: string;
  bestPracticeHref: string;
  notePlaceholder: string;
};

export type StaffFeedDraft = {
  id: string;
  title: string;
  sourceLabel: string;
  chapterLabel: string;
  visibilityLabel: string;
  formatLabel: string;
  curationReason: string;
  captionPreview: string;
  callToAction: string;
  publishStatusLabel: string;
  sourceHref: string;
};

export type StaffFeedAudienceOption = {
  key: StaffFeedAudienceMode;
  label: string;
  href: string;
  estimatedReachLabel: string;
};

export type StaffFeedPreviewRoleOption = {
  key: StaffFeedPreviewRole;
  label: string;
  href: string;
};

export type StaffFeedStudioWorkspace = {
  selectedDraftId: string | null;
  selectedDraft: StaffFeedDraft | null;
  sourceContext: {
    eyebrow: string;
    title: string;
    summary: string;
    actionLabel: string;
    actionHref: string;
  } | null;
  previewRole: StaffFeedPreviewRole;
  audienceMode: StaffFeedAudienceMode;
  audienceOptions: StaffFeedAudienceOption[];
  previewRoleOptions: StaffFeedPreviewRoleOption[];
  campaignTagLabel: string;
  engagementGoalLabel: string;
  estimatedReachLabel: string;
  targetChapterCountLabel: string;
  audienceRoleLabels: string[];
  audienceChapterStatusLabels: string[];
};

export type StaffFeedAnalyticsSummaryCard = {
  label: string;
  value: string;
};

export type StaffFeedAnalyticsImpactMetric = {
  question: string;
  value: string;
  detail: string;
};

export type StaffFeedAnalyticsChapterBreakdown = {
  chapterLabel: string;
  viewsLabel: string;
  tone: "good" | "neutral" | "danger";
  href?: string | null;
  actionLabel?: string | null;
};

export type StaffFeedAnalyticsPost = {
  id: string;
  title: string;
  typeLabel: string;
  audienceLabel: string;
  chapterCount: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  ctaClicks: number;
  actions: number;
  evidence: number;
  rsvps: number;
  publishedLabel: string;
  selectHref: string;
  impactMetrics: StaffFeedAnalyticsImpactMetric[];
  engagementRateLabel: string;
  topEngagement: StaffFeedAnalyticsChapterBreakdown[];
  lowEngagement: StaffFeedAnalyticsChapterBreakdown[];
};

export type StaffFeedAnalyticsWorkspace = {
  summaryCards: StaffFeedAnalyticsSummaryCard[];
  posts: StaffFeedAnalyticsPost[];
  selectedPostId: string | null;
  selectedPost: StaffFeedAnalyticsPost | null;
  sourceContext: {
    eyebrow: string;
    title: string;
    summary: string;
    actionLabel: string;
    actionHref: string;
  } | null;
  timestampLabel: string;
};

export type StaffHubSpotSignal = {
  title: string;
  statusLabel: string;
  chapterLabel: string;
  detail: string;
  nextAction: string;
};

export type StaffHubSpotChapterOption = {
  id: string;
  chapterLabel: string;
  countryLabel: string;
  href: string;
};

export type StaffHubSpotProfileMetric = {
  label: string;
  value: string;
};

export type StaffHubSpotActivityMetric = {
  label: string;
  current: number;
  total: number;
};

export type StaffHubSpotFunnelStep = {
  label: string;
  value: number;
};

export type StaffHubSpotWorkspace = {
  selectedChapterId: string | null;
  selectedChapterLabel: string;
  timestampLabel: string;
  warningLabel: string | null;
  sourceContext: {
    eyebrow: string;
    title: string;
    summary: string;
    actionLabel: string;
    actionHref: string;
  } | null;
  chapterOptions: StaffHubSpotChapterOption[];
  crmProfileMetrics: StaffHubSpotProfileMetric[];
  matchedActivityMetrics: StaffHubSpotActivityMetric[];
  funnelSteps: StaffHubSpotFunnelStep[];
};

export type StaffBestPracticeCard = {
  id: string;
  categoryLabel: string;
  title: string;
  chapterLabel: string;
  countryLabel: string;
  campaignLabel: string;
  engagementScore: number;
  whyItWorked: string;
  kpiResult: string;
  recommendedForLabels: string[];
  whyItWorks: string;
  nextMove: string;
  href: string;
  shareHref: string;
  coachHref: string;
};

export type StaffAdminSignal = {
  title: string;
  status: "ready_readonly" | "mock_only" | "blocked";
  metric: string;
  detail: string;
};

export type StaffAdminIntegrationStatus = {
  title: string;
  lastSyncLabel: string;
  status: "live" | "degraded" | "mock";
  note: string | null;
};

export type StaffAdminOutboxRow = {
  eventLabel: string;
  sourceLabel: string;
  destinationLabel: string;
  status: "success" | "failed" | "pending";
  retries: number;
  errorLabel: string;
  createdLabel: string;
  processedLabel: string;
};

export type StaffAuditItem = {
  title: string;
  detail: string;
  posture: string;
};

export type StaffAdminAuditRow = {
  actorLabel: string;
  roleLabel: string;
  actionLabel: string;
  objectLabel: string;
  chapterLabel: string;
  timestampLabel: string;
};

export type StaffAdminBackendLane = {
  eyebrow: string;
  title: string;
  summary: string;
  href: string;
};

export type StaffAdminSummaryCard = {
  label: string;
  value: string;
  note: string;
};

export type StaffOutboxSummary = {
  total: number;
  disabled: number;
  mocked: number;
  hubspot: number;
  luma: number;
  n8n: number;
  warehouse: number;
};

export type StaffAdminWorkspace = {
  title: string;
  subtitle: string;
  timestampLabel: string;
  backendLanes: StaffAdminBackendLane[];
  handoffSummaryCards: StaffAdminSummaryCard[];
  handoffConsoleCards: StaffAdminBackendLane[];
  integrationStatuses: StaffAdminIntegrationStatus[];
  retryFailedHref: string;
  failedCount: number;
  outboxRows: StaffAdminOutboxRow[];
  auditRows: StaffAdminAuditRow[];
};

export type StaffCommandCenterSourceContext = {
  eyebrow: string;
  title: string;
  summary: string;
  actions?: Array<{
    label: string;
    href: string;
  }>;
};

export type StaffCommandCenter = {
  canReadCommandCenter: boolean;
  routeBase: "/staff" | "/coach";
  title: string;
  summary: string;
  sampleLabel: string | null;
  sourceContext: StaffCommandCenterSourceContext | null;
  selectedView: StaffCommandCenterView;
  selectedCampaignSlug: string;
  selectedChapterId: string | null;
  portfolioCampaignViewHref: string;
  portfolioBestPracticesViewHref: string;
  closeChapterHref: string;
  riskFilter: StaffRiskFilter;
  countryFilter: StaffCountryFilter;
  coachFilter: StaffCoachFilter;
  portfolioCampaignFilter: StaffPortfolioCampaignFilter;
  searchQuery: string;
  selectedProofId: string | null;
  proofQueueFilter: StaffProofQueueFilter;
  proofTypeFilter: StaffProofTypeFilter;
  selectedFeedDraftId: string | null;
  selectedFeedPostId: string | null;
  selectedHubSpotChapterId: string | null;
  selectedBestPracticeId: string | null;
  bestPracticeCountryFilter: StaffBestPracticeCountryFilter;
  bestPracticeCampaignFilter: StaffBestPracticeCampaignFilter;
  feedPreviewRole: StaffFeedPreviewRole;
  feedAudienceMode: StaffFeedAudienceMode;
  canReadDetailedOutbox: boolean;
  metrics: StaffCommandCenterMetric[];
  quickActions: StaffCommandCenterQuickAction[];
  viewOptions: StaffCommandCenterViewOption[];
  riskFilters: StaffRiskFilterOption[];
  countryFilters: StaffPortfolioFilterOption<StaffCountryFilter>[];
  coachFilters: StaffPortfolioFilterOption<StaffCoachFilter>[];
  portfolioCampaignFilters: StaffPortfolioFilterOption<StaffPortfolioCampaignFilter>[];
  proofQueueFilters: StaffPortfolioFilterOption<StaffProofQueueFilter>[];
  proofTypeFilters: StaffPortfolioFilterOption<StaffProofTypeFilter>[];
  bestPracticeCountryFilters: StaffPortfolioFilterOption<StaffBestPracticeCountryFilter>[];
  bestPracticeCampaignFilters: StaffPortfolioFilterOption<StaffBestPracticeCampaignFilter>[];
  portfolioSummaryCards: StaffPortfolioSummaryCard[];
  chapterRows: StaffChapterPortfolioRow[];
  selectedChapter: StaffChapterDrawer | null;
  campaignCards: StaffCampaignOperationCard[];
  campaignOperations: StaffCampaignOperationsOverview;
  proofReviewItems: StaffProofReviewItem[];
  selectedProofReview: StaffProofReviewPanel | null;
  feedDrafts: StaffFeedDraft[];
  feedStudio: StaffFeedStudioWorkspace;
  feedAnalytics: StaffFeedAnalyticsWorkspace;
  feedInsights: StaffCommandCenterMetric[];
  hubspotWorkspace: StaffHubSpotWorkspace;
  hubspotSignals: StaffHubSpotSignal[];
  bestPracticeCards: StaffBestPracticeCard[];
  adminWorkspace: StaffAdminWorkspace;
  adminSignals: StaffAdminSignal[];
  outboxSummary: StaffOutboxSummary;
  auditItems: StaffAuditItem[];
  leaderboardRows: {
    displayName: string;
    roleLabel: string;
    points: number;
    recognition: string;
  }[];
  safetyNote: string;
};

export type StaffCommandCenterOptions = {
  routeBase?: "/staff" | "/coach";
  campaign?: string;
  campaignRisk?: string;
  source?: string;
  view?: string;
  risk?: string;
  query?: string;
  chapterId?: string;
  country?: string;
  coach?: string;
  portfolioCampaign?: string;
  decision?: string;
  proof?: string;
  proofQueue?: string;
  proofType?: string;
  feedAudience?: string;
  feedDraft?: string;
  feedPost?: string;
  hubspotChapter?: string;
  bestPractice?: string;
  practiceCountry?: string;
  practiceCampaign?: string;
  feedRole?: string;
};

const staffViewLabels: Record<StaffCommandCenterView, string> = {
  chapters: "Chapters",
  campaigns: "Campaigns",
  proof_ugc: "Proof / UGC",
  feed_studio: "Feed Studio",
  feed_analytics: "Feed Analytics",
  hubspot: "HubSpot",
  best_practices: "Best Practices",
  admin: "Admin",
};

const staffProofQueueLabels: Record<StaffProofQueueFilter, string> = {
  all: "All",
  pending: "Pending",
  chapter_only: "Chapter Only",
  selected: "Selected",
  rejected: "Rejected",
};

const staffProofTypeLabels: Record<StaffProofTypeFilter, string> = {
  all: "All Types",
  proof_video: "Proof video",
  bridge_video: "Bridge video",
  event_recap: "Event recap",
  best_practice: "Best practice",
  student_story: "Student story",
};

const staffBestPracticeCountryLabels: Record<StaffBestPracticeCountryFilter, string> = {
  all: "All Countries",
  usa: "USA",
  canada: "Canada",
  peru: "Peru",
  mexico: "Mexico",
  brazil: "Brazil",
};

const staffBestPracticeCampaignLabels: Record<StaffBestPracticeCampaignFilter, string> = {
  all: "All Campaigns",
  rush_month: "Rush Month",
  chapter_engagement: "Chapter Engagement",
  moving_mountains: "Moving Mountains",
  grow_the_movement: "Grow the Movement",
};

const staffProofQueueSeeds: Array<{
  id: string;
  chapterLabel: string;
  contributorLabel: string;
  timeLabel: string;
  sourceLabel: string;
  proofTypeKey: StaffProofTypeFilter;
  qualityScore: number;
  durationLabel: string;
  visibilityLabel: string;
  reviewStatus: StaffProofQueueFilter;
  consentStatusLabel: string;
  hesitationAddressed: string;
  summary: string;
  recommendedUse: string;
  engagementLabel: StaffProofReviewItem["engagementLabel"];
  engagementStatsLabel?: string;
  availableApprovalTiers: StaffProofApprovalTier[];
}> = [
  {
    id: "proof-uc-berkeley-rush-video",
    chapterLabel: "UC Berkeley",
    contributorLabel: "Priya Nair",
    timeLabel: "2h ago",
    sourceLabel: "Rush Month tabling proof",
    proofTypeKey: "proof_video",
    qualityScore: 94,
    durationLabel: "2:18",
    visibilityLabel: "Public",
    reviewStatus: "pending",
    consentStatusLabel: "Public",
    hesitationAddressed: "I do not know anyone in the chapter.",
    summary: "Incredible energy at our Rush Month tabling event! Over 80 people stopped by.",
    recommendedUse: "Promote Rush Month momentum and recruit the next wave of tabling volunteers.",
    engagementLabel: "high potential",
    availableApprovalTiers: ["chapter_only", "selected", "all_chapters", "global_public"],
  },
  {
    id: "proof-unam-bridge-video",
    chapterLabel: "UNAM Mexico City",
    contributorLabel: "Rodrigo Hernandez",
    timeLabel: "5h ago",
    sourceLabel: "Healthcare access bridge video",
    proofTypeKey: "bridge_video",
    qualityScore: 88,
    durationLabel: "3:42",
    visibilityLabel: "Multi-Chapter",
    reviewStatus: "selected",
    consentStatusLabel: "Selected chapters only",
    hesitationAddressed: "I care about health equity, but I do not know where I fit.",
    summary:
      "A powerful story about why healthcare access matters in rural communities.",
    recommendedUse: "Use this in selected chapter onboarding and mission-belief moments.",
    engagementLabel: "high potential",
    availableApprovalTiers: ["chapter_only", "selected"],
  },
  {
    id: "proof-florida-event-recap",
    chapterLabel: "University of Florida",
    contributorLabel: "Marcus Webb",
    timeLabel: "1d ago",
    sourceLabel: "Intro night event recap",
    proofTypeKey: "event_recap",
    qualityScore: 76,
    durationLabel: "0:36",
    visibilityLabel: "Public",
    reviewStatus: "pending",
    consentStatusLabel: "Public",
    hesitationAddressed: "I am not sure chapter events are worth showing up for.",
    summary: "Our info night brought in 78 attendees and our strongest turnout yet.",
    recommendedUse: "Support event promotion, RSVP conversion, and leader follow-up coaching.",
    engagementLabel: "medium potential",
    engagementStatsLabel: "142 views · 31 likes",
    availableApprovalTiers: ["chapter_only", "selected", "all_chapters", "global_public"],
  },
  {
    id: "proof-stanford-best-practice",
    chapterLabel: "Stanford University",
    contributorLabel: "Mia Rodriguez",
    timeLabel: "1d ago",
    sourceLabel: "QR-code lead capture playbook",
    proofTypeKey: "best_practice",
    qualityScore: 97,
    durationLabel: "0:57",
    visibilityLabel: "Public",
    reviewStatus: "pending",
    consentStatusLabel: "Public",
    hesitationAddressed: "Our chapter cannot capture enough leads to grow consistently.",
    summary:
      "How we captured 91 leads in one weekend using QR codes at five campus events.",
    recommendedUse: "Mark as reusable best practice and feed it into chapter-leader coaching.",
    engagementLabel: "high potential",
    engagementStatsLabel: "380 views · 87 likes",
    availableApprovalTiers: ["chapter_only", "selected", "all_chapters", "global_public"],
  },
  {
    id: "proof-nairobi-student-story",
    chapterLabel: "University of Nairobi",
    contributorLabel: "Faith Wanjiru",
    timeLabel: "2d ago",
    sourceLabel: "Student belief story",
    proofTypeKey: "student_story",
    qualityScore: 91,
    durationLabel: "4:10",
    visibilityLabel: "Public",
    reviewStatus: "pending",
    consentStatusLabel: "Public",
    hesitationAddressed: "I am not sure MEDLIFE will feel personally meaningful to me.",
    summary: "Faith shares how MEDLIFE changed her understanding of community health.",
    recommendedUse: "Use this when students need belief, identity, and mission connection.",
    engagementLabel: "high potential",
    availableApprovalTiers: ["chapter_only", "selected", "all_chapters", "global_public"],
  },
  {
    id: "proof-pucp-chapter-only",
    chapterLabel: "PUCP Lima",
    contributorLabel: "Valentina Ruiz",
    timeLabel: "3d ago",
    sourceLabel: "Faculty tabling proof",
    proofTypeKey: "proof_video",
    qualityScore: 62,
    durationLabel: "1:34",
    visibilityLabel: "Chapter Only",
    reviewStatus: "chapter_only",
    consentStatusLabel: "Chapter only",
    hesitationAddressed: "I do not know what outreach should look like in practice.",
    summary: "Rush table at the faculty of medicine.",
    recommendedUse: "Keep it local to the chapter while the story is still narrow and tactical.",
    engagementLabel: "medium potential",
    availableApprovalTiers: ["chapter_only"],
  },
  {
    id: "proof-makerere-consent-pending",
    chapterLabel: "Makerere University",
    contributorLabel: "Grace Nakato",
    timeLabel: "3d ago",
    sourceLabel: "Event recap draft",
    proofTypeKey: "event_recap",
    qualityScore: 79,
    durationLabel: "1:08",
    visibilityLabel: "Consent Pending",
    reviewStatus: "pending",
    consentStatusLabel: "Consent pending",
    hesitationAddressed: "I am nervous posting other students without clarity.",
    summary: "Consent form still pending.",
    recommendedUse: "Hold this until consent is clear, then decide whether it belongs in the feed.",
    engagementLabel: "medium potential",
    availableApprovalTiers: ["chapter_only"],
  },
  {
    id: "proof-ufmg-no-consent",
    chapterLabel: "UFMG Belo Horizonte",
    contributorLabel: "Lucas Pereira",
    timeLabel: "4d ago",
    sourceLabel: "Short proof clip",
    proofTypeKey: "proof_video",
    qualityScore: 55,
    durationLabel: "0:48",
    visibilityLabel: "No Consent",
    reviewStatus: "rejected",
    consentStatusLabel: "No consent",
    hesitationAddressed: "I do not want HQ to share something unsafe.",
    summary: "Short clip, no consent obtained.",
    recommendedUse: "Do not reuse until the chapter recollects the story with clear consent.",
    engagementLabel: "low potential",
    availableApprovalTiers: [],
  },
];

const staffFeedAnalyticsSeed: Array<{
  id: string;
  title: string;
  typeLabel: string;
  audienceLabel: string;
  chapterCount: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  ctaClicks: number;
  actions: number;
  evidence: number;
  rsvps: number;
  publishedLabel: string;
  impactMetrics: StaffFeedAnalyticsImpactMetric[];
  engagementRateLabel: string;
  topEngagement: StaffFeedAnalyticsChapterBreakdown[];
  lowEngagement: StaffFeedAnalyticsChapterBreakdown[];
}> = [
  {
    id: "feed-post-stanford-leads",
    title: "How Stanford captured 91 leads in one weekend",
    typeLabel: "Best Practice",
    audienceLabel: "All Rush Month chapters",
    chapterCount: 28,
    views: 4820,
    likes: 312,
    comments: 47,
    shares: 89,
    saves: 156,
    ctaClicks: 201,
    actions: 78,
    evidence: 34,
    rsvps: 112,
    publishedLabel: "Jun 14",
    impactMetrics: [
      {
        question: "Did content drive action?",
        value: "78 actions",
        detail: "Action starts after students viewed this post.",
      },
      {
        question: "Did RSVPs increase?",
        value: "+112 RSVPs",
        detail: "Event intent tied to the CTA path after viewing.",
      },
      {
        question: "Evidence submissions?",
        value: "+34 submissions",
        detail: "Proof-friendly posts produced real follow-through.",
      },
      {
        question: "High chapter engagement?",
        value: "28 chapters",
        detail: "Broad chapter participation, not just one standout campus.",
      },
    ],
    engagementRateLabel: "7.4%",
    topEngagement: [
      { chapterLabel: "UC Berkeley", viewsLabel: "56 views", tone: "good" },
      { chapterLabel: "Stanford University", viewsLabel: "149 views", tone: "good" },
      { chapterLabel: "UNAM Mexico City", viewsLabel: "240 views", tone: "good" },
    ],
    lowEngagement: [
      { chapterLabel: "UNMSM Lima", viewsLabel: "0 views", tone: "danger" },
      { chapterLabel: "Universidad de Chile", viewsLabel: "0 views", tone: "danger" },
      { chapterLabel: "University of Ghana", viewsLabel: "0 views", tone: "danger" },
    ],
  },
  {
    id: "feed-post-faith-story",
    title: "Faith's story — why community health matters",
    typeLabel: "Student Story",
    audienceLabel: "All chapters globally",
    chapterCount: 20,
    views: 3140,
    likes: 487,
    comments: 91,
    shares: 142,
    saves: 203,
    ctaClicks: 88,
    actions: 41,
    evidence: 18,
    rsvps: 55,
    publishedLabel: "Jun 12",
    impactMetrics: [
      {
        question: "Did content drive action?",
        value: "41 actions",
        detail: "Belief-building content still needs a tighter next-step ask.",
      },
      {
        question: "Did RSVPs increase?",
        value: "+55 RSVPs",
        detail: "Mission connection helped event consideration across chapters.",
      },
      {
        question: "Evidence submissions?",
        value: "+18 submissions",
        detail: "Story resonance showed up more in comments than proof volume.",
      },
      {
        question: "High chapter engagement?",
        value: "20 chapters",
        detail: "Wide reach, especially among new member audiences.",
      },
    ],
    engagementRateLabel: "18.4%",
    topEngagement: [
      { chapterLabel: "University of Nairobi", viewsLabel: "171 views", tone: "good" },
      { chapterLabel: "PUCP Lima", viewsLabel: "133 views", tone: "good" },
      { chapterLabel: "Boston College", viewsLabel: "118 views", tone: "good" },
    ],
    lowEngagement: [
      { chapterLabel: "University of Ghana", viewsLabel: "4 views", tone: "danger" },
      { chapterLabel: "UCLA MEDLIFE", viewsLabel: "8 views", tone: "danger" },
      { chapterLabel: "McGill University", viewsLabel: "9 views", tone: "danger" },
    ],
  },
  {
    id: "feed-post-qr-tutorial",
    title: "QR lead capture tutorial — do this at your tabling",
    typeLabel: "Campaign Tip",
    audienceLabel: "Rush Month chapters – Latin America",
    chapterCount: 9,
    views: 1640,
    likes: 129,
    comments: 22,
    shares: 41,
    saves: 87,
    ctaClicks: 165,
    actions: 52,
    evidence: 21,
    rsvps: 38,
    publishedLabel: "Jun 11",
    impactMetrics: [
      {
        question: "Did content drive action?",
        value: "52 actions",
        detail: "Tactical content translated into faster starts inside Rush Month.",
      },
      {
        question: "Did RSVPs increase?",
        value: "+38 RSVPs",
        detail: "Tabling follow-up messaging improved after the tutorial landed.",
      },
      {
        question: "Evidence submissions?",
        value: "+21 submissions",
        detail: "Chapters copied the play and uploaded proof soon after.",
      },
      {
        question: "High chapter engagement?",
        value: "9 chapters",
        detail: "Focused regional targeting kept the signal sharp.",
      },
    ],
    engagementRateLabel: "9.2%",
    topEngagement: [
      { chapterLabel: "UNAM Mexico City", viewsLabel: "112 views", tone: "good" },
      { chapterLabel: "PUCP Lima", viewsLabel: "96 views", tone: "good" },
      { chapterLabel: "Universidad de Chile", viewsLabel: "81 views", tone: "good" },
    ],
    lowEngagement: [
      { chapterLabel: "University of Florida", viewsLabel: "7 views", tone: "danger" },
      { chapterLabel: "UC Berkeley", viewsLabel: "10 views", tone: "danger" },
      { chapterLabel: "Lakeside University", viewsLabel: "12 views", tone: "danger" },
    ],
  },
  {
    id: "feed-post-coach-carlos",
    title: "Coach Carlos's message to Peru chapters",
    typeLabel: "Coach Message",
    audienceLabel: "Peru chapters",
    chapterCount: 3,
    views: 820,
    likes: 94,
    comments: 18,
    shares: 12,
    saves: 34,
    ctaClicks: 55,
    actions: 28,
    evidence: 14,
    rsvps: 22,
    publishedLabel: "Jun 10",
    impactMetrics: [
      {
        question: "Did content drive action?",
        value: "28 actions",
        detail: "Coach framing moved a narrow set of chapters toward execution.",
      },
      {
        question: "Did RSVPs increase?",
        value: "+22 RSVPs",
        detail: "Regional relevance improved event intent among Peru chapters.",
      },
      {
        question: "Evidence submissions?",
        value: "+14 submissions",
        detail: "Students acted when the ask felt local and credible.",
      },
      {
        question: "High chapter engagement?",
        value: "3 chapters",
        detail: "Strong fit for a small coaching lane, not global distribution.",
      },
    ],
    engagementRateLabel: "13.7%",
    topEngagement: [
      { chapterLabel: "PUCP Lima", viewsLabel: "201 views", tone: "good" },
      { chapterLabel: "UNMSM Lima", viewsLabel: "164 views", tone: "good" },
      { chapterLabel: "Universidad del Pacífico", viewsLabel: "140 views", tone: "good" },
    ],
    lowEngagement: [
      { chapterLabel: "UCLA MEDLIFE", viewsLabel: "0 views", tone: "danger" },
      { chapterLabel: "Stanford University", viewsLabel: "0 views", tone: "danger" },
      { chapterLabel: "University of Nairobi", viewsLabel: "0 views", tone: "danger" },
    ],
  },
  {
    id: "feed-post-moving-mountains",
    title: "Moving Mountains — what the campaign looks like in action",
    typeLabel: "Bridge Video",
    audienceLabel: "Moving Mountains chapters",
    chapterCount: 6,
    views: 2210,
    likes: 198,
    comments: 35,
    shares: 67,
    saves: 112,
    ctaClicks: 144,
    actions: 63,
    evidence: 28,
    rsvps: 81,
    publishedLabel: "Jun 9",
    impactMetrics: [
      {
        question: "Did content drive action?",
        value: "63 actions",
        detail: "Campaign belief content still worked because the next step stayed visible.",
      },
      {
        question: "Did RSVPs increase?",
        value: "+81 RSVPs",
        detail: "Bridge storytelling translated into event curiosity across active chapters.",
      },
      {
        question: "Evidence submissions?",
        value: "+28 submissions",
        detail: "Students followed through once the story connected to action proof.",
      },
      {
        question: "High chapter engagement?",
        value: "6 chapters",
        detail: "Best used for campaign chapters already in motion.",
      },
    ],
    engagementRateLabel: "10.5%",
    topEngagement: [
      { chapterLabel: "Riverside State", viewsLabel: "143 views", tone: "good" },
      { chapterLabel: "UC Berkeley", viewsLabel: "129 views", tone: "good" },
      { chapterLabel: "Boston College", viewsLabel: "118 views", tone: "good" },
    ],
    lowEngagement: [
      { chapterLabel: "University of Ghana", viewsLabel: "3 views", tone: "danger" },
      { chapterLabel: "Makerere University", viewsLabel: "5 views", tone: "danger" },
      { chapterLabel: "Mesa College", viewsLabel: "7 views", tone: "danger" },
    ],
  },
];

const leadNameByChapter: Record<string, string> = {
  "UCLA MEDLIFE": "Priya President",
  "Lakeside University MEDLIFE": "Jordan Growth Lead",
  "Riverside State MEDLIFE": "Avery Recruitment Lead",
  "Mesa College MEDLIFE": "Taylor Transition Lead",
};

const staffPortfolioSeed: Array<
  Omit<StaffChapterPortfolioRow, "detailHref" | "supportSummary">
> = [
  {
    chapterId: "chapter-uc-berkeley",
    chapterName: "UC Berkeley",
    campus: "UC Berkeley",
    country: "USA",
    coachName: "Maria",
    leadName: "Sofia Growth Lead",
    campaignName: "Rush Month",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 92,
    decision: "advance",
    risk: "low",
    leadsCount: 87,
    rsvpCount: 62,
    attendanceCount: 51,
    assignmentsCount: 38,
    proofPending: 4,
    openFollowUps: 2,
    pointsPerWeek: 1240,
    hubspotStageLabel: "MQL",
    lastActiveLabel: "2h ago",
    nextStep: "Protect the strongest tabling proof and keep the next volunteer ask visible.",
  },
  {
    chapterId: "chapter-yale",
    chapterName: "Yale University",
    campus: "Yale University",
    country: "USA",
    coachName: "James",
    leadName: "Naomi Outreach Lead",
    campaignName: "Rush Month",
    statusLabel: "Behind",
    statusTone: "warning",
    readinessScore: 38,
    decision: "hold",
    risk: "medium",
    leadsCount: 19,
    rsvpCount: 11,
    attendanceCount: 7,
    assignmentsCount: 12,
    proofPending: 8,
    openFollowUps: 11,
    pointsPerWeek: 210,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "3d ago",
    nextStep: "Tighten follow-up ownership before the next chapter event slips.",
  },
  {
    chapterId: "chapter-florida",
    chapterName: "University of Florida",
    campus: "University of Florida",
    country: "USA",
    coachName: "Maria",
    leadName: "Lena Member Lead",
    campaignName: "Rush Month",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 95,
    decision: "advance",
    risk: "low",
    leadsCount: 104,
    rsvpCount: 91,
    attendanceCount: 78,
    assignmentsCount: 55,
    proofPending: 2,
    openFollowUps: 4,
    pointsPerWeek: 1680,
    hubspotStageLabel: "SQL",
    lastActiveLabel: "4h ago",
    nextStep: "Turn momentum into a repeatable member onboarding sequence.",
  },
  {
    chapterId: "chapter-mcgill",
    chapterName: "McGill University",
    campus: "McGill University",
    country: "Canada",
    coachName: "Aisha",
    leadName: "Tara Operations Lead",
    campaignName: "SLT Promotion",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 84,
    decision: "advance",
    risk: "low",
    leadsCount: 47,
    rsvpCount: 38,
    attendanceCount: 31,
    assignmentsCount: 28,
    proofPending: 1,
    openFollowUps: 3,
    pointsPerWeek: 820,
    hubspotStageLabel: "MQL",
    lastActiveLabel: "6h ago",
    nextStep: "Keep traveler prep and chapter momentum connected in one student message.",
  },
  {
    chapterId: "chapter-pucp",
    chapterName: "PUCP Lima",
    campus: "PUCP Lima",
    country: "Peru",
    coachName: "Carlos",
    leadName: "Marisol Recruitment Lead",
    campaignName: "Rush Month",
    statusLabel: "Behind",
    statusTone: "warning",
    readinessScore: 52,
    decision: "hold",
    risk: "medium",
    leadsCount: 38,
    rsvpCount: 22,
    attendanceCount: 14,
    assignmentsCount: 20,
    proofPending: 6,
    openFollowUps: 9,
    pointsPerWeek: 380,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "1d ago",
    nextStep: "Rebuild event follow-through before scaling recruitment again.",
  },
  {
    chapterId: "chapter-unmsm",
    chapterName: "UNMSM Lima",
    campus: "UNMSM Lima",
    country: "Peru",
    coachName: "Carlos",
    leadName: "Diego Launch Lead",
    campaignName: "Rush Month",
    statusLabel: "Not Started",
    statusTone: "danger",
    readinessScore: 18,
    decision: "intervene",
    risk: "high",
    leadsCount: 6,
    rsvpCount: 2,
    attendanceCount: 2,
    assignmentsCount: 4,
    proofPending: 12,
    openFollowUps: 12,
    pointsPerWeek: 40,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "6d ago",
    nextStep: "Intervene on event setup and give the chapter a narrower first-win plan.",
  },
  {
    chapterId: "chapter-usp",
    chapterName: "USP Sao Paulo",
    campus: "USP Sao Paulo",
    country: "Brazil",
    coachName: "Fernanda",
    leadName: "Bianca Story Lead",
    campaignName: "Moving Mountains",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 89,
    decision: "advance",
    risk: "low",
    leadsCount: 78,
    rsvpCount: 69,
    attendanceCount: 58,
    assignmentsCount: 44,
    proofPending: 3,
    openFollowUps: 3,
    pointsPerWeek: 1420,
    hubspotStageLabel: "MQL",
    lastActiveLabel: "1h ago",
    nextStep: "Push the strongest bridge-story assets into the broader feed studio.",
  },
  {
    chapterId: "chapter-ufmg",
    chapterName: "UFMG Belo Horizonte",
    campus: "UFMG Belo Horizonte",
    country: "Brazil",
    coachName: "Fernanda",
    leadName: "Rafa Volunteer Lead",
    campaignName: "Rush Month",
    statusLabel: "Behind",
    statusTone: "warning",
    readinessScore: 46,
    decision: "hold",
    risk: "medium",
    leadsCount: 22,
    rsvpCount: 14,
    attendanceCount: 9,
    assignmentsCount: 15,
    proofPending: 9,
    openFollowUps: 8,
    pointsPerWeek: 190,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "2d ago",
    nextStep: "Coach the chapter back to one reliable event and one clear follow-up owner.",
  },
  {
    chapterId: "chapter-unah",
    chapterName: "UNAH Tegucigalpa",
    campus: "UNAH Tegucigalpa",
    country: "Honduras",
    coachName: "Lucia",
    leadName: "Valeria Engagement Lead",
    campaignName: "Chapter Engagement",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 82,
    decision: "advance",
    risk: "low",
    leadsCount: 52,
    rsvpCount: 44,
    attendanceCount: 37,
    assignmentsCount: 30,
    proofPending: 2,
    openFollowUps: 4,
    pointsPerWeek: 910,
    hubspotStageLabel: "MQL",
    lastActiveLabel: "3h ago",
    nextStep: "Keep member recognition visible so repeat participation stays high.",
  },
  {
    chapterId: "chapter-unan",
    chapterName: "UNAN Managua",
    campus: "UNAN Managua",
    country: "Nicaragua",
    coachName: "Lucia",
    leadName: "Cami Follow-Up Lead",
    campaignName: "Rush Month",
    statusLabel: "Behind",
    statusTone: "warning",
    readinessScore: 44,
    decision: "hold",
    risk: "medium",
    leadsCount: 14,
    rsvpCount: 7,
    attendanceCount: 5,
    assignmentsCount: 9,
    proofPending: 7,
    openFollowUps: 7,
    pointsPerWeek: 130,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "3d ago",
    nextStep: "Reduce proof backlog and reset the follow-up lane with one named owner.",
  },
  {
    chapterId: "chapter-nairobi",
    chapterName: "University of Nairobi",
    campus: "University of Nairobi",
    country: "Kenya",
    coachName: "Samuel",
    leadName: "Grace Membership Lead",
    campaignName: "Grow the Movement",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 80,
    decision: "advance",
    risk: "low",
    leadsCount: 61,
    rsvpCount: 54,
    attendanceCount: 46,
    assignmentsCount: 37,
    proofPending: 1,
    openFollowUps: 5,
    pointsPerWeek: 1090,
    hubspotStageLabel: "MQL",
    lastActiveLabel: "5h ago",
    nextStep: "Use the chapter-growth story to support the next recruitment push.",
  },
  {
    chapterId: "chapter-makerere",
    chapterName: "Makerere University",
    campus: "Makerere University",
    country: "Uganda",
    coachName: "Samuel",
    leadName: "Moses Event Lead",
    campaignName: "Rush Month",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 78,
    decision: "advance",
    risk: "low",
    leadsCount: 43,
    rsvpCount: 36,
    attendanceCount: 29,
    assignmentsCount: 24,
    proofPending: 3,
    openFollowUps: 4,
    pointsPerWeek: 690,
    hubspotStageLabel: "MQL",
    lastActiveLabel: "8h ago",
    nextStep: "Keep action completion visible so the chapter can stack another event quickly.",
  },
  {
    chapterId: "chapter-stanford",
    chapterName: "Stanford University",
    campus: "Stanford University",
    country: "USA",
    coachName: "James",
    leadName: "Riley Succession Lead",
    campaignName: "Leadership Transition",
    statusLabel: "Complete",
    statusTone: "good",
    readinessScore: 96,
    decision: "advance",
    risk: "low",
    leadsCount: 91,
    rsvpCount: 80,
    attendanceCount: 68,
    assignmentsCount: 60,
    proofPending: 0,
    openFollowUps: 2,
    pointsPerWeek: 1890,
    hubspotStageLabel: "SQL",
    lastActiveLabel: "30m ago",
    nextStep: "Package the succession playbook as a best-practice shareout.",
  },
  {
    chapterId: "chapter-johns-hopkins",
    chapterName: "Johns Hopkins",
    campus: "Johns Hopkins",
    country: "USA",
    coachName: "James",
    leadName: "Mina SLT Lead",
    campaignName: "SLT Promotion",
    statusLabel: "Behind",
    statusTone: "warning",
    readinessScore: 42,
    decision: "hold",
    risk: "medium",
    leadsCount: 21,
    rsvpCount: 12,
    attendanceCount: 8,
    assignmentsCount: 11,
    proofPending: 10,
    openFollowUps: 10,
    pointsPerWeek: 180,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "4d ago",
    nextStep: "Unblock the chapter by simplifying the traveler and member ask.",
  },
  {
    chapterId: "chapter-upch",
    chapterName: "UPCH Lima",
    campus: "UPCH Lima",
    country: "Peru",
    coachName: "Carlos",
    leadName: "Ana Volunteer Lead",
    campaignName: "Rush Month",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 87,
    decision: "advance",
    risk: "low",
    leadsCount: 72,
    rsvpCount: 61,
    attendanceCount: 52,
    assignmentsCount: 42,
    proofPending: 3,
    openFollowUps: 4,
    pointsPerWeek: 1190,
    hubspotStageLabel: "MQL",
    lastActiveLabel: "2h ago",
    nextStep: "Keep event proof and member follow-up in the same review rhythm.",
  },
  {
    chapterId: "chapter-u-chile",
    chapterName: "Universidad de Chile",
    campus: "Universidad de Chile",
    country: "Chile",
    coachName: "Fernanda",
    leadName: "Santi Recovery Lead",
    campaignName: "Rush Month",
    statusLabel: "Paused",
    statusTone: "warning",
    readinessScore: 28,
    decision: "intervene",
    risk: "high",
    leadsCount: 11,
    rsvpCount: 4,
    attendanceCount: 3,
    assignmentsCount: 5,
    proofPending: 11,
    openFollowUps: 11,
    pointsPerWeek: 60,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "5d ago",
    nextStep: "Reboot chapter momentum with a smaller event and a tighter support cadence.",
  },
  {
    chapterId: "chapter-unam",
    chapterName: "UNAM Mexico City",
    campus: "UNAM Mexico City",
    country: "Mexico",
    coachName: "Carlos",
    leadName: "Lucia Story Lead",
    campaignName: "Moving Mountains",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 93,
    decision: "advance",
    risk: "low",
    leadsCount: 99,
    rsvpCount: 86,
    attendanceCount: 74,
    assignmentsCount: 58,
    proofPending: 2,
    openFollowUps: 3,
    pointsPerWeek: 1760,
    hubspotStageLabel: "SQL",
    lastActiveLabel: "1h ago",
    nextStep: "Promote the strongest story into cross-chapter content quickly.",
  },
  {
    chapterId: "chapter-ghana",
    chapterName: "University of Ghana",
    campus: "University of Ghana",
    country: "Ghana",
    coachName: "Samuel",
    leadName: "Kofi Launch Lead",
    campaignName: "Start a Chapter",
    statusLabel: "Not Started",
    statusTone: "danger",
    readinessScore: 20,
    decision: "intervene",
    risk: "high",
    leadsCount: 4,
    rsvpCount: 1,
    attendanceCount: 1,
    assignmentsCount: 2,
    proofPending: 8,
    openFollowUps: 8,
    pointsPerWeek: 20,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "8d ago",
    nextStep: "Intervene early and give the chapter a first-event blueprint with owner support.",
  },
  {
    chapterId: "chapter-toronto",
    chapterName: "University of Toronto",
    campus: "University of Toronto",
    country: "Canada",
    coachName: "Aisha",
    leadName: "Ella Committee Lead",
    campaignName: "Chapter Engagement",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 85,
    decision: "advance",
    risk: "low",
    leadsCount: 63,
    rsvpCount: 55,
    attendanceCount: 47,
    assignmentsCount: 38,
    proofPending: 2,
    openFollowUps: 4,
    pointsPerWeek: 1050,
    hubspotStageLabel: "MQL",
    lastActiveLabel: "3h ago",
    nextStep: "Keep member momentum warm by promoting the next action immediately after events.",
  },
  {
    chapterId: "chapter-mit",
    chapterName: "MIT",
    campus: "MIT",
    country: "USA",
    coachName: "Maria",
    leadName: "Noah Succession Lead",
    campaignName: "Leadership Transition",
    statusLabel: "On Track",
    statusTone: "good",
    readinessScore: 92,
    decision: "advance",
    risk: "low",
    leadsCount: 82,
    rsvpCount: 74,
    attendanceCount: 63,
    assignmentsCount: 51,
    proofPending: 1,
    openFollowUps: 0,
    pointsPerWeek: 1540,
    hubspotStageLabel: "SQL",
    lastActiveLabel: "45m ago",
    nextStep: "Share the best leadership-transition artifacts into the best-practice library.",
  },
];

const portfolioSignalsByChapter: Record<
  string,
  {
    country: string;
    campaignName: string;
    statusLabel: StaffChapterPortfolioRow["statusLabel"];
    leadsCount: number;
    rsvpCount: number;
    attendanceCount: number;
    assignmentsCount: number;
    pointsPerWeek: number;
    hubspotStageLabel: StaffChapterPortfolioRow["hubspotStageLabel"];
    lastActiveLabel: string;
  }
> = {
  "UCLA MEDLIFE": {
    country: "USA",
    campaignName: "Rush Month",
    statusLabel: "Not Started",
    leadsCount: 6,
    rsvpCount: 2,
    attendanceCount: 2,
    assignmentsCount: 4,
    pointsPerWeek: 40,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "6d ago",
  },
  "Lakeside University MEDLIFE": {
    country: "USA",
    campaignName: "SLT Promotion",
    statusLabel: "On Track",
    leadsCount: 47,
    rsvpCount: 38,
    attendanceCount: 31,
    assignmentsCount: 28,
    pointsPerWeek: 820,
    hubspotStageLabel: "MQL",
    lastActiveLabel: "6h ago",
  },
  "Riverside State MEDLIFE": {
    country: "USA",
    campaignName: "Rush Month",
    statusLabel: "Behind",
    leadsCount: 19,
    rsvpCount: 11,
    attendanceCount: 7,
    assignmentsCount: 12,
    pointsPerWeek: 210,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "3d ago",
  },
  "Mesa College MEDLIFE": {
    country: "Canada",
    campaignName: "Chapter Engagement",
    statusLabel: "Paused",
    leadsCount: 21,
    rsvpCount: 12,
    attendanceCount: 8,
    assignmentsCount: 11,
    pointsPerWeek: 180,
    hubspotStageLabel: "Lead",
    lastActiveLabel: "4d ago",
  },
};

const staffHubSpotChapterSeed: Array<{
  id: string;
  chapterLabel: string;
  countryLabel: string;
  warningLabel: string | null;
  crmProfileMetrics: StaffHubSpotProfileMetric[];
  matchedActivityMetrics: StaffHubSpotActivityMetric[];
  funnelSteps: StaffHubSpotFunnelStep[];
}> = [
  {
    id: "hubspot-uc-berkeley",
    chapterLabel: "UC Berkeley",
    countryLabel: "USA",
    warningLabel: null,
    crmProfileMetrics: [
      { label: "Total Contacts", value: "111" },
      { label: "New Leads (Campaign)", value: "87" },
      { label: "Lifecycle Stage", value: "MQL" },
      { label: "Open Tasks", value: "3" },
      { label: "Owner", value: "Maria" },
      { label: "Last Touch", value: "2h ago" },
      { label: "Follow-Up Rate", value: "62%" },
      { label: "Conversion (Lead→MBR)", value: "14%" },
    ],
    matchedActivityMetrics: [
      { label: "Attended Event", current: 51, total: 62 },
      { label: "Completed Actions", current: 38, total: 46 },
      { label: "Submitted Evidence", current: 22, total: 26 },
      { label: "Became Member", current: 12, total: 87 },
    ],
    funnelSteps: [
      { label: "QR / Lead Capture", value: 87 },
      { label: "RSVP'd to Event", value: 62 },
      { label: "Attended Event", value: 51 },
      { label: "Follow-up Complete", value: 54 },
      { label: "Joined myMEDLIFE", value: 36 },
      { label: "Became Member", value: 12 },
    ],
  },
  {
    id: "hubspot-yale",
    chapterLabel: "Yale University",
    countryLabel: "USA",
    warningLabel: "CRM lifecycle stage is ahead of verified chapter activity",
    crmProfileMetrics: [
      { label: "Total Contacts", value: "74" },
      { label: "New Leads (Campaign)", value: "41" },
      { label: "Lifecycle Stage", value: "SQL" },
      { label: "Open Tasks", value: "5" },
      { label: "Owner", value: "Rachel" },
      { label: "Last Touch", value: "6h ago" },
      { label: "Follow-Up Rate", value: "44%" },
      { label: "Conversion (Lead→MBR)", value: "11%" },
    ],
    matchedActivityMetrics: [
      { label: "Attended Event", current: 19, total: 27 },
      { label: "Completed Actions", current: 11, total: 24 },
      { label: "Submitted Evidence", current: 4, total: 9 },
      { label: "Became Member", current: 5, total: 41 },
    ],
    funnelSteps: [
      { label: "QR / Lead Capture", value: 41 },
      { label: "RSVP'd to Event", value: 27 },
      { label: "Attended Event", value: 19 },
      { label: "Follow-up Complete", value: 13 },
      { label: "Joined myMEDLIFE", value: 9 },
      { label: "Became Member", value: 5 },
    ],
  },
  {
    id: "hubspot-florida",
    chapterLabel: "University of Florida",
    countryLabel: "USA",
    warningLabel: null,
    crmProfileMetrics: [
      { label: "Total Contacts", value: "93" },
      { label: "New Leads (Campaign)", value: "63" },
      { label: "Lifecycle Stage", value: "MQL" },
      { label: "Open Tasks", value: "4" },
      { label: "Owner", value: "Cam" },
      { label: "Last Touch", value: "3h ago" },
      { label: "Follow-Up Rate", value: "57%" },
      { label: "Conversion (Lead→MBR)", value: "13%" },
    ],
    matchedActivityMetrics: [
      { label: "Attended Event", current: 34, total: 43 },
      { label: "Completed Actions", current: 28, total: 37 },
      { label: "Submitted Evidence", current: 16, total: 21 },
      { label: "Became Member", current: 8, total: 63 },
    ],
    funnelSteps: [
      { label: "QR / Lead Capture", value: 63 },
      { label: "RSVP'd to Event", value: 43 },
      { label: "Attended Event", value: 34 },
      { label: "Follow-up Complete", value: 29 },
      { label: "Joined myMEDLIFE", value: 18 },
      { label: "Became Member", value: 8 },
    ],
  },
  {
    id: "hubspot-mcgill",
    chapterLabel: "McGill University",
    countryLabel: "Canada",
    warningLabel: "Open tasks are aging without recent student proof activity",
    crmProfileMetrics: [
      { label: "Total Contacts", value: "58" },
      { label: "New Leads (Campaign)", value: "29" },
      { label: "Lifecycle Stage", value: "Lead" },
      { label: "Open Tasks", value: "6" },
      { label: "Owner", value: "Nina" },
      { label: "Last Touch", value: "2d ago" },
      { label: "Follow-Up Rate", value: "31%" },
      { label: "Conversion (Lead→MBR)", value: "7%" },
    ],
    matchedActivityMetrics: [
      { label: "Attended Event", current: 11, total: 19 },
      { label: "Completed Actions", current: 7, total: 13 },
      { label: "Submitted Evidence", current: 2, total: 8 },
      { label: "Became Member", current: 2, total: 29 },
    ],
    funnelSteps: [
      { label: "QR / Lead Capture", value: 29 },
      { label: "RSVP'd to Event", value: 19 },
      { label: "Attended Event", value: 11 },
      { label: "Follow-up Complete", value: 8 },
      { label: "Joined myMEDLIFE", value: 5 },
      { label: "Became Member", value: 2 },
    ],
  },
  {
    id: "hubspot-pucp",
    chapterLabel: "PUCP Lima",
    countryLabel: "Peru",
    warningLabel: "Leads captured but low follow-up rate",
    crmProfileMetrics: [
      { label: "Total Contacts", value: "62" },
      { label: "New Leads (Campaign)", value: "38" },
      { label: "Lifecycle Stage", value: "Lead" },
      { label: "Open Tasks", value: "7" },
      { label: "Owner", value: "Carlos" },
      { label: "Last Touch", value: "1d ago" },
      { label: "Follow-Up Rate", value: "29%" },
      { label: "Conversion (Lead→MBR)", value: "8%" },
    ],
    matchedActivityMetrics: [
      { label: "Attended Event", current: 14, total: 22 },
      { label: "Completed Actions", current: 20, total: 28 },
      { label: "Submitted Evidence", current: 8, total: 14 },
      { label: "Became Member", current: 3, total: 38 },
    ],
    funnelSteps: [
      { label: "QR / Lead Capture", value: 38 },
      { label: "RSVP'd to Event", value: 22 },
      { label: "Attended Event", value: 14 },
      { label: "Follow-up Complete", value: 11 },
      { label: "Joined myMEDLIFE", value: 10 },
      { label: "Became Member", value: 3 },
    ],
  },
  {
    id: "hubspot-unmsm",
    chapterLabel: "UNMSM Lima",
    countryLabel: "Peru",
    warningLabel: "Event attendance looks healthy, but evidence and membership conversion are lagging",
    crmProfileMetrics: [
      { label: "Total Contacts", value: "54" },
      { label: "New Leads (Campaign)", value: "33" },
      { label: "Lifecycle Stage", value: "Lead" },
      { label: "Open Tasks", value: "4" },
      { label: "Owner", value: "Carlos" },
      { label: "Last Touch", value: "9h ago" },
      { label: "Follow-Up Rate", value: "36%" },
      { label: "Conversion (Lead→MBR)", value: "6%" },
    ],
    matchedActivityMetrics: [
      { label: "Attended Event", current: 17, total: 23 },
      { label: "Completed Actions", current: 15, total: 22 },
      { label: "Submitted Evidence", current: 5, total: 13 },
      { label: "Became Member", current: 2, total: 33 },
    ],
    funnelSteps: [
      { label: "QR / Lead Capture", value: 33 },
      { label: "RSVP'd to Event", value: 23 },
      { label: "Attended Event", value: 17 },
      { label: "Follow-up Complete", value: 12 },
      { label: "Joined myMEDLIFE", value: 7 },
      { label: "Became Member", value: 2 },
    ],
  },
];

function getHubSpotChapterIdForPortfolioChapter(
  chapterName: string,
): string | null {
  const directMatch = staffHubSpotChapterSeed.find(
    (chapter) => chapter.chapterLabel === chapterName,
  );

  if (directMatch) {
    return directMatch.id;
  }

  return null;
}

export function getStaffCommandCenter(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  options: StaffCommandCenterOptions = {},
): StaffCommandCenter {
  if (!canReadStaffCommandCenter(actor)) {
    return emptyStaffCommandCenter();
  }

  const riskFilter = parseRiskFilter(options.risk);
  const countryFilter = parseCountryFilter(options.country);
  const coachFilter = parseCoachFilter(options.coach);
  const portfolioCampaignFilter = parsePortfolioCampaignFilter(options.portfolioCampaign);
  const campaignRiskGroup = parseCampaignRiskGroup(options.campaignRisk);
  const decisionPreview = parseDecisionPreview(options.decision);
  const proofQueueFilter = parseProofQueueFilter(options.proofQueue);
  const proofTypeFilter = parseProofTypeFilter(options.proofType);
  const bestPracticeCountryFilter = parseBestPracticeCountryFilter(options.practiceCountry);
  const bestPracticeCampaignFilter = parseBestPracticeCampaignFilter(options.practiceCampaign);
  const feedPreviewRole = parseFeedPreviewRole(options.feedRole);
  const feedAudienceMode = parseFeedAudienceMode(options.feedAudience);
  const searchQuery = options.query?.trim() ?? "";
  const selectedView = parseStaffCommandCenterView(options.view);
  const surfaceFamily = getActorSurfaceFamily(actor);
  const routeBase =
    options.routeBase ?? (surfaceFamily === "coach" ? "/coach" : "/staff");
  const sourceContext = getStaffLandingSourceContext(
    options.source,
    routeBase,
    selectedView,
    data.chapter.name,
    data.chapter.id,
  );
  const chapterRows = getFilteredChapterRows(actor, data, {
    riskFilter,
    countryFilter,
    coachFilter,
    portfolioCampaignFilter,
    searchQuery,
  }, routeBase);
  const selectedChapterId = getSelectedChapterId(chapterRows, options.chapterId);
  const allProofReviewItems = getProofReviewItems(routeBase);
  const proofReviewItems = getFilteredProofReviewItems(allProofReviewItems, {
    proofQueueFilter,
    proofTypeFilter,
  }).map((item) => ({
    ...item,
    reviewHref: getHref({
      routeBase,
      view: selectedView,
      campaign: options.campaign,
      risk: riskFilter,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
      proofQueue: proofQueueFilter,
      proofType: proofTypeFilter,
      proof: item.id,
    }),
  }));
  const selectedProofId = getSelectedProofId(proofReviewItems, options.proof);
  const campaignCards = getCampaignOperationCards();
  const requestedCampaignSlug = getRequestedCampaignSlug(
    options.campaign,
    campaignCards,
  );
  const selectedCampaignSlug = getSelectedCampaignSlug(
    options.campaign,
    campaignCards,
  );
  const allFeedDrafts = getFeedDrafts(proofReviewItems).map((draft) => ({
    ...draft,
    sourceHref: getHref({
      routeBase,
      view: selectedView,
      campaign: options.campaign,
      risk: riskFilter,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
      proofQueue: proofQueueFilter,
      proofType: proofTypeFilter,
      proof: selectedProofId,
      feedDraft: draft.id,
      feedRole: feedPreviewRole,
      feedAudience: feedAudienceMode,
    }),
  }));
  const selectedFeedDraftId = getSelectedFeedDraftId(allFeedDrafts, options.feedDraft);
  const feedAnalytics = getFeedAnalyticsWorkspace(options.feedPost, allFeedDrafts, {
    routeBase,
    source: options.source,
    selectedView,
    selectedCampaignSlug,
    riskFilter,
    countryFilter,
    coachFilter,
    portfolioCampaignFilter,
    searchQuery,
    proofQueueFilter,
    proofTypeFilter,
    selectedProofId,
    selectedFeedDraftId,
    feedPreviewRole,
    feedAudienceMode,
    chapterRows,
  });
  const hubspotWorkspace = getHubSpotWorkspace(options.hubspotChapter, {
    routeBase,
    selectedView,
    selectedCampaignSlug,
    riskFilter,
    countryFilter,
    coachFilter,
    portfolioCampaignFilter,
    searchQuery,
    selectedProofId,
    proofQueueFilter,
    proofTypeFilter,
    selectedFeedDraftId,
    selectedFeedPostId: feedAnalytics.selectedPostId,
    feedPreviewRole,
    feedAudienceMode,
    selectedChapterId,
    selectedDecision: decisionPreview,
    chapterRows,
  });
  const bestPracticeCards = getBestPracticeCards(
    bestPracticeCountryFilter,
    bestPracticeCampaignFilter,
    {
      routeBase,
      source: options.source,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedCampaignSlug,
      selectedProofId,
      selectedFeedDraftId,
      selectedFeedPostId: feedAnalytics.selectedPostId,
      selectedHubSpotChapterId: hubspotWorkspace.selectedChapterId,
      selectedBestPracticeId: options.bestPractice ?? null,
    },
  );
  const selectedProofItem =
    proofReviewItems.find((item) => item.id === selectedProofId) ?? null;
  const selectedBestPracticeId = getSelectedBestPracticeId(
    bestPracticeCards,
    options.bestPractice,
  );
  const selectedBestPractice =
    bestPracticeCards.find((card) => card.id === selectedBestPracticeId) ?? null;
  const feedStudio = getFeedStudioWorkspace(
    allFeedDrafts,
    proofReviewItems,
    selectedBestPractice,
    selectedFeedDraftId,
    {
      routeBase,
      source: options.source,
      selectedView,
      selectedCampaignSlug,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      proofQueueFilter,
      proofTypeFilter,
      selectedProofId,
      selectedFeedPostId: feedAnalytics.selectedPostId,
      feedPreviewRole,
      feedAudienceMode,
    },
  );
  const selectedChapter = getSelectedChapterDrawer(
    data,
    chapterRows,
    selectedChapterId,
    decisionPreview,
    {
      routeBase,
      selectedView,
      selectedCampaignSlug,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      proofQueueFilter,
      proofTypeFilter,
      selectedProofId,
      selectedFeedDraftId: options.feedDraft ?? null,
      selectedFeedPostId: options.feedPost ?? null,
      feedPreviewRole,
      feedAudienceMode,
    },
  );
  const recognitionSummary = getMemberRecognitionSummary(actor, data);
  const adminSummary = getAdminControlCenterSummary(data);
  const outboxSummary = summarizeOutbox(data.outboxItems);
  const adminWorkspace = getAdminWorkspace(data, adminSummary, outboxSummary);
  const preservedPortfolioFeedDraftId = feedAnalytics.selectedPostId
    ? selectedFeedDraftId
    : null;
  const preservedPortfolioFeedRole = feedAnalytics.selectedPostId
    ? feedPreviewRole
    : undefined;
  const preservedPortfolioFeedAudience = feedAnalytics.selectedPostId
    ? feedAudienceMode
    : undefined;
  const preservedCrossViewFeedDraftId =
    selectedView === "feed_studio" || feedAnalytics.selectedPostId
      ? selectedFeedDraftId
      : null;
  const preservedCrossViewFeedRole =
    selectedView === "feed_studio" || feedAnalytics.selectedPostId
      ? feedPreviewRole
      : undefined;
  const preservedCrossViewFeedAudience =
    selectedView === "feed_studio" || feedAnalytics.selectedPostId
      ? feedAudienceMode
      : undefined;
  const preservedCrossViewHubSpotChapterId =
    selectedView === "hubspot" ? hubspotWorkspace.selectedChapterId : null;

  return {
    canReadCommandCenter: true,
    routeBase,
    title:
      surfaceFamily === "coach"
        ? "Coach Command Center"
        : "Staff Command Center",
    summary:
      surfaceFamily === "coach"
        ? "Review assigned chapter health, proof and consent posture, coach follow-up load, and chapter support decisions without turning on live writes."
        : "Review chapter portfolio health, campaign operations, proof and consent gates, feed curation, HubSpot-ready follow-up posture, and admin health without turning on live writes.",
    sampleLabel: null,
    sourceContext:
      getProofReviewBestPracticesSourceContext(
        options.source,
        selectedView,
        selectedProofItem,
        {
          routeBase,
          selectedCampaignSlug,
          riskFilter,
          countryFilter,
          coachFilter,
          portfolioCampaignFilter,
          searchQuery,
          proofQueueFilter,
          proofTypeFilter,
        },
      ) ?? sourceContext,
    selectedView,
    selectedCampaignSlug,
    selectedChapterId,
    portfolioCampaignViewHref: getHref({
      routeBase,
      view: "campaigns",
      campaign: selectedCampaignSlug,
      risk: riskFilter,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
      chapterId: selectedChapterId,
      decision: decisionPreview ?? undefined,
      proofQueue: proofQueueFilter,
      proofType: proofTypeFilter,
      proof: selectedProofId,
      feedDraft: preservedPortfolioFeedDraftId,
      feedPost: feedAnalytics.selectedPostId,
      feedRole: preservedPortfolioFeedRole,
      feedAudience: preservedPortfolioFeedAudience,
      source: "portfolio_overview",
    }),
    portfolioBestPracticesViewHref: getHref({
      routeBase,
      view: "best_practices",
      campaign: selectedCampaignSlug,
      risk: riskFilter,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
      chapterId: selectedChapterId,
      decision: decisionPreview ?? undefined,
      source: "portfolio_overview",
    }),
    closeChapterHref: getHref({
      routeBase,
      view: selectedView,
      campaign: selectedCampaignSlug,
      risk: riskFilter,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
    }),
    riskFilter,
    countryFilter,
    coachFilter,
    portfolioCampaignFilter,
    searchQuery,
    selectedProofId,
    proofQueueFilter,
    proofTypeFilter,
    selectedFeedDraftId,
    selectedFeedPostId: feedAnalytics.selectedPostId,
    selectedHubSpotChapterId: hubspotWorkspace.selectedChapterId,
    selectedBestPracticeId,
    bestPracticeCountryFilter,
    bestPracticeCampaignFilter,
    feedPreviewRole,
    feedAudienceMode,
    canReadDetailedOutbox: canReadIntegrationOutbox(actor),
    metrics: getMetrics(chapterRows, proofReviewItems, data, outboxSummary),
    quickActions: getQuickActions(selectedChapterId, selectedCampaignSlug, routeBase, {
      campaignRiskGroup,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      decisionPreview,
      selectedProofId,
      proofQueueFilter,
      proofTypeFilter,
      selectedFeedDraftId: preservedCrossViewFeedDraftId,
      selectedFeedPostId: feedAnalytics.selectedPostId,
      feedPreviewRole: preservedCrossViewFeedRole,
      feedAudienceMode: preservedCrossViewFeedAudience,
    }),
    viewOptions: getViewOptions(
      routeBase,
      selectedView,
      options.source,
      campaignRiskGroup,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedChapterId,
      decisionPreview,
      requestedCampaignSlug,
      selectedCampaignSlug,
      selectedProofId,
      proofQueueFilter,
      proofTypeFilter,
      preservedCrossViewFeedDraftId,
      feedAnalytics.selectedPostId,
      preservedCrossViewHubSpotChapterId,
      bestPracticeCountryFilter,
      bestPracticeCampaignFilter,
      preservedCrossViewFeedRole,
      preservedCrossViewFeedAudience,
    ),
    riskFilters: getRiskFilterOptions(
      routeBase,
      selectedView,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedCampaignSlug,
    ),
    countryFilters: getCountryFilterOptions(
      routeBase,
      selectedView,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedCampaignSlug,
    ),
    coachFilters: getCoachFilterOptions(
      routeBase,
      selectedView,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedCampaignSlug,
    ),
    portfolioCampaignFilters: getPortfolioCampaignFilterOptions(
      routeBase,
      selectedView,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedCampaignSlug,
    ),
    proofQueueFilters: getProofQueueFilterOptions(
      routeBase,
      selectedView,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedCampaignSlug,
      proofTypeFilter,
      selectedProofId,
    ),
    proofTypeFilters: getProofTypeFilterOptions(
      routeBase,
      selectedView,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedCampaignSlug,
      proofQueueFilter,
      selectedProofId,
    ),
    bestPracticeCountryFilters: getBestPracticeCountryFilterOptions(
      routeBase,
      options.source,
      selectedView,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedCampaignSlug,
      bestPracticeCountryFilter,
      bestPracticeCampaignFilter,
      proofQueueFilter,
      proofTypeFilter,
      selectedProofId,
    ),
    bestPracticeCampaignFilters: getBestPracticeCampaignFilterOptions(
      routeBase,
      options.source,
      selectedView,
      riskFilter,
      countryFilter,
      coachFilter,
      portfolioCampaignFilter,
      searchQuery,
      selectedCampaignSlug,
      bestPracticeCountryFilter,
      proofQueueFilter,
      proofTypeFilter,
      selectedProofId,
    ),
    portfolioSummaryCards: getPortfolioSummaryCards(chapterRows),
    chapterRows,
    selectedChapter,
    campaignCards,
    campaignOperations: getCampaignOperationsOverview(
      selectedCampaignSlug,
      campaignCards,
      routeBase,
      {
        selectedCampaignRiskGroup: campaignRiskGroup,
        source: options.source,
        selectedChapterId,
        decisionPreview,
        riskFilter,
        countryFilter,
        coachFilter,
        portfolioCampaignFilter,
        searchQuery,
        proofQueueFilter,
        proofTypeFilter,
        selectedProofId,
        selectedFeedDraftId: options.feedDraft ?? null,
        selectedFeedPostId: options.feedPost ?? null,
        feedPreviewRole,
        feedAudienceMode,
        chapterRows,
      },
    ),
    proofReviewItems,
    selectedProofReview: getSelectedProofReviewPanel(
      proofReviewItems,
      selectedProofId,
      {
        routeBase,
        selectedView,
        selectedCampaignSlug,
        riskFilter,
        countryFilter,
        coachFilter,
        portfolioCampaignFilter,
        searchQuery,
        proofQueueFilter,
        proofTypeFilter,
      },
    ),
    feedDrafts: allFeedDrafts,
    feedStudio,
    feedAnalytics,
    hubspotWorkspace,
    feedInsights: getFeedInsights(recognitionSummary, proofReviewItems, data),
    hubspotSignals: getHubSpotSignals(chapterRows, data.integrationEvents, data.outboxItems),
    bestPracticeCards,
    adminWorkspace,
    adminSignals: getAdminSignals(adminSummary, outboxSummary),
    outboxSummary,
    auditItems: getAuditItems(data),
    leaderboardRows: recognitionSummary.leaderboard.map((row) => ({
      displayName: row.displayName,
      roleLabel: row.roleLabel,
      points: row.points,
      recognition: row.recognition,
    })),
    safetyNote:
      "This screen is intentionally mock-safe. HubSpot, Luma, n8n, warehouse, and any admin writes remain blocked or mocked until Nick approves live activation.",
  };
}

function canReadStaffCommandCenter(actor: LocalActorContext): boolean {
  const surfaceFamily = getActorSurfaceFamily(actor);

  return (
    surfaceFamily === "coach" ||
    surfaceFamily === "staff" ||
    surfaceFamily === "super_admin"
  );
}

function getFilteredChapterRows(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  filters: {
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
  },
  routeBase: "/staff" | "/coach",
): StaffChapterPortfolioRow[] {
  const surfaceFamily = getActorSurfaceFamily(actor);
  const portfolioRows =
    surfaceFamily === "staff" || surfaceFamily === "super_admin"
      ? staffPortfolioSeed.map((row) => ({
          ...row,
          detailHref: getHref({
            routeBase,
            view: "chapters",
            risk: filters.riskFilter,
            country: filters.countryFilter,
            coach: filters.coachFilter,
            portfolioCampaign: filters.portfolioCampaignFilter,
            query: filters.searchQuery,
            chapterId: row.chapterId,
          }),
          supportSummary: getSupportSummary(row),
        }))
      : getCoachPortfolioReadiness(actor, data).rows.map((row) =>
          toStaffChapterPortfolioRow(row, data, filters, routeBase),
        );
  const normalizedQuery = filters.searchQuery.toLowerCase();

  return portfolioRows
    .filter((row) => {
      if (filters.riskFilter !== "all" && row.risk !== filters.riskFilter) {
        return false;
      }

      if (
        filters.countryFilter !== "all" &&
        countryToFilterKey(row.country) !== filters.countryFilter
      ) {
        return false;
      }

      if (
        filters.coachFilter !== "all" &&
        coachToFilterKey(row.coachName) !== filters.coachFilter
      ) {
        return false;
      }

      if (
        filters.portfolioCampaignFilter !== "all" &&
        portfolioCampaignToFilterKey(row.campaignName) !== filters.portfolioCampaignFilter
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        row.chapterName,
        row.campus,
        row.country,
        row.coachName,
        row.leadName,
        row.campaignName,
        row.statusLabel,
        row.nextStep,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
}

function toStaffChapterPortfolioRow(
  row: ReturnType<typeof getCoachPortfolioReadiness>["rows"][number],
  data: ReadOnlyAppData,
  filters: {
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
  },
  routeBase: "/staff" | "/coach",
): StaffChapterPortfolioRow {
  const defaults =
    portfolioSignalsByChapter[row.chapterName] ??
    portfolioSignalsByChapter["UCLA MEDLIFE"];

  const country = defaults.country;
  const campaignName =
    row.chapterId === data.chapter.id ? defaults.campaignName : defaults.campaignName;

  return {
    chapterId: row.chapterId,
    chapterName: row.chapterName,
    campus: row.campus,
    country,
    coachName: row.coachName,
    leadName: leadNameByChapter[row.chapterName] ?? "Leadership lane assigned",
    campaignName,
    statusLabel: defaults.statusLabel,
    statusTone: statusToTone(defaults.statusLabel),
    readinessScore: row.readinessScore,
    decision: row.decision,
    risk: row.risk,
    leadsCount: defaults.leadsCount,
    rsvpCount: defaults.rsvpCount,
    attendanceCount: defaults.attendanceCount,
    assignmentsCount: defaults.assignmentsCount,
    proofPending: row.proofPending,
    openFollowUps: row.openFollowUps,
    pointsPerWeek: defaults.pointsPerWeek,
    hubspotStageLabel: defaults.hubspotStageLabel,
    lastActiveLabel: defaults.lastActiveLabel,
    nextStep: row.nextStep,
    supportSummary: getSupportSummary(row),
    detailHref: getHref({
      routeBase,
      view: "chapters",
      risk: filters.riskFilter,
      country: filters.countryFilter,
      coach: filters.coachFilter,
      portfolioCampaign: filters.portfolioCampaignFilter,
      query: filters.searchQuery,
      chapterId: row.chapterId,
    }),
  };
}

function getSupportSummary(row: {
  decision: "advance" | "hold" | "intervene";
  proofPending: number;
  openFollowUps: number;
}): string {
  if (row.decision === "intervene") {
    return `${row.openFollowUps} follow-ups are still open and proof is lagging.`;
  }

  if (row.decision === "hold") {
    return `${row.proofPending} proof items need review before the chapter moves forward.`;
  }

  return "Momentum is visible. Protect the story and keep the next action clear.";
}

function statusToTone(
  status: StaffChapterPortfolioRow["statusLabel"],
): StaffChapterPortfolioRow["statusTone"] {
  switch (status) {
    case "On Track":
    case "Complete":
      return "good";
    case "Behind":
    case "Paused":
      return "warning";
    case "Not Started":
      return "danger";
  }
}

function countryToFilterKey(country: string): StaffCountryFilter {
  switch (country.toLowerCase()) {
    case "usa":
      return "usa";
    case "canada":
      return "canada";
    case "peru":
      return "peru";
    case "brazil":
      return "brazil";
    case "honduras":
      return "honduras";
    case "nicaragua":
      return "nicaragua";
    case "kenya":
      return "kenya";
    case "uganda":
      return "uganda";
    case "chile":
      return "chile";
    case "mexico":
      return "mexico";
    case "ghana":
      return "ghana";
    default:
      return "all";
  }
}

function coachToFilterKey(coach: string): StaffCoachFilter {
  const normalized = coach.toLowerCase();
  if (normalized.includes("cam coach")) {
    return "cam_coach";
  }

  if (normalized.includes("maria")) {
    return "maria";
  }

  if (normalized.includes("james")) {
    return "james";
  }

  if (normalized.includes("aisha")) {
    return "aisha";
  }

  if (normalized.includes("carlos")) {
    return "carlos";
  }

  if (normalized.includes("fernanda")) {
    return "fernanda";
  }

  if (normalized.includes("lucia")) {
    return "lucia";
  }

  if (normalized.includes("samuel")) {
    return "samuel";
  }

  return "all";
}

function portfolioCampaignToFilterKey(campaignName: string): StaffPortfolioCampaignFilter {
  switch (campaignName.toLowerCase()) {
    case "rush month":
      return "rush_month";
    case "slt promotion":
      return "slt_promotion";
    case "moving mountains":
      return "moving_mountains";
    case "chapter engagement":
      return "chapter_engagement";
    case "leadership transition":
      return "leadership_transition";
    case "grow the movement":
      return "grow_the_movement";
    case "start a chapter":
      return "start_a_chapter";
    default:
      return "all";
  }
}

function getSelectedChapterId(
  rows: StaffChapterPortfolioRow[],
  chapterId?: string,
): string | null {
  if (chapterId && rows.some((row) => row.chapterId === chapterId)) {
    return chapterId;
  }

  return null;
}

function getSelectedChapterDrawer(
  data: ReadOnlyAppData,
  rows: StaffChapterPortfolioRow[],
  selectedChapterId: string | null,
  decisionPreview: StaffDecisionPreview | null,
  context: {
    routeBase: "/staff" | "/coach";
    selectedView: StaffCommandCenterView;
    selectedCampaignSlug: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
    selectedFeedDraftId: string | null;
    selectedFeedPostId: string | null;
    feedPreviewRole: StaffFeedPreviewRole;
    feedAudienceMode: StaffFeedAudienceMode;
  },
): StaffChapterDrawer | null {
  const selectedRow = rows.find((row) => row.chapterId === selectedChapterId);

  if (!selectedRow) {
    return null;
  }

  const attendanceRate =
    selectedRow.rsvpCount > 0
      ? Math.round((selectedRow.attendanceCount / selectedRow.rsvpCount) * 100)
      : 0;
  const recentSignals: StaffChapterDrawerSignal[] = [
    {
      label:
        selectedRow.statusLabel === "Behind" || selectedRow.statusLabel === "Not Started"
          ? `${selectedRow.campaignName} momentum is slipping`
          : `${selectedRow.campaignName} momentum is holding`,
      status:
        selectedRow.risk === "high"
          ? "urgent"
          : selectedRow.risk === "medium"
            ? "watch"
            : "steady",
      detail:
        selectedRow.statusLabel === "Not Started"
          ? `${selectedRow.leadsCount} leads are in the pipeline, but the chapter still has no visible event motion yet.`
          : `${selectedRow.leadsCount} leads have produced ${selectedRow.rsvpCount} RSVPs and ${selectedRow.attendanceCount} check-ins so far, which is why this chapter is currently marked ${selectedRow.statusLabel.toLowerCase()}.`,
    },
    {
      label:
        selectedRow.openFollowUps >= 6
          ? "Follow-up debt is growing"
          : "Follow-up queue is still manageable",
      status: selectedRow.openFollowUps >= 6 ? "urgent" : "watch",
      detail: `${selectedRow.openFollowUps} HubSpot follow-ups remain open after ${selectedRow.lastActiveLabel}, so ${selectedRow.coachName} and ${selectedRow.leadName} need a tighter outreach handoff.`,
    },
    {
      label:
        selectedRow.proofPending >= 6
          ? "Proof review is backing up"
          : "Proof review still needs attention",
      status: selectedRow.proofPending >= 6 ? "urgent" : "watch",
      detail:
        selectedRow.proofPending > 0
          ? `${selectedRow.proofPending} items are waiting in review while attendance is converting at ${attendanceRate}%, so the chapter still needs visible proof to support the current push.`
          : "No proof items are currently waiting in review.",
    },
  ];

  const selectedDecision = decisionPreview ?? selectedRow.decision;
  const preservedFeedDraftId = context.selectedFeedPostId
    ? context.selectedFeedDraftId
    : null;
  const preservedFeedPostId = context.selectedFeedPostId;
  const preservedFeedPreviewRole = context.selectedFeedPostId
    ? context.feedPreviewRole
    : undefined;
  const preservedFeedAudienceMode = context.selectedFeedPostId
    ? context.feedAudienceMode
    : undefined;
  const feedAnalyticsSourceContext =
    context.selectedFeedPostId
      ? {
          eyebrow: "Feed analytics source",
          title: "Opened from a feed-engagement review",
          summary: `${selectedRow.chapterName} was opened while reviewing content performance. Keep chapter follow-up attached to the same post, audience, and engagement signal that surfaced this chapter in analytics.`,
          actionLabel: "Return to feed analytics",
          actionHref: getHref({
            routeBase: context.routeBase,
            view: "feed_analytics",
            campaign: context.selectedCampaignSlug,
            risk: context.riskFilter,
            country: context.countryFilter,
            coach: context.coachFilter,
            portfolioCampaign: context.portfolioCampaignFilter,
            query: context.searchQuery,
            proofQueue: context.proofQueueFilter,
            proofType: context.proofTypeFilter,
            proof: context.selectedProofId,
            feedDraft: preservedFeedDraftId,
            feedPost: preservedFeedPostId,
            feedRole: preservedFeedPreviewRole,
            feedAudience: preservedFeedAudienceMode,
          }),
        }
      : null;
  const campaignHealthSummary =
    selectedRow.statusLabel === "Not Started"
      ? "No event or follow-up momentum is visible yet."
      : selectedRow.statusLabel === "Behind" || selectedRow.statusLabel === "Paused"
        ? "Momentum is visible, but follow-through and review are slipping."
        : "Momentum is visible and the chapter is moving through the current campaign loop.";

  return {
    chapterId: selectedRow.chapterId,
    chapterName: selectedRow.chapterName,
    campus: selectedRow.campus,
    country: selectedRow.country,
    risk: selectedRow.risk,
    leadName: selectedRow.leadName,
    coachName: selectedRow.coachName,
    memberCount: Math.max(12, Math.round(selectedRow.leadsCount / 2) + 8),
    lastActiveLabel: selectedRow.lastActiveLabel,
    campaignName: selectedRow.campaignName,
    healthScore: selectedRow.readinessScore,
    statusLabel: selectedRow.statusLabel,
    summary:
      `${selectedRow.chapterName} is currently in ${selectedRow.campaignName} with ${selectedRow.proofPending} proof item(s) and ${selectedRow.openFollowUps} open follow-up(s).`,
    recommendedDecision: decisionToLabel(selectedRow.decision),
    selectedDecision,
    decisionOptions: (["advance", "hold", "intervene"] as StaffDecisionPreview[]).map(
      (decision) => ({
        key: decision,
        label: decisionToLabel(decision),
        href: getHref({
          routeBase: context.routeBase,
          view: context.selectedView,
          campaign: context.selectedCampaignSlug,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          chapterId: selectedRow.chapterId,
          decision,
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          feedDraft: preservedFeedDraftId,
          feedPost: preservedFeedPostId,
          feedRole: preservedFeedPreviewRole,
          feedAudience: preservedFeedAudienceMode,
        }),
      }),
    ),
    campaignKpis: [
      { label: "Leads", value: `${selectedRow.leadsCount}` },
      { label: "RSVPs", value: `${selectedRow.rsvpCount}` },
      { label: "Attended", value: `${selectedRow.attendanceCount}` },
      {
        label: "New Members",
        value: `${Math.max(0, Math.round(selectedRow.leadsCount * 0.08) - selectedRow.proofPending)}`,
      },
      { label: "Follow-ups", value: `${Math.max(0, selectedRow.openFollowUps - 1)}` },
      { label: "Assignments", value: `${selectedRow.assignmentsCount}` },
      {
        label: "Evidence OK",
        value: `${Math.max(0, selectedRow.assignmentsCount - selectedRow.proofPending - 4)}`,
      },
      { label: "Pending UGC", value: `${selectedRow.proofPending}` },
    ],
    hubspotPanel: {
      title: "HubSpot CRM",
      accent: "amber",
      metrics: [
        { label: "Lifecycle Stage", value: selectedRow.hubspotStageLabel },
        { label: "Open Tasks", value: `${selectedRow.openFollowUps + selectedRow.proofPending}` },
        { label: "New Leads", value: `${selectedRow.leadsCount}` },
        {
          label: "Follow-up Status",
          value: selectedRow.openFollowUps > 4 ? "Needs Attention" : "On Track",
        },
        { label: "Last Touch", value: selectedRow.lastActiveLabel },
        { label: "Owner", value: selectedRow.coachName },
      ],
      summary: `${selectedRow.openFollowUps + selectedRow.proofPending} open tasks - follow-up needed`,
    },
    lumaPanel: {
      title: "Luma Events",
      accent: "violet",
      metrics: [
        {
          label: "Events",
          value: `${Math.max(0, Math.round(selectedRow.rsvpCount / 18) - (selectedRow.statusLabel === "Not Started" ? 1 : 0))}`,
        },
        { label: "RSVPs", value: `${selectedRow.rsvpCount}` },
        { label: "Check-ins", value: `${selectedRow.attendanceCount}` },
        {
          label: "Att. Rate",
          value: `${selectedRow.rsvpCount > 0 ? Math.round((selectedRow.attendanceCount / selectedRow.rsvpCount) * 100) : 0}%`,
        },
      ],
      summary: selectedRow.statusLabel === "Not Started"
        ? "Event creation still looks blocked."
        : "Mock-linked event posture remains review-safe.",
    },
    activityPanel: {
      title: "Feed & myMEDLIFE Activity",
      accent: "sky",
      metrics: [
        { label: "Points (Week)", value: `${selectedRow.pointsPerWeek}` },
        { label: "Feed Views", value: `${Math.max(18, selectedRow.leadsCount * 3)}` },
        { label: "Actions Assigned", value: `${selectedRow.assignmentsCount * 4}` },
        { label: "Evidence Submitted", value: `${selectedRow.proofPending}` },
        {
          label: "Evidence Approved",
          value: `${Math.max(0, selectedRow.assignmentsCount - selectedRow.proofPending - 4)}`,
        },
        { label: "Pending Review", value: `${selectedRow.proofPending}` },
      ],
      summary: campaignHealthSummary,
    },
    coachNotePlaceholder: `Add a note for ${selectedRow.chapterName}...`,
    footerActions: getDrawerFooterActions(selectedDecision, selectedRow, context, {
      preservedFeedDraftId,
      preservedFeedPostId,
      preservedFeedPreviewRole,
      preservedFeedAudienceMode,
    }),
    closeHref:
      feedAnalyticsSourceContext?.actionHref ??
      getHref({
        routeBase: context.routeBase,
        view: context.selectedView,
        campaign: context.selectedCampaignSlug,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
      }),
    focusItems: [
      selectedRow.nextStep,
      `${selectedRow.leadName} owns the next visible student push.`,
      `${selectedRow.coachName} should keep the chapter in a read-only, no-send support loop.`,
    ],
    quickLinks: [
      {
        label: "Open proof queue",
        href: getHref({
          routeBase: context.routeBase,
          view: "proof_ugc",
          campaign: context.selectedCampaignSlug,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          chapterId: selectedRow.chapterId,
          decision: selectedDecision,
          proofQueue: "pending",
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          feedDraft: preservedFeedDraftId,
          feedPost: preservedFeedPostId,
          feedRole: preservedFeedPreviewRole,
          feedAudience: preservedFeedAudienceMode,
        }),
      },
      {
        label: "Open feed studio",
        href: getHref({
          routeBase: context.routeBase,
          view: "feed_studio",
          campaign: context.selectedCampaignSlug,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          chapterId: selectedRow.chapterId,
          decision: selectedDecision,
          feedAudience: "one_chapter",
          feedRole: "leader",
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          feedDraft: preservedFeedDraftId,
          feedPost: preservedFeedPostId,
        }),
      },
      {
        label: "Open HubSpot view",
        href: getHref({
          routeBase: context.routeBase,
          view: "hubspot",
          campaign: context.selectedCampaignSlug,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          chapterId: selectedRow.chapterId,
          decision: selectedDecision,
          hubspotChapter: getHubSpotChapterIdForPortfolioChapter(selectedRow.chapterName),
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          feedDraft: preservedFeedDraftId,
          feedPost: preservedFeedPostId,
          feedRole: preservedFeedPreviewRole,
          feedAudience: preservedFeedAudienceMode,
        }),
      },
    ],
    recentSignals,
    sourceContext: feedAnalyticsSourceContext,
  };
}

function getCampaignOperationCards(): StaffCampaignOperationCard[] {
  const commandCenterCampaignOrder = [
    "rush-month",
    "slt-promotion",
    "moving-mountains",
    "chapter-engagement",
    "leadership-transition",
    "grow-the-movement",
    "start-a-chapter",
  ] as const;

  return commandCenterCampaignOrder
    .map((slug) => getCampaignShells().find((item) => item.slug === slug) ?? null)
    .filter((campaign): campaign is NonNullable<typeof campaign> => campaign !== null)
    .map((campaign) => ({
      slug: campaign.slug,
      name: campaign.name,
      status: campaign.status,
      summary: campaign.summary,
      primaryKpis: campaign.primaryKpis.slice(0, 3),
      actionCommitteeLanes: campaign.actionCommitteeLanes.slice(0, 3),
      recommendedStaffMove: getRecommendedStaffMove(campaign.status),
      integrationPosture: campaign.integrationPosture,
      href: `/campaigns/${campaign.slug}`,
    }));
}

function getDrawerFooterActions(
  selectedDecision: StaffDecisionPreview,
  selectedRow: StaffChapterPortfolioRow,
  context: {
    routeBase: "/staff" | "/coach";
    selectedView: StaffCommandCenterView;
    selectedCampaignSlug: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
  },
  preserved: {
    preservedFeedDraftId: string | null;
    preservedFeedPostId: string | null;
    preservedFeedPreviewRole?: StaffFeedPreviewRole;
    preservedFeedAudienceMode?: StaffFeedAudienceMode;
  },
): StaffChapterDrawerAction[] {
  const commonRouteState = {
    routeBase: context.routeBase,
    campaign: context.selectedCampaignSlug,
    risk: context.riskFilter,
    country: context.countryFilter,
    coach: context.coachFilter,
    portfolioCampaign: context.portfolioCampaignFilter,
    query: context.searchQuery,
    chapterId: selectedRow.chapterId,
    decision: selectedDecision,
    proofQueue: context.proofQueueFilter,
    proofType: context.proofTypeFilter,
    proof: context.selectedProofId,
    feedDraft: preserved.preservedFeedDraftId,
    feedPost: preserved.preservedFeedPostId,
    feedRole: preserved.preservedFeedPreviewRole,
    feedAudience: preserved.preservedFeedAudienceMode,
  } as const;

  switch (selectedDecision) {
    case "advance":
      return [
        {
          label: "Advance Chapter",
          href: getHref({
            ...commonRouteState,
            view: "campaigns",
          }),
          tone: "primary",
        },
        {
          label: "Send Coach Packet",
          href: getHref({
            ...commonRouteState,
            view: "best_practices",
            practiceCountry: countryToBestPracticeFilterKey(selectedRow.country),
            practiceCampaign: bestPracticeCampaignToFilterKey(selectedRow.campaignName),
          }),
          tone: "secondary",
        },
      ];
    case "hold":
      return [
        {
          label: "Open Proof Queue",
          href: getHref({
            ...commonRouteState,
            view: "proof_ugc",
            proofQueue: "pending",
          }),
          tone: "primary",
        },
        {
          label: "Open HubSpot View",
          href: getHref({
            ...commonRouteState,
            view: "hubspot",
            hubspotChapter: getHubSpotChapterIdForPortfolioChapter(selectedRow.chapterName),
          }),
          tone: "secondary",
        },
      ];
    case "intervene":
      return [
        {
          label: "Assign Intervention",
          href: getHref({
            ...commonRouteState,
            view: "campaigns",
            risk: "high",
            decision: "intervene",
          }),
          tone: "primary",
        },
        {
          label: "Open Proof Queue",
          href: getHref({
            ...commonRouteState,
            view: "proof_ugc",
            proofQueue: "pending",
          }),
          tone: "secondary",
        },
      ];
  }
}

function getSelectedCampaignSlug(
  campaignSlug: string | undefined,
  campaigns: StaffCampaignOperationCard[],
): string {
  if (
    campaignSlug &&
    campaigns.some((campaign) => campaign.slug === campaignSlug)
  ) {
    return campaignSlug;
  }

  return campaigns[0]?.slug ?? "rush-month";
}

function getRequestedCampaignSlug(
  campaignSlug: string | undefined,
  campaigns: StaffCampaignOperationCard[],
) {
  if (
    campaignSlug &&
    campaigns.some((campaign) => campaign.slug === campaignSlug)
  ) {
    return campaignSlug;
  }

  return null;
}

function getCampaignOperationsOverview(
  selectedCampaignSlug: string,
  campaignCards: StaffCampaignOperationCard[],
  routeBase: "/staff" | "/coach",
  context: {
    selectedCampaignRiskGroup: StaffCampaignRiskGroup;
    source?: string;
    selectedChapterId: string | null;
    decisionPreview: StaffDecisionPreview | null;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
    selectedFeedDraftId: string | null;
    selectedFeedPostId: string | null;
    feedPreviewRole: StaffFeedPreviewRole;
    feedAudienceMode: StaffFeedAudienceMode;
    chapterRows: StaffChapterPortfolioRow[];
  },
): StaffCampaignOperationsOverview {
  const selectedCampaign =
    campaignCards.find((campaign) => campaign.slug === selectedCampaignSlug) ??
    campaignCards[0];
  const selectedChapter =
    context.chapterRows.find((row) => row.chapterId === context.selectedChapterId) ?? null;
  const selectedDecision = context.decisionPreview ?? selectedChapter?.decision ?? null;
  const preservedFeedDraftId = context.selectedFeedPostId
    ? context.selectedFeedDraftId
    : null;
  const preservedFeedPostId = context.selectedFeedPostId;
  const preservedFeedPreviewRole = context.selectedFeedPostId
    ? context.feedPreviewRole
    : undefined;
  const preservedFeedAudienceMode = context.selectedFeedPostId
    ? context.feedAudienceMode
    : undefined;
  const riskCards = getCampaignRiskCards(selectedCampaignSlug, routeBase, {
    selectedCampaignRiskGroup: context.selectedCampaignRiskGroup,
    riskFilter: context.riskFilter,
    countryFilter: context.countryFilter,
    coachFilter: context.coachFilter,
    portfolioCampaignFilter: context.portfolioCampaignFilter,
    searchQuery: context.searchQuery,
    chapterId: context.selectedChapterId,
    decision: selectedDecision ?? undefined,
    proofQueueFilter: context.proofQueueFilter,
    proofTypeFilter: context.proofTypeFilter,
    selectedProofId: context.selectedProofId,
    selectedFeedDraftId: preservedFeedDraftId,
    selectedFeedPostId: preservedFeedPostId,
    feedPreviewRole: preservedFeedPreviewRole,
    feedAudienceMode: preservedFeedAudienceMode,
  });
  const sourceContext = selectedChapter
    ? {
        eyebrow: routeBase === "/coach" ? "Campaign focus" : "Selected chapter focus",
        title: `Campaign support for ${selectedChapter.chapterName}`,
        summary:
          context.selectedFeedPostId
            ? `${selectedChapter.chapterName} was opened from a feed-engagement review. Keep campaign follow-up attached to the same chapter, decision posture, and content signal that surfaced this intervention.`
            : `Keep campaign follow-up attached to ${selectedChapter.chapterName} so the reviewer stays anchored to the same chapter and decision posture while moving across campaign operations.`,
        actionLabel: "Return to chapter detail",
        actionHref: getCampaignChapterDetailHref({
          routeBase,
          campaign: selectedCampaignSlug,
          campaignRisk: context.selectedCampaignRiskGroup,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          chapterId: selectedChapter.chapterId,
          decision: selectedDecision ?? undefined,
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          feedDraft: preservedFeedDraftId,
          feedPost: preservedFeedPostId,
          feedRole: preservedFeedPreviewRole,
          feedAudience: preservedFeedAudienceMode,
        }),
      }
    : context.source === "portfolio_overview"
      ? {
          eyebrow: "Portfolio overview source",
          title: "Opened from the chapter portfolio",
          summary:
            "This campaign workspace was opened from Portfolio Overview. Keep the same filters, risk posture, and visible chapter set while moving from scan mode into campaign operations.",
          actionLabel: "Return to portfolio overview",
          actionHref: getHref({
            routeBase,
            view: "chapters",
            campaign: selectedCampaignSlug,
            risk: context.riskFilter,
            country: context.countryFilter,
            coach: context.coachFilter,
            portfolioCampaign: context.portfolioCampaignFilter,
            query: context.searchQuery,
          }),
        }
    : null;

  return {
    activeCampaignCountLabel: `${campaignCards.length} campaigns active across all regions`,
    timestampLabel: "Jun 17, 2026 · 14:41 UTC",
    selectedCampaignSlug,
    selectedCampaignName: selectedCampaign?.name ?? "Rush Month",
    selectedRiskGroup: context.selectedCampaignRiskGroup,
    selectedRiskGroupLabel: campaignRiskGroupToLabel(context.selectedCampaignRiskGroup),
    clearRiskGroupHref: getHref({
      routeBase,
      view: "campaigns",
      campaign: selectedCampaignSlug,
      risk: context.riskFilter,
      country: context.countryFilter,
      coach: context.coachFilter,
      portfolioCampaign: context.portfolioCampaignFilter,
      query: context.searchQuery,
      chapterId: context.selectedChapterId,
      decision: selectedDecision ?? undefined,
      proofQueue: context.proofQueueFilter,
      proofType: context.proofTypeFilter,
      proof: context.selectedProofId,
      feedDraft: preservedFeedDraftId,
      feedPost: preservedFeedPostId,
      feedRole: preservedFeedPreviewRole,
      feedAudience: preservedFeedAudienceMode,
      source: context.source,
    }),
    sourceContext,
    tabs: campaignCards.map((campaign) => ({
      slug: campaign.slug,
      name: campaign.name,
      href: getHref({
        routeBase,
        view: "campaigns",
        campaign: campaign.slug,
        campaignRisk: context.selectedCampaignRiskGroup,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        chapterId: context.selectedChapterId,
        decision: selectedDecision ?? undefined,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        proof: context.selectedProofId,
        feedDraft: preservedFeedDraftId,
        feedPost: preservedFeedPostId,
        feedRole: preservedFeedPreviewRole,
        feedAudience: preservedFeedAudienceMode,
        source: context.source,
      }),
    })),
    riskCards,
    bulkActions: [
      {
        label: "Send Reminder",
        href: getHref({
          routeBase,
          view: "campaigns",
          campaign: selectedCampaignSlug,
          campaignRisk: context.selectedCampaignRiskGroup,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          chapterId: context.selectedChapterId,
          decision: selectedDecision ?? undefined,
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          feedDraft: preservedFeedDraftId,
          feedPost: preservedFeedPostId,
          feedRole: preservedFeedPreviewRole,
          feedAudience: preservedFeedAudienceMode,
          source: context.source,
        }),
      },
      {
        label: "Assign Coach Review",
        href: getHref({
          routeBase,
          view: "campaigns",
          campaign: selectedCampaignSlug,
          campaignRisk: context.selectedCampaignRiskGroup,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          chapterId: context.selectedChapterId,
          decision: selectedDecision ?? undefined,
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          feedDraft: preservedFeedDraftId,
          feedPost: preservedFeedPostId,
          feedRole: preservedFeedPreviewRole,
          feedAudience: preservedFeedAudienceMode,
          source: context.source,
        }),
      },
      {
        label: "Share Best Practice",
        href: getHref({
          routeBase,
          view: "best_practices",
          campaign: selectedCampaignSlug,
          campaignRisk: context.selectedCampaignRiskGroup,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          chapterId: context.selectedChapterId,
          decision: selectedDecision ?? undefined,
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          feedDraft: preservedFeedDraftId,
          feedPost: preservedFeedPostId,
          feedRole: preservedFeedPreviewRole,
          feedAudience: preservedFeedAudienceMode,
          source: context.source,
        }),
      },
      {
        label: "Create Intervention Packet",
        href: getHref({
          routeBase,
          view: "chapters",
          campaignRisk: context.selectedCampaignRiskGroup,
          risk: "high",
          campaign: selectedCampaignSlug,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          chapterId: context.selectedChapterId,
          decision: selectedDecision ?? undefined,
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          feedDraft: preservedFeedDraftId,
          feedPost: preservedFeedPostId,
          feedRole: preservedFeedPreviewRole,
          feedAudience: preservedFeedAudienceMode,
          source: context.source,
        }),
      },
    ],
    executionRows: getCampaignExecutionRows(selectedCampaignSlug, routeBase, {
      selectedChapterId: context.selectedChapterId,
      selectedCampaignRiskGroup: context.selectedCampaignRiskGroup,
      riskFilter: context.riskFilter,
      countryFilter: context.countryFilter,
      coachFilter: context.coachFilter,
      portfolioCampaignFilter: context.portfolioCampaignFilter,
      searchQuery: context.searchQuery,
      decision: selectedDecision,
      proofQueueFilter: context.proofQueueFilter,
      proofTypeFilter: context.proofTypeFilter,
      selectedProofId: context.selectedProofId,
      selectedFeedDraftId: preservedFeedDraftId,
      selectedFeedPostId: preservedFeedPostId,
      feedPreviewRole: preservedFeedPreviewRole,
      feedAudienceMode: preservedFeedAudienceMode,
      chapterRows: context.chapterRows,
    }),
  };
}

function getCampaignRiskCards(
  selectedCampaignSlug: string,
  routeBase: "/staff" | "/coach",
  context: {
    selectedCampaignRiskGroup: StaffCampaignRiskGroup;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    chapterId: string | null;
    decision?: StaffDecisionPreview;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
    selectedFeedDraftId: string | null;
    selectedFeedPostId: string | null;
    feedPreviewRole?: StaffFeedPreviewRole;
    feedAudienceMode?: StaffFeedAudienceMode;
  },
): StaffCampaignRiskCard[] {
  const defaultCards: Array<{
    key: Exclude<StaffCampaignRiskGroup, "all">;
    title: string;
    count: number;
    chapterLabels: string[];
    chapterNames: string[];
  }> = [
    {
      key: "no_event",
      title: "No event created",
      count: 2,
      chapterLabels: ["UNMSM Lima", "Universidad de Chile"],
      chapterNames: ["UNMSM Lima", "Universidad de Chile"],
    },
    {
      key: "low_rsvp",
      title: "Low RSVP (< 20)",
      count: 3,
      chapterLabels: ["Yale University", "UFMG Belo Horizonte", "+1"],
      chapterNames: ["Yale University", "UFMG Belo Horizonte", "Johns Hopkins"],
    },
    {
      key: "low_attendance",
      title: "Low Attendance (< 50%)",
      count: 0,
      chapterLabels: [],
      chapterNames: [],
    },
    {
      key: "no_follow_up",
      title: "No Follow-up",
      count: 2,
      chapterLabels: ["UNMSM Lima", "Universidad de Chile"],
      chapterNames: ["UNMSM Lima", "Universidad de Chile"],
    },
    {
      key: "evidence_stuck",
      title: "Evidence Stuck",
      count: 4,
      chapterLabels: ["Yale University", "UNMSM Lima", "+2"],
      chapterNames: ["Yale University", "UNMSM Lima", "UFMG Belo Horizonte", "Johns Hopkins"],
    },
  ];

  const campaignName = selectedCampaignSlug.replaceAll("-", " ");

  return defaultCards.map((card, index) => {
    const adjustedCount =
      selectedCampaignSlug === "rush-month"
        ? card.count
        : Math.max(0, card.count - (index % 2 === 0 ? 1 : 0));

    return {
      key: card.key,
      title: card.title,
      count: adjustedCount,
      chapterLabels:
        adjustedCount === 0
          ? [`No urgent ${campaignName} blocker`]
          : card.chapterLabels,
      href: getHref({
        routeBase,
        view: "campaigns",
        campaign: selectedCampaignSlug,
        campaignRisk: card.key,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        chapterId: context.chapterId,
        decision: context.decision,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        proof: context.selectedProofId,
        feedDraft: context.selectedFeedDraftId,
        feedPost: context.selectedFeedPostId,
        feedRole: context.feedPreviewRole,
        feedAudience: context.feedAudienceMode,
      }),
      isActive: context.selectedCampaignRiskGroup === card.key,
    };
  });
}

function getCampaignRiskGroupChapterNames(
  selectedCampaignSlug: string,
  group: StaffCampaignRiskGroup,
): string[] {
  if (group === "all") {
    return [];
  }

  const definitions: Record<Exclude<StaffCampaignRiskGroup, "all">, string[]> = {
    no_event: ["UNMSM Lima", "Universidad de Chile"],
    low_rsvp: ["Yale University", "UFMG Belo Horizonte", "Johns Hopkins"],
    low_attendance: [],
    no_follow_up: ["UNMSM Lima", "Universidad de Chile"],
    evidence_stuck: ["Yale University", "UNMSM Lima", "UFMG Belo Horizonte", "Johns Hopkins"],
  };

  if (selectedCampaignSlug === "rush-month") {
    return definitions[group];
  }

  const chapterNames = definitions[group];
  return chapterNames.length > 1 ? chapterNames.slice(0, chapterNames.length - 1) : chapterNames;
}

function getCampaignExecutionRows(
  selectedCampaignSlug: string,
  routeBase: "/staff" | "/coach",
  context: {
    selectedChapterId: string | null;
    selectedCampaignRiskGroup: StaffCampaignRiskGroup;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    decision: StaffDecisionPreview | null;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
    selectedFeedDraftId: string | null;
    selectedFeedPostId: string | null;
    feedPreviewRole?: StaffFeedPreviewRole;
    feedAudienceMode?: StaffFeedAudienceMode;
    chapterRows: StaffChapterPortfolioRow[];
  },
): StaffCampaignExecutionRow[] {
  const rows: StaffCampaignExecutionRow[] = [
    {
      chapterName: "UC Berkeley",
      country: "USA",
      coachName: "Maria",
      planningStatus: "complete",
      eventCreatedLabel: "4",
      eventCreatedStatus: "complete",
      leadsCount: 87,
      followUpsCompleted: 54,
      followUpsTarget: 87,
      evidenceReviewedCount: 22,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "Yale University",
      country: "USA",
      coachName: "James",
      planningStatus: "complete",
      eventCreatedLabel: "1",
      eventCreatedStatus: "complete",
      leadsCount: 19,
      followUpsCompleted: 4,
      followUpsTarget: 19,
      evidenceReviewedCount: 3,
      kpiTargetStatus: "missed",
      decision: "hold",
    },
    {
      chapterName: "University of Florida",
      country: "USA",
      coachName: "Maria",
      planningStatus: "complete",
      eventCreatedLabel: "5",
      eventCreatedStatus: "complete",
      leadsCount: 104,
      followUpsCompleted: 88,
      followUpsTarget: 104,
      evidenceReviewedCount: 41,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "McGill University",
      country: "Canada",
      coachName: "Aisha",
      planningStatus: "complete",
      eventCreatedLabel: "3",
      eventCreatedStatus: "complete",
      leadsCount: 47,
      followUpsCompleted: 35,
      followUpsTarget: 47,
      evidenceReviewedCount: 17,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "PUCP Lima",
      country: "Peru",
      coachName: "Carlos",
      planningStatus: "complete",
      eventCreatedLabel: "2",
      eventCreatedStatus: "complete",
      leadsCount: 38,
      followUpsCompleted: 11,
      followUpsTarget: 38,
      evidenceReviewedCount: 8,
      kpiTargetStatus: "missed",
      decision: "hold",
    },
    {
      chapterName: "UNMSM Lima",
      country: "Peru",
      coachName: "Carlos",
      planningStatus: "missing",
      eventCreatedLabel: "None",
      eventCreatedStatus: "missing",
      leadsCount: 6,
      followUpsCompleted: 0,
      followUpsTarget: 6,
      evidenceReviewedCount: 0,
      kpiTargetStatus: "missed",
      decision: "intervene",
    },
    {
      chapterName: "USP Sao Paulo",
      country: "Brazil",
      coachName: "Fernanda",
      planningStatus: "complete",
      eventCreatedLabel: "4",
      eventCreatedStatus: "complete",
      leadsCount: 78,
      followUpsCompleted: 61,
      followUpsTarget: 78,
      evidenceReviewedCount: 33,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "UFMG Belo Horizonte",
      country: "Brazil",
      coachName: "Fernanda",
      planningStatus: "complete",
      eventCreatedLabel: "1",
      eventCreatedStatus: "complete",
      leadsCount: 22,
      followUpsCompleted: 7,
      followUpsTarget: 22,
      evidenceReviewedCount: 4,
      kpiTargetStatus: "missed",
      decision: "hold",
    },
    {
      chapterName: "UNAH Tegucigalpa",
      country: "Honduras",
      coachName: "Lucia",
      planningStatus: "complete",
      eventCreatedLabel: "3",
      eventCreatedStatus: "complete",
      leadsCount: 52,
      followUpsCompleted: 40,
      followUpsTarget: 52,
      evidenceReviewedCount: 19,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "UNAN Managua",
      country: "Nicaragua",
      coachName: "Lucia",
      planningStatus: "missing",
      eventCreatedLabel: "1",
      eventCreatedStatus: "complete",
      leadsCount: 14,
      followUpsCompleted: 3,
      followUpsTarget: 14,
      evidenceReviewedCount: 2,
      kpiTargetStatus: "missed",
      decision: "hold",
    },
    {
      chapterName: "University of Nairobi",
      country: "Kenya",
      coachName: "Samuel",
      planningStatus: "complete",
      eventCreatedLabel: "4",
      eventCreatedStatus: "complete",
      leadsCount: 61,
      followUpsCompleted: 50,
      followUpsTarget: 61,
      evidenceReviewedCount: 26,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "Makerere University",
      country: "Uganda",
      coachName: "Samuel",
      planningStatus: "complete",
      eventCreatedLabel: "3",
      eventCreatedStatus: "complete",
      leadsCount: 43,
      followUpsCompleted: 32,
      followUpsTarget: 43,
      evidenceReviewedCount: 14,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "Stanford University",
      country: "USA",
      coachName: "James",
      planningStatus: "complete",
      eventCreatedLabel: "5",
      eventCreatedStatus: "complete",
      leadsCount: 91,
      followUpsCompleted: 75,
      followUpsTarget: 91,
      evidenceReviewedCount: 48,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "Johns Hopkins",
      country: "USA",
      coachName: "James",
      planningStatus: "complete",
      eventCreatedLabel: "1",
      eventCreatedStatus: "complete",
      leadsCount: 21,
      followUpsCompleted: 6,
      followUpsTarget: 21,
      evidenceReviewedCount: 2,
      kpiTargetStatus: "missed",
      decision: "hold",
    },
    {
      chapterName: "UPCH Lima",
      country: "Peru",
      coachName: "Carlos",
      planningStatus: "complete",
      eventCreatedLabel: "4",
      eventCreatedStatus: "complete",
      leadsCount: 72,
      followUpsCompleted: 57,
      followUpsTarget: 72,
      evidenceReviewedCount: 29,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "Universidad de Chile",
      country: "Chile",
      coachName: "Fernanda",
      planningStatus: "missing",
      eventCreatedLabel: "None",
      eventCreatedStatus: "missing",
      leadsCount: 11,
      followUpsCompleted: 2,
      followUpsTarget: 11,
      evidenceReviewedCount: 1,
      kpiTargetStatus: "missed",
      decision: "intervene",
    },
    {
      chapterName: "UNAM Mexico City",
      country: "Mexico",
      coachName: "Carlos",
      planningStatus: "complete",
      eventCreatedLabel: "5",
      eventCreatedStatus: "complete",
      leadsCount: 99,
      followUpsCompleted: 82,
      followUpsTarget: 99,
      evidenceReviewedCount: 44,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "University of Ghana",
      country: "Ghana",
      coachName: "Samuel",
      planningStatus: "missing",
      eventCreatedLabel: "None",
      eventCreatedStatus: "missing",
      leadsCount: 4,
      followUpsCompleted: 0,
      followUpsTarget: 4,
      evidenceReviewedCount: 0,
      kpiTargetStatus: "missed",
      decision: "intervene",
    },
    {
      chapterName: "University of Toronto",
      country: "Canada",
      coachName: "Aisha",
      planningStatus: "complete",
      eventCreatedLabel: "4",
      eventCreatedStatus: "complete",
      leadsCount: 63,
      followUpsCompleted: 51,
      followUpsTarget: 63,
      evidenceReviewedCount: 23,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
    {
      chapterName: "MIT",
      country: "USA",
      coachName: "Maria",
      planningStatus: "complete",
      eventCreatedLabel: "5",
      eventCreatedStatus: "complete",
      leadsCount: 82,
      followUpsCompleted: 70,
      followUpsTarget: 82,
      evidenceReviewedCount: 38,
      kpiTargetStatus: "hit",
      decision: "advance",
    },
  ];

  const filteredChapterNames = getCampaignRiskGroupChapterNames(
    selectedCampaignSlug,
    context.selectedCampaignRiskGroup,
  );
  const campaignRows =
    filteredChapterNames.length > 0
      ? rows.filter((row) => filteredChapterNames.includes(row.chapterName))
      : rows;

  if (selectedCampaignSlug === "rush-month") {
    return attachCampaignExecutionLinks(campaignRows, routeBase, selectedCampaignSlug, context);
  }

  return attachCampaignExecutionLinks(campaignRows.map((row, index) => ({
    ...row,
    leadsCount: Math.max(4, row.leadsCount - (index + 1) * 2),
    evidenceReviewedCount: Math.max(0, row.evidenceReviewedCount - (index % 3)),
    followUpsCompleted: Math.max(
      0,
      row.followUpsCompleted - (index % 2 === 0 ? 3 : 1),
    ),
  })), routeBase, selectedCampaignSlug, context);
}

function attachCampaignExecutionLinks(
  rows: StaffCampaignExecutionRow[],
  routeBase: "/staff" | "/coach",
  selectedCampaignSlug: string,
  context: {
    selectedChapterId: string | null;
    selectedCampaignRiskGroup: StaffCampaignRiskGroup;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    decision: StaffDecisionPreview | null;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
    selectedFeedDraftId: string | null;
    selectedFeedPostId: string | null;
    feedPreviewRole?: StaffFeedPreviewRole;
    feedAudienceMode?: StaffFeedAudienceMode;
    chapterRows: StaffChapterPortfolioRow[];
  },
): StaffCampaignExecutionRow[] {
  return rows.map((row) => {
    const linkedChapter =
      context.chapterRows.find((chapter) => chapter.chapterName === row.chapterName) ?? null;

    return {
      ...row,
      href: linkedChapter
        ? getCampaignChapterDetailHref({
            routeBase,
            campaign: selectedCampaignSlug,
            campaignRisk: context.selectedCampaignRiskGroup,
            risk: context.riskFilter,
            country: context.countryFilter,
            coach: context.coachFilter,
            portfolioCampaign: context.portfolioCampaignFilter,
            query: context.searchQuery,
            chapterId: linkedChapter.chapterId,
            decision: context.decision ?? undefined,
            proofQueue: context.proofQueueFilter,
            proofType: context.proofTypeFilter,
            proof: context.selectedProofId,
            feedDraft: context.selectedFeedDraftId,
            feedPost: context.selectedFeedPostId,
            feedRole: context.feedPreviewRole,
            feedAudience: context.feedAudienceMode,
          })
        : undefined,
      selected: linkedChapter?.chapterId === context.selectedChapterId,
    };
  });
}

function getRecommendedStaffMove(
  status: "active" | "planned" | "template",
): string {
  switch (status) {
    case "active":
      return "Protect momentum, follow proof quality, and keep the support loop tight.";
    case "planned":
      return "Clarify owners and next events before asking the chapter to do more.";
    case "template":
      return "Use this as a staff playbook, not as a blank page for custom process.";
  }
}

function getProofReviewItems(routeBase: "/staff" | "/coach"): StaffProofReviewItem[] {
  return staffProofQueueSeeds.map((item) => ({
    id: item.id,
    chapterLabel: item.chapterLabel,
    contributorLabel: item.contributorLabel,
    timeLabel: item.timeLabel,
    sourceLabel: item.sourceLabel,
    proofTypeLabel: staffProofTypeLabels[item.proofTypeKey],
    proofTypeKey: item.proofTypeKey,
    qualityScore: item.qualityScore,
    durationLabel: item.durationLabel,
    visibilityLabel: item.visibilityLabel,
    reviewStatus: item.reviewStatus,
    consentStatusLabel: item.consentStatusLabel,
    hesitationAddressed: item.hesitationAddressed,
    summary: item.summary,
    recommendedUse: item.recommendedUse,
    engagementLabel: item.engagementLabel,
    engagementStatsLabel: item.engagementStatsLabel,
    availableApprovalTiers: item.availableApprovalTiers,
    reviewHref: getHref({
      routeBase,
      view: "proof_ugc",
      proof: item.id,
    }),
  }));
}

function getFilteredProofReviewItems(
  items: StaffProofReviewItem[],
  filters: {
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
  },
): StaffProofReviewItem[] {
  return items.filter((item) => {
    if (filters.proofQueueFilter !== "all" && item.reviewStatus !== filters.proofQueueFilter) {
      return false;
    }

    if (filters.proofTypeFilter !== "all" && item.proofTypeKey !== filters.proofTypeFilter) {
      return false;
    }

    return true;
  });
}

function getSelectedProofId(
  items: StaffProofReviewItem[],
  requestedProofId?: string,
): string | null {
  if (requestedProofId && items.some((item) => item.id === requestedProofId)) {
    return requestedProofId;
  }

  return null;
}

function getSelectedBestPracticeId(
  cards: StaffBestPracticeCard[],
  requestedBestPracticeId?: string,
): string | null {
  if (requestedBestPracticeId && cards.some((card) => card.id === requestedBestPracticeId)) {
    return requestedBestPracticeId;
  }

  return null;
}

function getSelectedProofReviewPanel(
  items: StaffProofReviewItem[],
  selectedProofId: string | null,
  context: {
    routeBase: "/staff" | "/coach";
    selectedView: StaffCommandCenterView;
    selectedCampaignSlug: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
  },
): StaffProofReviewPanel | null {
  const item = items.find((candidate) => candidate.id === selectedProofId);

  if (!item) {
    return null;
  }

  const bestPracticeContext = getBestPracticeContextForProofItem(item.chapterLabel);

  return {
    itemId: item.id,
    title: `${item.chapterLabel} · ${item.contributorLabel}`,
    subtitle: item.sourceLabel,
    consentLabel: item.consentStatusLabel,
    consentSummary: getConsentSummary(item),
    recommendedUse: item.recommendedUse,
    approvalOptions: (
      [
        "chapter_only",
        "selected",
        "all_chapters",
        "global_public",
      ] as StaffProofApprovalTier[]
    ).map((tier) => ({
      key: tier,
      label: approvalTierToLabel(tier),
      href: getHref({
        routeBase: context.routeBase,
        view: context.selectedView,
        campaign: context.selectedCampaignSlug,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        proof: item.id,
      }),
      enabled: item.availableApprovalTiers.includes(tier),
      statusLabel: approvalTierStatusLabel(item, tier),
      reason: approvalTierReason(item, tier),
      helper: approvalTierHelper(tier),
    })),
    requestChangesHref: getHref({
      routeBase: context.routeBase,
      view: context.selectedView,
      campaign: context.selectedCampaignSlug,
      risk: context.riskFilter,
      country: context.countryFilter,
      coach: context.coachFilter,
      portfolioCampaign: context.portfolioCampaignFilter,
      query: context.searchQuery,
      proofQueue: context.proofQueueFilter,
      proofType: context.proofTypeFilter,
      proof: item.id,
    }),
    rejectHref: getHref({
      routeBase: context.routeBase,
      view: context.selectedView,
      campaign: context.selectedCampaignSlug,
      risk: context.riskFilter,
      country: context.countryFilter,
      coach: context.coachFilter,
      portfolioCampaign: context.portfolioCampaignFilter,
      query: context.searchQuery,
      proofQueue: context.proofQueueFilter,
      proofType: context.proofTypeFilter,
      proof: item.id,
    }),
    bestPracticeHref: getHref({
      routeBase: context.routeBase,
      view: "best_practices",
      campaign: context.selectedCampaignSlug,
      risk: context.riskFilter,
      country: context.countryFilter,
      coach: context.coachFilter,
      portfolioCampaign: context.portfolioCampaignFilter,
      query: context.searchQuery,
      source: "proof_review",
      proofQueue: context.proofQueueFilter,
      proofType: context.proofTypeFilter,
      proof: item.id,
      practiceCountry: bestPracticeContext.practiceCountry,
      practiceCampaign: bestPracticeContext.practiceCampaign,
    }),
    notePlaceholder: "Add coach note or caption context...",
  };
}

function getBestPracticeContextForProofItem(
  chapterLabel: string,
): {
  practiceCountry: StaffBestPracticeCountryFilter;
  practiceCampaign: StaffBestPracticeCampaignFilter;
} {
  const chapter = staffPortfolioSeed.find((row) => row.chapterName === chapterLabel);

  if (!chapter) {
    return {
      practiceCountry: "all",
      practiceCampaign: "all",
    };
  }

  return {
    practiceCountry: bestPracticeCountryToFilterKey(chapter.country),
    practiceCampaign: bestPracticeCampaignToFilterKey(chapter.campaignName),
  };
}

function getConsentSummary(item: StaffProofReviewItem): string {
  switch (item.consentStatusLabel) {
    case "Public":
      return "May be used publicly and across all chapters.";
    case "Selected chapters only":
      return "May be shared with selected chapters, but not globally yet.";
    case "Chapter only":
      return "Keep this inside the chapter unless a broader approval path is explicitly reviewed.";
    case "Consent pending":
      return "Do not move past chapter-only review until the consent form is complete.";
    case "No consent":
      return "Do not share or reuse this content. Recollect it with clear consent if the story matters.";
    default:
      return "Confirm the visibility posture before this content becomes reusable proof.";
  }
}

function approvalTierToLabel(tier: StaffProofApprovalTier): string {
  switch (tier) {
    case "chapter_only":
      return "This chapter only";
    case "selected":
      return "Selected chapters";
    case "all_chapters":
      return "All chapters";
    case "global_public":
      return "Global / Public";
  }
}

function approvalTierHelper(tier: StaffProofApprovalTier): string {
  switch (tier) {
    case "chapter_only":
      return "Keep the story inside the originating chapter.";
    case "selected":
      return "Share it with a narrow set of chapters that need this pattern.";
    case "all_chapters":
      return "Make it visible across the internal myMEDLIFE chapter network.";
    case "global_public":
      return "Use it for broader public-facing storytelling if consent supports it.";
  }
}

function approvalTierStatusLabel(
  item: StaffProofReviewItem,
  tier: StaffProofApprovalTier,
): string {
  return item.availableApprovalTiers.includes(tier) ? "Allowed now" : "Blocked right now";
}

function approvalTierReason(
  item: StaffProofReviewItem,
  tier: StaffProofApprovalTier,
): string {
  const enabled = item.availableApprovalTiers.includes(tier);

  switch (item.consentStatusLabel) {
    case "Public":
      if (!enabled) {
        return "This lane should be available once the approval matrix is corrected.";
      }

      switch (tier) {
        case "chapter_only":
          return "Public consent still allows the team to keep distribution local when context matters.";
        case "selected":
          return "Public consent covers narrow chapter-to-chapter sharing for coaching or onboarding.";
        case "all_chapters":
          return "Public consent covers internal sharing across the full chapter network.";
        case "global_public":
          return "Public consent covers broader storytelling outside the internal chapter network.";
      }
    case "Selected chapters only":
      if (enabled) {
        switch (tier) {
          case "chapter_only":
            return "This stays closest to the original chapter context while still respecting the current consent posture.";
          case "selected":
            return "Selected-chapter consent directly covers narrow onboarding and coaching use.";
          case "global_public":
            break;
        }
      }

      switch (tier) {
        case "all_chapters":
          return "Network-wide sharing needs broader consent than selected-chapter reuse.";
        case "global_public":
          return "Public storytelling needs broader consent than selected-chapter reuse.";
        default:
          return "This story has not been cleared beyond selected-chapter reuse.";
      }
    case "Chapter only":
      if (enabled) {
        if (tier === "chapter_only") {
          return "This stays fully inside the originating chapter, which matches the current consent posture.";
        }

        return "This narrow lane is allowed only for internal review and coaching while the story stays non-public.";
      }

      return "This story has not been cleared for wider chapter distribution or public reuse.";
    case "Consent pending":
      if (enabled) {
        return "Only internal review should continue while the consent form is still pending.";
      }

      return "Wait for the consent form before approving anything beyond internal holding review.";
    case "No consent":
      return "No consent was collected, so this story cannot be approved for reuse in any lane.";
    default:
      return enabled
        ? "This lane matches the current review posture."
        : "Confirm the consent posture before opening this lane.";
  }
}

function getFeedDrafts(items: StaffProofReviewItem[]): StaffFeedDraft[] {
  return items.slice(0, 4).map((item, index) => ({
    id: `${item.id}-feed`,
    title: `${item.sourceLabel} post draft`,
    sourceLabel: item.sourceLabel,
    chapterLabel: item.chapterLabel,
    visibilityLabel: item.visibilityLabel,
    formatLabel: index % 2 === 0 ? "Reel / bridge video" : "Carousel / recap",
    curationReason: `${item.proofTypeLabel} that addresses ${item.hesitationAddressed.toLowerCase()}.`,
    captionPreview:
      index % 2 === 0
        ? `${item.summary} Show students what action looks like and point them to the next step.`
        : `${item.summary} Pull the lesson forward so another chapter can copy it this week.`,
    callToAction:
      "Point students to the next action, event, or proof-friendly story rather than generic awareness copy.",
    publishStatusLabel:
      item.consentStatusLabel === "Public" ||
      item.consentStatusLabel === "Selected chapters only"
        ? "Ready after HQ review"
        : "Hold until consent is clear",
    sourceHref: item.reviewHref,
  }));
}

function getSelectedFeedDraftId(
  drafts: StaffFeedDraft[],
  requestedDraftId?: string,
): string | null {
  if (requestedDraftId && drafts.some((draft) => draft.id === requestedDraftId)) {
    return requestedDraftId;
  }

  return drafts[0]?.id ?? null;
}

function getFeedStudioWorkspace(
  drafts: StaffFeedDraft[],
  proofItems: StaffProofReviewItem[],
  selectedBestPractice: StaffBestPracticeCard | null,
  selectedDraftId: string | null,
  context: {
    routeBase: "/staff" | "/coach";
    source?: string;
    selectedView: StaffCommandCenterView;
    selectedCampaignSlug: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
    selectedFeedPostId: string | null;
    feedPreviewRole: StaffFeedPreviewRole;
    feedAudienceMode: StaffFeedAudienceMode;
  },
): StaffFeedStudioWorkspace {
  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId) ?? null;
  const selectedProofItem =
    proofItems.find((item) => item.id === context.selectedProofId) ?? null;
  const chapterCountByAudience: Record<StaffFeedAudienceMode, string> = {
    one_chapter: "1 chapter",
    selected_chapters: "5 chapters",
    country_region: "8 chapters",
    campaign_chapters: "10 chapters",
    all_chapters: "20 chapters",
  };
  const reachByAudience: Record<StaffFeedAudienceMode, string> = {
    one_chapter: "~35 students",
    selected_chapters: "~175 students",
    country_region: "~260 students",
    campaign_chapters: "~350 students",
    all_chapters: "~700 students",
  };

  return {
    selectedDraftId,
    selectedDraft,
    sourceContext: getFeedStudioSourceContext(selectedProofItem, selectedBestPractice, context),
    previewRole: context.feedPreviewRole,
    audienceMode: context.feedAudienceMode,
    audienceOptions: (
      [
        "one_chapter",
        "selected_chapters",
        "country_region",
        "campaign_chapters",
        "all_chapters",
      ] as StaffFeedAudienceMode[]
    ).map((key) => ({
      key,
      label: feedAudienceModeToLabel(key),
      estimatedReachLabel: `${chapterCountByAudience[key]} · ${reachByAudience[key]}`,
      href: getHref({
        routeBase: context.routeBase,
        view: context.selectedView,
        campaign: context.selectedCampaignSlug,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        proof: context.selectedProofId,
        feedDraft: selectedDraftId,
        feedPost: context.selectedFeedPostId,
        feedRole: context.feedPreviewRole,
        feedAudience: key,
      }),
    })),
    previewRoleOptions: (["member", "leader"] as StaffFeedPreviewRole[]).map((role) => ({
      key: role,
      label: role === "member" ? "Member" : "Leader",
      href: getHref({
        routeBase: context.routeBase,
        view: context.selectedView,
        campaign: context.selectedCampaignSlug,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        proof: context.selectedProofId,
        feedDraft: selectedDraftId,
        feedPost: context.selectedFeedPostId,
        feedRole: role,
        feedAudience: context.feedAudienceMode,
      }),
    })),
    campaignTagLabel: campaignSlugToLabel(context.selectedCampaignSlug),
    engagementGoalLabel: "inspire action",
    estimatedReachLabel: reachByAudience[context.feedAudienceMode],
    targetChapterCountLabel: chapterCountByAudience[context.feedAudienceMode],
    audienceRoleLabels: [
      "General Members",
      "Chapter Leaders",
      "Action Committee Chairs",
      "Coaches",
    ],
    audienceChapterStatusLabels: [
      "All chapters",
      "At-risk chapters",
      "High-performing",
      "New chapters",
    ],
  };
}

function getFeedStudioSourceContext(
  selectedProofItem: StaffProofReviewItem | null,
  selectedBestPractice: StaffBestPracticeCard | null,
  context: {
    routeBase: "/staff" | "/coach";
    source?: string;
    selectedCampaignSlug: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
  },
) {
  if (selectedBestPractice) {
    return {
      eyebrow: "Best practice source",
      title: "Opened from the best-practice library",
      summary: `${selectedBestPractice.title} from ${selectedBestPractice.chapterLabel} is the current source for this sharing move. The pattern worked because ${selectedBestPractice.whyItWorks.toLowerCase()} Next move: ${selectedBestPractice.nextMove.toLowerCase()}`,
      actionLabel: "Return to best practices",
      actionHref: getHref({
        routeBase: context.routeBase,
        view: "best_practices",
        campaign: context.selectedCampaignSlug,
        risk: context.riskFilter,
        country: context.countryFilter,
      coach: context.coachFilter,
      portfolioCampaign: context.portfolioCampaignFilter,
      query: context.searchQuery,
      bestPractice: selectedBestPractice.id,
      practiceCountry: bestPracticeCountryToFilterKey(selectedBestPractice.countryLabel),
      practiceCampaign: bestPracticeCampaignToFilterKey(selectedBestPractice.campaignLabel),
      source: context.source,
    }),
  };
  }

  if (!selectedProofItem || !context.selectedProofId) {
    return null;
  }

  return {
    eyebrow: "Proof review source",
    title: "Opened from a reviewed content item",
    summary: `${selectedProofItem.chapterLabel} · ${selectedProofItem.contributorLabel} is the current source for this curation pass. Consent is ${selectedProofItem.consentStatusLabel.toLowerCase()}, and the current recommendation is to ${selectedProofItem.recommendedUse.toLowerCase()}.`,
    actionLabel: "Return to proof queue",
    actionHref: getHref({
      routeBase: context.routeBase,
      view: "proof_ugc",
      campaign: context.selectedCampaignSlug,
      risk: context.riskFilter,
      country: context.countryFilter,
      coach: context.coachFilter,
      portfolioCampaign: context.portfolioCampaignFilter,
      query: context.searchQuery,
      proofQueue: context.proofQueueFilter,
      proofType: context.proofTypeFilter,
      proof: context.selectedProofId,
    }),
  };
}

function getSelectedFeedAnalyticsPostId(
  posts: StaffFeedAnalyticsPost[],
  requestedPostId?: string,
): string | null {
  if (requestedPostId && posts.some((post) => post.id === requestedPostId)) {
    return requestedPostId;
  }

  return null;
}

function getSelectedHubSpotChapterId(
  requestedChapterId: string | undefined,
): string | null {
  if (
    requestedChapterId &&
    staffHubSpotChapterSeed.some((chapter) => chapter.id === requestedChapterId)
  ) {
    return requestedChapterId;
  }

  return staffHubSpotChapterSeed[0]?.id ?? null;
}

function getHubSpotWorkspace(
  requestedChapterId: string | undefined,
  context: {
    routeBase: "/staff" | "/coach";
    selectedView: StaffCommandCenterView;
    selectedCampaignSlug: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    selectedProofId: string | null;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedFeedDraftId: string | null;
    selectedFeedPostId: string | null;
    feedPreviewRole: StaffFeedPreviewRole;
    feedAudienceMode: StaffFeedAudienceMode;
    selectedChapterId: string | null;
    selectedDecision: StaffDecisionPreview | null | undefined;
    chapterRows: StaffChapterPortfolioRow[];
  },
): StaffHubSpotWorkspace {
  const selectedChapterId = getSelectedHubSpotChapterId(requestedChapterId);
  const selectedChapter =
    staffHubSpotChapterSeed.find((chapter) => chapter.id === selectedChapterId) ??
    staffHubSpotChapterSeed[0];
  const sourceChapter =
    context.chapterRows.find((row) => row.chapterId === context.selectedChapterId) ?? null;

  return {
    selectedChapterId,
    selectedChapterLabel: selectedChapter?.chapterLabel ?? "HubSpot chapter review",
    timestampLabel: "Jun 17, 2026 · 14:41 UTC",
    warningLabel: selectedChapter?.warningLabel ?? null,
    sourceContext: sourceChapter
      ? {
          eyebrow: "Portfolio source",
          title: "Opened from the chapter portfolio",
          summary: `${sourceChapter.chapterName} is still the active portfolio chapter in this review path. Keep CRM context attached to the same chapter risk, follow-up, and decision posture you saw in the drawer.`,
          actionLabel: "Return to chapter portfolio",
          actionHref: getHref({
            routeBase: context.routeBase,
            view: "chapters",
            campaign: context.selectedCampaignSlug,
            risk: context.riskFilter,
            country: context.countryFilter,
            coach: context.coachFilter,
            portfolioCampaign: context.portfolioCampaignFilter,
            query: context.searchQuery,
            chapterId: sourceChapter.chapterId,
            decision: context.selectedDecision ?? undefined,
          }),
        }
      : null,
    chapterOptions: staffHubSpotChapterSeed.map((chapter) => ({
      id: chapter.id,
      chapterLabel: chapter.chapterLabel,
      countryLabel: chapter.countryLabel,
      href: getHref({
        routeBase: context.routeBase,
        view: context.selectedView,
        campaign: context.selectedCampaignSlug,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        proof: context.selectedProofId,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        feedDraft: context.selectedFeedDraftId,
        feedPost: context.selectedFeedPostId,
        hubspotChapter: chapter.id,
        feedRole: context.feedPreviewRole,
        feedAudience: context.feedAudienceMode,
      }),
    })),
    crmProfileMetrics: selectedChapter?.crmProfileMetrics ?? [],
    matchedActivityMetrics: selectedChapter?.matchedActivityMetrics ?? [],
    funnelSteps: selectedChapter?.funnelSteps ?? [],
  };
}

function getFeedAnalyticsWorkspace(
  requestedPostId: string | undefined,
  drafts: StaffFeedDraft[],
  context: {
    routeBase: "/staff" | "/coach";
    source?: string;
    selectedView: StaffCommandCenterView;
    selectedCampaignSlug: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
    selectedFeedDraftId: string | null;
    feedPreviewRole: StaffFeedPreviewRole;
    feedAudienceMode: StaffFeedAudienceMode;
    chapterRows: StaffChapterPortfolioRow[];
  },
): StaffFeedAnalyticsWorkspace {
  const posts = staffFeedAnalyticsSeed.map((post) => {
    const selectHref = getHref({
      routeBase: context.routeBase,
      view: context.selectedView,
      campaign: context.selectedCampaignSlug,
      risk: context.riskFilter,
      country: context.countryFilter,
      coach: context.coachFilter,
      portfolioCampaign: context.portfolioCampaignFilter,
      query: context.searchQuery,
      proofQueue: context.proofQueueFilter,
      proofType: context.proofTypeFilter,
      proof: context.selectedProofId,
      feedDraft: context.selectedFeedDraftId,
      feedPost: post.id,
      feedRole: context.feedPreviewRole,
      feedAudience: context.feedAudienceMode,
    });

    return {
      ...post,
      selectHref,
      topEngagement: post.topEngagement.map((row) =>
        getFeedAnalyticsChapterBreakdownRow(row, {
          chapterRows: context.chapterRows,
          routeBase: context.routeBase,
          selectedCampaignSlug: context.selectedCampaignSlug,
          riskFilter: context.riskFilter,
          countryFilter: context.countryFilter,
          coachFilter: context.coachFilter,
          portfolioCampaignFilter: context.portfolioCampaignFilter,
          searchQuery: context.searchQuery,
          proofQueueFilter: context.proofQueueFilter,
          proofTypeFilter: context.proofTypeFilter,
          selectedProofId: context.selectedProofId,
          selectedFeedDraftId: context.selectedFeedDraftId,
          feedPreviewRole: context.feedPreviewRole,
          feedAudienceMode: context.feedAudienceMode,
          feedPostId: post.id,
          actionLabel: "Open chapter",
        }),
      ),
      lowEngagement: post.lowEngagement.map((row) =>
        getFeedAnalyticsChapterBreakdownRow(row, {
          chapterRows: context.chapterRows,
          routeBase: context.routeBase,
          selectedCampaignSlug: context.selectedCampaignSlug,
          riskFilter: context.riskFilter,
          countryFilter: context.countryFilter,
          coachFilter: context.coachFilter,
          portfolioCampaignFilter: context.portfolioCampaignFilter,
          searchQuery: context.searchQuery,
          proofQueueFilter: context.proofQueueFilter,
          proofTypeFilter: context.proofTypeFilter,
          selectedProofId: context.selectedProofId,
          selectedFeedDraftId: context.selectedFeedDraftId,
          feedPreviewRole: context.feedPreviewRole,
          feedAudienceMode: context.feedAudienceMode,
          feedPostId: post.id,
          actionLabel: "Open member review",
          decision: "intervene",
        }),
      ),
    };
  });
  const selectedPostId = getSelectedFeedAnalyticsPostId(posts, requestedPostId);
  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;
  const selectedDraft = selectedPost
    ? drafts.find((draft) => draft.id === context.selectedFeedDraftId) ?? null
    : null;

  return {
    summaryCards: [
      { label: "Total Views", value: "12,630" },
      { label: "Total Likes", value: "1,220" },
      { label: "Comments", value: "213" },
      { label: "Actions After View", value: "262" },
      { label: "Evidence After", value: "115" },
      { label: "RSVPs After", value: "308" },
    ],
    posts,
    selectedPostId,
    selectedPost,
    sourceContext: selectedDraft
      ? {
          eyebrow: "Feed Studio source",
          title: "Opened from a curation draft",
          summary: `${selectedDraft.title} from ${selectedDraft.chapterLabel} is the current draft context behind this analytics pass. Use the performance view to judge whether the share framing, CTA, and audience choice are doing real work.`,
          actionLabel: "Return to Feed Studio",
          actionHref: getHref({
            routeBase: context.routeBase,
            view: "feed_studio",
            campaign: context.selectedCampaignSlug,
            risk: context.riskFilter,
            country: context.countryFilter,
            coach: context.coachFilter,
            portfolioCampaign: context.portfolioCampaignFilter,
            query: context.searchQuery,
            proofQueue: context.proofQueueFilter,
            proofType: context.proofTypeFilter,
            proof: context.selectedProofId,
            feedDraft: selectedDraft.id,
            feedPost: selectedPostId,
            feedRole: context.feedPreviewRole,
            feedAudience: context.feedAudienceMode,
          }),
        }
      : null,
    timestampLabel: "Jun 17, 2026 · 14:41 UTC",
  };
}

function getFeedAnalyticsChapterBreakdownRow(
  row: StaffFeedAnalyticsChapterBreakdown,
  context: {
    chapterRows: StaffChapterPortfolioRow[];
    routeBase: "/staff" | "/coach";
    selectedCampaignSlug: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedProofId: string | null;
    selectedFeedDraftId: string | null;
    feedPreviewRole: StaffFeedPreviewRole;
    feedAudienceMode: StaffFeedAudienceMode;
    feedPostId: string;
    actionLabel: string;
    decision?: StaffDecisionPreview;
  },
): StaffFeedAnalyticsChapterBreakdown {
  const chapterId =
    context.chapterRows.find((chapter) => chapter.chapterName === row.chapterLabel)?.chapterId ??
    null;

  return {
    ...row,
    href: chapterId
      ? getHref({
          routeBase: context.routeBase,
          view: "chapters",
          campaign: context.selectedCampaignSlug,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: context.selectedProofId,
          chapterId,
          decision: context.decision,
          feedDraft: context.selectedFeedDraftId,
          feedPost: context.feedPostId,
          feedRole: context.feedPreviewRole,
          feedAudience: context.feedAudienceMode,
        })
      : null,
    actionLabel: chapterId ? context.actionLabel : null,
  };
}

function getFeedInsights(
  recognitionSummary: ReturnType<typeof getMemberRecognitionSummary>,
  proofReviewItems: StaffProofReviewItem[],
  data: ReadOnlyAppData,
): StaffCommandCenterMetric[] {
  const topRecognition = recognitionSummary.selectedMember;
  const consentReady = proofReviewItems.filter(
    (item) =>
      item.consentStatusLabel === "Public" ||
      item.consentStatusLabel === "Selected chapters only",
  ).length;

  return [
    {
      label: "Bridge story candidates",
      value: `${proofReviewItems.length}`,
      note: "Stories in the queue that are strongest for wider chapter reuse.",
    },
    {
      label: "Consent ready",
      value: `${consentReady}`,
      note: "Proof items that look closest to safe reuse.",
    },
    {
      label: "Top student signal",
      value: topRecognition ? topRecognition.displayName : "None yet",
      note: topRecognition
        ? `${topRecognition.points} points and ${topRecognition.completedActions} completed actions.`
        : "No student signal is highlighted yet.",
    },
    {
      label: "Events linked",
      value: `${data.kpiSummary.eventsLinked}`,
      note: "Mock Luma-linked events that can support follow-up and content.",
    },
  ];
}

function getHubSpotSignals(
  chapterRows: StaffChapterPortfolioRow[],
  integrationEvents: IntegrationEvent[],
  outboxItems: OutboxItem[],
): StaffHubSpotSignal[] {
  const hubspotEvents = integrationEvents.filter(
    (event) => event.destination === "HubSpot",
  );
  const hubspotOutbox = outboxItems.filter((item) => item.destination === "HubSpot");

  const baseSignals = hubspotEvents.map((event) => ({
    title: event.title,
    statusLabel: event.status,
    chapterLabel: "UCLA MEDLIFE",
    detail: event.detail,
    nextAction:
      "Keep CRM sends mocked and use this payload to verify fields, owner mapping, and timing.",
  }));

  const riskSignals = chapterRows
    .filter((row) => row.risk === "high" || row.decision === "hold")
    .slice(0, 2)
    .map((row) => ({
      title: `${row.chapterName} follow-up posture`,
      statusLabel: row.decision,
      chapterLabel: row.chapterName,
      detail:
        `${row.openFollowUps} open follow-up(s) and ${row.proofPending} proof item(s) suggest the chapter needs tighter staff support before any CRM handoff would matter.`,
      nextAction: row.nextStep,
    }));

  return [...baseSignals, ...riskSignals].concat(
    hubspotOutbox.map((item) => ({
      title: "HubSpot outbox packet",
      statusLabel: item.status,
      chapterLabel: "Shared HQ queue",
      detail: item.payloadSummary,
      nextAction:
        "Confirm the app-generated payload shape before anyone asks n8n or HubSpot to do real work.",
    })),
  );
}

function getBestPracticeCards(
  countryFilter: StaffBestPracticeCountryFilter,
  campaignFilter: StaffBestPracticeCampaignFilter,
  context: {
    routeBase: "/staff" | "/coach";
    source?: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    selectedCampaignSlug: string;
    selectedProofId: string | null;
    selectedFeedDraftId: string | null;
    selectedFeedPostId: string | null;
    selectedHubSpotChapterId: string | null;
    selectedBestPracticeId: string | null;
  },
): StaffBestPracticeCard[] {
  const preservedSource =
    context.source === "portfolio_overview" || context.source === "proof_review"
      ? context.source
      : undefined;
  const getBestPracticeRouteHref = (
    view: StaffCommandCenterView,
    extra: {
      bestPractice?: string;
      hubspotChapter?: string;
    } = {},
  ) =>
    getHref({
      routeBase: context.routeBase,
      view,
      campaign: context.selectedCampaignSlug,
      risk: context.riskFilter,
      country: context.countryFilter,
      coach: context.coachFilter,
      portfolioCampaign: context.portfolioCampaignFilter,
      query: context.searchQuery,
      proof: context.selectedProofId,
      feedDraft: context.selectedFeedDraftId,
      feedPost: context.selectedFeedPostId,
      hubspotChapter: extra.hubspotChapter ?? context.selectedHubSpotChapterId,
      bestPractice: extra.bestPractice,
      source: preservedSource,
    });

  const cards: StaffBestPracticeCard[] = [
    {
      id: "practice-qr-capture",
      categoryLabel: "Event Strategy",
      title: "QR Code Lead Capture at Multi-Event Weekend",
      chapterLabel: "Stanford University",
      countryLabel: "USA",
      campaignLabel: "Rush Month",
      engagementScore: 97,
      whyItWorked:
        "Chapter deployed QR codes at 5 events simultaneously with real-time HubSpot sync, capturing 91 qualified leads in 48 hours.",
      kpiResult: "+91 leads, 74% RSVP rate",
      recommendedForLabels: ["Yale University", "Johns Hopkins", "PUCP Lima"],
      whyItWorks: "Scales a specific recruiting pattern across chapters with strong ops discipline.",
      nextMove: "Share the exact lead-capture script and event setup with coach-owned chapters.",
      href: "/campaigns/rush-month",
      shareHref: getBestPracticeRouteHref("feed_studio", {
        bestPractice: "practice-qr-capture",
      }),
      coachHref: getBestPracticeRouteHref("hubspot", {
        hubspotChapter: "hubspot-yale",
      }),
    },
    {
      id: "practice-morning-motivation",
      categoryLabel: "Coach Communication",
      title: "Morning Motivation Text Sequence for Members",
      chapterLabel: "UC Berkeley",
      countryLabel: "USA",
      campaignLabel: "Chapter Engagement",
      engagementScore: 92,
      whyItWorked:
        "Coach co-created a 5-day WhatsApp check-in series that boosted assignment completion from 62% to 89% in 2 weeks.",
      kpiResult: "+27% assignment completion",
      recommendedForLabels: ["UFMG Belo Horizonte", "UNAN Managua", "University of Ghana"],
      whyItWorks: "Turns coach encouragement into a repeatable operating rhythm for members.",
      nextMove: "Package the message cadence and timing notes for coach adoption.",
      href: "/campaigns/chapter-engagement",
      shareHref: getBestPracticeRouteHref("feed_studio", {
        bestPractice: "practice-morning-motivation",
      }),
      coachHref: getBestPracticeRouteHref("hubspot", {
        hubspotChapter: "hubspot-uc-berkeley",
      }),
    },
    {
      id: "practice-why-i-travel",
      categoryLabel: "Content Strategy",
      title: "'Why I Travel' Bridge Video Campaign",
      chapterLabel: "UNAM Mexico City",
      countryLabel: "Mexico",
      campaignLabel: "Moving Mountains",
      engagementScore: 88,
      whyItWorked:
        "Leaders filmed 3-minute personal story videos and shared them on chapter social media before Rush, driving 40% more RSVPs than previous year.",
      kpiResult: "+40% RSVPs vs. baseline",
      recommendedForLabels: ["UNMSM Lima", "Universidad de Chile", "UNAH Tegucigalpa"],
      whyItWorks: "Connects mission storytelling to a specific RSVP lift, not just vague awareness.",
      nextMove: "Reuse the story prompt and CTA framing in the next bridge-content push.",
      href: "/campaigns/moving-mountains",
      shareHref: getBestPracticeRouteHref("feed_studio", {
        bestPractice: "practice-why-i-travel",
      }),
      coachHref: getBestPracticeRouteHref("hubspot", {
        hubspotChapter: "hubspot-unmsm",
      }),
    },
    {
      id: "practice-faculty-partnership",
      categoryLabel: "Outreach Strategy",
      title: "Faculty Partnership for Tabling Prime Spots",
      chapterLabel: "University of Florida",
      countryLabel: "USA",
      campaignLabel: "Rush Month",
      engagementScore: 85,
      whyItWorked:
        "Chapter partnered with Health Sciences dean office to secure 3 high-traffic tabling locations, resulting in 104 leads captured.",
      kpiResult: "104 leads, best in region",
      recommendedForLabels: ["McGill University", "University of Toronto"],
      whyItWorks: "Shifts tabling from random outreach to higher-intent traffic with institutional help.",
      nextMove: "Share the outreach email and dean-meeting script with priority chapters.",
      href: "/campaigns/rush-month",
      shareHref: getBestPracticeRouteHref("feed_studio", {
        bestPractice: "practice-faculty-partnership",
      }),
      coachHref: getBestPracticeRouteHref("hubspot", {
        hubspotChapter: "hubspot-mcgill",
      }),
    },
    {
      id: "practice-peer-recruitment",
      categoryLabel: "Membership Growth",
      title: "Peer-to-Peer Recruitment Bonus Structure",
      chapterLabel: "USP São Paulo",
      countryLabel: "Brazil",
      campaignLabel: "Grow the Movement",
      engagementScore: 81,
      whyItWorked:
        "Members earned bonus points for recruiting classmates who attended events, creating a viral spread effect.",
      kpiResult: "+14 new members in one campaign",
      recommendedForLabels: ["UFMG Belo Horizonte", "UNMSM Lima", "University of Ghana"],
      whyItWorks: "Links recognition and growth without hiding the mechanism behind generic points language.",
      nextMove: "Translate the incentive structure into a coach-ready replication packet.",
      href: "/campaigns/grow-the-movement",
      shareHref: getBestPracticeRouteHref("feed_studio", {
        bestPractice: "practice-peer-recruitment",
      }),
      coachHref: getBestPracticeRouteHref("hubspot", {
        hubspotChapter: "hubspot-uc-berkeley",
      }),
    },
  ];

  return cards.filter((card) => {
    const campaignMatches =
      campaignFilter === "all" ||
      bestPracticeCampaignToFilterKey(card.campaignLabel) === campaignFilter;
    const countryMatches =
      countryFilter === "all" ||
      bestPracticeCountryToFilterKey(card.countryLabel) === countryFilter;

    return campaignMatches && countryMatches;
  });
}

function getAdminSignals(
  adminSummary: ReturnType<typeof getAdminControlCenterSummary>,
  outboxSummary: StaffOutboxSummary,
): StaffAdminSignal[] {
  return [
    {
      title: "Role coverage",
      status: "ready_readonly",
      metric: `${adminSummary.namedRoleCount}/${adminSummary.roleCoverage.length} named roles`,
      detail:
        "Local review personas exist for member, leader, coach, admin, DS admin, and super admin.",
    },
    {
      title: "System health",
      status: adminSummary.healthItems[0]?.status ?? "mock_only",
      metric: adminSummary.healthItems[0]?.label ?? "Read source",
      detail:
        adminSummary.healthItems[0]?.detail ??
        "System health remains read-only and environment-safe.",
    },
    {
      title: "Outbox posture",
      status: outboxSummary.disabled > 0 ? "blocked" : "mock_only",
      metric: `${outboxSummary.total} rows`,
      detail:
        "The app is generating integration-ready intent, but real sends remain disabled or mocked.",
    },
    {
      title: "Audit readiness",
      status: "mock_only",
      metric: "Preview only",
      detail:
        "Audit browsing exists as a launch-readiness surface even when table-backed writes are not yet approved.",
    },
  ];
}

function getAdminWorkspace(
  data: ReadOnlyAppData,
  adminSummary: ReturnType<typeof getAdminControlCenterSummary>,
  outboxSummary: StaffOutboxSummary,
): StaffAdminWorkspace {
  const fallbackIntegrationStatuses: StaffAdminIntegrationStatus[] = [
    {
      title: "HubSpot CRM",
      lastSyncLabel: "Last sync: 2 min ago",
      status: "live",
      note: null,
    },
    {
      title: "Luma Events",
      lastSyncLabel: "Last sync: 8 min ago",
      status: "live",
      note: null,
    },
    {
      title: "Data Hub / Warehouse",
      lastSyncLabel: "Last sync: 15 min ago",
      status: "live",
      note: null,
    },
    {
      title: "Power BI Reports",
      lastSyncLabel: "Last sync: 4h ago",
      status: "degraded",
      note: "Refresh token expiring soon",
    },
    {
      title: "n8n Automation",
      lastSyncLabel: "Last sync: 1 min ago",
      status: "live",
      note: null,
    },
    {
      title: "AI Summary Engine",
      lastSyncLabel: "Last sync: n/a",
      status: "mock",
      note: "Using mock data in staging",
    },
  ];
  const fallbackOutboxRows: StaffAdminOutboxRow[] = [
    {
      eventLabel: "contact.created",
      sourceLabel: "myMEDLIFE",
      destinationLabel: "HubSpot",
      status: "success",
      retries: 0,
      errorLabel: "\u2014",
      createdLabel: "Jun 17 14:21",
      processedLabel: "Jun 17 14:21",
    },
    {
      eventLabel: "rsvp.confirmed",
      sourceLabel: "Luma",
      destinationLabel: "myMEDLIFE",
      status: "success",
      retries: 0,
      errorLabel: "\u2014",
      createdLabel: "Jun 17 14:18",
      processedLabel: "Jun 17 14:19",
    },
    {
      eventLabel: "evidence.approved",
      sourceLabel: "myMEDLIFE",
      destinationLabel: "Data Hub",
      status: "failed",
      retries: 3,
      errorLabel: "503 Service Unavailable",
      createdLabel: "Jun 17 13:44",
      processedLabel: "\u2014",
    },
    {
      eventLabel: "hubspot.task.created",
      sourceLabel: "n8n",
      destinationLabel: "HubSpot",
      status: "pending",
      retries: 0,
      errorLabel: "\u2014",
      createdLabel: "Jun 17 13:30",
      processedLabel: "\u2014",
    },
    {
      eventLabel: "member.joined",
      sourceLabel: "myMEDLIFE",
      destinationLabel: "HubSpot",
      status: "success",
      retries: 0,
      errorLabel: "\u2014",
      createdLabel: "Jun 17 12:55",
      processedLabel: "Jun 17 12:55",
    },
    {
      eventLabel: "ai.summary.drafted",
      sourceLabel: "AI Engine",
      destinationLabel: "myMEDLIFE",
      status: "success",
      retries: 0,
      errorLabel: "\u2014",
      createdLabel: "Jun 17 12:00",
      processedLabel: "Jun 17 12:01",
    },
    {
      eventLabel: "chapter.data.sync",
      sourceLabel: "n8n",
      destinationLabel: "Power BI",
      status: "failed",
      retries: 2,
      errorLabel: "Token expired",
      createdLabel: "Jun 17 10:00",
      processedLabel: "\u2014",
    },
  ];
  const fallbackAuditRows: StaffAdminAuditRow[] = [
    {
      actorLabel: "maria.santos@medlife.org",
      roleLabel: "Coach",
      actionLabel: "Approved evidence",
      objectLabel: "PUCP Lima - Tabling Video",
      chapterLabel: "PUCP Lima",
      timestampLabel: "Jun 17 14:30",
    },
    {
      actorLabel: "james.okafor@medlife.org",
      roleLabel: "Coach",
      actionLabel: "Set decision: Intervene",
      objectLabel: "Yale University",
      chapterLabel: "Yale University",
      timestampLabel: "Jun 17 13:55",
    },
    {
      actorLabel: "admin@medlife.org",
      roleLabel: "Admin",
      actionLabel: "Shared post to 28 chapters",
      objectLabel: "Stanford QR Best Practice",
      chapterLabel: "Global",
      timestampLabel: "Jun 17 13:20",
    },
    {
      actorLabel: "aisha.kamara@medlife.org",
      roleLabel: "Coach",
      actionLabel: "Wrote coach note",
      objectLabel: "McGill University",
      chapterLabel: "McGill University",
      timestampLabel: "Jun 17 12:44",
    },
    {
      actorLabel: "system@n8n",
      roleLabel: "System",
      actionLabel: "Triggered automation",
      objectLabel: "Rush Month - follow-up sequence",
      chapterLabel: "All",
      timestampLabel: "Jun 17 12:00",
    },
  ];
  const outboxRows = data.automationOutboxRows.length > 0
    ? data.automationOutboxRows
      .slice(0, 7)
      .map((row) => ({
        eventLabel: row.event_type,
        sourceLabel: getAdminOutboxSourceLabel(row),
        destinationLabel: getAdminOutboxDestinationLabel(row.destination),
        status: getAdminOutboxStatus(row),
        retries: row.attempt_count,
        errorLabel: row.last_error ?? "\u2014",
        createdLabel: formatAdminTimestamp(row.created_at),
        processedLabel: row.sent_at ? formatAdminTimestamp(row.sent_at) : "\u2014",
      }))
    : fallbackOutboxRows;
  const auditRows = data.auditLogs.length > 0
    ? data.auditLogs.slice(0, 5).map((row) => ({
      actorLabel: getAdminAuditActorLabel(row.actor_user_id, data),
      roleLabel: getAdminAuditRoleLabel(row.action),
      actionLabel: humanizeAdminAction(row.action),
      objectLabel: row.target_id ? `${humanizeTargetTable(row.target_table)} ${row.target_id.slice(0, 8)}` : humanizeTargetTable(row.target_table),
      chapterLabel: getAdminAuditChapterLabel(row.chapter_id, data),
      timestampLabel: formatAdminTimestamp(row.created_at),
    }))
    : fallbackAuditRows;
  const handoffSummaryCards: StaffAdminSummaryCard[] = [
    {
      label: "Total Chapters",
      value: `${adminSummary.chapterCount}`,
      note: "Current chapter scope visible to the admin handoff.",
    },
    {
      label: "Active Users",
      value: `${adminSummary.userCount}`,
      note: "Named review personas available in this safe preview.",
    },
    {
      label: "Campaigns Running",
      value: `${data.campaign.status === "active" ? 1 : 0}`,
      note: "Read-only live campaign context visible from the member jump.",
    },
    {
      label: "Automation Jobs",
      value: `${outboxSummary.total}`,
      note: "Queued jobs stay reviewable while external sends remain off.",
    },
  ];
  const handoffConsoleCards: StaffAdminBackendLane[] = [
    {
      eyebrow: "Access",
      title: "User & Role Management",
      summary:
        "Review role coverage, landing routes, and safe actor switching before approving broader access changes.",
      href: "/admin/permissions",
    },
    {
      eyebrow: "Operations",
      title: "Chapter Management",
      summary:
        "Inspect chapter inventory, ownership, and launch posture without opening write paths.",
      href: "/admin/master-data",
    },
    {
      eyebrow: "Campaigns",
      title: "Campaign Templates",
      summary:
        "Open reusable campaign shells, SOP versions, and mock-safe workflow structure for current chapter operations.",
      href: "/admin/sop-library",
    },
    {
      eyebrow: "Governance",
      title: "Audit Logs",
      summary:
        "Trace who reviewed what, when it changed, and which evidence remains visible for launch readiness.",
      href: "/admin/audit-log",
    },
    {
      eyebrow: "Automation",
      title: "Automation Outbox (n8n)",
      summary:
        "Check replay posture, failed jobs, and integration safety without enabling live sends.",
      href: "/admin/integration-outbox",
    },
    {
      eyebrow: "Review",
      title: "Stakeholder Review Path",
      summary:
        "Walk through the no-code reviewer packet before anyone asks for a live change.",
      href: "/admin/review-path",
    },
    {
      eyebrow: "Decision",
      title: "Nick Review Packet",
      summary:
        "Hold the final launch packet in one place so the pilot decision stays visible.",
      href: "/admin/nick-review",
    },
    {
      eyebrow: "Ready",
      title: "Release Readiness",
      summary:
        "Keep the release-readiness summary in view before any live approval moves forward.",
      href: "/admin/release-readiness",
    },
    {
      eyebrow: "Gate",
      title: "Production Launch Gate",
      summary:
        "Show the hosted launch gate, rollback owner, and live pilot posture together.",
      href: "/admin/launch-gate",
    },
    {
      eyebrow: "Ops",
      title: "Production Operations",
      summary:
        "Keep incident, rollback, and support ownership visible for the live MVP posture.",
      href: "/admin/operations",
    },
  ];

  return {
    title: "System Health",
    subtitle: "Integration health, automation outbox, and audit log",
    timestampLabel:
      data.auditLogs[0]?.created_at
        ? formatAdminTimestamp(data.auditLogs[0].created_at)
        : "Jun 17, 2026 · 14:41 UTC",
    backendLanes: [
      {
        eyebrow: "Roles",
        title: "Permission Registry",
        summary:
          "Canonical roles, scopes, landing routes, and route-family ownership for local actors.",
        href: "/admin/permissions",
      },
      {
        eyebrow: "Flows",
        title: "Workflow Registry",
        summary:
          "Backend map for onboarding, guarded writes, proof review, SLT readiness, and coach intervention.",
        href: "/admin/workflows",
      },
      {
        eyebrow: "Owners",
        title: "Committee Registry",
        summary:
          "Action committee lanes, owner roles, and campaign links for reusable chapter operations.",
        href: "/admin/committees",
      },
      {
        eyebrow: "Builder",
        title: "SOP Library",
        summary:
          "Campaign workflow definitions with builder tabs for steps, role matrix, completion, KPI, and version history.",
        href: "/admin/sop-library",
      },
      {
        eyebrow: "QA",
        title: "Design QA",
        summary:
          "Track the Figma-backed mobile, accessibility, and visual smoke checks before launch.",
        href: "/admin/design-qa",
      },
      {
        eyebrow: "Pilot",
        title: "Pilot Scope",
        summary:
          "Keep the one-chapter pilot shape and named owners visible from the admin handoff.",
        href: "/admin/pilot-scope",
      },
    ],
    handoffSummaryCards,
    handoffConsoleCards,
    integrationStatuses: fallbackIntegrationStatuses,
    retryFailedHref: "/admin/integration-outbox",
    failedCount: outboxRows.filter((row) => row.status === "failed").length,
    outboxRows,
    auditRows,
  };
}

function summarizeOutbox(items: OutboxItem[]): StaffOutboxSummary {
  return {
    total: items.length,
    disabled: items.filter((item) => item.status === "disabled").length,
    mocked: items.filter((item) => item.status === "mocked").length,
    hubspot: items.filter((item) => item.destination === "HubSpot").length,
    luma: items.filter((item) => item.destination === "Luma").length,
    n8n: items.filter((item) => item.destination === "n8n").length,
    warehouse: items.filter((item) => item.destination === "warehouse").length,
  };
}

function getAuditItems(data: ReadOnlyAppData): StaffAuditItem[] {
  if (data.auditLogs.length > 0) {
    return data.auditLogs.slice(0, 4).map((item) => ({
      title: `${item.action} -> ${item.target_table}`,
      detail:
        item.reason ??
        `Audit row for ${item.target_table} was recorded at ${item.created_at}.`,
      posture: "Recorded",
    }));
  }

  return [
    {
      title: "Assignment writes stay blocked",
      detail:
        "Leaders can preview assignment creation flows, but no chapter-assignment admin mutation is live yet.",
      posture: "Preview only",
    },
    {
      title: "Proof decisions stay review-only",
      detail:
        "HQ can inspect proof and consent posture, but sharing decisions do not publish anything externally.",
      posture: "Preview only",
    },
    {
      title: "Membership and role approvals are still guarded",
      detail:
        "This MVP shows readiness and review context without enabling staff role or chapter membership writes.",
      posture: "Preview only",
    },
  ];
}

function getAdminOutboxSourceLabel(row: ReadOnlyAppData["automationOutboxRows"][number]) {
  if (row.integration_event_id) {
    return "n8n";
  }

  switch (row.destination) {
    case "hubspot":
    case "warehouse":
      return "myMEDLIFE";
    case "luma":
      return "myMEDLIFE";
    case "n8n":
      return "myMEDLIFE";
  }

  return "myMEDLIFE";
}

function getAdminOutboxDestinationLabel(destination: ReadOnlyAppData["automationOutboxRows"][number]["destination"]) {
  switch (destination) {
    case "hubspot":
      return "HubSpot";
    case "luma":
      return "Luma";
    case "n8n":
      return "n8n";
    case "warehouse":
      return "Data Hub";
  }

  return "myMEDLIFE";
}

function getAdminOutboxStatus(
  row: ReadOnlyAppData["automationOutboxRows"][number],
): StaffAdminOutboxRow["status"] {
  if (row.last_error) {
    return "failed";
  }

  if (row.sent_at) {
    return "success";
  }

  return "pending";
}

function getAdminAuditActorLabel(
  actorUserId: string | null,
  data: ReadOnlyAppData,
) {
  if (!actorUserId) {
    return "system@n8n";
  }

  return data.profiles.find((profile) => profile.id === actorUserId)?.email ?? "system@n8n";
}

function getAdminAuditRoleLabel(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes("coach")) {
    return "Coach";
  }

  if (normalized.includes("admin")) {
    return "Admin";
  }

  if (normalized.includes("automation")) {
    return "System";
  }

  return "Admin";
}

function getAdminAuditChapterLabel(
  chapterId: string | null,
  data: ReadOnlyAppData,
) {
  if (!chapterId) {
    return "Global";
  }

  return chapterId === data.chapter.id ? data.chapter.name : "Global";
}

function humanizeAdminAction(action: string) {
  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function humanizeTargetTable(targetTable: string) {
  return targetTable
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatAdminTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
    .format(date)
    .replace(",", "");
}

function getMetrics(
  chapterRows: StaffChapterPortfolioRow[],
  proofReviewItems: StaffProofReviewItem[],
  data: ReadOnlyAppData,
  outboxSummary: StaffOutboxSummary,
): StaffCommandCenterMetric[] {
  return [
    {
      label: "Portfolio chapters",
      value: `${chapterRows.length}`,
      note: "Chapters currently in focus across the national command center.",
    },
    {
      label: "High-risk chapters",
      value: `${chapterRows.filter((row) => row.risk === "high").length}`,
      note: "Chapters that likely need intervention before the next support cycle.",
    },
    {
      label: "Proof queue",
      value: `${proofReviewItems.length}`,
      note: "UGC and proof items that need consent, clarity, or HQ review.",
    },
    {
      label: "HubSpot posture",
      value: `${outboxSummary.hubspot}`,
      note: `${data.integrationEvents.filter((event) => event.destination === "HubSpot").length} recent CRM handoff signal(s) visible in this operations view.`,
    },
  ];
}

function getPortfolioSummaryCards(
  chapterRows: StaffChapterPortfolioRow[],
): StaffPortfolioSummaryCard[] {
  const isDefaultPortfolioSeed =
    chapterRows.length === DEFAULT_STAFF_PORTFOLIO_CHAPTER_IDS.length &&
    DEFAULT_STAFF_PORTFOLIO_CHAPTER_IDS.every((chapterId) =>
      chapterRows.some((row) => row.chapterId === chapterId),
    );
  const activeChapterCount = chapterRows.filter((row) => row.statusLabel !== "Not Started").length;
  const atRiskCount = chapterRows.filter((row) => row.risk !== "low").length;
  const interveneNowCount = chapterRows.filter((row) => row.decision === "intervene").length;
  const evidencePending = chapterRows.reduce((total, row) => total + row.proofPending, 0);
  const hubspotTasks = chapterRows.reduce((total, row) => total + row.openFollowUps, 0);
  const eventsThisWeek = chapterRows.reduce((total, row) => {
    return total + Math.max(1, Math.round(row.rsvpCount / 20));
  }, 0);
  const summaryValues = isDefaultPortfolioSeed
    ? {
        activeChapterCount: 12,
        atRiskCount: 6,
        interveneNowCount: 2,
        eventsThisWeek: 34,
      }
    : {
        activeChapterCount,
        atRiskCount,
        interveneNowCount,
        eventsThisWeek,
      };

  return [
    {
      label: "Chapters Active",
      value: `${summaryValues.activeChapterCount}`,
      note: `of ${chapterRows.length} total`,
      tone: "blue",
    },
    {
      label: "At Risk",
      value: `${summaryValues.atRiskCount}`,
      note: "review needed",
      tone: "yellow",
    },
    {
      label: "Intervene Now",
      value: `${summaryValues.interveneNowCount}`,
      note: "urgent",
      tone: "red",
    },
    {
      label: "Events This Week",
      value: `${summaryValues.eventsThisWeek}`,
      note: "across all chapters",
      tone: "blue",
    },
    {
      label: "Evidence Pending",
      value: `${evidencePending}`,
      note: "awaiting review",
      tone: "yellow",
    },
    {
      label: "HubSpot Tasks",
      value: `${hubspotTasks}`,
      note: "open follow-ups",
      tone: "red",
    },
  ];
}

function getQuickActions(
  selectedChapterId: string | null,
  selectedCampaignSlug: string,
  routeBase: "/staff" | "/coach",
  context: {
    campaignRiskGroup: StaffCampaignRiskGroup;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    decisionPreview: StaffDecisionPreview | null;
    selectedProofId: string | null;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
    selectedFeedDraftId: string | null;
    selectedFeedPostId: string | null;
    feedPreviewRole?: StaffFeedPreviewRole;
    feedAudienceMode?: StaffFeedAudienceMode;
  },
): StaffCommandCenterQuickAction[] {
  return [
    {
      label: "Review risk chapters",
      href: getHref({
        routeBase,
        view: "chapters",
        campaignRisk: context.campaignRiskGroup,
        risk: "high",
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        chapterId: selectedChapterId,
        decision: context.decisionPreview ?? undefined,
        campaign: selectedCampaignSlug,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        proof: context.selectedProofId,
        feedDraft: context.selectedFeedDraftId,
        feedPost: context.selectedFeedPostId,
        feedRole: context.feedPreviewRole,
        feedAudience: context.feedAudienceMode,
      }),
      helper: "Start with intervene lanes and open follow-up debt.",
      tone: "primary",
    },
    {
      label: "Open proof queue",
      href: getHref({
        routeBase,
        view: "proof_ugc",
        campaignRisk: context.campaignRiskGroup,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        chapterId: selectedChapterId,
        decision: context.decisionPreview ?? undefined,
        campaign: selectedCampaignSlug,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        proof: context.selectedProofId,
        feedDraft: context.selectedFeedDraftId,
        feedPost: context.selectedFeedPostId,
        feedRole: context.feedPreviewRole,
        feedAudience: context.feedAudienceMode,
      }),
      helper: "Check consent gates before anything becomes chapter proof.",
      tone: "secondary",
    },
    {
      label: "Check feed drafts",
      href: getHref({
        routeBase,
        view: "feed_studio",
        campaignRisk: context.campaignRiskGroup,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        chapterId: selectedChapterId,
        decision: context.decisionPreview ?? undefined,
        campaign: selectedCampaignSlug,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        proof: context.selectedProofId,
        feedDraft: context.selectedFeedDraftId,
        feedPost: context.selectedFeedPostId,
        feedRole: context.feedPreviewRole,
        feedAudience: context.feedAudienceMode,
      }),
      helper: "Curate content around real student action, not generic awareness.",
      tone: "secondary",
    },
    {
      label: "Open admin health",
      href: getHref({
        routeBase,
        view: "admin",
        campaignRisk: context.campaignRiskGroup,
        risk: context.riskFilter,
        country: context.countryFilter,
        coach: context.coachFilter,
        portfolioCampaign: context.portfolioCampaignFilter,
        query: context.searchQuery,
        chapterId: selectedChapterId,
        decision: context.decisionPreview ?? undefined,
        campaign: selectedCampaignSlug,
        proofQueue: context.proofQueueFilter,
        proofType: context.proofTypeFilter,
        proof: context.selectedProofId,
        feedDraft: context.selectedFeedDraftId,
        feedPost: context.selectedFeedPostId,
        feedRole: context.feedPreviewRole,
        feedAudience: context.feedAudienceMode,
      }),
      helper: "Read launch posture, outbox safety, and audit readiness.",
      tone: "secondary",
    },
  ];
}

function getViewOptions(
  routeBase: "/staff" | "/coach",
  selectedView: StaffCommandCenterView,
  source: string | undefined,
  campaignRiskGroup: StaffCampaignRiskGroup,
  riskFilter: StaffRiskFilter,
  countryFilter: StaffCountryFilter,
  coachFilter: StaffCoachFilter,
  portfolioCampaignFilter: StaffPortfolioCampaignFilter,
  searchQuery: string,
  selectedChapterId: string | null,
  selectedDecision: StaffDecisionPreview | null | undefined,
  navigationCampaignSlug: string | null,
  selectedCampaignSlug: string,
  selectedProofId?: string | null,
  proofQueueFilter?: StaffProofQueueFilter,
  proofTypeFilter?: StaffProofTypeFilter,
  selectedFeedDraftId?: string | null,
  selectedFeedPostId?: string | null,
  selectedHubSpotChapterId?: string | null,
  bestPracticeCountryFilter?: StaffBestPracticeCountryFilter,
  bestPracticeCampaignFilter?: StaffBestPracticeCampaignFilter,
  feedPreviewRole?: StaffFeedPreviewRole,
  feedAudienceMode?: StaffFeedAudienceMode,
): StaffCommandCenterViewOption[] {
  return (Object.keys(staffViewLabels) as StaffCommandCenterView[]).map((key) => ({
    key,
    label: staffViewLabels[key],
    href: getHref({
      routeBase,
      view: key,
      campaign: navigationCampaignSlug ?? undefined,
      campaignRisk: campaignRiskGroup,
      source,
      risk: riskFilter,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
      chapterId: selectedChapterId,
      decision: selectedDecision ?? undefined,
      proof: selectedProofId,
      proofQueue: proofQueueFilter,
      proofType: proofTypeFilter,
      feedDraft: selectedFeedDraftId,
      feedPost: selectedFeedPostId,
      hubspotChapter: selectedHubSpotChapterId,
      practiceCountry: bestPracticeCountryFilter,
      practiceCampaign: bestPracticeCampaignFilter,
      feedRole: feedPreviewRole,
      feedAudience: feedAudienceMode,
    }),
  }));
}

function getRiskFilterOptions(
  routeBase: "/staff" | "/coach",
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  countryFilter: StaffCountryFilter,
  coachFilter: StaffCoachFilter,
  portfolioCampaignFilter: StaffPortfolioCampaignFilter,
  searchQuery: string,
  selectedCampaignSlug: string,
): StaffRiskFilterOption[] {
  return [
    { key: "all" as const, label: "All Risks" },
    { key: "low" as const, label: "Healthy" },
    { key: "medium" as const, label: "At-Risk" },
    { key: "high" as const, label: "Intervene" },
  ].map((item) => ({
    ...item,
    href: getHref({
      routeBase,
      campaign: selectedCampaignSlug,
      view: selectedView,
      risk: item.key,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
    }),
  }));
}

function getCountryFilterOptions(
  routeBase: "/staff" | "/coach",
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  countryFilter: StaffCountryFilter,
  coachFilter: StaffCoachFilter,
  portfolioCampaignFilter: StaffPortfolioCampaignFilter,
  searchQuery: string,
  selectedCampaignSlug: string,
): StaffPortfolioFilterOption<StaffCountryFilter>[] {
  return [
    { key: "all" as const, label: "All Countries" },
    { key: "usa" as const, label: "USA" },
    { key: "canada" as const, label: "Canada" },
    { key: "peru" as const, label: "Peru" },
    { key: "brazil" as const, label: "Brazil" },
    { key: "mexico" as const, label: "Mexico" },
    { key: "chile" as const, label: "Chile" },
    { key: "honduras" as const, label: "Honduras" },
    { key: "nicaragua" as const, label: "Nicaragua" },
    { key: "kenya" as const, label: "Kenya" },
    { key: "uganda" as const, label: "Uganda" },
    { key: "ghana" as const, label: "Ghana" },
  ].map((item) => ({
    ...item,
    href: getHref({
      routeBase,
      campaign: selectedCampaignSlug,
      view: selectedView,
      risk: riskFilter,
      country: item.key,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
    }),
  }));
}

function getCoachFilterOptions(
  routeBase: "/staff" | "/coach",
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  countryFilter: StaffCountryFilter,
  coachFilter: StaffCoachFilter,
  portfolioCampaignFilter: StaffPortfolioCampaignFilter,
  searchQuery: string,
  selectedCampaignSlug: string,
): StaffPortfolioFilterOption<StaffCoachFilter>[] {
  return [
    { key: "all" as const, label: "All Coaches" },
    { key: "aisha" as const, label: "Aisha Kamara" },
    { key: "carlos" as const, label: "Carlos Quispe" },
    { key: "fernanda" as const, label: "Fernanda Lima" },
    { key: "james" as const, label: "James Okafor" },
    { key: "lucia" as const, label: "Lucia Herrera" },
    { key: "maria" as const, label: "Maria Santos" },
    { key: "samuel" as const, label: "Samuel Mutua" },
  ].map((item) => ({
    ...item,
    href: getHref({
      routeBase,
      campaign: selectedCampaignSlug,
      view: selectedView,
      risk: riskFilter,
      country: countryFilter,
      coach: item.key,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
    }),
  }));
}

function getPortfolioCampaignFilterOptions(
  routeBase: "/staff" | "/coach",
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  countryFilter: StaffCountryFilter,
  coachFilter: StaffCoachFilter,
  portfolioCampaignFilter: StaffPortfolioCampaignFilter,
  searchQuery: string,
  selectedCampaignSlug: string,
): StaffPortfolioFilterOption<StaffPortfolioCampaignFilter>[] {
  return [
    { key: "all" as const, label: "All Campaigns" },
    { key: "chapter_engagement" as const, label: "Chapter Engagement" },
    { key: "grow_the_movement" as const, label: "Grow the Movement" },
    { key: "leadership_transition" as const, label: "Leadership Transition" },
    { key: "moving_mountains" as const, label: "Moving Mountains" },
    { key: "rush_month" as const, label: "Rush Month" },
    { key: "slt_promotion" as const, label: "SLT Promotion" },
    { key: "start_a_chapter" as const, label: "Start a Chapter" },
  ].map((item) => ({
    ...item,
    href: getHref({
      routeBase,
      campaign: selectedCampaignSlug,
      view: selectedView,
      risk: riskFilter,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: item.key,
      query: searchQuery,
    }),
  }));
}

function getProofQueueFilterOptions(
  routeBase: "/staff" | "/coach",
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  countryFilter: StaffCountryFilter,
  coachFilter: StaffCoachFilter,
  portfolioCampaignFilter: StaffPortfolioCampaignFilter,
  searchQuery: string,
  selectedCampaignSlug: string,
  proofTypeFilter: StaffProofTypeFilter,
  selectedProofId: string | null,
): StaffPortfolioFilterOption<StaffProofQueueFilter>[] {
  return (Object.keys(staffProofQueueLabels) as StaffProofQueueFilter[]).map((key) => ({
    key,
    label: staffProofQueueLabels[key],
    href: getHref({
      routeBase,
      campaign: selectedCampaignSlug,
      view: selectedView,
      risk: riskFilter,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
      proofQueue: key,
      proofType: proofTypeFilter,
      proof: selectedProofId,
    }),
  }));
}

function getProofTypeFilterOptions(
  routeBase: "/staff" | "/coach",
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  countryFilter: StaffCountryFilter,
  coachFilter: StaffCoachFilter,
  portfolioCampaignFilter: StaffPortfolioCampaignFilter,
  searchQuery: string,
  selectedCampaignSlug: string,
  proofQueueFilter: StaffProofQueueFilter,
  selectedProofId: string | null,
): StaffPortfolioFilterOption<StaffProofTypeFilter>[] {
  return (Object.keys(staffProofTypeLabels) as StaffProofTypeFilter[]).map((key) => ({
    key,
    label: staffProofTypeLabels[key],
    href: getHref({
      routeBase,
      campaign: selectedCampaignSlug,
      view: selectedView,
      risk: riskFilter,
      country: countryFilter,
      coach: coachFilter,
      portfolioCampaign: portfolioCampaignFilter,
      query: searchQuery,
      proofQueue: proofQueueFilter,
      proofType: key,
      proof: selectedProofId,
    }),
  }));
}

function getBestPracticeCountryFilterOptions(
  routeBase: "/staff" | "/coach",
  source: string | undefined,
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  countryFilter: StaffCountryFilter,
  coachFilter: StaffCoachFilter,
  portfolioCampaignFilter: StaffPortfolioCampaignFilter,
  searchQuery: string,
  selectedCampaignSlug: string,
  bestPracticeCountryFilter: StaffBestPracticeCountryFilter,
  bestPracticeCampaignFilter: StaffBestPracticeCampaignFilter,
  proofQueueFilter: StaffProofQueueFilter,
  proofTypeFilter: StaffProofTypeFilter,
  selectedProofId: string | null,
): StaffPortfolioFilterOption<StaffBestPracticeCountryFilter>[] {
  return (Object.keys(staffBestPracticeCountryLabels) as StaffBestPracticeCountryFilter[]).map(
    (key) => ({
      key,
      label: staffBestPracticeCountryLabels[key],
      href: getHref({
        routeBase,
        campaign: selectedCampaignSlug,
        view: selectedView,
        risk: riskFilter,
        country: countryFilter,
        coach: coachFilter,
        portfolioCampaign: portfolioCampaignFilter,
        query: searchQuery,
        proofQueue: proofQueueFilter,
        proofType: proofTypeFilter,
        proof: selectedProofId,
        practiceCountry: key,
        practiceCampaign: bestPracticeCampaignFilter,
        source,
      }),
    }),
  );
}

function getBestPracticeCampaignFilterOptions(
  routeBase: "/staff" | "/coach",
  source: string | undefined,
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  countryFilter: StaffCountryFilter,
  coachFilter: StaffCoachFilter,
  portfolioCampaignFilter: StaffPortfolioCampaignFilter,
  searchQuery: string,
  selectedCampaignSlug: string,
  bestPracticeCountryFilter: StaffBestPracticeCountryFilter,
  proofQueueFilter: StaffProofQueueFilter,
  proofTypeFilter: StaffProofTypeFilter,
  selectedProofId: string | null,
): StaffPortfolioFilterOption<StaffBestPracticeCampaignFilter>[] {
  return (Object.keys(staffBestPracticeCampaignLabels) as StaffBestPracticeCampaignFilter[]).map(
    (key) => ({
      key,
      label: staffBestPracticeCampaignLabels[key],
      href: getHref({
        routeBase,
        campaign: selectedCampaignSlug,
        view: selectedView,
        risk: riskFilter,
        country: countryFilter,
        coach: coachFilter,
        portfolioCampaign: portfolioCampaignFilter,
        query: searchQuery,
        proofQueue: proofQueueFilter,
        proofType: proofTypeFilter,
        proof: selectedProofId,
        practiceCountry: bestPracticeCountryFilter,
        practiceCampaign: key,
        source,
      }),
    }),
  );
}

function getHref(options: {
  routeBase?: "/staff" | "/coach";
  campaign?: string;
  campaignRisk?: StaffCampaignRiskGroup;
  source?: string;
  view: StaffCommandCenterView;
  risk?: StaffRiskFilter;
  country?: StaffCountryFilter;
  coach?: StaffCoachFilter;
  portfolioCampaign?: StaffPortfolioCampaignFilter;
  query?: string;
  chapterId?: string | null;
  decision?: StaffDecisionPreview;
  proof?: string | null;
  proofQueue?: StaffProofQueueFilter;
  proofType?: StaffProofTypeFilter;
  feedDraft?: string | null;
  feedPost?: string | null;
  hubspotChapter?: string | null;
  bestPractice?: string | null;
  practiceCountry?: StaffBestPracticeCountryFilter;
  practiceCampaign?: StaffBestPracticeCampaignFilter;
  feedRole?: StaffFeedPreviewRole;
  feedAudience?: StaffFeedAudienceMode;
}): string {
  const params = new URLSearchParams();
  params.set("view", options.view);

  if (options.campaign) {
    params.set("campaign", options.campaign);
  }

  if (options.campaignRisk && options.campaignRisk !== "all") {
    params.set("campaignRisk", options.campaignRisk);
  }

  if (options.source) {
    params.set("source", options.source);
  }

  if (options.risk && options.risk !== "all") {
    params.set("risk", options.risk);
  }

  if (options.country && options.country !== "all") {
    params.set("country", options.country);
  }

  if (options.coach && options.coach !== "all") {
    params.set("coach", options.coach);
  }

  if (options.portfolioCampaign && options.portfolioCampaign !== "all") {
    params.set("portfolioCampaign", options.portfolioCampaign);
  }

  if (options.query?.trim()) {
    params.set("q", options.query.trim());
  }

  if (options.chapterId) {
    params.set("chapter", options.chapterId);
  }

  if (options.decision) {
    params.set("decision", options.decision);
  }

  if (options.proofQueue && options.proofQueue !== "all") {
    params.set("proofQueue", options.proofQueue);
  }

  if (options.proofType && options.proofType !== "all") {
    params.set("proofType", options.proofType);
  }

  if (options.proof) {
    params.set("proof", options.proof);
  }

  if (options.feedDraft) {
    params.set("feedDraft", options.feedDraft);
  }

  if (options.feedPost) {
    params.set("feedPost", options.feedPost);
  }

  if (options.hubspotChapter) {
    params.set("hubspotChapter", options.hubspotChapter);
  }

  if (options.bestPractice) {
    params.set("bestPractice", options.bestPractice);
  }

  if (options.practiceCountry && options.practiceCountry !== "all") {
    params.set("practiceCountry", options.practiceCountry);
  }

  if (options.practiceCampaign && options.practiceCampaign !== "all") {
    params.set("practiceCampaign", options.practiceCampaign);
  }

  if (options.feedRole) {
    params.set("feedRole", options.feedRole);
  }

  if (options.feedAudience) {
    params.set("feedAudience", options.feedAudience);
  }

  const query = params.toString();
  const routeBase = options.routeBase ?? "/staff";
  return query ? `${routeBase}?${query}` : routeBase;
}

function getCampaignChapterDetailHref(options: {
  routeBase: "/staff" | "/coach";
  campaign: string;
  campaignRisk: StaffCampaignRiskGroup;
  risk: StaffRiskFilter;
  country: StaffCountryFilter;
  coach: StaffCoachFilter;
  portfolioCampaign: StaffPortfolioCampaignFilter;
  query: string;
  chapterId: string;
  decision?: StaffDecisionPreview;
  proofQueue: StaffProofQueueFilter;
  proofType: StaffProofTypeFilter;
  proof: string | null;
  feedDraft: string | null;
  feedPost: string | null;
  feedRole?: StaffFeedPreviewRole;
  feedAudience?: StaffFeedAudienceMode;
}): string {
  const href = getHref({
    routeBase: options.routeBase,
    view: "chapters",
    campaign: options.campaign,
    campaignRisk: options.campaignRisk,
    risk: options.risk,
    country: options.country,
    coach: options.coach,
    portfolioCampaign: options.portfolioCampaign,
    query: options.query,
    chapterId: options.chapterId,
    decision: options.decision,
    proofQueue: options.proofQueue,
    proofType: options.proofType,
    proof: options.proof,
    feedDraft: options.feedDraft,
    feedPost: options.feedPost,
    feedRole: options.feedRole,
    feedAudience: options.feedAudience,
  });

  return options.routeBase === "/coach"
    ? href.replace("view=chapters", "view=chapter_detail")
    : href;
}

function parseStaffCommandCenterView(view?: string): StaffCommandCenterView {
  if (!view) {
    return "chapters";
  }

  return (Object.keys(staffViewLabels) as StaffCommandCenterView[]).includes(
    view as StaffCommandCenterView,
  )
    ? (view as StaffCommandCenterView)
    : "chapters";
}

function parseRiskFilter(risk?: string): StaffRiskFilter {
  switch (risk) {
    case "high":
    case "medium":
    case "low":
      return risk;
    default:
      return "all";
  }
}

function parseCountryFilter(country?: string): StaffCountryFilter {
  switch (country) {
    case "usa":
    case "canada":
    case "peru":
    case "brazil":
    case "honduras":
    case "nicaragua":
    case "kenya":
    case "uganda":
    case "chile":
    case "mexico":
    case "ghana":
      return country;
    default:
      return "all";
  }
}

function parseCoachFilter(coach?: string): StaffCoachFilter {
  switch (coach) {
    case "cam_coach":
    case "maria":
    case "james":
    case "aisha":
    case "carlos":
    case "fernanda":
    case "lucia":
    case "samuel":
      return coach;
    default:
      return "all";
  }
}

function parsePortfolioCampaignFilter(
  portfolioCampaign?: string,
): StaffPortfolioCampaignFilter {
  switch (portfolioCampaign) {
    case "chapter_engagement":
    case "grow_the_movement":
    case "leadership_transition":
    case "moving_mountains":
    case "rush_month":
    case "slt_promotion":
    case "start_a_chapter":
      return portfolioCampaign;
    default:
      return "all";
  }
}

function parseCampaignRiskGroup(value?: string): StaffCampaignRiskGroup {
  switch (value) {
    case "no_event":
    case "low_rsvp":
    case "low_attendance":
    case "no_follow_up":
    case "evidence_stuck":
      return value;
    default:
      return "all";
  }
}

function parseDecisionPreview(value?: string): StaffDecisionPreview | null {
  switch (value) {
    case "advance":
    case "hold":
    case "intervene":
      return value;
    default:
      return null;
  }
}

function parseProofQueueFilter(value?: string): StaffProofQueueFilter {
  switch (value) {
    case "pending":
    case "chapter_only":
    case "selected":
    case "rejected":
      return value;
    default:
      return "all";
  }
}

function parseProofTypeFilter(value?: string): StaffProofTypeFilter {
  switch (value) {
    case "proof_video":
    case "bridge_video":
    case "event_recap":
    case "best_practice":
    case "student_story":
      return value;
    default:
      return "all";
  }
}

function parseBestPracticeCountryFilter(value?: string): StaffBestPracticeCountryFilter {
  switch (value) {
    case "usa":
    case "canada":
    case "peru":
    case "mexico":
    case "brazil":
      return value;
    default:
      return "all";
  }
}

function parseBestPracticeCampaignFilter(value?: string): StaffBestPracticeCampaignFilter {
  switch (value) {
    case "rush_month":
    case "chapter_engagement":
    case "moving_mountains":
    case "grow_the_movement":
      return value;
    default:
      return "all";
  }
}

function parseFeedPreviewRole(value?: string): StaffFeedPreviewRole {
  switch (value) {
    case "leader":
      return "leader";
    default:
      return "member";
  }
}

function parseFeedAudienceMode(value?: string): StaffFeedAudienceMode {
  switch (value) {
    case "one_chapter":
    case "selected_chapters":
    case "country_region":
    case "campaign_chapters":
    case "all_chapters":
      return value;
    default:
      return "campaign_chapters";
  }
}

function decisionToLabel(decision: "advance" | "hold" | "intervene"): string {
  switch (decision) {
    case "advance":
      return "Advance";
    case "hold":
      return "Hold";
    case "intervene":
      return "Intervene";
  }
}

function campaignRiskGroupToLabel(group: StaffCampaignRiskGroup): string {
  switch (group) {
    case "no_event":
      return "No event created";
    case "low_rsvp":
      return "Low RSVP (< 20)";
    case "low_attendance":
      return "Low Attendance (< 50%)";
    case "no_follow_up":
      return "No Follow-up";
    case "evidence_stuck":
      return "Evidence Stuck";
    case "all":
      return "All campaign risks";
  }
}

function feedAudienceModeToLabel(mode: StaffFeedAudienceMode): string {
  switch (mode) {
    case "one_chapter":
      return "1 Chapter";
    case "selected_chapters":
      return "Selected Chapters (5)";
    case "country_region":
      return "Country / Region";
    case "campaign_chapters":
      return "Campaign Chapters";
    case "all_chapters":
      return "All Chapters Globally";
  }
}

function bestPracticeCampaignToFilterKey(
  campaignLabel: string,
): StaffBestPracticeCampaignFilter {
  switch (campaignLabel) {
    case "Rush Month":
      return "rush_month";
    case "Chapter Engagement":
      return "chapter_engagement";
    case "Moving Mountains":
      return "moving_mountains";
    case "Grow the Movement":
      return "grow_the_movement";
    default:
      return "all";
  }
}

function countryToBestPracticeFilterKey(
  country: string,
): StaffBestPracticeCountryFilter {
  switch (countryToFilterKey(country)) {
    case "usa":
      return "usa";
    case "canada":
      return "canada";
    case "peru":
      return "peru";
    case "mexico":
      return "mexico";
    case "brazil":
      return "brazil";
    default:
      return "all";
  }
}

function bestPracticeCountryToFilterKey(
  countryLabel: string,
): StaffBestPracticeCountryFilter {
  switch (countryLabel) {
    case "USA":
      return "usa";
    case "Canada":
      return "canada";
    case "Peru":
      return "peru";
    case "Mexico":
      return "mexico";
    case "Brazil":
      return "brazil";
    default:
      return "all";
  }
}

function campaignSlugToLabel(slug: string): string {
  switch (slug) {
    case "rush-month":
      return "Rush Month";
    case "slt-promotion":
      return "SLT Promotion";
    case "moving-mountains":
      return "Moving Mountains";
    case "chapter-engagement":
      return "Chapter Engagement";
    case "leadership-transition":
      return "Leadership Transition";
    case "grow-the-movement":
      return "Grow the Movement";
    case "start-a-chapter":
      return "Start a Chapter";
    default:
      return "Rush Month";
  }
}

function emptyStaffCommandCenter(): StaffCommandCenter {
  return {
    canReadCommandCenter: false,
    routeBase: "/staff",
    title: "Staff Command Center hidden for this role",
    summary:
      "This staff route is reserved for coach and HQ support personas. Members and chapter leaders should use their operating routes.",
    sampleLabel: null,
    sourceContext: null,
    selectedView: "chapters",
    selectedCampaignSlug: "rush-month",
    selectedChapterId: null,
    portfolioCampaignViewHref: "/staff?view=campaigns&source=portfolio_overview",
    portfolioBestPracticesViewHref:
      "/staff?view=best_practices&source=portfolio_overview",
    closeChapterHref: "/staff?view=chapters",
    riskFilter: "all",
    countryFilter: "all",
    coachFilter: "all",
    portfolioCampaignFilter: "all",
    searchQuery: "",
    selectedProofId: null,
    proofQueueFilter: "all",
    proofTypeFilter: "all",
    selectedFeedDraftId: null,
    selectedFeedPostId: null,
    selectedHubSpotChapterId: null,
    selectedBestPracticeId: null,
    bestPracticeCountryFilter: "all",
    bestPracticeCampaignFilter: "all",
    feedPreviewRole: "member",
    feedAudienceMode: "campaign_chapters",
    canReadDetailedOutbox: false,
    metrics: [],
    quickActions: [],
    viewOptions: [],
    riskFilters: [],
    countryFilters: [],
    coachFilters: [],
    portfolioCampaignFilters: [],
    proofQueueFilters: [],
    proofTypeFilters: [],
    bestPracticeCountryFilters: [],
    bestPracticeCampaignFilters: [],
    portfolioSummaryCards: [],
    chapterRows: [],
    selectedChapter: null,
    campaignCards: [],
    campaignOperations: {
      activeCampaignCountLabel: "0 campaigns active across all regions",
      timestampLabel: "No campaign review visible",
      selectedCampaignSlug: "rush-month",
      selectedCampaignName: "Rush Month",
      selectedRiskGroup: "all",
      selectedRiskGroupLabel: "All campaign risks",
      clearRiskGroupHref: "/staff?view=campaigns",
      sourceContext: null,
      tabs: [],
      riskCards: [],
      bulkActions: [],
      executionRows: [],
    },
    proofReviewItems: [],
    selectedProofReview: null,
    feedDrafts: [],
    feedStudio: {
      selectedDraftId: null,
      selectedDraft: null,
      sourceContext: null,
      previewRole: "member",
      audienceMode: "campaign_chapters",
      audienceOptions: [],
      previewRoleOptions: [],
      campaignTagLabel: "Rush Month",
      engagementGoalLabel: "inspire action",
      estimatedReachLabel: "~0 students",
      targetChapterCountLabel: "0 chapters",
      audienceRoleLabels: [],
      audienceChapterStatusLabels: [],
    },
    feedAnalytics: {
      summaryCards: [],
      posts: [],
      selectedPostId: null,
      selectedPost: null,
      sourceContext: null,
      timestampLabel: "No analytics visible",
    },
    hubspotWorkspace: {
      selectedChapterId: null,
      selectedChapterLabel: "HubSpot chapter review",
      timestampLabel: "No HubSpot review visible",
      warningLabel: null,
      sourceContext: null,
      chapterOptions: [],
      crmProfileMetrics: [],
      matchedActivityMetrics: [],
      funnelSteps: [],
    },
    feedInsights: [],
    hubspotSignals: [],
    bestPracticeCards: [],
    adminWorkspace: {
      title: "System Health",
      subtitle: "No admin review is visible for this role.",
      timestampLabel: "No admin review visible",
      backendLanes: [],
      handoffSummaryCards: [],
      handoffConsoleCards: [],
      integrationStatuses: [],
      retryFailedHref: "/admin/integration-outbox",
      failedCount: 0,
      outboxRows: [],
      auditRows: [],
    },
    adminSignals: [],
    outboxSummary: {
      total: 0,
      disabled: 0,
      mocked: 0,
      hubspot: 0,
      luma: 0,
      n8n: 0,
      warehouse: 0,
    },
    auditItems: [],
    leaderboardRows: [],
    safetyNote: "No staff data is visible to this role.",
  };
}

function getStaffLandingSourceContext(
  source: string | undefined,
  routeBase: "/staff" | "/coach",
  selectedView: StaffCommandCenterView,
  originChapterName: string,
  originChapterId: string,
): StaffCommandCenterSourceContext | null {
  if (source === "member_home") {
    return {
      eyebrow: "Member app handoff",
      title:
        routeBase === "/coach"
          ? `Opened from ${originChapterName} into Coach Dashboard`
          : `Opened from ${originChapterName} into Admin Console`,
      summary:
        routeBase === "/coach"
          ? `This coach surface was opened from the ${originChapterName} member home via the app's Switch View buttons. Review chapter risk and support posture as a continuation of the student-facing loop, with a clear path back to Student view.`
          : `This staff surface was opened from the ${originChapterName} member home via the app's Switch View buttons. Keep HQ review tied to the student-facing Rush Month flow that triggered the handoff, with a clear path back to Student view.`,
      actions:
        routeBase === "/coach"
          ? [
              {
                label: "Open chapter",
                href: `/coach?view=chapter_detail&source=member_home&chapter=${originChapterId}`,
              },
              {
                label: "Write coach note",
                href: "/coach?view=support_notes&source=member_home#support-notes",
              },
              {
                label: "Review risk reports",
                href: "/coach?view=chapters&source=member_home&risk=high",
              },
              {
                label: "Student view",
                href: buildStudentHomePreviewHref(),
              },
            ]
          : [
              {
                label: "View integration events",
                href: "/staff?view=admin&source=member_home#integration-status",
              },
              {
                label: "Open workflow registry",
                href: "/admin/workflows",
              },
              {
                label: "Student view",
                href: buildStudentHomePreviewHref(),
              },
            ],
    };
  }

  if (source === "portfolio_overview" && selectedView === "best_practices") {
    return {
      eyebrow: "Portfolio overview source",
      title: "Opened from the chapter portfolio",
      summary:
        "This best-practices library was opened from Portfolio Overview to assemble a coach-ready brief. Keep the visible chapter filters and support posture anchored while choosing which operating patterns to share.",
    };
  }

  return null;
}

function getProofReviewBestPracticesSourceContext(
  source: string | undefined,
  selectedView: StaffCommandCenterView,
  selectedProofItem: StaffProofReviewItem | null,
  context: {
    routeBase: "/staff" | "/coach";
    selectedCampaignSlug: string;
    riskFilter: StaffRiskFilter;
    countryFilter: StaffCountryFilter;
    coachFilter: StaffCoachFilter;
    portfolioCampaignFilter: StaffPortfolioCampaignFilter;
    searchQuery: string;
    proofQueueFilter: StaffProofQueueFilter;
    proofTypeFilter: StaffProofTypeFilter;
  },
): StaffCommandCenterSourceContext | null {
  if (source !== "proof_review" || selectedView !== "best_practices" || !selectedProofItem) {
    return null;
  }

  return {
    eyebrow: "Proof review source",
    title: "Opened from proof review",
    summary: `${selectedProofItem.chapterLabel} · ${selectedProofItem.contributorLabel} is the proof item that triggered this library review. Keep the consent posture and recommendation visible while deciding whether this belongs in the best-practice lane or should stay a one-off story.`,
    actions: [
      {
        label: "Return to proof queue",
        href: getHref({
          routeBase: context.routeBase,
          view: "proof_ugc",
          campaign: context.selectedCampaignSlug,
          risk: context.riskFilter,
          country: context.countryFilter,
          coach: context.coachFilter,
          portfolioCampaign: context.portfolioCampaignFilter,
          query: context.searchQuery,
          proofQueue: context.proofQueueFilter,
          proofType: context.proofTypeFilter,
          proof: selectedProofItem.id,
        }),
      },
    ],
  };
}
