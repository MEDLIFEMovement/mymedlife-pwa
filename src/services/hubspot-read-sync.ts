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

type ContactProfileMatch =
  | { status: "matched"; profileId: string }
  | { status: "none" | "stopped" };

type ContactSyncContext = {
  client: AppClient;
  runId: string;
  actorUserId: string | null;
  contact: HubSpotContactRecord;
  counts: HubSpotSyncCounts;
  profileIds: Map<string, string>;
};

type HubSpotRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

type RunAuditContext = {
  client: AppClient;
  runId: string;
  actorUserId: string | null;
  counts: HubSpotSyncCounts;
};

type AuditInput = {
  chapterId: string | null;
  action: string;
  targetTable: string;
  targetId: string;
  afterValue: Record<string, unknown>;
};

type CompanySyncContext = RunAuditContext & {
  company: HubSpotCompanyRecord;
  chapterIds: Map<string, string>;
};

type CompanyChapterMatch =
  | {
      status: "resolved";
      chapterId: string;
      existingStatus: string | null;
      refreshRequired: boolean;
    }
  | { status: "stopped" };

type MembershipSyncContext = RunAuditContext & {
  contact: HubSpotContactRecord;
  companyId: string;
  profileId: string | null;
  chapterId: string | null;
  qualification: HubSpotMembershipQualification | null;
  associationKey: string;
};

type MembershipMatch =
  | { status: "resolved"; membershipId: string | null }
  | { status: "stopped" };

type PreparedHubSpotSync = {
  appClient: AppClient;
  hubspotClient: HubSpotReadClient;
  config: HubSpotReadSyncConfig;
  triggerSource: HubSpotSyncTriggerSource;
  retryOfRunId: string | null;
  now: () => Date;
};

type PrepareHubSpotSyncResult =
  | { success: true; value: PreparedHubSpotSync }
  | { success: false; result: HubSpotReadSyncResult };

type StartedHubSpotSync = {
  runId: string;
  startedAt: string;
  checkpointBefore: string | null;
};

type StartHubSpotSyncResult =
  | { success: true; value: StartedHubSpotSync }
  | { success: false; result: HubSpotReadSyncResult };

type HubSpotProcessingContext = {
  actorUserId: string | null;
  mode: HubSpotSyncMode;
  prepared: PreparedHubSpotSync;
  started: StartedHubSpotSync;
  counts: HubSpotSyncCounts;
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

  const approvalFlag = getHubSpotApprovalFlag(env, environment);

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

  return createHubSpotReadOnlyClient(token, fetchImpl);
}

export function createHubSpotReadOnlyClient(
  token: string,
  fetchImpl: typeof fetch = fetch,
): HubSpotReadClient {
  const request = createHubSpotRequest(token, fetchImpl);

  return {
    readActiveChapterCompanies: () => readActiveChapterCompanies(request),
    readContactsWithCompanies: (modifiedAfter, activeCompanyIds = []) =>
      readContactsWithCompanies(request, modifiedAfter, activeCompanyIds),
  };
}

function createHubSpotRequest(token: string, fetchImpl: typeof fetch): HubSpotRequest {
  return async <T>(path: string, init?: RequestInit): Promise<T> => {
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
      if (!isRetryableHubSpotResponse(response.status) || attempt === 2) {
        throw new Error(formatHubSpotRequestError(response.status, retryAfter));
      }
      await wait(Math.max(retryAfter * 1000, 250 * (attempt + 1)));
    }
    throw new Error("HubSpot request failed after retries.");
  };
}

async function readActiveChapterCompanies(
  request: HubSpotRequest,
): Promise<HubSpotCompanyRecord[]> {
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
}

async function readContactsWithCompanies(
  request: HubSpotRequest,
  modifiedAfter?: string | null,
  activeCompanyIds: string[] = [],
): Promise<HubSpotContactRecord[]> {
  if (modifiedAfter) {
    return readIncrementalContacts(request, modifiedAfter);
  }

  if (activeCompanyIds.length === 0) return [];
  return readBackfillContacts(request, activeCompanyIds);
}

