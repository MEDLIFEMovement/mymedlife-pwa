import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DATABRICKS_STATEMENT_PATH = "/api/2.0/sql/statements";
const EXPORT_DATASET = "event_metrics";
const EXPORT_PAGE_SIZE = 500;
const POLL_ATTEMPTS = 30;
const POLL_DELAY_MS = 1_000;

export type DatabricksExportMode = "backfill" | "incremental";
export type DatabricksExportTriggerSource = "manual" | "scheduled" | "replay";

export type DatabricksEventMetricsExportConfig = {
  enabled: boolean;
  environment: "local" | "staging" | "production";
  host: string | null;
  warehouseId: string | null;
  catalog: string | null;
  schema: string | null;
  table: string | null;
  targetTable: string | null;
  reason: string;
};

export type DatabricksEventMetric = {
  eventId: string;
  chapterId: string;
  campaignId: string | null;
  title: string;
  eventType: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  currentRsvpCount: number;
  attendanceCount: number;
  eligibleMemberCount: number | null;
  attendanceRate: number | null;
  attendancePointsAwarded: number;
  sourceUpdatedAt: string;
};

export type DatabricksEventMetricsClient = {
  upsertEventMetrics(input: {
    rows: DatabricksEventMetric[];
    batchKey: string;
    exportedAt: string;
  }): Promise<{ statementId: string }>;
};

export type DatabricksEventMetricsExportResult =
  | {
      success: true;
      code: "databricks_export_succeeded";
      runId: string;
      batchKey: string;
      sourceRows: number;
      exportedRows: number;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code:
        | "export_disabled"
        | "missing_auth"
        | "permission_denied"
        | "export_already_running"
        | "server_error";
      runId: string | null;
      plainEnglishMessage: string;
    };

type AppClient = SupabaseClient<Record<string, unknown>>;

type ExportDeps = {
  appClient?: AppClient;
  databricksClient?: DatabricksEventMetricsClient;
  env?: Record<string, string | undefined>;
  now?: () => Date;
  triggerSource?: DatabricksExportTriggerSource;
  retryOfRunId?: string | null;
  batchKey?: string;
};

type DatabricksStatementResponse = {
  statement_id?: string;
  status?: {
    state?: string;
    error?: {
      error_code?: string;
    };
  };
};

type DatabricksClientOptions = {
  fetchImpl?: typeof fetch;
  waitImpl?: (milliseconds: number) => Promise<void>;
};

export function getDatabricksEventMetricsExportConfig(
  env: Record<string, string | undefined> = process.env,
): DatabricksEventMetricsExportConfig {
  const environment = getEnvironment(env);
  const host = normalizeDatabricksHost(env.DATABRICKS_HOST);
  const warehouseId = optional(env.DATABRICKS_SQL_WAREHOUSE_ID);
  const catalog = safeIdentifier(env.DATABRICKS_CATALOG);
  const schema = safeIdentifier(env.DATABRICKS_SCHEMA);
  const table = safeIdentifier(env.DATABRICKS_EVENT_METRICS_TABLE);
  const targetTable = catalog && schema && table
    ? `${catalog}.${schema}.${table}`
    : null;

  if (env.MYMEDLIFE_ENABLE_DATABRICKS_EVENT_METRICS_EXPORT !== "true") {
    return disabled(
      environment,
      host,
      warehouseId,
      catalog,
      schema,
      table,
      targetTable,
      "Databricks event-metrics export is disabled by configuration.",
    );
  }
  if (!host || !env.DATABRICKS_TOKEN || !warehouseId) {
    return disabled(
      environment,
      host,
      warehouseId,
      catalog,
      schema,
      table,
      targetTable,
      "Databricks export is disabled because its server-only host, token, or SQL warehouse is missing.",
    );
  }
  if (!targetTable) {
    return disabled(
      environment,
      host,
      warehouseId,
      catalog,
      schema,
      table,
      targetTable,
      "Databricks export is disabled until safe catalog, schema, and table identifiers are configured.",
    );
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL)) {
    return disabled(
      environment,
      host,
      warehouseId,
      catalog,
      schema,
      table,
      targetTable,
      "Databricks export is disabled because the server-only Supabase client is incomplete.",
    );
  }

  const approvalFlag = environment === "production"
    ? env.MYMEDLIFE_ALLOW_PRODUCTION_DATABRICKS_EVENT_METRICS_EXPORT
    : environment === "staging"
      ? env.MYMEDLIFE_ALLOW_STAGING_DATABRICKS_EVENT_METRICS_EXPORT
      : env.MYMEDLIFE_ALLOW_LOCAL_DATABRICKS_EVENT_METRICS_EXPORT;
  if (approvalFlag !== "true") {
    return disabled(
      environment,
      host,
      warehouseId,
      catalog,
      schema,
      table,
      targetTable,
      `${capitalize(environment)} Databricks export is disabled until its explicit environment approval flag is enabled.`,
    );
  }

  return {
    enabled: true,
    environment,
    host,
    warehouseId,
    catalog,
    schema,
    table,
    targetTable,
    reason:
      `Server-only aggregate event metrics may be exported to ${targetTable}. ` +
      "Member identity, credentials, operational writes, and page-load reads remain outside this downstream contract.",
  };
}

