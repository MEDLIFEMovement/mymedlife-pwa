import {
  getActionCommittees,
  getCommitteeOperatingSummary,
  getEventPlansForCampaign,
  getEventPlansForCommittee,
  getProofLibraryItems,
} from "@/services/campaign-ops-service";
import { getActorPrimaryRoleLabel } from "@/services/actor-role-display";
import { getChapterMemberRoleFocus } from "@/services/chapter-member-role-focus";
import {
  getChapterMembershipWorkspace,
  type ChapterJoinRequest,
  type ChapterMemberRow,
} from "@/services/chapter-membership-workspace";
import { getLeaderActionsFocus } from "@/services/leader-actions-focus";
import type { LocalActorContext } from "@/services/local-actor-context";
import { buildStudentHomePreviewHref } from "@/services/local-preview-route";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getActorSurfaceFamily,
  getVisibleAssignmentsForActor,
} from "@/services/role-visibility";
import type { ProofLibraryItem } from "@/shared/types/campaigns";
import type { LeaderboardRow } from "@/shared/types/rush-month-dashboard";

export type ChapterLeaderCommandCenterView =
  | "overview"
  | "leaderboard"
  | "leaders"
  | "members"
  | "member_profile"
  | "committees"
  | "events"
  | "impact"
  | "bridge_videos"
  | "succession"
  | "values"
  | "training"
  | "feed"
  | "feed_analytics";

export type ChapterLeaderPipelineFilter =
  | "all"
  | "e_board"
  | "chair"
  | "chair_candidate"
  | "active_contributor"
  | "general_member"
  | "follow_up"
  | "ready"
  | "emerging"
  | "contributors";

export type ChapterLeaderLeaderboardMetricKey =
  | "chapter_health"
  | "events_created"
  | "active_members"
  | "attendance"
  | "evidence"
  | "bridge_videos"
  | "funds_raised"
  | "slt_participants";

export type ChapterLeaderLeaderboardRegionKey =
  | "all"
  | "current_region"
  | "united_states"
  | "canada";

export type ChapterLeaderBridgeVideoFilterKey =
  | "all"
  | "recruitment"
  | "fundraising"
  | "slt"
  | "transition"
  | "comms";

export type ChapterLeaderEventCommitteeFilterKey =
  | "all"
  | "events"
  | "slt_promotion"
  | "recruitment"
  | "fundraising"
  | "service"
  | "comms";

export type ChapterLeaderQuickActionState =
  | "add_committee"
  | "add_leader_note"
  | "add_member"
  | "assign_leadership_action"
  | "ask_members_to_respond"
  | "create_impact_bridge_video"
  | "create_event"
  | "export_members"
  | "nominate_for_eboard"
  | "promote_to_chair"
  | "assign_action"
  | "review_members"
  | "schedule_values_interview"
  | "share_impact_story"
  | "promote_emerging_leader"
  | "feature_bridge_video"
  | "share_to_feed"
  | "share_bridge_video"
  | "submit_bridge_video";

export type ChapterLeaderCommandCenterTone = "green" | "yellow" | "red";

export type ChapterLeaderCommandCenterMetric = {
  label: string;
  value: string;
  note: string;
};

export type ChapterLeaderCommandCenterLeaderboardFilter = {
  key: ChapterLeaderLeaderboardMetricKey;
  label: string;
  isActive: boolean;
  href: string;
};

export type ChapterLeaderCommandCenterLeaderboardRegionOption = {
  key: ChapterLeaderLeaderboardRegionKey;
  label: string;
  isActive: boolean;
  href: string;
};

export type ChapterLeaderCommandCenterEventCommitteeFilter = {
  key: ChapterLeaderEventCommitteeFilterKey;
  label: string;
  isActive: boolean;
  href: string;
};

export type ChapterLeaderCommandCenterLeaderboardChapter = {
  id: string;
  rankLabel: string;
  chapterName: string;
  countryLabel: string;
  badgeLabel?: string;
  healthLabel: string;
  quote: string;
  metrics: Array<{
    label: string;
    value: string;
  }>;
  bestPracticesHref: string;
};

export type ChapterLeaderCommandCenterTrendPoint = {
  label: string;
  value: number;
};

export type ChapterLeaderCommandCenterQuickAction = {
  label: string;
  href: string;
  helper: string;
  tone: "primary" | "secondary";
};

export type ChapterLeaderCommandCenterViewOption = {
  key: ChapterLeaderCommandCenterView;
  label: string;
  href: string;
};

export type ChapterLeaderCommandCenterNavGroup = {
  label: string;
  viewKeys: ChapterLeaderCommandCenterView[];
};

export type ChapterLeaderPipelineFilterOption = {
  key: ChapterLeaderPipelineFilter;
  label: string;
  href: string;
};