async function readIncrementalContacts(
  request: HubSpotRequest,
  modifiedAfter: string,
): Promise<HubSpotContactRecord[]> {
  const checkpoint = Date.parse(modifiedAfter);
  if (!Number.isFinite(checkpoint)) {
    throw new TypeError("HubSpot incremental sync checkpoint is invalid.");
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
    const companyIdsByContact = await readContactCompanyAssociations(request, rows);
    records.push(...mapContactsWithCompanies(rows, companyIdsByContact));
    after = page.paging?.next?.after;
  } while (after !== undefined);
  return records.filter((record) => changedAfter(record.updatedAt, modifiedAfter));
}

async function readBackfillContacts(
  request: HubSpotRequest,
  activeCompanyIds: string[],
): Promise<HubSpotContactRecord[]> {
  const companyIdsByContact = await readCompanyContactAssociations(request, activeCompanyIds);
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
    records.push(...mapContactsWithCompanies(page.results ?? [], companyIdsByContact));
  }
  return records;
}

async function readCompanyContactAssociations(
  request: HubSpotRequest,
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
      addCompanyContactAssociations(companyIdsByContact, result);
    }
  }
  return companyIdsByContact;
}

function addCompanyContactAssociations(
  companyIdsByContact: Map<string, string[]>,
  result: NonNullable<HubSpotAssociationBatchPage["results"]>[number],
) {
  const companyId = result.from?.id;
  if (!companyId) return;
  for (const contact of result.to ?? []) {
    if (!contact.id) continue;
    const existingCompanyIds = companyIdsByContact.get(contact.id) ?? [];
    if (!existingCompanyIds.includes(companyId)) {
      companyIdsByContact.set(contact.id, [...existingCompanyIds, companyId]);
    }
  }
}

async function readContactCompanyAssociations(
  request: HubSpotRequest,
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
  return new Map((associations.results ?? []).flatMap((result) => {
    const contactId = result.from?.id;
    if (!contactId) return [];
    const companyIds = (result.to ?? [])
      .map((company) => company.id)
      .filter((id): id is string => Boolean(id));
    return [[contactId, companyIds]];
  }));
}

function mapContactsWithCompanies(
  rows: HubSpotObjectRow[],
  companyIdsByContact: Map<string, string[]>,
): HubSpotContactRecord[] {
  return rows.map((row) => mapContact({
    ...row,
    associations: {
      companies: {
        results: (companyIdsByContact.get(row.id ?? "") ?? []).map((id) => ({ id })),
      },
    },
  })).filter(isPresent);
}

export async function runHubSpotReadSync(
  actorUserId: string | null,
  mode: HubSpotSyncMode,
  deps: HubSpotReadSyncDeps = {},
): Promise<HubSpotReadSyncResult> {
  const prepared = await prepareHubSpotSync(actorUserId, deps);
  if (!prepared.success) return prepared.result;

  const started = await startHubSpotSyncRun(actorUserId, mode, prepared.value);
  if (!started.success) return started.result;

  return executeHubSpotSync(actorUserId, mode, prepared.value, started.value);
}

async function prepareHubSpotSync(
  actorUserId: string | null,
  deps: HubSpotReadSyncDeps,
): Promise<PrepareHubSpotSyncResult> {
  const env = deps.env ?? process.env;
  const config = getHubSpotReadSyncConfig(env);
  const triggerSource = deps.triggerSource ?? "manual";
  const retryOfRunId = deps.retryOfRunId ?? null;
  const now = deps.now ?? (() => new Date());
  if (!config.enabled) return preparationFailure("sync_disabled", config.reason);
  if (triggerSource !== "scheduled" && !actorUserId) {
    return preparationFailure(
      "missing_auth",
      "Sign in with a DS Admin or Super Admin account before running HubSpot sync.",
    );
  }
  if (triggerSource === "replay" && !retryOfRunId) {
    return preparationFailure(
      "server_error",
      "A replay must identify the failed or partial HubSpot sync run being retried.",
    );
  }

  const appClient = deps.appClient ?? createHubSpotSyncAppClient(env);
  const hubspotClient = deps.hubspotClient ?? createHubSpotReadClient(env);
  if (!appClient || !hubspotClient) {
    return preparationFailure(
      "sync_disabled",
      "The server-only HubSpot and Supabase sync clients are not configured.",
    );
  }

  const authorizationFailure = await authorizeHubSpotSyncActor(appClient, actorUserId);
  if (authorizationFailure) return { success: false, result: authorizationFailure };

  return {
    success: true,
    value: { appClient, hubspotClient, config, triggerSource, retryOfRunId, now },
  };
}

