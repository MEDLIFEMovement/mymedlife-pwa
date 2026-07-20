import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ACTIVE_CHAPTER_LIFECYCLE_STAGES = ["23878512", "23925576", "23925577"];
const HUBSPOT_API_ROOT = "https://api.hubapi.com";

export type HubSpotSyncMode = "backfill" | "incremental";
export type HubSpotSyncTriggerSource = "manual" | "scheduled" | "replay";

export type HubSpotReadSyncConfig = {
  enabled: boolean;
  environment: "local" | "staging" | "production";
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
  updatedAt: string | null;
  companyIds: string[];
  source: Record<string, unknown>;
};

export type HubSpotReadClient = {
  readActiveChapterCompanies: () => Promise<HubSpotCompanyRecord[]>;
  readContactsWithCompanies: (modifiedAfter?: string | null) => Promise<HubSpotContactRecord[]>;
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

export function getHubSpotReadSyncConfig(
  env: Record<string, string | undefined> = process.env,
): HubSpotReadSyncConfig {
  const environment = getEnvironment(env);

  if (env.MYMEDLIFE_ENABLE_HUBSPOT_READ_SYNC !== "true") {
    return disabled(environment, "HubSpot read sync is disabled by configuration.");
  }
  if (!env.HUBSPOT_ACCESS_TOKEN) {
    return disabled(environment, "HubSpot read sync is disabled because the server-only access token is missing.");
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL)) {
    return disabled(environment, "HubSpot read sync is disabled because the server-only Supabase client is incomplete.");
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
    );
  }

  return {
    enabled: true,
    environment,
    reason: `Server-only HubSpot reads and app-owned reconciliation writes are enabled for ${environment}. HubSpot writes and account invitations remain disabled.`,
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

    async readContactsWithCompanies(modifiedAfter) {
      const records: HubSpotContactRecord[] = [];
      let after: string | number | undefined;
      do {
        const params = new URLSearchParams({
          limit: "100",
          archived: "false",
          properties: [
            "email",
            "firstname",
            "lastname",
            "graduation_year__c",
            "hs_lastmodifieddate",
          ].join(","),
          associations: "companies",
        });
        if (after !== undefined) params.set("after", String(after));
        const page = await request<HubSpotObjectPage>(`/crm/v3/objects/contacts?${params}`);
        records.push(...(page.results ?? []).map(mapContact).filter(isPresent));
        after = page.paging?.next?.after;
      } while (after !== undefined);
      return records.filter((record) => changedAfter(record.updatedAt, modifiedAfter));
    },
  };
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
    const actorRoles = await readActorRoles(appClient, actorUserId);
    if (!actorRoles.some((role) => role === "ds_admin" || role === "super_admin")) {
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

  const checkpointBefore = await readLastCheckpoint(appClient);
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
    const [companies, allContacts] = await Promise.all([
      hubspotClient.readActiveChapterCompanies(),
      hubspotClient.readContactsWithCompanies(mode === "incremental" ? checkpointBefore : null),
    ]);
    const activeCompanyIds = new Set(companies.map((company) => company.id));
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
    await heartbeatRun(appClient, runId, now().toISOString());

    const profileIds = new Map<string, string>();
    for (const [index, contact] of contacts.entries()) {
      await syncContact(appClient, runId, actorUserId, contact, counts, profileIds);
      if ((index + 1) % 25 === 0) await heartbeatRun(appClient, runId, now().toISOString());
    }
    await heartbeatRun(appClient, runId, now().toISOString());

    for (const [index, contact] of contacts.entries()) {
      for (const companyId of contact.companyIds) {
        await syncMembership(
          appClient,
          runId,
          actorUserId,
          contact,
          companyId,
          profileIds.get(contact.id) ?? null,
          chapterIds.get(companyId) ?? null,
          counts,
        );
      }
      if ((index + 1) % 25 === 0) await heartbeatRun(appClient, runId, now().toISOString());
    }

    const completedAt = now().toISOString();
    const status = counts.failures > 0 || counts.conflicts > 0 ? "partial" : "succeeded";
    await finishRun(appClient, runId, status, completedAt, counts);
    if (status === "succeeded" && triggerSource === "replay" && retryOfRunId) {
      await resolveReplayedFailures(appClient, retryOfRunId, completedAt);
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
    await recordFailure(appClient, runId, "run", null, "hubspot_read_failed", message, {});
    await finishRun(appClient, runId, "failed", now().toISOString(), counts, message);
    return failure("server_error", `HubSpot read sync failed safely: ${message}`, runId);
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

async function readActorRoles(client: AppClient, actorUserId: string): Promise<string[]> {
  const result = await client.schema("app").from("staff_role_assignments")
    .select("role_key")
    .eq("user_id", actorUserId)
    .eq("status", "active");
  if (result.error) return [];
  return (result.data ?? []).map((row) => String(row.role_key));
}

async function readLastCheckpoint(client: AppClient): Promise<string | null> {
  const result = await client.schema("app").from("hubspot_sync_runs")
    .select("checkpoint_after")
    .eq("status", "succeeded")
    .order("completed_at", { ascending: false })
    .limit(1);
  return result.error ? null : String(result.data?.[0]?.checkpoint_after ?? "") || null;
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
    .select("id,name,campus,hubspot_company_id")
    .eq("hubspot_company_id", company.id)
    .limit(2);
  if (existing.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "company", company.id, "chapter_lookup_failed", existing.error.message, company.source);
    return;
  }

  let chapterId = existing.data?.[0]?.id ? String(existing.data[0].id) : null;
  if (!chapterId) {
    const nameMatches = await client.schema("app").from("chapters")
      .select("id,hubspot_company_id")
      .ilike("name", company.name)
      .limit(2);
    const matches = nameMatches.error ? [] : nameMatches.data ?? [];
    if (matches.length > 1 || (matches[0]?.hubspot_company_id && matches[0].hubspot_company_id !== company.id)) {
      counts.conflicts += 1;
      await markCompanyReconciliation(client, company.id, "conflict", "Multiple or externally linked app chapters match this HubSpot company.", null);
      return;
    }

    if (matches[0]?.id) {
      chapterId = String(matches[0].id);
      const linked = await client.schema("app").from("chapters").update({
        hubspot_company_id: company.id,
        region: company.region,
        country: company.country,
        chapter_type: mapChapterType(company.schoolType),
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

  chapterIds.set(company.id, chapterId);
  await markCompanyReconciliation(client, company.id, "materialized", null, chapterId);
  await recordAudit(client, runId, actorUserId, chapterId, "hubspot_chapter_materialized", "chapters", chapterId, {
    hubspot_company_id: company.id,
    name: company.name,
  }, counts);
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
  if (!email) return;

  const profiles = await client.schema("app").from("profiles")
    .select("id,hubspot_contact_id")
    .ilike("email", email)
    .limit(2);
  const matches = profiles.error ? [] : profiles.data ?? [];
  if (profiles.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "contact", contact.id, "profile_lookup_failed", profiles.error.message, contact.source);
    return;
  }
  if (matches.length === 0) return;
  if (matches.length > 1 || (matches[0]?.hubspot_contact_id && matches[0].hubspot_contact_id !== contact.id)) {
    counts.conflicts += 1;
    await markContactReconciliation(client, contact.id, "conflict", "Multiple or externally linked app profiles match this HubSpot contact.", null);
    return;
  }

  const profileId = String(matches[0].id);
  const linked = await client.schema("app").from("profiles").update({
    hubspot_contact_id: contact.id,
  }).eq("id", profileId);
  if (linked.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "contact", contact.id, "profile_link_failed", linked.error.message, contact.source);
    return;
  }
  profileIds.set(contact.id, profileId);
  counts.matchedProfiles += 1;
  await markContactReconciliation(client, contact.id, "matched", null, profileId);
  await recordAudit(client, runId, actorUserId, null, "hubspot_profile_linked", "profiles", profileId, {
    hubspot_contact_id: contact.id,
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
  counts: HubSpotSyncCounts,
) {
  const associationKey = `${contact.id}:${companyId}`;
  const staged = await client.schema("app").from("hubspot_membership_imports").upsert({
    hubspot_contact_id: contact.id,
    hubspot_company_id: companyId,
    role_key: "general_member",
    source_updated_at: contact.updatedAt,
    source_payload: { associationKey },
    reconciliation_status: profileId && chapterId ? "pending" : "waiting_for_match",
    reconciliation_note: profileId && chapterId ? null : "Waiting for both an app profile and app chapter match.",
    last_seen_run_id: runId,
    last_imported_at: new Date().toISOString(),
  }, { onConflict: "hubspot_contact_id,hubspot_company_id" });
  if (staged.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "membership", associationKey, "membership_stage_failed", staged.error.message, { associationKey });
    return;
  }
  counts.membershipUpserts += 1;
  if (!profileId || !chapterId) return;

  const memberships = await client.schema("app").from("memberships")
    .select("id,hubspot_association_key")
    .eq("user_id", profileId)
    .eq("chapter_id", chapterId)
    .eq("status", "approved")
    .limit(2);
  if (memberships.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "membership", associationKey, "membership_lookup_failed", memberships.error.message, { associationKey });
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
    }).eq("id", membershipId);
    if (linked.error) membershipId = null;
  } else {
    const inserted = await client.schema("app").from("memberships").insert({
      user_id: profileId,
      chapter_id: chapterId,
      role_key: "general_member",
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
    status: "approved",
  }, counts);
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
  await client.schema("app").from("hubspot_company_imports").update({
    reconciliation_status: status,
    reconciliation_note: note,
    materialized_chapter_id: chapterId,
  }).eq("hubspot_company_id", id);
}

async function markContactReconciliation(client: AppClient, id: string, status: string, note: string | null, profileId: string | null) {
  await client.schema("app").from("hubspot_contact_imports").update({
    reconciliation_status: status,
    reconciliation_note: note,
    matched_profile_id: profileId,
  }).eq("hubspot_contact_id", id);
}

async function markMembershipReconciliation(client: AppClient, contactId: string, companyId: string, status: string, note: string | null, membershipId: string | null) {
  await client.schema("app").from("hubspot_membership_imports").update({
    reconciliation_status: status,
    reconciliation_note: note,
    materialized_membership_id: membershipId,
  }).eq("hubspot_contact_id", contactId).eq("hubspot_company_id", companyId);
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
  await client.schema("app").from("hubspot_sync_failures").insert({
    run_id: runId,
    object_type: objectType,
    external_id: externalId,
    error_code: errorCode,
    error_message: errorMessage,
    source_payload: sourcePayload,
  });
}

async function finishRun(
  client: AppClient,
  runId: string,
  status: "succeeded" | "partial" | "failed",
  completedAt: string,
  counts: HubSpotSyncCounts,
  errorSummary: string | null = null,
) {
  await client.schema("app").from("hubspot_sync_runs").update({
    status,
    completed_at: completedAt,
    checkpoint_after: completedAt,
    source_company_count: counts.sourceCompanies,
    source_contact_count: counts.sourceContacts,
    company_upsert_count: counts.companyUpserts,
    contact_upsert_count: counts.contactUpserts,
    membership_upsert_count: counts.membershipUpserts,
    materialized_chapter_count: counts.materializedChapters,
    matched_profile_count: counts.matchedProfiles,
    conflict_count: counts.conflicts,
    failure_count: counts.failures,
    error_summary: errorSummary,
  }).eq("id", runId);
}

async function heartbeatRun(client: AppClient, runId: string, heartbeatAt: string) {
  await client.schema("app").from("hubspot_sync_runs").update({
    heartbeat_at: heartbeatAt,
  }).eq("id", runId).eq("status", "running");
}

async function resolveReplayedFailures(client: AppClient, retryOfRunId: string, resolvedAt: string) {
  await client.schema("app").from("hubspot_sync_failures").update({
    resolved_at: resolvedAt,
  }).eq("run_id", retryOfRunId).is("resolved_at", null);
}

export function mapChapterType(schoolType: string | null): "high_school" | "college_university" | "needs_review" {
  const normalized = (schoolType ?? "").trim().toLowerCase();
  if (normalized.includes("high school") || normalized.includes("secondary")) return "high_school";
  if (normalized.includes("university") || normalized.includes("college") || normalized.includes("cgep")) return "college_university";
  return "needs_review";
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
    updatedAt: optional(properties.hs_lastmodifieddate) ?? row.updatedAt ?? null,
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

function optional(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
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

function disabled(environment: HubSpotReadSyncConfig["environment"], reason: string): HubSpotReadSyncConfig {
  return { enabled: false, environment, reason };
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
    materializedChapters: 0,
    matchedProfiles: 0,
    conflicts: 0,
    failures: 0,
  };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function failure(
  code: Extract<HubSpotReadSyncResult, { success: false }>["code"],
  plainEnglishMessage: string,
  runId: string | null = null,
): HubSpotReadSyncResult {
  return { success: false, code, runId, plainEnglishMessage };
}
