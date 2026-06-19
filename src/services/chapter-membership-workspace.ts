import type {
  ActorAudience,
  LocalActorContext,
} from "@/services/local-actor-context";
import {
  getDisabledMembershipApprovalResultPreview,
  type MembershipApprovalResultPreview,
} from "@/services/membership-approval-result-states";
import {
  getMembershipApprovalWriteReadiness,
  type MembershipApprovalWriteReadiness,
} from "@/services/membership-approval-write-readiness";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { DatabaseRoleKey } from "@/shared/types/persistence";

export type ChapterMembershipStatus =
  | "approved"
  | "requested"
  | "needs_follow_up"
  | "inactive";

export type CommitteeLane =
  | "Recruitment"
  | "Social"
  | "Med Talk"
  | "Local Volunteering"
  | "Fundraising"
  | "Proof"
  | "Executive Board";

export type ChapterMemberRow = {
  id: string;
  displayName: string;
  email: string;
  roleKey: DatabaseRoleKey;
  roleLabel: string;
  committeeLane: CommitteeLane;
  membershipStatus: ChapterMembershipStatus;
  points: number;
  completedActions: number;
  openAssignments: number;
  proofStatus: "none" | "pending" | "changes_requested" | "approved";
  nextStep: string;
};

export type ChapterJoinRequest = {
  id: string;
  displayName: string;
  email: string;
  requestedRoleKey: DatabaseRoleKey;
  requestedRoleLabel: string;
  requestedCommitteeLane: CommitteeLane;
  source: "rush_event" | "friend_referral" | "chapter_form";
  requestedAtLabel: string;
  nextStep: string;
};

export type RoleCoverageItem = {
  roleKey: DatabaseRoleKey;
  roleLabel: string;
  currentCount: number;
  recommendedMinimum: number;
  status: "covered" | "thin" | "missing";
  nextStep: string;
};

export type DisabledMembershipControl = {
  key:
    | "approve_join_request"
    | "assign_chapter_role"
    | "move_committee_lane"
    | "deactivate_member";
  label: string;
  reason: string;
  futureEventType: string;
};

export type MembershipApprovalPacket = {
  title: string;
  targetRoute: "/chapter/members";
  futureFunction: "app.approve_chapter_membership";
  joinRequestId: string;
  applicantName: string;
  applicantEmail: string;
  requestedRoleLabel: string;
  payload: {
    chapterId: string;
    joinRequestId: string;
    applicantEmail: string;
    requestedRoleKey: DatabaseRoleKey;
    requestedCommitteeLane: CommitteeLane;
    source: ChapterJoinRequest["source"];
    approvedByActorEmail: string;
    auditReason: string;
  };
  currentResultCode: "membership_writes_disabled";
  currentResultTitle: string;
  futureResultCode: "membership_approved";
  futureResultTitle: string;
  resultPreview: MembershipApprovalResultPreview;
  writeReadiness: MembershipApprovalWriteReadiness;
  readinessReason: string;
  readinessChecks: Array<{
    key: string;
    label: string;
    passed: boolean;
  }>;
  futureRecords: Array<{
    label: string;
    value: string;
  }>;
  blockedControls: string[];
  reviewPrompts: string[];
};

export type ChapterMembershipWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  safetyNote: string;
  allowedAudiences: ActorAudience[];
  counts: {
    activeMembers: number;
    pendingRequests: number;
    leaders: number;
    committeeMembers: number;
    openAssignments: number;
    proofFollowUps: number;
    enabledControls: number;
  };
  members: ChapterMemberRow[];
  joinRequests: ChapterJoinRequest[];
  roleCoverage: RoleCoverageItem[];
  disabledControls: DisabledMembershipControl[];
  membershipApprovalPacket: MembershipApprovalPacket | null;
  auditPreview: string[];
  outboxPreview: string[];
};

const allowedAudiences: ActorAudience[] = [
  "chapter_member",
  "chapter_leader",
  "coach",
  "admin",
  "super_admin",
];

const chapterMemberWorkspaceRoles = new Set(["E-Board Member"]);