async function authorizeHubSpotSyncActor(
  appClient: AppClient,
  actorUserId: string | null,
): Promise<HubSpotReadSyncResult | null> {
  if (!actorUserId) return null;
  const actorRoleResult = await readActorRoles(appClient, actorUserId);
  if (actorRoleResult.error) {
    return failure("server_error", "Could not verify the HubSpot sync administrator role.");
  }
  const authorized = actorRoleResult.roles.some(isHubSpotSyncAdministratorRole);
  return authorized
    ? null
    : failure("permission_denied", "Only a DS Admin or Super Admin can run HubSpot sync.");
}

async function startHubSpotSyncRun(
  actorUserId: string | null,
  mode: HubSpotSyncMode,
  prepared: PreparedHubSpotSync,
): Promise<StartHubSpotSyncResult> {
  const { appClient, now, triggerSource, retryOfRunId } = prepared;
  const startedAt = now().toISOString();
  const lockFailure = await prepareHubSpotSyncLock(appClient, startedAt);
  if (lockFailure) return { success: false, result: lockFailure };

  const checkpointResult = await readLastCheckpoint(appClient);
  if (checkpointResult.error) {
    return {
      success: false,
      result: failure(
        "server_error",
        `Could not read the HubSpot sync checkpoint: ${checkpointResult.error}`,
      ),
    };
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
    return {
      success: false,
      result: createRunFailure(created.error),
    };
  }
  return {
    success: true,
    value: { runId, startedAt, checkpointBefore },
  };
}

async function prepareHubSpotSyncLock(
  appClient: AppClient,
  startedAt: string,
): Promise<HubSpotReadSyncResult | null> {
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
  return null;
}

function createRunFailure(
  error: { message?: string; code?: string } | null,
): HubSpotReadSyncResult {
  return isRunningRunConflict(error)
    ? failure(
      "sync_already_running",
      "A HubSpot sync is already running. Review that run before retrying.",
    )
    : failure("server_error", "Could not create the app-owned HubSpot sync run.");
}

async function executeHubSpotSync(
  actorUserId: string | null,
  mode: HubSpotSyncMode,
  prepared: PreparedHubSpotSync,
  started: StartedHubSpotSync,
): Promise<HubSpotReadSyncResult> {
  const counts = emptyCounts();
  try {
    await processHubSpotSync(actorUserId, mode, prepared, started, counts);
    return await finalizeSuccessfulHubSpotSync(prepared, started, counts);
  } catch (error) {
    return finalizeFailedHubSpotSync(prepared, started, counts, error);
  }
}

async function processHubSpotSync(
  actorUserId: string | null,
  mode: HubSpotSyncMode,
  prepared: PreparedHubSpotSync,
  started: StartedHubSpotSync,
  counts: HubSpotSyncCounts,
) {
  const { appClient, hubspotClient, now } = prepared;
  const { runId, checkpointBefore } = started;
  const companies = await hubspotClient.readActiveChapterCompanies();
  const activeCompanyIds = new Set(companies.map((company) => company.id));
  const allContacts = await hubspotClient.readContactsWithCompanies(
    mode === "incremental" ? checkpointBefore : null,
    [...activeCompanyIds],
  );
  const contacts = filterContactsToActiveCompanies(
    allContacts,
    activeCompanyIds,
    mode,
  );
  counts.sourceCompanies = companies.length;
  counts.sourceContacts = contacts.length;
  await heartbeatRun(appClient, runId, now().toISOString());

  const context = { actorUserId, mode, prepared, started, counts };
  const chapterIds = await processHubSpotCompanies(context, companies, activeCompanyIds);
  const profileIds = await processHubSpotContacts(context, contacts);
  await processHubSpotMemberships(
    context,
    contacts,
    chapterIds,
    profileIds,
  );
}

