import { campaignShells } from "@/data/mock-campaigns";
import type { LocalActorContext, LocalActorOption } from "@/services/local-actor-context";
import { localActorOptions } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { ActorAudience } from "@/services/local-actor-context";
import type { CampaignShellStatus } from "@/shared/types/campaigns";

export type AdminControlStatus = "ready_readonly" | "mock_only" | "blocked";

export type AdminUserInventoryItem = {
  email: string;
  displayName: string;
  audience: ActorAudience;
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
  status: CampaignShellStatus;
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

export function getAdminMasterDataWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  actors: readonly LocalActorOption[] = localActorOptions,
): AdminMasterDataWorkspace {
  if (!canReadAdminMasterData(actor)) {
    return hiddenWorkspace();
  }

  const roles = getRequiredRoleCoverage(actors);
  const users = getUserInventory(actors);
  const chapters = getChapterInventory(data);
  const campaignTemplates = getCampaignTemplateInventory();

  return {
    canReadWorkspace: true,
    title: getTitle(actor),
    summary:
      "This route gives HQ one focused read-only inventory for fake users, named roles, chapter scope, and reusable campaign templates before any admin mutation controls exist.",
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
      "All rows are local review inventory, not production admin truth.",
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

function getUserInventory(
  actors: readonly LocalActorOption[],
): readonly AdminUserInventoryItem[] {
  return actors.map((actor) => ({
    email: actor.email,
    displayName: asTestLabel(actor.displayName),
    audience: actor.audience,
    chapterRoles: actor.chapterRoles,
    staffRoles: actor.staffRoles,
    chapterNames: actor.chapterNames,
    coachPortfolioChapterNames: actor.coachPortfolioChapterNames,
    status: "mock_only",
    detail:
      "Fake local review persona. Replace with Supabase Auth profile data only after production auth approval.",
  }));
}

function getChapterInventory(
  data: ReadOnlyAppData,
): readonly AdminChapterInventoryItem[] {
  const isReadOnlyLiveShape = data.source.mode === "supabase";

  return [
    {
      id: data.chapter.id,
      name: isReadOnlyLiveShape ? data.chapter.name : asTestLabel(data.chapter.name),
      campus: isReadOnlyLiveShape ? data.chapter.campus : asTestLabel(data.chapter.campus),
      region: isReadOnlyLiveShape ? data.chapter.region : asTestLabel(data.chapter.region),
      coachName: data.chapter.coachName,
      status: isReadOnlyLiveShape ? "ready_readonly" : "mock_only",
      detail:
        isReadOnlyLiveShape
          ? "Read from the local Supabase read-only data source."
          : "Mock chapter scope used for local MVP review.",
    },
  ];
}

function getCampaignTemplateInventory(): readonly AdminCampaignTemplateInventoryItem[] {
  return campaignShells.map((shell) => ({
    slug: shell.slug,
    name: asTestLabel(shell.name),
    status: shell.status,
    primaryKpis: shell.primaryKpis,
    actionCommitteeLanes: shell.actionCommitteeLanes,
    integrationPosture: shell.integrationPosture,
    adminStatus: "ready_readonly",
    detail:
      "Read-only campaign shell. Template editing stays disabled until campaign admin writes are approved.",
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
        ? `${actor.displayName} previews ${definition.role} permissions locally.`
        : `No local actor previews ${definition.role} yet.`,
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

const requiredRoleDefinitions = [
  {
    role: "General Member",
    audience: "chapter_member",
  },
  {
    role: "Action Committee Member",
    audience: "chapter_member",
  },
  {
    role: "Action Committee Chair",
    audience: "chapter_leader",
  },
  {
    role: "E-Board Member",
    audience: "chapter_leader",
  },
  {
    role: "President / VP",
    audience: "chapter_leader",
  },
  {
    role: "Coach",
    audience: "coach",
  },
  {
    role: "Admin",
    audience: "admin",
  },
  {
    role: "DS Admin",
    audience: "ds_admin",
  },
  {
    role: "Super Admin",
    audience: "super_admin",
  },
] as const satisfies readonly { role: string; audience: ActorAudience }[];
