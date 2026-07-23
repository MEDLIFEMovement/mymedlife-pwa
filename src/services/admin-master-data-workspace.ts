import { campaignShells } from "@/data/mock-campaigns";
import type { AdminManagementDirectory } from "@/services/admin-management-data";
import type { LocalActorContext, LocalActorOption } from "@/services/local-actor-context";
import { localActorOptions } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { ActorAudience } from "@/services/local-actor-context";
import type {
  DatabaseRoleKey,
  JsonValue,
  TemplateStatus,
} from "@/shared/types/persistence";

export type AdminControlStatus = "ready_readonly" | "mock_only" | "blocked";

export type AdminUserInventoryItem = {
  email: string;
  displayName: string;
  audience: ActorAudience | "unassigned";
  chapterRoles: readonly string[];
  staffRoles: readonly string[];
  chapterNames: readonly string[];
  coachPortfolioChapterNames: readonly string[];
  status: AdminControlStatus;
  detail: string;
};

export type AdminRoleCoverageItem = {
  role: string;
  audience: ActorAudience;
  localActorEmail: string | null;
  status: AdminControlStatus;
  detail: string;
};

export type AdminChapterInventoryItem = {
  id: string;
  name: string;
  campus: string;
  region: string;
  coachName: string;
  status: AdminControlStatus;
  detail: string;
};

export type AdminCampaignTemplateInventoryItem = {
  slug: string;
  name: string;
  status: TemplateStatus | "planned" | "template";
  primaryKpis: readonly string[];
  actionCommitteeLanes: readonly string[];
  integrationPosture: string;
  adminStatus: AdminControlStatus;
  detail: string;
};

export type AdminMasterDataWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  nextStep: {
    label: string;
    href: string;
    detail: string;
  };
  users: readonly AdminUserInventoryItem[];
  roles: readonly AdminRoleCoverageItem[];
  chapters: readonly AdminChapterInventoryItem[];
  campaignTemplates: readonly AdminCampaignTemplateInventoryItem[];
  blockedWrites: string[];
  safetyNotes: string[];
  counts: {
    users: number;
    roles: number;
    chapters: number;
    campaignTemplates: number;
    mutationControlsEnabled: 0;
    productionAuthEnabled: 0;
    externalWritesExpected: 0;
  };
};

type AdminMasterDataWorkspaceOptions = {
  actors?: readonly LocalActorOption[];
  directory?: AdminManagementDirectory;
};

export function getAdminMasterDataWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  options: AdminMasterDataWorkspaceOptions = {},
): AdminMasterDataWorkspace {
  if (!canReadAdminMasterData(actor)) {
    return hiddenWorkspace();
  }

  const actors = options.actors ?? localActorOptions;
  const appOwnedDirectory =
    options.directory?.source.mode === "supabase"
      ? options.directory
      : null;
  const isAppOwned = data.source.mode === "supabase";
  const users = isAppOwned
    ? appOwnedDirectory
      ? getDirectoryUserInventory(appOwnedDirectory)
      : getAppOwnedUserInventory(data)
    : getMockUserInventory(actors);
  const roles = isAppOwned
    ? appOwnedDirectory
      ? getDirectoryRoleCoverage(appOwnedDirectory)
      : getAppOwnedRoleCoverage(data)
    : getRequiredRoleCoverage(actors);
  const chapters = getChapterInventory(data, appOwnedDirectory);
  const campaignTemplates = isAppOwned
    ? getAppOwnedCampaignTemplateInventory(data)
    : getMockCampaignTemplateInventory();

  return {
    canReadWorkspace: true,
    title: getTitle(actor),
    summary: isAppOwned
      ? "This route gives HQ a read-only view of app-owned profiles, approved role coverage, chapters, and campaign templates. Missing rows remain visible as gaps while mutation controls stay disabled."
      : "This route gives HQ one focused read-only inventory for TEST users, named roles, chapter scope, and reusable TEST campaign templates before any admin mutation controls exist.",
    nextStep: getNextStep(actor),
    users,
    roles,
    chapters,
    campaignTemplates,
    blockedWrites: [
      "production user creation",
      "profile edits",
      "role assignments",
      "membership approvals",
      "chapter edits",
      "campaign template edits",
      "coach assignment changes",
      "external automation sends",
    ],
    safetyNotes: [
      isAppOwned
        ? "Rows shown here come from the app-owned operational data source and remain read-only."
        : "All rows are local TEST review inventory, not production admin truth.",
      "Production users and profile truth must come from approved Supabase Auth, membership, RLS, and audit paths.",
      "Campaign templates remain read-only until admin write controls, rollback, and approval workflows are designed.",
      "No HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI write runs from this route.",
    ],
    counts: {
      users: users.length,
      roles: roles.length,
      chapters: chapters.length,
      campaignTemplates: campaignTemplates.length,
      mutationControlsEnabled: 0,
      productionAuthEnabled: 0,
      externalWritesExpected: 0,
    },
  };
}

