"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearDsSecretStepUpSession, verifyDsSecretStepUpWithPassword } from "@/services/admin-integrations-step-up";
import { getIntegrationProvider } from "@/services/admin-integrations-registry";
import { requireDsSecretAdmin } from "@/services/admin-integrations-guard";
import {
  disableIntegrationConnection,
  recordIntegrationAuditEvent,
  runMockConnectionTest,
  upsertIntegrationCredential,
} from "@/services/admin-integrations-store";
import { getLocalActorContext } from "@/services/local-actor-context";
import type {
  IntegrationEnvironment,
  IntegrationProviderKey,
} from "@/shared/types/admin-integrations";

export type DsSecretStepUpActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function verifyDsSecretStepUpAction(
  _previousState: DsSecretStepUpActionState,
  formData: FormData,
): Promise<DsSecretStepUpActionState> {
  const actor = await getLocalActorContext();
  const password = String(formData.get("password") ?? "");
  const result = await verifyDsSecretStepUpWithPassword({
    actor,
    password,
  });

  return {
    status: result.ok ? "success" : "error",
    message: result.message,
  };
}

export async function clearDsSecretStepUpAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  await clearDsSecretStepUpSession();
  redirect(returnTo);
}

export async function submitIntegrationCredentialAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const providerKey = String(formData.get("providerKey") ?? "") as IntegrationProviderKey;
  const environment = String(formData.get("environment") ?? "") as IntegrationEnvironment;
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const guard = await requireDsSecretAdmin({
    actor,
    providerKey,
    environment,
    requireStepUp: true,
  });

  if (!guard.allowed) {
    return redirectWithResult(returnTo, {
      integrationResult: "error",
      integrationMessage: guard.message,
      env: environment,
    });
  }

  const provider = getIntegrationProvider(providerKey);
  const secretValue = String(formData.get("secretValue") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!provider) {
    return redirectWithResult(returnTo, {
      integrationResult: "error",
      integrationMessage: "Unknown provider.",
      env: environment,
    });
  }

  if (!provider.supportedEnvironments.includes(environment)) {
    return redirectWithResult(returnTo, {
      integrationResult: "error",
      integrationMessage: "That environment is not valid for this provider.",
      env: environment,
    });
  }

  if (!secretValue) {
    return redirectWithResult(returnTo, {
      integrationResult: "error",
      integrationMessage: "Enter a credential value. It will be stored server-side only.",
      env: environment,
    });
  }

  if (reason.length < 8) {
    return redirectWithResult(returnTo, {
      integrationResult: "error",
      integrationMessage: "Add a short reason so the audit log explains the change.",
      env: environment,
    });
  }

  if (
    environment === "production" &&
    String(formData.get("productionConfirmation") ?? "") !== "PRODUCTION"
  ) {
    recordIntegrationAuditEvent({
      actor: await getAuditActor(actor),
      action: "production_change_attempted",
      providerKey,
      environment,
      result: "blocked",
      reason: "Production confirmation text was missing.",
      metadataSummary: {},
    });

    return redirectWithResult(returnTo, {
      integrationResult: "error",
      integrationMessage: "Type PRODUCTION to confirm a production credential change.",
      env: environment,
    });
  }

  const metadata = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => key.startsWith("metadata__"))
      .map(([key, value]) => [key.replace("metadata__", ""), String(value).trim()])
      .filter(([, value]) => value.length > 0),
  );
  const scopes = String(formData.get("scopeSummary") ?? "")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  upsertIntegrationCredential({
    actor: await getAuditActor(actor),
    providerKey,
    environment,
    displayName: String(formData.get("displayName") ?? provider.displayName).trim(),
    ownerTeam: String(formData.get("ownerTeam") ?? provider.ownerTeam).trim(),
    scopes,
    metadata,
    secretValue,
    reason,
    expiresAt: normalizeOptionalString(formData.get("expiresAt")),
  });

  redirectWithResult(returnTo, {
    integrationResult: "success",
    integrationMessage: "Credential saved. Only masked metadata is visible after save.",
    env: environment,
  });
}

export async function testIntegrationConnectionAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const providerKey = String(formData.get("providerKey") ?? "") as IntegrationProviderKey;
  const environment = String(formData.get("environment") ?? "") as IntegrationEnvironment;
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const guard = await requireDsSecretAdmin({
    actor,
    providerKey,
    environment,
    requireStepUp: true,
  });

  if (!guard.allowed) {
    return redirectWithResult(returnTo, {
      integrationResult: "error",
      integrationMessage: guard.message,
      env: environment,
    });
  }

  const result = runMockConnectionTest({
    actor: await getAuditActor(actor),
    providerKey,
    environment,
    reason: "Safe mock connection test requested from the integrations console.",
  });

  redirectWithResult(returnTo, {
    integrationResult: result.ok ? "success" : "warning",
    integrationMessage: result.safeMessage,
    env: environment,
  });
}

export async function disableIntegrationConnectionAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const providerKey = String(formData.get("providerKey") ?? "") as IntegrationProviderKey;
  const environment = String(formData.get("environment") ?? "") as IntegrationEnvironment;
  const reason = String(formData.get("reason") ?? "").trim();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const guard = await requireDsSecretAdmin({
    actor,
    providerKey,
    environment,
    requireStepUp: true,
  });

  if (!guard.allowed) {
    return redirectWithResult(returnTo, {
      integrationResult: "error",
      integrationMessage: guard.message,
      env: environment,
    });
  }

  if (reason.length < 8) {
    return redirectWithResult(returnTo, {
      integrationResult: "error",
      integrationMessage: "Add a short reason before disabling this connector.",
      env: environment,
    });
  }

  const updated = disableIntegrationConnection({
    actor: await getAuditActor(actor),
    providerKey,
    environment,
    reason,
  });

  redirectWithResult(returnTo, {
    integrationResult: updated ? "success" : "warning",
    integrationMessage: updated
      ? "Connector disabled. Future sends stay blocked."
      : "No configured connector was found for that environment.",
    env: environment,
  });
}

async function getAuditActor(actor: Awaited<ReturnType<typeof getLocalActorContext>>) {
  const headerStore = await headers();
  return {
    actorUserId: actor.user.id,
    actorEmail: actor.selectedEmail,
    actorRole: actor.audience === "super_admin" ? "super_admin" : "ds_admin",
    ipAddress: headerStore.get("x-forwarded-for"),
    userAgent: headerStore.get("user-agent"),
  } as const;
}

function normalizeOptionalString(value: FormDataEntryValue | null): string | null {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeReturnTo(value: FormDataEntryValue | null): string {
  const normalized = String(value ?? "").trim();

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/admin/integrations";
  }

  return normalized;
}

function redirectWithResult(
  returnTo: string,
  params: {
    integrationResult: "success" | "warning" | "error";
    integrationMessage: string;
    env: string;
  },
) {
  const search = new URLSearchParams(params);
  redirect(`${returnTo}?${search.toString()}`);
}
