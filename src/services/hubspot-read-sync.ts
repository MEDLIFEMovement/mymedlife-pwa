import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ACTIVE_CHAPTER_LIFECYCLE_STAGES = ["23878512", "23925576", "23925577"];
const HUBSPOT_API_ROOT = "https://api.hubapi.com";
const HUBSPOT_CONTACT_PROPERTIES = [
  "email",
  "firstname",
  "lastname",
  "graduation_year__c",
  "active_years",
  "eboard__c",
  "eboard_year",
  "contact_position__c",
  "type_of_involvement",
  "qr_year",
  "lastmodifieddate",
] as const;

export type HubSpotSyncMode = "backfill" | "incremental";
export type HubSpotSyncTriggerSource = "manual" | "scheduled" | "replay";

export type HubSpotReadSyncConfig = {
  enabled: boolean;
  environment: "local" | "staging" | "production";
  activeMemberTerms: string[];
  reason: string;
};

export type HubSpotCompanyRecord = {
  id: string;
  name: string;
  domain: string | null;
  lifecycleStage: string | null;
  chapterStatus: string | null;
  region: string | null;
  country: string | null;
  schoolType: string | null;
  updatedAt: string | null;
  source: Record<string, unknown>;
};

export type HubSpotContactRecord = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  graduationYear: number | null;
  activeYears: string[];
  eboard: boolean;
  eboardYears: string[];
  eboardPosition: string | null;
  involvementTypes: string[];
  qrYears: string[];
  updatedAt: string | null;
  companyIds: string[];
  source: Record<string, unknown>;
};

export type HubSpotReadClient = {
  readActiveChapterCompanies: () => Promise<HubSpotCompanyRecord[]>;
  readContactsWithCompanies: (
    modifiedAfter?: string | null,
    activeCompanyIds?: string[],
  ) => Promise<HubSpotContactRecord[]>;
};

export type HubSpotReadSyncResult =
  | {
      success: true;
      code: "hubspot_sync_succeeded" | "hubspot_sync_partial";
      runId: string;
      counts: HubSpotSyncCounts;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code:
        | "sync_disabled"
        | "missing_auth"
        | "permission_denied"
        | "sync_already_running"
        | "server_error";
      runId: string | null;
      plainEnglishMessage: string;
    };

export type HubSpotSyncCounts = {
  sourceCompanies: number;
  sourceContacts: number;
  companyUpserts: number;
  contactUpserts: number;
  membershipUpserts: number;
  membershipDeactivations: number;
  chapterDeactivations: number;
  materializedChapters: number;
  matchedProfiles: number;
  conflicts: number;
  failures: number;
};

type AppClient = SupabaseClient<Record<string, unknown>>;

type HubSpotReadSyncDeps = {
  appClient?: AppClient;
  hubspotClient?: HubSpotReadClient;
  env?: Record<string, string | undefined>;
  now?: () => Date;
  triggerSource?: HubSpotSyncTriggerSource;
  retryOfRunId?: string | null;
};

type HubSpotMembershipQualification = {
  roleKey: "general_member";
  evidenceFields: string[];
  evidenceTerms: string[];
};

type HubSpotObjectRow = {
  id?: string;
  properties?: Record<string, string | null | undefined>;
  updatedAt?: string;
  associations?: {
    companies?: { results?: Array<{ id?: string }> };
  };
};

type HubSpotObjectPage = {
  results?: HubSpotObjectRow[];
  paging?: { next?: { after?: string | number } };
};

type HubSpotAssociationBatchPage = {
  results?: Array<{
    from?: { id?: string };
    to?: Array<{ id?: string }>;
  }>;
};

type HubSpotObjectBatchPage = {
  results?: HubSpotObjectRow[];
};

export function getHubSpotReadSyncConfig(
  env: Record<string, string | undefined> = process.env,
): HubSpotReadSyncConfig {
  const environment = getEnvironment(env);
  const activeMemberTerms = parseDelimitedValues(
    env.MYMEDLIFE_HUBSPOT_ACTIVE_MEMBER_TERMS,
  );

  if (env.MYMEDLIFE_ENABLE_HUBSPOT_READ_SYNC !== "true") {
    return disabled(
      environment,
      "HubSpot read sync is disabled by configuration.",
      activeMemberTerms,
    );
  }
  if (!env.HUBSPOT_ACCESS_TOKEN) {
    return disabled(
      environment,
      "HubSpot read sync is disabled because the server-only access token is missing.",
      activeMemberTerms,
    );
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL)) {
    return disabled(
      environment,
      "HubSpot read sync is disabled because the server-only Supabase client is incomplete.",
      activeMemberTerms,
    );
  }

  const approvalFlag = environment === "production"
    ? env.MYMEDLIFE_ALLOW_PRODUCTION_HUBSPOT_READ_SYNC
    : environment === "staging"
      ? env.MYMEDLIFE_ALLOW_STAGING_HUBSPOT_READ_SYNC
      : env.MYMEDLIFE_ALLOW_LOCAL_HUBSPOT_READ_SYNC;

  if (approvalFlag !== "true") {
    return disabled(
      environment,
      `${capitalize(environment)} HubSpot read sync is disabled until its explicit environment approval flag is enabled.`,
      activeMemberTerms,
    );
  }
  if (activeMemberTerms.length === 0) {
    return disabled(
      environment,
      "HubSpot read sync is disabled until an approved active-member term allowlist is configured.",
      activeMemberTerms,
    );
  }

  return {
    enabled: true,
    environment,
    activeMemberTerms,
    reason: `Server-only HubSpot reads and app-owned general-member reconciliation writes are enabled for ${environment}. HubSpot leader/admin role assignment, HubSpot writes, and account invitations remain disabled.`,
  };
}

