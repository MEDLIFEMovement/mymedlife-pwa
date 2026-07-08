import { campaignShells } from "@/data/mock-campaigns";
import { mockChapter } from "@/data/mock-rush-month";
import {
  getMockLocalActorContext,
  localActorOptions,
  type LocalActorOption,
} from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { ActorAudience } from "@/services/local-actor-context";
import { getWriteSequencePlanner } from "@/services/write-sequence-planner";
import type { CampaignShellStatus } from "@/shared/types/campaigns";

export type AdminControlAreaKey =
  | "audit_logs"
  | "campaign_templates"
  | "chapters"
  | "integration_outbox"
  | "roles"
  | "system_health"
  | "users";

export type AdminControlStatus = "ready_readonly" | "mock_only" | "blocked";

export type AdminControlArea = {
  key: AdminControlAreaKey;
  title: string;
  status: AdminControlStatus;
  primaryMetric: string;
  detail: string;
  nextAction: string;
};

export type AdminSystemHealthItem = {
  key: string;
  label: string;
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

export type AdminOperatingResponsibilityItem = {
  operationKey: string;
  label: string;
  route: string;
  responsibleRole: string;
  responsibility: string;
  reviewPrompt: string;
  safetyBoundary: string;
};

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

export type AdminMasterDataInventory = {
  users: readonly AdminUserInventoryItem[];
  roles: readonly AdminRoleCoverageItem[];
  chapters: readonly AdminChapterInventoryItem[];
  campaignTemplates: readonly AdminCampaignTemplateInventoryItem[];
  mutationControlsEnabled: 0;
  externalWritesExpected: 0;
};

export type AdminControlCenterSummary = {
  canWriteAdminChanges: false;
  productionAuthEnabled: false;
  externalWritesEnabled: false;
  userCount: number;
  chapterCount: number;
  campaignTemplateCount: number;
  roleAudienceCount: number;
  namedRoleCount: number;
  disabledOutboxCount: number;
  auditLogCount: number;
  roleCoverage: readonly AdminRoleCoverageItem[];
  operatingResponsibilities: readonly AdminOperatingResponsibilityItem[];
  masterDataInventory: AdminMasterDataInventory;
  areas: readonly AdminControlArea[];
  healthItems: readonly AdminSystemHealthItem[];
};

export function getAdminControlCenterSummary(
  data: ReadOnlyAppData,
  actors: readonly LocalActorOption[] = localActorOptions,
): AdminControlCenterSummary {
  const roleAudienceCount = new Set(actors.map((actor) => actor.audience)).size;
  const roleCoverage = getRequiredRoleCoverage(actors);
  const namedRoleCount = roleCoverage.filter((item) => item.status !== "blocked").length;
  const disabledOutboxCount = data.outboxItems.filter((item) => {
    return item.status === "disabled";
  }).length;
  const auditLogCount = data.auditLogs.length;
  const operatingResponsibilities = getAdminOperatingResponsibilities(data);
  const masterDataInventory = getAdminMasterDataInventory(data, actors, roleCoverage);
  const areas = [
    {
      key: "users",
      title: "Users",
      status: "mock_only",
      primaryMetric: `${actors.length} TEST users`,
      detail:
        "Local actor switching covers member, action committee, leader, coach, admin, DS admin, and super admin personas.",
      nextAction:
        "Replace TEST users with Supabase Auth profiles only after live auth approval.",
    },
    {
      key: "roles",
      title: "Roles and permissions",
      status: "ready_readonly",
      primaryMetric: `${namedRoleCount}/${roleCoverage.length} named roles`,
      detail:
        "Role-aware read filters and local actor context now show each named MVP role separately.",
      nextAction:
        "Keep role writes disabled until membership and staff-role approval flows are implemented.",
    },
    {
      key: "chapters",
      title: "Chapters",
      status: "mock_only",
      primaryMetric: "1 TEST chapter",
      detail: `${asTestLabel(mockChapter.name)} is the current local chapter scope.`,
      nextAction:
        "Add admin chapter management only after production auth and RLS policies are approved.",
    },
    {
      key: "campaign_templates",
      title: "Campaign templates",
      status: "ready_readonly",
      primaryMetric: `${campaignShells.length} shells`,
      detail:
        "Rush Month plus reusable campaign shells are visible as read-only operating templates.",
      nextAction:
        "Keep campaign template editing disabled until campaign admin writes are explicitly approved.",
    },
    {
      key: "integration_outbox",
      title: "Integration events and outbox",
      status: "ready_readonly",
      primaryMetric: `${disabledOutboxCount} disabled rows`,
      detail:
        "Integration events and automation outbox records remain visible for review while external sends stay blocked from preview.",
      nextAction:
        "Open the outbox review route for contract and zero-send checks; keep n8n, HubSpot, Luma, warehouse, and Power BI writes disabled until separately approved.",
    },
    {
      key: "audit_logs",
      title: "Audit logs",
      status: auditLogCount > 0 ? "ready_readonly" : "mock_only",
      primaryMetric:
        auditLogCount > 0 ? `${auditLogCount} visible rows` : "0 visible rows",
      detail:
        auditLogCount > 0
          ? "Read-only admin audit browsing can show persisted local audit rows without enabling writes."
          : "Mock fallback can show audit intent, but persisted audit rows are not visible until local Supabase write/readback drills run.",
      nextAction:
        auditLogCount > 0
          ? "Open the audit review route and confirm each approved write path creates actor, target, before/after, reason, and readback evidence."
          : "Run localhost Supabase write/readback drills before treating audit coverage as production-ready, then reopen the audit review route.",
    },
    {
      key: "system_health",
      title: "System health",
      status: "mock_only",
      primaryMetric: "placeholders",
      detail:
        "The admin route names health checks for review, but production monitors and live ops controls are not connected.",
      nextAction:
        "Open the system health review route for runbook follow-through; connect deployment, database, queue, and integration health only after production environments exist.",
    },
  ] as const satisfies readonly AdminControlArea[];

  return {
    canWriteAdminChanges: false,
    productionAuthEnabled: false,
    externalWritesEnabled: false,
    userCount: actors.length,
    chapterCount: 1,
    campaignTemplateCount: campaignShells.length,
    roleAudienceCount,
    namedRoleCount,
    disabledOutboxCount,
    auditLogCount,
    roleCoverage,
    operatingResponsibilities,
    masterDataInventory,
    areas,
    healthItems: getAdminSystemHealthItems(data, actors, roleCoverage),
  };
}

function getAdminMasterDataInventory(
  data: ReadOnlyAppData,
  actors: readonly LocalActorOption[],
  roleCoverage: readonly AdminRoleCoverageItem[],
): AdminMasterDataInventory {
  return {
    users: actors.map((actor) => ({
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
    })),
    roles: roleCoverage,
    chapters: [
      {
        id: data.chapter.id,
        name: asTestLabel(data.chapter.name),
        campus: asTestLabel(data.chapter.campus),
        region: data.chapter.region,
        coachName: asTestLabel(data.chapter.coachName),
        status: data.source.mode === "supabase" ? "ready_readonly" : "mock_only",
        detail:
          data.source.mode === "supabase"
            ? "Read from the local Supabase read-only data source."
            : "TEST chapter scope used for local MVP review.",
      },
    ],
    campaignTemplates: campaignShells.map((shell) => ({
      slug: shell.slug,
      name: asTestLabel(shell.name),
      status: shell.status,
      primaryKpis: shell.primaryKpis,
      actionCommitteeLanes: shell.actionCommitteeLanes,
      integrationPosture: shell.integrationPosture,
      adminStatus: "ready_readonly",
      detail:
        "Read-only campaign shell. Template editing stays disabled until campaign admin writes are approved.",
    })),
    mutationControlsEnabled: 0,
    externalWritesExpected: 0,
  };
}

function asTestLabel(value: string): string {
  return value.startsWith("TEST ") ? value : `TEST ${value}`;
}

function getAdminOperatingResponsibilities(
  data: ReadOnlyAppData,
): AdminOperatingResponsibilityItem[] {
  const adminActor = getMockLocalActorContext(
    "admin@mymedlife.test",
    "Admin control center responsibility summary.",
  );
  const planner = getWriteSequencePlanner(adminActor, data);

  return planner.operations.map((operation) => ({
    operationKey: operation.key,
    label: operation.label,
    route: operation.packetStatus.route,
    responsibleRole: operation.roleResponsibility.roleLabel,
    responsibility: operation.roleResponsibility.responsibility,
    reviewPrompt: operation.roleResponsibility.reviewPrompt,
    safetyBoundary: operation.roleResponsibility.safetyBoundary,
  }));
}

export function getAudienceLabels(
  actors: readonly LocalActorOption[] = localActorOptions,
): ActorAudience[] {
  return Array.from(new Set(actors.map((actor) => actor.audience)));
}

function getAdminSystemHealthItems(
  data: ReadOnlyAppData,
  actors: readonly LocalActorOption[],
  roleCoverage: readonly AdminRoleCoverageItem[],
): AdminSystemHealthItem[] {
  const hasRequiredRoleCoverage = roleCoverage.every((item) => item.status !== "blocked");

  return [
    {
      key: "app_data_source",
      label: "App data source",
      status: data.source.mode === "supabase" ? "ready_readonly" : "mock_only",
      detail: data.source.message,
    },
    {
      key: "local_actor_context",
      label: "Local actor context",
      status: hasRequiredRoleCoverage ? "ready_readonly" : "blocked",
      detail:
        hasRequiredRoleCoverage
          ? "All named MVP roles have fake local review personas."
          : "Missing fake actor coverage for one or more required role families.",
    },
    {
      key: "external_writes",
      label: "External writes",
      status: "blocked",
      detail:
        "External writes are intentionally disabled until Nick/team approve real integration activation.",
    },
    {
      key: "admin_write_controls",
      label: "Admin write controls",
      status: "blocked",
      detail:
        "Admin mutation controls are intentionally absent until auth, RLS, audit, and rollback are approved.",
    },
  ];
}

function getRequiredRoleCoverage(
  actors: readonly LocalActorOption[],
): AdminRoleCoverageItem[] {
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
