import {
  getActionCommittees,
  getCommitteeOperatingSummary,
  getEventPlansForCampaign,
  getEventPlansForCommittee,
  getProofLibraryItems,
} from "@/services/campaign-ops-service";
import { getChapterMemberRoleFocus } from "@/services/chapter-member-role-focus";
import {
  getChapterMembershipWorkspace,
  type ChapterJoinRequest,
  type ChapterMemberRow,
} from "@/services/chapter-membership-workspace";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { ProofLibraryItem } from "@/shared/types/campaigns";
import type { LeaderboardRow } from "@/shared/types/rush-month-dashboard";

export type ChapterLeaderCommandCenterView =
  | "overview"
  | "members"
  | "committees"
  | "impact"
  | "succession"
  | "feed";

export type ChapterLeaderCommandCenterTone = "green" | "yellow" | "red";

export type ChapterLeaderCommandCenterMetric = {
  label: string;
  value: string;
  note: string;
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

export type ChapterLeaderCommandCenterMemberProfile = {
  id: string;
  displayName: string;
  roleLabel: string;
  committeeLane: string;
  points: number;
  completedActions: number;
  openAssignments: number;
  proofStatus: string;
  nextStep: string;
  recognition: string;
  readinessLabel: string;
  profileHref: string;
};

export type ChapterLeaderCommandCenterCommitteeCard = {
  id: string;
  name: string;
  lane: string;
  ownerLabel: string;
  nextEventTitle: string;
  nextEventTiming: string;
  lumaStatusLabel: string;
  summary: string;
  href: string;
};

export type ChapterLeaderCommandCenterEventCard = {
  id: string;
  title: string;
  lane: string;
  ownerLabel: string;
  timing: string;
  lumaStatusLabel: string;
  expectedStudentAction: string;
  proofPrompt: string;
  href: string;
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

export type ChapterLeaderCommandCenterFeedInsight = {
  label: string;
  value: string;
  note: string;
};

export type ChapterLeaderCommandCenterSuccessionCandidate = {
  id: string;
  displayName: string;
  currentRole: string;
  readinessLabel: string;
  reason: string;
  href: string;
};

export type ChapterLeaderCommandCenter = {
  canReadCommandCenter: boolean;
  chapterName: string;
  campusLabel: string;
  regionLabel: string;
  coachLabel: string;
  summary: string;
  sampleLabel: string | null;
  selectedView: ChapterLeaderCommandCenterView;
  selectedMemberId: string | null;
  viewOptions: ChapterLeaderCommandCenterViewOption[];
  healthScore: number;
  healthTone: ChapterLeaderCommandCenterTone;
  healthNote: string;
  metrics: ChapterLeaderCommandCenterMetric[];
  quickActions: ChapterLeaderCommandCenterQuickAction[];
  weeklyPriority: ChapterLeaderCommandCenterWeeklyPriority | null;
  leadershipRoles: ChapterLeaderCommandCenterLeadershipRole[];
  riskAlerts: ChapterLeaderCommandCenterRiskAlert[];
  pipelineItems: ChapterLeaderCommandCenterPipelineItem[];
  selectedMember: ChapterLeaderCommandCenterMemberProfile | null;
  committees: ChapterLeaderCommandCenterCommitteeCard[];
  events: ChapterLeaderCommandCenterEventCard[];
  impactCards: ChapterLeaderCommandCenterMetric[];
  bridgeStories: ChapterLeaderCommandCenterBridgeStory[];
  feedInsights: ChapterLeaderCommandCenterFeedInsight[];
  successionCandidates: ChapterLeaderCommandCenterSuccessionCandidate[];
  leaderboard: LeaderboardRow[];
  safetyNote: string;
};

export type ChapterLeaderCommandCenterOptions = {
  view?: string;
  memberId?: string;
};

const commandCenterViewLabels: Record<ChapterLeaderCommandCenterView, string> = {
  overview: "Overview",
  members: "Members",
  committees: "Committees",
  impact: "Impact",
  succession: "Succession",
  feed: "Feed",
};

const mockChapterLeaderSample = {
  chapterName: "Boston College MEDLIFE",
  campusLabel: "Boston College",
  regionLabel: "Northeast",
  coachLabel: "Cam Coach",
  sampleLabel: "Boston College sample surface",
};

export function getChapterLeaderCommandCenter(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  options: ChapterLeaderCommandCenterOptions = {},
): ChapterLeaderCommandCenter {
  if (actor.audience !== "chapter_leader") {
    return emptyCommandCenter();
  }

  const workspace = getChapterMembershipWorkspace(actor, data);
  if (!workspace.canReadWorkspace) {
    return emptyCommandCenter();
  }

  const selectedView = parseChapterLeaderCommandCenterView(options.view);
  const memberRoleFocus = getChapterMemberRoleFocus(actor, workspace);
  const weeklyPriority = getWeeklyPriority(actor, workspace);
  const recognition = getMemberRecognitionSummary(actor, data);
  const leadershipRoles = getLeadershipRoles(workspace.members);
  const selectedMemberId = getSelectedMemberId(workspace.members, options.memberId);
  const selectedMember = getSelectedMemberProfile(
    workspace.members,
    recognition.leaderboard,
    selectedMemberId,
  );
  const successionCandidates = getSuccessionCandidates(
    workspace.members,
    recognition.leaderboard,
  );
  const quickActions = getQuickActions(selectedMember?.id ?? successionCandidates[0]?.id ?? null);
  const committees = getCommitteeCards(workspace.members, workspace.counts.proofFollowUps);
  const eventCards = getEventCards(workspace.members);
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
          sampleLabel: null,
        };

  return {
    canReadCommandCenter: true,
    chapterName: chapterDisplay.chapterName,
    campusLabel: chapterDisplay.campusLabel,
    regionLabel: chapterDisplay.regionLabel,
    coachLabel: chapterDisplay.coachLabel,
    summary:
      data.source.mode === "mock"
        ? "This desktop leadership view uses the Boston College sample framing on top of the current Rush Month mock-safe chapter data, so leaders can inspect people, committees, proof, events, and succession without turning on any writes."
        : "This leadership view keeps chapter health, owners, events, proof, recognition, and succession visible without turning on writes.",
    sampleLabel: chapterDisplay.sampleLabel,
    selectedView,
    selectedMemberId: selectedMember?.id ?? null,
    viewOptions: getViewOptions(selectedMember?.id ?? null),
    healthScore,
    healthTone: scoreToTone(healthScore),
    healthNote: getHealthNote({
      workspace,
      leadershipRoles,
    }),
    metrics: getMetrics({
      committees,
      eventCards,
      leadershipRoles,
      recognition,
      workspace,
    }),
    quickActions,
    weeklyPriority: {
      ...weeklyPriority,
      summary: `${weeklyPriority.summary} ${memberRoleFocus.summary}`,
    },
    leadershipRoles,
    riskAlerts,
    pipelineItems: getPipelineItems(workspace.joinRequests, workspace.members),
    selectedMember,
    committees,
    events: eventCards,
    impactCards: getImpactCards(recognition, bridgeStories.length),
    bridgeStories,
    feedInsights,
    successionCandidates,
    leaderboard: recognition.leaderboard,
    safetyNote: [getLeaderSafetyNote(actor), memberRoleFocus.safetyNote]
      .filter(Boolean)
      .join(" "),
  };
}

export function buildChapterLeaderCommandCenterHref(
  view: ChapterLeaderCommandCenterView,
  memberId?: string | null,
) {
  const searchParams = new URLSearchParams();

  if (view !== "overview") {
    searchParams.set("view", view);
  }

  if (memberId) {
    searchParams.set("member", memberId);
  }

  const query = searchParams.toString();
  return query.length > 0 ? `/chapter?${query}` : "/chapter";
}

export function parseChapterLeaderCommandCenterView(
  value?: string,
): ChapterLeaderCommandCenterView {
  switch (value) {
    case "members":
    case "committees":
    case "impact":
    case "succession":
    case "feed":
      return value;
    case "overview":
    default:
      return "overview";
  }
}

function emptyCommandCenter(): ChapterLeaderCommandCenter {
  return {
    canReadCommandCenter: false,
    chapterName: "",
    campusLabel: "",
    regionLabel: "",
    coachLabel: "",
    summary: "",
    sampleLabel: null,
    selectedView: "overview",
    selectedMemberId: null,
    viewOptions: getViewOptions(null),
    healthScore: 0,
    healthTone: "red",
    healthNote: "",
    metrics: [],
    quickActions: [],
    weeklyPriority: null,
    leadershipRoles: [],
    riskAlerts: [],
    pipelineItems: [],
    selectedMember: null,
    committees: [],
    events: [],
    impactCards: [],
    bridgeStories: [],
    feedInsights: [],
    successionCandidates: [],
    leaderboard: [],
    safetyNote: "",
  };
}

function getViewOptions(memberId: string | null): ChapterLeaderCommandCenterViewOption[] {
  return (
    Object.entries(commandCenterViewLabels) as Array<
      [ChapterLeaderCommandCenterView, string]
    >
  ).map(([key, label]) => ({
    key,
    label,
    href: buildChapterLeaderCommandCenterHref(key, memberId),
  }));
}

function getWeeklyPriority(actor: LocalActorContext, workspace: ReturnType<typeof getChapterMembershipWorkspace>) {
  if (actor.chapterRoles.includes("President / VP")) {
    return {
      title: "Close proof and role gaps before the next campus push.",
      summary: `The chapter has ${workspace.counts.proofFollowUps} proof follow-up item${workspace.counts.proofFollowUps === 1 ? "" : "s"} and ${workspace.counts.pendingRequests} join request${workspace.counts.pendingRequests === 1 ? "" : "s"} visible right now, so the President / VP view should clear role and review ambiguity before more work is added.`,
      primaryHref: "/rush-month/review",
      primaryLabel: "Review proof decisions",
      secondaryHref: "/chapter/members",
      secondaryLabel: "Check role coverage",
    };
  }

  if (actor.chapterRoles.includes("E-Board Member")) {
    return {
      title: "Move owners and event prep before students feel the stall.",
      summary: `This week has ${workspace.counts.openAssignments} open assignment${workspace.counts.openAssignments === 1 ? "" : "s"} and ${workspace.counts.proofFollowUps} proof follow-up item${workspace.counts.proofFollowUps === 1 ? "" : "s"} visible, so E-Board should move owners and event handoffs before momentum softens.`,
      primaryHref: "/rush-month/actions",
      primaryLabel: "Open owner follow-up",
      secondaryHref: "/rush-month/events",
      secondaryLabel: "Check events",
    };
  }

  return {
    title: "Keep every owner, lane, and proof follow-up legible this week.",
    summary: `Visible leaders are balancing ${workspace.counts.openAssignments} open assignment${workspace.counts.openAssignments === 1 ? "" : "s"}, ${workspace.counts.pendingRequests} join request${workspace.counts.pendingRequests === 1 ? "" : "s"}, and the next event/proof loop.`,
    primaryHref: "/rush-month/review",
    primaryLabel: "Open follow-up",
    secondaryHref: "/chapter/members",
    secondaryLabel: "Review roster",
  };
}

function getLeaderSafetyNote(actor: LocalActorContext) {
  if (actor.chapterRoles.includes("President / VP")) {
    return "President / VP review remains read-only. Membership approvals, proof decisions, assignment saves, reminders, and role changes remain disabled.";
  }

  if (actor.chapterRoles.includes("E-Board Member")) {
    return "E-Board execution remains read-only. Assignment saves, reminders, Luma writes, proof uploads, and external automation remain disabled.";
  }

  return "Leader routing is still mock-safe. Membership writes, event writes, proof uploads, reminders, and external automation remain disabled.";
}

function getMetrics(input: {
  committees: ChapterLeaderCommandCenterCommitteeCard[];
  eventCards: ChapterLeaderCommandCenterEventCard[];
  leadershipRoles: ChapterLeaderCommandCenterLeadershipRole[];
  recognition: ReturnType<typeof getMemberRecognitionSummary>;
  workspace: ReturnType<typeof getChapterMembershipWorkspace>;
}): ChapterLeaderCommandCenterMetric[] {
  const coveredRoles = input.leadershipRoles.filter((role) => role.status === "covered");

  return [
    {
      label: "E-board roles covered",
      value: `${coveredRoles.length}/${input.leadershipRoles.length}`,
      note: "Owner clarity across president and core committee leadership lanes.",
    },
    {
      label: "Committees active",
      value: `${input.committees.length}`,
      note: "Visible lanes with owners, events, or proof follow-up in the chapter loop.",
    },
    {
      label: "Open actions",
      value: `${input.workspace.counts.openAssignments}`,
      note: "Student and leader work that still needs owner follow-up.",
    },
    {
      label: "Events this push",
      value: `${input.eventCards.length}`,
      note: `${input.recognition.leaderboard.length} students are visible on the friendly leaderboard.`,
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
): ChapterLeaderCommandCenterQuickAction[] {
  return [
    {
      label: "Create Event",
      href: "/rush-month/events",
      helper: "Mock-linked Luma planning",
      tone: "primary",
    },
    {
      label: "Assign Action",
      href: "/rush-month/actions",
      helper: "Owner and proof handoff",
      tone: "primary",
    },
    {
      label: "Review Members",
      href: "/chapter/members",
      helper: "Roster and join requests",
      tone: "secondary",
    },
    {
      label: "Promote Emerging Leader",
      href: buildChapterLeaderCommandCenterHref("succession", selectedMemberId),
      helper: "Succession preview only",
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
      owner: members.find((member) => member.roleLabel === "President / VP"),
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

  const hasLeadRole =
    owner.roleLabel === "President / VP" ||
    owner.roleLabel === "Action Committee Chair" ||
    owner.roleLabel === "E-Board Member";

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
      title: "Leadership coverage is thin in core lanes.",
      summary: `${thinOrMissingRoles.length} lane${thinOrMissingRoles.length === 1 ? "" : "s"} still need a stronger owner before the chapter scales the next push.`,
      href: buildChapterLeaderCommandCenterHref("succession"),
      hrefLabel: "Open succession",
    });
  }

  if (input.workspace.counts.pendingRequests > 0) {
    alerts.push({
      severity: "medium",
      title: "New students are waiting on visible follow-up.",
      summary: `${input.workspace.counts.pendingRequests} join request${input.workspace.counts.pendingRequests === 1 ? "" : "s"} need a leader-owned next step, even while approvals stay disabled.`,
      href: "/chapter/members",
      hrefLabel: "Open members",
    });
  }

  if (input.workspace.counts.proofFollowUps > 0) {
    alerts.push({
      severity: "medium",
      title: "Proof needs cleaner context before HQ can reuse it.",
      summary: `${input.workspace.counts.proofFollowUps} visible member${input.workspace.counts.proofFollowUps === 1 ? "" : "s"} need proof follow-up or clearer story framing.`,
      href: "/rush-month/review",
      hrefLabel: "Open proof follow-up",
    });
  }

  if (input.eventCount > 0) {
    alerts.push({
      severity: "low",
      title: "Event readiness should stay tied to owner follow-through.",
      summary: `${input.eventCount} event${input.eventCount === 1 ? "" : "s"} are visible in the chapter loop. Keep the owner, RSVP plan, and proof prompt paired together.`,
      href: "/rush-month/events",
      hrefLabel: "Open events",
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
    href: "/chapter/members",
  }));

  const memberItems = members
    .filter((member) => {
      return (
        member.membershipStatus === "needs_follow_up" ||
        member.openAssignments > 1 ||
        member.roleLabel === "E-Board Member"
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
      href: buildChapterLeaderCommandCenterHref("members", member.id),
    }));

  return [...joinRequestItems, ...memberItems].slice(0, 6);
}

function getPipelineStatus(member: ChapterMemberRow) {
  if (member.roleLabel === "E-Board Member") {
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
  if (requestedMemberId && members.some((member) => member.id === requestedMemberId)) {
    return requestedMemberId;
  }

  const defaultMember =
    members.find((member) => member.roleLabel === "E-Board Member") ??
    members.find((member) => member.roleLabel === "Action Committee Chair") ??
    members.find((member) => member.membershipStatus !== "inactive") ??
    members[0];

  return defaultMember?.id;
}

function getSelectedMemberProfile(
  members: ChapterMemberRow[],
  leaderboard: LeaderboardRow[],
  selectedMemberId: string | undefined,
): ChapterLeaderCommandCenterMemberProfile | null {
  const member = members.find((item) => item.id === selectedMemberId);
  if (!member) {
    return null;
  }

  return {
    id: member.id,
    displayName: member.displayName,
    roleLabel: member.roleLabel,
    committeeLane: member.committeeLane,
    points: member.points,
    completedActions: member.completedActions,
    openAssignments: member.openAssignments,
    proofStatus: readableToken(member.proofStatus),
    nextStep: member.nextStep,
    recognition: getMemberRecognitionLabel(member, leaderboard),
    readinessLabel: getSuccessionReadinessLabel(member),
    profileHref: buildChapterLeaderCommandCenterHref("members", member.id),
  };
}

function getCommitteeCards(
  members: ChapterMemberRow[],
  proofFollowUps: number,
): ChapterLeaderCommandCenterCommitteeCard[] {
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
        nextEventTitle: nextEvent?.title ?? "No mock-linked event yet",
        nextEventTiming: nextEvent?.timing ?? "Needs planning",
        lumaStatusLabel: nextEvent ? readableToken(nextEvent.lumaStatus) : "not linked",
        summary: getCommitteeOperatingSummary(committee),
        href: "/action-committees",
      };
    });
}