export function createHubSpotReadClient(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): HubSpotReadClient | null {
  const config = getHubSpotReadSyncConfig(env);
  const token = env.HUBSPOT_ACCESS_TOKEN;
  if (!config.enabled || !token) return null;

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetchImpl(`${HUBSPOT_API_ROOT}${path}`, {
        ...init,
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          ...init?.headers,
        },
        cache: "no-store",
      });

      if (response.ok) return response.json() as Promise<T>;

      const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "0", 10);
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === 2) {
        throw new Error(`HubSpot request failed (${response.status})${retryAfter > 0 ? `; retry after ${retryAfter}s` : ""}.`);
      }
      await wait(Math.max(retryAfter * 1000, 250 * (attempt + 1)));
    }
    throw new Error("HubSpot request failed after retries.");
  };

  return {
    async readActiveChapterCompanies() {
      const records: HubSpotCompanyRecord[] = [];
      let after: string | number | undefined;
      do {
        const page = await request<HubSpotObjectPage>("/crm/v3/objects/companies/search", {
          method: "POST",
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: "lifecyclestage",
                operator: "IN",
                values: ACTIVE_CHAPTER_LIFECYCLE_STAGES,
              }],
            }],
            properties: [
              "name",
              "domain",
              "chapter_status",
              "lifecyclestage",
              "region__c",
              "school_country",
              "school_type__c",
              "hs_lastmodifieddate",
            ],
            limit: 200,
            after,
            sorts: ["hs_lastmodifieddate"],
          }),
        });
        records.push(...(page.results ?? []).map(mapCompany).filter(isPresent));
        after = page.paging?.next?.after;
      } while (after !== undefined);
      return records;
    },

    async readContactsWithCompanies(modifiedAfter, activeCompanyIds = []) {
      if (modifiedAfter) {
        const checkpoint = Date.parse(modifiedAfter);
        if (!Number.isFinite(checkpoint)) {
          throw new Error("HubSpot incremental sync checkpoint is invalid.");
        }

        const records: HubSpotContactRecord[] = [];
        let after: string | number | undefined;
        do {
          const page = await request<HubSpotObjectPage>("/crm/v3/objects/contacts/search", {
            method: "POST",
            body: JSON.stringify({
              filterGroups: [{
                filters: [{
                  propertyName: "lastmodifieddate",
                  operator: "GT",
                  value: String(checkpoint),
                }],
              }],
              properties: HUBSPOT_CONTACT_PROPERTIES,
              limit: 200,
              after,
              sorts: ["lastmodifieddate"],
            }),
          });
          const rows = page.results ?? [];
          const companyIdsByContact = await readContactCompanyAssociations(rows);
          records.push(...rows.map((row) => mapContact({
            ...row,
            associations: {
              companies: {
                results: (companyIdsByContact.get(row.id ?? "") ?? []).map((id) => ({ id })),
              },
            },
          })).filter(isPresent));
          after = page.paging?.next?.after;
        } while (after !== undefined);
        return records.filter((record) => changedAfter(record.updatedAt, modifiedAfter));
      }

      if (activeCompanyIds.length === 0) return [];

      const companyIdsByContact = await readCompanyContactAssociations(activeCompanyIds);
      const records: HubSpotContactRecord[] = [];
      for (const contactIds of chunk([...companyIdsByContact.keys()], 100)) {
        const page = await request<HubSpotObjectBatchPage>(
          "/crm/v3/objects/contacts/batch/read",
          {
            method: "POST",
            body: JSON.stringify({
              archived: false,
              properties: HUBSPOT_CONTACT_PROPERTIES,
              inputs: contactIds.map((id) => ({ id })),
            }),
          },
        );
        records.push(...(page.results ?? []).map((row) => mapContact({
          ...row,
          associations: {
            companies: {
              results: (companyIdsByContact.get(row.id ?? "") ?? []).map((id) => ({ id })),
            },
          },
        })).filter(isPresent));
      }
      return records;
    },
  };

  async function readCompanyContactAssociations(
    activeCompanyIds: string[],
  ): Promise<Map<string, string[]>> {
    const companyIdsByContact = new Map<string, string[]>();
    for (const companyIds of chunk([...new Set(activeCompanyIds)], 100)) {
      const associations = await request<HubSpotAssociationBatchPage>(
        "/crm/v3/associations/companies/contacts/batch/read",
        {
          method: "POST",
          body: JSON.stringify({ inputs: companyIds.map((id) => ({ id })) }),
        },
      );
      for (const result of associations.results ?? []) {
        const companyId = result.from?.id;
        if (!companyId) continue;
        for (const contact of result.to ?? []) {
          if (!contact.id) continue;
          const existingCompanyIds = companyIdsByContact.get(contact.id) ?? [];
          if (!existingCompanyIds.includes(companyId)) {
            companyIdsByContact.set(contact.id, [...existingCompanyIds, companyId]);
          }
        }
      }
    }
    return companyIdsByContact;
  }

  async function readContactCompanyAssociations(
    rows: HubSpotObjectRow[],
  ): Promise<Map<string, string[]>> {
    const ids = rows.map((row) => row.id).filter((id): id is string => Boolean(id));
    if (ids.length === 0) return new Map();

    const associations = await request<HubSpotAssociationBatchPage>(
      "/crm/v3/associations/contacts/companies/batch/read",
      {
        method: "POST",
        body: JSON.stringify({ inputs: ids.map((id) => ({ id })) }),
      },
    );
    const companyIdsByContact = new Map<string, string[]>();
    for (const result of associations.results ?? []) {
      const contactId = result.from?.id;
      if (!contactId) continue;
      companyIdsByContact.set(
        contactId,
        (result.to ?? []).map((company) => company.id).filter((id): id is string => Boolean(id)),
      );
    }
    return companyIdsByContact;
  }
}

