import { campaignShells } from "@/data/mock-campaigns";
import { mockChapter } from "@/data/mock-rush-month";
import {
  localActorOptions,
  type LocalActorOption,
} from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { ActorAudience } from "@/services/local-actor-context";

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

export type AdminControlCenterSummary = {
  canWriteAdminChanges: false;
  productionAuthEnabled: false;
  externalWritesEnabled: false;
  userCount: number;
  chapterCount: number;
  campaignTemplateCount: number;
  roleAudienceCount: number;
  disabledOutboxCount: number;
  areas: readonly AdminControlArea[];
  healthItems: readonly AdminSystemHealthItem[];
};

export function getAdminControlCenterSummary(
  data: ReadOnlyAppData,
  actors: readonly LocalActorOption[] = localActorOptions,
): AdminControlCenterSummary {
  const roleAudienceCount = new Set(actors.map((actor) => actor.audience)).size;
  const disabledOutboxCount = data.outboxItems.filter((item) => {
    return item.status === "disabled";
  }).length;
  const areas = [
    {
      key: "users",
      title: "Users",
      status: "mock_only",
      primaryMetric: `${actors.length} fake users`,
      detail:
        "Local actor switching covers member, leader, coach, admin, DS admin, and super admin personas.",
      nextAction:
        "Replace fake users with Supabase Auth profiles only after live auth approval.",
    },
    {
      key: "roles",
      title: "Roles and permissions",
      status: "ready_readonly",
      primaryMetric: `${roleAudienceCount} audiences`,
      detail:
        "Role-aware read filters and local actor context cover the required MVP role families.",
      nextAction:
        "Keep role writes disabled until membership and staff-role approval flows are implemented.",
    },
    {
      key: "chapters",
      title: "Chapters",
      status: "mock_only",
      primaryMetric: "1 mock chapter",
      detail: `${mockChapter.name} is the current local chapter scope.`,
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
        "Integration events and automation outbox records remain mock-safe and external-send disabled.",
      nextAction:
        "Keep n8n, HubSpot, Luma, warehouse, and Power BI writes disabled until separately approved.",
    },
    {
      key: "audit_logs",
      title: "Audit logs",
      status: "mock_only",
      primaryMetric: "local previews",
      detail:
        "Local contracts and the Rush Month loop create audit intent, but admin audit browsing is not table-backed yet.",
      nextAction:
        "Add read-only audit-log browsing after the first approved write path creates persisted audit rows.",
    },
    {
      key: "system_health",
      title: "System health",
      status: "mock_only",
      primaryMetric: "placeholders",
      detail:
        "The admin route now names health checks, but production monitors are not connected.",
      nextAction:
        "Connect deployment, database, queue, and integration health after production environments exist.",
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
    disabledOutboxCount,
    areas,
    healthItems: getAdminSystemHealthItems(data, actors),
  };
}

export function getAudienceLabels(
  actors: readonly LocalActorOption[] = localActorOptions,
): ActorAudience[] {
  return Array.from(new Set(actors.map((actor) => actor.audience)));
}

function getAdminSystemHealthItems(
  data: ReadOnlyAppData,
  actors: readonly LocalActorOption[],
): AdminSystemHealthItem[] {
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
      status: actors.length >= 6 ? "ready_readonly" : "blocked",
      detail:
        actors.length >= 6
          ? "All required fake role families are available for local review."
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
