import { createHmac, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  clearStepUpFailures,
  getStepUpFailureState,
  recordIntegrationAuditEvent,
  recordStepUpFailure,
} from "@/services/admin-integrations-store";
import type { LocalActorContext } from "@/services/local-actor-context";
import type {
  DsSecretStepUpPayload,
  DsSecretStepUpState,
  StepUpMethod,
} from "@/shared/types/admin-integrations";

export const dsSecretStepUpCookieName = "mymedlife_ds_secret_step_up";

const stepUpWindowMinutes = 10;
const productionFreshWindowMinutes = 5;

function getStepUpSecret(env: Record<string, string | undefined> = process.env): string {
  return env.MYMEDLIFE_LOCAL_STEP_UP_SECRET ?? "mymedlife-local-step-up-secret";
}

function encodePayload(payload: DsSecretStepUpPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getStepUpSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function decodePayload(value: string): DsSecretStepUpPayload | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function getStepUpFailureKey(actor: LocalActorContext): string {
  return actor.user.id;
}

export async function getDsSecretStepUpState(
  actor: LocalActorContext,
): Promise<DsSecretStepUpState> {
  const failureState = getStepUpFailureState(getStepUpFailureKey(actor));
  const rawCookie = await readStepUpCookieValue();

  if (failureState.blockedUntil) {
    return {
      isVerified: false,
      status: "blocked",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: failureState.blockedUntil,
      failureCount: failureState.count,
      blockedUntil: failureState.blockedUntil,
      message: "Too many failed step-up attempts. Wait for the cooldown before trying again.",
    };
  }

  if (!rawCookie) {
    return {
      isVerified: false,
      status: "missing",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: failureState.count,
      blockedUntil: null,
      message: "Step-up authentication is required before entering the integrations security area.",
    };
  }

  const [encodedPayload, signature] = rawCookie.split(".");

  if (!encodedPayload || !signature || signPayload(encodedPayload) !== signature) {
    return {
      isVerified: false,
      status: "invalid",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: failureState.count,
      blockedUntil: null,
      message: "The step-up session is invalid and must be re-verified.",
    };
  }

  const payload = decodePayload(encodedPayload);

  if (!payload || payload.userId !== actor.user.id || payload.email !== actor.selectedEmail) {
    return {
      isVerified: false,
      status: "invalid",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: failureState.count,
      blockedUntil: null,
      message: "The step-up session does not match the current signed-in DS admin account.",
    };
  }

  if (payload.expiresAt <= new Date().toISOString()) {
    return {
      isVerified: false,
      status: "expired",
      method: payload.method,
      sessionId: payload.sessionId,
      verifiedAt: payload.verifiedAt,
      expiresAt: payload.expiresAt,
      failureCount: failureState.count,
      blockedUntil: null,
      message: "The step-up session expired. Re-authenticate to continue with secure actions.",
    };
  }

  return {
    isVerified: true,
    status: "verified",
    method: payload.method,
    sessionId: payload.sessionId,
    verifiedAt: payload.verifiedAt,
    expiresAt: payload.expiresAt,
    failureCount: failureState.count,
    blockedUntil: null,
    message: "Step-up is active for this DS admin session.",
  };
}

async function readStepUpCookieValue(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(dsSecretStepUpCookieName)?.value ?? null;
  } catch {
    return null;
  }
}

export async function verifyDsSecretStepUpWithPassword(input: {
  actor: LocalActorContext;
  password: string;
  method?: StepUpMethod;
}): Promise<{
  ok: boolean;
  state: DsSecretStepUpState;
  message: string;
}> {
  const method = input.method ?? "local_password_reauth";
  const actor = input.actor;

  if (
    actor.identitySource !== "local_auth_session" ||
    actor.authSessionStatus !== "signed_in"
  ) {
    const state = await getDsSecretStepUpState(actor);
    return {
      ok: false,
      state,
      message: "Sign in with a local DS Admin or Super Admin seeded account before step-up.",
    };
  }

  const existingState = await getDsSecretStepUpState(actor);

  if (existingState.status === "blocked") {
    return {
      ok: false,
      state: existingState,
      message: existingState.message,
    };
  }

  const { client, config } = await createLocalSupabaseServerClient();

  if (!client) {
    return {
      ok: false,
      state: existingState,
      message: config.reason,
    };
  }

  const session = await getAuthSessionState(client);

  if (session.status !== "signed_in" || !session.user) {
    return {
      ok: false,
      state: existingState,
      message: "No signed-in local Supabase Auth session is active for step-up.",
    };
  }

  const { error } = await client.auth.signInWithPassword({
    email: session.user.email,
    password: input.password,
  });

  if (error) {
    const failure = recordStepUpFailure(getStepUpFailureKey(actor));
    recordIntegrationAuditEvent({
      actor: {
        actorUserId: actor.user.id,
        actorEmail: actor.selectedEmail,
        actorRole: actor.audience === "super_admin" ? "super_admin" : "ds_admin",
      },
      action: "step_up_failed",
      providerKey: null,
      environment: null,
      result: "failure",
      reason: "Local password re-authentication failed.",
      metadataSummary: {
        failure_count: String(failure.count),
        blocked_until: failure.blockedUntil ?? "none",
      },
    });
    return {
      ok: false,
      state: await getDsSecretStepUpState(actor),
      message: "The local password check failed. No secure integration content was opened.",
    };
  }

  clearStepUpFailures(getStepUpFailureKey(actor));
  const verifiedAt = new Date();
  const expiresAt = new Date(
    verifiedAt.getTime() + stepUpWindowMinutes * 60 * 1000,
  );
  const payload: DsSecretStepUpPayload = {
    userId: actor.user.id,
    email: actor.selectedEmail,
    method,
    sessionId: randomUUID(),
    verifiedAt: verifiedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const encodedPayload = encodePayload(payload);
  const cookieValue = `${encodedPayload}.${signPayload(encodedPayload)}`;
  const cookieStore = await cookies();
  cookieStore.set(dsSecretStepUpCookieName, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
  recordIntegrationAuditEvent({
    actor: {
      actorUserId: actor.user.id,
      actorEmail: actor.selectedEmail,
      actorRole: actor.audience === "super_admin" ? "super_admin" : "ds_admin",
    },
    action: "step_up_success",
    providerKey: null,
    environment: null,
    result: "success",
    reason: "Step-up granted for the DS/Admin integrations console.",
    metadataSummary: {
      method,
      expires_at: payload.expiresAt,
    },
  });
  recordIntegrationAuditEvent({
    actor: {
      actorUserId: actor.user.id,
      actorEmail: actor.selectedEmail,
      actorRole: actor.audience === "super_admin" ? "super_admin" : "ds_admin",
    },
    action: "integrations_console_viewed",
    providerKey: null,
    environment: null,
    result: "success",
    reason: "Step-up granted and secure console access opened.",
    metadataSummary: {
      session_id: payload.sessionId,
    },
  });

  return {
    ok: true,
    state: await getDsSecretStepUpState(actor),
    message: "Step-up confirmed. Secure integrations content is now visible for this session.",
  };
}

export async function clearDsSecretStepUpSession() {
  const cookieStore = await cookies();
  cookieStore.delete(dsSecretStepUpCookieName);
}

export function needsFreshProductionStepUp(
  state: DsSecretStepUpState,
  now = new Date(),
): boolean {
  if (!state.isVerified || !state.verifiedAt) {
    return true;
  }

  const verifiedAt = new Date(state.verifiedAt);

  return now.getTime() - verifiedAt.getTime() >
    productionFreshWindowMinutes * 60 * 1000;
}