export type ChapterLeaderCommandCenterWeeklyPriority = {
  title: string;
  summary: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

export type ChapterLeaderCommandCenterLeadershipRole = {
  key: string;
  label: string;
  owner: string;
  status: "covered" | "thin" | "missing";
  note: string;
};

export type ChapterLeaderCommandCenterRiskAlert = {
  severity: "high" | "medium" | "low";
  title: string;
  summary: string;
  href: string;
  hrefLabel: string;
};

export type ChapterLeaderCommandCenterPipelineItem = {
  id: string;
  kind: "join_request" | "member";
  displayName: string;
  roleLabel: string;
  statusLabel: string;
  laneLabel: string;
  summary: string;
  href: string;
};

export type ChapterLeaderCommandCenterPipelineRow = {
  id: string;
  displayName: string;
  initials: string;
  roleLabel: string;
  committeeLane: string;
  lastActiveLabel: string;
  points: number;
  weeklyMovementLabel: string;
  eventsMadeLabel: string;
  attendanceLabel: string;
  chapterShareLabel: string;
  actionsLabel: string;
  evidenceLabel: string;
  bridgeLabel: string;
  fundraisingLabel: string;
  valuesLabel: string;
  pipelineLabel: string;
  nextStepLabel: string;
  href: string;
  profileHref: string;
  isSelected: boolean;
};

export type ChapterLeaderCommandCenterPipelineSnapshot = {
  label: string;
  value: string;
  note: string;
};

export type ChapterLeaderCommandCenterMemberProfile = {
  id: string;
  displayName: string;
  roleLabel: string;
  committeeLane: string;
  pipelineLabel: string;
  points: number;
  weeklyPointsDeltaLabel: string;
  eventsCreatedLabel: string;
  completedActions: number;
  openAssignments: number;
  bridgeVideosLabel: string;
  proofStatus: string;
  nextStep: string;
  recognition: string;
  readinessLabel: string;
  badgeLabel: string;
  lastActiveLabel: string;
  sltInterestLabel: string;
  volunteerHoursLabel: string;
  fundraisingLabel: string;
  engagementLabel: string;
  valuesAlignment: Array<{
    label: string;
    summary: string;
  }>;
  pointsHistory: Array<{
    label: string;
    value: number;
  }>;
  activityTimeline: Array<{
    dateLabel: string;
    detail: string;
  }>;
  leaderNotes: Array<{
    dateLabel: string;
    authorLabel: string;
    body: string;
  }>;
  leadershipActions: Array<{
    label: string;
    href: string;
    tone: "primary" | "secondary";
  }>;
  reviewContext: {
    eyebrow: string;
    title: string;
    summary: string;
    actionLabel: string;
    actionHref: string;
  } | null;
  backToContextLabel: string;
  backToContextHref: string;
  backToPipelineHref: string;
  profileHref: string;
};

export type ChapterLeaderCommandCenterCommitteeCard = {
  id: string;
  name: string;
  lane: string;
  ownerLabel: string;
  memberCountLabel: string;
  actionsDoneLabel: string;
  eventsCountLabel: string;
  kpiLabel: string;
  operatingStatusLabel: string;
  nextEventTitle: string;
  nextEventTiming: string;
  lumaStatusLabel: string;
  summary: string;
  href: string;
};

export type ChapterLeaderCommandCenterCommitteesOverview = {
  activeCommitteesLabel: string;
  totalOpenActionsLabel: string;
  committeesWithoutChairsLabel: string;
};

export type ChapterLeaderCommandCenterEventCard = {
  id: string;
  title: string;
  lane: string;
  ownerLabel: string;
  timing: string;
  dateLabel: string;
  lumaStatusLabel: string;
  rsvpCount: number | null;
  attendedCount: number | null;
  attendanceRateLabel: string;
  eventStatusLabel: string;
  proofStatusLabel: string;
  followUpStatusLabel: string;
  creatorLabel: string;
  expectedStudentAction: string;
  proofPrompt: string;
  href: string;
  eventFlowHref: string;
};

export type ChapterLeaderCommandCenterEventsOverview = {
  monthLabel: string;
  totalEventsThisMonth: number;
  attendanceRateLabel: string;
  attendanceDeltaLabel: string;
  rsvpConversionLabel: string;
  eventsWithProofLabel: string;
  followUpsOverdue: number;
  socialRecruitingLabel: string;
  socialRecruitingNote: string;
};

export type ChapterLeaderCommandCenterSocialRecruitingMetric = {
  label: string;
  value: string;
};

export type ChapterLeaderCommandCenterBridgeStory = {
  id: string;
  sourceLabel: string;
  proofTypeLabel: string;
  sharingStatusLabel: string;
  hesitationAddressed: string;
  summary: string;
  href: string;
};

export type ChapterLeaderCommandCenterBridgeVideoMetric = {
  label: string;
  value: string;
};

export type ChapterLeaderCommandCenterBridgeVideoFilter = {
  key: ChapterLeaderBridgeVideoFilterKey;
  label: string;
  isActive: boolean;
  href: string;
};

export type ChapterLeaderCommandCenterBridgeVideoEntry = {
  id: string;
  title: string;
  badgeLabel: string | null;
  categoryLabel: string;
  authorLabel: string;
  submittedDateLabel: string;
  viewsLabel: string;
  likesLabel: string;
  commentsLabel: string;
  sharesLabel: string;
  chaptersUsingLabel: string;
  href: string;
  featureHref: string;
  shareHref: string;
};

export type ChapterLeaderCommandCenterImpactHighlight = {
  id: string;
  icon?: string;
  eyebrow: string;
  value: string;
  label: string;
  summary: string;
  actionLabel: string;
  href: string;
  tone: "blue" | "purple" | "amber";
};

export type ChapterLeaderCommandCenterImpactStat = {
  label: string;
  value: string;
};

export type ChapterLeaderCommandCenterCampaignImpactOverview = {
  title: string;
  raisedLabel: string;
  goalLabel: string;
  progressLabel: string;
  donorsLabel: string;
  rankLabel: string;
  pillars: ChapterLeaderCommandCenterImpactStat[];
};

export type ChapterLeaderCommandCenterFeedInsight = {
  label: string;
  value: string;
  note: string;
};

export type ChapterLeaderCommandCenterFeedMetric = {
  label: string;
  value: string;
};

export type ChapterLeaderCommandCenterFeedChartRow = {
  label: string;
  likes: number;
  comments: number;
  actionsAfter: number;
};

export type ChapterLeaderCommandCenterFeedPostRow = {
  id: string;
  title: string;
  typeLabel: string;
  authorLabel: string;
  viewsLabel: string;
  likesLabel: string;
  commentsLabel: string;
  sharesLabel: string;
  actionsAfterLabel: string;
  rsvpsLabel: string;
  dateLabel: string;
  badgeLabel: string;
  href: string;
  isSelected: boolean;
  summary: string;
  nextActionLabel: string;
  nextActionHref: string;
};

export type ChapterLeaderCommandCenterFeedMemberRow = {
  id: string;
  displayName: string;
  initials: string;
  scoreLabel: string;
  actionLabel?: string;
  actionHref?: string;
};

export type ChapterLeaderCommandCenterFeedAnalyticsBridgeContext = {
  label: string;
  detail: string;
  backHref: string;
};

export type ChapterLeaderCommandCenterSuccessionCandidate = {
  id: string;
  displayName: string;
  currentRole: string;
  committeeLabel: string;
  pointsLabel: string;
  readinessLabel: string;
  badgeLabel: string;
  reason: string;
  href: string;
  isSelected: boolean;
};

export type ChapterLeaderCommandCenterSuccessionOverview = {
  eboardRolesFilledLabel: string;
  activeCommitteesLabel: string;
  candidatesIdentifiedLabel: string;
  transitionReadinessLabel: string;
  transitionReadinessNote: string;
};

export type ChapterLeaderCommandCenterSuccessionGap = {
  severity: "high" | "medium" | "low";
  title: string;
  summary: string;
  actionLabel: string;
};

export type ChapterLeaderCommandCenterSuccessionTimelineItem = {
  dateLabel: string;
  title: string;
  summary: string;
};

export type ChapterLeaderCommandCenterSourceContext = {
  eyebrow: string;
  title: string;
  summary: string;
  preview?: {
    heading: string;
    chapterLabel: string;
    stats: Array<{
      label: string;
      value: string;
      note: string;
    }>;
    sections: Array<{
      title: string;
      summary: string;
      href: string;
      hrefLabel: string;
    }>;
  };
  actions?: Array<{
    label: string;
    href: string;
  }>;
};

export type ChapterLeaderCommandCenterSource =
  | "overview"
  | "member_home"
  | "events"
  | "member_profile"
  | "bridge_videos"
  | "feed_analytics"
  | "impact"
  | "leaderboard"
  | "leaders"
  | "succession"
  | "values"
  | "training";

export type ChapterLeaderCommandCenter = {
  canReadCommandCenter: boolean;
  chapterName: string;
  campusLabel: string;
  regionLabel: string;
  coachLabel: string;
  activeCampaignLabel: string;
  activeProgramLabels: string[];
  sidebarLeaderLabel: string;
  sidebarLeaderRoleLabel: string;
  summary: string;
  sampleLabel: string | null;
  selectedSource: ChapterLeaderCommandCenterSource | null;
  sourceContext: ChapterLeaderCommandCenterSourceContext | null;
  navigationMemberId: string | null;
  selectedView: ChapterLeaderCommandCenterView;
  hasExplicitMemberSelection: boolean;
  selectedMemberId: string | null;
  selectedCommitteeId: string | null;
  selectedLeaderboardMetric: ChapterLeaderLeaderboardMetricKey;
  selectedLeaderboardRegion: ChapterLeaderLeaderboardRegionKey;
  selectedBestPracticeChapterId: string | null;
  selectedBestPracticeChapter: ChapterLeaderCommandCenterLeaderboardChapter | null;
  selectedImpactHighlightId: string | null;
  selectedImpactHighlight: ChapterLeaderCommandCenterImpactHighlight | null;
  selectedPipelineFilter: ChapterLeaderPipelineFilter;
  selectedEventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
  selectedEventId: string | null;
  selectedBridgeVideoFilter: ChapterLeaderBridgeVideoFilterKey;
  selectedBridgeVideoId: string | null;
  selectedFeedPostId: string | null;
  pipelineSearchQuery: string;
  pipelineTotalCount: number;
  activeQuickAction: ChapterLeaderQuickActionState | null;
  viewOptions: ChapterLeaderCommandCenterViewOption[];
  navGroups: ChapterLeaderCommandCenterNavGroup[];
  pipelineFilterOptions: ChapterLeaderPipelineFilterOption[];
  healthScore: number;
  healthTone: ChapterLeaderCommandCenterTone;
  healthNote: string;
  chapterPointsTrend: ChapterLeaderCommandCenterTrendPoint[];
  leaderboardRegionLabel: string;
  leaderboardRegionOptions: ChapterLeaderCommandCenterLeaderboardRegionOption[];
  leaderboardFilters: ChapterLeaderCommandCenterLeaderboardFilter[];
  leaderboardIdeaNote: string;
  leaderboardChapters: ChapterLeaderCommandCenterLeaderboardChapter[];
  metrics: ChapterLeaderCommandCenterMetric[];
  quickActions: ChapterLeaderCommandCenterQuickAction[];
  weeklyPriority: ChapterLeaderCommandCenterWeeklyPriority | null;
  leadershipRoles: ChapterLeaderCommandCenterLeadershipRole[];
  riskAlerts: ChapterLeaderCommandCenterRiskAlert[];
  pipelineItems: ChapterLeaderCommandCenterPipelineItem[];
  pipelineRows: ChapterLeaderCommandCenterPipelineRow[];
  pipelineSnapshots: ChapterLeaderCommandCenterPipelineSnapshot[];
  selectedMember: ChapterLeaderCommandCenterMemberProfile | null;
  committees: ChapterLeaderCommandCenterCommitteeCard[];
  selectedCommittee: ChapterLeaderCommandCenterCommitteeCard | null;
  committeesOverview: ChapterLeaderCommandCenterCommitteesOverview;
  eventCommitteeFilters: ChapterLeaderCommandCenterEventCommitteeFilter[];
  events: ChapterLeaderCommandCenterEventCard[];
  selectedEvent: ChapterLeaderCommandCenterEventCard | null;
  eventsOverview: ChapterLeaderCommandCenterEventsOverview;
  socialRecruitingMetrics: ChapterLeaderCommandCenterSocialRecruitingMetric[];
  impactCards: ChapterLeaderCommandCenterMetric[];
  impactHighlights: ChapterLeaderCommandCenterImpactHighlight[];
  localImpactStats: ChapterLeaderCommandCenterImpactStat[];
  globalImpactStats: ChapterLeaderCommandCenterImpactStat[];
  campaignImpactOverview: ChapterLeaderCommandCenterCampaignImpactOverview | null;
  bridgeStories: ChapterLeaderCommandCenterBridgeStory[];
  bridgeVideoMetrics: ChapterLeaderCommandCenterBridgeVideoMetric[];
  bridgeVideoFilters: ChapterLeaderCommandCenterBridgeVideoFilter[];
  bridgeVideoEntries: ChapterLeaderCommandCenterBridgeVideoEntry[];
  selectedBridgeVideo: ChapterLeaderCommandCenterBridgeVideoEntry | null;
  bridgeVideoCultureNote: string;
  feedAnalyticsBridgeContext: ChapterLeaderCommandCenterFeedAnalyticsBridgeContext | null;
  feedInsights: ChapterLeaderCommandCenterFeedInsight[];
  feedMetrics: ChapterLeaderCommandCenterFeedMetric[];
  feedChartRows: ChapterLeaderCommandCenterFeedChartRow[];
  feedPostRows: ChapterLeaderCommandCenterFeedPostRow[];
  selectedFeedPost: ChapterLeaderCommandCenterFeedPostRow | null;
  mostEngagedMembers: ChapterLeaderCommandCenterFeedMemberRow[];
  leastEngagedMembers: ChapterLeaderCommandCenterFeedMemberRow[];
  successionCandidates: ChapterLeaderCommandCenterSuccessionCandidate[];
  successionOverview: ChapterLeaderCommandCenterSuccessionOverview;
  successionGaps: ChapterLeaderCommandCenterSuccessionGap[];
  successionTimeline: ChapterLeaderCommandCenterSuccessionTimelineItem[];
  leaderboard: LeaderboardRow[];
  safetyNote: string;
};

export type ChapterLeaderCommandCenterOptions = {
  source?: string;
  view?: string;
  memberId?: string;
  committeeId?: string;
  eventCommittee?: string;
  leaderboardMetric?: string;
  leaderboardRegion?: string;
  bestPracticeChapterId?: string;
  impactStory?: string;
  pipeline?: string;
  search?: string;
  bridgeFilter?: string;
  eventId?: string;
  bridgeVideoId?: string;
  feedPostId?: string;
  quickAction?: string;
};

const mockLeaderProfileId = "member-sofia-profile";

const commandCenterViewLabels: Record<ChapterLeaderCommandCenterView, string> = {
  overview: "Chapter Home",
  leaderboard: "Chapter Leaderboard",
  leaders: "Current Leaders",
  members: "Member Leaderboard",
  member_profile: "Member Profile",
  committees: "Event Committees",
  events: "Event Performance",
  impact: "Impact",
  bridge_videos: "Bridge Videos",
  succession: "Succession",
  values: "Values",
  training: "Leadership Training",
  feed: "Feed Analytics",
  feed_analytics: "Feed Analytics",
};

const pipelineFilterLabels: Record<ChapterLeaderPipelineFilter, string> = {
  all: "All Pipeline Levels",
  e_board: "E-Board",
  chair: "Chair",
  chair_candidate: "Chair candidate",
  active_contributor: "Active contributor",
  general_member: "General member",
  follow_up: "Needs Follow-Up",
  ready: "Ready Now",
  emerging: "Emerging Leaders",
  contributors: "Contributors",
};

const leaderboardMetricLabels: Record<ChapterLeaderLeaderboardMetricKey, string> = {
  chapter_health: "Chapter Health",
  events_created: "Events Created",
  active_members: "Active Members",
  attendance: "Attendance %",
  evidence: "Evidence",
  bridge_videos: "Bridge Videos",
  funds_raised: "Funds Raised",
  slt_participants: "SLT Participants",
};

const leaderboardRegionLabels: Record<ChapterLeaderLeaderboardRegionKey, string> = {
  all: "All Regions",
  current_region: "Current Region",
  united_states: "United States",
  canada: "Canada",
};

const eventCommitteeFilterLabels: Record<ChapterLeaderEventCommitteeFilterKey, string> = {
  all: "All Committees",
  events: "Events",
  slt_promotion: "SLT Promotion",
  recruitment: "Recruitment",
  fundraising: "Fundraising",
  service: "Service",
  comms: "Comms",
};

const mockChapterLeaderSample = {
  chapterName: "Boston College MEDLIFE",
  campusLabel: "Boston College",
  regionLabel: "New England",
  coachLabel: "Cam Coach",
  activeCampaignLabel: "Moving Mountains 🏔",
  activeProgramLabels: ["Rush Month", "Moving Mountains", "SLT Promotion"],
  sidebarLeaderLabel: "Sofia Reyes",
  sidebarLeaderRoleLabel: "President",
  sampleLabel: "Boston College sample surface",
};

const mockCommandCenterPipelineMembers: ChapterMemberRow[] = [
  {
    id: "member-sofia-president",
    displayName: "Sofia Reyes",
    email: "sofia.reyes@mymedlife.test",
    roleKey: "president_vp",
    roleLabel: "President",
    committeeLane: "Executive Board",
    membershipStatus: "approved",
    points: 1240,
    completedActions: 24,
    openAssignments: 0,
    proofStatus: "approved",
    nextStep: "Mentor successors and submit the transition bridge video.",
  },
  {
    id: "member-marcus",
    displayName: "Marcus Chen",
    email: "marcus.chen@mymedlife.test",
    roleKey: "e_board_member",
    roleLabel: "VP of Events",
    committeeLane: "Executive Board",
    membershipStatus: "approved",
    points: 1085,
    completedActions: 19,
    openAssignments: 0,
    proofStatus: "approved",
    nextStep: "Submit a bridge video for the events transition.",
  },
  {
    id: "member-amara",
    displayName: "Amara Okonkwo",
    email: "amara.okonkwo@mymedlife.test",
    roleKey: "action_committee_chair",
    roleLabel: "Fundraising Chair",
    committeeLane: "Fundraising",
    membershipStatus: "approved",
    points: 920,
    completedActions: 18,
    openAssignments: 1,
    proofStatus: "approved",
    nextStep: "Strong E-Board candidate - nominate this week.",
  },
  {
    id: "member-jordan",
    displayName: "Jordan Kim",
    email: "jordan.kim@mymedlife.test",
    roleKey: "action_committee_chair",
    roleLabel: "Recruitment Chair",
    committeeLane: "Recruitment",
    membershipStatus: "approved",
    points: 875,
    completedActions: 16,
    openAssignments: 1,
    proofStatus: "approved",
    nextStep: "Promote to Chair - ready now.",
  },
  {
    id: "member-priya-sharma",
    displayName: "Priya Sharma",
    email: "priya.sharma@mymedlife.test",
    roleKey: "action_committee_chair",
    roleLabel: "Comms Chair",
    committeeLane: "Proof",
    membershipStatus: "approved",
    points: 810,
    completedActions: 14,
    openAssignments: 1,
    proofStatus: "approved",
    nextStep: "Submit evidence for 3 open actions.",
  },
  {
    id: "member-deshawn",
    displayName: "DeShawn Williams",
    email: "deshawn.williams@mymedlife.test",
    roleKey: "action_committee_chair",
    roleLabel: "SLT Promotions Chair",
    committeeLane: "Recruitment",
    membershipStatus: "approved",
    points: 745,
    completedActions: 15,
    openAssignments: 1,
    proofStatus: "approved",
    nextStep: "Host the SLT info session this week.",
  },
];

type MockPipelineRowOverride = {
  lastActiveLabel: string;
  points: number;
  weeklyMovementLabel: string;
  eventsMadeLabel: string;
  attendanceLabel: string;
  chapterShareLabel: string;
  actionsLabel: string;
  evidenceLabel: string;
  bridgeLabel: string;
  fundraisingLabel: string;
  valuesLabel: string;
  pipelineLabel: string;
  nextStepLabel: string;
};

const mockPipelineRowOverrides: Record<string, MockPipelineRowOverride> = {
  "member-sofia-president": {
    lastActiveLabel: "Today",
    points: 1240,
    weeklyMovementLabel: "85",
    eventsMadeLabel: "8",
    attendanceLabel: "18",
    chapterShareLabel: "94%",
    actionsLabel: "24",
    evidenceLabel: "19",
    bridgeLabel: "3",
    fundraisingLabel: "$1,200",
    valuesLabel: "Values Aligned",
    pipelineLabel: "E-Board",
    nextStepLabel: "Mentor successors & submit bridge video",
  },
  "member-marcus": {
    lastActiveLabel: "Today",
    points: 1085,
    weeklyMovementLabel: "67",
    eventsMadeLabel: "11",
    attendanceLabel: "16",
    chapterShareLabel: "84%",
    actionsLabel: "19",
    evidenceLabel: "15",
    bridgeLabel: "2",
    fundraisingLabel: "$850",
    valuesLabel: "Values Aligned",
    pipelineLabel: "E-Board",
    nextStepLabel: "Submit bridge video for events transition",
  },
  "member-amara": {
    lastActiveLabel: "Yesterday",
    points: 920,
    weeklyMovementLabel: "55",
    eventsMadeLabel: "3",
    attendanceLabel: "14",
    chapterShareLabel: "73%",
    actionsLabel: "18",
    evidenceLabel: "14",
    bridgeLabel: "1",
    fundraisingLabel: "$2,100",
    valuesLabel: "Values Aligned",
    pipelineLabel: "Chair",
    nextStepLabel: "Strong E-Board candidate - nominate",
  },
  "member-jordan": {
    lastActiveLabel: "Today",
    points: 875,
    weeklyMovementLabel: "62",
    eventsMadeLabel: "5",
    attendanceLabel: "15",
    chapterShareLabel: "78%",
    actionsLabel: "16",
    evidenceLabel: "12",
    bridgeLabel: "2",
    fundraisingLabel: "$400",
    valuesLabel: "Values Aligned",
    pipelineLabel: "Chair candidate",
    nextStepLabel: "Promote to Chair - ready now",
  },
  "member-priya-sharma": {
    lastActiveLabel: "Today",
    points: 810,
    weeklyMovementLabel: "48",
    eventsMadeLabel: "2",
    attendanceLabel: "13",
    chapterShareLabel: "68%",
    actionsLabel: "14",
    evidenceLabel: "11",
    bridgeLabel: "4",
    fundraisingLabel: "$300",
    valuesLabel: "Values Aligned",
    pipelineLabel: "Chair",
    nextStepLabel: "Submit evidence for 3 open actions",
  },
  "member-deshawn": {
    lastActiveLabel: "2 days ago",
    points: 745,
    weeklyMovementLabel: "71",
    eventsMadeLabel: "4",
    attendanceLabel: "12",
    chapterShareLabel: "63%",
    actionsLabel: "15",
    evidenceLabel: "10",
    bridgeLabel: "1",
    fundraisingLabel: "$200",
    valuesLabel: "Values Aligned",
    pipelineLabel: "Chair",
    nextStepLabel: "Host SLT info session this week",
  },
};

const commandCenterNavGroups: ChapterLeaderCommandCenterNavGroup[] = [
  {
    label: "Chapter",
    viewKeys: ["overview", "leaderboard", "feed_analytics"],
  },
  {
    label: "Members",
    viewKeys: ["members", "member_profile"],
  },
  {
    label: "Operations",
    viewKeys: ["committees", "events"],
  },
  {
    label: "Impact & Culture",
    viewKeys: ["impact", "bridge_videos"],
  },
  {
    label: "Leadership",
    viewKeys: ["leaders", "succession", "values", "training"],
  },
];

const chapterPointsTrendSample: ChapterLeaderCommandCenterTrendPoint[] = [
  { label: "Apr W1", value: 920 },
  { label: "Apr W2", value: 1080 },
  { label: "Apr W3", value: 1010 },
  { label: "Apr W4", value: 1180 },
  { label: "May W1", value: 1240 },
  { label: "May W2", value: 1320 },
  { label: "May W3", value: 1410 },
  { label: "May W4", value: 1490 },
  { label: "Jun W1", value: 1560 },
  { label: "Jun W2", value: 1620 },
];

const memberProfileDetailById: Record<string, Omit<
  ChapterLeaderCommandCenterMemberProfile,
  | "id"
  | "displayName"
  | "roleLabel"
  | "committeeLane"
  | "pipelineLabel"
  | "points"
  | "completedActions"
  | "openAssignments"
  | "proofStatus"
  | "nextStep"
  | "recognition"
  | "readinessLabel"
  | "reviewContext"
  | "backToContextLabel"
  | "backToContextHref"
  | "profileHref"
  | "backToPipelineHref"
>> = {
  "member-sofia-president": {
    weeklyPointsDeltaLabel: "+85 this week",
    eventsCreatedLabel: "8 this semester",
    bridgeVideosLabel: "3 submitted",
    badgeLabel: "Strong E-Board candidate",
    lastActiveLabel: "Today",
    sltInterestLabel: "Yes — signed up",
    volunteerHoursLabel: "12 hrs",
    fundraisingLabel: "$1,200",
    engagementLabel: "94%",
    valuesAlignment: [
      {
        label: "Impeccable Character",
        summary: "Reliable, accountable, shows up consistently. Well-regarded by peers across the chapter.",
      },
      {
        label: "Fire / Agency",
        summary: "Proactively creates events and recruits members without prompting. High initiative.",
      },
      {
        label: "Growth",
        summary: "Actively seeks coaching, reflection, and feedback. Embraces hard conversations.",
      },
    ],
    pointsHistory: [
      { label: "Apr W1", value: 920 },
      { label: "Apr W2", value: 980 },
      { label: "Apr W3", value: 1015 },
      { label: "Apr W4", value: 1080 },
      { label: "May W1", value: 1125 },
      { label: "May W2", value: 1160 },
      { label: "May W3", value: 1185 },
      { label: "May W4", value: 1205 },
      { label: "Jun W1", value: 1220 },
      { label: "Jun W2", value: 1240 },
    ],
    activityTimeline: [
      { dateLabel: "Jun 12", detail: "Attended SLT Interest Meeting" },
      { dateLabel: "Jun 10", detail: "Created Moving Mountains Kickoff event" },
      { dateLabel: "Jun 8", detail: "Submitted evidence for 3 actions" },
      { dateLabel: "Jun 3", detail: "Completed fundraising action — $420 raised" },
      { dateLabel: "May 29", detail: "Promoted to committee co-lead" },
      { dateLabel: "May 22", detail: "Submitted bridge video: Info Night Guide" },
    ],
    leaderNotes: [
      {
        dateLabel: "Jun 8, 2025",
        authorLabel: "Sofia Reyes (President)",
        body: "Sofia Reyes is consistently one of the most dependable members of this chapter. Shows up, follows through, and brings others along. Values interview recommended before end of June. Strong candidate for a larger role next semester.",
      },
    ],
    leadershipActions: [
      { label: "Promote to Chair", href: "/leader?view=succession&member=member-sofia-president", tone: "primary" },
      { label: "Schedule Values Interview", href: "/leader?view=member_profile&member=member-sofia-president&quickAction=schedule_values_interview", tone: "secondary" },
      { label: "Open Event Context", href: "/leader?view=member_profile&member=member-sofia-president&quickAction=assign_leadership_action", tone: "secondary" },
      { label: "Nominate for E-Board", href: "/leader?view=succession&member=member-sofia-president", tone: "secondary" },
      { label: "Add Note", href: "/leader?view=member_profile&member=member-sofia-president&quickAction=add_leader_note", tone: "secondary" },
    ],
  },
  "member-zara": {
    weeklyPointsDeltaLabel: "+18 this week",
    eventsCreatedLabel: "3 this semester",
    bridgeVideosLabel: "1 submitted",
    badgeLabel: "Strong E-Board candidate",
    lastActiveLabel: "Today",
    sltInterestLabel: "Yes - signed up",
    volunteerHoursLabel: "9 hrs",
    fundraisingLabel: "$320",
    engagementLabel: "81%",
    valuesAlignment: [
      {
        label: "Reliable follow-through",
        summary: "Keeps Med Talk prep moving and usually closes the loop on assigned work.",
      },
      {
        label: "Growing stage presence",
        summary: "Can already host a volunteer-facing segment and pull quieter members into the room.",
      },
      {
        label: "Needs systems reps",
        summary: "Best next step is owning one full event-to-proof cycle instead of only one part of it.",
      },
    ],
    pointsHistory: [
      { label: "Apr W1", value: 42 },
      { label: "Apr W2", value: 50 },
      { label: "Apr W3", value: 46 },
      { label: "Apr W4", value: 58 },
      { label: "May W1", value: 65 },
      { label: "May W2", value: 72 },
      { label: "May W3", value: 68 },
      { label: "May W4", value: 74 },
      { label: "Jun W1", value: 81 },
      { label: "Jun W2", value: 86 },
    ],
    activityTimeline: [
      { dateLabel: "Jun 14", detail: "Closed Med Talk speaker logistics for the next volunteer training." },
      { dateLabel: "Jun 11", detail: "Submitted follow-up notes from the storytelling workshop." },
      { dateLabel: "Jun 8", detail: "Completed proof follow-up for the last Med Talk event." },
      { dateLabel: "Jun 3", detail: "Created the next Med Talk agenda and owner checklist." },
    ],
    leaderNotes: [
      {
        dateLabel: "Jun 9, 2025",
        authorLabel: "Sofia Reyes (President)",
        body: "Zara is already acting like an owner inside Med Talk. The next test is whether she can lead one full event cycle and coach a newer member through the follow-up.",
      },
    ],
    leadershipActions: [
      { label: "Promote to Chair", href: "/leader?view=succession&member=member-zara", tone: "primary" },
      { label: "Schedule Values Interview", href: "/leader?view=members&member=member-zara", tone: "secondary" },
      { label: "Open Event Context", href: "/rush-month/actions", tone: "secondary" },
      { label: "Nominate for E-Board", href: "/leader?view=succession&member=member-zara", tone: "secondary" },
      { label: "Add Note", href: "/leader?view=member_profile&member=member-zara&quickAction=add_leader_note", tone: "secondary" },
    ],
  },
  "member-ivy": {
    weeklyPointsDeltaLabel: "+12 this week",
    eventsCreatedLabel: "1 this semester",
    bridgeVideosLabel: "0 submitted",
    badgeLabel: "Needs follow-up before promotion",
    lastActiveLabel: "Yesterday",
    sltInterestLabel: "Maybe - needs follow-up",
    volunteerHoursLabel: "4 hrs",
    fundraisingLabel: "$90",
    engagementLabel: "57%",
    valuesAlignment: [
      {
        label: "Good recruiting energy",
        summary: "Ivy brings people in and is warm in one-to-one outreach.",
      },
      {
        label: "Needs consistency proof",
        summary: "Still has open actions and needs to show follow-through before a larger lane opens.",
      },
      {
        label: "Coach with specificity",
        summary: "A concrete growth action and a deadline will tell us more than a vague encouragement note.",
      },
    ],
    pointsHistory: [
      { label: "Apr W1", value: 14 },
      { label: "Apr W2", value: 19 },
      { label: "Apr W3", value: 16 },
      { label: "Apr W4", value: 22 },
      { label: "May W1", value: 24 },
      { label: "May W2", value: 20 },
      { label: "May W3", value: 27 },
      { label: "May W4", value: 29 },
      { label: "Jun W1", value: 33 },
      { label: "Jun W2", value: 36 },
    ],
    activityTimeline: [
      { dateLabel: "Jun 13", detail: "Opened two recruitment actions but still needs proof on both." },
      { dateLabel: "Jun 10", detail: "Attended Moving Mountains kickoff and brought one new student." },
      { dateLabel: "Jun 7", detail: "Follow-up message drafted but not yet sent." },
      { dateLabel: "Jun 2", detail: "Joined recruitment lane check-in and asked for clearer ownership." },
    ],
    leaderNotes: [
      {
        dateLabel: "Jun 8, 2025",
        authorLabel: "Sofia Reyes (President)",
        body: "Ivy has real people energy, but she still needs one clean win with follow-through before we treat her like a chair candidate.",
      },
    ],
    leadershipActions: [
      { label: "Promote to Chair", href: "/leader?view=succession&member=member-ivy", tone: "secondary" },
      { label: "Schedule Values Interview", href: "/leader?view=members&member=member-ivy&pipeline=follow_up", tone: "primary" },
      { label: "Open Event Context", href: "/rush-month/actions", tone: "secondary" },
      { label: "Nominate for E-Board", href: "/leader?view=succession&member=member-ivy", tone: "secondary" },
      { label: "Add Note", href: "/leader?view=member_profile&member=member-ivy&quickAction=add_leader_note", tone: "secondary" },
    ],
  },
  "member-maya": {
    weeklyPointsDeltaLabel: "+15 this week",
    eventsCreatedLabel: "0 this semester",
    bridgeVideosLabel: "0 submitted",
    badgeLabel: "Emerging recruiter",
    lastActiveLabel: "Today",
    sltInterestLabel: "Yes - curious",
    volunteerHoursLabel: "5 hrs",
    fundraisingLabel: "$75",
    engagementLabel: "64%",
    valuesAlignment: [
      { label: "Welcoming tone", summary: "Makes first-time members feel included quickly." },
      { label: "Needs ownership reps", summary: "Still early in turning enthusiasm into repeatable ownership." },
      { label: "Worth coaching", summary: "Could become a strong recruitment lead with one well-scoped action lane." },
    ],
    pointsHistory: [
      { label: "Apr W1", value: 10 },
      { label: "Apr W2", value: 12 },
      { label: "Apr W3", value: 15 },
      { label: "Apr W4", value: 16 },
      { label: "May W1", value: 18 },
      { label: "May W2", value: 20 },
      { label: "May W3", value: 24 },
      { label: "May W4", value: 28 },
      { label: "Jun W1", value: 31 },
      { label: "Jun W2", value: 35 },
    ],
    activityTimeline: [
      { dateLabel: "Jun 12", detail: "Submitted invite-push testimonial draft for review." },
      { dateLabel: "Jun 9", detail: "Worked the Rush Month recruitment table with Ivy." },
      { dateLabel: "Jun 5", detail: "Completed first outreach action independently." },
    ],
    leaderNotes: [
      {
        dateLabel: "Jun 6, 2025",
        authorLabel: "Marcus Chen (VP of Events)",
        body: "Maya is early, but her energy is real. Give her one visible lane and keep the ask small enough that she can win it cleanly.",
      },
    ],
    leadershipActions: [
      { label: "Promote to Chair", href: "/leader?view=succession&member=member-maya", tone: "secondary" },
      { label: "Schedule Values Interview", href: "/leader?view=members&member=member-maya", tone: "secondary" },
      { label: "Open Event Context", href: "/rush-month/actions", tone: "primary" },
      { label: "Nominate for E-Board", href: "/leader?view=succession&member=member-maya", tone: "secondary" },
      { label: "Add Note", href: "/leader?view=member_profile&member=member-maya&quickAction=add_leader_note", tone: "secondary" },
    ],
  },
  "member-leo": {
    weeklyPointsDeltaLabel: "+22 this week",
    eventsCreatedLabel: "4 this semester",
    bridgeVideosLabel: "2 submitted",
    badgeLabel: "Executive owner",
    lastActiveLabel: "Today",
    sltInterestLabel: "Already mentoring",
    volunteerHoursLabel: "10 hrs",
    fundraisingLabel: "$640",
    engagementLabel: "88%",
    valuesAlignment: [
      { label: "Steady executive presence", summary: "Leo is already operating as a visible second owner." },
      { label: "Build more successors", summary: "The next unlock is mentoring a chair, not just carrying more himself." },
      { label: "Event systems strength", summary: "Good candidate to codify event follow-up norms for the whole chapter." },
    ],
    pointsHistory: [
      { label: "Apr W1", value: 30 },
      { label: "Apr W2", value: 36 },
      { label: "Apr W3", value: 41 },
      { label: "Apr W4", value: 44 },
      { label: "May W1", value: 49 },
      { label: "May W2", value: 55 },
      { label: "May W3", value: 59 },
      { label: "May W4", value: 64 },
      { label: "Jun W1", value: 71 },
      { label: "Jun W2", value: 79 },
    ],
    activityTimeline: [
      { dateLabel: "Jun 12", detail: "Closed event owner assignments for the next two campaigns." },
      { dateLabel: "Jun 10", detail: "Published attendance follow-up checklist for leaders." },
      { dateLabel: "Jun 6", detail: "Recorded a transition note for event operations." },
    ],
    leaderNotes: [
      {
        dateLabel: "Jun 10, 2025",
        authorLabel: "Sofia Reyes (President)",
        body: "Leo is reliable enough that he can hold the event lane, but I want him using that strength to build one more owner this cycle.",
      },
    ],
    leadershipActions: [
      { label: "Promote to Chair", href: "/leader?view=succession&member=member-leo", tone: "secondary" },
      { label: "Schedule Values Interview", href: "/leader?view=members&member=member-leo", tone: "secondary" },
      { label: "Open Event Context", href: "/rush-month/actions", tone: "primary" },
      { label: "Nominate for E-Board", href: "/leader?view=succession&member=member-leo", tone: "primary" },
      { label: "Add Note", href: "/leader?view=member_profile&member=member-leo&quickAction=add_leader_note", tone: "secondary" },
    ],
  },
  "member-nina": {
    weeklyPointsDeltaLabel: "+17 this week",
    eventsCreatedLabel: "2 this semester",
    bridgeVideosLabel: "1 submitted",
    badgeLabel: "Chair with coaching need",
    lastActiveLabel: "Yesterday",
    sltInterestLabel: "Yes - considering",
    volunteerHoursLabel: "7 hrs",
    fundraisingLabel: "$210",
    engagementLabel: "72%",
    valuesAlignment: [
      { label: "Strong content instincts", summary: "Nina sees what will resonate, especially in story framing." },
      { label: "Needs proof clarity", summary: "Her best work still needs cleaner evidence and sharper explanation." },
      { label: "Responsive to coaching", summary: "She improves when the feedback is concrete and time-bound." },
    ],
    pointsHistory: [
      { label: "Apr W1", value: 22 },
      { label: "Apr W2", value: 25 },
      { label: "Apr W3", value: 29 },
      { label: "Apr W4", value: 31 },
      { label: "May W1", value: 35 },
      { label: "May W2", value: 38 },
      { label: "May W3", value: 36 },
      { label: "May W4", value: 41 },
      { label: "Jun W1", value: 44 },
      { label: "Jun W2", value: 48 },
    ],
    activityTimeline: [
      { dateLabel: "Jun 11", detail: "Received changes-requested feedback on a social proof submission." },
      { dateLabel: "Jun 8", detail: "Drafted the next student spotlight story set." },
      { dateLabel: "Jun 5", detail: "Co-led the comms planning retro." },
    ],
    leaderNotes: [
      {
        dateLabel: "Jun 9, 2025",
        authorLabel: "Cam Coach",
        body: "Nina is absolutely worth keeping close. The growth move is not more volume, it is making her evidence cleaner and more transferable.",
      },
    ],
    leadershipActions: [
      { label: "Promote to Chair", href: "/leader?view=succession&member=member-nina", tone: "secondary" },
      { label: "Schedule Values Interview", href: "/leader?view=members&member=member-nina", tone: "secondary" },
      { label: "Open Event Context", href: "/rush-month/actions", tone: "primary" },
      { label: "Nominate for E-Board", href: "/leader?view=succession&member=member-nina", tone: "secondary" },
      { label: "Add Note", href: "/leader?view=member_profile&member=member-nina&quickAction=add_leader_note", tone: "secondary" },
    ],
  },
  "member-omar": {
    weeklyPointsDeltaLabel: "+9 this week",
    eventsCreatedLabel: "1 this semester",
    bridgeVideosLabel: "0 submitted",
    badgeLabel: "Needs ownership reps",
    lastActiveLabel: "2 days ago",
    sltInterestLabel: "Not yet",
    volunteerHoursLabel: "6 hrs",
    fundraisingLabel: "$40",
    engagementLabel: "58%",
    valuesAlignment: [
      { label: "Service-first instinct", summary: "Omar shows up best when the work is concrete and local." },
      { label: "Needs follow-through lift", summary: "Still tends to stop at participation instead of closing loops." },
      { label: "Good committee builder", summary: "Could stabilize the local volunteering lane with stronger event ownership." },
    ],
    pointsHistory: [
      { label: "Apr W1", value: 12 },
      { label: "Apr W2", value: 16 },
      { label: "Apr W3", value: 18 },
      { label: "Apr W4", value: 20 },
      { label: "May W1", value: 23 },
      { label: "May W2", value: 22 },
      { label: "May W3", value: 24 },
      { label: "May W4", value: 27 },
      { label: "Jun W1", value: 28 },
      { label: "Jun W2", value: 31 },
    ],
    activityTimeline: [
      { dateLabel: "Jun 10", detail: "Named a volunteer-owner candidate for the next service event." },
      { dateLabel: "Jun 6", detail: "Attended committee check-in but left proof task unfinished." },
      { dateLabel: "Jun 1", detail: "Reviewed local volunteering attendance plan." },
    ],
    leaderNotes: [
      {
        dateLabel: "Jun 7, 2025",
        authorLabel: "Cam Coach",
        body: "Omar is solid and grounded, but his next growth step needs to include a public follow-through moment so the rest of the team can trust the handoff.",
      },
    ],
    leadershipActions: [
      { label: "Promote to Chair", href: "/leader?view=succession&member=member-omar", tone: "secondary" },
      { label: "Schedule Values Interview", href: "/leader?view=members&member=member-omar", tone: "secondary" },
      { label: "Open Event Context", href: "/rush-month/actions", tone: "primary" },
      { label: "Nominate for E-Board", href: "/leader?view=succession&member=member-omar", tone: "secondary" },
      { label: "Add Note", href: "/leader?view=member_profile&member=member-omar&quickAction=add_leader_note", tone: "secondary" },
    ],
  },
};

export function getChapterLeaderCommandCenter(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  options: ChapterLeaderCommandCenterOptions = {},
): ChapterLeaderCommandCenter {
  if (getActorSurfaceFamily(actor) !== "leader") {
    return emptyCommandCenter();
  }

  const workspace = getChapterMembershipWorkspace(actor, data);
  if (!workspace.canReadWorkspace) {
    return emptyCommandCenter();
  }

  const selectedView = parseChapterLeaderCommandCenterView(options.view);
  const selectedSource = parseChapterLeaderSource(options.source);
  const selectedPipelineFilter = parsePipelineFilter(options.pipeline);
  const selectedLeaderboardMetric = parseLeaderboardMetric(options.leaderboardMetric);
  const selectedLeaderboardRegion = parseLeaderboardRegion(options.leaderboardRegion);
  const selectedEventCommitteeFilter = parseEventCommitteeFilter(options.eventCommittee);
  const selectedBridgeVideoFilter = parseBridgeVideoFilter(options.bridgeFilter);
  const selectedFeedPostId = parseSelectedFeedPostId(options.feedPostId);
  const activeQuickAction = parseQuickActionState(options.quickAction);
  const pipelineSearchQuery = options.search?.trim() ?? "";
  const requestedBestPracticeChapterId = options.bestPracticeChapterId ?? null;
  const requestedEventId = options.eventId ?? null;
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const leaderActionsFocus = getLeaderActionsFocus(actor, data, visibleAssignments);
  const memberRoleFocus = getChapterMemberRoleFocus(actor, workspace);
  const recognition = getMemberRecognitionSummary(actor, data);
  const leadershipRoles = getLeadershipRoles(workspace.members);
  const commandCenterMembers = getCommandCenterMembers(data.source.mode, workspace.members);
  const unselectedPipelineRows = getPipelineRows(
    commandCenterMembers,
    recognition.leaderboard,
    {
      bestPracticeChapterId: requestedBestPracticeChapterId,
      eventCommitteeFilter: selectedEventCommitteeFilter,
      eventId: requestedEventId,
      filter: selectedPipelineFilter,
      leaderboardMetric: selectedLeaderboardMetric,
      leaderboardRegion: selectedLeaderboardRegion,
      searchQuery: pipelineSearchQuery,
      source: selectedSource,
      selectedMemberId: null,
    },
  );
  const requestedMemberId = getRequestedMemberId(commandCenterMembers, options.memberId);
  const fallbackSelectedMemberId = getSelectedMemberId(
    commandCenterMembers,
    options.memberId,
  );
  const visiblePipelineMemberId = getVisiblePipelineMemberId(
    unselectedPipelineRows,
    fallbackSelectedMemberId,
  );
  const selectedMemberProfileId =
    selectedView === "member_profile" &&
    data.source.mode === "mock" &&
    !requestedMemberId
      ? mockLeaderProfileId
      : visiblePipelineMemberId;
  const pipelineRows = getPipelineRows(
    commandCenterMembers,
    recognition.leaderboard,
    {
      bestPracticeChapterId: requestedBestPracticeChapterId,
      eventCommitteeFilter: selectedEventCommitteeFilter,
      eventId: requestedEventId,
      filter: selectedPipelineFilter,
      leaderboardMetric: selectedLeaderboardMetric,
      leaderboardRegion: selectedLeaderboardRegion,
      searchQuery: pipelineSearchQuery,
      source: selectedSource,
      selectedMemberId: selectedView === "members" ? visiblePipelineMemberId ?? null : null,
    },
  );
  const selectedMember = getSelectedMemberProfile(
    commandCenterMembers,
    recognition.leaderboard,
    selectedMemberProfileId,
    {
      bestPracticeChapterId: requestedBestPracticeChapterId,
      eventCommitteeFilter: selectedEventCommitteeFilter,
      eventId: requestedEventId,
      feedPostId: selectedFeedPostId,
      filter: selectedPipelineFilter,
      leaderboardMetric: selectedLeaderboardMetric,
      leaderboardRegion: selectedLeaderboardRegion,
      searchQuery: pipelineSearchQuery,
      source: selectedSource,
      sourceMode: data.source.mode,
    },
  );
  const successionCandidates = getSuccessionCandidates(
    workspace.members,
    recognition.leaderboard,
    data.source.mode,
    selectedView === "succession" && !requestedMemberId ? null : selectedMember?.id ?? null,
  );
  const navigationMemberId = getNavigationMemberId({
    requestedMemberId,
    selectedMemberId: selectedMember?.id ?? null,
    selectedSource,
    selectedView,
  });
  const quickActionMemberId =
    requestedMemberId && selectedMember
      ? selectedMember.id
      : selectedView === "members" ||
          selectedView === "member_profile" ||
          selectedView === "leaders" ||
          selectedView === "succession" ||
          selectedView === "values" ||
          selectedView === "training"
        ? selectedMember?.id ?? successionCandidates[0]?.id ?? null
        : null;
  const quickActionSource =
    selectedSource ?? (selectedView === "impact" ? "impact" : null);
  const committeeCards = getCommitteeCards(
    workspace.members,
    workspace.counts.proofFollowUps,
    data.source.mode,
  );
  const selectedCommitteeId = getSelectedCommitteeId(
    committeeCards,
    options.committeeId,
  );
  const requestedCommitteeId = getRequestedCommitteeId(
    committeeCards,
    options.committeeId,
  );
  const committees = committeeCards.map((committee) => ({
    ...committee,
    href: buildChapterLeaderCommandCenterHref("committees", {
      source: selectedSource,
      memberId: navigationMemberId,
      committeeId: committee.id,
      pipelineFilter: selectedPipelineFilter,
      searchQuery: pipelineSearchQuery,
    }),
  }));
  const selectedCommittee =
    committees.find((committee) => committee.id === selectedCommitteeId) ?? null;
  const eventCards = getEventCards(workspace.members, data.source.mode);
  const filteredEventCards = getFilteredEventCards(
    eventCards,
    selectedEventCommitteeFilter,
  );
  const events = filteredEventCards.map((event) => ({
    ...event,
    href: buildChapterLeaderCommandCenterHref("events", {
      source: selectedSource,
      memberId: navigationMemberId,
      pipelineFilter: selectedPipelineFilter,
      searchQuery: pipelineSearchQuery,
      eventCommitteeFilter: selectedEventCommitteeFilter,
      eventId: event.id,
    }),
  }));
  const selectedEventId = getSelectedEventId(events, options.eventId);
  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;
  const allProofItems = getProofLibraryItems();
  const bridgeStories = getBridgeStories(allProofItems);
  const feedInsights = getFeedInsights(allProofItems);
  const riskAlerts = getRiskAlerts({
    workspace,
    leadershipRoles,
    eventCount: eventCards.length,
  });
  const healthScore = getHealthScore({
    workspace,
    leadershipRoles,
  });
  const chapterDisplay =
    data.source.mode === "mock"
      ? mockChapterLeaderSample
      : {
          chapterName: data.chapter.name,
          campusLabel: data.chapter.campus,
          regionLabel: data.chapter.region,
          coachLabel: data.chapter.coachName,
          activeCampaignLabel: "Rush Month",
          activeProgramLabels: [data.campaign.name],
          sidebarLeaderLabel: actor.user.displayName,
          sidebarLeaderRoleLabel: getActorPrimaryRoleLabel(actor),
          sampleLabel: null,
        };
  const leaderboardChapters = getLeaderboardChapters(
    data.source.mode,
    {
      selectedMetric: selectedLeaderboardMetric,
      selectedRegion: selectedLeaderboardRegion,
      source: selectedSource,
      memberId: navigationMemberId,
      pipelineFilter: selectedPipelineFilter,
      searchQuery: pipelineSearchQuery,
      bestPracticeChapterId: options.bestPracticeChapterId,
    },
  );
  const selectedBestPracticeChapterId = getSelectedBestPracticeChapterId(
    leaderboardChapters,
    options.bestPracticeChapterId,
  );
  const selectedBestPracticeChapter =
    leaderboardChapters.find((chapter) => chapter.id === selectedBestPracticeChapterId) ?? null;
  const impactHighlights = getImpactHighlights(data.source.mode, {
    memberId: navigationMemberId,
    source: selectedSource,
  });
  const selectedImpactHighlightId = getSelectedImpactHighlightId(
    impactHighlights,
    options.impactStory,
  );
  const selectedImpactHighlight =
    impactHighlights.find((highlight) => highlight.id === selectedImpactHighlightId) ?? null;
  const quickActions = getQuickActions(
    quickActionMemberId,
    {
      source: quickActionSource,
      impactStoryId: selectedImpactHighlightId,
      pipelineFilter: selectedPipelineFilter,
      eventCommitteeFilter: selectedEventCommitteeFilter,
      searchQuery: pipelineSearchQuery,
      bridgeVideoFilter: selectedBridgeVideoFilter,
      feedPostId: selectedFeedPostId,
    },
  );
  const bridgeVideoEntries = getBridgeVideoEntries(
    data.source.mode,
    selectedBridgeVideoFilter,
    {
      source: selectedSource,
      memberId: navigationMemberId,
      bestPracticeChapterId: selectedBestPracticeChapterId,
      leaderboardMetric: selectedLeaderboardMetric,
      leaderboardRegion: selectedLeaderboardRegion,
      impactStoryId: selectedImpactHighlightId,
      pipelineFilter: selectedPipelineFilter,
      searchQuery: pipelineSearchQuery,
      feedPostId: selectedFeedPostId,
    },
  );
  const selectedBridgeVideoId = getSelectedBridgeVideoId(
    bridgeVideoEntries,
    options.bridgeVideoId,
  );
  const selectedBridgeVideo =
    bridgeVideoEntries.find((entry) => entry.id === selectedBridgeVideoId) ?? null;

  const feedPostRows = getFeedPostRows(data.source.mode, {
    source: selectedSource,
    memberId: navigationMemberId,
    bestPracticeChapterId: selectedBestPracticeChapterId,
    leaderboardMetric: selectedLeaderboardMetric,
    leaderboardRegion: selectedLeaderboardRegion,
    pipelineFilter: selectedPipelineFilter,
    searchQuery: pipelineSearchQuery,
    bridgeVideoFilter: selectedBridgeVideoFilter,
    selectedFeedPostId,
  });
  const selectedFeedPost =
    feedPostRows.find((row) => row.id === selectedFeedPostId) ?? null;
  const metrics = getMetrics({
    sourceMode: data.source.mode,
    committees,
    eventCards,
    leadershipRoles,
    recognition,
    workspace,
  });
  const pipelineSnapshots = getPipelineSnapshots(
    workspace.joinRequests.length,
    pipelineRows,
  );
  const followUpSnapshot =
    pipelineSnapshots.find((snapshot) => snapshot.label === "Needs follow-up") ?? null;
  const actionsCompletedMetric =
    metrics.find((metric) => metric.label === "Actions Completed") ?? null;
  const eventsOverview = getEventsOverview(data.source.mode, eventCards);
  const sourceContext = getChapterLeaderSourceContext(selectedSource, {
    originChapterName: data.chapter.name,
    selectedView,
    bridgeVideoFilter: selectedBridgeVideoFilter,
    feedPostId: selectedFeedPost?.id ?? null,
    feedPostTitle: selectedFeedPost?.title ?? null,
    impactStoryId: selectedImpactHighlightId,
    bestPracticeChapterId: selectedBestPracticeChapterId,
    leaderboardMetric: selectedLeaderboardMetric,
    leaderboardRegion: selectedLeaderboardRegion,
    eventCommitteeFilter: selectedEventCommitteeFilter,
    eventId: selectedEventId,
    memberId: navigationMemberId,
    pipelineFilter: selectedPipelineFilter,
    searchQuery: pipelineSearchQuery,
    activeMemberCount: workspace.counts.activeMembers,
    openAssignmentCount: workspace.counts.openAssignments,
    followUpCount: Number.parseInt(followUpSnapshot?.value ?? "0", 10) || 0,
    proofFollowUpCount: workspace.counts.proofFollowUps,
    visiblePipelineCount: pipelineRows.length,
    riskAlertCount: riskAlerts.length,
    firstRiskAlertHref: riskAlerts[0]?.href ?? null,
    actionsCompletedValue: actionsCompletedMetric?.value ?? "0",
    attendanceRateLabel: eventsOverview.attendanceRateLabel,
    eventsWithProofLabel: eventsOverview.eventsWithProofLabel,
  });

  return {
    canReadCommandCenter: true,
    chapterName: chapterDisplay.chapterName,
    campusLabel: chapterDisplay.campusLabel,
    regionLabel: chapterDisplay.regionLabel,
    coachLabel: chapterDisplay.coachLabel,
    activeCampaignLabel: chapterDisplay.activeCampaignLabel,
    activeProgramLabels: chapterDisplay.activeProgramLabels,
    sidebarLeaderLabel: chapterDisplay.sidebarLeaderLabel,
    sidebarLeaderRoleLabel: chapterDisplay.sidebarLeaderRoleLabel,
    summary:
      data.source.mode === "mock"
        ? "This desktop leadership view uses the Boston College sample framing on top of the current Rush Month mock-safe chapter data, so leaders can inspect people, committees, proof, events, and succession without turning on any writes."
        : "This leadership view keeps chapter health, owners, events, proof, recognition, and succession visible without turning on writes.",
    sampleLabel: chapterDisplay.sampleLabel,
    selectedSource,
    sourceContext,
    navigationMemberId,
    selectedView,
    hasExplicitMemberSelection: Boolean(requestedMemberId),
    selectedMemberId: selectedMember?.id ?? null,
    selectedCommitteeId: selectedCommittee?.id ?? null,
    selectedLeaderboardMetric,
    selectedLeaderboardRegion,
    selectedBestPracticeChapterId,
    selectedBestPracticeChapter,
    selectedImpactHighlightId,
    selectedImpactHighlight,
    selectedPipelineFilter,
    selectedEventCommitteeFilter,
    selectedEventId,
    selectedBridgeVideoFilter,
    selectedBridgeVideoId,
    selectedFeedPostId: selectedFeedPost?.id ?? null,
    pipelineSearchQuery,
    pipelineTotalCount: commandCenterMembers.length,
    activeQuickAction,
    viewOptions: getViewOptions({
      source: selectedSource,
      memberId: navigationMemberId,
      defaultProfileMemberId: requestedMemberId,
      committeeId: requestedCommitteeId,
      eventCommitteeFilter: selectedEventCommitteeFilter,
      eventId: selectedEventId,
      leaderboardMetric: selectedLeaderboardMetric,
      leaderboardRegion: selectedLeaderboardRegion,
      bestPracticeChapterId: selectedBestPracticeChapterId,
      impactStoryId: selectedImpactHighlightId,
      feedPostId: selectedFeedPost?.id ?? null,
      pipelineFilter: selectedPipelineFilter,
      searchQuery: pipelineSearchQuery,
      bridgeVideoFilter: selectedBridgeVideoFilter,
    }),
    navGroups: commandCenterNavGroups,
    pipelineFilterOptions: getPipelineFilterOptions({
      view: selectedView,
      source: selectedSource,
      memberId: selectedMember?.id ?? null,
      pipelineFilter: selectedPipelineFilter,
      searchQuery: pipelineSearchQuery,
    }),
    healthScore,
    healthTone: scoreToTone(healthScore),
    healthNote: getHealthNote({
      workspace,
      leadershipRoles,
    }),
    chapterPointsTrend: chapterPointsTrendSample,
    leaderboardRegionLabel: getLeaderboardRegionLabel(
      data.source.mode,
      selectedLeaderboardRegion,
    ),
    leaderboardRegionOptions: getLeaderboardRegionOptions(
      data.source.mode,
      selectedLeaderboardRegion,
      {
        source: selectedSource,
        memberId: navigationMemberId,
        pipelineFilter: selectedPipelineFilter,
        searchQuery: pipelineSearchQuery,
        leaderboardMetric: selectedLeaderboardMetric,
        bestPracticeChapterId: selectedBestPracticeChapterId,
        feedPostId: selectedFeedPostId,
      },
    ),
    leaderboardFilters: getLeaderboardFilters(data.source.mode, selectedLeaderboardMetric, {
      source: selectedSource,
      memberId: navigationMemberId,
      pipelineFilter: selectedPipelineFilter,
      searchQuery: pipelineSearchQuery,
      leaderboardRegion: selectedLeaderboardRegion,
    }),
    leaderboardIdeaNote: getLeaderboardIdeaNote(data.source.mode, selectedLeaderboardMetric),
    leaderboardChapters,
    metrics,
    quickActions,
    weeklyPriority: leaderActionsFocus.canReadFocus
      ? {
          title: getWeeklyPriorityTitle(actor),
          summary: getWeeklyPrioritySummary(
            actor,
            leaderActionsFocus.summary,
            memberRoleFocus.summary,
          ),
          primaryHref: leaderActionsFocus.primaryHref,
          primaryLabel: leaderActionsFocus.primaryLabel,
          secondaryHref: memberRoleFocus.primaryHref,
          secondaryLabel: memberRoleFocus.primaryLabel,
        }
      : null,
    leadershipRoles,
    riskAlerts,
    pipelineItems: getPipelineItems(workspace.joinRequests, workspace.members),
    pipelineRows,
    pipelineSnapshots,
    selectedMember,
    committees,
    selectedCommittee,
    committeesOverview: getCommitteesOverview(data.source.mode, committees),
    eventCommitteeFilters: getEventCommitteeFilters(
      eventCards,
      selectedEventCommitteeFilter,
      {
        source: selectedSource,
        memberId: navigationMemberId,
        pipelineFilter: selectedPipelineFilter,
        searchQuery: pipelineSearchQuery,
      },
    ),
    events,
    selectedEvent,
    eventsOverview,
    socialRecruitingMetrics: getSocialRecruitingMetrics(data.source.mode),
    impactCards: getImpactCards(recognition, bridgeStories.length),
    impactHighlights,
    localImpactStats: getLocalImpactStats(data.source.mode),
    globalImpactStats: getGlobalImpactStats(data.source.mode),
    campaignImpactOverview: getCampaignImpactOverview(data.source.mode),
    bridgeStories,
    bridgeVideoMetrics: getBridgeVideoMetrics(data.source.mode),
    bridgeVideoFilters: getBridgeVideoFilters(data.source.mode, {
      selectedFilter: selectedBridgeVideoFilter,
      source: selectedSource,
      memberId: navigationMemberId,
      bestPracticeChapterId: selectedBestPracticeChapterId,
      leaderboardMetric: selectedLeaderboardMetric,
      leaderboardRegion: selectedLeaderboardRegion,
      impactStoryId: selectedImpactHighlightId,
      pipelineFilter: selectedPipelineFilter,
      searchQuery: pipelineSearchQuery,
      feedPostId: selectedFeedPost?.id ?? null,
      activeQuickAction,
      selectedBridgeVideoId,
      selectedBridgeVideoCategoryLabel: selectedBridgeVideo?.categoryLabel ?? null,
    }),
    bridgeVideoEntries,
    selectedBridgeVideo,
    bridgeVideoCultureNote: getBridgeVideoCultureNote(data.source.mode),
    feedAnalyticsBridgeContext: getFeedAnalyticsBridgeContext(
      selectedBridgeVideoFilter,
      {
        memberId: navigationMemberId,
        pipelineFilter: selectedPipelineFilter,
        searchQuery: pipelineSearchQuery,
      },
    ),
    feedInsights,
    feedMetrics: getFeedMetrics(data.source.mode),
    feedChartRows: getFeedChartRows(data.source.mode),
    feedPostRows,
    selectedFeedPost,
    mostEngagedMembers: getMostEngagedMembers(data.source.mode),
    leastEngagedMembers: getLeastEngagedMembers(data.source.mode, {
      source: selectedSource,
      selectedFeedPostId: selectedFeedPost?.id ?? null,
      bestPracticeChapterId: selectedBestPracticeChapterId,
      leaderboardMetric: selectedLeaderboardMetric,
      leaderboardRegion: selectedLeaderboardRegion,
    }),
    successionCandidates,
    successionOverview: getSuccessionOverview(
      data.source.mode,
      leadershipRoles,
      committees,
      successionCandidates,
    ),
    successionGaps: getSuccessionGaps(data.source.mode, leadershipRoles, committees),
    successionTimeline: getSuccessionTimeline(data.source.mode),
    leaderboard: recognition.leaderboard,
    safetyNote: [leaderActionsFocus.safetyNote, memberRoleFocus.safetyNote]
      .filter(Boolean)
      .join(" "),
  };
}

function getChapterLeaderSourceContext(
  source: ChapterLeaderCommandCenterSource | null,
  context: {
    originChapterName: string;
    selectedView: ChapterLeaderCommandCenterView;
    bridgeVideoFilter: ChapterLeaderBridgeVideoFilterKey;
    feedPostId: string | null;
    feedPostTitle: string | null;
    impactStoryId: string | null;
    bestPracticeChapterId?: string | null;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    eventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
    eventId: string | null;
    memberId: string | null;
    pipelineFilter: ChapterLeaderPipelineFilter;
    searchQuery: string;
    activeMemberCount: number;
    openAssignmentCount: number;
    followUpCount: number;
    proofFollowUpCount: number;
    visiblePipelineCount: number;
    riskAlertCount: number;
    firstRiskAlertHref: string | null;
    actionsCompletedValue: string;
    attendanceRateLabel: string;
    eventsWithProofLabel: string;
  },
): ChapterLeaderCommandCenterSourceContext | null {
  switch (source) {
    case "member_home":
      return {
        eyebrow: "Member app handoff",
        title: `Opened from ${context.originChapterName} into Leader Hub`,
        summary:
          `This leadership view was opened from the ${context.originChapterName} member-home handoff. Keep the next move anchored to the student event loop: open events, confirm attendance, and watch points move without treating this like a disconnected dashboard.`,
        preview: {
          heading: "Leader Hub",
          chapterLabel: context.originChapterName,
          stats: [
            {
              label: "Members active",
              value: `${context.activeMemberCount}`,
              note: "Approved members currently visible to this chapter.",
            },
            {
              label: "Attendance rate",
              value: context.attendanceRateLabel,
              note: "Visible chapter event attendance this month.",
            },
            {
              label: "Events with proof",
              value: context.eventsWithProofLabel,
              note: "Event cadence that already shows visible follow-through.",
            },
            {
              label: "Follow-up needed",
              value: `${context.followUpCount}`,
              note: "Members or event moves still waiting for a leader decision.",
            },
          ],
          sections: [
            {
              title: "Event Pulse",
              summary: `${context.actionsCompletedValue} visible member actions, ${context.eventsWithProofLabel} events with proof, and ${context.attendanceRateLabel} attendance this month.`,
              href: buildChapterLeaderCommandCenterHref("overview", {
                source: "member_home",
              }),
              hrefLabel: "Open dashboard",
            },
            {
              title: "Risk Alerts",
              summary: `${context.riskAlertCount} active alerts still need a visible owner before the next chapter push.`,
              href:
                context.firstRiskAlertHref ??
                buildChapterLeaderCommandCenterHref("overview", {
                  source: "member_home",
                }),
              hrefLabel: "See alerts",
            },
            {
              title: "Member Status",
              summary: `${context.visiblePipelineCount} visible members are in the pipeline, and ${context.followUpCount} still need RSVP or follow-through attention.`,
              href: buildChapterLeaderCommandCenterHref("members", {
                source: "member_home",
              }),
              hrefLabel: "Review members",
            },
            {
              title: "Attendance Follow-Up",
              summary: `${context.proofFollowUpCount} attendance or proof follow-up items still need confirmation before points stay trustworthy.`,
              href: buildChapterLeaderCommandCenterHref("events", {
                source: "member_home",
                quickAction: "assign_action",
              }),
              hrefLabel: "Confirm attendance",
            },
          ],
        },
        actions: [
          {
            label: "Review members",
            href: buildChapterLeaderCommandCenterHref("members", {
              source: "member_home",
              quickAction: "review_members",
            }),
          },
          {
            label: "Confirm attendance",
            href: buildChapterLeaderCommandCenterHref("events", {
              source: "member_home",
              quickAction: "assign_action",
            }),
          },
          {
            label: "Open leaderboard",
            href: buildChapterLeaderCommandCenterHref("leaderboard", {
              source: "member_home",
              leaderboardMetric: "attendance",
            }),
          },
          {
            label: "Student view",
            href: buildStudentHomePreviewHref(),
          },
        ],
      };
    case "overview":
      return {
        eyebrow: "Chapter Home handoff",
        title:
          context.selectedView === "committees"
            ? "Opened from Chapter Home into committee follow-through"
            : context.selectedView === "leaderboard"
              ? "Opened from Chapter Home into leaderboard follow-through"
              : "Opened from Chapter Home into event follow-through",
        summary:
          context.selectedView === "committees"
            ? "This route was opened from Chapter Home so committee ownership, next-event readiness, and event follow-through stay anchored to the same leader shell instead of splitting into disconnected review lanes."
            : context.selectedView === "leaderboard"
              ? "This leaderboard route was opened from Chapter Home so attendance-backed points can be reviewed without losing the event-operations posture that surfaced the question."
              : "This route was opened from Chapter Home so create-event staging, attendance review, and leaderboard follow-through stay inside one visible leader workflow.",
        actions: [
          {
            label: "Back to Chapter Home",
            href: buildChapterLeaderCommandCenterHref("overview", {
              source: "overview",
              memberId: context.memberId,
              pipelineFilter: context.pipelineFilter,
              searchQuery: context.searchQuery,
            }),
          },
          {
            label: "Open Event Performance",
            href: buildChapterLeaderCommandCenterHref("events", {
              source: "overview",
              memberId: context.memberId,
              eventCommitteeFilter: context.eventCommitteeFilter,
              eventId: context.eventId,
            }),
          },
          {
            label: "Open leaderboard",
            href: buildChapterLeaderCommandCenterHref("leaderboard", {
              source: "overview",
              memberId: context.memberId,
              eventCommitteeFilter: context.eventCommitteeFilter,
              leaderboardMetric: "attendance",
            }),
          },
        ],
      };
    case "events":
      return {
        eyebrow: "Event review handoff",
        title:
          context.selectedView === "leaderboard"
            ? "Opened from event review into leaderboard follow-through"
            : "Opened from leader event review",
        summary:
          context.selectedView === "leaderboard"
            ? "This leaderboard route was opened from the leader event shell so attendance-backed points can be compared without losing the active event and committee context. Keep the event loop visible instead of flattening this into a disconnected ranking view."
            : "This route was opened from the leader event shell so attendance, follow-through, and leaderboard movement stay in one operating loop.",
        actions: [
          {
            label: "Back to event performance",
            href: buildChapterLeaderCommandCenterHref("events", {
              source: "events",
              memberId: context.memberId,
              eventCommitteeFilter: context.eventCommitteeFilter,
              eventId: context.eventId,
            }),
          },
          {
            label: "Confirm attendance",
            href: buildChapterLeaderCommandCenterHref("events", {
              source: "events",
              memberId: context.memberId,
              eventCommitteeFilter: context.eventCommitteeFilter,
              eventId: context.eventId,
              quickAction: "assign_action",
            }),
          },
        ],
      };
    case "bridge_videos":
      return {
        eyebrow: "Bridge video handoff",
        title:
          context.selectedView === "feed_analytics"
            ? "Opened from bridge-video review into feed planning"
            : "Opened from the bridge-video library",
        summary:
          context.selectedView === "feed_analytics"
            ? "This chapter-leader route was opened from the bridge-video library so a leader can place a real chapter story into feed planning without losing category context or the current library review lane."
            : "This chapter-leader route was opened from the bridge-video library. Keep the selected category and story-review context visible before it turns into a broader planning task.",
        actions: [
          {
            label: "Back to bridge videos",
            href: buildChapterLeaderCommandCenterHref("bridge_videos", {
              source: "bridge_videos",
              memberId: context.memberId,
              pipelineFilter: context.pipelineFilter,
              searchQuery: context.searchQuery,
              bridgeVideoFilter: context.bridgeVideoFilter,
            }),
          },
        ],
      };
    case "feed_analytics":
      switch (context.selectedView) {
        case "members":
        case "member_profile":
          return context.feedPostId && context.feedPostTitle
            ? {
                eyebrow: "Feed analytics handoff",
                title: "Opened from a selected feed post",
                summary: `This chapter-leader route was opened from "${context.feedPostTitle}" so the follow-up stays tied to the specific post that surfaced the re-engagement question. Keep that post context visible instead of flattening this into a generic member review.`,
                actions: [
                  {
                    label: "Back to selected post",
                    href: buildChapterLeaderCommandCenterHref("feed_analytics", {
                      source: "feed_analytics",
                      memberId: context.memberId,
                      pipelineFilter: context.pipelineFilter,
                      searchQuery: context.searchQuery,
                      feedPostId: context.feedPostId,
                    }),
                  },
                  {
                    label:
                      context.pipelineFilter === "follow_up"
                        ? "Back to re-engagement queue"
                        : "Open member pipeline",
                    href: buildChapterLeaderCommandCenterHref("members", {
                      source: "feed_analytics",
                      memberId: context.memberId,
                      pipelineFilter: context.pipelineFilter,
                      searchQuery: context.searchQuery,
                      feedPostId: context.feedPostId,
                    }),
                  },
                ],
              }
            : {
                eyebrow: "Feed analytics handoff",
                title: "Opened from a re-engagement workflow",
                summary:
                  "This chapter-leader route was opened from Feed Analytics to act on low-engagement signals. Keep the follow-up flow tied to the content-performance question that surfaced it instead of flattening it into a generic member review.",
                actions: [
                  {
                    label: "Back to re-engagement queue",
                    href: buildChapterLeaderCommandCenterHref("members", {
                      source: "feed_analytics",
                      memberId: context.memberId,
                      pipelineFilter: context.pipelineFilter,
                      searchQuery: context.searchQuery,
                    }),
                  },
                ],
              };
        case "bridge_videos":
          return context.feedPostId && context.feedPostTitle
            ? {
                eyebrow: "Feed analytics handoff",
                title: "Opened from a selected feed post into bridge-video review",
                summary: `This chapter-leader route was opened from "${context.feedPostTitle}" so a leader can choose the right bridge asset without losing the specific post that surfaced the sharing question. Keep that post context visible instead of treating the library like a disconnected content shelf.`,
                actions: [
                  {
                    label: "Back to selected post",
                    href: buildChapterLeaderCommandCenterHref("feed_analytics", {
                      source: "feed_analytics",
                      memberId: context.memberId,
                      pipelineFilter: context.pipelineFilter,
                      searchQuery: context.searchQuery,
                      bridgeVideoFilter: context.bridgeVideoFilter,
                      feedPostId: context.feedPostId,
                    }),
                  },
                  {
                    label: "Open re-engagement queue",
                    href: buildChapterLeaderCommandCenterHref("members", {
                      source: "feed_analytics",
                      memberId: context.memberId,
                      pipelineFilter: context.pipelineFilter,
                      searchQuery: context.searchQuery,
                      feedPostId: context.feedPostId,
                    }),
                  },
                ],
              }
            : {
                eyebrow: "Feed analytics handoff",
                title: "Opened from feed planning into bridge-video review",
                summary:
                  "This chapter-leader route was opened from Feed Analytics so a leader could choose the right bridge asset before returning to the broader sharing lane. Keep the feed-planning question visible instead of treating the library like a disconnected content shelf.",
                actions: [
                  {
                    label: "Back to feed analytics",
                    href: buildChapterLeaderCommandCenterHref("feed_analytics", {
                      source: "feed_analytics",
                      memberId: context.memberId,
                      pipelineFilter: context.pipelineFilter,
                      searchQuery: context.searchQuery,
                      bridgeVideoFilter: context.bridgeVideoFilter,
                    }),
                  },
                  {
                    label: "Open re-engagement queue",
                    href: buildChapterLeaderCommandCenterHref("members", {
                      source: "feed_analytics",
                      memberId: context.memberId,
                      pipelineFilter: context.pipelineFilter,
                      searchQuery: context.searchQuery,
                    }),
                  },
                ],
              };
        default:
          return {
            eyebrow: "Feed analytics handoff",
            title: "Opened from a re-engagement workflow",
            summary:
              "This chapter-leader route was opened from Feed Analytics to act on low-engagement signals. Keep the follow-up flow tied to the content-performance question that surfaced it instead of flattening it into a generic member review.",
          };
      }
    case "impact":
      return {
        eyebrow: "Impact handoff",
        title: "Opened from impact storytelling",
        summary:
          "This route was opened from the chapter impact dashboard to turn a real outcome into reusable storytelling. Keep the impact context visible before it becomes a generic bridge-video or content-library task.",
        actions: [
          {
            label: "Back to impact",
            href: buildChapterLeaderCommandCenterHref("impact", {
              memberId: context.memberId,
              impactStoryId: context.impactStoryId,
              pipelineFilter: context.pipelineFilter,
              searchQuery: context.searchQuery,
            }),
          },
        ],
      };
    case "leaderboard": {
      const chapterName = getBestPracticeChapterName(context.bestPracticeChapterId);
      return {
        eyebrow: "Leaderboard handoff",
        title: chapterName
          ? `Opened from ${chapterName} best practices`
          : "Opened from a leaderboard best-practice handoff",
        summary: chapterName
          ? `This route was opened from the chapter leaderboard to study what ${chapterName} is doing well. Keep the comparison context visible before turning it into chapter follow-up or feed planning.`
          : "This route was opened from the chapter leaderboard to study a top chapter pattern. Keep the comparison context visible before turning it into chapter follow-up or feed planning.",
        actions: [
          {
            label: "Back to leaderboard",
            href: buildChapterLeaderCommandCenterHref("leaderboard", {
              memberId: context.memberId,
              pipelineFilter: context.pipelineFilter,
              searchQuery: context.searchQuery,
              leaderboardMetric: context.leaderboardMetric,
              leaderboardRegion: context.leaderboardRegion,
            }),
          },
        ],
      };
    }
    default:
      return null;
  }
}

function parseChapterLeaderSource(value?: string): ChapterLeaderCommandCenterSource | null {
  switch (value) {
    case "overview":
    case "member_home":
    case "events":
    case "member_profile":
    case "bridge_videos":
    case "feed_analytics":
    case "impact":
    case "leaderboard":
    case "leaders":
    case "succession":
    case "values":
    case "training":
      return value;
    default:
      return null;
  }
}

export function buildChapterLeaderCommandCenterHref(
  view: ChapterLeaderCommandCenterView,
  options: {
    source?: ChapterLeaderCommandCenterSource | null;
    memberId?: string | null;
    committeeId?: string | null;
    eventCommitteeFilter?: ChapterLeaderEventCommitteeFilterKey;
    eventId?: string | null;
    leaderboardMetric?: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion?: ChapterLeaderLeaderboardRegionKey;
    bestPracticeChapterId?: string | null;
    impactStoryId?: string | null;
    pipelineFilter?: ChapterLeaderPipelineFilter;
    searchQuery?: string;
    bridgeVideoFilter?: ChapterLeaderBridgeVideoFilterKey;
    bridgeVideoId?: string | null;
    feedPostId?: string | null;
    quickAction?: ChapterLeaderQuickActionState | null;
  } = {},
) {
  const searchParams = new URLSearchParams();
  const shouldPreserveLeaderboardContext =
    view === "leaderboard" ||
    view === "member_profile" ||
    options.source === "leaderboard" ||
    Boolean(options.bestPracticeChapterId);
  const shouldPreserveEventContext =
    view === "events" || options.source === "events" || options.source === "overview";
  const shouldPreserveFeedPostContext =
    view === "feed_analytics" ||
    view === "bridge_videos" ||
    view === "members" ||
    view === "member_profile" ||
    options.source === "feed_analytics" ||
    options.source === "leaderboard";

  searchParams.set("view", view);

  if (options.source) {
    searchParams.set("source", options.source);
  }

  if (options.memberId) {
    searchParams.set("member", options.memberId);
  }

  if (view === "committees" && options.committeeId) {
    searchParams.set("committee", options.committeeId);
  }

  if (
    shouldPreserveEventContext &&
    options.eventCommitteeFilter &&
    options.eventCommitteeFilter !== "all"
  ) {
    searchParams.set("eventCommittee", options.eventCommitteeFilter);
  }

  if (shouldPreserveEventContext && options.eventId) {
    searchParams.set("event", options.eventId);
  }

  if (
    shouldPreserveLeaderboardContext &&
    options.leaderboardMetric &&
    options.leaderboardMetric !== "chapter_health"
  ) {
    searchParams.set("leaderboardMetric", options.leaderboardMetric);
  }

  if (
    shouldPreserveLeaderboardContext &&
    options.leaderboardRegion &&
    options.leaderboardRegion !== "all"
  ) {
    searchParams.set("region", options.leaderboardRegion);
  }

  if (options.bestPracticeChapterId) {
    searchParams.set("benchmark", options.bestPracticeChapterId);
  }

  if ((view === "impact" || options.source === "impact") && options.impactStoryId) {
    searchParams.set("impactStory", options.impactStoryId);
  }

  if (options.pipelineFilter && options.pipelineFilter !== "all") {
    searchParams.set("pipeline", options.pipelineFilter);
  }

  if (options.searchQuery) {
    searchParams.set("q", options.searchQuery);
  }

  if (shouldPreserveFeedPostContext && options.feedPostId) {
    searchParams.set("feedPost", options.feedPostId);
  }

  if (
    (view === "bridge_videos" || view === "feed_analytics") &&
    options.bridgeVideoFilter &&
    options.bridgeVideoFilter !== "all"
  ) {
    searchParams.set("bridge", options.bridgeVideoFilter);
  }

  if (view === "bridge_videos" && options.bridgeVideoId) {
    searchParams.set("bridgeVideo", options.bridgeVideoId);
  }

  if (options.quickAction) {
    searchParams.set("quickAction", options.quickAction);
  }

  const query = searchParams.toString();
  return `/leader?${query}`;
}

export function buildChapterLeaderAssignmentFlowHref(options: {
  source?: ChapterLeaderCommandCenterSource | null;
  memberId?: string | null;
  pipelineFilter?: ChapterLeaderPipelineFilter;
  searchQuery?: string;
  eventCommitteeFilter?: ChapterLeaderEventCommitteeFilterKey;
  eventId?: string | null;
  returnView?: "events" | "members";
}) {
  const searchParams = new URLSearchParams();
  const returnView = options.returnView ?? "events";
  const returnTo = buildChapterLeaderCommandCenterHref(returnView, {
    source: options.source,
    memberId: options.memberId,
    pipelineFilter: options.pipelineFilter,
    searchQuery: options.searchQuery,
    eventCommitteeFilter: returnView === "events" ? options.eventCommitteeFilter : undefined,
    eventId: returnView === "events" ? options.eventId : undefined,
    quickAction: "assign_action",
  });

  searchParams.set("source", "chapter_assign_action");
  searchParams.set("returnTo", returnTo);

  if (options.memberId) {
    searchParams.set("member", options.memberId);
  }

  return `/rush-month/actions?${searchParams.toString()}`;
}

export function buildChapterLeaderEventFlowHref(options: {
  source?: ChapterLeaderCommandCenterSource | null;
  memberId?: string | null;
  pipelineFilter?: ChapterLeaderPipelineFilter;
  searchQuery?: string;
  eventCommitteeFilter?: ChapterLeaderEventCommitteeFilterKey;
  eventId?: string | null;
  quickAction?: ChapterLeaderQuickActionState | null;
}) {
  const searchParams = new URLSearchParams();
  const returnTo = buildChapterLeaderCommandCenterHref("events", {
    source: options.source,
    memberId: options.memberId,
    pipelineFilter: options.pipelineFilter,
    searchQuery: options.searchQuery,
    eventCommitteeFilter: options.eventCommitteeFilter,
    eventId: options.eventId,
    quickAction: options.quickAction,
  });

  searchParams.set(
    "source",
    options.eventId ? "chapter_event_review" : "chapter_create_event",
  );
  searchParams.set("returnTo", returnTo);

  if (!options.eventId) {
    return `/rush-month/events?${searchParams.toString()}`;
  }

  return `/rush-month/events/${options.eventId}?${searchParams.toString()}`;
}

export function buildChapterLeaderCommitteeFlowHref(options: {
  source?: ChapterLeaderCommandCenterSource | null;
  memberId?: string | null;
  committeeId?: string | null;
  pipelineFilter?: ChapterLeaderPipelineFilter;
  searchQuery?: string;
}) {
  return buildChapterLeaderCommandCenterHref("committees", {
    source: options.source,
    memberId: options.memberId,
    committeeId: options.committeeId,
    pipelineFilter: options.pipelineFilter,
    searchQuery: options.searchQuery,
  });
}

export function buildChapterLeaderProofUploadHref(options: {
  source?: ChapterLeaderCommandCenterSource | null;
  memberId?: string | null;
  impactStoryId?: string | null;
  pipelineFilter?: ChapterLeaderPipelineFilter;
  searchQuery?: string;
  bridgeVideoFilter?: ChapterLeaderBridgeVideoFilterKey;
  bridgeVideoId?: string | null;
  feedPostId?: string | null;
}) {
  return buildChapterLeaderCommandCenterHref("bridge_videos", {
    source: options.source,
    memberId: options.memberId,
    impactStoryId: options.impactStoryId,
    pipelineFilter: options.pipelineFilter,
    searchQuery: options.searchQuery,
    bridgeVideoFilter: options.bridgeVideoFilter,
    bridgeVideoId: options.bridgeVideoId,
    feedPostId: options.feedPostId,
  });
}

export function parseChapterLeaderCommandCenterView(
  value?: string,
): ChapterLeaderCommandCenterView {
  switch (value) {
    case "leaderboard":
    case "leaders":
    case "members":
    case "member_profile":
    case "committees":
    case "events":
    case "impact":
    case "bridge_videos":
    case "succession":
    case "values":
    case "training":
    case "feed_analytics":
      return value;
    case "feed":
      return "feed_analytics";
    case "overview":
    default:
      return "overview";
  }
}

function parsePipelineFilter(value?: string): ChapterLeaderPipelineFilter {
  switch (value) {
    case "e_board":
    case "chair":
    case "chair_candidate":
    case "active_contributor":
    case "general_member":
    case "follow_up":
      return value;
    case "ready":
      return "e_board";
    case "emerging":
      return "chair_candidate";
    case "contributors":
      return "active_contributor";
    case "all":
    default:
      return "all";
  }
}

function parseSelectedFeedPostId(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseLeaderboardMetric(
  value?: string,
): ChapterLeaderLeaderboardMetricKey {
  switch (value) {
    case "events_created":
    case "active_members":
    case "attendance":
    case "evidence":
    case "bridge_videos":
    case "funds_raised":
    case "slt_participants":
      return value;
    case "chapter_health":
    default:
      return "chapter_health";
  }
}

function parseLeaderboardRegion(
  value?: string,
): ChapterLeaderLeaderboardRegionKey {
  switch (value) {
    case "current_region":
    case "united_states":
    case "canada":
      return value;
    case "all":
    default:
      return "all";
  }
}

function parseBridgeVideoFilter(value?: string): ChapterLeaderBridgeVideoFilterKey {
  switch (value) {
    case "recruitment":
    case "fundraising":
    case "slt":
    case "transition":
    case "comms":
      return value;
    case "all":
    default:
      return "all";
  }
}

function getBridgeVideoCategoryFilterKey(
  categoryLabel?: string | null,
): Exclude<ChapterLeaderBridgeVideoFilterKey, "all"> | null {
  switch (categoryLabel) {
    case "Recruitment":
      return "recruitment";
    case "Fundraising":
      return "fundraising";
    case "SLT Promotion":
      return "slt";
    case "Leadership Transition":
      return "transition";
    case "Communications":
      return "comms";
    default:
      return null;
  }
}

function parseEventCommitteeFilter(
  value?: string,
): ChapterLeaderEventCommitteeFilterKey {
  switch (value) {
    case "events":
    case "slt_promotion":
    case "recruitment":
    case "fundraising":
    case "service":
    case "comms":
      return value;
    case "all":
    default:
      return "all";
  }
}

function parseQuickActionState(
  value?: string,
): ChapterLeaderQuickActionState | null {
  switch (value) {
    case "add_committee":
    case "add_leader_note":
    case "add_member":
    case "assign_leadership_action":
    case "ask_members_to_respond":
    case "create_impact_bridge_video":
    case "create_event":
    case "export_members":
    case "nominate_for_eboard":
    case "promote_to_chair":
    case "assign_action":
    case "review_members":
    case "schedule_values_interview":
    case "share_impact_story":
    case "promote_emerging_leader":
    case "feature_bridge_video":
    case "share_to_feed":
    case "share_bridge_video":
    case "submit_bridge_video":
      return value;
    default:
      return null;
  }
}

function emptyCommandCenter(): ChapterLeaderCommandCenter {
  return {
    canReadCommandCenter: false,
    chapterName: "",
    campusLabel: "",
    regionLabel: "",
    coachLabel: "",
    activeCampaignLabel: "",
    activeProgramLabels: [],
    sidebarLeaderLabel: "",
    sidebarLeaderRoleLabel: "",
    summary: "",
    sampleLabel: null,
    selectedSource: null,
    sourceContext: null,
    navigationMemberId: null,
    selectedView: "overview",
    hasExplicitMemberSelection: false,
    selectedMemberId: null,
    selectedCommitteeId: null,
    selectedLeaderboardMetric: "chapter_health",
    selectedLeaderboardRegion: "all",
    selectedBestPracticeChapterId: null,
    selectedBestPracticeChapter: null,
    selectedImpactHighlightId: null,
    selectedImpactHighlight: null,
    selectedPipelineFilter: "all",
    selectedEventCommitteeFilter: "all",
    selectedEventId: null,
    selectedBridgeVideoFilter: "all",
    selectedBridgeVideoId: null,
    selectedFeedPostId: null,
    pipelineSearchQuery: "",
    pipelineTotalCount: 0,
    activeQuickAction: null,
    viewOptions: getViewOptions({
      memberId: null,
      defaultProfileMemberId: null,
      committeeId: null,
      eventCommitteeFilter: "all",
      eventId: null,
      leaderboardMetric: "chapter_health",
      leaderboardRegion: "all",
      bestPracticeChapterId: null,
      pipelineFilter: "all",
      searchQuery: "",
    }),
    navGroups: commandCenterNavGroups,
    pipelineFilterOptions: getPipelineFilterOptions({
      view: "members",
      source: null,
      memberId: null,
      pipelineFilter: "all",
      searchQuery: "",
    }),
    healthScore: 0,
    healthTone: "red",
    healthNote: "",
    chapterPointsTrend: [],
    leaderboardRegionLabel: "",
    leaderboardRegionOptions: [],
    leaderboardFilters: [],
    leaderboardIdeaNote: "",
    leaderboardChapters: [],
    metrics: [],
    quickActions: [],
    weeklyPriority: null,
    leadershipRoles: [],
    riskAlerts: [],
    pipelineItems: [],
    pipelineRows: [],
    pipelineSnapshots: [],
    selectedMember: null,
    committees: [],
    selectedCommittee: null,
    committeesOverview: {
      activeCommitteesLabel: "",
      totalOpenActionsLabel: "",
      committeesWithoutChairsLabel: "",
    },
    eventCommitteeFilters: [],
    events: [],
    selectedEvent: null,
    eventsOverview: {
      monthLabel: "",
      totalEventsThisMonth: 0,
      attendanceRateLabel: "",
      attendanceDeltaLabel: "",
      rsvpConversionLabel: "",
      eventsWithProofLabel: "",
      followUpsOverdue: 0,
      socialRecruitingLabel: "",
      socialRecruitingNote: "",
    },
    socialRecruitingMetrics: [],
    impactCards: [],
    impactHighlights: [],
    localImpactStats: [],
    globalImpactStats: [],
    campaignImpactOverview: null,
    bridgeStories: [],
    bridgeVideoMetrics: [],
    bridgeVideoFilters: [],
    bridgeVideoEntries: [],
    selectedBridgeVideo: null,
    bridgeVideoCultureNote: "",
    feedAnalyticsBridgeContext: null,
    feedInsights: [],
    feedMetrics: [],
    feedChartRows: [],
    feedPostRows: [],
    selectedFeedPost: null,
    mostEngagedMembers: [],
    leastEngagedMembers: [],
    successionCandidates: [],
    successionOverview: {
      eboardRolesFilledLabel: "",
      activeCommitteesLabel: "",
      candidatesIdentifiedLabel: "",
      transitionReadinessLabel: "",
      transitionReadinessNote: "",
    },
    successionGaps: [],
    successionTimeline: [],
    leaderboard: [],
    safetyNote: "",
  };
}

function getViewOptions(input: {
  source?: ChapterLeaderCommandCenterSource | null;
  memberId: string | null;
  defaultProfileMemberId: string | null;
  committeeId: string | null;
  eventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
  eventId?: string | null;
  leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
  leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
  bestPracticeChapterId: string | null;
  impactStoryId?: string | null;
  feedPostId?: string | null;
  pipelineFilter: ChapterLeaderPipelineFilter;
  searchQuery: string;
  bridgeVideoFilter?: ChapterLeaderBridgeVideoFilterKey;
}): ChapterLeaderCommandCenterViewOption[] {
  const visibleEntries = Object.entries(commandCenterViewLabels) as Array<
    [ChapterLeaderCommandCenterView, string]
  >;

  return visibleEntries.map(([key, label]) => ({
    key,
    label,
    href: buildChapterLeaderCommandCenterHref(key, {
      source: input.source,
      memberId: key === "member_profile" ? input.defaultProfileMemberId : input.memberId,
      committeeId: key === "committees" ? input.committeeId : null,
      eventCommitteeFilter: key === "events" ? input.eventCommitteeFilter : "all",
      eventId: null,
      leaderboardMetric:
        input.source === "leaderboard" || key === "leaderboard"
          ? input.leaderboardMetric
          : "chapter_health",
      leaderboardRegion:
        input.source === "leaderboard" || key === "leaderboard"
          ? input.leaderboardRegion
          : "all",
      bestPracticeChapterId: input.source === "leaderboard" ? input.bestPracticeChapterId : null,
      impactStoryId: input.source === "impact" ? input.impactStoryId : null,
      feedPostId: input.source === "feed_analytics" ? input.feedPostId : null,
      pipelineFilter: input.pipelineFilter,
      searchQuery: input.searchQuery,
      bridgeVideoFilter: key === "bridge_videos" ? input.bridgeVideoFilter : "all",
    }),
  }));
}

function getNavigationMemberId(input: {
  requestedMemberId?: string | null;
  selectedMemberId: string | null;
  selectedSource: ChapterLeaderCommandCenterSource | null;
  selectedView: ChapterLeaderCommandCenterView;
}) {
  if (input.requestedMemberId && input.selectedMemberId) {
    return input.selectedMemberId;
  }

  return null;
}

function getPipelineFilterOptions(input: {
  view: ChapterLeaderCommandCenterView;
  source: ChapterLeaderCommandCenterSource | null;
  memberId: string | null;
  pipelineFilter: ChapterLeaderPipelineFilter;
  searchQuery: string;
}): ChapterLeaderPipelineFilterOption[] {
  const visibleFilterKeys: Array<
    Exclude<
      ChapterLeaderPipelineFilter,
      "follow_up" | "ready" | "emerging" | "contributors"
    >
  > = [
    "all",
    "e_board",
    "chair",
    "chair_candidate",
    "active_contributor",
    "general_member",
  ];
  const optionKeys: ChapterLeaderPipelineFilter[] =
    input.pipelineFilter === "follow_up"
      ? [...visibleFilterKeys, "follow_up"]
      : visibleFilterKeys;

  return optionKeys.map((key) => ({
    key,
    label: pipelineFilterLabels[key],
    href: buildChapterLeaderCommandCenterHref(input.view, {
      source: input.source,
      memberId: input.memberId,
      pipelineFilter: key,
      searchQuery: input.searchQuery,
    }),
  }));
}

function getWeeklyPriorityTitle(actor: LocalActorContext) {
  if (actor.chapterRoles.includes("President / VP")) {
    return "Create the next Luma event, confirm attendance, and make sure points move the leaderboard.";
  }

  if (actor.chapterRoles.includes("E-Board Member")) {
    return "Move owners and event prep before students feel the stall.";
  }

  return "Keep every owner, lane, and proof follow-up legible this week.";
}

function getWeeklyPrioritySummary(
  actor: LocalActorContext,
  leaderActionsSummary: string,
  memberRoleSummary: string,
) {
  if (actor.chapterRoles.includes("President / VP")) {
    return "Turn this into three concrete moves this week: name a visible owner for Member Engagement, close the missing bridge-video asks by committee, and turn current SLT interest into real student follow-up.";
  }

  return `${leaderActionsSummary} ${memberRoleSummary}`;
}

function getLeaderboardRegionLabel(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  selectedRegion: ChapterLeaderLeaderboardRegionKey,
) {
  if (sourceMode === "mock") {
    return leaderboardRegionLabels[selectedRegion];
  }

  return "Current Region";
}

function getLeaderboardRegionOptions(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  selectedRegion: ChapterLeaderLeaderboardRegionKey,
  context: {
    source?: ChapterLeaderCommandCenterSource | null;
    memberId: string | null;
    pipelineFilter: ChapterLeaderPipelineFilter;
    searchQuery: string;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    bestPracticeChapterId: string | null;
    feedPostId: string | null;
  },
): ChapterLeaderCommandCenterLeaderboardRegionOption[] {
  if (sourceMode !== "mock") {
    return [];
  }

  const keys: ChapterLeaderLeaderboardRegionKey[] = [
    "all",
    "current_region",
    "united_states",
    "canada",
  ];

  return keys.map((key) => ({
    key,
    label: leaderboardRegionLabels[key],
    isActive: key === selectedRegion,
    href: buildChapterLeaderCommandCenterHref("leaderboard", {
      source: context.source,
      memberId: context.memberId,
      pipelineFilter: context.pipelineFilter,
      searchQuery: context.searchQuery,
      leaderboardMetric: context.leaderboardMetric,
      leaderboardRegion: key,
      bestPracticeChapterId: context.bestPracticeChapterId,
      feedPostId: context.feedPostId,
    }),
  }));
}

function getLeaderboardFilters(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  selectedMetric: ChapterLeaderLeaderboardMetricKey,
  context: {
    source?: ChapterLeaderCommandCenterSource | null;
    memberId: string | null;
    pipelineFilter: ChapterLeaderPipelineFilter;
    searchQuery: string;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
  },
): ChapterLeaderCommandCenterLeaderboardFilter[] {
  if (sourceMode === "mock") {
    const metricKeys: ChapterLeaderLeaderboardMetricKey[] = [
      "chapter_health",
      "events_created",
      "active_members",
      "attendance",
      "evidence",
      "bridge_videos",
      "funds_raised",
      "slt_participants",
    ];

    return metricKeys.map((key) => ({
      key,
      label: leaderboardMetricLabels[key],
      isActive: selectedMetric === key,
      href: buildChapterLeaderCommandCenterHref("leaderboard", {
        source: context.source,
        memberId: context.memberId,
        pipelineFilter: context.pipelineFilter,
        searchQuery: context.searchQuery,
        leaderboardMetric: key,
        leaderboardRegion: context.leaderboardRegion,
      }),
    }));
  }

  return [];
}

function getLeaderboardIdeaNote(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  selectedMetric: ChapterLeaderLeaderboardMetricKey,
) {
  if (sourceMode === "mock") {
    switch (selectedMetric) {
      case "attendance":
        return "Ideas to try: McGill holds a same-day RSVP confirmation push and assigns one follow-up owner per event, which helps attendance stay high even when event volume grows.";
      case "bridge_videos":
        return "Ideas to try: UCLA and McGill both submit bridge videos consistently, then reuse them across recruiting and follow-up so students hear real chapter voices more than once.";
      case "funds_raised":
        return "Ideas to try: top fundraising chapters tie event proof, donor follow-up, and student ownership together instead of treating fundraising like a separate lane.";
      case "slt_participants":
        return "Ideas to try: UCLA runs weekly SLT testimonial posts. Top chapters keep values, cost, and travel objections visible in every follow-up.";
      case "events_created":
        return "Ideas to try: UT Austin assigns event creation as a first action for new members so ownership forms early instead of waiting for senior leaders to carry the whole calendar.";
      default:
        return "Ideas to try: UCLA runs weekly SLT testimonial posts. McGill uses a chapter buddy system. UT Austin assigns event creation as a first action for new members. All three submit bridge videos consistently.";
    }
  }

  return "";
}

function getLeaderboardChapters(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  context: {
    selectedMetric: ChapterLeaderLeaderboardMetricKey;
    selectedRegion: ChapterLeaderLeaderboardRegionKey;
    source?: ChapterLeaderCommandCenterSource | null;
    memberId: string | null;
    pipelineFilter: ChapterLeaderPipelineFilter;
    searchQuery: string;
    bestPracticeChapterId?: string;
  },
): ChapterLeaderCommandCenterLeaderboardChapter[] {
  if (sourceMode === "mock") {
    return filterLeaderboardChaptersByRegion([
      {
        id: "leaderboard-ucla",
        rankLabel: "🥇",
        chapterName: "UCLA MEDLIFE",
        countryLabel: "USA",
        healthLabel: "Health 96",
        quote: '"Weekly SLT testimonial posts doubled sign-up rate"',
        metrics: [
          { label: "Events", value: "18" },
          { label: "Members", value: "112" },
          { label: "Att.", value: "79%" },
          { label: "Evidence", value: "34" },
          { label: "Bridge", value: "14" },
          { label: "SLT", value: "31" },
        ],
        bestPracticesHref: buildChapterLeaderCommandCenterHref("feed_analytics", {
          source: "leaderboard",
          memberId: context.memberId,
          pipelineFilter: context.pipelineFilter,
          searchQuery: context.searchQuery,
          leaderboardMetric: context.selectedMetric,
          leaderboardRegion: context.selectedRegion,
          bestPracticeChapterId: "leaderboard-ucla",
        }),
      },
      {
        id: "leaderboard-mcgill",
        rankLabel: "🥈",
        chapterName: "McGill MEDLIFE",
        countryLabel: "Canada",
        healthLabel: "Health 93",
        quote: '"Chapter buddy system retains 40% more new members"',
        metrics: [
          { label: "Events", value: "15" },
          { label: "Members", value: "94" },
          { label: "Att.", value: "81%" },
          { label: "Evidence", value: "28" },
          { label: "Bridge", value: "11" },
          { label: "SLT", value: "38" },
        ],
        bestPracticesHref: buildChapterLeaderCommandCenterHref("feed_analytics", {
          source: "leaderboard",
          memberId: context.memberId,
          pipelineFilter: context.pipelineFilter,
          searchQuery: context.searchQuery,
          leaderboardMetric: context.selectedMetric,
          leaderboardRegion: context.selectedRegion,
          bestPracticeChapterId: "leaderboard-mcgill",
        }),
      },
      {
        id: "leaderboard-boston-college",
        rankLabel: "🥉",
        chapterName: "Boston College MEDLIFE",
        countryLabel: "USA",
        badgeLabel: "Your Chapter",
        healthLabel: "Health 87",
        quote: '"Leading Moving Mountains in New England - #3 overall"',
        metrics: [
          { label: "Events", value: "12" },
          { label: "Members", value: "84" },
          { label: "Att.", value: "67%" },
          { label: "Evidence", value: "22" },
          { label: "Bridge", value: "9" },
          { label: "SLT", value: "18" },
        ],
        bestPracticesHref: buildChapterLeaderCommandCenterHref("feed_analytics", {
          source: "leaderboard",
          memberId: context.memberId,
          pipelineFilter: context.pipelineFilter,
          searchQuery: context.searchQuery,
          leaderboardMetric: context.selectedMetric,
          leaderboardRegion: context.selectedRegion,
          bestPracticeChapterId: "leaderboard-boston-college",
        }),
      },
      {
        id: "leaderboard-ut-austin",
        rankLabel: "4",
        chapterName: "UT Austin MEDLIFE",
        countryLabel: "USA",
        healthLabel: "Health 84",
        quote: '"Event creation is the first visible action for new members"',
        metrics: [
          { label: "Events", value: "14" },
          { label: "Members", value: "88" },
          { label: "Att.", value: "74%" },
          { label: "Evidence", value: "19" },
          { label: "Bridge", value: "10" },
          { label: "SLT", value: "22" },
        ],
        bestPracticesHref: buildChapterLeaderCommandCenterHref("feed_analytics", {
          source: "leaderboard",
          memberId: context.memberId,
          pipelineFilter: context.pipelineFilter,
          searchQuery: context.searchQuery,
          leaderboardMetric: context.selectedMetric,
          leaderboardRegion: context.selectedRegion,
          bestPracticeChapterId: "leaderboard-ut-austin",
        }),
      },
    ], context.selectedRegion);
  }

  return [];
}

function filterLeaderboardChaptersByRegion(
  chapters: ChapterLeaderCommandCenterLeaderboardChapter[],
  selectedRegion: ChapterLeaderLeaderboardRegionKey,
) {
  switch (selectedRegion) {
    case "current_region":
      return chapters.filter((chapter) => chapter.id === "leaderboard-boston-college");
    case "united_states":
      return chapters.filter((chapter) => chapter.countryLabel === "USA");
    case "canada":
      return chapters.filter((chapter) => chapter.countryLabel === "Canada");
    case "all":
    default:
      return chapters;
  }
}

function getMetrics(input: {
  sourceMode: ReadOnlyAppData["source"]["mode"];
  committees: ChapterLeaderCommandCenterCommitteeCard[];
  eventCards: ChapterLeaderCommandCenterEventCard[];
  leadershipRoles: ChapterLeaderCommandCenterLeadershipRole[];
  recognition: ReturnType<typeof getMemberRecognitionSummary>;
  workspace: ReturnType<typeof getChapterMembershipWorkspace>;
}): ChapterLeaderCommandCenterMetric[] {
  if (input.sourceMode === "mock") {
    return [
      { label: "Active Members", value: "84", note: "+6 from last month" },
      { label: "Events Created", value: "12", note: "This month" },
      { label: "Luma RSVPs", value: "823", note: "Across visible events" },
      { label: "Attendance Rate", value: "67%", note: "-4% vs last month" },
      { label: "Points This Week", value: "1,480", note: "+11% vs last week" },
      { label: "Chapter Rank", value: "#3", note: "Regional leaderboard" },
      { label: "Org Rank", value: "Top 15%", note: "All chapters" },
    ];
  }

  const coveredRoles = input.leadershipRoles.filter((role) => role.status === "covered");

  return [
    {
      label: "E-board roles covered",
      value: `${coveredRoles.length}/${input.leadershipRoles.length}`,
      note: "Owner clarity across president and core committee leadership lanes.",
    },
    {
      label: "Join requests",
      value: `${input.workspace.counts.pendingRequests}`,
      note: "Students waiting for a human welcome and chapter placement review.",
    },
    {
      label: "Proof follow-up",
      value: `${input.workspace.counts.proofFollowUps}`,
      note: "Stories or screenshots that still need leader confirmation before they travel.",
    },
    {
      label: "Committees / events",
      value: `${input.committees.length} / ${input.eventCards.length}`,
      note: `${input.recognition.leaderboard.length} students are already visible on the chapter leaderboard.`,
    },
  ];
}

function getHealthScore(input: {
  workspace: ReturnType<typeof getChapterMembershipWorkspace>;
  leadershipRoles: ChapterLeaderCommandCenterLeadershipRole[];
}) {
  const thinRoles = input.leadershipRoles.filter((role) => role.status === "thin").length;
  const missingRoles = input.leadershipRoles.filter((role) => role.status === "missing")
    .length;
  const score =
    96 -
    thinRoles * 6 -
    missingRoles * 10 -
    input.workspace.counts.proofFollowUps * 3 -
    input.workspace.counts.pendingRequests * 2 -
    input.workspace.members.filter((member) => member.membershipStatus === "needs_follow_up")
      .length *
      4;

  return Math.max(54, Math.min(96, score));
}

function scoreToTone(score: number): ChapterLeaderCommandCenterTone {
  if (score >= 80) {
    return "green";
  }

  if (score >= 64) {
    return "yellow";
  }

  return "red";
}

function getHealthNote(input: {
  workspace: ReturnType<typeof getChapterMembershipWorkspace>;
  leadershipRoles: ChapterLeaderCommandCenterLeadershipRole[];
}) {
  const thinRoles = input.leadershipRoles.filter((role) => role.status === "thin").length;
  const missingRoles = input.leadershipRoles.filter((role) => role.status === "missing")
    .length;

  if (missingRoles > 0) {
    return `${missingRoles} missing leadership lane${missingRoles === 1 ? "" : "s"} and ${input.workspace.counts.proofFollowUps} proof follow-up item${input.workspace.counts.proofFollowUps === 1 ? "" : "s"} are keeping the week below green.`;
  }

  return `${thinRoles} thin leadership lane${thinRoles === 1 ? "" : "s"}, ${input.workspace.counts.pendingRequests} join request${input.workspace.counts.pendingRequests === 1 ? "" : "s"}, and ${input.workspace.counts.proofFollowUps} proof follow-up item${input.workspace.counts.proofFollowUps === 1 ? "" : "s"} need leader attention first.`;
}

function getQuickActions(
  selectedMemberId: string | null,
  context: {
    source?: ChapterLeaderCommandCenterSource | null;
    impactStoryId?: string | null;
    pipelineFilter?: ChapterLeaderPipelineFilter;
    eventCommitteeFilter?: ChapterLeaderEventCommitteeFilterKey;
    searchQuery?: string;
    bridgeVideoFilter?: ChapterLeaderBridgeVideoFilterKey;
    feedPostId?: string | null;
  } = {},
): ChapterLeaderCommandCenterQuickAction[] {
  const commandCenterSource = context.source ?? "overview";

  return [
    {
      label: "Create Event",
      href: buildChapterLeaderCommandCenterHref("events", {
        source: commandCenterSource,
        memberId: selectedMemberId,
        eventCommitteeFilter: context.eventCommitteeFilter,
        quickAction: "create_event",
      }),
      helper: "Mock-linked Luma planning",
      tone: "primary",
    },
    {
      label: "Confirm Attendance",
      href: buildChapterLeaderCommandCenterHref("events", {
        source: commandCenterSource,
        memberId: selectedMemberId,
        eventCommitteeFilter: context.eventCommitteeFilter,
        quickAction: "assign_action",
      }),
      helper: "RSVP follow-up and point-ready roster",
      tone: "primary",
    },
    {
      label: "Review Members",
      href: buildChapterLeaderCommandCenterHref("members", {
        source: context.source,
        memberId: selectedMemberId,
        pipelineFilter: context.pipelineFilter,
        searchQuery: context.searchQuery,
        quickAction: "review_members",
      }),
      helper: "Roster and join requests",
      tone: "secondary",
    },
    {
      label: "Review Leaderboard",
      href: buildChapterLeaderCommandCenterHref("leaderboard", {
        source: commandCenterSource,
        memberId: selectedMemberId,
        leaderboardMetric: "attendance",
      }),
      helper: "Chapter rank and points movement",
      tone: "secondary",
    },
  ];
}

function getLeadershipRoles(
  members: ChapterMemberRow[],
): ChapterLeaderCommandCenterLeadershipRole[] {
  return [
    getLeadershipRole({
      key: "president-vp",
      label: "President / VP",
      owner: members.find((member) => isPresidentOrVp(member)),
      summary:
        "President / VP keeps the week coherent and confirms that every visible lane has an owner.",
      requireLeadRole: true,
    }),
    getLeadershipRole({
      key: "recruitment-lead",
      label: "Recruitment lead",
      owner: members.find((member) => member.committeeLane === "Recruitment"),
      summary:
        "Recruitment should keep tabling, invites, and freshman follow-up moving without waiting on staff.",
      requireLeadRole: true,
    }),
    getLeadershipRole({
      key: "social-lead",
      label: "Social lead",
      owner: members.find((member) => member.committeeLane === "Social"),
      summary:
        "Social needs a clear owner for belonging events and bridge-video follow-through.",
      requireLeadRole: true,
    }),
    getLeadershipRole({
      key: "med-talk-lead",
      label: "Med Talk lead",
      owner: members.find((member) => member.committeeLane === "Med Talk"),
      summary:
        "Med Talk needs someone who can own speaker flow, reminders, and the proof prompt after the event.",
      requireLeadRole: true,
    }),
    getLeadershipRole({
      key: "local-volunteering-lead",
      label: "Local volunteering lead",
      owner: members.find((member) => member.committeeLane === "Local Volunteering"),
      summary:
        "Local volunteering should have a lead who can own service logistics and reflections.",
      requireLeadRole: true,
    }),
  ];
}

function getLeadershipRole(input: {
  key: string;
  label: string;
  owner: ChapterMemberRow | undefined;
  summary: string;
  requireLeadRole: boolean;
}): ChapterLeaderCommandCenterLeadershipRole {
  const owner = input.owner;

  if (!owner) {
    return {
      key: input.key,
      label: input.label,
      owner: "Open role",
      status: "missing",
      note: `${input.summary} Name an owner before the next push.`,
    };
  }

  const hasLeadRole = isLeadershipOwner(owner);

  if (input.requireLeadRole && !hasLeadRole) {
    return {
      key: input.key,
      label: input.label,
      owner: owner.displayName,
      status: "thin",
      note: `${owner.displayName} is active in this lane, but leader ownership is still thin.`,
    };
  }

  return {
    key: input.key,
    label: input.label,
    owner: owner.displayName,
    status: "covered",
    note: `${owner.displayName} is the visible owner for this lane right now.`,
  };
}

function getRiskAlerts(input: {
  workspace: ReturnType<typeof getChapterMembershipWorkspace>;
  leadershipRoles: ChapterLeaderCommandCenterLeadershipRole[];
  eventCount: number;
}): ChapterLeaderCommandCenterRiskAlert[] {
  const alerts: ChapterLeaderCommandCenterRiskAlert[] = [];
  const thinOrMissingRoles = input.leadershipRoles.filter((role) => {
    return role.status === "thin" || role.status === "missing";
  });

  if (thinOrMissingRoles.length > 0) {
    alerts.push({
      severity: "high",
      title: "Next event needs an owner before RSVP momentum drops",
      summary:
        "Pick the leader who owns the next Luma event, RSVP check, and day-of attendance plan before the chapter push loses follow-through.",
      href: buildChapterLeaderCommandCenterHref("events", {
        source: "overview",
        eventCommitteeFilter: "recruitment",
      }),
      hrefLabel: "Open events",
    });
  }

  if (input.workspace.counts.pendingRequests > 0) {
    alerts.push({
      severity: "medium",
      title: "RSVP conversion needs attention before the next event",
      summary:
        "A group of interested students has not turned into attendance yet. Review the RSVP list and decide who needs a reminder before event day.",
      href: buildChapterLeaderCommandCenterHref("events", {
        source: "overview",
        eventCommitteeFilter: "recruitment",
      }),
      hrefLabel: "Open RSVPs",
    });
  }

  if (input.workspace.counts.proofFollowUps > 0) {
    alerts.push({
      severity: "medium",
      title: "Attendance confirmation is blocking points",
      summary:
        "Some event activity has not become confirmed check-ins yet. Close attendance so the leaderboard reflects the chapter's real work.",
      href: buildChapterLeaderCommandCenterHref("events", {
        source: "overview",
        eventCommitteeFilter: "all",
      }),
      hrefLabel: "Confirm attendance",
    });
  }

  if (input.eventCount > 0) {
    alerts.push({
      severity: "medium",
      title: "Leaderboard movement is waiting on event follow-up",
      summary:
        "The recruitment event still needs visible follow-up, so open the event review and make sure attendance-backed points are reflected.",
      href: buildChapterLeaderCommandCenterHref("events", {
        source: "overview",
        eventCommitteeFilter: "recruitment",
        eventId: "bc-event-quad-tabling",
      }),
      hrefLabel: "Open event review",
    });
  }

  return alerts;
}

function getPipelineItems(
  joinRequests: ChapterJoinRequest[],
  members: ChapterMemberRow[],
): ChapterLeaderCommandCenterPipelineItem[] {
  const joinRequestItems = joinRequests.map((request) => ({
    id: request.id,
    kind: "join_request" as const,
    displayName: request.displayName,
    roleLabel: request.requestedRoleLabel,
    statusLabel: "Pending join",
    laneLabel: request.requestedCommitteeLane,
    summary: request.nextStep,
    href: buildChapterLeaderCommandCenterHref("members"),
  }));

  const memberItems = members
    .filter((member) => {
      return (
        member.membershipStatus === "needs_follow_up" ||
        member.openAssignments > 1 ||
        isEBoardRole(member)
      );
    })
    .map((member) => ({
      id: member.id,
      kind: "member" as const,
      displayName: member.displayName,
      roleLabel: member.roleLabel,
      statusLabel: getPipelineStatus(member),
      laneLabel: member.committeeLane,
      summary: member.nextStep,
      href: buildChapterLeaderCommandCenterHref("members", {
        memberId: member.id,
      }),
    }));

  return [...joinRequestItems, ...memberItems].slice(0, 6);
}

function getPipelineStatus(member: ChapterMemberRow) {
  if (isEBoardRole(member)) {
    return "Emerging leader";
  }

  if (member.membershipStatus === "needs_follow_up") {
    return "Needs follow-up";
  }

  if (member.openAssignments > 1) {
    return "Owner overloaded";
  }

  return "Active contributor";
}

function getSelectedMemberId(
  members: ChapterMemberRow[],
  requestedMemberId?: string,
) {
  const validRequestedMemberId = getRequestedMemberId(members, requestedMemberId);
  if (validRequestedMemberId) {
    return validRequestedMemberId;
  }

  const existingDefaultMember = members.find((member) => member.id === "member-zara");
  if (existingDefaultMember) {
    return existingDefaultMember.id;
  }

  const defaultMember =
    members.find((member) => isEBoardRole(member)) ??
    members.find((member) => isActionCommitteeChair(member)) ??
    members.find((member) => member.membershipStatus !== "inactive") ??
    members[0];

  return defaultMember?.id;
}

function getRequestedMemberId(
  members: ChapterMemberRow[],
  requestedMemberId?: string,
) {
  if (requestedMemberId && members.some((member) => member.id === requestedMemberId)) {
    return requestedMemberId;
  }

  return null;
}

function getVisiblePipelineMemberId(
  rows: ChapterLeaderCommandCenterPipelineRow[],
  requestedMemberId?: string,
) {
  if (requestedMemberId && rows.some((row) => row.id === requestedMemberId)) {
    return requestedMemberId;
  }

  return rows[0]?.id;
}

function matchesPipelineFilter(
  member: ChapterMemberRow,
  filter: ChapterLeaderPipelineFilter,
) {
  const pipelineLabel = getPipelineStageLabel(member);

  switch (filter) {
    case "e_board":
      return pipelineLabel === "E-Board";
    case "chair":
      return pipelineLabel === "Chair";
    case "chair_candidate":
      return pipelineLabel === "Chair candidate";
    case "active_contributor":
      return pipelineLabel === "Active contributor";
    case "general_member":
      return pipelineLabel === "General member";
    case "ready":
      return pipelineLabel === "E-Board";
    case "follow_up":
      return (
        member.membershipStatus === "needs_follow_up" ||
        member.openAssignments > 1 ||
        member.proofStatus === "changes_requested"
      );
    case "emerging":
      return pipelineLabel === "Chair candidate";
    case "contributors":
      return pipelineLabel === "Active contributor";
    case "all":
    default:
      return true;
  }
}

function matchesPipelineSearch(
  member: ChapterMemberRow,
  searchQuery: string,
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    member.displayName,
    member.roleLabel,
    member.committeeLane,
    member.nextStep,
    getPipelineStageLabel(member),
    getEvidenceLabel(member),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function getSelectedMemberProfile(
  members: ChapterMemberRow[],
  leaderboard: LeaderboardRow[],
  selectedMemberId: string | undefined,
  context: {
    bestPracticeChapterId: string | null;
    eventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
    eventId: string | null;
    feedPostId: string | null;
    filter: ChapterLeaderPipelineFilter;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    searchQuery: string;
    source: ChapterLeaderCommandCenterSource | null;
    sourceMode: ReadOnlyAppData["source"]["mode"];
  },
): ChapterLeaderCommandCenterMemberProfile | null {
  if (selectedMemberId === mockLeaderProfileId && context.sourceMode === "mock") {
    return getMockLeaderProfile(context);
  }

  const member = members.find((item) => item.id === selectedMemberId);
  if (!member) {
    return null;
  }

  const detail =
    memberProfileDetailById[member.id] ??
    memberProfileDetailById["member-zara"];
  const navigationOptions = getMemberProfileNavigationOptions(member.id, context);
  const backToContext = getMemberBackToContext(member.id, context);
  const profileHref = buildChapterLeaderCommandCenterHref("member_profile", {
    ...navigationOptions,
  });
  const backToPipelineHref = buildChapterLeaderCommandCenterHref("members", {
    ...navigationOptions,
  });

  return {
    id: member.id,
    displayName: member.displayName,
    roleLabel: member.roleLabel,
    committeeLane: member.committeeLane,
    pipelineLabel: getPipelineStageLabel(member),
    points: member.points,
    weeklyPointsDeltaLabel: detail.weeklyPointsDeltaLabel,
    eventsCreatedLabel: detail.eventsCreatedLabel,
    completedActions: member.completedActions,
    openAssignments: member.openAssignments,
    bridgeVideosLabel: detail.bridgeVideosLabel,
    proofStatus: readableToken(member.proofStatus),
    nextStep: member.nextStep,
    recognition: getMemberRecognitionLabel(member, leaderboard),
    readinessLabel: getSuccessionReadinessLabel(member),
    badgeLabel: detail.badgeLabel,
    lastActiveLabel: detail.lastActiveLabel,
    sltInterestLabel: detail.sltInterestLabel,
    volunteerHoursLabel: detail.volunteerHoursLabel,
    fundraisingLabel: detail.fundraisingLabel,
    engagementLabel: detail.engagementLabel,
    valuesAlignment: detail.valuesAlignment,
    pointsHistory: detail.pointsHistory,
    activityTimeline: detail.activityTimeline,
    leaderNotes: detail.leaderNotes,
    leadershipActions: detail.leadershipActions.map((action) => ({
      ...action,
      href: getMemberLeadershipActionHref(action, member.id, {
        ...context,
        source: context.source,
      }),
    })),
    reviewContext: getMemberReviewContext(member, context, backToPipelineHref),
    backToContextLabel: backToContext.label,
    backToContextHref: backToContext.href,
    backToPipelineHref,
    profileHref,
  };
}

function getMockLeaderProfile(context: {
  bestPracticeChapterId: string | null;
  eventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
  eventId: string | null;
  feedPostId: string | null;
  filter: ChapterLeaderPipelineFilter;
  leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
  leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
  searchQuery: string;
  source: ChapterLeaderCommandCenterSource | null;
}): ChapterLeaderCommandCenterMemberProfile {
  const backToPipelineHref = buildChapterLeaderCommandCenterHref("members", {
    source: context.source,
    bestPracticeChapterId: context.bestPracticeChapterId,
    eventCommitteeFilter: context.eventCommitteeFilter,
    eventId: context.eventId,
    feedPostId: context.feedPostId,
    pipelineFilter: context.filter,
    leaderboardMetric: context.leaderboardMetric,
    leaderboardRegion: context.leaderboardRegion,
    searchQuery: context.searchQuery,
  });
  const backToContext = getMemberBackToContext(mockLeaderProfileId, context);

  const buildLeaderProfileHref = (quickAction?: ChapterLeaderQuickActionState) =>
    buildChapterLeaderCommandCenterHref("member_profile", {
      ...getMemberProfileNavigationOptions(mockLeaderProfileId, context),
      quickAction,
    });

  return {
    id: mockLeaderProfileId,
    displayName: "Sofia Reyes",
    roleLabel: "President",
    committeeLane: "E-Board Committee",
    pipelineLabel: "E-Board",
    points: 1240,
    weeklyPointsDeltaLabel: "+85 this week",
    eventsCreatedLabel: "8 this semester",
    completedActions: 24,
    openAssignments: 0,
    bridgeVideosLabel: "3 submitted",
    proofStatus: "Approved",
    nextStep: "Document handoff context for the next chapter leader and keep SLT follow-through visible.",
    recognition: "Values Aligned",
    readinessLabel: "E-Board ready",
    badgeLabel: "Strong E-Board candidate",
    lastActiveLabel: "Today",
    sltInterestLabel: "Yes — signed up",
    volunteerHoursLabel: "12 hrs",
    fundraisingLabel: "$1,200",
    engagementLabel: "94%",
    valuesAlignment: [
      {
        label: "Impeccable Character",
        summary: "Reliable, accountable, shows up consistently. Well-regarded by peers across the chapter.",
      },
      {
        label: "Fire / Agency",
        summary: "Proactively creates events and recruits members without prompting. High initiative.",
      },
      {
        label: "Growth",
        summary: "Actively seeks coaching, reflection, and feedback. Embraces hard conversations.",
      },
    ],
    pointsHistory: [
      { label: "Apr W1", value: 920 },
      { label: "Apr W2", value: 980 },
      { label: "Apr W3", value: 1015 },
      { label: "Apr W4", value: 1080 },
      { label: "May W1", value: 1125 },
      { label: "May W2", value: 1160 },
      { label: "May W3", value: 1185 },
      { label: "May W4", value: 1205 },
      { label: "Jun W1", value: 1220 },
      { label: "Jun W2", value: 1240 },
    ],
    activityTimeline: [
      { dateLabel: "Jun 12", detail: "Attended SLT Interest Meeting" },
      { dateLabel: "Jun 10", detail: "Created Moving Mountains Kickoff event" },
      { dateLabel: "Jun 8", detail: "Submitted evidence for 3 actions" },
      { dateLabel: "Jun 3", detail: "Completed fundraising action — $420 raised" },
      { dateLabel: "May 29", detail: "Promoted to committee co-lead" },
      { dateLabel: "May 22", detail: "Submitted bridge video: Info Night Guide" },
    ],
    leaderNotes: [
      {
        dateLabel: "Jun 8, 2025",
        authorLabel: "Sofia Reyes (President)",
        body: "Sofia Reyes is consistently one of the most dependable members of this chapter. Shows up, follows through, and brings others along. Values interview recommended before end of June. Strong candidate for a larger role next semester.",
      },
    ],
    leadershipActions: [
      {
        label: "Promote to Chair",
        href: buildLeaderProfileHref("promote_to_chair"),
        tone: "primary",
      },
      {
        label: "Schedule Values Interview",
        href: buildLeaderProfileHref("schedule_values_interview"),
        tone: "secondary",
      },
      {
        label: "Open Event Context",
        href: buildLeaderProfileHref("assign_leadership_action"),
        tone: "secondary",
      },
      {
        label: "Nominate for E-Board",
        href: buildLeaderProfileHref("nominate_for_eboard"),
        tone: "secondary",
      },
      {
        label: "Add Note",
        href: buildLeaderProfileHref("add_leader_note"),
        tone: "secondary",
      },
    ],
    reviewContext: null,
    backToContextLabel: backToContext.label,
    backToContextHref: backToContext.href,
    backToPipelineHref,
    profileHref: buildChapterLeaderCommandCenterHref("member_profile", {
      ...getMemberProfileNavigationOptions(mockLeaderProfileId, context),
    }),
  };
}

function getMemberReviewContext(
  member: ChapterMemberRow,
  context: {
    bestPracticeChapterId: string | null;
    eventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
    eventId: string | null;
    feedPostId: string | null;
    filter: ChapterLeaderPipelineFilter;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    searchQuery: string;
    source: ChapterLeaderCommandCenterSource | null;
  },
  backToPipelineHref: string,
) {
  if (context.source === "events") {
    return {
      eyebrow: "Event review follow-through",
      title: "Attendance review context is active",
      summary: `${member.displayName} was opened from the leader event shell, so this profile should keep the active event, attendance follow-through, and point-ready readback visible before the review turns into a generic member check-in.`,
      actionLabel: "Back to event performance",
      actionHref: buildChapterLeaderCommandCenterHref("events", {
        source: "events",
        memberId: member.id,
        eventCommitteeFilter: context.eventCommitteeFilter,
        eventId: context.eventId,
        pipelineFilter: context.filter,
        searchQuery: context.searchQuery,
      }),
    };
  }

  if (context.source === "leaderboard") {
    return {
      eyebrow: "Leaderboard follow-through",
      title: "Points readback context is active",
      summary: `${member.displayName} was opened from the attendance leaderboard readback, so this profile should keep the same points and comparison context visible before the review turns into a disconnected roster pass.`,
      actionLabel: "Back to leaderboard",
      actionHref: buildChapterLeaderCommandCenterHref("leaderboard", {
        source: "leaderboard",
        memberId: member.id,
        leaderboardMetric: context.leaderboardMetric,
        leaderboardRegion: context.leaderboardRegion,
        bestPracticeChapterId: context.bestPracticeChapterId,
      }),
    };
  }

  if (context.filter !== "follow_up") {
    return null;
  }

  const searchNote = context.searchQuery
    ? ` The follow-up queue is narrowed by "${context.searchQuery}" right now.`
    : "";

  if (context.source === "feed_analytics") {
    const feedPostTitle = context.feedPostId ? getFeedPostTitleById(context.feedPostId) : null;
    const feedPostNote = feedPostTitle
      ? ` This review was opened from "${feedPostTitle}," so the follow-up should answer what that specific post suggests this student needs next.`
      : "";
    return {
      eyebrow: "Feed analytics follow-up",
      title: "Re-engagement context is active",
      summary: `${member.displayName} was opened from Feed Analytics after low-engagement review, so this profile should answer one practical question first: what content or outreach move would help this member respond, rejoin, or regain momentum this week?${feedPostNote}${searchNote}`,
      actionLabel: feedPostTitle ? "Back to selected post" : "Back to re-engagement queue",
      actionHref: feedPostTitle
        ? buildChapterLeaderCommandCenterHref("feed_analytics", {
            source: "feed_analytics",
            memberId: member.id,
            feedPostId: context.feedPostId,
            pipelineFilter: context.filter,
            searchQuery: context.searchQuery,
          })
        : backToPipelineHref,
    };
  }

  return {
    eyebrow: "Follow-up review",
    title: "Re-engagement context is active",
    summary: `${member.displayName} was opened from the leader follow-up lane, so this profile should answer one practical question first: what would help this member respond, rejoin, or regain momentum this week?${searchNote}`,
    actionLabel: "Open follow-up queue",
    actionHref: backToPipelineHref,
  };
}

function getMemberLeadershipActionHref(
  action: ChapterLeaderCommandCenterMemberProfile["leadershipActions"][number],
  memberId: string,
  context: {
    bestPracticeChapterId: string | null;
    eventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
    eventId: string | null;
    feedPostId: string | null;
    filter: ChapterLeaderPipelineFilter;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    searchQuery: string;
    source: ChapterLeaderCommandCenterSource | null;
  },
) {
  const navigationOptions = getMemberProfileNavigationOptions(memberId, context);

  switch (action.label) {
    case "Promote to Chair":
      return buildChapterLeaderCommandCenterHref("member_profile", {
        ...navigationOptions,
        quickAction: "promote_to_chair",
      });
    case "Nominate for E-Board":
      return buildChapterLeaderCommandCenterHref("member_profile", {
        ...navigationOptions,
        quickAction: "nominate_for_eboard",
      });
    case "Schedule Values Interview":
      return buildChapterLeaderCommandCenterHref("member_profile", {
        ...navigationOptions,
        quickAction: "schedule_values_interview",
      });
    case "Assign Leadership Action":
    case "Open Event Context":
      return buildChapterLeaderCommandCenterHref("member_profile", {
        ...navigationOptions,
        pipelineFilter: context.filter !== "all" ? context.filter : "follow_up",
        quickAction: "assign_leadership_action",
      });
    case "Add Note":
      return buildChapterLeaderCommandCenterHref("member_profile", {
        ...navigationOptions,
        quickAction: "add_leader_note",
      });
    default:
      return action.href;
  }
}

function getPipelineRows(
  members: ChapterMemberRow[],
  leaderboard: LeaderboardRow[],
  context: {
    bestPracticeChapterId: string | null;
    eventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
    eventId: string | null;
    filter: ChapterLeaderPipelineFilter;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    searchQuery: string;
    source: ChapterLeaderCommandCenterSource | null;
    selectedMemberId: string | null;
  },
): ChapterLeaderCommandCenterPipelineRow[] {
  const totalPoints = members.reduce((sum, member) => sum + member.points, 0);
  const selectedMemberId = context.selectedMemberId;

  return [...members]
    .sort((left, right) => getSuccessionCandidateScore(right) - getSuccessionCandidateScore(left))
    .filter((member) => matchesPipelineFilter(member, context.filter))
    .filter((member) => matchesPipelineSearch(member, context.searchQuery))
    .map((member) => {
      const override = getMockPipelineRowOverride(member.id);
      const detail =
        memberProfileDetailById[member.id] ??
        memberProfileDetailById["member-zara"];
      const weeklyMovement =
        member.completedActions * 10 +
        member.openAssignments * 4 +
        (member.proofStatus === "approved"
          ? 8
          : member.proofStatus === "pending"
            ? 4
            : member.proofStatus === "changes_requested"
              ? 2
              : 0);
      const chapterShare =
        totalPoints > 0 ? Math.max(4, Math.round((member.points / totalPoints) * 100)) : 0;

      return {
        id: member.id,
        displayName: member.displayName,
        initials: getInitials(member.displayName),
        roleLabel: member.roleLabel,
        committeeLane: member.committeeLane,
        lastActiveLabel: override?.lastActiveLabel ?? detail.lastActiveLabel,
        points: override?.points ?? member.points,
        weeklyMovementLabel: override?.weeklyMovementLabel ?? `${weeklyMovement}`,
        eventsMadeLabel: override?.eventsMadeLabel ?? `${getMemberEventTouchCount(member)}`,
        attendanceLabel: override?.attendanceLabel ?? `${getMemberAttendanceRate(member)}%`,
        chapterShareLabel: override?.chapterShareLabel ?? `${chapterShare}%`,
        actionsLabel: override?.actionsLabel ?? `${member.completedActions}`,
        evidenceLabel: getEvidenceLabel(member),
        bridgeLabel: getBridgeLabel(member),
        fundraisingLabel: getFundraisingLabel(member),
        valuesLabel: override?.valuesLabel ?? getMemberRecognitionLabel(member, leaderboard),
        pipelineLabel: getPipelineStageLabel(member),
        nextStepLabel: override?.nextStepLabel ?? toShortSentence(member.nextStep),
        href: buildChapterLeaderCommandCenterHref("members", {
          source: context.source,
          memberId: member.id,
          bestPracticeChapterId: context.bestPracticeChapterId,
          eventCommitteeFilter: context.eventCommitteeFilter,
          eventId: context.eventId,
          leaderboardMetric: context.leaderboardMetric,
          leaderboardRegion: context.leaderboardRegion,
          pipelineFilter: context.filter,
          searchQuery: context.searchQuery,
        }),
        profileHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: context.source,
          memberId: member.id,
          bestPracticeChapterId: context.bestPracticeChapterId,
          eventCommitteeFilter: context.eventCommitteeFilter,
          eventId: context.eventId,
          leaderboardMetric: context.leaderboardMetric,
          leaderboardRegion: context.leaderboardRegion,
          pipelineFilter: context.filter,
          searchQuery: context.searchQuery,
        }),
        isSelected: member.id === selectedMemberId,
      };
    });
}

function getInitials(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function getMemberProfileNavigationOptions(
  memberId: string,
  context: {
    bestPracticeChapterId: string | null;
    eventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
    eventId: string | null;
    feedPostId: string | null;
    filter: ChapterLeaderPipelineFilter;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    searchQuery: string;
    source: ChapterLeaderCommandCenterSource | null;
  },
) {
  return {
    source: context.source,
    memberId,
    bestPracticeChapterId: context.bestPracticeChapterId,
    eventCommitteeFilter: context.eventCommitteeFilter,
    eventId: context.eventId,
    feedPostId: context.feedPostId,
    leaderboardMetric: context.leaderboardMetric,
    leaderboardRegion: context.leaderboardRegion,
    pipelineFilter: context.filter,
    searchQuery: context.searchQuery,
  };
}

function getMemberBackToContext(
  memberId: string,
  context: {
    bestPracticeChapterId: string | null;
    eventCommitteeFilter: ChapterLeaderEventCommitteeFilterKey;
    eventId: string | null;
    feedPostId: string | null;
    filter: ChapterLeaderPipelineFilter;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    searchQuery: string;
    source: ChapterLeaderCommandCenterSource | null;
  },
) {
  switch (context.source) {
    case "events":
      return {
        label: "Back to Event Performance",
        href: buildChapterLeaderCommandCenterHref("events", {
          source: "events",
          memberId,
          eventCommitteeFilter: context.eventCommitteeFilter,
          eventId: context.eventId,
          pipelineFilter: context.filter,
          searchQuery: context.searchQuery,
        }),
      };
    case "leaderboard":
      return {
        label: "Back to Leaderboard",
        href: buildChapterLeaderCommandCenterHref("leaderboard", {
          source: "leaderboard",
          memberId,
          bestPracticeChapterId: context.bestPracticeChapterId,
          leaderboardMetric: context.leaderboardMetric,
          leaderboardRegion: context.leaderboardRegion,
        }),
      };
    default:
      return {
        label: "Back to Member Pipeline",
        href: buildChapterLeaderCommandCenterHref("members", {
          source: context.source,
          memberId,
          bestPracticeChapterId: context.bestPracticeChapterId,
          eventCommitteeFilter: context.eventCommitteeFilter,
          eventId: context.eventId,
          feedPostId: context.feedPostId,
          leaderboardMetric: context.leaderboardMetric,
          leaderboardRegion: context.leaderboardRegion,
          pipelineFilter: context.filter,
          searchQuery: context.searchQuery,
        }),
      };
  }
}

function getPipelineSnapshots(
  joinRequestCount: number,
  pipelineRows: ChapterLeaderCommandCenterPipelineRow[],
): ChapterLeaderCommandCenterPipelineSnapshot[] {
  const readyNowCount = pipelineRows.filter((row) => {
    return (
      row.pipelineLabel === "E-Board" ||
      row.pipelineLabel === "Chair" ||
      row.pipelineLabel === "Chair candidate"
    );
  }).length;
  const needsFollowUpCount = pipelineRows.filter((row) => {
    return row.pipelineLabel === "Follow-up now";
  }).length;
  const visibleOwnersCount = pipelineRows.filter((row) => {
    return row.pipelineLabel === "E-Board" || row.pipelineLabel === "Chair";
  }).length;

  return [
    {
      label: "Members in pipeline",
      value: `${pipelineRows.length}`,
      note: "Visible members in the current pipeline filter and search view.",
    },
    {
      label: "Ready for more",
      value: `${readyNowCount}`,
      note: "Students who already look ready for a larger lane in the chapter loop.",
    },
    {
      label: "Needs follow-up",
      value: `${needsFollowUpCount}`,
      note: "Members whose open work, proof, or follow-through still need a human decision.",
    },
    {
      label: "Pending joins",
      value: `${joinRequestCount}`,
      note: "New students still waiting on chapter placement and a leader-owned welcome.",
    },
    {
      label: "Visible owners",
      value: `${visibleOwnersCount}`,
      note: "Current leaders already carrying a lane inside the chapter operating system.",
    },
  ];
}

function getCommitteeCards(
  members: ChapterMemberRow[],
  proofFollowUps: number,
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterCommitteeCard[] {
  if (sourceMode === "mock") {
    return [
      {
        id: "committee-recruitment",
        name: "Recruitment",
        lane: "Recruitment",
        ownerLabel: "Jordan",
        memberCountLabel: "12 members",
        actionsDoneLabel: "14 actions done",
        eventsCountLabel: "5 events",
        kpiLabel: "82%",
        operatingStatusLabel: "Strong",
        nextEventTitle: "Quad Recruitment Table",
        nextEventTiming: "Jun 24 - Freshman outreach push",
        lumaStatusLabel: "mock linked",
        summary: "Recruitment is moving with real volume and consistent follow-through.",
        href: "",
      },
      {
        id: "committee-fundraising",
        name: "Fundraising",
        lane: "Fundraising",
        ownerLabel: "Amara",
        memberCountLabel: "8 members",
        actionsDoneLabel: "9 actions done",
        eventsCountLabel: "3 events",
        kpiLabel: "61%",
        operatingStatusLabel: "Needs Attention",
        nextEventTitle: "Bake Sale Closeout",
        nextEventTiming: "Jun 18 - Needs attendance + proof clean-up",
        lumaStatusLabel: "not linked",
        summary: "The lane is active, but it still needs tighter post-event cleanup and proof.",
        href: "",
      },
      {
        id: "committee-events",
        name: "Events",
        lane: "Events",
        ownerLabel: "Marcus + Elena",
        memberCountLabel: "14 members",
        actionsDoneLabel: "18 actions done",
        eventsCountLabel: "11 events",
        kpiLabel: "94%",
        operatingStatusLabel: "Strong",
        nextEventTitle: "Chapter General Meeting",
        nextEventTiming: "Jun 22 - Chapter-wide operating check-in",
        lumaStatusLabel: "mock linked",
        summary: "Events is the chapter's strongest operating lane right now.",
        href: "",
      },
      {
        id: "committee-slt-promotion",
        name: "SLT Promotion",
        lane: "SLT Promotion",
        ownerLabel: "DeShawn",
        memberCountLabel: "6 members",
        actionsDoneLabel: "8 actions done",
        eventsCountLabel: "4 events",
        kpiLabel: "54%",
        operatingStatusLabel: "Needs Attention",
        nextEventTitle: "SLT Interest Follow-up",
        nextEventTiming: "Jun 20 - Values + cost concerns still need follow-through",
        lumaStatusLabel: "Manual check-in",
        summary: "Student interest exists, but the lane needs sharper objection handling and follow-up.",
        href: "",
      },
      {
        id: "committee-communications",
        name: "Communications",
        lane: "Communications",
        ownerLabel: "Priya",
        memberCountLabel: "9 members",
        actionsDoneLabel: "16 actions done",
        eventsCountLabel: "2 events",
        kpiLabel: "78%",
        operatingStatusLabel: "Strong",
        nextEventTitle: "Bridge Video Workshop",
        nextEventTiming: "Jun 25 - Story capture + reuse practice",
        lumaStatusLabel: "Manual check-in",
        summary: "Comms is producing usable stories, but it still depends on a few strong owners.",
        href: "",
      },
      {
        id: "committee-service",
        name: "Service / Local Volunteering",
        lane: "Service",
        ownerLabel: "Nadia",
        memberCountLabel: "7 members",
        actionsDoneLabel: "7 actions done",
        eventsCountLabel: "3 events",
        kpiLabel: "43%",
        operatingStatusLabel: "Needs Attention",
        nextEventTitle: "Community Meal Service",
        nextEventTiming: "Jun 19 - Reflection and attendance follow-through needed",
        lumaStatusLabel: "not linked",
        summary: "The mission fit is strong, but event follow-through and handoff consistency are still thin.",
        href: "",
      },
      {
        id: "committee-member-engagement",
        name: "Member Engagement",
        lane: "Member Experience",
        ownerLabel: "No chair assigned",
        memberCountLabel: "5 members",
        actionsDoneLabel: "3 actions done",
        eventsCountLabel: "1 event",
        kpiLabel: "22%",
        operatingStatusLabel: "Inactive",
        nextEventTitle: "No next event scheduled",
        nextEventTiming: "Needs chair assignment",
        lumaStatusLabel: "not linked",
        summary: "This lane exists, but it does not yet have visible ownership or steady operating rhythm.",
        href: "",
      },
    ];
  }

  const activeLanes = new Set<string>(
    members
      .map((member) => member.committeeLane)
      .filter((lane) => lane !== "Executive Board"),
  );

  if (proofFollowUps > 0) {
    activeLanes.add("Proof");
  }

  return getActionCommittees()
    .filter((committee) => activeLanes.has(committee.lane))
    .map((committee) => {
      const owner = members.find((member) => member.committeeLane === committee.lane);
      const nextEvent = getEventPlansForCommittee(committee.id)[0];

      return {
        id: committee.id,
        name: committee.name,
        lane: committee.lane,
        ownerLabel:
          owner?.displayName ??
          (committee.lane === "Proof" ? "Leader proof follow-up" : "Open owner"),
        memberCountLabel: `${members.filter((member) => member.committeeLane === committee.lane).length} members`,
        actionsDoneLabel: `${members
          .filter((member) => member.committeeLane === committee.lane)
          .reduce((total, member) => total + member.completedActions, 0)} actions done`,
        eventsCountLabel: `${getEventPlansForCommittee(committee.id).length} events`,
        kpiLabel: owner ? `${Math.max(38, Math.min(94, 46 + owner.points))}%` : "—",
        operatingStatusLabel: owner ? "Active" : "Needs Owner",
        nextEventTitle: nextEvent?.title ?? "No mock-linked event yet",
        nextEventTiming: nextEvent?.timing ?? "Needs planning",
        lumaStatusLabel: nextEvent ? readableToken(nextEvent.lumaStatus) : "not linked",
        summary: getCommitteeOperatingSummary(committee),
        href: "",
      };
    });
}

function getSelectedCommitteeId(
  committees: ChapterLeaderCommandCenterCommitteeCard[],
  committeeId?: string,
) {
  if (committeeId && committees.some((committee) => committee.id === committeeId)) {
    return committeeId;
  }

  return null;
}

function getRequestedCommitteeId(
  committees: ChapterLeaderCommandCenterCommitteeCard[],
  committeeId?: string,
) {
  if (committeeId && committees.some((committee) => committee.id === committeeId)) {
    return committeeId;
  }

  return null;
}

function getSelectedBridgeVideoId(
  entries: ChapterLeaderCommandCenterBridgeVideoEntry[],
  bridgeVideoId?: string,
) {
  if (bridgeVideoId && entries.some((entry) => entry.id === bridgeVideoId)) {
    return bridgeVideoId;
  }

  return null;
}

function getSelectedEventId(
  events: ChapterLeaderCommandCenterEventCard[],
  eventId?: string,
) {
  if (eventId && events.some((event) => event.id === eventId)) {
    return eventId;
  }

  return null;
}

function getSelectedBestPracticeChapterId(
  chapters: ChapterLeaderCommandCenterLeaderboardChapter[],
  chapterId?: string,
) {
  if (chapterId && chapters.some((chapter) => chapter.id === chapterId)) {
    return chapterId;
  }

  return null;
}

function getBestPracticeChapterName(chapterId?: string | null) {
  switch (chapterId) {
    case "leaderboard-ucla":
      return "UCLA MEDLIFE";
    case "leaderboard-mcgill":
      return "McGill MEDLIFE";
    case "leaderboard-boston-college":
      return "Boston College MEDLIFE";
    case "leaderboard-ut-austin":
      return "UT Austin MEDLIFE";
    default:
      return null;
  }
}

function getCommitteesOverview(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  committees: ChapterLeaderCommandCenterCommitteeCard[],
): ChapterLeaderCommandCenterCommitteesOverview {
  if (sourceMode === "mock") {
    return {
      activeCommitteesLabel: "5 / 7",
      totalOpenActionsLabel: "29",
      committeesWithoutChairsLabel: "2",
    };
  }

  const activeCount = committees.filter(
    (committee) => committee.operatingStatusLabel !== "Inactive",
  ).length;
  const committeesWithoutChairs = committees.filter((committee) =>
    committee.ownerLabel.toLowerCase().includes("open") ||
    committee.ownerLabel.toLowerCase().includes("no chair")
  ).length;
  const totalOpenActions = committees.reduce((total, committee) => {
    const completedActions = Number.parseInt(committee.actionsDoneLabel, 10);
    return total + (Number.isNaN(completedActions) ? 0 : completedActions);
  }, 0);

  return {
    activeCommitteesLabel: `${activeCount} / ${committees.length}`,
    totalOpenActionsLabel: `${totalOpenActions}`,
    committeesWithoutChairsLabel: `${committeesWithoutChairs}`,
  };
}

function getEventCards(
  members: ChapterMemberRow[],
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterEventCard[] {
  if (sourceMode === "mock") {
    return [
      {
        id: "bc-event-moving-mountains-kickoff",
        title: "Moving Mountains Kickoff",
        lane: "Events",
        ownerLabel: "Marcus Chen",
        timing: "Week 1",
        dateLabel: "Jun 10",
        lumaStatusLabel: "mock linked",
        rsvpCount: 48,
        attendedCount: 39,
        attendanceRateLabel: "81%",
        eventStatusLabel: "Past",
        proofStatusLabel: "Done",
        followUpStatusLabel: "Done",
        creatorLabel: "Marcus Chen",
        expectedStudentAction: "RSVP, attend, and commit to one movement-building follow-up.",
        proofPrompt: "Capture one student story about why the kickoff made the campaign feel real.",
        href: "/rush-month/events/event-rush-social-001",
        eventFlowHref: "/rush-month/events/event-rush-social-001",
      },
      {
        id: "bc-event-slt-interest",
        title: "SLT Interest Meeting",
        lane: "SLT Promotion",
        ownerLabel: "DeShawn Williams",
        timing: "Week 2",
        dateLabel: "Jun 12",
        lumaStatusLabel: "Manual check-in",
        rsvpCount: 22,
        attendedCount: 18,
        attendanceRateLabel: "82%",
        eventStatusLabel: "Past",
        proofStatusLabel: "Pending",
        followUpStatusLabel: "Pending",
        creatorLabel: "DeShawn Williams",
        expectedStudentAction: "Hear peer proof, name one concern, and ask for follow-up.",
        proofPrompt: "Capture proof that answers cost, impact, belonging, or parent hesitation.",
        href: "/rush-month/events",
        eventFlowHref: "/rush-month/events",
      },
      {
        id: "bc-event-quad-tabling",
        title: "Tabling: Quad Recruitment",
        lane: "Recruitment",
        ownerLabel: "Jordan Kim",
        timing: "Week 2",
        dateLabel: "Jun 15",
        lumaStatusLabel: "not linked",
        rsvpCount: null,
        attendedCount: 14,
        attendanceRateLabel: "—",
        eventStatusLabel: "Past",
        proofStatusLabel: "Missing",
        followUpStatusLabel: "Overdue",
        creatorLabel: "Jordan Kim",
        expectedStudentAction: "Talk to new students, collect leads, and assign the first follow-up.",
        proofPrompt: "Record what students asked and what convinced them to stay in touch.",
        href: "/rush-month/events",
        eventFlowHref: "/rush-month/events",
      },
      {
        id: "bc-event-bake-sale",
        title: "Fundraising Bake Sale",
        lane: "Fundraising",
        ownerLabel: "Amara Okonkwo",
        timing: "Week 3",
        dateLabel: "Jun 17",
        lumaStatusLabel: "not linked",
        rsvpCount: 30,
        attendedCount: null,
        attendanceRateLabel: "—",
        eventStatusLabel: "Today",
        proofStatusLabel: "Pending",
        followUpStatusLabel: "Pending",
        creatorLabel: "Amara Okonkwo",
        expectedStudentAction: "Take one shift, invite a friend, and help close the fundraiser cleanly.",
        proofPrompt: "Ask one student why the fundraiser felt doable and worth repeating.",
        href: "/rush-month/events",
        eventFlowHref: "/rush-month/events",
      },
      {
        id: "bc-event-community-meal",
        title: "Community Meal Service",
        lane: "Service",
        ownerLabel: "Nadia Osei",
        timing: "Week 3",
        dateLabel: "Jun 19",
        lumaStatusLabel: "not linked",
        rsvpCount: 16,
        attendedCount: null,
        attendanceRateLabel: "—",
        eventStatusLabel: "Upcoming",
        proofStatusLabel: "Pending",
        followUpStatusLabel: "—",
        creatorLabel: "Nadia Osei",
        expectedStudentAction: "Show up, serve, and leave one reflection that explains the impact.",
        proofPrompt: "Capture why the service event made MEDLIFE feel action-oriented.",
        href: "/rush-month/events",
        eventFlowHref: "/rush-month/events",
      },
      {
        id: "bc-event-general-meeting",
        title: "Chapter General Meeting",
        lane: "Events",
        ownerLabel: "Sofia Reyes",
        timing: "Week 4",
        dateLabel: "Jun 22",
        lumaStatusLabel: "mock linked",
        rsvpCount: 55,
        attendedCount: null,
        attendanceRateLabel: "—",
        eventStatusLabel: "Upcoming",
        proofStatusLabel: "Pending",
        followUpStatusLabel: "—",
        creatorLabel: "Sofia Reyes",
        expectedStudentAction: "Attend, bring one friend, and leave with the next visible chapter action.",
        proofPrompt: "Capture the moment a student understood where they fit in the chapter.",
        href: "/rush-month/events",
        eventFlowHref: "/rush-month/events",
      },
      {
        id: "bc-event-bridge-video-workshop",
        title: "Bridge Video Workshop",
        lane: "Comms",
        ownerLabel: "Priya Sharma",
        timing: "Week 4",
        dateLabel: "Jun 25",
        lumaStatusLabel: "Manual check-in",
        rsvpCount: 18,
        attendedCount: null,
        attendanceRateLabel: "—",
        eventStatusLabel: "Upcoming",
        proofStatusLabel: "Pending",
        followUpStatusLabel: "—",
        creatorLabel: "Priya Sharma",
        expectedStudentAction: "Record one story that helps the next student picture belonging.",
        proofPrompt: "Capture a bridge video with a clear hesitation and a believable answer.",
        href: "/rush-month/events",
        eventFlowHref: "/rush-month/events",
      },
    ];
  }

  return getEventPlansForCampaign("rush-month").map((eventPlan, index) => {
    const owner = members.find((member) => member.roleLabel === eventPlan.ownerRole);
    const committeeLane = getActionCommittees().find(
      (committee) => committee.id === eventPlan.committeeId,
    )?.lane;
    const creatorLabel = owner?.displayName ?? eventPlan.ownerRole;
    const mockRsvp = index === 0 ? 48 : index === 1 ? 22 : null;
    const mockAttended = index === 0 ? 39 : index === 1 ? 18 : null;
    const mockRate =
      mockRsvp && mockAttended ? `${Math.round((mockAttended / mockRsvp) * 100)}%` : "—";

    return {
      id: eventPlan.id,
      title: eventPlan.title,
      lane: committeeLane ?? "Campaign",
      ownerLabel: creatorLabel,
      timing: eventPlan.timing,
      dateLabel: index === 0 ? "Jun 10" : "Jun 12",
      lumaStatusLabel: readableToken(eventPlan.lumaStatus),
      rsvpCount: mockRsvp,
      attendedCount: mockAttended,
      attendanceRateLabel: mockRate,
      eventStatusLabel: "Past",
      proofStatusLabel: index === 0 ? "Done" : "Pending",
      followUpStatusLabel: index === 0 ? "Done" : "Pending",
      creatorLabel,
      expectedStudentAction: eventPlan.expectedStudentAction,
      proofPrompt: eventPlan.proofPrompt,
      href: `/rush-month/events/${eventPlan.id}`,
      eventFlowHref: `/rush-month/events/${eventPlan.id}`,
    };
  });
}

function getEventCommitteeFilterKey(
  lane: string,
): ChapterLeaderEventCommitteeFilterKey | null {
  switch (lane) {
    case "Events":
      return "events";
    case "SLT Promotion":
      return "slt_promotion";
    case "Recruitment":
      return "recruitment";
    case "Fundraising":
      return "fundraising";
    case "Service":
      return "service";
    case "Comms":
    case "Communications":
      return "comms";
    default:
      return null;
  }
}

function getFilteredEventCards(
  events: ChapterLeaderCommandCenterEventCard[],
  filter: ChapterLeaderEventCommitteeFilterKey,
) {
  if (filter === "all") {
    return events;
  }

  return events.filter((event) => getEventCommitteeFilterKey(event.lane) === filter);
}

function getEventCommitteeFilters(
  events: ChapterLeaderCommandCenterEventCard[],
  selectedFilter: ChapterLeaderEventCommitteeFilterKey,
  context: {
    source?: ChapterLeaderCommandCenterSource | null;
    memberId: string | null;
    pipelineFilter: ChapterLeaderPipelineFilter;
    searchQuery: string;
  },
): ChapterLeaderCommandCenterEventCommitteeFilter[] {
  const availableKeys = new Set<ChapterLeaderEventCommitteeFilterKey>(["all"]);

  for (const event of events) {
    const key = getEventCommitteeFilterKey(event.lane);
    if (key) {
      availableKeys.add(key);
    }
  }

  return (
    Object.entries(eventCommitteeFilterLabels) as Array<
      [ChapterLeaderEventCommitteeFilterKey, string]
    >
  )
    .filter(([key]) => availableKeys.has(key))
    .map(([key, label]) => ({
      key,
      label,
      isActive: selectedFilter === key,
      href: buildChapterLeaderCommandCenterHref("events", {
        source: context.source,
        memberId: context.memberId,
        pipelineFilter: context.pipelineFilter,
        searchQuery: context.searchQuery,
        eventCommitteeFilter: key,
      }),
    }));
}

function getEventsOverview(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  eventCards: ChapterLeaderCommandCenterEventCard[],
): ChapterLeaderCommandCenterEventsOverview {
  if (sourceMode === "mock") {
    return {
      monthLabel: "June 2025",
      totalEventsThisMonth: 12,
      attendanceRateLabel: "67%",
      attendanceDeltaLabel: "-4% vs last month",
      rsvpConversionLabel: "79%",
      eventsWithProofLabel: "8/12",
      followUpsOverdue: 2,
      socialRecruitingLabel: "Chapter tracked",
      socialRecruitingNote:
        "Use these signals to judge whether chapter publishing and event promotion are turning into real student interest.",
    };
  }

  const eventsWithProof = eventCards.filter((event) => event.proofStatusLabel === "Done").length;
  const overdueFollowUps = eventCards.filter(
    (event) => event.followUpStatusLabel === "Overdue",
  ).length;
  const pastEvents = eventCards.filter((event) => event.rsvpCount && event.attendedCount);
  const averageAttendanceRate = pastEvents.length > 0
    ? `${Math.round(
        pastEvents.reduce((total, event) => {
          if (!event.rsvpCount || !event.attendedCount) {
            return total;
          }

          return total + event.attendedCount / event.rsvpCount;
        }, 0) /
          pastEvents.length *
          100,
      )}%`
    : "—";

  return {
    monthLabel: "Current month",
    totalEventsThisMonth: eventCards.length,
    attendanceRateLabel: averageAttendanceRate,
    attendanceDeltaLabel: "Mock comparison pending",
    rsvpConversionLabel: `${pastEvents.length}/${eventCards.length}`,
    eventsWithProofLabel: `${eventsWithProof}/${eventCards.length}`,
    followUpsOverdue: overdueFollowUps,
    socialRecruitingLabel: "Chapter tracked",
    socialRecruitingNote:
      "Review chapter publishing, promotion, and turnout together so the next event push feels coordinated.",
  };
}

function getSocialRecruitingMetrics(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterSocialRecruitingMetric[] {
  if (sourceMode === "mock") {
    return [
      { label: "Posts Published", value: "24" },
      { label: "Followers", value: "1,240" },
      { label: "Avg Engagement", value: "4.8%" },
      { label: "Clicks to Join", value: "84" },
      { label: "Leads Generated", value: "18" },
      { label: "Best Post Reach", value: "2,180" },
    ];
  }

  return [];
}

function getImpactCards(
  recognition: ReturnType<typeof getMemberRecognitionSummary>,
  bridgeStoryCount: number,
): ChapterLeaderCommandCenterMetric[] {
  return [
    ...recognition.impacts,
    {
      label: "Bridge stories",
      value: `${bridgeStoryCount}`,
      note: "Proof assets that can help a hesitant student believe this chapter feels real.",
    },
  ];
}

function getImpactHighlights(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  options: {
    memberId: string | null;
    source: ChapterLeaderCommandCenterSource | null;
  },
): ChapterLeaderCommandCenterImpactHighlight[] {
  if (sourceMode === "mock") {
    return [
      {
        id: "impact-local-meals",
        icon: "🍽️",
        eyebrow: "Local Community Impact",
        value: "1,840",
        label: "meals served",
        summary:
          "Your chapter served 1,840 meals to 420 people in the Boston community this year through local partnerships.",
        actionLabel: "Share this story",
        href: buildChapterLeaderCommandCenterHref("impact", {
          memberId: options.memberId,
          source: options.source,
          impactStoryId: "impact-local-meals",
          quickAction: "share_impact_story",
        }),
        tone: "blue",
      },
      {
        id: "impact-global-clinic",
        icon: "🏥",
        eyebrow: "MEDLIFE Global Impact",
        value: "420",
        label: "clinic patients",
        summary:
          "Your SLT travelers contributed to care for 420 patients across MEDLIFE global health projects this cycle.",
        actionLabel: "Share this story",
        href: buildChapterLeaderCommandCenterHref("impact", {
          memberId: options.memberId,
          source: options.source,
          impactStoryId: "impact-global-clinic",
          quickAction: "share_impact_story",
        }),
        tone: "purple",
      },
      {
        id: "impact-moving-mountains",
        icon: "💛",
        eyebrow: "Moving Mountains",
        value: "#3",
        label: "network rank",
        summary:
          "Your Moving Mountains campaign ranks #3 globally - helping fund real infrastructure projects in underserved communities.",
        actionLabel: "Share this story",
        href: buildChapterLeaderCommandCenterHref("impact", {
          memberId: options.memberId,
          source: options.source,
          impactStoryId: "impact-moving-mountains",
          quickAction: "share_impact_story",
        }),
        tone: "amber",
      },
    ];
  }

  return [
    {
      id: "impact-proof-ready",
      eyebrow: "Impact Highlight",
      value: "Live",
      label: "proof stories",
      summary:
        "Impact stories are available, but the final campaign storytelling layout still depends on live chapter data quality.",
      actionLabel: "Open bridge videos",
      href: buildChapterLeaderCommandCenterHref("impact", {
        memberId: options.memberId,
        source: options.source,
        impactStoryId: "impact-proof-ready",
        quickAction: "share_impact_story",
      }),
      tone: "blue",
    },
  ];
}

function getSelectedImpactHighlightId(
  highlights: ChapterLeaderCommandCenterImpactHighlight[],
  impactStoryId?: string,
) {
  if (impactStoryId && highlights.some((highlight) => highlight.id === impactStoryId)) {
    return impactStoryId;
  }

  return null;
}

function getLocalImpactStats(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterImpactStat[] {
  if (sourceMode === "mock") {
    return [
      { label: "Meals Served", value: "1,840" },
      { label: "People Supported", value: "420" },
      { label: "Volunteer Hours", value: "284" },
      { label: "Local Partners", value: "4" },
    ];
  }

  return [];
}

function getGlobalImpactStats(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterImpactStat[] {
  if (sourceMode === "mock") {
    return [
      { label: "SLT Participants", value: "18" },
      { label: "Clinic Patients", value: "420" },
      { label: "Medical Visits", value: "312" },
      { label: "Dental Visits", value: "98" },
      { label: "Pediatric Visits", value: "74" },
      { label: "Women's Health", value: "56" },
      { label: "Project Beneficiaries", value: "280" },
    ];
  }

  return [];
}

function getCampaignImpactOverview(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterCampaignImpactOverview | null {
  if (sourceMode === "mock") {
    return {
      title: "Moving Mountains",
      raisedLabel: "$8,400",
      goalLabel: "$12,000",
      progressLabel: "70% of goal",
      donorsLabel: "94",
      rankLabel: "#3 in network",
      pillars: [
        { label: "Medical", value: "" },
        { label: "Dental", value: "" },
        { label: "Pediatric", value: "" },
        { label: "Women's Health", value: "" },
      ],
    };
  }

  return null;
}

function getBridgeStories(
  proofItems: ProofLibraryItem[],
): ChapterLeaderCommandCenterBridgeStory[] {
  return proofItems
    .filter((item) => {
      return item.proofType === "bridge_video" || item.sharingStatus === "needs_hq_review";
    })
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      sourceLabel: item.sourceLabel,
      proofTypeLabel: readableToken(item.proofType),
      sharingStatusLabel: readableToken(item.sharingStatus),
      hesitationAddressed: item.hesitationAddressed,
      summary: item.summary,
      href: "/proof-library",
    }));
}

function getBridgeVideoMetrics(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterBridgeVideoMetric[] {
  if (sourceMode === "mock") {
    return [
      { label: "Videos Submitted", value: "5" },
      { label: "Total Views", value: "899" },
      { label: "Total Likes", value: "143" },
      { label: "Chapters Using", value: "20" },
    ];
  }

  return [];
}

function getBridgeVideoFilters(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  options: {
    selectedFilter: ChapterLeaderBridgeVideoFilterKey;
    source: ChapterLeaderCommandCenterSource | null;
    memberId: string | null;
    bestPracticeChapterId: string | null;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    impactStoryId: string | null;
    pipelineFilter: ChapterLeaderPipelineFilter;
    searchQuery: string;
    feedPostId: string | null;
    activeQuickAction: ChapterLeaderQuickActionState | null;
    selectedBridgeVideoId: string | null;
    selectedBridgeVideoCategoryLabel: string | null;
  },
): ChapterLeaderCommandCenterBridgeVideoFilter[] {
  if (sourceMode === "mock") {
    const filters: Array<{
      key: ChapterLeaderBridgeVideoFilterKey;
      label: string;
    }> = [
      { key: "all", label: "All" },
      { key: "recruitment", label: "Recruitment" },
      { key: "fundraising", label: "Fundraising" },
      { key: "slt", label: "SLT Promotion" },
      { key: "transition", label: "Leadership Transition" },
      { key: "comms", label: "Communications" },
    ];

    const selectedBridgeVideoFilter = getBridgeVideoCategoryFilterKey(
      options.selectedBridgeVideoCategoryLabel,
    );

    return filters.map((filter) => {
      const preserveSelectedVideo =
        options.selectedBridgeVideoId &&
        (filter.key === "all" || filter.key === selectedBridgeVideoFilter);
      const preserveBridgeQuickAction =
        options.activeQuickAction === "share_to_feed" ||
        options.activeQuickAction === "share_bridge_video" ||
        options.activeQuickAction === "submit_bridge_video" ||
        (options.activeQuickAction === "feature_bridge_video" && preserveSelectedVideo);

      return {
        ...filter,
        isActive: options.selectedFilter === filter.key,
        href: buildChapterLeaderCommandCenterHref("bridge_videos", {
          source: options.source,
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: filter.key,
          feedPostId: options.feedPostId,
          bridgeVideoId: preserveSelectedVideo ? options.selectedBridgeVideoId : null,
          quickAction: preserveBridgeQuickAction ? options.activeQuickAction : null,
        }),
      };
    });
  }

  return [];
}

function getBridgeVideoEntries(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  selectedFilter: ChapterLeaderBridgeVideoFilterKey,
  options: {
    source: ChapterLeaderCommandCenterSource | null;
    memberId: string | null;
    bestPracticeChapterId: string | null;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    impactStoryId: string | null;
    pipelineFilter: ChapterLeaderPipelineFilter;
    searchQuery: string;
    feedPostId: string | null;
  },
): ChapterLeaderCommandCenterBridgeVideoEntry[] {
  if (sourceMode === "mock") {
    const entries: ChapterLeaderCommandCenterBridgeVideoEntry[] = [
      {
        id: "bridge-info-night",
        title: "How to Run a Successful Info Night",
        badgeLabel: "Featured",
        categoryLabel: "Recruitment",
        authorLabel: "Sofia Reyes",
        submittedDateLabel: "Submitted May 15",
        viewsLabel: "284",
        likesLabel: "41",
        commentsLabel: "12",
        sharesLabel: "9",
        chaptersUsingLabel: "6 chapters using",
        href: "/proof-library",
        featureHref: buildChapterLeaderCommandCenterHref("bridge_videos", {
          source: options.source,
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "recruitment",
          feedPostId: options.feedPostId,
          bridgeVideoId: "bridge-info-night",
          quickAction: "feature_bridge_video",
        }),
        shareHref: buildChapterLeaderCommandCenterHref("feed_analytics", {
          source: "bridge_videos",
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "recruitment",
          feedPostId: options.feedPostId,
        }),
      },
      {
        id: "bridge-fundraising-playbook",
        title: "Moving Mountains Fundraising Playbook",
        badgeLabel: "Featured",
        categoryLabel: "Fundraising",
        authorLabel: "Amara Okonkwo",
        submittedDateLabel: "Submitted May 22",
        viewsLabel: "198",
        likesLabel: "34",
        commentsLabel: "8",
        sharesLabel: "7",
        chaptersUsingLabel: "4 chapters using",
        href: "/proof-library",
        featureHref: buildChapterLeaderCommandCenterHref("bridge_videos", {
          source: options.source,
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "fundraising",
          feedPostId: options.feedPostId,
          bridgeVideoId: "bridge-fundraising-playbook",
          quickAction: "feature_bridge_video",
        }),
        shareHref: buildChapterLeaderCommandCenterHref("feed_analytics", {
          source: "bridge_videos",
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "fundraising",
          feedPostId: options.feedPostId,
        }),
      },
      {
        id: "bridge-slt-interest",
        title: "How We Grew SLT Interest 3x in 6 Weeks",
        badgeLabel: null,
        categoryLabel: "SLT Promotion",
        authorLabel: "DeShawn Williams",
        submittedDateLabel: "Submitted Jun 2",
        viewsLabel: "156",
        likesLabel: "27",
        commentsLabel: "5",
        sharesLabel: "4",
        chaptersUsingLabel: "3 chapters using",
        href: "/proof-library",
        featureHref: buildChapterLeaderCommandCenterHref("bridge_videos", {
          source: options.source,
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "slt",
          feedPostId: options.feedPostId,
          bridgeVideoId: "bridge-slt-interest",
          quickAction: "feature_bridge_video",
        }),
        shareHref: buildChapterLeaderCommandCenterHref("feed_analytics", {
          source: "bridge_videos",
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "slt",
          feedPostId: options.feedPostId,
        }),
      },
      {
        id: "bridge-transition-guide",
        title: "Committee Leadership Transition Guide",
        badgeLabel: null,
        categoryLabel: "Leadership Transition",
        authorLabel: "Marcus Chen",
        submittedDateLabel: "Submitted Jun 5",
        viewsLabel: "142",
        likesLabel: "22",
        commentsLabel: "9",
        sharesLabel: "6",
        chaptersUsingLabel: "5 chapters using",
        href: "/proof-library",
        featureHref: buildChapterLeaderCommandCenterHref("bridge_videos", {
          source: options.source,
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "transition",
          feedPostId: options.feedPostId,
          bridgeVideoId: "bridge-transition-guide",
          quickAction: "feature_bridge_video",
        }),
        shareHref: buildChapterLeaderCommandCenterHref("feed_analytics", {
          source: "bridge_videos",
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "transition",
          feedPostId: options.feedPostId,
        }),
      },
      {
        id: "bridge-social-strategy",
        title: "Social Media Posting Strategy for MEDLIFE",
        badgeLabel: null,
        categoryLabel: "Communications",
        authorLabel: "Priya Sharma",
        submittedDateLabel: "Submitted Jun 8",
        viewsLabel: "119",
        likesLabel: "19",
        commentsLabel: "4",
        sharesLabel: "3",
        chaptersUsingLabel: "2 chapters using",
        href: "/proof-library",
        featureHref: buildChapterLeaderCommandCenterHref("bridge_videos", {
          source: options.source,
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "comms",
          feedPostId: options.feedPostId,
          bridgeVideoId: "bridge-social-strategy",
          quickAction: "feature_bridge_video",
        }),
        shareHref: buildChapterLeaderCommandCenterHref("feed_analytics", {
          source: "bridge_videos",
          memberId: options.memberId,
          bestPracticeChapterId:
            options.source === "leaderboard" ? options.bestPracticeChapterId : null,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          impactStoryId: options.impactStoryId,
          pipelineFilter: options.pipelineFilter,
          searchQuery: options.searchQuery,
          bridgeVideoFilter: "comms",
          feedPostId: options.feedPostId,
        }),
      },
    ];

    return entries.filter((entry) => {
      if (selectedFilter === "all") {
        return true;
      }

      const filterByCategory: Record<
        Exclude<ChapterLeaderBridgeVideoFilterKey, "all">,
        ChapterLeaderCommandCenterBridgeVideoEntry["categoryLabel"]
      > = {
        recruitment: "Recruitment",
        fundraising: "Fundraising",
        slt: "SLT Promotion",
        transition: "Leadership Transition",
        comms: "Communications",
      };

      return entry.categoryLabel === filterByCategory[selectedFilter];
    });
  }

  return [];
}

function getFeedAnalyticsBridgeContext(
  selectedFilter: ChapterLeaderBridgeVideoFilterKey,
  options: {
    memberId: string | null;
    pipelineFilter: ChapterLeaderPipelineFilter;
    searchQuery: string;
  },
): ChapterLeaderCommandCenterFeedAnalyticsBridgeContext | null {
  if (selectedFilter === "all") {
    return null;
  }

  const filterLabels: Record<
    Exclude<ChapterLeaderBridgeVideoFilterKey, "all">,
    string
  > = {
    recruitment: "Recruitment",
    fundraising: "Fundraising",
    slt: "SLT Promotion",
    transition: "Leadership Transition",
    comms: "Communications",
  };

  return {
    label: `${filterLabels[selectedFilter]} bridge videos`,
    detail:
      "This analytics view keeps the bridge-video category context so leaders can inspect which story type is being shared and which one is turning into action.",
    backHref: buildChapterLeaderCommandCenterHref("bridge_videos", {
      memberId: options.memberId,
      pipelineFilter: options.pipelineFilter,
      searchQuery: options.searchQuery,
      bridgeVideoFilter: selectedFilter,
    }),
  };
}

function getBridgeVideoCultureNote(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): string {
  if (sourceMode === "mock") {
    return "Every leader who submits a bridge video ensures the next generation doesn't start from zero. Encourage all committee chairs to submit at least one before the end of semester. Videos adopted by other chapters earn network-wide recognition.";
  }

  return "";
}

function getFeedInsights(
  proofItems: ProofLibraryItem[],
): ChapterLeaderCommandCenterFeedInsight[] {
  const storiesInReview = proofItems.filter((item) => item.sharingStatus === "needs_hq_review")
    .length;
  const bridgeVideos = proofItems.filter((item) => item.proofType === "bridge_video")
    .length;
  const internalPlaybooks = proofItems.filter(
    (item) => item.sharingStatus === "approved_for_internal_learning",
  ).length;
  const campaignCount = new Set(proofItems.map((item) => item.campaignSlug)).size;

  return [
    {
      label: "Stories in review",
      value: `${storiesInReview}`,
      note: "Items still waiting for HQ consent, context, or final sharing posture.",
    },
    {
      label: "Bridge videos",
      value: `${bridgeVideos}`,
      note: "Proof clips that can help students picture belonging before they show up.",
    },
    {
      label: "Internal playbooks",
      value: `${internalPlaybooks}`,
      note: "Stories already strong enough for chapter-to-chapter learning.",
    },
    {
      label: "Campaigns represented",
      value: `${campaignCount}`,
      note: "How many campaign families already have some reusable proof in the library.",
    },
  ];
}

function getFeedMetrics(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterFeedMetric[] {
  if (sourceMode === "mock") {
    return [
      { label: "Posts Published", value: "5" },
      { label: "Total Views", value: "1120" },
      { label: "Total Likes", value: "194" },
      { label: "Actions After View", value: "24" },
      { label: "RSVPs From Feed", value: "31" },
    ];
  }

  return [];
}

function getFeedChartRows(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterFeedChartRow[] {
  if (sourceMode === "mock") {
    return [
      { label: "How to Run a S...", likes: 41, comments: 12, actionsAfter: 6 },
      { label: "Moving Mountai...", likes: 38, comments: 9, actionsAfter: 8 },
      { label: "Our bake sale ...", likes: 52, comments: 18, actionsAfter: 2 },
      { label: "Fundraising Pl...", likes: 34, comments: 8, actionsAfter: 5 },
      { label: "SLT info meeti...", likes: 29, comments: 7, actionsAfter: 3 },
    ];
  }

  return [];
}

function getFeedPostRows(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  input: {
    source: ChapterLeaderCommandCenterSource | null;
    memberId: string | null;
    bestPracticeChapterId: string | null;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
    pipelineFilter: ChapterLeaderPipelineFilter;
    searchQuery: string;
    bridgeVideoFilter: ChapterLeaderBridgeVideoFilterKey;
    selectedFeedPostId: string | null;
  },
): ChapterLeaderCommandCenterFeedPostRow[] {
  if (sourceMode === "mock") {
    const preservedBestPracticeChapterId =
      input.source === "leaderboard" ? input.bestPracticeChapterId : null;
    const rows: ChapterLeaderCommandCenterFeedPostRow[] = [
      {
        id: "feed-post-info-night",
        title: "How to Run a Successful Info Night",
        typeLabel: "Bridge Video",
        authorLabel: "Sofia Reyes",
        viewsLabel: "284",
        likesLabel: "41",
        commentsLabel: "12",
        sharesLabel: "9",
        actionsAfterLabel: "6",
        rsvpsLabel: "11",
        dateLabel: "Jun 10",
        badgeLabel: "Bridge Video",
        href: "",
        isSelected: false,
        summary:
          "This post is strongest when the chapter needs a practical recruiting playbook that turns content views into actual info-night RSVPs.",
        nextActionLabel: "Open member review",
        nextActionHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: "feed_analytics",
          memberId: "member-ivy",
          bestPracticeChapterId: preservedBestPracticeChapterId,
          leaderboardMetric: input.leaderboardMetric,
          leaderboardRegion: input.leaderboardRegion,
          pipelineFilter: "follow_up",
          searchQuery: "Ivy",
          feedPostId: "feed-post-info-night",
        }),
      },
      {
        id: "feed-post-campaign-guide",
        title: "Moving Mountains Campaign Guide",
        typeLabel: "Best Practice",
        authorLabel: "MEDLIFE Staff",
        viewsLabel: "312",
        likesLabel: "38",
        commentsLabel: "9",
        sharesLabel: "14",
        actionsAfterLabel: "8",
        rsvpsLabel: "7",
        dateLabel: "Jun 8",
        badgeLabel: "Best Practice",
        href: "",
        isSelected: false,
        summary:
          "This post works best as a chapter-wide operating reference because students can immediately see how the campaign ladder connects events, proof, and fundraising.",
        nextActionLabel: "Open member review",
        nextActionHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: "feed_analytics",
          memberId: "member-zara",
          bestPracticeChapterId: preservedBestPracticeChapterId,
          leaderboardMetric: input.leaderboardMetric,
          leaderboardRegion: input.leaderboardRegion,
          pipelineFilter: "follow_up",
          searchQuery: "Zara",
          feedPostId: "feed-post-campaign-guide",
        }),
      },
      {
        id: "feed-post-bakesale",
        title: "Our bake sale raised $840! Here's how",
        typeLabel: "Chapter Post",
        authorLabel: "Amara Okonkwo",
        viewsLabel: "184",
        likesLabel: "52",
        commentsLabel: "18",
        sharesLabel: "6",
        actionsAfterLabel: "2",
        rsvpsLabel: "0",
        dateLabel: "Jun 12",
        badgeLabel: "Chapter Post",
        href: "",
        isSelected: false,
        summary:
          "This post is useful when the chapter needs fundraising proof that feels specific, peer-led, and easy for another team to copy.",
        nextActionLabel: "Open member review",
        nextActionHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: "feed_analytics",
          memberId: "member-omar",
          bestPracticeChapterId: preservedBestPracticeChapterId,
          leaderboardMetric: input.leaderboardMetric,
          leaderboardRegion: input.leaderboardRegion,
          pipelineFilter: "follow_up",
          searchQuery: "Omar",
          feedPostId: "feed-post-bakesale",
        }),
      },
      {
        id: "feed-post-fundraising",
        title: "Fundraising Playbook 2025",
        typeLabel: "Bridge Video",
        authorLabel: "Amara Okonkwo",
        viewsLabel: "198",
        likesLabel: "34",
        commentsLabel: "8",
        sharesLabel: "7",
        actionsAfterLabel: "5",
        rsvpsLabel: "4",
        dateLabel: "Jun 5",
        badgeLabel: "Bridge Video",
        href: "",
        isSelected: false,
        summary:
          "This bridge video is strongest when leaders need a clearer donor follow-up rhythm tied to visible student ownership.",
        nextActionLabel: "Open member review",
        nextActionHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: "feed_analytics",
          memberId: "member-omar",
          bestPracticeChapterId: preservedBestPracticeChapterId,
          leaderboardMetric: input.leaderboardMetric,
          leaderboardRegion: input.leaderboardRegion,
          pipelineFilter: "follow_up",
          searchQuery: "Omar",
          feedPostId: "feed-post-fundraising",
        }),
      },
      {
        id: "feed-post-slt-recap",
        title: "SLT info meeting recap - 18 signed up!",
        typeLabel: "Chapter Post",
        authorLabel: "DeShawn Williams",
        viewsLabel: "142",
        likesLabel: "29",
        commentsLabel: "7",
        sharesLabel: "3",
        actionsAfterLabel: "3",
        rsvpsLabel: "9",
        dateLabel: "Jun 13",
        badgeLabel: "Chapter Post",
        href: "",
        isSelected: false,
        summary:
          "This post matters most when leaders want to keep SLT interest warm and turn initial excitement into the next concrete traveler step.",
        nextActionLabel: "Open member review",
        nextActionHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: "feed_analytics",
          memberId: "member-maya",
          bestPracticeChapterId: preservedBestPracticeChapterId,
          leaderboardMetric: input.leaderboardMetric,
          leaderboardRegion: input.leaderboardRegion,
          searchQuery: "Sofia",
          feedPostId: "feed-post-slt-recap",
        }),
      },
    ];

    const selectedFeedPostId = input.selectedFeedPostId ?? rows[0]?.id ?? null;

    return rows.map((row) => ({
      ...row,
      href: buildChapterLeaderCommandCenterHref("feed_analytics", {
        source: input.source,
        memberId: input.memberId,
        bestPracticeChapterId:
          input.source === "leaderboard" ? input.bestPracticeChapterId : null,
        leaderboardMetric: input.leaderboardMetric,
        leaderboardRegion: input.leaderboardRegion,
        pipelineFilter: input.pipelineFilter,
        searchQuery: input.searchQuery,
        bridgeVideoFilter: input.bridgeVideoFilter,
        feedPostId: row.id,
      }),
      isSelected: row.id === selectedFeedPostId,
    }));
  }

  return [];
}

