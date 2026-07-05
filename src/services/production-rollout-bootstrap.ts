export type ProductionBootstrapChapter = {
  id: string;
  name: string;
  campus: string;
  region?: string;
  status?: "active" | "inactive" | "archived";
};

export type ProductionBootstrapUser = {
  email: string;
  displayName: string;
};

export type ProductionBootstrapMembership = {
  email: string;
  chapterId: string;
  roleKey:
    | "general_member"
    | "action_committee_member"
    | "action_committee_chair"
    | "e_board_member"
    | "president_vp";
  status?: "requested" | "approved" | "rejected" | "inactive";
};

export type ProductionBootstrapStaffRole = {
  email: string;
  roleKey: "coach" | "admin" | "ds_admin" | "super_admin";
  status?: "active" | "inactive" | "ended";
};

export type ProductionBootstrapCoachAssignment = {
  coachEmail: string;
  chapterId: string;
  coachType: "expansion" | "portfolio";
  status?: "active" | "inactive" | "ended";
};

export type ProductionBootstrapCampaign = {
  chapterId: string;
  name: string;
  slug: string;
  status?: "draft" | "active" | "complete" | "archived";
};

export type ProductionBootstrapLumaCalendar = {
  chapterId: string;
  calendarId: string;
  calendarName?: string;
  status?: "linked" | "needs_setup" | "inactive";
};

export type ProductionBootstrapPilotEventProof = {
  chapterId: string;
  eventName: string;
  lumaEventId: string;
  rsvpCount: number;
  attendanceCount: number;
  pointsAwardedCount: number;
  auditEvidence: "recorded" | "missing";
  outboxStatus: "zero_sends" | "sends_detected" | "not_checked";
  status?: "ready" | "needs_review" | "blocked";
  eventRoute?: string;
  attendanceRoute?: string;
  pointsRoute?: string;
  auditRoute?: string;
  outboxRoute?: string;
  checkedAt?: string;
  reviewedByEmail?: string;
  notes?: string;
};

export type ProductionBootstrapLaunchOwner = {
  email: string;
  ownerType: "production_apply" | "support" | "rollback" | "launch_decision";
  displayName?: string;
  status?: "active" | "backup" | "inactive";
};

export type ProductionBootstrapSignedInRouteProof = {
  email: string;
  workspace:
    | "student_app"
    | "leader_command_center"
    | "staff_command_center"
    | "admin_backend";
  expectedPath: string;
  observedPath: string;
  status?: "passed" | "failed" | "not_checked";
  checkedAt?: string;
  notes?: string;
};

export type ProductionRolloutBootstrapPacket = {
  chapters: ProductionBootstrapChapter[];
  users: ProductionBootstrapUser[];
  memberships: ProductionBootstrapMembership[];
  staffRoles: ProductionBootstrapStaffRole[];
  coachAssignments: ProductionBootstrapCoachAssignment[];
  campaigns: ProductionBootstrapCampaign[];
  lumaCalendars?: ProductionBootstrapLumaCalendar[];
  pilotEventProof?: ProductionBootstrapPilotEventProof[];
  launchOwners?: ProductionBootstrapLaunchOwner[];
  signedInRouteProof?: ProductionBootstrapSignedInRouteProof[];
};

export type ProductionRolloutBootstrapReadiness = {
  ready: boolean;
  counts: {
    activeChapters: number;
    users: number;
    approvedMemberships: number;
    activeStaffRoles: number;
    activeCoachAssignments: number;
    activeCampaigns: number;
    approvedStudentMemberships: number;
    linkedLumaCalendars: number;
    readyPilotEventProofChapters: number;
    activeLaunchOwners: number;
    memberWorkspaceUsers: number;
    leaderWorkspaceUsers: number;
    staffWorkspaceUsers: number;
    adminWorkspaceUsers: number;
    chaptersWithMemberWorkspaceAccess: number;
    chaptersWithLeaderWorkspaceAccess: number;
  };
  blockers: string[];
  warnings: string[];
  nextSteps: string[];
};

export type ProductionRolloutBootstrapOptions = {
  minimumChapterCount?: number;
  minimumStudentMembershipCount?: number;
  minimumPilotChapterCount?: number;
};