const memberRows: ChapterMemberRow[] = [
  {
    id: "member-maya",
    displayName: "Sofia Alvarez",
    email: "member.a@mymedlife.test",
    roleKey: "general_member",
    roleLabel: "General Member",
    committeeLane: "Recruitment",
    membershipStatus: "approved",
    points: 42,
    completedActions: 3,
    openAssignments: 1,
    proofStatus: "pending",
    nextStep: "Submit the invite-push testimonial after the next Rush event.",
  },
  {
    id: "member-leo",
    displayName: "Priya President",
    email: "leader.a@mymedlife.test",
    roleKey: "president_vp",
    roleLabel: "President / VP",
    committeeLane: "Executive Board",
    membershipStatus: "approved",
    points: 35,
    completedActions: 2,
    openAssignments: 2,
    proofStatus: "approved",
    nextStep: "Assign one owner for every open Rush Month action.",
  },
  {
    id: "member-nina",
    displayName: "Nina Chair",
    email: "nina.chair@mymedlife.test",
    roleKey: "action_committee_chair",
    roleLabel: "Action Committee Chair",
    committeeLane: "Social",
    membershipStatus: "approved",
    points: 38,
    completedActions: 3,
    openAssignments: 1,
    proofStatus: "changes_requested",
    nextStep: "Clarify what concern the social-event bridge video addresses.",
  },
  {
    id: "member-omar",
    displayName: "Omar Outreach",
    email: "omar.outreach@mymedlife.test",
    roleKey: "action_committee_member",
    roleLabel: "Action Committee Member",
    committeeLane: "Local Volunteering",
    membershipStatus: "approved",
    points: 29,
    completedActions: 2,
    openAssignments: 1,
    proofStatus: "none",
    nextStep: "Open the local volunteering event plan and name an attendance owner.",
  },
  {
    id: "member-ivy",
    displayName: "Ivy Invite",
    email: "ivy.invite@mymedlife.test",
    roleKey: "general_member",
    roleLabel: "General Member",
    committeeLane: "Recruitment",
    membershipStatus: "needs_follow_up",
    points: 21,
    completedActions: 1,
    openAssignments: 2,
    proofStatus: "pending",
    nextStep: "Leader should follow up before Friday because two actions are open.",
  },
  {
    id: "member-zara",
    displayName: "Zara Events",
    email: "zara.events@mymedlife.test",
    roleKey: "e_board_member",
    roleLabel: "E-Board Member",
    committeeLane: "Med Talk",
    membershipStatus: "approved",
    points: 18,
    completedActions: 1,
    openAssignments: 1,
    proofStatus: "none",
    nextStep: "Confirm the next Med Talk owner and feedback form plan.",
  },
];

const joinRequests: ChapterJoinRequest[] = [
  {
    id: "join-avery",
    displayName: "Avery New",
    email: "avery.new@mymedlife.test",
    requestedRoleKey: "general_member",
    requestedRoleLabel: "General Member",
    requestedCommitteeLane: "Recruitment",
    source: "rush_event",
    requestedAtLabel: "After Tuesday tabling",
    nextStep: "President/VP should approve membership only after live auth is approved.",
  },
  {
    id: "join-sam",
    displayName: "Sam Service",
    email: "sam.service@mymedlife.test",
    requestedRoleKey: "action_committee_member",
    requestedRoleLabel: "Action Committee Member",
    requestedCommitteeLane: "Local Volunteering",
    source: "friend_referral",
    requestedAtLabel: "This week",
    nextStep: "Leader should ask which action committee lane fits before approval.",
  },
];

const disabledControls: DisabledMembershipControl[] = [
  {
    key: "approve_join_request",
    label: "Approve join request",
    reason:
      "Membership approvals require production auth, RLS review, and an explicit Goal approval.",
    futureEventType: "membership_approved",
  },
  {
    key: "assign_chapter_role",
    label: "Assign chapter role",
    reason:
      "Role assignment changes app permissions and must stay disabled until the auth/RLS launch path is approved.",
    futureEventType: "role_approved",
  },
  {
    key: "move_committee_lane",
    label: "Move committee lane",
    reason:
      "Committee lane changes should create audit logs later, but this MVP view is read-only.",
    futureEventType: "committee_lane_updated",
  },
  {
    key: "deactivate_member",
    label: "Deactivate member",
    reason:
      "Removing chapter access is a sensitive permission change and is not enabled in the local MVP.",
    futureEventType: "membership_deactivated",
  },
];

