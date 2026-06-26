import type { LocalActorContext } from "@/services/local-actor-context";
import { getIntegrationProvider } from "@/services/admin-integrations-registry";
import { requireDsSecretAdmin } from "@/services/admin-integrations-guard";
import {
  getIntegrationConnection,
  getIntegrationProviderCards,
  listIntegrationAuditEvents,
} from "@/services/admin-integrations-store";
import type {
  IntegrationAuditEvent,
  IntegrationEnvironment,
  IntegrationProvider,
  IntegrationProviderKey,
} from "@/shared/types/admin-integrations";

export type AdminIntegrationsWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  nextStep: {
    href: string;
    label: string;
  };
  guard: Awaited<ReturnType<typeof requireDsSecretAdmin>>;
  providerCards: Array<{
    provider: IntegrationProvider;
    configuredCount: number;
    errorCount: number;
    latestTestedAt: string | null;
    environments: Array<{
      environment: IntegrationEnvironment;
      href: string;
      status: string;
      maskedHint: string | null;
      lastTestStatus: string;
    }>;
  }>;
  auditCount: number;
};

export type AdminIntegrationProviderWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  provider: IntegrationProvider | null;
  providerKey: IntegrationProviderKey | null;
  nextStep: {
    href: string;
    label: string;
  };
  guard: Awaited<ReturnType<typeof requireDsSecretAdmin>>;
  environments: Array<{
    environment: IntegrationEnvironment;
    status: string;
    connectionId: string | null;
    displayName: string;
    ownerTeam: string;
    maskedHint: string | null;
    secretVersion: string;
    lastTestedAt: string;
    lastTestStatus: string;
    lastTestMessage: string;
    scopes: readonly string[];
    metadataRows: Array<{ label: string; value: string }>;
  }>;
  auditRows: IntegrationAuditEvent[];
  resultBanner:
    | {
        tone: "success" | "warning" | "error";
        title: string;
        message: string;
      }
    | null;
};

export type AdminIntegrationAuditWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  nextStep: {
    href: string;
    label: string;
  };
  guard: Awaited<ReturnType<typeof requireDsSecretAdmin>>;
  rows: IntegrationAuditEvent[];
};

export async function getAdminIntegrationsWorkspace(
  actor: LocalActorContext,
): Promise<AdminIntegrationsWorkspace> {
  const guard = await requireDsSecretAdmin({
    actor,
    requireStepUp: true,
  });
  const providerCards = getIntegrationProviderCards().map(
    ({ connections, provider }) => ({
      provider,
      configuredCount: connections.filter((entry) => entry.status === "configured").length,
      errorCount: connections.filter((entry) => entry.status === "error").length,
      latestTestedAt:
        connections
          .map((entry) => entry.connection?.lastTestedAt ?? null)
          .filter(Boolean)
          .sort()
          .at(-1) ?? null,
      environments: connections.map((entry) => ({
        environment: entry.environment,
        href: `/admin/integrations/${provider.key}`,
        status: entry.status.replaceAll("_", " "),
        maskedHint: entry.connection?.maskedSecretHint ?? null,
        lastTestStatus: entry.connection?.lastTestStatus ?? "not_run",
      })),
    }),
  );

  return {
    canReadWorkspace: guard.allowed,
    title: "Integrations & API Keys",
    summary:
      "DS Admin controls provider metadata, masked credential posture, safe connection tests, and audit history without exposing raw secrets.",
    nextStep: {
      href: "/admin/integrations/audit",
      label: "Open security audit",
    },
    guard,
    providerCards,
    auditCount: listIntegrationAuditEvents().length,
  };
}

export async function getAdminIntegrationProviderWorkspace(
  actor: LocalActorContext,
  providerKey: string,
  search?: {
    integrationResult?: string;
    integrationMessage?: string;
    env?: string;
  },
): Promise<AdminIntegrationProviderWorkspace> {
  const normalizedProvider = getIntegrationProvider(providerKey);
  const guard = await requireDsSecretAdmin({
    actor,
    providerKey: normalizedProvider?.key,
    requireStepUp: true,
  });

  if (!normalizedProvider) {
    return {
      canReadWorkspace: false,
      title: "Provider not found",
      summary: "This provider is not part of the current DS integrations catalog.",
      provider: null,
      providerKey: null,
      nextStep: {
        href: "/admin/integrations",
        label: "Back to integrations",
      },
      guard,
      environments: [],
      auditRows: [],
      resultBanner: null,
    };
  }

  const auditRows = listIntegrationAuditEvents().filter(
    (row) => row.providerKey === normalizedProvider.key,
  );

  return {
    canReadWorkspace: guard.allowed,
    title: `${normalizedProvider.displayName} configuration`,
    summary:
      "Credentials stay write-only. After save, this page only shows masked hints, metadata, safe test status, and audit evidence.",
    provider: normalizedProvider,
    providerKey: normalizedProvider.key,
    nextStep: {
      href: "/admin/integrations",
      label: "Back to integrations",
    },
    guard,
    environments: normalizedProvider.supportedEnvironments.map((environment) => {
      const live = getIntegrationConnection(normalizedProvider.key, environment);

      return {
        environment,
        status: live?.status.replaceAll("_", " ") ?? "not configured",
        connectionId: live?.id ?? null,
        displayName: live?.displayName ?? normalizedProvider.displayName,
        ownerTeam: live?.ownerTeam ?? normalizedProvider.ownerTeam,
        maskedHint: live?.maskedSecretHint ?? null,
        secretVersion: live?.secretVersion ? `v${live.secretVersion}` : "none",
        lastTestedAt: live?.lastTestedAt ?? "Not tested yet",
        lastTestStatus: live?.lastTestStatus ?? "not_run",
        lastTestMessage: live?.lastTestMessage ?? "No safe test result yet.",
        scopes: live?.scopes ?? [],
        metadataRows: Object.entries(live?.metadata ?? {}).map(([label, value]) => ({
          label: label.replaceAll("_", " "),
          value,
        })),
      };
    }),
    auditRows,
    resultBanner: getResultBanner(search),
  };
}

export async function getAdminIntegrationAuditWorkspace(
  actor: LocalActorContext,
): Promise<AdminIntegrationAuditWorkspace> {
  const guard = await requireDsSecretAdmin({
    actor,
    requireStepUp: true,
  });

  return {
    canReadWorkspace: guard.allowed,
    title: "Integrations security audit",
    summary:
      "Every secure integration action stays visible here with actor, environment, result, reason, and safe metadata only.",
    nextStep: {
      href: "/admin/integrations",
      label: "Back to integrations",
    },
    guard,
    rows: listIntegrationAuditEvents(),
  };
}

function getResultBanner(search?: {
  integrationResult?: string;
  integrationMessage?: string;
  env?: string;
}) {
  if (!search?.integrationResult || !search.integrationMessage) {
    return null;
  }

  if (search.integrationResult === "success") {
    return {
      tone: "success" as const,
      title: `${search.env ?? "Environment"} updated`,
      message: search.integrationMessage,
    };
  }

  if (search.integrationResult === "warning") {
    return {
      tone: "warning" as const,
      title: `${search.env ?? "Environment"} needs review`,
      message: search.integrationMessage,
    };
  }

  return {
    tone: "error" as const,
    title: `${search.env ?? "Environment"} blocked`,
    message: search.integrationMessage,
  };
}