export function formatProductionRolloutBootstrapReadiness(
  readiness: ProductionRolloutBootstrapReadiness,
): string {
  const lines = [
    readiness.ready
      ? "Production rollout packet: READY"
      : "Production rollout packet: NOT READY",
    "",
    "Counts:",
    `- active chapters: ${readiness.counts.activeChapters}`,
    `- users: ${readiness.counts.users}`,
    `- approved memberships: ${readiness.counts.approvedMemberships}`,
    `- active staff roles: ${readiness.counts.activeStaffRoles}`,
    `- active coach assignments: ${readiness.counts.activeCoachAssignments}`,
    `- active campaigns: ${readiness.counts.activeCampaigns}`,
    `- approved student/leader users: ${readiness.counts.approvedStudentMemberships}`,
    `- linked Luma calendars: ${readiness.counts.linkedLumaCalendars}`,
    `- ready pilot event-loop chapters: ${readiness.counts.readyPilotEventProofChapters}`,
    `- active launch owners: ${readiness.counts.activeLaunchOwners}`,
    `- member workspace users: ${readiness.counts.memberWorkspaceUsers}`,
    `- leader workspace users: ${readiness.counts.leaderWorkspaceUsers}`,
    `- staff workspace users: ${readiness.counts.staffWorkspaceUsers}`,
    `- admin workspace users: ${readiness.counts.adminWorkspaceUsers}`,
    `- chapters with member workspace access: ${readiness.counts.chaptersWithMemberWorkspaceAccess}`,
    `- chapters with leader workspace access: ${readiness.counts.chaptersWithLeaderWorkspaceAccess}`,
    "",
    "Blockers:",
    ...formatList(readiness.blockers, "None"),
    "",
    "Warnings:",
    ...formatList(readiness.warnings, "None"),
    "",
    "Next steps:",
    ...formatList(readiness.nextSteps, "None"),
  ];

  return lines.join("\n");
}

const leaderRoleKeys = new Set([
  "action_committee_chair",
  "e_board_member",
  "president_vp",
]);

const memberWorkspaceRoleKeys = new Set([
  "general_member",
  "action_committee_member",
  "action_committee_chair",
  "e_board_member",
  "president_vp",
]);

const directMemberRoleKeys = new Set([
  "general_member",
  "action_committee_member",
]);

const staffWorkspaceRoleKeys = new Set(["coach", "admin", "super_admin"]);

const adminWorkspaceRoleKeys = new Set(["ds_admin", "super_admin"]);

const fakeEmailFragments = [
  "@mymedlife.test",
  "@example.com",
  "@test.com",
  "fake",
  "mock",
];

const secretLikeKeys = ["password", "token", "secret", "apiKey", "api_key"];