function getEventCards(
  members: ChapterMemberRow[],
): ChapterLeaderCommandCenterEventCard[] {
  return getEventPlansForCampaign("rush-month").map((eventPlan) => {
    const owner = members.find((member) => member.roleLabel === eventPlan.ownerRole);
    const committeeLane = getActionCommittees().find(
      (committee) => committee.id === eventPlan.committeeId,
    )?.lane;

    return {
      id: eventPlan.id,
      title: eventPlan.title,
      lane: committeeLane ?? "Campaign",
      ownerLabel: owner?.displayName ?? eventPlan.ownerRole,
      timing: eventPlan.timing,
      lumaStatusLabel: readableToken(eventPlan.lumaStatus),
      expectedStudentAction: eventPlan.expectedStudentAction,
      proofPrompt: eventPlan.proofPrompt,
      href: "/rush-month/events",
    };
  });
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

function getSuccessionCandidates(
  members: ChapterMemberRow[],
  leaderboard: LeaderboardRow[],
): ChapterLeaderCommandCenterSuccessionCandidate[] {
  return [...members]
    .filter((member) => member.roleLabel !== "President / VP")
    .sort((left, right) => getSuccessionCandidateScore(right) - getSuccessionCandidateScore(left))
    .slice(0, 4)
    .map((member) => ({
      id: member.id,
      displayName: member.displayName,
      currentRole: member.roleLabel,
      readinessLabel: getSuccessionReadinessLabel(member),
      reason: `${getMemberRecognitionLabel(member, leaderboard)} ${member.nextStep}`,
      href: buildChapterLeaderCommandCenterHref("succession", member.id),
    }));
}

function getSuccessionCandidateScore(member: ChapterMemberRow) {
  let score = member.points + member.completedActions * 6 - member.openAssignments * 2;

  if (member.roleLabel === "E-Board Member") {
    score += 8;
  }

  if (member.roleLabel === "Action Committee Chair") {
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

  if (member.roleLabel === "E-Board Member") {
    return "Emerging organizer.";
  }

  if (member.roleLabel === "Action Committee Chair") {
    return "Reliable lane owner.";
  }

  if (member.points >= 30) {
    return "Steady builder.";
  }

  return "Visible contributor.";
}

function readableToken(value: string) {
  return value.replaceAll("_", " ");
}