function filterContactsToActiveCompanies(
  contacts: HubSpotContactRecord[],
  activeCompanyIds: Set<string>,
  mode: HubSpotSyncMode,
): HubSpotContactRecord[] {
  const scopedContacts = contacts.map((contact) => ({
      ...contact,
      companyIds: contact.companyIds.filter((companyId) => activeCompanyIds.has(companyId)),
    }));

  // A changed contact that loses its last active company must remain in an
  // incremental run so its previously materialized membership can be revoked.
  return mode === "incremental"
    ? scopedContacts
    : scopedContacts.filter((contact) => contact.companyIds.length > 0);
}

async function processHubSpotCompanies(
  context: HubSpotProcessingContext,
  companies: HubSpotCompanyRecord[],
  activeCompanyIds: Set<string>,
): Promise<Map<string, string>> {
  const { actorUserId, mode, prepared, started, counts } = context;
  const { appClient, now } = prepared;
  const { runId } = started;
  const chapterIds = new Map<string, string>();
  for (const [index, company] of companies.entries()) {
    await syncCompany(appClient, runId, actorUserId, company, counts, chapterIds);
    await heartbeatAtBatchBoundary(appClient, runId, index, now);
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
  return chapterIds;
}

async function processHubSpotContacts(
  context: HubSpotProcessingContext,
  contacts: HubSpotContactRecord[],
): Promise<Map<string, string>> {
  const { actorUserId, prepared, started, counts } = context;
  const { appClient, now } = prepared;
  const { runId } = started;
  const profileIds = new Map<string, string>();
  for (const [index, contact] of contacts.entries()) {
    await syncContact(appClient, runId, actorUserId, contact, counts, profileIds);
    await heartbeatAtBatchBoundary(appClient, runId, index, now);
  }
  await heartbeatRun(appClient, runId, now().toISOString());
  return profileIds;
}

async function processHubSpotMemberships(
  context: HubSpotProcessingContext,
  contacts: HubSpotContactRecord[],
  chapterIds: Map<string, string>,
  profileIds: Map<string, string>,
) {
  const { actorUserId, mode, prepared, started, counts } = context;
  const { appClient, config, now } = prepared;
  const { runId } = started;
  for (const [index, contact] of contacts.entries()) {
    const qualification = getHubSpotMembershipQualification(contact, config);
    for (const companyId of contact.companyIds) {
      await syncMembership({
        client: appClient,
        runId,
        actorUserId,
        contact,
        companyId,
        profileId: profileIds.get(contact.id) ?? null,
        chapterId: chapterIds.get(companyId) ?? null,
        qualification,
        counts,
        associationKey: `${contact.id}:${companyId}`,
      });
    }
    await heartbeatAtBatchBoundary(appClient, runId, index, now);
  }
  if (mode === "backfill") {
    await deactivateMissingHubSpotMemberships(
      appClient,
      runId,
      actorUserId,
      getObservedAssociationKeys(contacts),
      counts,
    );
  } else {
    const changedContactIds = new Set(contacts.map((contact) => contact.id));
    if (changedContactIds.size > 0) {
      await deactivateMissingHubSpotMemberships(
        appClient,
        runId,
        actorUserId,
        getObservedAssociationKeys(contacts),
        counts,
        changedContactIds,
      );
    }
  }
}

function getObservedAssociationKeys(
  contacts: HubSpotContactRecord[],
): Set<string> {
  return new Set(contacts.flatMap((contact) => (
    contact.companyIds.map((companyId) => `${contact.id}:${companyId}`)
  )));
}

async function heartbeatAtBatchBoundary(
  appClient: AppClient,
  runId: string,
  index: number,
  now: () => Date,
) {
  if ((index + 1) % 25 === 0) {
    await heartbeatRun(appClient, runId, now().toISOString());
  }
}

async function finalizeSuccessfulHubSpotSync(
  prepared: PreparedHubSpotSync,
  started: StartedHubSpotSync,
  counts: HubSpotSyncCounts,
): Promise<HubSpotReadSyncResult> {
  const { appClient, now, triggerSource, retryOfRunId } = prepared;
  const { runId, startedAt } = started;
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
  return buildSuccessfulSyncResult(status, runId, counts);
}

function buildSuccessfulSyncResult(
  status: "succeeded" | "partial",
  runId: string,
  counts: HubSpotSyncCounts,
): HubSpotReadSyncResult {
  return {
    success: true,
    code: status === "partial" ? "hubspot_sync_partial" : "hubspot_sync_succeeded",
    runId,
    counts,
    plainEnglishMessage: status === "partial"
      ? "HubSpot read sync completed with reviewable conflicts or failures. No HubSpot writes or invitations were sent."
      : "HubSpot read sync completed and materialized app-owned chapter and membership read models. No HubSpot writes or invitations were sent.",
  };
}

async function finalizeFailedHubSpotSync(
  prepared: PreparedHubSpotSync,
  started: StartedHubSpotSync,
  counts: HubSpotSyncCounts,
  error: unknown,
): Promise<HubSpotReadSyncResult> {
  const { appClient, now } = prepared;
  const { runId } = started;
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
  const finalized = await finishRun(
    appClient,
    runId,
    "failed",
    now().toISOString(),
    null,
    counts,
    errorSummary,
  );
  return finalized
    ? failure("server_error", `HubSpot read sync failed safely: ${errorSummary}`, runId)
    : failure(
      "server_error",
      `HubSpot read sync failed safely, but the failed run status could not be recorded: ${errorSummary}`,
      runId,
    );
}

function preparationFailure(
  code: Extract<HubSpotReadSyncResult, { success: false }>["code"],
  message: string,
): PrepareHubSpotSyncResult {
  return { success: false, result: failure(code, message) };
}

function isHubSpotSyncAdministratorRole(role: string): boolean {
  return role === "ds_admin" || role === "super_admin";
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
  const context = { client, runId, actorUserId, company, counts, chapterIds };
  const staged = await stageHubSpotCompany(context);
  if (!staged) return;

  const match = await resolveCompanyChapter(context);
  if (match.status !== "resolved") return;

  await finalizeCompanyChapter(context, match);
}

async function stageHubSpotCompany(context: CompanySyncContext): Promise<boolean> {
  const { client, runId, company, counts } = context;
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
    return false;
  }
  counts.companyUpserts += 1;
  return true;
}

