import { randomUUID } from "node:crypto";
import {
  getIntegrationProvider,
  getIntegrationProviders,
} from "@/services/admin-integrations-registry";
import {
  getMaskedSecretHint,
  sanitizeProviderError,
} from "@/services/admin-integrations-redaction";
import type {
  IntegrationAuditAction,
  IntegrationAuditEvent,
  IntegrationConnection,
  IntegrationConnectionStatus,
  IntegrationEnvironment,
  IntegrationProviderKey,
  SecretReference,
} from "@/shared/types/admin-integrations";

type AuditActor = {
  actorUserId: string;
  actorEmail: string;
  actorRole: "ds_admin" | "super_admin";
  ipAddress?: string | null;
  userAgent?: string | null;
};

type StepUpFailureRecord = {
  count: number;
  blockedUntil: string | null;
  lastFailedAt: string | null;
};

type IntegrationStoreState = {
  connections: Map<string, IntegrationConnection>;
  secretReferences: Map<string, SecretReference>;
  secretValues: Map<string, string>;
  auditEvents: IntegrationAuditEvent[];
  stepUpFailures: Map<string, StepUpFailureRecord>;
};

declare global {
  var __MYMEDLIFE_INTEGRATIONS_STORE__: IntegrationStoreState | undefined;
}

const rateLimitMaxFailures = 5;
const rateLimitBlockMinutes = 5;

function getStore(): IntegrationStoreState {
  if (!globalThis.__MYMEDLIFE_INTEGRATIONS_STORE__) {
    globalThis.__MYMEDLIFE_INTEGRATIONS_STORE__ = {
      connections: new Map(),
      secretReferences: new Map(),
      secretValues: new Map(),
      auditEvents: [],
      stepUpFailures: new Map(),
    };
  }

  return globalThis.__MYMEDLIFE_INTEGRATIONS_STORE__;
}

function getConnectionStoreKey(
  providerKey: IntegrationProviderKey,
  environment: IntegrationEnvironment,
): string {
  return `${providerKey}:${environment}`;
}

export function listIntegrationConnections(): IntegrationConnection[] {
  return Array.from(getStore().connections.values()).sort((left, right) => {
    return left.providerKey.localeCompare(right.providerKey) ||
      left.environment.localeCompare(right.environment);
  });
}

export function getIntegrationConnection(
  providerKey: IntegrationProviderKey,
  environment: IntegrationEnvironment,
): IntegrationConnection | null {
  return getStore().connections.get(
    getConnectionStoreKey(providerKey, environment),
  ) ?? null;
}