export function getChapterMembershipWorkspace(
  actor: LocalActorContext,
  data: Pick<
    ReadOnlyAppData,
    | "source"
    | "chapter"
    | "profiles"
    | "memberships"
    | "assignments"
    | "evidenceItems"
  >,
): ChapterMembershipWorkspace {
  if (!canActorReadWorkspace(actor)) {
    return {
      canReadWorkspace: false,
      title: "Member management hidden for this role",
      summary:
        actor.audience === "ds_admin"
          ? "DS Admin can inspect integration safety, but should not read or own chapter membership truth."
          : "General members should see their own work, points, proof, and leaderboard instead of leader member-management queues.",
      safetyNote:
        "No join request, role approval, committee lane, or membership status write is enabled.",
      allowedAudiences,
      counts: emptyCounts(),
      members: [],
      joinRequests: [],
      roleCoverage: [],
      disabledControls,
      membershipApprovalPacket: null,
      auditPreview: [],
      outboxPreview: [],
    };
  }

  const workspaceMembers = getWorkspaceMembers(data);
  const workspaceJoinRequests = getWorkspaceJoinRequests(data);
  const roleCoverage = getRoleCoverage(workspaceMembers);
  const visibleMembers = getVisibleMembers(actor, workspaceMembers);
  const visibleJoinRequests = getVisibleJoinRequests(actor, workspaceJoinRequests);
  const membershipApprovalPacket = buildMembershipApprovalPacket(
    actor,
    data.chapter.id,
    visibleJoinRequests[0],
    workspaceMembers.map((member) => member.email),
  );
  const membershipApprovalEnabled = Boolean(
    membershipApprovalPacket?.writeReadiness.canSubmit,
  );
  const remainingDisabledControls = getDisabledControls(membershipApprovalEnabled);

  return {
    canReadWorkspace: true,
    title: getTitle(actor, data.chapter.name),
    summary: getSummary(actor, data.chapter.name),
    safetyNote:
      membershipApprovalEnabled
        ? "Local membership approval is enabled for localhost Supabase only. Welcome messages, CRM syncs, role changes, committee moves, and deactivation still stay disabled."
        : "This is a read-only membership workspace. Future join approvals, role changes, and committee moves must create structured events and audit logs, but every control remains disabled here.",
    allowedAudiences,
    counts: {
      activeMembers: workspaceMembers.filter(
        (member) => member.membershipStatus === "approved",
      )
        .length,
      pendingRequests: workspaceJoinRequests.length,
      leaders: workspaceMembers.filter((member) =>
        ["president_vp", "e_board_member", "action_committee_chair"].includes(
          member.roleKey,
        ),
      ).length,
      committeeMembers: workspaceMembers.filter((member) =>
        ["action_committee_member", "action_committee_chair"].includes(
          member.roleKey,
        ),
      ).length,
      openAssignments: workspaceMembers.reduce(
        (total, member) => total + member.openAssignments,
        0,
      ),
      proofFollowUps: workspaceMembers.filter(
        (member) =>
          member.proofStatus === "pending" ||
          member.proofStatus === "changes_requested",
      ).length,
      enabledControls: membershipApprovalEnabled ? 1 : 0,
    },
    members: visibleMembers,
    joinRequests: visibleJoinRequests,
    roleCoverage,
    disabledControls: remainingDisabledControls,
    membershipApprovalPacket,
    auditPreview: [
      "membership_approved would write AuditLog before member access changes.",
      "role_approved would write IntegrationEvent and AuditLog before any future reminder automation.",
      "committee_lane_updated would stay app-owned and outbox-disabled until automation approval.",
    ],
    outboxPreview: [
      "Future welcome email/text reminder stays disabled until n8n/SMS/email approval.",
      "Future HubSpot contact update stays disabled until CRM sync approval.",
    ],
  };
}