export function createDatabricksEventMetricsClient(
  env: Record<string, string | undefined> = process.env,
  options: DatabricksClientOptions = {},
): DatabricksEventMetricsClient | null {
  const config = getDatabricksEventMetricsExportConfig(env);
  const token = env.DATABRICKS_TOKEN;
  if (
    !config.enabled ||
    !config.host ||
    !config.warehouseId ||
    !config.catalog ||
    !config.schema ||
    !config.targetTable ||
    !token
  ) {
    return null;
  }

  const targetTable = config.targetTable;
  const fetchImpl = options.fetchImpl ?? fetch;
  const waitImpl = options.waitImpl ?? wait;

  const request = async (
    path: string,
    init: RequestInit,
  ): Promise<DatabricksStatementResponse> => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response;
      try {
        response = await fetchImpl(`${config.host}${path}`, {
          ...init,
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          cache: "no-store",
        });
      } catch {
        if (attempt === 2) {
          throw new Error("Databricks request failed after network retries.");
        }
        await waitImpl(250 * (attempt + 1));
        continue;
      }
      if (response.ok) {
        return response.json() as Promise<DatabricksStatementResponse>;
      }
      const retryAfter = Number.parseInt(
        response.headers.get("retry-after") ?? "0",
        10,
      );
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === 2) {
        throw new Error(`Databricks request failed (${response.status}).`);
      }
      await waitImpl(Math.max(retryAfter * 1_000, 250 * (attempt + 1)));
    }
    throw new Error("Databricks request failed after retries.");
  };

  const waitForStatement = async (
    initial: DatabricksStatementResponse,
  ): Promise<{ statementId: string }> => {
    const statementId = validStatementId(initial.statement_id);
    if (!statementId) {
      throw new Error("Databricks did not return a valid statement id.");
    }

    let current = initial;
    for (let attempt = 0; attempt <= POLL_ATTEMPTS; attempt += 1) {
      const state = current.status?.state ?? "UNKNOWN";
      if (state === "SUCCEEDED") return { statementId };
      if (["FAILED", "CANCELED", "CLOSED"].includes(state)) {
        const code = current.status?.error?.error_code;
        throw new Error(
          `Databricks statement ${state.toLowerCase()}${code ? ` (${code})` : ""}.`,
        );
      }
      if (attempt === POLL_ATTEMPTS) break;
      await waitImpl(POLL_DELAY_MS);
      current = await request(`${DATABRICKS_STATEMENT_PATH}/${statementId}`, {
        method: "GET",
      });
    }
    throw new Error("Databricks statement did not finish before the export timeout.");
  };

  const executeStatement = async (
    statement: string,
    parameters: Array<{ name: string; value: string; type?: string }>,
  ) => {
    const response = await request(DATABRICKS_STATEMENT_PATH, {
      method: "POST",
      body: JSON.stringify({
        warehouse_id: config.warehouseId,
        catalog: config.catalog,
        schema: config.schema,
        statement,
        parameters,
        wait_timeout: "50s",
        on_wait_timeout: "CONTINUE",
      }),
    });
    return waitForStatement(response);
  };

  return {
    async upsertEventMetrics({ rows, batchKey, exportedAt }) {
      if (rows.length > EXPORT_PAGE_SIZE) {
        throw new Error(
          `Databricks export batches cannot exceed ${EXPORT_PAGE_SIZE} rows.`,
        );
      }
      await executeStatement(
        `create table if not exists identifier(:target_table) (
          event_id string not null,
          chapter_id string not null,
          campaign_id string,
          title string not null,
          event_type string not null,
          status string not null,
          starts_at timestamp,
          ends_at timestamp,
          current_rsvp_count bigint not null,
          attendance_count bigint not null,
          eligible_member_count int,
          attendance_rate decimal(10, 6),
          attendance_points_awarded bigint not null,
          source_updated_at timestamp not null,
          last_export_batch_key string not null,
          last_exported_at timestamp not null
        ) using delta`,
        [{ name: "target_table", value: targetTable }],
      );

      const payload = JSON.stringify(rows.map((row) => ({
        event_id: row.eventId,
        chapter_id: row.chapterId,
        campaign_id: row.campaignId,
        title: row.title,
        event_type: row.eventType,
        status: row.status,
        starts_at: row.startsAt,
        ends_at: row.endsAt,
        current_rsvp_count: row.currentRsvpCount,
        attendance_count: row.attendanceCount,
        eligible_member_count: row.eligibleMemberCount,
        attendance_rate: row.attendanceRate,
        attendance_points_awarded: row.attendancePointsAwarded,
        source_updated_at: row.sourceUpdatedAt,
      })));

      return executeStatement(
        `merge into identifier(:target_table) as target
        using (
          select
            event_id,
            chapter_id,
            campaign_id,
            title,
            event_type,
            status,
            cast(starts_at as timestamp) as starts_at,
            cast(ends_at as timestamp) as ends_at,
            current_rsvp_count,
            attendance_count,
            eligible_member_count,
            cast(attendance_rate as decimal(10, 6)) as attendance_rate,
            attendance_points_awarded,
            cast(source_updated_at as timestamp) as source_updated_at,
            :batch_key as last_export_batch_key,
            cast(:exported_at as timestamp) as last_exported_at
          from inline(from_json(
            :payload_json,
            'array<struct<
              event_id:string,
              chapter_id:string,
              campaign_id:string,
              title:string,
              event_type:string,
              status:string,
              starts_at:string,
              ends_at:string,
              current_rsvp_count:bigint,
              attendance_count:bigint,
              eligible_member_count:int,
              attendance_rate:double,
              attendance_points_awarded:bigint,
              source_updated_at:string
            >>'
          ))
        ) as source
        on target.event_id = source.event_id
        when matched and source.source_updated_at >= target.source_updated_at then
          update set
            target.chapter_id = source.chapter_id,
            target.campaign_id = source.campaign_id,
            target.title = source.title,
            target.event_type = source.event_type,
            target.status = source.status,
            target.starts_at = source.starts_at,
            target.ends_at = source.ends_at,
            target.current_rsvp_count = source.current_rsvp_count,
            target.attendance_count = source.attendance_count,
            target.eligible_member_count = source.eligible_member_count,
            target.attendance_rate = source.attendance_rate,
            target.attendance_points_awarded = source.attendance_points_awarded,
            target.source_updated_at = source.source_updated_at,
            target.last_export_batch_key = source.last_export_batch_key,
            target.last_exported_at = source.last_exported_at
        when not matched then
          insert (
            event_id,
            chapter_id,
            campaign_id,
            title,
            event_type,
            status,
            starts_at,
            ends_at,
            current_rsvp_count,
            attendance_count,
            eligible_member_count,
            attendance_rate,
            attendance_points_awarded,
            source_updated_at,
            last_export_batch_key,
            last_exported_at
          )
          values (
            source.event_id,
            source.chapter_id,
            source.campaign_id,
            source.title,
            source.event_type,
            source.status,
            source.starts_at,
            source.ends_at,
            source.current_rsvp_count,
            source.attendance_count,
            source.eligible_member_count,
            source.attendance_rate,
            source.attendance_points_awarded,
            source.source_updated_at,
            source.last_export_batch_key,
            source.last_exported_at
          )`,
        [
          { name: "target_table", value: targetTable },
          { name: "payload_json", value: payload },
          { name: "batch_key", value: batchKey },
          { name: "exported_at", value: exportedAt, type: "TIMESTAMP" },
        ],
      );
    },
  };
}

