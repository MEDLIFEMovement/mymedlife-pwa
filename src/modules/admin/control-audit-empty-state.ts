import type { FeatureFlagEnvironment } from "@/modules/feature-flags";

type ControlPersistenceMode = "memory" | "supabase";

export function getFeatureFlagAuditEmptyStateCopy(
  mode: ControlPersistenceMode,
  environment: FeatureFlagEnvironment,
) {
  if (mode === "supabase") {
    return `No durable feature flag audit rows exist yet for ${environment}. Future saved changes should appear here from Supabase.`;
  }

  return `No in-memory feature flag changes have been made for ${environment} in this local review session.`;
}

export function getThemeAuditEmptyStateCopy(
  mode: ControlPersistenceMode,
  environment: FeatureFlagEnvironment,
) {
  if (mode === "supabase") {
    return `No durable theme audit rows exist yet for ${environment}. Future saved drafts, publishes, rollbacks, and restores should appear here from Supabase.`;
  }

  return `No in-memory theme changes have been made for ${environment} in this local review session.`;
}
