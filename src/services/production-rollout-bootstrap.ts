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

export type ProductionRolloutBootstrapPacket = {
  chapters: ProductionBootstrapChapter[];
  users: ProductionBootstrapUser[];
  memberships: ProductionBootstrapMembership[];
  staffRoles: ProductionBootstrapStaffRole[];
  coachAssignments: ProductionBootstrapCoachAssignment[];
  campaigns: ProductionBootstrapCampaign[];
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
  };
  blockers: string[];
  warnings: string[];
  nextSteps: string[];
};

export type ProductionRolloutBootstrapOptions = {
  minimumChapterCount?: number;
};

const leaderRoleKeys = new Set([
  "action_committee_chair",
  "e_board_member",
  "president_vp",
]);

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
  const userEmails = new Set(packet.users.map((user) => normalizeEmail(user.email)));
  const chapterIds = new Set(packet.chapters.map((chapter) => chapter.id));

  if (activeChapters.length < minimumChapterCount) {
    blockers.push(
      `Add at least ${minimumChapterCount} active chapters before the 30-chapter rollout. Current active chapters: ${activeChapters.length}.`,
    );
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

  for (const chapter of activeChapters) {
    const chapterMemberships = approvedMemberships.filter(
      (membership) => membership.chapterId === chapter.id,
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

    if (!hasCoach) {
      blockers.push(`${chapter.name} needs one active coach assignment.`);
    }

    if (!hasActiveCampaign) {
      blockers.push(`${chapter.name} needs one active launch campaign.`);
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

  return {
    ready: blockers.length === 0,
    counts: {
      activeChapters: activeChapters.length,
      users: packet.users.length,
      approvedMemberships: approvedMemberships.length,
      activeStaffRoles: activeStaffRoles.length,
      activeCoachAssignments: activeCoachAssignments.length,
      activeCampaigns: activeCampaigns.length,
    },
    blockers,
    warnings,
    nextSteps:
      blockers.length === 0
        ? [
            "Create Supabase Auth users through invite or approved admin flow.",
            "Insert matching profiles, chapters, memberships, staff roles, coach assignments, and campaigns.",
            "Run signed-in route checks for /app, /leader, and /staff before inviting all chapters.",
          ]
        : [
            "Fix the blockers in the rollout packet.",
            "Re-run the readiness check before creating production users or app data.",
            "Keep the local fake seed file out of production.",
          ],
  };
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