export async function runDatabricksEventMetricsExport(
  actorUserId: string | null,
  mode: DatabricksExportMode,
  deps: ExportDeps = {},
): Promise<DatabricksEventMetricsExportResult> {
  const env = deps.env ?? process.env;
  const config = getDatabricksEventMetricsExportConfig(env);
  const triggerSource = deps.triggerSource ?? "manual";
  const retryOfRunId = deps.retryOfRunId ?? null;
  const now = deps.now ?? (() => new Date());
  if (!config.enabled || !config.targetTable) {
    return failure("export_disabled", config.reason);
  }
  if (triggerSource !== "scheduled" && !actorUserId) {
    return failure(
      "missing_auth",
      "Sign in with a DS Admin or Super Admin account before exporting event metrics.",
    );
  }
  if (triggerSource === "replay" && !retryOfRunId) {
    return failure(
      "server_error",
      "A replay must identify the failed or partial warehouse export run.",
    );
  }

  const appClient = deps.appClient ?? createExportAppClient(env);
  const databricksClient = deps.databricksClient ??
    createDatabricksEventMetricsClient(env);
  if (!appClient || !databricksClient) {
    return failure(
      "export_disabled",
      "The server-only Supabase and Databricks export clients are not configured.",
    );
  }

  if (actorUserId) {
    const actorRoleResult = await readActorRoles(appClient, actorUserId);
    if (actorRoleResult.error) {
      return failure(
        "server_error",
        "Could not verify the warehouse export administrator role.",
      );
    }
    if (
      !actorRoleResult.roles.some(
        (role) => role === "ds_admin" || role === "super_admin",
      )
    ) {
      return failure(
        "permission_denied",
        "Only a DS Admin or Super Admin can run a warehouse export.",
      );
    }
  }

  const startedAt = now().toISOString();
  const staleBefore = new Date(
    Date.parse(startedAt) - 30 * 60 * 1_000,
  ).toISOString();
  const recovered = await appClient.schema("app")
    .from("warehouse_export_runs")
    .update({
      status: "failed",
      completed_at: startedAt,
      heartbeat_at: startedAt,
      error_summary: "Recovered abandoned warehouse export after its heartbeat expired.",
    })
    .eq("status", "running")
    .lt("heartbeat_at", staleBefore);
  if (recovered.error) {
    return failure("server_error", "Could not recover abandoned warehouse exports.");
  }

  const running = await appClient.schema("app")
    .from("warehouse_export_runs")
    .select("id")
    .eq("status", "running")
    .eq("destination", "databricks")
    .eq("dataset", EXPORT_DATASET)
    .limit(1);
  if (running.error) {
    return failure("server_error", "Could not verify the warehouse export lock.");
  }
  if ((running.data ?? []).length > 0) {
    return failure(
      "export_already_running",
      "A Databricks event-metrics export is already running.",
    );
  }

  let attempt = 1;
  if (triggerSource === "replay" && retryOfRunId) {
    const replayTarget = await appClient.schema("app")
      .from("warehouse_export_runs")
      .select("id,mode,status,attempt")
      .eq("id", retryOfRunId)
      .eq("destination", "databricks")
      .eq("dataset", EXPORT_DATASET)
      .limit(1);
    if (replayTarget.error) {
      return failure(
        "server_error",
        "Could not verify the warehouse export replay target.",
      );
    }
    const previous = replayTarget.data?.[0];
    if (
      !previous ||
      (previous.status !== "failed" && previous.status !== "partial") ||
      previous.mode !== mode
    ) {
      return failure(
        "server_error",
        "Only a failed or partial warehouse run with the same mode can be replayed.",
      );
    }
    attempt = Math.max(1, Number(previous.attempt) || 1) + 1;
  }

  const checkpointResult = mode === "incremental"
    ? await readLastCheckpoint(appClient)
    : { checkpoint: null, error: null };
  if (checkpointResult.error) {
    return failure(
      "server_error",
      `Could not read the warehouse export checkpoint: ${checkpointResult.error}`,
    );
  }

  const batchKey = deps.batchKey ??
    `databricks:${EXPORT_DATASET}:${startedAt}:${randomUUID()}`;
  const created = await appClient.schema("app")
    .from("warehouse_export_runs")
    .insert({
      destination: "databricks",
      dataset: EXPORT_DATASET,
      mode,
      status: "running",
      trigger_source: triggerSource,
      requested_by: actorUserId,
      retry_of_run_id: retryOfRunId,
      attempt,
      batch_key: batchKey,
      checkpoint_before: checkpointResult.checkpoint,
      started_at: startedAt,
      heartbeat_at: startedAt,
    })
    .select("id")
    .single();
  const runId = String(created.data?.id ?? "");
  if (created.error || !runId) {
    if (isRunningRunConflict(created.error)) {
      return failure(
        "export_already_running",
        "A Databricks event-metrics export is already running.",
      );
    }
    return failure("server_error", "Could not create the warehouse export run.");
  }

  let sourceRowCount = 0;
  let exportedRowCount = 0;
  let payloadSha256: string | null = null;
  let statementId: string | null = null;
  const statementIds: string[] = [];
  let externalWriteCommitted = false;

  try {
    const payloadHash = createHash("sha256");
    payloadHash.update("[");
    let hashNeedsComma = false;
    let cursorUpdatedAt: string | null = null;
    let cursorEventId: string | null = null;

    while (true) {
      const sourceResult = await appClient.schema("app")
        .rpc("get_databricks_event_metrics_export", {
          checkpoint_before_input: checkpointResult.checkpoint,
          checkpoint_through_input: startedAt,
          cursor_updated_at_input: cursorUpdatedAt,
          cursor_event_id_input: cursorEventId,
          page_size_input: EXPORT_PAGE_SIZE,
        });
      if (sourceResult.error) {
        throw new Error(
          `The app-owned event metrics snapshot could not be read: ${sourceResult.error.message}`,
        );
      }

      const rows = normalizeExportRows(sourceResult.data);
      if (rows.length > EXPORT_PAGE_SIZE) {
        throw new Error(
          `The app-owned event metrics page exceeded the ${EXPORT_PAGE_SIZE}-row governed batch limit.`,
        );
      }
      for (const row of rows) {
        if (hashNeedsComma) payloadHash.update(",");
        payloadHash.update(JSON.stringify(row));
        hashNeedsComma = true;
      }
      sourceRowCount += rows.length;
      await heartbeatRun(appClient, runId, now().toISOString(), {
        source_row_count: sourceRowCount,
        exported_row_count: exportedRowCount,
      });

      if (rows.length > 0) {
        const exported = await databricksClient.upsertEventMetrics({
          rows,
          batchKey,
          exportedAt: startedAt,
        });
        statementId = exported.statementId;
        statementIds.push(exported.statementId);
        exportedRowCount += rows.length;
        externalWriteCommitted = true;
        await heartbeatRun(appClient, runId, now().toISOString(), {
          source_row_count: sourceRowCount,
          exported_row_count: exportedRowCount,
          statement_id: statementId,
          statement_ids: statementIds,
        });
      }

      if (rows.length < EXPORT_PAGE_SIZE) break;
      const lastRow = rows.at(-1);
      if (!lastRow) {
        throw new Error("The app-owned event metrics cursor could not advance.");
      }
      cursorUpdatedAt = lastRow.sourceUpdatedAt;
      cursorEventId = lastRow.eventId;
    }

    payloadHash.update("]");
    payloadSha256 = payloadHash.digest("hex");
    await heartbeatRun(appClient, runId, now().toISOString(), {
      source_row_count: sourceRowCount,
      exported_row_count: exportedRowCount,
      payload_sha256: payloadSha256,
      statement_id: statementId,
      statement_ids: statementIds,
    });

    const audit = await appClient.schema("app").from("audit_logs").insert({
      actor_user_id: actorUserId,
      chapter_id: null,
      action: "databricks_event_metrics_exported",
      target_table: "warehouse_export_runs",
      target_id: runId,
      after_value: {
        batch_key: batchKey,
        destination: "databricks",
        dataset: EXPORT_DATASET,
        source_row_count: sourceRowCount,
        exported_row_count: exportedRowCount,
        payload_sha256: payloadSha256,
        statement_id: statementId,
        statement_ids: statementIds,
        checkpoint_before: checkpointResult.checkpoint,
        checkpoint_after: startedAt,
      },
      reason:
        "Governed downstream aggregate event-metrics export. No member identity or operational authority was exported.",
    });
    if (audit.error) {
      throw new Error(
        `Databricks export completed, but its app audit row failed: ${audit.error.message}`,
      );
    }

    const finalized = await finishRun(appClient, runId, {
      status: "succeeded",
      completedAt: now().toISOString(),
      checkpointAfter: startedAt,
      sourceRowCount,
      exportedRowCount,
      payloadSha256,
      statementId,
      statementIds,
      errorSummary: null,
    });
    if (!finalized) {
      throw new Error(
        "Databricks export completed, but the app-owned run could not be finalized.",
      );
    }
    let replayCleanupWarning = false;
    if (triggerSource === "replay" && retryOfRunId) {
      const replayFailuresResolved = await resolveReplayedFailures(
        appClient,
        retryOfRunId,
        now().toISOString(),
      );
      if (!replayFailuresResolved) {
        replayCleanupWarning = true;
        await tryRecordFailure(
          appClient,
          runId,
          "databricks_replay_cleanup_failed",
          "The replay succeeded, but the prior failure rows remain unresolved.",
          {
            retry_of_run_id: retryOfRunId,
            batch_key: batchKey,
            statement_ids: statementIds,
          },
        );
      }
    }

    return {
      success: true,
      code: "databricks_export_succeeded",
      runId,
      batchKey,
      sourceRows: sourceRowCount,
      exportedRows: exportedRowCount,
      plainEnglishMessage: replayCleanupWarning
        ? "The Databricks replay and checkpoint succeeded, but the prior failure rows still need operator cleanup."
        : sourceRowCount > 0
          ? "Aggregate event metrics were merged into the downstream Databricks read model."
          : "No event metrics changed after the current checkpoint; no Databricks statement was needed.",
    };
  } catch (error) {
    const message = safeErrorMessage(error);
    const runStatus = externalWriteCommitted ? "partial" : "failed";
    const errorCode = externalWriteCommitted
      ? "databricks_export_partial"
      : "databricks_export_failed";
    const failureRecorded = await tryRecordFailure(
      appClient,
      runId,
      errorCode,
      message,
      {
        batch_key: batchKey,
        dataset: EXPORT_DATASET,
        target_table: config.targetTable,
        source_row_count: sourceRowCount,
        exported_row_count: exportedRowCount,
        payload_sha256: payloadSha256,
        statement_id: statementId,
        statement_ids: statementIds,
      },
    );
    const errorSummary = failureRecorded
      ? message
      : `${message} The warehouse export failure register could not be updated.`;
    const finalized = await finishRun(appClient, runId, {
      status: runStatus,
      completedAt: now().toISOString(),
      checkpointAfter: null,
      sourceRowCount,
      exportedRowCount,
      payloadSha256,
      statementId,
      statementIds,
      errorSummary,
    });
    if (!finalized) {
      return failure(
        "server_error",
        `Databricks export failed safely, but its failed run could not be finalized: ${errorSummary}`,
        runId,
      );
    }
    return failure(
      "server_error",
      externalWriteCommitted
        ? `Databricks exported rows but did not complete its app audit/checkpoint: ${errorSummary}`
        : `Databricks export failed safely: ${errorSummary}`,
      runId,
    );
  }
}