export async function runHubSpotReadSync(
  actorUserId: string | null,
  mode: HubSpotSyncMode,
  deps: HubSpotReadSyncDeps = {},
): Promise<HubSpotReadSyncResult> {
  const env = deps.env ?? process.env;
  const config = getHubSpotReadSyncConfig(env);
  const triggerSource = deps.triggerSource ?? "manual";
  const retryOfRunId = deps.retryOfRunId ?? null;
  const now = deps.now ?? (() => new Date());
  if (!config.enabled) return failure("sync_disabled", config.reason);
  if (triggerSource !== "scheduled" && !actorUserId) {
    return failure("missing_auth", "Sign in with a DS Admin or Super Admin account before running HubSpot sync.");
  }
  if (triggerSource === "replay" && !retryOfRunId) {
    return failure("server_error", "A replay must identify the failed or partial HubSpot sync run being retried.");
  }

  const appClient = deps.appClient ?? createHubSpotSyncAppClient(env);
  const hubspotClient = deps.hubspotClient ?? createHubSpotReadClient(env);
  if (!appClient || !hubspotClient) {
    return failure("sync_disabled", "The server-only HubSpot and Supabase sync clients are not configured.");
  }

  if (actorUserId) {
    const actorRoleResult = await readActorRoles(appClient, actorUserId);
    if (actorRoleResult.error) {
      return failure("server_error", "Could not verify the HubSpot sync administrator role.");
    }
    if (!actorRoleResult.roles.some((role) => role === "ds_admin" || role === "super_admin")) {
      return failure("permission_denied", "Only a DS Admin or Super Admin can run HubSpot sync.");
    }
  }

  const startedAt = now().toISOString();
  const staleBefore = new Date(Date.parse(startedAt) - 30 * 60 * 1000).toISOString();
  const recovered = await appClient.schema("app").from("hubspot_sync_runs").update({
    status: "failed",
    completed_at: startedAt,
    heartbeat_at: startedAt,
    error_summary: "Recovered abandoned HubSpot sync after its heartbeat expired.",
  }).eq("status", "running").lt("heartbeat_at", staleBefore);
  if (recovered.error) return failure("server_error", "Could not recover abandoned HubSpot sync runs.");

  const running = await appClient.schema("app").from("hubspot_sync_runs")
    .select("id")
    .eq("status", "running")
    .limit(1);
  if (running.error) return failure("server_error", "Could not verify the HubSpot sync lock.");
  if ((running.data ?? []).length > 0) {
    return failure("sync_already_running", "A HubSpot sync is already running. Review that run before retrying.");
  }

  const checkpointResult = await readLastCheckpoint(appClient);
  if (checkpointResult.error) {
    return failure("server_error", `Could not read the HubSpot sync checkpoint: ${checkpointResult.error}`);
  }
  const checkpointBefore = checkpointResult.checkpoint;
  const created = await appClient.schema("app").from("hubspot_sync_runs").insert({
    mode,
    status: "running",
    requested_by: actorUserId,
    trigger_source: triggerSource,
    retry_of_run_id: retryOfRunId,
    attempt: triggerSource === "replay" ? 2 : 1,
    checkpoint_before: mode === "incremental" ? checkpointBefore : null,
    started_at: startedAt,
    heartbeat_at: startedAt,
  }).select("id").single();
  const runId = String(created.data?.id ?? "");
  if (created.error || !runId) {
    if (isRunningRunConflict(created.error)) {
      return failure("sync_already_running", "A HubSpot sync is already running. Review that run before retrying.");
    }
    return failure("server_error", "Could not create the app-owned HubSpot sync run.");
  }

  const counts = emptyCounts();
  try {
    const companies = await hubspotClient.readActiveChapterCompanies();
    const activeCompanyIds = new Set(companies.map((company) => company.id));
    const allContacts = await hubspotClient.readContactsWithCompanies(
      mode === "incremental" ? checkpointBefore : null,
      [...activeCompanyIds],
    );
    const contacts = allContacts
      .map((contact) => ({
        ...contact,
        companyIds: contact.companyIds.filter((companyId) => activeCompanyIds.has(companyId)),
      }))
      .filter((contact) => contact.companyIds.length > 0);

    counts.sourceCompanies = companies.length;
    counts.sourceContacts = contacts.length;
    await heartbeatRun(appClient, runId, now().toISOString());

    const chapterIds = new Map<string, string>();
    for (const [index, company] of companies.entries()) {
      await syncCompany(appClient, runId, actorUserId, company, counts, chapterIds);
      if ((index + 1) % 25 === 0) await heartbeatRun(appClient, runId, now().toISOString());
    }
    if (mode === "backfill") {
      await deactivateMissingHubSpotChapters(
        appClient,
        runId,
        actorUserId,
        activeCompanyIds,
        counts,
      );
    }
    await heartbeatRun(appClient, runId, now().toISOString());

    const profileIds = new Map<string, string>();
    for (const [index, contact] of contacts.entries()) {
      await syncContact(appClient, runId, actorUserId, contact, counts, profileIds);
      if ((index + 1) % 25 === 0) await heartbeatRun(appClient, runId, now().toISOString());
    }
    await heartbeatRun(appClient, runId, now().toISOString());

    for (const [index, contact] of contacts.entries()) {
      const qualification = getHubSpotMembershipQualification(contact, config);
      for (const companyId of contact.companyIds) {
        await syncMembership(
          appClient,
          runId,
          actorUserId,
          contact,
          companyId,
          profileIds.get(contact.id) ?? null,
          chapterIds.get(companyId) ?? null,
          qualification,
          counts,
        );
      }
      if ((index + 1) % 25 === 0) await heartbeatRun(appClient, runId, now().toISOString());
    }

    if (mode === "backfill") {
      const activeAssociationKeys = new Set(
        contacts.flatMap((contact) => {
          if (!getHubSpotMembershipQualification(contact, config)) return [];
          return contact.companyIds.map((companyId) => `${contact.id}:${companyId}`);
        }),
      );
      await deactivateMissingHubSpotMemberships(
        appClient,
        runId,
        actorUserId,
        activeAssociationKeys,
        counts,
      );
    }

    const completedAt = now().toISOString();
    const status = counts.failures > 0 || counts.conflicts > 0 ? "partial" : "succeeded";
    if (status === "succeeded" && triggerSource === "replay" && retryOfRunId) {
      await resolveReplayedFailures(appClient, retryOfRunId, completedAt);
    }
    const finalized = await finishRun(
      appClient,
      runId,
      status,
      completedAt,
      status === "succeeded" ? startedAt : null,
      counts,
    );
    if (!finalized) {
      return failure(
        "server_error",
        "HubSpot source data was processed, but the final sync status could not be recorded. The run remains incomplete and must not be treated as successful.",
        runId,
      );
    }
    return {
      success: true,
      code: status === "partial" ? "hubspot_sync_partial" : "hubspot_sync_succeeded",
      runId,
      counts,
      plainEnglishMessage: status === "partial"
        ? "HubSpot read sync completed with reviewable conflicts or failures. No HubSpot writes or invitations were sent."
        : "HubSpot read sync completed and materialized app-owned chapter and membership read models. No HubSpot writes or invitations were sent.",
    };
  } catch (error) {
    counts.failures += 1;
    const message = safeErrorMessage(error);
    const failureDetailsRecorded = await tryRecordFailure(
      appClient,
      runId,
      "run",
      null,
      "hubspot_read_failed",
      message,
      {},
    );
    const errorSummary = failureDetailsRecorded
      ? message
      : `${message} The HubSpot sync failure register could not be updated.`;
    const finalized = await finishRun(appClient, runId, "failed", now().toISOString(), null, counts, errorSummary);
    if (!finalized) {
      return failure(
        "server_error",
        `HubSpot read sync failed safely, but the failed run status could not be recorded: ${errorSummary}`,
        runId,
      );
    }
    return failure("server_error", `HubSpot read sync failed safely: ${errorSummary}`, runId);
  }
}

