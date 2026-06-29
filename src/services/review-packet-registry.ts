import {
  createSupabaseAppClient,
} from "@/lib/supabase-app-client";

type EnvSource = Record<string, string | undefined>;

export type ReviewPacketCategory = "pilot_scope" | "production_launch";

export type ReviewPacketSource = {
  mode: "supabase" | "env";
  reason: string;
  recordCount: number;
};

export type ReviewPacketRecord = {
  id: string;
  category: ReviewPacketCategory;
  recordKey: string;
  value: string;
  reason: string | null;
  actorRole: "admin" | "ds_admin" | "super_admin";
  updatedBy: string;
  updatedAt: string;
};

type PersistedReviewPacketRow = {
  id: string;
  category: ReviewPacketCategory;
  record_key: string;
  value: string;
  reason: string | null;
  actor_role: "admin" | "ds_admin" | "super_admin";
  updated_by: string;
  updated_at: string;
};

type UpsertReviewPacketRpcResult = {
  record_id: string;
  old_value: string | null;
  new_value: string;
  audit_log_id: string;
};

export type ReviewPacketRegistry = {
  source: ReviewPacketSource;
  records: ReviewPacketRecord[];
  values: Map<string, string>;
};

export async function getReviewPacketRegistry(
  input: {
    category: ReviewPacketCategory;
    env?: EnvSource;
  },
  deps: {
    createClient?: typeof createSupabaseAppClient;
  } = {},
): Promise<ReviewPacketRegistry> {
  const createClient = deps.createClient ?? createSupabaseAppClient;
  const { client, persistence } = await createClient(input.env);

  if (!client) {
    return {
      source: {
        mode: "env",
        reason: persistence.reason,
        recordCount: 0,
      },
      records: [],
      values: new Map(),
    };
  }

  const rows = await client.selectRows<PersistedReviewPacketRow>(
    "review_packet_records",
    {
      select:
        "id,category,record_key,value,reason,actor_role,updated_by,updated_at",
      query: {
        category: `eq.${input.category}`,
      },
      order: {
        column: "updated_at",
        ascending: false,
      },
      limit: 100,
    },
  );

  const records = rows.map(mapPersistedRecord);
  const values = new Map(records.map((record) => [record.recordKey, record.value]));

  return {
    source:
      records.length > 0
        ? {
            mode: "supabase",
            reason:
              input.category === "pilot_scope"
                ? `Reading ${records.length} pilot-scope review packet row(s) from Supabase.`
                : `Reading ${records.length} production-launch review packet row(s) from Supabase.`,
            recordCount: records.length,
          }
        : {
            mode: "env",
            reason:
              input.category === "pilot_scope"
                ? "Supabase review packet storage is available, but no pilot-scope rows have been recorded yet."
                : "Supabase review packet storage is available, but no production-launch rows have been recorded yet.",
            recordCount: 0,
          },
    records,
    values,
  };
}

export async function upsertReviewPacketRecord(
  input: {
    category: ReviewPacketCategory;
    recordKey: string;
    value: string;
    reason?: string | null;
    env?: EnvSource;
  },
  deps: {
    createClient?: typeof createSupabaseAppClient;
  } = {},
): Promise<{
  recordId: string;
  oldValue: string | null;
  newValue: string;
  auditLogId: string;
}> {
  const createClient = deps.createClient ?? createSupabaseAppClient;
  const { client } = await createClient(input.env);

  if (!client) {
    throw new Error(
      "Review packet updates require a signed-in Supabase app session.",
    );
  }

  const rows = await client.rpc<UpsertReviewPacketRpcResult[]>(
    "upsert_review_packet_record",
    {
      packet_category: input.category,
      packet_key: input.recordKey,
      packet_value: input.value,
      packet_reason: input.reason ?? null,
    },
  );
  const result = rows[0];

  if (!result) {
    throw new Error("Review packet update did not return a durable result row.");
  }

  return {
    recordId: result.record_id,
    oldValue: result.old_value,
    newValue: result.new_value,
    auditLogId: result.audit_log_id,
  };
}

function mapPersistedRecord(row: PersistedReviewPacketRow): ReviewPacketRecord {
  return {
    id: row.id,
    category: row.category,
    recordKey: row.record_key,
    value: row.value,
    reason: row.reason,
    actorRole: row.actor_role,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}