function createExportAppClient(
  env: Record<string, string | undefined>,
): AppClient | null {
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
  const result = await client.schema("app")
    .from("staff_role_assignments")
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
  const result = await client.schema("app")
    .from("warehouse_export_runs")
    .select("checkpoint_after")
    .eq("destination", "databricks")
    .eq("dataset", EXPORT_DATASET)
    .eq("status", "succeeded")
    .order("completed_at", { ascending: false })
    .limit(1);
  if (result.error) return { checkpoint: null, error: result.error.message };
  return {
    checkpoint: validDate(result.data?.[0]?.checkpoint_after),
    error: null,
  };
}

async function heartbeatRun(
  client: AppClient,
  runId: string,
  heartbeatAt: string,
  patch: Record<string, unknown> = {},
) {
  const result = await client.schema("app")
    .from("warehouse_export_runs")
    .update({ heartbeat_at: heartbeatAt, ...patch })
    .eq("id", runId)
    .eq("status", "running");
  if (result.error) {
    throw new Error("The warehouse export heartbeat could not be recorded.");
  }
}

async function finishRun(
  client: AppClient,
  runId: string,
  input: {
    status: "succeeded" | "partial" | "failed";
    completedAt: string;
    checkpointAfter: string | null;
    sourceRowCount: number;
    exportedRowCount: number;
    payloadSha256: string | null;
    statementId: string | null;
    statementIds: string[];
    errorSummary: string | null;
  },
) {
  const result = await client.schema("app")
    .from("warehouse_export_runs")
    .update({
      status: input.status,
      completed_at: input.completedAt,
      heartbeat_at: input.completedAt,
      checkpoint_after: input.checkpointAfter,
      source_row_count: input.sourceRowCount,
      exported_row_count: input.exportedRowCount,
      payload_sha256: input.payloadSha256,
      statement_id: input.statementId,
      statement_ids: input.statementIds,
      error_summary: input.errorSummary,
    })
    .eq("id", runId);
  return !result.error;
}