function getFeedPostTitleById(feedPostId: string) {
  switch (feedPostId) {
    case "feed-post-info-night":
      return "How to Run a Successful Info Night";
    case "feed-post-campaign-guide":
      return "Moving Mountains Campaign Guide";
    case "feed-post-bakesale":
      return "Our bake sale raised $840! Here's how";
    case "feed-post-fundraising":
      return "Fundraising Playbook 2025";
    case "feed-post-slt-recap":
      return "SLT info meeting recap - 18 signed up!";
    default:
      return null;
  }
}

function getMostEngagedMembers(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterFeedMemberRow[] {
  if (sourceMode === "mock") {
    return [
      { id: "engaged-sofia", displayName: "Sofia Reyes", initials: "SR", scoreLabel: "94 %" },
      { id: "engaged-priya", displayName: "Priya Sharma", initials: "PS", scoreLabel: "91 %" },
      { id: "engaged-jordan", displayName: "Jordan Kim", initials: "JK", scoreLabel: "82 %" },
      { id: "engaged-marcus", displayName: "Marcus Chen", initials: "MC", scoreLabel: "78 %" },
    ];
  }

  return [];
}

function getLeastEngagedMembers(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  options: {
    source: ChapterLeaderCommandCenterSource | null;
    selectedFeedPostId: string | null;
    bestPracticeChapterId: string | null;
    leaderboardMetric: ChapterLeaderLeaderboardMetricKey;
    leaderboardRegion: ChapterLeaderLeaderboardRegionKey;
  },
): ChapterLeaderCommandCenterFeedMemberRow[] {
  if (sourceMode === "mock") {
    const preservedBestPracticeChapterId =
      options.source === "leaderboard" ? options.bestPracticeChapterId : null;

    return [
      {
        id: "member-ivy",
        displayName: "Ivy Invite",
        initials: "II",
        scoreLabel: "22 %",
        actionLabel: "Re-engage",
        actionHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: "feed_analytics",
          memberId: "member-ivy",
          bestPracticeChapterId: preservedBestPracticeChapterId,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          pipelineFilter: "follow_up",
          searchQuery: "Ivy",
          feedPostId: options.selectedFeedPostId,
        }),
      },
      {
        id: "member-omar",
        displayName: "Omar Outreach",
        initials: "OO",
        scoreLabel: "40 %",
        actionLabel: "Re-engage",
        actionHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: "feed_analytics",
          memberId: "member-omar",
          bestPracticeChapterId: preservedBestPracticeChapterId,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          pipelineFilter: "follow_up",
          searchQuery: "Omar",
          feedPostId: options.selectedFeedPostId,
        }),
      },
      {
        id: "member-zara",
        displayName: "Zara Events",
        initials: "ZE",
        scoreLabel: "55 %",
        actionLabel: "Re-engage",
        actionHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: "feed_analytics",
          memberId: "member-zara",
          bestPracticeChapterId: preservedBestPracticeChapterId,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          pipelineFilter: "follow_up",
          searchQuery: "Zara",
          feedPostId: options.selectedFeedPostId,
        }),
      },
      {
        id: "member-maya",
        displayName: "Sofia Alvarez",
        initials: "SA",
        scoreLabel: "58 %",
        actionLabel: "Re-engage",
        actionHref: buildChapterLeaderCommandCenterHref("member_profile", {
          source: "feed_analytics",
          memberId: "member-maya",
          bestPracticeChapterId: preservedBestPracticeChapterId,
          leaderboardMetric: options.leaderboardMetric,
          leaderboardRegion: options.leaderboardRegion,
          pipelineFilter: "follow_up",
          searchQuery: "Sofia",
          feedPostId: options.selectedFeedPostId,
        }),
      },
    ];
  }

  return [];
}

