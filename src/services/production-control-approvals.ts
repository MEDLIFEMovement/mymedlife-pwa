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
