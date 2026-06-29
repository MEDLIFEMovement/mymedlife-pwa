import {
  createSupabaseControlClient,
  type SupabaseControlClient,
} from "@/lib/supabase-control-client";

export type ProductionControlApprovalScope =
  | "feature_flag"
  | "theme_publish"
  | "luma_write"
  | "external_integration"
  | "pilot_gate"
  | "rollback";

export type ProductionControlApprovalRecord = {
  id: string;
  environment: "production";
  scope: ProductionControlApprovalScope;
  targetKey: string;
  approvalReference: string;
  reason: string;
  approvedBy: string;
  expiresAt: string | null;
  createdAt: string;
};

type PersistedProductionControlApprovalRow = {
  id: string;
  environment: "production";
  scope: ProductionControlApprovalScope;
  target_key: string;
  approval_reference: string;
  reason: string;
  approved_by: string;
  expires_at: string | null;
  created_at: string;
};

type EnvSource = Record<string, string | undefined>;

export async function recordProductionControlApproval(input: {
  scope: ProductionControlApprovalScope;
  targetKey: string;
  approvalReference: string;
  reason: string;
  expiresAt?: string | null;
  client?: SupabaseControlClient | null;
  env?: EnvSource;
}) {
  const client =
    input.client ?? (await createSupabaseControlClient(input.env)).client;

  if (!client) {
    throw new Error(
      "Production control approvals require Supabase-backed control storage.",
    );
  }

  const approvalReference = input.approvalReference.trim();
  const reason = input.reason.trim();
  const targetKey = input.targetKey.trim();

  if (approvalReference.length < 4) {
    throw new Error(
      "Production control approvals require an approval reference.",
    );
  }

  if (reason.length < 12) {
    throw new Error(
      "Production control approvals require a clear reason.",
    );
  }

  if (targetKey.length < 3) {
    throw new Error(
      "Production control approvals require a target key.",
    );
  }

  await client.rpc<unknown>("record_production_control_approval", {
    approval_environment: "production",
    approval_scope: input.scope,
    target_key: targetKey,
    approval_reference: approvalReference,
    reason,
    expires_at: input.expiresAt ?? null,
  });
}

export async function listRecentProductionControlApprovals(input: {
  scopes?: ProductionControlApprovalScope[];
  limit?: number;
  env?: EnvSource;
} = {}): Promise<ProductionControlApprovalRecord[]> {
  const { client } = await createSupabaseControlClient(input.env);

  if (!client) {
    return [];
  }

  const rows = await client.selectRows<PersistedProductionControlApprovalRow>(
    "production_control_approvals",
    {
      select:
        "id,environment,scope,target_key,approval_reference,reason,approved_by,expires_at,created_at",
      query: {
        environment: "eq.production",
      },
      order: { column: "created_at", ascending: false },
      limit: Math.max(input.limit ?? 10, 1),
    },
  );

  return rows
    .filter((row) =>
      input.scopes?.length ? input.scopes.includes(row.scope) : true,
    )
    .slice(0, input.limit ?? 10)
    .map((row) => ({
      id: row.id,
      environment: row.environment,
      scope: row.scope,
      targetKey: row.target_key,
      approvalReference: row.approval_reference,
      reason: row.reason,
      approvedBy: row.approved_by,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));
}