function getSuccessionCandidates(
  members: ChapterMemberRow[],
  leaderboard: LeaderboardRow[],
  sourceMode: ReadOnlyAppData["source"]["mode"],
  selectedMemberId: string | null,
): ChapterLeaderCommandCenterSuccessionCandidate[] {
  if (sourceMode === "mock") {
    return [
      {
        id: "candidate-priya-president",
        displayName: "Priya President",
        currentRole: "President / VP",
        committeeLabel: "Executive Board",
        pointsLabel: "1,240 pts",
        readinessLabel: "Transition anchor",
        badgeLabel: "E-Board",
        reason: "Current president who needs a visible successor plan before graduation.",
        href: buildChapterLeaderCommandCenterHref("succession", {
          memberId: "member-leo",
        }),
        isSelected: selectedMemberId === "member-leo",
      },
      {
        id: "candidate-zara",
        displayName: "Zara Events",
        currentRole: "E-Board",
        committeeLabel: "Med Talk",
        pointsLabel: "1,085 pts",
        readinessLabel: "Ready for a larger lane",
        badgeLabel: "E-Board",
        reason: "Already carrying chapter operations and positioned to mentor event successors.",
        href: buildChapterLeaderCommandCenterHref("succession", {
          memberId: "member-zara",
        }),
        isSelected: selectedMemberId === "member-zara",
      },
      {
        id: "candidate-nina",
        displayName: "Nina Chair",
        currentRole: "Chair",
        committeeLabel: "Social",
        pointsLabel: "920 pts",
        readinessLabel: "Ready for a larger lane",
        badgeLabel: "Chair",
        reason: "Strong fundraiser who still needs a named backup and transition notes.",
        href: buildChapterLeaderCommandCenterHref("succession", {
          memberId: "member-nina",
        }),
        isSelected: selectedMemberId === "member-nina",
      },
      {
        id: "candidate-ivy",
        displayName: "Ivy Invite",
        currentRole: "General Member",
        committeeLabel: "Recruitment",
        pointsLabel: "875 pts",
        readinessLabel: "Good next-wave candidate",
        badgeLabel: "Chair candidate",
        reason: "Visible recruitment owner who could step into a larger lane with coaching.",
        href: buildChapterLeaderCommandCenterHref("succession", {
          memberId: "member-ivy",
        }),
        isSelected: selectedMemberId === "member-ivy",
      },
      {
        id: "candidate-sofia-alvarez",
        displayName: "Sofia Alvarez",
        currentRole: "General Member",
        committeeLabel: "Recruitment",
        pointsLabel: "745 pts",
        readinessLabel: "Good next-wave candidate",
        badgeLabel: "Chair candidate",
        reason: "Welcoming recruiter who needs one owned lane before stepping into a larger chapter role.",
        href: buildChapterLeaderCommandCenterHref("succession", {
          memberId: "member-maya",
        }),
        isSelected: selectedMemberId === "member-maya",
      },
      {
        id: "candidate-omar",
        displayName: "Omar Outreach",
        currentRole: "Action Committee Member",
        committeeLabel: "Local Volunteering",
        pointsLabel: "590 pts",
        readinessLabel: "Good next-wave candidate",
        badgeLabel: "Chair candidate",
        reason: "Mission-aligned service leader who needs more visible evidence and succession reps.",
        href: buildChapterLeaderCommandCenterHref("succession", {
          memberId: "member-omar",
        }),
        isSelected: selectedMemberId === "member-omar",
      },
    ];
  }

  return [...members]
    .filter((member) => !isPresidentOrVp(member))
    .sort((left, right) => getSuccessionCandidateScore(right) - getSuccessionCandidateScore(left))
    .map((member) => ({
      id: member.id,
      displayName: member.displayName,
      currentRole: member.roleLabel,
      committeeLabel: member.committeeLane,
      pointsLabel: `${member.points} pts`,
      readinessLabel: getSuccessionReadinessLabel(member),
      badgeLabel:
        isActionCommitteeChair(member) || isEBoardRole(member)
          ? "Chair"
          : "Chair candidate",
      reason: `${getMemberRecognitionLabel(member, leaderboard)} ${member.nextStep}`,
      href: buildChapterLeaderCommandCenterHref("succession", {
        memberId: member.id,
      }),
      isSelected: member.id === selectedMemberId,
    }))
    .slice(0, 7);
}