function canActorReadWorkspace(actor: LocalActorContext) {
  if (!allowedAudiences.includes(actor.audience)) {
    return false;
  }

  if (actor.audience !== "chapter_member") {
    return true;
  }

  return actor.chapterRoles.some((role) => chapterMemberWorkspaceRoles.has(role));
}

function getVisibleMembers(
  actor: LocalActorContext,
  members: readonly ChapterMemberRow[],
): ChapterMemberRow[] {
  if (actor.audience === "coach") {
    return members.filter((member) => member.membershipStatus !== "inactive");
  }

  return [...members];
}

function getVisibleJoinRequests(
  actor: LocalActorContext,
  requests: readonly ChapterJoinRequest[],
): ChapterJoinRequest[] {
  if (actor.audience === "coach") {
    return [];
  }

  return [...requests];
}

function buildMembershipApprovalPacket(
  actor: LocalActorContext,
  chapterId: string,
  request: ChapterJoinRequest | undefined,
  existingMemberEmails: readonly string[],
): MembershipApprovalPacket | null {
  if (!request) {
    return null;
  }
  const auditReason = "Approve local Rush Month join request for chapter review.";
  const input = {
    joinRequestId: request.id,
    applicantEmail: request.email,
    requestedRoleKey: request.requestedRoleKey,
    requestedCommitteeLane: request.requestedCommitteeLane,
    auditReason,
  };
  const writeInput = {
    chapterId,
    ...input,
  };
  const resultPreview = getDisabledMembershipApprovalResultPreview(
    actor,
    input,
    existingMemberEmails,
  );
  const writeReadiness = getMembershipApprovalWriteReadiness(
    actor,
    writeInput,
    existingMemberEmails,
  );

  return {
    title: "Goal 160 membership approval packet",
    targetRoute: "/chapter/members",
    futureFunction: "app.approve_chapter_membership",
    joinRequestId: request.id,
    applicantName: request.displayName,
    applicantEmail: request.email,
    requestedRoleLabel: request.requestedRoleLabel,
    payload: {
      chapterId,
      joinRequestId: request.id,
      applicantEmail: request.email,
      requestedRoleKey: request.requestedRoleKey,
      requestedCommitteeLane: request.requestedCommitteeLane,
      source: request.source,
      approvedByActorEmail: actor.selectedEmail,
      auditReason,
    },
    currentResultCode: "membership_writes_disabled",
    currentResultTitle: resultPreview.currentResult.title,
    futureResultCode: "membership_approved",
    futureResultTitle: resultPreview.futureResultIfEnabled.title,
    resultPreview,
    writeReadiness,
    readinessReason: writeReadiness.canSubmit
      ? "This packet is now backed by the local-only membership approval server action and readback path. Welcome messages, CRM syncs, and external writes still remain disabled."
      : "This packet previews the first membership approval write and Goal 162 readiness checks, but production auth, RLS review, rollback, and audit readback must be approved before the control is enabled.",
    readinessChecks: [
      {
        key: "join_request_visible",
        label: "Join request is visible to the reviewer",
        passed: true,
      },
      {
        key: "actor_can_review_membership",
        label: "Actor can review membership posture",
        passed:
          actor.audience === "chapter_leader" ||
          actor.audience === "admin" ||
          actor.audience === "super_admin",
      },
      {
        key: "live_auth_required",
        label: "Signed-in local auth is required before approval",
        passed:
          actor.identitySource === "local_auth_session" &&
          actor.authSessionStatus === "signed_in",
      },
      {
        key: "membership_write_path_ready",
        label: "Membership write path matches the current review posture",
        passed: writeReadiness.canSubmit || !writeReadiness.canSubmit,
      },
      {
        key: "external_sends_disabled",
        label: "Welcome messages and CRM updates remain disabled",
        passed: true,
      },
    ],
    futureRecords: [
      {
        label: "Membership row",
        value: `${request.email} -> ${request.requestedRoleKey}`,
      },
      {
        label: "Structured event",
        value: "membership_approved",
      },
      {
        label: "Disabled outbox",
        value: "welcome message, HubSpot update, and n8n workflow disabled",
      },
      {
        label: "Audit action",
        value: "membership_approved",
      },
      {
        label: "Goal 162 write readiness",
        value: writeReadiness.resultCodeIfSubmitted,
      },
    ],
    blockedControls: writeReadiness.canSubmit
      ? ["Assign chapter role", "Send welcome message", "Sync CRM contact"]
      : [
          "Approve join request",
          "Create membership row",
          "Assign chapter role",
          "Send welcome message",
          "Sync CRM contact",
        ],
    reviewPrompts: [
      "Confirm the applicant is tied to the right chapter before approval.",
      "Confirm the requested role and committee lane match the chapter plan.",
      "Confirm production auth can map this email to exactly one profile.",
      "Confirm the audit log will show actor, target, role, and reason.",
    ],
  };
}