export function getProductionRolloutBootstrapReadiness(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionRolloutBootstrapOptions = {},
): ProductionRolloutBootstrapReadiness {
  const minimumChapterCount = options.minimumChapterCount ?? 30;
  const minimumStudentMembershipCount = options.minimumStudentMembershipCount ?? 500;
  const minimumPilotChapterCount = options.minimumPilotChapterCount ?? 5;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const activeChapters = packet.chapters.filter(
    (chapter) => (chapter.status ?? "active") === "active",
  );
  const approvedMemberships = packet.memberships.filter(
    (membership) => (membership.status ?? "approved") === "approved",
  );
  const activeStaffRoles = packet.staffRoles.filter(
    (role) => (role.status ?? "active") === "active",
  );
  const activeCoachAssignments = packet.coachAssignments.filter(
    (assignment) => (assignment.status ?? "active") === "active",
  );
  const activeCampaigns = packet.campaigns.filter(
    (campaign) => (campaign.status ?? "active") === "active",
  );
  const linkedLumaCalendars = (packet.lumaCalendars ?? []).filter(
    (calendar) => (calendar.status ?? "linked") === "linked",
  );
  const readyPilotEventProof = (packet.pilotEventProof ?? []).filter(
    (proof) => (proof.status ?? "ready") === "ready",
  );
  const activeLaunchOwners = (packet.launchOwners ?? []).filter(
    (owner) => (owner.status ?? "active") === "active",
  );
  const userEmails = new Set(packet.users.map((user) => normalizeEmail(user.email)));
  const chapterIds = new Set(packet.chapters.map((chapter) => chapter.id));
  const approvedStudentEmails = new Set(
    approvedMemberships.map((membership) => normalizeEmail(membership.email)),
  );
  const memberWorkspaceEmails = new Set(
    approvedMemberships
      .filter((membership) => memberWorkspaceRoleKeys.has(membership.roleKey))
      .map((membership) => normalizeEmail(membership.email)),
  );
  const leaderWorkspaceEmails = new Set(
    approvedMemberships
      .filter((membership) => leaderRoleKeys.has(membership.roleKey))
      .map((membership) => normalizeEmail(membership.email)),
  );
  const staffWorkspaceEmails = new Set(
    activeStaffRoles
      .filter((role) => staffWorkspaceRoleKeys.has(role.roleKey))
      .map((role) => normalizeEmail(role.email)),
  );
  const adminWorkspaceEmails = new Set(
    activeStaffRoles
      .filter((role) => adminWorkspaceRoleKeys.has(role.roleKey))
      .map((role) => normalizeEmail(role.email)),
  );
  const linkedLumaChapterIds = new Set(
    linkedLumaCalendars.map((calendar) => calendar.chapterId),
  );
  const readyPilotProofChapterIds = new Set(
    readyPilotEventProof
      .filter((proof) => linkedLumaChapterIds.has(proof.chapterId))
      .map((proof) => proof.chapterId),
  );

  if (activeChapters.length < minimumChapterCount) {
    const chapterLabel = minimumChapterCount === 1 ? "chapter" : "chapters";
    blockers.push(
      `Add at least ${minimumChapterCount} active ${chapterLabel} before production rollout. Current active chapters: ${activeChapters.length}.`,
    );
  }

  if (packet.users.length === 0) {
    blockers.push("Add launch users to users.csv before production rollout.");
  }

  if (approvedMemberships.length === 0) {
    blockers.push(
      "Add approved chapter memberships to memberships.csv before production rollout.",
    );
  }

  if (approvedStudentEmails.size < minimumStudentMembershipCount) {
    blockers.push(
      `Add at least ${minimumStudentMembershipCount} approved student/leader users before inviting the first ${minimumChapterCount} chapters. Current approved student/leader users: ${approvedStudentEmails.size}.`,
    );
  }

  if (activeCoachAssignments.length === 0) {
    blockers.push(
      "Add active coach assignments to coach-assignments.csv before production rollout.",
    );
  }

  if (activeCampaigns.length === 0) {
    blockers.push("Add active launch campaigns to campaigns.csv before production rollout.");
  }

  if (staffWorkspaceEmails.size === 0) {
    blockers.push("Add at least one active coach, admin, or super admin for staff command center access.");
  }

  if (adminWorkspaceEmails.size === 0) {
    blockers.push("Add at least one active DS Admin or Super Admin for admin backend access.");
  }

  addDuplicateBlockers(
    blockers,
    packet.users.map((user) => normalizeEmail(user.email)),
    "user email",
  );
  addDuplicateBlockers(
    blockers,
    packet.chapters.map((chapter) => chapter.id),
    "chapter id",
  );
  addDuplicateBlockers(
    blockers,
    linkedLumaCalendars.map((calendar) => calendar.chapterId),
    "linked Luma chapter mapping",
  );
  addDuplicateBlockers(
    blockers,
    linkedLumaCalendars.map((calendar) => normalizeId(calendar.calendarId)),
    "linked Luma calendar id",
  );
  addDuplicateBlockers(
    blockers,
    packet.memberships.map((membership) =>
      formatDuplicateKey(
        normalizeEmail(membership.email),
        membership.chapterId,
        membership.roleKey,
      ),
    ),
    "membership access row",
  );
  addDuplicateBlockers(
    blockers,
    packet.staffRoles.map((role) =>
      formatDuplicateKey(normalizeEmail(role.email), role.roleKey),
    ),
    "staff role row",
  );
  addDuplicateBlockers(
    blockers,
    packet.coachAssignments.map((assignment) =>
      formatDuplicateKey(
        normalizeEmail(assignment.coachEmail),
        assignment.chapterId,
        assignment.coachType,
      ),
    ),
    "coach assignment row",
  );
  addDuplicateBlockers(
    blockers,
    packet.campaigns.map((campaign) =>
      formatDuplicateKey(campaign.chapterId, campaign.slug),
    ),
    "campaign row",
  );
  addDuplicateBlockers(
    blockers,
    (packet.pilotEventProof ?? []).map((proof) =>
      formatDuplicateKey(proof.chapterId, proof.lumaEventId),
    ),
    "pilot event proof row",
  );
  addDuplicateBlockers(
    blockers,
    (packet.launchOwners ?? []).map((owner) =>
      formatDuplicateKey(normalizeEmail(owner.email), owner.ownerType),
    ),
    "launch owner row",
  );

  for (const user of packet.users) {
    if (!user.displayName.trim()) {
      blockers.push(`User ${user.email} is missing a display name.`);
    }

    if (hasFakeEmail(user.email)) {
      blockers.push(`User ${user.email} looks like fake or test data.`);
    }
  }

  for (const membership of packet.memberships) {
    if (!userEmails.has(normalizeEmail(membership.email))) {
      blockers.push(`Membership references unknown user ${membership.email}.`);
    }

    if (!chapterIds.has(membership.chapterId)) {
      blockers.push(
        `Membership for ${membership.email} references unknown chapter ${membership.chapterId}.`,
      );
    }
  }

  for (const role of packet.staffRoles) {
    if (!userEmails.has(normalizeEmail(role.email))) {
      blockers.push(`Staff role references unknown user ${role.email}.`);
    }
  }

  for (const assignment of packet.coachAssignments) {
    if (!userEmails.has(normalizeEmail(assignment.coachEmail))) {
      blockers.push(`Coach assignment references unknown coach ${assignment.coachEmail}.`);
    }

    if (!chapterIds.has(assignment.chapterId)) {
      blockers.push(
        `Coach assignment for ${assignment.coachEmail} references unknown chapter ${assignment.chapterId}.`,
      );
    }
  }

  for (const campaign of packet.campaigns) {
    if (!chapterIds.has(campaign.chapterId)) {
      blockers.push(
        `Campaign ${campaign.slug} references unknown chapter ${campaign.chapterId}.`,
      );
    }
  }

  for (const calendar of packet.lumaCalendars ?? []) {
    if (!chapterIds.has(calendar.chapterId)) {
      blockers.push(
        `Luma calendar ${calendar.calendarId} references unknown chapter ${calendar.chapterId}.`,
      );
    }

    if ((calendar.status ?? "linked") === "linked" && !calendar.calendarId.trim()) {
      blockers.push(`${calendar.chapterId} needs a non-empty Luma calendar id.`);
    }
  }

  for (const proof of packet.pilotEventProof ?? []) {
    if (!chapterIds.has(proof.chapterId)) {
      blockers.push(
        `Pilot event proof ${proof.lumaEventId} references unknown chapter ${proof.chapterId}.`,
      );
    }

    if ((proof.status ?? "ready") === "ready") {
      if (!linkedLumaChapterIds.has(proof.chapterId)) {
        blockers.push(
          `${proof.chapterId} pilot event ${proof.lumaEventId} needs a linked Luma calendar mapping before proof can count as ready.`,
        );
      }

      addReadyPilotProofBlockers(blockers, proof, userEmails);
    }
  }

  for (const owner of packet.launchOwners ?? []) {
    if (!userEmails.has(normalizeEmail(owner.email))) {
      blockers.push(`Launch owner references unknown user ${owner.email}.`);
    }
  }

  for (const chapter of activeChapters) {
    const chapterMemberships = approvedMemberships.filter(
      (membership) => membership.chapterId === chapter.id,
    );
    const hasDirectMember = chapterMemberships.some((membership) =>
      directMemberRoleKeys.has(membership.roleKey),
    );
    const hasLeader = chapterMemberships.some((membership) =>
      leaderRoleKeys.has(membership.roleKey),
    );
    const hasCoach = activeCoachAssignments.some(
      (assignment) => assignment.chapterId === chapter.id,
    );
    const hasActiveCampaign = activeCampaigns.some(
      (campaign) => campaign.chapterId === chapter.id,
    );

    if (!hasLeader) {
      blockers.push(`${chapter.name} needs at least one approved chapter leader.`);
    }

    if (!hasDirectMember) {
      blockers.push(`${chapter.name} needs at least one approved member for the student app.`);
    }

    if (!hasCoach) {
      blockers.push(`${chapter.name} needs one active coach assignment.`);
    }

    if (!hasActiveCampaign) {
      blockers.push(`${chapter.name} needs one active launch campaign.`);
    }

    if (!linkedLumaChapterIds.has(chapter.id)) {
      blockers.push(`${chapter.name} needs a linked Luma calendar mapping.`);
    }
  }

  const activeCoachEmails = new Set(
    activeStaffRoles
      .filter((role) => role.roleKey === "coach")
      .map((role) => normalizeEmail(role.email)),
  );

  for (const assignment of activeCoachAssignments) {
    if (!activeCoachEmails.has(normalizeEmail(assignment.coachEmail))) {
      blockers.push(
        `Coach assignment for ${assignment.coachEmail} needs an active coach staff role.`,
      );
    }
  }

  if (!activeStaffRoles.some((role) => role.roleKey === "admin")) {
    blockers.push("Add at least one active admin staff role for day-one support.");
  }

  if (
    !activeStaffRoles.some(
      (role) => role.roleKey === "ds_admin" || role.roleKey === "super_admin",
    )
  ) {
    blockers.push("Add at least one DS Admin or Super Admin for launch controls.");
  }

  if (readyPilotProofChapterIds.size < minimumPilotChapterCount) {
    blockers.push(
      `Add ready event-loop proof for at least ${minimumPilotChapterCount} pilot chapters before inviting ${minimumChapterCount} chapters. Current ready pilot chapters: ${readyPilotProofChapterIds.size}.`,
    );
  }

  addMissingOwnerBlocker(blockers, activeLaunchOwners, "support");
  addMissingOwnerBlocker(blockers, activeLaunchOwners, "rollback");
  addMissingOwnerBlocker(blockers, activeLaunchOwners, "production_apply");

  if (containsSecretLikeField(packet)) {
    blockers.push(
      "Remove password, token, API key, and secret fields. Production packets must not carry credentials.",
    );
  }

  for (const chapter of activeChapters) {
    const memberCount = approvedMemberships.filter(
      (membership) => membership.chapterId === chapter.id,
    ).length;

    if (memberCount < 2) {
      warnings.push(
        `${chapter.name} has fewer than two approved members. It can launch, but the leaderboard will look sparse.`,
      );
    }
  }

  const chaptersWithMemberWorkspaceAccess = activeChapters.filter((chapter) =>
    approvedMemberships.some(
      (membership) =>
        membership.chapterId === chapter.id &&
        memberWorkspaceRoleKeys.has(membership.roleKey),
    ),
  ).length;
  const chaptersWithLeaderWorkspaceAccess = activeChapters.filter((chapter) =>
    approvedMemberships.some(
      (membership) =>
        membership.chapterId === chapter.id &&
        leaderRoleKeys.has(membership.roleKey),
    ),
  ).length;

  return {
    ready: blockers.length === 0,
    counts: {
      activeChapters: activeChapters.length,
      users: packet.users.length,
      approvedMemberships: approvedMemberships.length,
      activeStaffRoles: activeStaffRoles.length,
      activeCoachAssignments: activeCoachAssignments.length,
      activeCampaigns: activeCampaigns.length,
      approvedStudentMemberships: approvedStudentEmails.size,
      linkedLumaCalendars: linkedLumaCalendars.length,
      readyPilotEventProofChapters: readyPilotProofChapterIds.size,
      activeLaunchOwners: activeLaunchOwners.length,
      memberWorkspaceUsers: memberWorkspaceEmails.size,
      leaderWorkspaceUsers: leaderWorkspaceEmails.size,
      staffWorkspaceUsers: staffWorkspaceEmails.size,
      adminWorkspaceUsers: adminWorkspaceEmails.size,
      chaptersWithMemberWorkspaceAccess,
      chaptersWithLeaderWorkspaceAccess,
    },
    blockers,
    warnings,
    nextSteps:
      blockers.length === 0
        ? [
            "Create Supabase Auth users through invite or approved admin flow.",
            "Insert matching profiles, chapters, memberships, staff roles, coach assignments, campaigns, and Luma calendar mappings.",
            "Run the 5-chapter Luma event, RSVP, attendance, points, and leaderboard pilot proof before inviting all chapters.",
            "Run signed-in route checks for /app, /leader, /staff, and /admin before inviting all chapters.",
          ]
        : [
            "Fix the blockers in the rollout packet.",
            "Re-run the readiness check before creating production users or app data.",
            "Keep the local fake seed file out of production.",
          ],
  };
}