async function resolveCompanyChapter(
  context: CompanySyncContext,
): Promise<CompanyChapterMatch> {
  const { client, runId, actorUserId, company, counts } = context;
  const existing = await client.schema("app").from("chapters")
    .select("id,name,campus,status,hubspot_company_id")
    .eq("hubspot_company_id", company.id)
    .limit(2);
  if (existing.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "company", company.id, "chapter_lookup_failed", existing.error.message, company.source);
    return { status: "stopped" };
  }

  const directMatch = existing.data?.[0];
  if (directMatch?.id) {
    return {
      status: "resolved",
      chapterId: String(directMatch.id),
      existingStatus: directMatch.status ? String(directMatch.status) : null,
      refreshRequired: true,
    };
  }

  const nameMatch = await findCompanyChapterByName(context);
  if (nameMatch.status === "stopped") return nameMatch;
  if (nameMatch.chapterId) {
    const linked = await updateChapterFromCompany(
      context,
      nameMatch.chapterId,
      nameMatch.existingStatus,
      true,
    );
    return linked
      ? {
        status: "resolved",
        chapterId: nameMatch.chapterId,
        existingStatus: nameMatch.existingStatus,
        refreshRequired: false,
      }
      : { status: "stopped" };
  }

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
  const chapterId = inserted.error ? null : String(inserted.data?.id ?? "") || null;
  if (!chapterId) {
    counts.failures += 1;
    await recordFailure(client, runId, "company", company.id, "chapter_materialization_failed", "The app chapter could not be linked or created.", company.source);
    return { status: "stopped" };
  }
  counts.materializedChapters += 1;
  return {
    status: "resolved",
    chapterId,
    existingStatus: null,
    refreshRequired: false,
  };
}

async function findCompanyChapterByName(
  context: CompanySyncContext,
): Promise<
  | { status: "resolved"; chapterId: string | null; existingStatus: string | null }
  | { status: "stopped" }