function getSuccessionOverview(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  leadershipRoles: ChapterLeaderCommandCenterLeadershipRole[],
  committees: ChapterLeaderCommandCenterCommitteeCard[],
  successionCandidates: ChapterLeaderCommandCenterSuccessionCandidate[],
): ChapterLeaderCommandCenterSuccessionOverview {
  if (sourceMode === "mock") {
    return {
      eboardRolesFilledLabel: "6 / 7",
      activeCommitteesLabel: "5 / 7",
      candidatesIdentifiedLabel: "4",
      transitionReadinessLabel: "62%",
      transitionReadinessNote: "needs improvement",
    };
  }

  const coveredRoles = leadershipRoles.filter((role) => role.status === "covered").length;
  const activeCommittees = committees.filter(
    (committee) => committee.operatingStatusLabel !== "Inactive",
  ).length;
  const readiness = Math.max(
    38,
    Math.min(92, coveredRoles * 12 + successionCandidates.length * 4 - committees.length),
  );

  return {
    eboardRolesFilledLabel: `${coveredRoles} / ${leadershipRoles.length}`,
    activeCommitteesLabel: `${activeCommittees} / ${committees.length}`,
    candidatesIdentifiedLabel: `${Math.min(4, successionCandidates.length)}`,
    transitionReadinessLabel: `${readiness}%`,
    transitionReadinessNote: readiness >= 72 ? "on track" : "needs improvement",
  };
}