async function resolveReplayedFailures(
  client: AppClient,
  retryOfRunId: string,
  resolvedAt: string,
) {
  const result = await client.schema("app")
    .from("warehouse_export_failures")
    .update({ resolved_at: resolvedAt })
    .eq("run_id", retryOfRunId)
    .is("resolved_at", null);
  return !result.error;
}

async function tryRecordFailure(
  client: AppClient,
  runId: string,
  errorCode: string,
  errorMessage: string,
  sourcePayload: Record<string, unknown>,
) {
  const result = await client.schema("app")
    .from("warehouse_export_failures")
    .insert({
      run_id: runId,
      error_code: errorCode,
      error_message: errorMessage.slice(0, 500),
      source_payload: sourcePayload,
    });
  return !result.error;
}

function normalizeExportRows(value: unknown): DatabricksEventMetric[] {
  if (!Array.isArray(value)) {
    throw new Error("The event metrics export snapshot was malformed.");
  }
  return value.map((row, index) => normalizeExportRow(row, index));
}

function normalizeExportRow(value: unknown, index: number): DatabricksEventMetric {
  if (!isRecord(value)) {
    throw new Error(`Event metrics export row ${index + 1} was malformed.`);
  }
  const eventId = requiredUuid(value.event_id);
  const chapterId = requiredUuid(value.chapter_id);
  const campaignId = nullableUuid(value.campaign_id);
  const title = requiredText(value.title);
  const eventType = requiredText(value.event_type);
  const status = requiredText(value.status);
  const sourceUpdatedAt = validDate(value.source_updated_at);
  const startsAt = nullableDate(value.starts_at);
  const endsAt = nullableDate(value.ends_at);
  const currentRsvpCount = nonnegativeInteger(value.current_rsvp_count);
  const attendanceCount = nonnegativeInteger(value.attendance_count);
  const eligibleMemberCount = nullableNonnegativeInteger(
    value.eligible_member_count,
  );
  const attendanceRate = nullableRate(value.attendance_rate);
  const attendancePointsAwarded = nonnegativeInteger(
    value.attendance_points_awarded,
  );
  if (
    !eventId ||
    !chapterId ||
    campaignId === undefined ||
    !title ||
    !eventType ||
    !status ||
    !sourceUpdatedAt ||
    startsAt === undefined ||
    endsAt === undefined ||
    currentRsvpCount === null ||
    attendanceCount === null ||
    eligibleMemberCount === undefined ||
    attendanceRate === undefined ||
    attendancePointsAwarded === null
  ) {
    throw new Error(`Event metrics export row ${index + 1} failed validation.`);
  }
  return {
    eventId,
    chapterId,
    campaignId,
    title,
    eventType,
    status,
    startsAt,
    endsAt,
    currentRsvpCount,
    attendanceCount,
    eligibleMemberCount,
    attendanceRate,
    attendancePointsAwarded,
    sourceUpdatedAt,
  };
}