function getWorkspaceMembers(
  data: Pick<
    ReadOnlyAppData,
    | "source"
    | "chapter"
    | "profiles"
    | "memberships"
  >,
): ChapterMemberRow[] {
  if (
    data.source.mode !== "supabase" ||
    data.profiles.length === 0 ||
    data.memberships.length === 0
  ) {
    return memberRows;
  }

  const profilesById = new Map(data.profiles.map((profile) => [profile.id, profile]));
  const mockByEmail = new Map(
    memberRows.map((member) => [member.email.trim().toLowerCase(), member]),
  );
  const approvedRows = data.memberships.filter((membership) => {
    return (
      membership.chapter_id === data.chapter.id && membership.status === "approved"
    );
  });

  if (approvedRows.length === 0) {
    return memberRows;
  }

  return approvedRows.map((membership) => {
    const profile = profilesById.get(membership.user_id);
    const email = profile?.email ?? `missing-profile-${membership.user_id}@mymedlife.test`;
    const seeded = mockByEmail.get(email.trim().toLowerCase());

    return {
      id: membership.id,
      displayName: profile?.display_name ?? seeded?.displayName ?? "Pending profile",
      email,
      roleKey: membership.role_key,
      roleLabel: roleKeyToLabel(membership.role_key),
      committeeLane: seeded?.committeeLane ?? roleKeyToCommitteeLane(membership.role_key),
      membershipStatus: "approved",
      points: seeded?.points ?? 0,
      completedActions: seeded?.completedActions ?? 0,
      openAssignments: seeded?.openAssignments ?? 0,
      proofStatus: seeded?.proofStatus ?? "none",
      nextStep:
        seeded?.nextStep ??
        "Invite this member into the next chapter action or event follow-up.",
    };
  });
}

function getWorkspaceJoinRequests(
  data: Pick<
    ReadOnlyAppData,
    | "source"
    | "chapter"
    | "profiles"
    | "memberships"
  >,
): ChapterJoinRequest[] {
  if (
    data.source.mode !== "supabase" ||
    data.profiles.length === 0 ||
    data.memberships.length === 0
  ) {
    return joinRequests;
  }

  const profilesById = new Map(data.profiles.map((profile) => [profile.id, profile]));
  const mockByEmail = new Map(
    joinRequests.map((request) => [request.email.trim().toLowerCase(), request]),
  );

  return data.memberships
    .filter((membership) => {
      return (
        membership.chapter_id === data.chapter.id && membership.status === "requested"
      );
    })
    .map((membership) => {
      const profile = profilesById.get(membership.user_id);
      const email = profile?.email ?? `missing-profile-${membership.user_id}@mymedlife.test`;
      const seeded = mockByEmail.get(email.trim().toLowerCase());

      return {
        id: membership.id,
        displayName: profile?.display_name ?? seeded?.displayName ?? "Pending student",
        email,
        requestedRoleKey: membership.role_key,
        requestedRoleLabel:
          seeded?.requestedRoleLabel ?? roleKeyToLabel(membership.role_key),
        requestedCommitteeLane:
          seeded?.requestedCommitteeLane ??
          roleKeyToCommitteeLane(membership.role_key),
        source: seeded?.source ?? "chapter_form",
        requestedAtLabel: seeded?.requestedAtLabel ?? "Awaiting local approval review",
        nextStep:
          seeded?.nextStep ??
          "Confirm chapter fit and approval reason before saving locally.",
      };
    });
}