function getMockUserInventory(
  actors: readonly LocalActorOption[],
): readonly AdminUserInventoryItem[] {
  return actors.map((actor) => ({
    email: actor.email,
    displayName: asTestLabel(actor.displayName),
    audience: actor.audience,
    chapterRoles: actor.chapterRoles,
    staffRoles: actor.staffRoles,
    chapterNames: actor.chapterNames.map(asTestLabel),
    coachPortfolioChapterNames: actor.coachPortfolioChapterNames.map(asTestLabel),
    status: "mock_only",
    detail:
      "TEST local review persona. Replace with Supabase Auth profile data only after production auth approval.",
  }));
}

function getAppOwnedUserInventory(
  data: ReadOnlyAppData,
): readonly AdminUserInventoryItem[] {
  const chapterNames = new Map(
    data.chapterRows.map((chapter) => [chapter.id, chapter.name]),
  );

  return data.profiles.map((profile) => {
    const approvedMemberships = data.memberships.filter(
      (membership) =>
        membership.user_id === profile.id &&
        membership.status === "approved",
    );
    const requestedMemberships = data.memberships.filter(
      (membership) =>
        membership.user_id === profile.id &&
        membership.status === "requested",
    );
    const roleKeys = approvedMemberships.map((membership) => membership.role_key);
    const approvedChapterNames = uniqueStrings(
      approvedMemberships
        .map((membership) => chapterNames.get(membership.chapter_id))
        .filter((name): name is string => Boolean(name)),
    );
    const chapterRoles = uniqueStrings(
      roleKeys
        .filter((role) => !staffRoleKeys.has(role))
        .map(getRoleLabel),
    );
    const staffRoles = uniqueStrings(
      roleKeys.filter((role) => staffRoleKeys.has(role)).map(getRoleLabel),
    );
    const audience = getAudienceForRoleKeys(roleKeys);

    return {
      email: profile.email,
      displayName: profile.display_name,
      audience,
      chapterRoles,
      staffRoles,
      chapterNames: approvedChapterNames,
      coachPortfolioChapterNames: roleKeys.includes("coach")
        ? approvedChapterNames
        : [],
      status: "ready_readonly",
      detail: `${profile.status === "active" ? "Active" : "Inactive"} app-owned profile with ${approvedMemberships.length} approved and ${requestedMemberships.length} requested ${approvedMemberships.length + requestedMemberships.length === 1 ? "membership" : "memberships"}.`,
    };
  });
}