function addReadyPilotProofBlockers(
  blockers: string[],
  proof: ProductionBootstrapPilotEventProof,
  userEmails: Set<string>,
) {
  const proofLabel = `${proof.chapterId} pilot event ${proof.lumaEventId}`;

  if (!proof.eventName.trim()) {
    blockers.push(`${proofLabel} is missing an event name.`);
  }

  if (proof.rsvpCount < 1) {
    blockers.push(`${proofLabel} needs at least one RSVP.`);
  }

  if (proof.attendanceCount < 1) {
    blockers.push(`${proofLabel} needs at least one attendance check-in.`);
  }

  if (proof.pointsAwardedCount < 1) {
    blockers.push(`${proofLabel} needs at least one points award.`);
  }

  if (proof.auditEvidence !== "recorded") {
    blockers.push(`${proofLabel} needs recorded audit evidence.`);
  }

  if (proof.outboxStatus !== "zero_sends") {
    blockers.push(`${proofLabel} needs zero external sends in the outbox.`);
  }

  addRequiredPilotEvidenceRouteBlocker(
    blockers,
    proofLabel,
    proof.eventRoute,
    "event route",
  );
  addRequiredPilotEvidenceRouteBlocker(
    blockers,
    proofLabel,
    proof.attendanceRoute,
    "attendance route",
  );
  addRequiredPilotEvidenceRouteBlocker(
    blockers,
    proofLabel,
    proof.pointsRoute,
    "points route",
  );
  addRequiredPilotEvidenceRouteBlocker(
    blockers,
    proofLabel,
    proof.auditRoute,
    "audit route",
  );
  addRequiredPilotEvidenceRouteBlocker(
    blockers,
    proofLabel,
    proof.outboxRoute,
    "outbox route",
  );

  if (!proof.checkedAt?.trim()) {
    blockers.push(`${proofLabel} needs a checkedAt timestamp.`);
  }

  if (!proof.reviewedByEmail?.trim()) {
    blockers.push(`${proofLabel} needs a reviewedByEmail owner.`);
  } else if (!userEmails.has(normalizeEmail(proof.reviewedByEmail))) {
    blockers.push(
      `${proofLabel} reviewedByEmail references unknown user ${proof.reviewedByEmail}.`,
    );
  }
}

