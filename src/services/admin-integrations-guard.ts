import type { LocalActorContext } from "@/services/local-actor-context";
import { getIntegrationProvider } from "@/services/admin-integrations-registry";
import {
  getDsSecretStepUpState,
  needsFreshProductionStepUp,
} from "@/services/admin-integrations-step-up";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import type {
  DsSecretStepUpState,
  IntegrationEnvironment,
  IntegrationProviderKey,
} from "@/shared/types/admin-integrations";

export type DsSecretAdminGuard = {
  allowed: boolean;
  canRenderLockedState: boolean;
  requiresStepUp: boolean;
  title: string;
  message: string;
  stepUpState: DsSecretStepUpState;
};

function getUnauthorizedState(message: string): DsSecretAdminGuard {
  return {
    allowed: false,
    canRenderLockedState: false,
    requiresStepUp: false,
    title: "Integrations security area is restricted",
    message,
    stepUpState: {
      isVerified: false,
      status: "missing",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: 0,
      blockedUntil: null,
      message,
    },
  };
}

export async function requireDsSecretAdmin(options: {
  actor: LocalActorContext;
  providerKey?: IntegrationProviderKey;
  environment?: IntegrationEnvironment;
  requireStepUp?: boolean;
}): Promise<DsSecretAdminGuard> {
  const { actor, environment, providerKey } = options;
  const requireStepUp = options.requireStepUp ?? true;
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily !== "ds_admin" && surfaceFamily !== "super_admin") {
    return getUnauthorizedState(
      "Only DS Admin and Super Admin can open the integrations security area.",
    );
  }

  if (
    actor.identitySource !== "local_auth_session" ||
    actor.authSessionStatus !== "signed_in"
  ) {
    return {
      allowed: false,
      canRenderLockedState: true,
      requiresStepUp: true,
      title: "A signed-in DS admin session is required",
      message:
        "This secure area only opens for a signed-in local DS Admin or Super Admin auth session.",
      stepUpState: await getDsSecretStepUpState(actor),
    };
  }

  if (providerKey && !getIntegrationProvider(providerKey)) {
    return getUnauthorizedState("This provider is not part of the DS integrations catalog.");
  }

  if (
    providerKey &&
    environment &&
    getIntegrationProvider(providerKey)?.supportedEnvironments.includes(environment) ===
      false
  ) {
    return getUnauthorizedState(
      "That environment is not available for this provider in the integrations console.",
    );
  }

  const stepUpState = await getDsSecretStepUpState(actor);

  if (!requireStepUp) {
    return {
      allowed: true,
      canRenderLockedState: false,
      requiresStepUp: false,
      title: "Access granted",
      message: "Role and session are valid for this DS admin lane.",
      stepUpState,
    };
  }

  if (!stepUpState.isVerified) {
    return {
      allowed: false,
      canRenderLockedState: true,
      requiresStepUp: true,
      title: "Step-up authentication required",
      message: stepUpState.message,
      stepUpState,
    };
  }

  if (environment === "production" && needsFreshProductionStepUp(stepUpState)) {
    return {
      allowed: false,
      canRenderLockedState: true,
      requiresStepUp: true,
      title: "Fresh step-up required for production",
      message:
        "Production credential actions need a fresh step-up confirmation before continuing.",
      stepUpState: {
        ...stepUpState,
        isVerified: false,
        status: "expired",
        message:
          "Production credential actions need a fresh step-up confirmation before continuing.",
      },
    };
  }

  return {
    allowed: true,
    canRenderLockedState: false,
    requiresStepUp: false,
    title: "Access granted",
    message: "Role, auth session, and step-up are valid for this secure integrations area.",
    stepUpState,
  };
}