function getDirectoryUserInventory(
  directory: AdminManagementDirectory,
): readonly AdminUserInventoryItem[] {
  const chapterNames = new Map(
    directory.chapters.map((chapter) => [chapter.id, chapter.name]),
  );

  return directory.users.map((user) => {
    const chapterRoles = uniqueStrings(
      user.chapterMemberships.map((membership) => membership.roleKey),
    );
    const roleKeys = [
      ...chapterRoles.map(getDatabaseRoleKeyForLabel),
      ...user.staffRoles.map(getDatabaseRoleKeyForLabel),
    ].filter((role): role is DatabaseRoleKey => Boolean(role));

    return {
      email: user.email,
      displayName: user.name,
      audience: getAudienceForRoleKeys(roleKeys),
      chapterRoles,
      staffRoles: user.staffRoles,
      chapterNames: uniqueStrings(
        user.chapterMemberships
          .map((membership) => chapterNames.get(membership.chapterId))
          .filter((name): name is string => Boolean(name)),
      ),
      coachPortfolioChapterNames: uniqueStrings(
        user.portfolioChapterIds
          .map((chapterId) => chapterNames.get(chapterId))
          .filter((name): name is string => Boolean(name)),
      ),
      status: "ready_readonly",
      detail: `${user.status.replaceAll("_", " ")} app-owned directory user with ${user.chapterMemberships.length} approved chapter ${user.chapterMemberships.length === 1 ? "membership" : "memberships"} and ${user.staffRoles.length} active staff ${user.staffRoles.length === 1 ? "role" : "roles"}.`,
    };
  });
}

function getChapterInventory(
  data: ReadOnlyAppData,
  directory: AdminManagementDirectory | null,
): readonly AdminChapterInventoryItem[] {
  const isReadOnlyLiveShape = data.source.mode === "supabase";

  if (!isReadOnlyLiveShape) {
    return [
      {
        id: data.chapter.id,
        name: asTestLabel(data.chapter.name),
        campus: asTestLabel(data.chapter.campus),
        region: asTestLabel(data.chapter.region),
        coachName: asTestLabel(data.chapter.coachName),
        status: "mock_only",
        detail: "Mock chapter scope used for local MVP review.",
      },
    ];
  }

  if (directory) {
    const usersById = new Map(directory.users.map((user) => [user.id, user]));

    return directory.chapters.map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      campus: chapter.school,
      region: chapter.region,
      coachName: chapter.coachOwnerId
        ? usersById.get(chapter.coachOwnerId)?.name ?? "Unassigned"
        : "Unassigned",
      status: "ready_readonly",
      detail: `${chapter.status.replaceAll("_", " ")} app-owned chapter (${chapter.chapterType.replaceAll("_", " ")}).`,
    }));
  }

  const profilesById = new Map(
    data.profiles.map((profile) => [profile.id, profile]),
  );

  return data.chapterRows.map((chapter) => {
    const coachMembership = data.memberships.find(
      (membership) =>
        membership.chapter_id === chapter.id &&
        membership.role_key === "coach" &&
        membership.status === "approved",
    );
    const coach = coachMembership
      ? profilesById.get(coachMembership.user_id)
      : null;

    return {
      id: chapter.id,
      name: chapter.name,
      campus: chapter.campus,
      region: chapter.region ?? "Unassigned",
      coachName: coach?.display_name ?? "Unassigned",
      status: "ready_readonly",
      detail: `${chapter.status.replaceAll("_", " ")} app-owned chapter${chapter.chapter_type ? ` (${chapter.chapter_type.replaceAll("_", " ")})` : ""}.`,
    };
  });
}

function getMockCampaignTemplateInventory(): readonly AdminCampaignTemplateInventoryItem[] {
  return campaignShells.map((shell) => ({
    slug: shell.slug,
    name: asTestLabel(shell.name),
    status: shell.status,
    primaryKpis: shell.primaryKpis,
    actionCommitteeLanes: shell.actionCommitteeLanes,
    integrationPosture: shell.integrationPosture,
    adminStatus: "mock_only",
    detail:
      "Read-only TEST campaign shell. Template editing stays disabled until campaign admin writes are approved.",
  }));
}

function getAppOwnedCampaignTemplateInventory(
  data: ReadOnlyAppData,
): readonly AdminCampaignTemplateInventoryItem[] {
  return data.campaignTemplates.map((template) => ({
    slug: template.slug,
    name: template.name,
    status: template.status,
    primaryKpis: getStringList(template.default_kpis),
    actionCommitteeLanes: getTemplateLanes(template.source_metadata),
    integrationPosture:
      getMetadataString(template.source_metadata, "integration_posture") ??
      "No provider write is implied by this read-only template.",
    adminStatus: "ready_readonly",
    detail:
      "App-owned campaign template. Editing remains disabled until campaign admin writes are approved.",
  }));
}

