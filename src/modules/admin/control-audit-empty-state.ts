import type { FeatureFlagEnvironment } from "@/modules/feature-flags";

type ControlPersistenceMode = "memory" | "supabase";
type ControlPersistenceAvailability =
  | "disabled"
  | "unavailable"
  | "missing_session"
  | "ready";
type ControlPersistenceInput =
  | ControlPersistenceMode
  | {
      mode: ControlPersistenceMode;
      status?: "fallback" | "ready";
      availability?: ControlPersistenceAvailability;
      requested?: boolean;
    };

function resolvePersistence(input: ControlPersistenceInput) {
  if (typeof input === "string") {
    return {
      mode: input,
      availability: input === "supabase" ? "ready" : "disabled",
    } as const;
  }

  return {
    mode: input.mode,
    availability:
      input.availability ??
      (input.mode === "supabase"
        ? "ready"
        : input.requested
          ? "missing_session"
          : "disabled"),
  } as const;
}

export function getFeatureFlagAuditEmptyStateCopy(
  input: ControlPersistenceInput,
  environment: FeatureFlagEnvironment,
) {
  const persistence = resolvePersistence(input);

  if (persistence.availability === "missing_session") {
    return `No durable feature flag audit rows are visible for ${environment} because this reviewer session is not signed in to the Supabase control layer yet. Sign in through the approved myMEDLIFE auth path before treating this lane as durable.`;
  }

  if (persistence.availability === "unavailable") {
    return `No durable feature flag audit rows are visible for ${environment} because the Supabase control layer is requested but not available in this environment yet.`;
  }

  if (persistence.mode === "supabase") {
    return `No durable feature flag audit rows exist yet for ${environment}. Future saved changes should appear here from Supabase.`;
  }

  return `No in-memory feature flag changes have been made for ${environment} in this local review session.`;
}

export function getThemeAuditEmptyStateCopy(
  input: ControlPersistenceInput,
  environment: FeatureFlagEnvironment,
) {
  const persistence = resolvePersistence(input);

  if (persistence.availability === "missing_session") {
    return `No durable theme audit rows are visible for ${environment} because this reviewer session is not signed in to the Supabase control layer yet. Sign in through the approved myMEDLIFE auth path before treating this lane as durable.`;
  }

  if (persistence.availability === "unavailable") {
    return `No durable theme audit rows are visible for ${environment} because the Supabase control layer is requested but not available in this environment yet.`;
  }

  if (persistence.mode === "supabase") {
    return `No durable theme audit rows exist yet for ${environment}. Future saved drafts, publishes, rollbacks, and restores should appear here from Supabase.`;
  }

  return `No in-memory theme changes have been made for ${environment} in this local review session.`;
}