function createHubSpotSyncAppClient(env: Record<string, string | undefined>): AppClient | null {
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as AppClient;
}

async function readActorRoles(
  client: AppClient,
  actorUserId: string,
): Promise<{ roles: string[]; error: string | null }> {
  const result = await client.schema("app").from("staff_role_assignments")
    .select("role_key")
    .eq("user_id", actorUserId)
    .eq("status", "active");
  if (result.error) return { roles: [], error: result.error.message };
  return {
    roles: (result.data ?? []).map((row) => String(row.role_key)),
    error: null,
  };
}

async function readLastCheckpoint(
  client: AppClient,
): Promise<{ checkpoint: string | null; error: string | null }> {
  const result = await client.schema("app").from("hubspot_sync_runs")
    .select("checkpoint_after")
    .eq("status", "succeeded")
    .order("completed_at", { ascending: false })
    .limit(1);
  if (result.error) {
    return { checkpoint: null, error: result.error.message };
  }
  return {
    checkpoint: String(result.data?.[0]?.checkpoint_after ?? "") || null,
    error: null,
  };
}

async function syncCompany(
  client: AppClient,
  runId: string,
  actorUserId: string | null,
  company: HubSpotCompanyRecord,
  counts: HubSpotSyncCounts,
  chapterIds: Map<string, string>,
) {
  const staged = await client.schema("app").from("hubspot_company_imports").upsert({
    hubspot_company_id: company.id,
    name: company.name,
    domain: company.domain,
    lifecycle_stage: company.lifecycleStage,
    chapter_status: company.chapterStatus,
    region: company.region,
    country: company.country,
    school_type: company.schoolType,
    source_updated_at: company.updatedAt,
    source_payload: company.source,
    reconciliation_status: "pending",
    reconciliation_note: null,
    last_seen_run_id: runId,
    last_imported_at: new Date().toISOString(),
  }, { onConflict: "hubspot_company_id" });
  if (staged.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "company", company.id, "company_stage_failed", staged.error.message, company.source);
    return;
  }
  counts.companyUpserts += 1;

  const existing = await client.schema("app").from("chapters")
    .select("id,name,campus,status,hubspot_company_id")
    .eq("hubspot_company_id", company.id)
    .limit(2);
  if (existing.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "company", company.id, "chapter_lookup_failed", existing.error.message, company.source);
    return;
  }

  let chapterId = existing.data?.[0]?.id ? String(existing.data[0].id) : null;
  let existingStatus = existing.data?.[0]?.status ? String(existing.data[0].status) : null;
  if (!chapterId) {
    const nameMatches = await client.schema("app").from("chapters")
      .select("id,status,hubspot_company_id")
      .ilike("name", company.name)
      .limit(2);
    if (nameMatches.error) {
      counts.failures += 1;
      await recordFailure(
        client,
        runId,
        "company",
        company.id,
        "chapter_name_lookup_failed",
        nameMatches.error.message,
        company.source,
      );
      return;
    }
    const matches = nameMatches.data ?? [];
    if (matches.length > 1 || (matches[0]?.hubspot_company_id && matches[0].hubspot_company_id !== company.id)) {
      counts.conflicts += 1;
      await markCompanyReconciliation(client, company.id, "conflict", "Multiple or externally linked app chapters match this HubSpot company.", null);
      return;
    }

    if (matches[0]?.id) {
      chapterId = String(matches[0].id);
      existingStatus = matches[0].status ? String(matches[0].status) : null;
      const linked = await client.schema("app").from("chapters").update({
        hubspot_company_id: company.id,
        name: company.name,
        campus: company.name,
        region: company.region,
        country: company.country,
        chapter_type: mapChapterType(company.schoolType),
        ...(existingStatus === "inactive" ? { status: "active" } : {}),
      }).eq("id", chapterId);
      if (linked.error) chapterId = null;
    } else {
      const inserted = await client.schema("app").from("chapters").insert({
        name: company.name,
        campus: company.name,
        region: company.region,
        country: company.country,
        chapter_type: mapChapterType(company.schoolType),
        hubspot_company_id: company.id,
        status: "active",
        is_test: false,
        created_by: actorUserId,
      }).select("id").single();
      chapterId = inserted.error ? null : String(inserted.data?.id ?? "") || null;
      if (chapterId) counts.materializedChapters += 1;
    }
  }

  if (!chapterId) {
    counts.failures += 1;
    await recordFailure(client, runId, "company", company.id, "chapter_materialization_failed", "The app chapter could not be linked or created.", company.source);
    return;
  }

  if (existing.data?.[0]?.id) {
    const refreshed = await client.schema("app").from("chapters").update({
      name: company.name,
      campus: company.name,
      region: company.region,
      country: company.country,
      chapter_type: mapChapterType(company.schoolType),
      ...(existingStatus === "inactive" ? { status: "active" } : {}),
    }).eq("id", chapterId).eq("hubspot_company_id", company.id);
    if (refreshed.error) {
      counts.failures += 1;
      await recordFailure(client, runId, "company", company.id, "chapter_refresh_failed", refreshed.error.message, company.source);
      return;
    }
  }

  chapterIds.set(company.id, chapterId);
  await markCompanyReconciliation(client, company.id, "materialized", null, chapterId);
  if (existingStatus === "inactive") {
    await recordAudit(client, runId, actorUserId, chapterId, "hubspot_chapter_reactivated", "chapters", chapterId, {
      hubspot_company_id: company.id,
      status: "active",
    }, counts);
  }
  await recordAudit(client, runId, actorUserId, chapterId, "hubspot_chapter_materialized", "chapters", chapterId, {
    hubspot_company_id: company.id,
    name: company.name,
  }, counts);
}