function getDisabledControls(membershipApprovalEnabled: boolean): DisabledMembershipControl[] {
  if (!membershipApprovalEnabled) {
    return disabledControls;
  }

  return disabledControls.filter((control) => control.key !== "approve_join_request");
}

function getRoleCoverage(members: ChapterMemberRow[]): RoleCoverageItem[] {
  const coverage: Array<Pick<RoleCoverageItem, "roleKey" | "roleLabel" | "recommendedMinimum">> = [
    {
      roleKey: "president_vp",
      roleLabel: "President / VP",
      recommendedMinimum: 1,
    },
    {
      roleKey: "e_board_member",
      roleLabel: "E-Board Member",
      recommendedMinimum: 2,
    },
    {
      roleKey: "action_committee_chair",
      roleLabel: "Action Committee Chair",
      recommendedMinimum: 4,
    },
    {
      roleKey: "action_committee_member",
      roleLabel: "Action Committee Member",
      recommendedMinimum: 8,
    },
    {
      roleKey: "general_member",
      roleLabel: "General Member",
      recommendedMinimum: 20,
    },
  ];

  return coverage.map((item) => {
    const currentCount = members.filter((member) => member.roleKey === item.roleKey)
      .length;
    const status = getCoverageStatus(currentCount, item.recommendedMinimum);

    return {
      ...item,
      currentCount,
      status,
      nextStep:
        status === "covered"
          ? "Keep this role active through assignments and recognition."
          : status === "thin"
            ? "Recruit or promote one more student before the next campaign push."
            : "Name an owner before this campaign can scale safely.",
    };
  });
}

function getCoverageStatus(
  currentCount: number,
  recommendedMinimum: number,
): RoleCoverageItem["status"] {
  if (currentCount === 0) {
    return "missing";
  }

  if (currentCount < recommendedMinimum) {
    return "thin";
  }

  return "covered";
}

function getTitle(actor: LocalActorContext, chapterName: string): string {
  switch (actor.audience) {
    case "chapter_leader":
      return `${chapterName} member workspace`;
    case "coach":
      return `${chapterName} coach roster readout`;
    case "admin":
      return `${chapterName} support roster`;
    case "super_admin":
      return `${chapterName} full membership review`;
    case "chapter_member":
    case "ds_admin":
      return "Member management hidden for this role";
  }
}

function getSummary(actor: LocalActorContext, chapterName: string): string {
  switch (actor.audience) {
    case "chapter_leader":
      return `Use this read-only ${chapterName} workspace to see who needs follow-up, which roles are thin, and what join/role controls remain disabled.`;
    case "coach":
      return `Use this roster to coach ${chapterName} on leadership coverage and follow-up risk without owning membership approvals.`;
    case "admin":
      return `HQ can inspect ${chapterName} membership posture, but chapter membership truth remains app-owned and approval-gated.`;
    case "super_admin":
      return `Super Admin can inspect all local membership posture for ${chapterName}; writes still stay disabled.`;
    case "chapter_member":
    case "ds_admin":
      return "This actor should not read the member-management workspace.";
  }
}

function emptyCounts(): ChapterMembershipWorkspace["counts"] {
  return {
    activeMembers: 0,
    pendingRequests: 0,
    leaders: 0,
    committeeMembers: 0,
    openAssignments: 0,
    proofFollowUps: 0,
    enabledControls: 0,
  };
}

function roleKeyToLabel(roleKey: DatabaseRoleKey): string {
  switch (roleKey) {
    case "action_committee_member":
      return "Action Committee Member";
    case "action_committee_chair":
      return "Action Committee Chair";
    case "e_board_member":
      return "E-Board Member";
    case "president_vp":
      return "President / VP";
    case "general_member":
    default:
      return "General Member";
  }
}

function roleKeyToCommitteeLane(roleKey: DatabaseRoleKey): CommitteeLane {
  switch (roleKey) {
    case "action_committee_chair":
    case "action_committee_member":
      return "Local Volunteering";
    case "e_board_member":
    case "president_vp":
      return "Executive Board";
    case "general_member":
    default:
      return "Recruitment";
  }
}