function getSuccessionGaps(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  leadershipRoles: ChapterLeaderCommandCenterLeadershipRole[],
  committees: ChapterLeaderCommandCenterCommitteeCard[],
): ChapterLeaderCommandCenterSuccessionGap[] {
  if (sourceMode === "mock") {
    return [
      {
        severity: "high",
        title: "Member Engagement has no chair - inactive 3+ weeks",
        summary: "This lane needs visible ownership again before the next chapter push.",
        actionLabel: "Appoint chair immediately; assign re-engagement action",
      },
      {
        severity: "high",
        title: "No Fundraising chair backup identified",
        summary: "There is no clear second owner if the current fundraising lead rolls off.",
        actionLabel: "Identify a backup from current active Fundraising members",
      },
      {
        severity: "medium",
        title: "President Sofia Reyes graduating May 2026",
        summary: "The chapter needs a visible president candidate and transition plan now.",
        actionLabel: "Begin succession planning - identify president candidate now",
      },
      {
        severity: "medium",
        title: "No bridge videos submitted for leadership transitions",
        summary: "Knowledge transfer is still too dependent on live handoff instead of reusable proof.",
        actionLabel: "Assign bridge video to all chairs before end of semester",
      },
      {
        severity: "low",
        title: "SLT Promotion committee under capacity (only 6 members)",
        summary: "The pipeline exists, but it needs more student volume and clearer KPIs.",
        actionLabel: "Add 2 members and set SLT promotion KPIs",
      },
    ];
  }

  const gaps: ChapterLeaderCommandCenterSuccessionGap[] = [];
  const missingRole = leadershipRoles.find((role) => role.status === "missing");
  const inactiveCommittee = committees.find(
    (committee) => committee.operatingStatusLabel === "Inactive",
  );

  if (inactiveCommittee) {
    gaps.push({
      severity: "high",
      title: `${inactiveCommittee.name} has no visible owner`,
      summary: "This committee needs a chair and a clear re-activation plan.",
      actionLabel: "Name a committee owner and assign one recovery action",
    });
  }

  if (missingRole) {
    gaps.push({
      severity: "medium",
      title: `${missingRole.label} is still uncovered`,
      summary: "Succession readiness stays fragile while this leadership lane is open.",
      actionLabel: "Identify a candidate and start a transition checklist",
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      severity: "low",
      title: "Transition proof still needs to be made reusable",
      summary: "Even healthy coverage benefits from visible bridge videos and written handoffs.",
      actionLabel: "Collect one transition note and one bridge video from each chair",
    });
  }

  return gaps;
}