> {
  const { client, runId, company, counts } = context;
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
    return { status: "stopped" };
  }
  const matches = nameMatches.data ?? [];
  const linkedElsewhere = matches[0]?.hubspot_company_id
    && matches[0].hubspot_company_id !== company.id;
  if (matches.length > 1 || linkedElsewhere) {
    counts.conflicts += 1;
    await markCompanyReconciliation(
      client,
      company.id,
      "conflict",
      "Multiple or externally linked app chapters match this HubSpot company.",
      null,
    );
    return { status: "stopped" };
  }
  return {
    status: "resolved",
    chapterId: matches[0]?.id ? String(matches[0].id) : null,
    existingStatus: matches[0]?.status ? String(matches[0].status) : null,
  };
}

async function updateChapterFromCompany(
  context: CompanySyncContext,
  chapterId: string,
  existingStatus: string | null,
  linkCompany: boolean,
): Promise<boolean> {
  const { client, runId, company, counts } = context;
  const update = {
    name: company.name,
    campus: company.name,
    region: company.region,
    country: company.country,
    chapter_type: mapChapterType(company.schoolType),
    ...(linkCompany ? { hubspot_company_id: company.id } : {}),
    ...(existingStatus === "inactive" ? { status: "active" } : {}),
  };
  let query = client.schema("app").from("chapters").update(update).eq("id", chapterId);
  if (!linkCompany) query = query.eq("hubspot_company_id", company.id);
  const refreshed = await query;
  if (!refreshed.error) return true;

  counts.failures += 1;
  await recordFailure(
    client,
    runId,
    "company",
    company.id,
    linkCompany ? "chapter_materialization_failed" : "chapter_refresh_failed",
    refreshed.error.message,
    company.source,
  );
  return false;
}

async function finalizeCompanyChapter(
  context: CompanySyncContext,
  match: Extract<CompanyChapterMatch, { status: "resolved" }>,
) {
  const { client, runId, actorUserId, company, counts, chapterIds } = context;
  const { chapterId, existingStatus, refreshRequired } = match;
  if (refreshRequired) {
    const refreshed = await updateChapterFromCompany(context, chapterId, existingStatus, false);
    if (!refreshed) return;
  }
  chapterIds.set(company.id, chapterId);
  await markCompanyReconciliation(client, company.id, "materialized", null, chapterId);
  const auditContext = { client, runId, actorUserId, counts };
  if (existingStatus === "inactive") {
    await recordAudit(auditContext, {
      chapterId,
      action: "hubspot_chapter_reactivated",
      targetTable: "chapters",
      targetId: chapterId,
      afterValue: { hubspot_company_id: company.id, status: "active" },
    });
  }
  await recordAudit(auditContext, {
    chapterId,
    action: "hubspot_chapter_materialized",
    targetTable: "chapters",
    targetId: chapterId,
    afterValue: { hubspot_company_id: company.id, name: company.name },
  });
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
    await recordAudit({ client, runId, actorUserId, counts }, {
      chapterId,
      action: "hubspot_chapter_deactivated",
      targetTable: "chapters",
      targetId: chapterId,
      afterValue: { hubspot_company_id: companyId, status: "inactive" },
    });
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
  const context = { client, runId, actorUserId, contact, counts, profileIds };
  const email = normalizeEmail(contact.email);
  const staged = await stageHubSpotContact(context, email);
  if (!staged) return;

  const match = await resolveContactProfileMatch(context, email);
  if (match.status !== "matched") return;

  await materializeContactProfile(context, email, match.profileId);
}

async function stageHubSpotContact(
  context: ContactSyncContext,
  email: string | null,
): Promise<boolean> {
  const { client, runId, contact, counts } = context;
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
    return false;
  }
  counts.contactUpserts += 1;
  return true;
}

