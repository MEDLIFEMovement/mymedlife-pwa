import "server-only";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getHubSpotReadSyncConfig } from "@/services/hubspot-read-sync";

export type AdminHubSpotSyncWorkspace = {
  canRead: boolean;
  config: ReturnType<typeof getHubSpotReadSyncConfig>;
  lastRun: {
    id: string;
    mode: string;
    status: string;
    triggerSource: string;
    retryOfRunId: string | null;
    startedAt: string;
    completedAt: string | null;
    heartbeatAt: string;
    sourceCompanies: number;
    sourceContacts: number;
    membershipDeactivations: number;
    chapterDeactivations: number;
    materializedChapters: number;
    matchedProfiles: number;
    conflicts: number;
    failures: number;
  } | null;
  counts: {
    companies: number;
    contacts: number;
    memberships: number;
    pendingCompanies: number;
    pendingContacts: number;
    pendingMemberships: number;
    materializedMemberships: number;
    ignoredMemberships: number;
    openFailures: number;
  };
  failures: Array<{
    id: string;
    objectType: string;
    externalId: string | null;
    code: string;
    message: string;
    retryCount: number;
    createdAt: string;
  }>;
  message: string;
};

type AdminHubSpotSyncWorkspaceDeps = {
  createServerClient?: typeof createLocalSupabaseServerClient;
  getSyncConfig?: typeof getHubSpotReadSyncConfig;
};

export async function getAdminHubSpotSyncWorkspace(
  deps: AdminHubSpotSyncWorkspaceDeps = {},
): Promise<AdminHubSpotSyncWorkspace> {
  const config = (deps.getSyncConfig ?? getHubSpotReadSyncConfig)();
  const { client, config: authConfig } = await (deps.createServerClient ?? createLocalSupabaseServerClient)();
  if (!client) return emptyWorkspace(config, authConfig.reason);

  const app = client.schema("app");
  const [runs, companies, contacts, memberships, pendingCompanies, pendingContacts, pendingMemberships, materializedMemberships, ignoredMemberships, failures] = await Promise.all([
    app.from("hubspot_sync_runs").select("id,mode,status,trigger_source,retry_of_run_id,started_at,completed_at,heartbeat_at,source_company_count,source_contact_count,membership_deactivation_count,chapter_deactivation_count,materialized_chapter_count,matched_profile_count,conflict_count,failure_count").order("started_at", { ascending: false }).limit(1),
    app.from("hubspot_company_imports").select("hubspot_company_id", { count: "exact", head: true }),
    app.from("hubspot_contact_imports").select("hubspot_contact_id", { count: "exact", head: true }),
    app.from("hubspot_membership_imports").select("hubspot_contact_id", { count: "exact", head: true }),
    app.from("hubspot_company_imports").select("hubspot_company_id", { count: "exact", head: true }).eq("reconciliation_status", "pending"),
    app.from("hubspot_contact_imports").select("hubspot_contact_id", { count: "exact", head: true }).eq("reconciliation_status", "pending"),
    app.from("hubspot_membership_imports").select("hubspot_contact_id", { count: "exact", head: true }).eq("reconciliation_status", "pending"),
    app.from("hubspot_membership_imports").select("hubspot_contact_id", { count: "exact", head: true }).eq("reconciliation_status", "materialized"),
    app.from("hubspot_membership_imports").select("hubspot_contact_id", { count: "exact", head: true }).eq("reconciliation_status", "ignored"),
    app.from("hubspot_sync_failures").select("id,object_type,external_id,error_code,error_message,retry_count,created_at", { count: "exact" }).is("resolved_at", null).order("created_at", { ascending: false }).limit(20),
  ]);

  const queryError = [runs, companies, contacts, memberships, pendingCompanies, pendingContacts, pendingMemberships, materializedMemberships, ignoredMemberships, failures]
    .find((result) => result.error)?.error;
  if (queryError) {
    return emptyWorkspace(config, `HubSpot sync readback is unavailable: ${queryError.message}`);
  }

  const run = runs.data?.[0];
  return {
    canRead: true,
    config,
    lastRun: run ? {
      id: String(run.id),
      mode: String(run.mode),
      status: String(run.status),
      triggerSource: String(run.trigger_source ?? "manual"),
      retryOfRunId: run.retry_of_run_id ? String(run.retry_of_run_id) : null,
      startedAt: String(run.started_at),
      completedAt: run.completed_at ? String(run.completed_at) : null,
      heartbeatAt: String(run.heartbeat_at ?? run.started_at),
      sourceCompanies: Number(run.source_company_count ?? 0),
      sourceContacts: Number(run.source_contact_count ?? 0),
      membershipDeactivations: Number(run.membership_deactivation_count ?? 0),
      chapterDeactivations: Number(run.chapter_deactivation_count ?? 0),
      materializedChapters: Number(run.materialized_chapter_count ?? 0),
      matchedProfiles: Number(run.matched_profile_count ?? 0),
      conflicts: Number(run.conflict_count ?? 0),
      failures: Number(run.failure_count ?? 0),
    } : null,
    counts: {
      companies: companies.count ?? 0,
      contacts: contacts.count ?? 0,
      memberships: memberships.count ?? 0,
      pendingCompanies: pendingCompanies.count ?? 0,
      pendingContacts: pendingContacts.count ?? 0,
      pendingMemberships: pendingMemberships.count ?? 0,
      materializedMemberships: materializedMemberships.count ?? 0,
      ignoredMemberships: ignoredMemberships.count ?? 0,
      openFailures: failures.count ?? 0,
    },
    failures: (failures.data ?? []).map((failure: Record<string, unknown>) => ({
      id: String(failure.id),
      objectType: String(failure.object_type),
      externalId: failure.external_id ? String(failure.external_id) : null,
      code: String(failure.error_code),
      message: String(failure.error_message),
      retryCount: Number(failure.retry_count ?? 0),
      createdAt: String(failure.created_at),
    })),
    message: config.enabled
      ? "HubSpot reads and app-owned reconciliation writes are enabled. HubSpot writes and invitations remain off."
      : config.reason,
  };
}

function emptyWorkspace(
  config: ReturnType<typeof getHubSpotReadSyncConfig>,
  message: string,
): AdminHubSpotSyncWorkspace {
  return {
    canRead: false,
    config,
    lastRun: null,
    counts: {
      companies: 0,
      contacts: 0,
      memberships: 0,
      pendingCompanies: 0,
      pendingContacts: 0,
      pendingMemberships: 0,
      materializedMemberships: 0,
      ignoredMemberships: 0,
      openFailures: 0,
    },
    failures: [],
    message,
  };
}