function getEnvironment(
  env: Record<string, string | undefined>,
): DatabricksEventMetricsExportConfig["environment"] {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") return "production";
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") return "staging";
  return "local";
}

function disabled(
  environment: DatabricksEventMetricsExportConfig["environment"],
  host: string | null,
  warehouseId: string | null,
  catalog: string | null,
  schema: string | null,
  table: string | null,
  targetTable: string | null,
  reason: string,
): DatabricksEventMetricsExportConfig {
  return {
    enabled: false,
    environment,
    host,
    warehouseId,
    catalog,
    schema,
    table,
    targetTable,
    reason,
  };
}

function normalizeDatabricksHost(value: string | undefined) {
  const raw = value?.trim().replace(/\/+$/, "") ?? "";
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("https://") ? raw : `https://${raw}`);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      !isDatabricksHostname(url.hostname)
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function isDatabricksHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith(".databricks.com") ||
    normalized.endsWith(".azuredatabricks.net");
}

function safeIdentifier(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(normalized) ? normalized : null;
}

function optional(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function validStatementId(value: unknown) {
  if (typeof value !== "string") return null;
  return /^[0-9a-f-]{16,64}$/i.test(value) ? value : null;
}

function validDate(value: unknown) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    return null;
  }
  return new Date(value).toISOString();
}

function nullableDate(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  return validDate(value) ?? undefined;
}

function requiredUuid(value: unknown) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function nullableUuid(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  return requiredUuid(value) ?? undefined;
}

function requiredText(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized ? normalized.slice(0, 500) : null;
}

function nonnegativeInteger(value: unknown) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function nullableNonnegativeInteger(
  value: unknown,
): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  return nonnegativeInteger(value) ?? undefined;
}

function nullableRate(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1
    ? number
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function capitalize(value: string) {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

function safeErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message.slice(0, 500)
    : "Unknown server error.";
}

function isRunningRunConflict(
  error: { message?: string; code?: string } | null,
) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "23505" ||
    message.includes("warehouse_export_runs_one_running") ||
    message.includes("duplicate key");
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function failure(
  code: Extract<
    DatabricksEventMetricsExportResult,
    { success: false }
  >["code"],
  plainEnglishMessage: string,
  runId: string | null = null,
): DatabricksEventMetricsExportResult {
  return { success: false, code, runId, plainEnglishMessage };
}