async function resolveContactProfileMatch(
  context: ContactSyncContext,
  email: string | null,
): Promise<ContactProfileMatch> {
  const { client, runId, contact, counts } = context;
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
    return { status: "stopped" };
  }
  let matches = linkedProfiles.data ?? [];
  if (matches.length === 0) {
    if (!email) return { status: "none" };
    const emailProfiles = await client.schema("app").from("profiles")
      .select("id,hubspot_contact_id,display_name,email")
      .ilike("email", email)
      .limit(2);
    if (emailProfiles.error) {
      counts.failures += 1;
      await recordFailure(client, runId, "contact", contact.id, "profile_lookup_failed", emailProfiles.error.message, contact.source);
      return { status: "stopped" };
    }
    matches = emailProfiles.data ?? [];
  }
  if (matches.length === 0) return { status: "none" };
  if (matches.length > 1 || (matches[0]?.hubspot_contact_id && matches[0].hubspot_contact_id !== contact.id)) {
    counts.conflicts += 1;
    await markContactReconciliation(client, contact.id, "conflict", "Multiple or externally linked app profiles match this HubSpot contact.", null);
    return { status: "stopped" };
  }
  return { status: "matched", profileId: String(matches[0].id) };
}

async function materializeContactProfile(
  context: ContactSyncContext,
  email: string | null,
  profileId: string,
) {
  const { client, runId, actorUserId, contact, counts, profileIds } = context;
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
  await recordAudit({ client, runId, actorUserId, counts }, {
    chapterId: null,
    action: "hubspot_profile_materialized",
    targetTable: "profiles",
    targetId: profileId,
    afterValue: {
      hubspot_contact_id: contact.id,
      display_name: displayName,
      email,
      source_updated_at: contact.updatedAt,
    },
  });
}

async function syncMembership(context: MembershipSyncContext) {
  const staged = await stageHubSpotMembership(context);
  if (!staged) return;

  const { qualification, profileId, chapterId } = context;
  if (!qualification) {
    await deactivateIneligibleHubSpotMembership(
      context.client,
      context.runId,
      context.actorUserId,
      context.associationKey,
      context.companyId,
      context.counts,
    );
    return;
  }
  if (!profileId || !chapterId) return;

  const match = await resolveMembershipMatch(context);
  if (match.status === "stopped") return;

  const membershipId = await materializeHubSpotMembership(context, match.membershipId);
  if (!membershipId) return;

  await finalizeHubSpotMembership(context, membershipId);
}

async function stageHubSpotMembership(
  context: MembershipSyncContext,
): Promise<boolean> {
  const {
    client,
    runId,
    contact,
    companyId,
    profileId,
    chapterId,
    qualification,
    associationKey,
    counts,
  } = context;
  const reconciliation = getMembershipReconciliationState(
    Boolean(qualification),
    Boolean(profileId && chapterId),
  );
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
    reconciliation_status: reconciliation.status,
    reconciliation_note: reconciliation.note,
    last_seen_run_id: runId,
    last_imported_at: new Date().toISOString(),
  }, { onConflict: "hubspot_contact_id,hubspot_company_id" });
  if (staged.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "membership", associationKey, "membership_stage_failed", staged.error.message, { associationKey });
    return false;
  }
  counts.membershipUpserts += 1;
  return true;
}

async function resolveMembershipMatch(
  context: MembershipSyncContext,
): Promise<MembershipMatch> {
  const {
    client,
    runId,
    contact,
    companyId,
    profileId,
    chapterId,
    associationKey,
    counts,
  } = context;
  const memberships = await client.schema("app").from("memberships")
    .select("id,status,hubspot_association_key")
    .eq("user_id", profileId)
    .eq("chapter_id", chapterId)
    .limit(2);
  if (memberships.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "membership", associationKey, "membership_lookup_failed", memberships.error.message, { associationKey });
    return { status: "stopped" };
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
    return { status: "stopped" };
  }

  const existing = memberships.data?.[0];
  const membershipId = existing?.id ? String(existing.id) : null;
  const existingKey = existing?.hubspot_association_key;
  if (existingKey && existingKey !== associationKey) {
    counts.conflicts += 1;
    await markMembershipReconciliation(
      client,
      contact.id,
      companyId,
      "conflict",
      "The existing app membership is linked to a different HubSpot association.",
      null,
    );
    return { status: "stopped" };
  }
  return { status: "resolved", membershipId };
}

async function materializeHubSpotMembership(
  context: MembershipSyncContext,
  existingMembershipId: string | null,
): Promise<string | null> {
  const {
    client,
    runId,
    actorUserId,
    profileId,
    chapterId,
    qualification,
    associationKey,
    counts,
  } = context;
  if (!qualification || !profileId || !chapterId) return null;

  let membershipId = existingMembershipId;
  if (membershipId) {
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
    return null;
  }
  return membershipId;
}