async function deactivateMissingHubSpotChapters(
  client: AppClient,
  runId: string,
  actorUserId: string | null,
  activeCompanyIds: Set<string>,
  counts: HubSpotSyncCounts,
) {
  const linked = await client.schema("app").from("chapters")
    .select("id,status,hubspot_company_id")
    .not("hubspot_company_id", "is", null);
  if (linked.error) {
    counts.failures += 1;
    await recordFailure(
      client,
      runId,
      "run",
      null,
      "chapter_reconciliation_lookup_failed",
      linked.error.message,
      {},
    );
    return;
  }

  for (const row of linked.data ?? []) {
    const companyId = String(row.hubspot_company_id ?? "");
    if (!companyId || activeCompanyIds.has(companyId) || row.status !== "active") {
      continue;
    }

    const chapterId = String(row.id);
    const deactivated = await client.schema("app").from("chapters").update({
      status: "inactive",
    }).eq("id", chapterId).eq("hubspot_company_id", companyId).eq("status", "active");
    if (deactivated.error) {
      counts.failures += 1;
      await recordFailure(
        client,
        runId,
        "company",
        companyId,
        "chapter_deactivation_failed",
        deactivated.error.message,
        { companyId, chapterId },
      );
      continue;
    }

    await markCompanyReconciliation(
      client,
      companyId,
      "ignored",
      "The HubSpot company was absent from the latest complete active-chapter backfill, so the app chapter was deactivated.",
      chapterId,
    );
    counts.chapterDeactivations += 1;
    await recordAudit(
      client,
      runId,
      actorUserId,
      chapterId,
      "hubspot_chapter_deactivated",
      "chapters",
      chapterId,
      { hubspot_company_id: companyId, status: "inactive" },
      counts,
    );
  }
}

async function syncContact(
  client: AppClient,
  runId: string,
  actorUserId: string | null,
  contact: HubSpotContactRecord,
  counts: HubSpotSyncCounts,
  profileIds: Map<string, string>,
) {
  const email = normalizeEmail(contact.email);
  const staged = await client.schema("app").from("hubspot_contact_imports").upsert({
    hubspot_contact_id: contact.id,
    email,
    first_name: contact.firstName,
    last_name: contact.lastName,
    graduation_year: contact.graduationYear,
    source_updated_at: contact.updatedAt,
    source_payload: contact.source,
    reconciliation_status: email ? "pending" : "missing_email",
    reconciliation_note: email ? null : "HubSpot contact has no usable email, so no Auth profile can be matched.",
    last_seen_run_id: runId,
    last_imported_at: new Date().toISOString(),
  }, { onConflict: "hubspot_contact_id" });
  if (staged.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "contact", contact.id, "contact_stage_failed", staged.error.message, contact.source);
    return;
  }
  counts.contactUpserts += 1;

  const linkedProfiles = await client.schema("app").from("profiles")
    .select("id,hubspot_contact_id,display_name,email")
    .eq("hubspot_contact_id", contact.id)
    .limit(2);
  if (linkedProfiles.error) {
    counts.failures += 1;
    await recordFailure(
      client,
      runId,
      "contact",
      contact.id,
      "profile_link_lookup_failed",
      linkedProfiles.error.message,
      contact.source,
    );
    return;
  }
  let matches = linkedProfiles.data ?? [];
  if (matches.length === 0) {
    if (!email) return;
    const emailProfiles = await client.schema("app").from("profiles")
      .select("id,hubspot_contact_id,display_name,email")
      .ilike("email", email)
      .limit(2);
    if (emailProfiles.error) {
      counts.failures += 1;
      await recordFailure(client, runId, "contact", contact.id, "profile_lookup_failed", emailProfiles.error.message, contact.source);
      return;
    }
    matches = emailProfiles.data ?? [];
  }
  if (matches.length === 0) return;
  if (matches.length > 1 || (matches[0]?.hubspot_contact_id && matches[0].hubspot_contact_id !== contact.id)) {
    counts.conflicts += 1;
    await markContactReconciliation(client, contact.id, "conflict", "Multiple or externally linked app profiles match this HubSpot contact.", null);
    return;
  }

  const profileId = String(matches[0].id);
  const displayName = buildHubSpotDisplayName(contact);
  const profileUpdate: Record<string, string> = {
    hubspot_contact_id: contact.id,
  };
  if (displayName) profileUpdate.display_name = displayName;
  if (email) profileUpdate.email = email;

  const linked = await client.schema("app").from("profiles").update(profileUpdate).eq("id", profileId);
  if (linked.error) {
    counts.failures += 1;
    await recordFailure(
      client,
      runId,
      "contact",
      contact.id,
      "profile_materialization_failed",
      linked.error.message,
      contact.source,
    );
    return;
  }
  profileIds.set(contact.id, profileId);
  counts.matchedProfiles += 1;
  await markContactReconciliation(client, contact.id, "matched", null, profileId);
  await recordAudit(client, runId, actorUserId, null, "hubspot_profile_materialized", "profiles", profileId, {
    hubspot_contact_id: contact.id,
    display_name: displayName,
    email,
    source_updated_at: contact.updatedAt,
  }, counts);
}