function getSuccessionTimeline(
  sourceMode: ReadOnlyAppData["source"]["mode"],
): ChapterLeaderCommandCenterSuccessionTimelineItem[] {
  if (sourceMode === "mock") {
    return [
      {
        dateLabel: "Jun 2025",
        title: "Appoint Member Engagement chair",
        summary: "Restore visible ownership to the inactive committee lane.",
      },
      {
        dateLabel: "Jul 2025",
        title: "Values interviews for all chair candidates",
        summary: "Move from popularity to character and consistency checks.",
      },
      {
        dateLabel: "Aug 2025",
        title: "Bridge videos due from all chairs",
        summary: "Capture what the next owner needs to understand quickly.",
      },
      {
        dateLabel: "Sep 2025",
        title: "E-Board nominations open for Fall",
        summary: "Make the leadership pipeline explicit before momentum drops.",
      },
      {
        dateLabel: "Nov 2025",
        title: "President succession announced",
        summary: "Give the chapter time to transition publicly and calmly.",
      },
      {
        dateLabel: "May 2026",
        title: "Full E-Board transition complete",
        summary: "End the cycle with documented handoff, not guesswork.",
      },
    ];
  }

  return [
    {
      dateLabel: "This month",
      title: "Name the next open leadership owner",
      summary: "Start with the thinnest lane and make the next step visible.",
    },
    {
      dateLabel: "Next month",
      title: "Run values interviews for candidate lanes",
      summary: "Check consistency, follow-through, and coachability before promotion.",
    },
    {
      dateLabel: "Before term end",
      title: "Collect transition notes and bridge videos",
      summary: "Make leadership knowledge reusable for the next cohort.",
    },
  ];
}