function getRequiredRoleCoverage(
  actors: readonly LocalActorOption[],
): readonly AdminRoleCoverageItem[] {
  return requiredRoleDefinitions.map((definition) => {
    const actor = actors.find((item) => {
      return (
        item.audience === definition.audience &&
        [...item.chapterRoles, ...item.staffRoles].includes(definition.role)
      );
    });

    return {
      role: definition.role,
      audience: definition.audience,
      localActorEmail: actor?.email ?? null,
      status: actor ? "ready_readonly" : "blocked",
      detail: actor
        ? `${asTestLabel(actor.displayName)} previews ${definition.role} permissions locally.`
        : `No local actor previews ${definition.role} yet.`,
    };
  });
}

function getAppOwnedRoleCoverage(
  data: ReadOnlyAppData,
): readonly AdminRoleCoverageItem[] {
  const profilesById = new Map(
    data.profiles.map((profile) => [profile.id, profile]),
  );

  return requiredRoleDefinitions.map((definition) => {
    const membership = data.memberships.find(
      (item) =>
        item.role_key === definition.databaseRoleKey &&
        item.status === "approved",
    );
    const profile = membership
      ? profilesById.get(membership.user_id)
      : null;

    return {
      role: definition.role,
      audience: definition.audience,
      localActorEmail: profile?.email ?? null,
      status: profile ? "ready_readonly" : "blocked",
      detail: profile
        ? `${profile.display_name} has approved app-owned ${definition.role} coverage.`
        : `No approved app-owned ${definition.role} assignment is visible.`,
    };
  });
}

function getDirectoryRoleCoverage(
  directory: AdminManagementDirectory,
): readonly AdminRoleCoverageItem[] {
  return requiredRoleDefinitions.map((definition) => {
    const user = directory.users.find((item) => {
      const roleLabels = [
        ...item.chapterMemberships.map((membership) => membership.roleKey),
        ...item.staffRoles,
      ];
      return roleLabels.some(
        (label) => getDatabaseRoleKeyForLabel(label) === definition.databaseRoleKey,
      );
    });

    return {
      role: definition.role,
      audience: definition.audience,
      localActorEmail: user?.email ?? null,
      status: user ? "ready_readonly" : "blocked",
      detail: user
        ? `${user.name} has approved app-owned ${definition.role} coverage.`
        : `No approved app-owned ${definition.role} assignment is visible.`,
    };
  });
}

function canReadAdminMasterData(actor: LocalActorContext): boolean {
  return (
    actor.audience === "admin" ||
    actor.audience === "ds_admin" ||
    actor.audience === "super_admin"
  );
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin master data inventory";
    case "ds_admin":
      return "DS Admin master data safety inventory";
    case "super_admin":
      return "Full master data inventory";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Master data hidden for this role";
  }
}

function getNextStep(actor: LocalActorContext): AdminMasterDataWorkspace["nextStep"] {
  if (actor.audience === "ds_admin") {
    return {
      label: "Open admin safety",
      href: "/admin",
      detail:
        "Return to the admin safety dashboard to review outbox, system health, and production launch gates.",
    };
  }

  return {
    label: "Review onboarding gate",
    href: "/onboarding",
    detail:
      "Review the auth/onboarding sequence before approving production users, memberships, or role writes.",
  };
}

function hiddenWorkspace(): AdminMasterDataWorkspace {
  return {
    canReadWorkspace: false,
    title: "Master data hidden for this role",
    summary:
      "Chapter and coach roles should use operating routes, not admin master-data inventory.",
    nextStep: {
      label: "Back to Rush Month",
      href: "/rush-month",
      detail: "Use the operating route for this local role.",
    },
    users: [],
    roles: [],
    chapters: [],
    campaignTemplates: [],
    blockedWrites: [],
    safetyNotes: [],
    counts: {
      users: 0,
      roles: 0,
      chapters: 0,
      campaignTemplates: 0,
      mutationControlsEnabled: 0,
      productionAuthEnabled: 0,
      externalWritesExpected: 0,
    },
  };
}