async function syncMembership(
  client: AppClient,
  runId: string,
  actorUserId: string | null,
  contact: HubSpotContactRecord,
  companyId: string,
  profileId: string | null,
  chapterId: string | null,
  qualification: HubSpotMembershipQualification | null,
  counts: HubSpotSyncCounts,
) {
  const associationKey = `${contact.id}:${companyId}`;
  const staged = await client.schema("app").from("hubspot_membership_imports").upsert({
    hubspot_contact_id: contact.id,
    hubspot_company_id: companyId,
    role_key: qualification?.roleKey ?? "general_member",
    source_updated_at: contact.updatedAt,
    source_payload: {
      associationKey,
      activeYears: contact.activeYears,
      eboard: contact.eboard,
      eboardYears: contact.eboardYears,
      eboardPosition: contact.eboardPosition,
      involvementTypes: contact.involvementTypes,
      qrYears: contact.qrYears,
      qualification,
    },
    reconciliation_status: qualification
      ? profileId && chapterId ? "pending" : "waiting_for_match"
      : "ignored",
    reconciliation_note: qualification
      ? profileId && chapterId ? null : "Waiting for both an app profile and app chapter match."
      : "The contact-company association does not match the configured current member or leader terms, so it cannot grant app access.",
    last_seen_run_id: runId,
    last_imported_at: new Date().toISOString(),
  }, { onConflict: "hubspot_contact_id,hubspot_company_id" });
  if (staged.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "membership", associationKey, "membership_stage_failed", staged.error.message, { associationKey });
    return;
  }
  counts.membershipUpserts += 1;
  if (!qualification) {
    await deactivateIneligibleHubSpotMembership(
      client,
      runId,
      actorUserId,
      associationKey,
      companyId,
      counts,
    );
    return;
  }
  if (!profileId || !chapterId) return;

  const memberships = await client.schema("app").from("memberships")
    .select("id,status,hubspot_association_key")
    .eq("user_id", profileId)
    .eq("chapter_id", chapterId)
    .limit(2);
  if (memberships.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "membership", associationKey, "membership_lookup_failed", memberships.error.message, { associationKey });
    return;
  }
  if ((memberships.data ?? []).length > 1) {
    counts.conflicts += 1;
    await markMembershipReconciliation(
      client,
      contact.id,
      companyId,
      "conflict",
      "Multiple app memberships match this HubSpot association.",
      null,
    );
    return;
  }

  let membershipId = memberships.data?.[0]?.id ? String(memberships.data[0].id) : null;
  if (membershipId) {
    const existingKey = memberships.data?.[0]?.hubspot_association_key;
    if (existingKey && existingKey !== associationKey) {
      counts.conflicts += 1;
      await markMembershipReconciliation(client, contact.id, companyId, "conflict", "The existing app membership is linked to a different HubSpot association.", null);
      return;
    }
    const linked = await client.schema("app").from("memberships").update({
      hubspot_association_key: associationKey,
      role_key: qualification.roleKey,
      role_term_label: qualification.evidenceTerms.join(", "),
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: actorUserId,
    }).eq("id", membershipId);
    if (linked.error) membershipId = null;
  } else {
    const inserted = await client.schema("app").from("memberships").insert({
      user_id: profileId,
      chapter_id: chapterId,
      role_key: qualification.roleKey,
      role_term_label: qualification.evidenceTerms.join(", "),
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: actorUserId,
      hubspot_association_key: associationKey,
    }).select("id").single();
    membershipId = inserted.error ? null : String(inserted.data?.id ?? "") || null;
  }

  if (!membershipId) {
    counts.failures += 1;
    await recordFailure(client, runId, "membership", associationKey, "membership_materialization_failed", "The app membership could not be linked or created.", { associationKey });
    return;
  }
  await markMembershipReconciliation(client, contact.id, companyId, "materialized", null, membershipId);
  await recordAudit(client, runId, actorUserId, chapterId, "hubspot_membership_materialized", "memberships", membershipId, {
    hubspot_association_key: associationKey,
    role_key: qualification.roleKey,
    source_terms: qualification.evidenceTerms,
    status: "approved",
  }, counts);
}

async function deactivateIneligibleHubSpotMembership(
  client: AppClient,
  runId: string,
  actorUserId: string | null,
  associationKey: string,
  companyId: string,
  counts: HubSpotSyncCounts,
) {
  const existing = await client.schema("app").from("memberships")
    .select("id,chapter_id,status")
    .eq("hubspot_association_key", associationKey)
    .limit(2);
  if (existing.error) {
    counts.failures += 1;
    await recordFailure(
      client,
      runId,
      "membership",
      associationKey,
      "membership_eligibility_lookup_failed",
      existing.error.message,
      { associationKey },
    );
    return;
  }
  if ((existing.data ?? []).length > 1) {
    counts.conflicts += 1;
    await markMembershipReconciliation(
      client,
      associationKey.split(":", 1)[0] ?? "",
      companyId,
      "conflict",
      "Multiple app memberships use this HubSpot association key.",
      null,
    );
    return;
  }
  const membership = existing.data?.[0];
  if (!membership?.id || membership.status === "inactive") return;

  const membershipId = String(membership.id);
  const deactivated = await client.schema("app").from("memberships").update({
    status: "inactive",
  }).eq("id", membershipId).eq("hubspot_association_key", associationKey);
  if (deactivated.error) {
    counts.failures += 1;
    await recordFailure(
      client,
      runId,
      "membership",
      associationKey,
      "membership_ineligible_deactivation_failed",
      deactivated.error.message,
      { associationKey, membershipId },
    );
    return;
  }

  counts.membershipDeactivations += 1;
  await recordAudit(
    client,
    runId,
    actorUserId,
    membership.chapter_id ? String(membership.chapter_id) : null,
    "hubspot_membership_deactivated",
    "memberships",
    membershipId,
    {
      hubspot_association_key: associationKey,
      status: "inactive",
      reason: "outside_configured_active_terms",
    },
    counts,
  );
}