function getSuccessionCandidateScore(member: ChapterMemberRow) {
  let score = member.points + member.completedActions * 6 - member.openAssignments * 2;

  if (isEBoardRole(member)) {
    score += 8;
  }

  if (isActionCommitteeChair(member)) {
    score += 6;
  }

  return score;
}

function getSuccessionReadinessLabel(member: ChapterMemberRow) {
  const score = getSuccessionCandidateScore(member);

  if (score >= 44) {
    return "Ready for a larger lane";
  }

  if (score >= 30) {
    return "Good next-wave candidate";
  }

  return "Keep developing";
}

function getMemberRecognitionLabel(
  member: ChapterMemberRow,
  leaderboard: LeaderboardRow[],
) {
  const leaderboardMatch = leaderboard.find((row) => {
    return row.displayName.toLowerCase() === member.displayName.toLowerCase();
  });

  if (leaderboardMatch) {
    return leaderboardMatch.recognition;
  }

  if (isLeadershipOwner(member)) {
    return "Values Aligned";
  }

  if (member.points >= 30) {
    return "Values Aligned";
  }

  return "Needs interview";
}

function readableToken(value: string) {
  return value.replaceAll("_", " ");
}

function getMemberEventTouchCount(member: ChapterMemberRow) {
  if (isPresidentOrVp(member)) {
    return 3;
  }

  if (isActionCommitteeChair(member) || isEBoardRole(member)) {
    return 2;
  }

  if (member.committeeLane === "Recruitment" || member.committeeLane === "Social") {
    return 1;
  }

  return 0;
}

function getMemberAttendanceRate(member: ChapterMemberRow) {
  const baseRate = 58 + member.completedActions * 10 - member.openAssignments * 4;

  if (member.membershipStatus === "needs_follow_up") {
    return Math.max(42, Math.min(96, baseRate - 8));
  }

  return Math.max(48, Math.min(98, baseRate));
}

function getEvidenceLabel(member: ChapterMemberRow) {
  const override = mockPipelineRowOverrides[member.id];
  if (override) {
    return override.evidenceLabel;
  }

  const evidenceCount =
    member.completedActions +
    (member.proofStatus === "approved"
      ? 3
      : member.proofStatus === "pending"
        ? 2
        : member.proofStatus === "changes_requested"
          ? 1
          : 0);

  return `${evidenceCount}`;
}

function getBridgeLabel(member: ChapterMemberRow) {
  const override = mockPipelineRowOverrides[member.id];
  if (override) {
    return override.bridgeLabel;
  }

  if (member.proofStatus === "approved") {
    return "2";
  }

  if (member.proofStatus === "pending") {
    return "1";
  }

  return "0";
}

function getFundraisingLabel(member: ChapterMemberRow) {
  const override = mockPipelineRowOverrides[member.id];
  if (override) {
    return override.fundraisingLabel;
  }

  const multiplier = isPresidentOrVp(member) ? 24 : isLeadershipOwner(member) ? 16 : 8;
  return `$${member.points * multiplier}`;
}

function toShortSentence(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 72) {
    return trimmed;
  }

  return `${trimmed.slice(0, 69).trimEnd()}...`;
}

function isPresidentOrVp(member: Pick<ChapterMemberRow, "roleKey">) {
  return member.roleKey === "president_vp";
}

function isEBoardRole(member: Pick<ChapterMemberRow, "roleKey">) {
  return member.roleKey === "e_board_member";
}

function isActionCommitteeChair(member: Pick<ChapterMemberRow, "roleKey">) {
  return member.roleKey === "action_committee_chair";
}

function isLeadershipOwner(member: Pick<ChapterMemberRow, "roleKey">) {
  return (
    isPresidentOrVp(member) ||
    isEBoardRole(member) ||
    isActionCommitteeChair(member)
  );
}

function getCommandCenterMembers(
  sourceMode: ReadOnlyAppData["source"]["mode"],
  members: ChapterMemberRow[],
) {
  if (sourceMode !== "mock") {
    return members;
  }

  return [...mockCommandCenterPipelineMembers, ...members];
}

function getMockPipelineRowOverride(memberId: string) {
  return mockPipelineRowOverrides[memberId] ?? null;
}

function getPipelineStageLabel(member: ChapterMemberRow) {
  const override = getMockPipelineRowOverride(member.id);
  if (override) {
    return override.pipelineLabel;
  }

  const readiness = getSuccessionCandidateScore(member);

  if (member.membershipStatus === "needs_follow_up") {
    return "Follow-up now";
  }

  if (isLeadershipOwner(member)) {
    if (isPresidentOrVp(member) || isEBoardRole(member)) {
      return "E-Board";
    }

    return "Chair";
  }

  if (readiness >= 44) {
    return "Chair candidate";
  }

  if (readiness >= 30) {
    return "Active contributor";
  }

  return "General member";
}