function asTestLabel(value: string): string {
  return /\bTEST\b/.test(value) ? value : `TEST ${value}`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getAudienceForRoleKeys(
  roleKeys: DatabaseRoleKey[],
): ActorAudience | "unassigned" {
  if (roleKeys.includes("super_admin")) return "super_admin";
  if (roleKeys.includes("ds_admin")) return "ds_admin";
  if (roleKeys.includes("admin")) return "admin";
  if (roleKeys.includes("coach")) return "coach";
  if (
    roleKeys.some((role) =>
      ["action_committee_chair", "e_board_member", "president_vp"].includes(role),
    )
  ) {
    return "chapter_leader";
  }
  if (
    roleKeys.some((role) =>
      ["general_member", "action_committee_member"].includes(role),
    )
  ) {
    return "chapter_member";
  }
  return "unassigned";
}

function getRoleLabel(role: DatabaseRoleKey): string {
  return roleLabels[role];
}

function getDatabaseRoleKeyForLabel(
  label: string,
): DatabaseRoleKey | null {
  const normalized = label.trim().toLowerCase();
  return roleKeyByLabel[normalized] ?? null;
}

function getStringList(value: JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function getTemplateLanes(value: JsonValue): string[] {
  if (!value || Array.isArray(value) || typeof value !== "object") return [];
  return getStringList(
    value.action_committee_lanes ??
      value.actionCommitteeLanes ??
      value.lanes ??
      [],
  );
}

function getMetadataString(
  value: JsonValue,
  key: string,
): string | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const item = value[key];
  return typeof item === "string" ? item : null;
}

const staffRoleKeys = new Set<DatabaseRoleKey>([
  "coach",
  "admin",
  "ds_admin",
  "super_admin",
]);

const roleLabels: Record<DatabaseRoleKey, string> = {
  general_member: "General Member",
  action_committee_member: "Action Committee Member",
  action_committee_chair: "Action Committee Chair",
  e_board_member: "E-Board Member",
  president_vp: "President / VP",
  coach: "Coach",
  admin: "Admin",
  ds_admin: "DS Admin",
  super_admin: "Super Admin",
  test: "Test",
};

const roleKeyByLabel: Record<string, DatabaseRoleKey> = {
  "general member": "general_member",
  "action committee member": "action_committee_member",
  "action committee chair": "action_committee_chair",
  "e-board member": "e_board_member",
  "president / vp": "president_vp",
  coach: "coach",
  staff: "admin",
  admin: "admin",
  "ds admin": "ds_admin",
  "super admin": "super_admin",
  test: "test",
};

const requiredRoleDefinitions = [
  {
    role: "General Member",
    audience: "chapter_member",
    databaseRoleKey: "general_member",
  },
  {
    role: "Action Committee Member",
    audience: "chapter_member",
    databaseRoleKey: "action_committee_member",
  },
  {
    role: "Action Committee Chair",
    audience: "chapter_leader",
    databaseRoleKey: "action_committee_chair",
  },
  {
    role: "E-Board Member",
    audience: "chapter_leader",
    databaseRoleKey: "e_board_member",
  },
  {
    role: "President / VP",
    audience: "chapter_leader",
    databaseRoleKey: "president_vp",
  },
  {
    role: "Coach",
    audience: "coach",
    databaseRoleKey: "coach",
  },
  {
    role: "Admin",
    audience: "admin",
    databaseRoleKey: "admin",
  },
  {
    role: "DS Admin",
    audience: "ds_admin",
    databaseRoleKey: "ds_admin",
  },
  {
    role: "Super Admin",
    audience: "super_admin",
    databaseRoleKey: "super_admin",
  },
] as const satisfies readonly {
  role: string;
  audience: ActorAudience;
  databaseRoleKey: DatabaseRoleKey;
}[];