async function deactivateMissingHubSpotMemberships(
  client: AppClient,
  runId: string,
  actorUserId: string | null,
  activeAssociationKeys: Set<string>,
  counts: HubSpotSyncCounts,
) {
  const linked = await client.schema("app").from("memberships")
    .select("id,chapter_id,status,hubspot_association_key")
    .not("hubspot_association_key", "is", null);
  if (linked.error) {
    counts.failures += 1;
    await recordFailure(
      client,
      runId,
      "run",
      null,
      "membership_reconciliation_lookup_failed",
      linked.error.message,
      {},
    );
    return;
  }

  for (const row of linked.data ?? []) {
    const associationKey = String(row.hubspot_association_key ?? "");
    if (!associationKey || activeAssociationKeys.has(associationKey) || row.status === "inactive") {
      continue;
    }

    const membershipId = String(row.id);
    const deactivated = await client.schema("app").from("memberships").update({
      status: "inactive",
    }).eq("id", membershipId).eq("hubspot_association_key", associationKey);
    if (deactivated.error) {
      counts.failures += 1;
      await recordFailure(
        client,
        runId,
        "membership",
        associationKey,
        "membership_deactivation_failed",
        deactivated.error.message,
        { associationKey, membershipId },
      );
      continue;
    }

    const [contactId, companyId] = associationKey.split(":", 2);
    if (contactId && companyId) {
      await markMembershipReconciliation(
        client,
        contactId,
        companyId,
        "ignored",
        "The HubSpot association was absent from the latest complete backfill, so app access was deactivated.",
        membershipId,
      );
    }
    counts.membershipDeactivations += 1;
    await recordAudit(
      client,
      runId,
      actorUserId,
      row.chapter_id ? String(row.chapter_id) : null,
      "hubspot_membership_deactivated",
      "memberships",
      membershipId,
      { hubspot_association_key: associationKey, status: "inactive" },
      counts,
    );
  }
}

async function recordAudit(
  client: AppClient,
  runId: string,
  actorUserId: string | null,
  chapterId: string | null,
  action: string,
  targetTable: string,
  targetId: string,
  afterValue: Record<string, unknown>,
  counts: HubSpotSyncCounts,
) {
  const audit = await client.schema("app").from("audit_logs").insert({
    actor_user_id: actorUserId,
    chapter_id: chapterId,
    action,
    target_table: targetTable,
    target_id: targetId,
    after_value: { ...afterValue, hubspot_sync_run_id: runId },
    reason: "Authorized HubSpot read sync materialization into app-owned records.",
  });
  if (audit.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "run", targetId, "audit_log_failed", audit.error.message, {
      action,
      targetTable,
    });
  }
}

async function markCompanyReconciliation(client: AppClient, id: string, status: string, note: string | null, chapterId: string | null) {
  const result = await client.schema("app").from("hubspot_company_imports").update({
    reconciliation_status: status,
    reconciliation_note: note,
    materialized_chapter_id: chapterId,
  }).eq("hubspot_company_id", id);
  if (result.error) {
    throw new Error("HubSpot company reconciliation status could not be recorded.");
  }
}

async function markContactReconciliation(client: AppClient, id: string, status: string, note: string | null, profileId: string | null) {
  const result = await client.schema("app").from("hubspot_contact_imports").update({
    reconciliation_status: status,
    reconciliation_note: note,
    matched_profile_id: profileId,
  }).eq("hubspot_contact_id", id);
  if (result.error) {
    throw new Error("HubSpot contact reconciliation status could not be recorded.");
  }
}

async function markMembershipReconciliation(client: AppClient, contactId: string, companyId: string, status: string, note: string | null, membershipId: string | null) {
  const result = await client.schema("app").from("hubspot_membership_imports").update({
    reconciliation_status: status,
    reconciliation_note: note,
    materialized_membership_id: membershipId,
  }).eq("hubspot_contact_id", contactId).eq("hubspot_company_id", companyId);
  if (result.error) {
    throw new Error("HubSpot membership reconciliation status could not be recorded.");
  }
}

async function recordFailure(
  client: AppClient,
  runId: string,
  objectType: "company" | "contact" | "membership" | "run",
  externalId: string | null,
  errorCode: string,
  errorMessage: string,
  sourcePayload: Record<string, unknown>,
) {
  const result = await client.schema("app").from("hubspot_sync_failures").insert({
    run_id: runId,
    object_type: objectType,
    external_id: externalId,
    error_code: errorCode,
    error_message: errorMessage,
    source_payload: sourcePayload,
  });
  if (result.error) {
    throw new Error("The HubSpot sync failure register could not be updated.");
  }
}

async function tryRecordFailure(
  client: AppClient,
  runId: string,
  objectType: "company" | "contact" | "membership" | "run",
  externalId: string | null,
  errorCode: string,
  errorMessage: string,
  sourcePayload: Record<string, unknown>,
): Promise<boolean> {
  try {
    await recordFailure(client, runId, objectType, externalId, errorCode, errorMessage, sourcePayload);
    return true;
  } catch {
    return false;
  }
}

async function finishRun(
  client: AppClient,
  runId: string,
  status: "succeeded" | "partial" | "failed",
  completedAt: string,
  checkpointAfter: string | null,
  counts: HubSpotSyncCounts,
  errorSummary: string | null = null,
): Promise<boolean> {
  const result = await client.schema("app").from("hubspot_sync_runs").update({
    status,
    completed_at: completedAt,
    checkpoint_after: checkpointAfter,
    source_company_count: counts.sourceCompanies,
    source_contact_count: counts.sourceContacts,
    company_upsert_count: counts.companyUpserts,
    contact_upsert_count: counts.contactUpserts,
    membership_upsert_count: counts.membershipUpserts,
    membership_deactivation_count: counts.membershipDeactivations,
    chapter_deactivation_count: counts.chapterDeactivations,
    materialized_chapter_count: counts.materializedChapters,
    matched_profile_count: counts.matchedProfiles,
    conflict_count: counts.conflicts,
    failure_count: counts.failures,
    error_summary: errorSummary,
  }).eq("id", runId);
  return !result.error;
}