export function listIntegrationAuditEvents(): IntegrationAuditEvent[] {
  return [...getStore().auditEvents].sort((left, right) => {
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function buildProviderConnectionSummary(
  providerKey: IntegrationProviderKey,
): Array<{
  environment: IntegrationEnvironment;
  status: IntegrationConnectionStatus;
  connection: IntegrationConnection | null;
}> {
  const provider = getIntegrationProvider(providerKey);

  if (!provider) {
    return [];
  }

  return provider.supportedEnvironments.map((environment) => {
    const connection = getIntegrationConnection(providerKey, environment);

    return {
      environment,
      status: connection?.status ?? "not_configured",
      connection,
    };
  });
}

export function upsertIntegrationCredential(input: {
  actor: AuditActor;
  providerKey: IntegrationProviderKey;
  environment: IntegrationEnvironment;
  displayName: string;
  ownerTeam: string;
  scopes: readonly string[];
  metadata: Record<string, string>;
  secretValue: string;
  reason: string;
  expiresAt: string | null;
}): { connection: IntegrationConnection; reference: SecretReference } {
  const provider = getIntegrationProvider(input.providerKey);

  if (!provider) {
    throw new Error("Unknown provider");
  }

  const now = new Date().toISOString();
  const existing = getIntegrationConnection(input.providerKey, input.environment);
  const nextVersion = (existing?.secretVersion ?? 0) + 1;
  const referenceId = randomUUID();
  const maskedHint = getMaskedSecretHint(input.secretValue);
  const reference: SecretReference = {
    id: referenceId,
    providerKey: input.providerKey,
    environment: input.environment,
    secretStoreType: "mock",
    secretStorePathOrKey: `mock://${input.providerKey}/${input.environment}/${referenceId}`,
    secretVersion: nextVersion,
    maskedHint,
    createdBy: input.actor.actorUserId,
    rotatedBy: existing ? input.actor.actorUserId : null,
    rotatedAt: existing ? now : null,
    expiresAt: input.expiresAt,
    disabledAt: null,
  };
  const connection: IntegrationConnection = {
    id: existing?.id ?? randomUUID(),
    providerKey: input.providerKey,
    environment: input.environment,
    status: "configured",
    displayName: input.displayName,
    ownerUserId: input.actor.actorUserId,
    ownerTeam: input.ownerTeam,
    metadata: input.metadata,
    scopes: [...input.scopes],
    secretReferenceId: reference.id,
    maskedSecretHint: maskedHint,
    secretVersion: nextVersion,
    lastTestedAt: existing?.lastTestedAt ?? null,
    lastTestStatus: existing?.lastTestStatus ?? "not_run",
    lastTestMessage: existing?.lastTestMessage ?? null,
    createdBy: existing?.createdBy ?? input.actor.actorUserId,
    updatedBy: input.actor.actorUserId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const store = getStore();
  store.connections.set(
    getConnectionStoreKey(input.providerKey, input.environment),
    connection,
  );
  store.secretReferences.set(reference.id, reference);
  store.secretValues.set(reference.id, input.secretValue);

  recordIntegrationAuditEvent({
    actor: input.actor,
    action: existing ? "secret_rotated" : "secret_added",
    providerKey: input.providerKey,
    environment: input.environment,
    result: "success",
    reason: input.reason,
    metadataSummary: {
      display_name: input.displayName,
      owner_team: input.ownerTeam,
      masked_hint: maskedHint,
      scope_count: String(input.scopes.length),
      version: String(nextVersion),
    },
  });

  if (!existing) {
    recordIntegrationAuditEvent({
      actor: input.actor,
      action: "connector_created",
      providerKey: input.providerKey,
      environment: input.environment,
      result: "success",
      reason: input.reason,
      metadataSummary: {
        display_name: input.displayName,
        provider: provider.displayName,
      },
    });
  } else {
    recordIntegrationAuditEvent({
      actor: input.actor,
      action: "connector_metadata_updated",
      providerKey: input.providerKey,
      environment: input.environment,
      result: "success",
      reason: input.reason,
      metadataSummary: {
        display_name: input.displayName,
        owner_team: input.ownerTeam,
      },
    });
  }

  return { connection, reference };
}

export function disableIntegrationConnection(input: {
  actor: AuditActor;
  providerKey: IntegrationProviderKey;
  environment: IntegrationEnvironment;
  reason: string;
}): IntegrationConnection | null {
  const existing = getIntegrationConnection(input.providerKey, input.environment);

  if (!existing) {
    return null;
  }

  const updated: IntegrationConnection = {
    ...existing,
    status: "disabled",
    updatedAt: new Date().toISOString(),
    updatedBy: input.actor.actorUserId,
  };
  getStore().connections.set(
    getConnectionStoreKey(input.providerKey, input.environment),
    updated,
  );

  if (updated.secretReferenceId) {
    const reference = getStore().secretReferences.get(updated.secretReferenceId);

    if (reference) {
      getStore().secretReferences.set(updated.secretReferenceId, {
        ...reference,
        disabledAt: updated.updatedAt,
      });
    }
  }

  recordIntegrationAuditEvent({
    actor: input.actor,
    action: "connector_disabled",
    providerKey: input.providerKey,
    environment: input.environment,
    result: "success",
    reason: input.reason,
    metadataSummary: {
      masked_hint: updated.maskedSecretHint ?? "none",
      status: updated.status,
    },
  });
  recordIntegrationAuditEvent({
    actor: input.actor,
    action: "secret_disabled",
    providerKey: input.providerKey,
    environment: input.environment,
    result: "success",
    reason: input.reason,
    metadataSummary: {
      secret_reference_id: updated.secretReferenceId ?? "none",
    },
  });

  return updated;
}

export function runMockConnectionTest(input: {
  actor: AuditActor;
  providerKey: IntegrationProviderKey;
  environment: IntegrationEnvironment;
  reason: string;
}): { ok: boolean; safeMessage: string; connection: IntegrationConnection | null } {
  const existing = getIntegrationConnection(input.providerKey, input.environment);

  if (!existing || !existing.secretReferenceId) {
    return {
      ok: false,
      safeMessage: "No credential is configured for this environment yet.",
      connection: null,
    };
  }

  const rawSecret = getStore().secretValues.get(existing.secretReferenceId);

  if (!rawSecret) {
    return {
      ok: false,
      safeMessage: "The secret reference exists, but no raw value is available in the mock store.",
      connection: null,
    };
  }

  let ok = true;
  let safeMessage = "Mock connection succeeded with a safe read-only health check.";

  try {
    const lowered = rawSecret.toLowerCase();

    if (lowered.includes("timeout")) {
      throw new Error("Provider timeout while testing Bearer sk-123456789 secret");
    }

    if (lowered.includes("invalid")) {
      throw new Error("Invalid API key provided to provider");
    }

    if (lowered.includes("denied")) {
      throw new Error("Insufficient scope for refresh_token abcdefghijklmnop");
    }
  } catch (error) {
    ok = false;
    safeMessage = sanitizeProviderError(error).detail;
  }

  const updated: IntegrationConnection = {
    ...existing,
    status: ok ? existing.status : "error",
    lastTestedAt: new Date().toISOString(),
    lastTestStatus: ok ? "success" : "failed",
    lastTestMessage: safeMessage,
    updatedAt: new Date().toISOString(),
    updatedBy: input.actor.actorUserId,
  };
  getStore().connections.set(
    getConnectionStoreKey(input.providerKey, input.environment),
    updated,
  );
  recordIntegrationAuditEvent({
    actor: input.actor,
    action: "connector_tested",
    providerKey: input.providerKey,
    environment: input.environment,
    result: ok ? "success" : "failure",
    reason: input.reason,
    metadataSummary: {
      status: updated.lastTestStatus,
      message: safeMessage,
    },
  });

  return { ok, safeMessage, connection: updated };
}

export function recordIntegrationAuditEvent(input: {
  actor: AuditActor;
  action: IntegrationAuditAction;
  providerKey: IntegrationProviderKey | null;
  environment: IntegrationEnvironment | null;
  result: "success" | "failure" | "blocked";
  reason: string;
  metadataSummary?: Record<string, string>;
}): IntegrationAuditEvent {
  const event: IntegrationAuditEvent = {
    id: randomUUID(),
    actorUserId: input.actor.actorUserId,
    actorEmail: input.actor.actorEmail,
    actorRole: input.actor.actorRole,
    action: input.action,
    providerKey: input.providerKey,
    environment: input.environment,
    result: input.result,
    reason: input.reason,
    correlationId: randomUUID(),
    ipAddress: input.actor.ipAddress ?? null,
    userAgent: input.actor.userAgent ?? null,
    createdAt: new Date().toISOString(),
    metadataSummary: input.metadataSummary ?? {},
  };
  getStore().auditEvents.unshift(event);
  return event;
}

export function getStepUpFailureState(
  key: string,
  now = new Date(),
): StepUpFailureRecord {
  const record = getStore().stepUpFailures.get(key) ?? {
    count: 0,
    blockedUntil: null,
    lastFailedAt: null,
  };

  if (record.blockedUntil && record.blockedUntil <= now.toISOString()) {
    const reset = { count: 0, blockedUntil: null, lastFailedAt: null };
    getStore().stepUpFailures.set(key, reset);
    return reset;
  }

  return record;
}

export function recordStepUpFailure(key: string): StepUpFailureRecord {
  const now = new Date();
  const previous = getStepUpFailureState(key, now);
  const nextCount = previous.count + 1;
  const blockedUntil =
    nextCount >= rateLimitMaxFailures
      ? new Date(now.getTime() + rateLimitBlockMinutes * 60 * 1000).toISOString()
      : null;
  const next = {
    count: nextCount,
    blockedUntil,
    lastFailedAt: now.toISOString(),
  };
  getStore().stepUpFailures.set(key, next);
  return next;
}

export function clearStepUpFailures(key: string) {
  getStore().stepUpFailures.delete(key);
}

export function getIntegrationProviderCards() {
  return getIntegrationProviders().map((provider) => ({
    provider,
    connections: buildProviderConnectionSummary(provider.key),
  }));
}

export function resetIntegrationStoreForTests() {
  globalThis.__MYMEDLIFE_INTEGRATIONS_STORE__ = {
    connections: new Map(),
    secretReferences: new Map(),
    secretValues: new Map(),
    auditEvents: [],
    stepUpFailures: new Map(),
  };
}