async function finalizeHubSpotMembership(
  context: MembershipSyncContext,
  membershipId: string,
) {
  const {
    client,
    runId,
    actorUserId,
    contact,
    companyId,
    chapterId,
    qualification,
    associationKey,
    counts,
  } = context;
  if (!qualification || !chapterId) return;
  await markMembershipReconciliation(client, contact.id, companyId, "materialized", null, membershipId);
  await recordAudit({ client, runId, actorUserId, counts }, {
    chapterId,
    action: "hubspot_membership_materialized",
    targetTable: "memberships",
    targetId: membershipId,
    afterValue: {
      hubspot_association_key: associationKey,
      role_key: qualification.roleKey,
      source_terms: qualification.evidenceTerms,
      status: "approved",
    },
  });
}

function getMembershipReconciliationState(
  qualified: boolean,
  fullyMatched: boolean,
): { status: "pending" | "waiting_for_match" | "ignored"; note: string | null } {
  if (!qualified) {
    return {
      status: "ignored",
      note: "The contact-company association does not match the configured current member or leader terms, so it cannot grant app access.",
    };
  }
  if (!fullyMatched) {
    return {
      status: "waiting_for_match",
      note: "Waiting for both an app profile and app chapter match.",
    };
  }
  return { status: "pending", note: null };
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
  await recordAudit({ client, runId, actorUserId, counts }, {
    chapterId: membership.chapter_id ? String(membership.chapter_id) : null,
    action: "hubspot_membership_deactivated",
    targetTable: "memberships",
    targetId: membershipId,
    afterValue: {
      hubspot_association_key: associationKey,
      status: "inactive",
      reason: "outside_configured_active_terms",
    },
  });
}

async function deactivateMissingHubSpotMemberships(
  client: AppClient,
  runId: string,
  actorUserId: string | null,
  activeAssociationKeys: Set<string>,
  counts: HubSpotSyncCounts,
  scopedContactIds: Set<string> | null = null,
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
    const [contactId, companyId] = associationKey.split(":", 2);
    if (!associationKey || activeAssociationKeys.has(associationKey) || row.status === "inactive") {
      continue;
    }
    if (scopedContactIds && (!contactId || !scopedContactIds.has(contactId))) {
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

    if (contactId && companyId) {
      await markMembershipReconciliation(
        client,
        contactId,
        companyId,
        "ignored",
        scopedContactIds
          ? "The HubSpot association was absent from this changed contact's latest incremental association read, so app access was deactivated."
          : "The HubSpot association was absent from the latest complete backfill, so app access was deactivated.",
        membershipId,
      );
    }
    counts.membershipDeactivations += 1;
    await recordAudit({ client, runId, actorUserId, counts }, {
      chapterId: row.chapter_id ? String(row.chapter_id) : null,
      action: "hubspot_membership_deactivated",
      targetTable: "memberships",
      targetId: membershipId,
      afterValue: { hubspot_association_key: associationKey, status: "inactive" },
    });
  }
}

async function recordAudit(context: RunAuditContext, input: AuditInput) {
  const { client, runId, actorUserId, counts } = context;
  const { chapterId, action, targetTable, targetId, afterValue } = input;
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

function getHubSpotApprovalFlag(
  env: Record<string, string | undefined>,
  environment: HubSpotReadSyncConfig["environment"],
): string | undefined {
  if (environment === "production") {
    return env.MYMEDLIFE_ALLOW_PRODUCTION_HUBSPOT_READ_SYNC;
  }
  if (environment === "staging") {
    return env.MYMEDLIFE_ALLOW_STAGING_HUBSPOT_READ_SYNC;
  }
  return env.MYMEDLIFE_ALLOW_LOCAL_HUBSPOT_READ_SYNC;
}

function isRetryableHubSpotResponse(status: number): boolean {
  return status === 429 || status >= 500;
}

function formatHubSpotRequestError(status: number, retryAfter: number): string {
  const retryMessage = retryAfter > 0 ? `; retry after ${retryAfter}s` : "";
  return `HubSpot request failed (${status})${retryMessage}.`;
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