async function heartbeatRun(client: AppClient, runId: string, heartbeatAt: string) {
  const result = await client.schema("app").from("hubspot_sync_runs").update({
    heartbeat_at: heartbeatAt,
  }).eq("id", runId).eq("status", "running");
  if (result.error) {
    throw new Error("The HubSpot sync heartbeat could not be recorded.");
  }
}

async function resolveReplayedFailures(client: AppClient, retryOfRunId: string, resolvedAt: string) {
  const result = await client.schema("app").from("hubspot_sync_failures").update({
    resolved_at: resolvedAt,
  }).eq("run_id", retryOfRunId).is("resolved_at", null);
  if (result.error) {
    throw new Error("The replayed HubSpot failures could not be marked resolved.");
  }
}

export function mapChapterType(schoolType: string | null): "high_school" | "college_university" | "needs_review" {
  const normalized = (schoolType ?? "").trim().toLowerCase();
  if (normalized.includes("high school") || normalized.includes("secondary")) return "high_school";
  if (normalized.includes("university") || normalized.includes("college") || normalized.includes("cgep")) return "college_university";
  return "needs_review";
}

export function getHubSpotMembershipQualification(
  contact: HubSpotContactRecord,
  config: Pick<HubSpotReadSyncConfig, "activeMemberTerms">,
): HubSpotMembershipQualification | null {
  const activeYearTerms = matchingTerms(contact.activeYears, config.activeMemberTerms);
  const qrYearTerms = matchingTerms(contact.qrYears, config.activeMemberTerms);
  const memberTerms = [...new Set([...activeYearTerms, ...qrYearTerms])];
  if (memberTerms.length === 0) return null;
  return {
    roleKey: "general_member",
    evidenceFields: [
      ...(activeYearTerms.length > 0 ? ["active_years"] : []),
      ...(qrYearTerms.length > 0 ? ["qr_year"] : []),
    ],
    evidenceTerms: memberTerms,
  };
}

function mapCompany(row: HubSpotObjectRow): HubSpotCompanyRecord | null {
  const properties = row.properties ?? {};
  const name = properties.name?.trim();
  if (!row?.id || !name) return null;
  return {
    id: row.id,
    name,
    domain: optional(properties.domain),
    lifecycleStage: optional(properties.lifecyclestage),
    chapterStatus: optional(properties.chapter_status),
    region: optional(properties.region__c),
    country: optional(properties.school_country),
    schoolType: optional(properties.school_type__c),
    updatedAt: optional(properties.hs_lastmodifieddate) ?? row.updatedAt ?? null,
    source: { id: row.id, properties },
  };
}

function mapContact(row: HubSpotObjectRow): HubSpotContactRecord | null {
  if (!row?.id) return null;
  const properties = row.properties ?? {};
  return {
    id: row.id,
    email: optional(properties.email),
    firstName: optional(properties.firstname),
    lastName: optional(properties.lastname),
    graduationYear: parseGraduationYear(properties.graduation_year__c),
    activeYears: parseDelimitedValues(properties.active_years),
    eboard: properties.eboard__c === "true",
    eboardYears: parseDelimitedValues(properties.eboard_year),
    eboardPosition: optional(properties.contact_position__c),
    involvementTypes: parseDelimitedValues(properties.type_of_involvement),
    qrYears: parseDelimitedValues(properties.qr_year),
    updatedAt: optional(properties.lastmodifieddate)
      ?? optional(properties.hs_lastmodifieddate)
      ?? row.updatedAt
      ?? null,
    companyIds: (row.associations?.companies?.results ?? [])
      .map((association) => association.id)
      .filter((id): id is string => Boolean(id)),
    source: { id: row.id, properties },
  };
}

function parseGraduationYear(value: string | null | undefined): number | null {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2200 ? parsed : null;
}

function normalizeEmail(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.includes("@") ? normalized : null;
}

function buildHubSpotDisplayName(contact: HubSpotContactRecord): string | null {
  const displayName = [contact.firstName, contact.lastName]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  return displayName || null;
}

function optional(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function parseDelimitedValues(value: string | null | undefined): string[] {
  return [...new Set((value ?? "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean))];
}

function matchingTerms(sourceTerms: string[], approvedTerms: string[]): string[] {
  const approved = new Set(approvedTerms.map((term) => term.toLowerCase()));
  return sourceTerms.filter((term) => approved.has(term.toLowerCase()));
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function changedAfter(updatedAt: string | null, modifiedAfter?: string | null) {
  if (!modifiedAfter) return true;
  if (!updatedAt) return false;
  const updatedTime = Date.parse(updatedAt);
  const checkpointTime = Date.parse(modifiedAfter);
  return Number.isFinite(updatedTime) && Number.isFinite(checkpointTime) && updatedTime > checkpointTime;
}

function getEnvironment(env: Record<string, string | undefined>): HubSpotReadSyncConfig["environment"] {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") return "production";
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") return "staging";
  return "local";
}

function disabled(
  environment: HubSpotReadSyncConfig["environment"],
  reason: string,
  activeMemberTerms: string[] = [],
): HubSpotReadSyncConfig {
  return { enabled: false, environment, activeMemberTerms, reason };
}

function capitalize(value: string) {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : "Unknown server error.";
}

function isRunningRunConflict(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "23505"
    || message.includes("hubspot_sync_runs_one_running")
    || message.includes("duplicate key")
    || message.includes("unique constraint");
}

function emptyCounts(): HubSpotSyncCounts {
  return {
    sourceCompanies: 0,
    sourceContacts: 0,
    companyUpserts: 0,
    contactUpserts: 0,
    membershipUpserts: 0,
    membershipDeactivations: 0,
    chapterDeactivations: 0,
    materializedChapters: 0,
    matchedProfiles: 0,
    conflicts: 0,
    failures: 0,
  };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function failure(
  code: Extract<HubSpotReadSyncResult, { success: false }>["code"],
  plainEnglishMessage: string,
  runId: string | null = null,
): HubSpotReadSyncResult {
  return { success: false, code, runId, plainEnglishMessage };
}