function addRequiredPilotEvidenceRouteBlocker(
  blockers: string[],
  proofLabel: string,
  route: string | undefined,
  label: string,
) {
  if (!route?.trim()) {
    blockers.push(`${proofLabel} needs ${label} proof link.`);
    return;
  }

  if (!route.startsWith("/")) {
    blockers.push(`${proofLabel} ${label} proof link must be an app route.`);
  }
}

function addMissingOwnerBlocker(
  blockers: string[],
  owners: ProductionBootstrapLaunchOwner[],
  ownerType: ProductionBootstrapLaunchOwner["ownerType"],
) {
  if (owners.some((owner) => owner.ownerType === ownerType)) {
    return;
  }

  blockers.push(`Add an active ${ownerType.replace("_", " ")} owner to launch-owners.csv.`);
}

function addDuplicateBlockers(
  blockers: string[],
  values: string[],
  label: string,
) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  for (const duplicate of duplicates) {
    blockers.push(`Duplicate ${label}: ${duplicate}.`);
  }
}

function hasFakeEmail(email: string) {
  const normalized = normalizeEmail(email);
  return fakeEmailFragments.some((fragment) => normalized.includes(fragment));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeId(value: string) {
  return value.trim().toLowerCase();
}

function formatDuplicateKey(...parts: string[]) {
  return parts.map((part) => part.trim().toLowerCase()).join(" / ");
}

function containsSecretLikeField(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  for (const [key, child] of Object.entries(value)) {
    if (secretLikeKeys.some((secretKey) => key.toLowerCase() === secretKey.toLowerCase())) {
      return true;
    }

    if (Array.isArray(child)) {
      if (child.some((item) => containsSecretLikeField(item))) {
        return true;
      }
      continue;
    }

    if (containsSecretLikeField(child)) {
      return true;
    }
  }

  return false;
}

function formatList(items: string[], emptyText: string) {
  if (items.length === 0) {
    return [`- ${emptyText}`];
  }

  return items.map((item) => `- ${item}`);
}
