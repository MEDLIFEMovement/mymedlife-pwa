import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseControlClient } from "@/lib/supabase-control-client";
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

type DurableStepUpSessionRow = {
  id: string;
  user_id: string;
  method: StepUpMethod;
  verified_at: string;
  expires_at: string;
  revoked_at: string | null;
};

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

function buildStepUpState(
  input: Pick<
    DsSecretStepUpState,
    | "isVerified"
    | "status"
    | "method"
    | "sessionId"
    | "verifiedAt"
    | "expiresAt"
    | "blockedUntil"
    | "message"
  > & { failureCount: number },
): DsSecretStepUpState {
  return {
    isVerified: input.isVerified,
    status: input.status,
    method: input.method,
    sessionId: input.sessionId,
    verifiedAt: input.verifiedAt,
    expiresAt: input.expiresAt,
    failureCount: input.failureCount,
    blockedUntil: input.blockedUntil,
    message: input.message,
  };
}

export async function getDsSecretStepUpState(
  actor: LocalActorContext,
): Promise<DsSecretStepUpState> {
  const failureState = getStepUpFailureState(getStepUpFailureKey(actor));
  const rawCookie = await readStepUpCookieValue();

  if (failureState.blockedUntil) {
    return buildStepUpState({
      isVerified: false,
      status: "blocked",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: failureState.blockedUntil,
      failureCount: failureState.count,
      blockedUntil: failureState.blockedUntil,
      message: "Too many failed step-up attempts. Wait for the cooldown before trying again.",
    });
  }

  if (!rawCookie) {
    return buildStepUpState({
      isVerified: false,
      status: "missing",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: failureState.count,
      blockedUntil: null,
      message: "Step-up authentication is required before entering the integrations security area.",
    });
  }

  const [encodedPayload, signature] = rawCookie.split(".");

  if (!encodedPayload || !signature || signPayload(encodedPayload) !== signature) {
    return buildStepUpState({
      isVerified: false,
      status: "invalid",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: failureState.count,
      blockedUntil: null,
      message: "The step-up session is invalid and must be re-verified.",
    });
  }

  const payload = decodePayload(encodedPayload);

  if (!payload || payload.userId !== actor.user.id || payload.email !== actor.selectedEmail) {
    return buildStepUpState({
      isVerified: false,
      status: "invalid",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: failureState.count,
      blockedUntil: null,
      message: "The step-up session does not match the current signed-in DS admin account.",
    });
  }

  if (payload.expiresAt <= new Date().toISOString()) {
    return buildStepUpState({
      isVerified: false,
      status: "expired",
      method: payload.method,
      sessionId: payload.sessionId,
      verifiedAt: payload.verifiedAt,
      expiresAt: payload.expiresAt,
      failureCount: failureState.count,
      blockedUntil: null,
      message: "The step-up session expired. Re-authenticate to continue with secure actions.",
    });
  }

  const durableSession = await readDurableStepUpSession(actor, payload.sessionId);

  if (!durableSession.ok) {
    return buildStepUpState({
      isVerified: false,
      status: durableSession.status,
      method: payload.method,
      sessionId: payload.sessionId,
      verifiedAt: payload.verifiedAt,
      expiresAt: payload.expiresAt,
      failureCount: failureState.count,
      blockedUntil: null,
      message: durableSession.message,
    });
  }

  if (durableSession.row.method !== payload.method) {
    return buildStepUpState({
      isVerified: false,
      status: "invalid",
      method: payload.method,
      sessionId: payload.sessionId,
      verifiedAt: payload.verifiedAt,
      expiresAt: payload.expiresAt,
      failureCount: failureState.count,
      blockedUntil: null,
      message: "The durable step-up session does not match the current verification method.",
    });
  }

  return buildStepUpState({
    isVerified: true,
    status: "verified",
    method: durableSession.row.method,
    sessionId: durableSession.row.id,
    verifiedAt: durableSession.row.verified_at,
    expiresAt: durableSession.row.expires_at,
    failureCount: failureState.count,
    blockedUntil: null,
    message: "Step-up is active for this DS admin session.",
  });
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
  const durableSession = await recordDurableStepUpSession(method);

  if (!durableSession.ok) {
    const state = buildStepUpState({
      isVerified: false,
      status: "invalid",
      method,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: 0,
      blockedUntil: null,
      message: durableSession.message,
    });
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
      reason: durableSession.message,
      metadataSummary: {
        method,
      },
    });
    return {
      ok: false,
      state,
      message: durableSession.message,
    };
  }

  const verifiedAt = new Date();
  const expiresAt = new Date(
    verifiedAt.getTime() + stepUpWindowMinutes * 60 * 1000,
  );
  const payload: DsSecretStepUpPayload = {
    userId: actor.user.id,
    email: actor.selectedEmail,
    method,
    sessionId: durableSession.sessionId,
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

async function recordDurableStepUpSession(
  method: StepUpMethod,
): Promise<
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      message: string;
    }
> {
  const { client, persistence } = await createSupabaseControlClient();

  if (!client) {
    return {
      ok: false,
      message:
        persistence.reason.includes("in-memory")
          ? "Step-up stays locked until Supabase-backed control storage is active for this review environment."
          : "Step-up stays locked until the Supabase control layer is available for the current reviewer session.",
    };
  }

  try {
    const sessionId = await client.rpc<string>("record_admin_step_up_session", {
      method,
      ttl_minutes: stepUpWindowMinutes,
    });

    if (!sessionId) {
      return {
        ok: false,
        message:
          "The durable step-up session could not be recorded. Re-authenticate after the Supabase control layer is healthy.",
      };
    }

    return {
      ok: true,
      sessionId,
    };
  } catch {
    return {
      ok: false,
      message:
        "The durable step-up session could not be recorded. Re-authenticate after the Supabase control layer is healthy.",
    };
  }
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

async function readDurableStepUpSession(
  actor: LocalActorContext,
  sessionId: string,
): Promise<
  | {
      ok: true;
      row: DurableStepUpSessionRow;
    }
  | {
      ok: false;
      status: "invalid" | "expired";
      message: string;
    }
> {
  const { client } = await createSupabaseControlClient();

  if (!client) {
    return {
      ok: false,
      status: "invalid",
      message:
        "The durable step-up session could not be confirmed. Re-authenticate after the Supabase control layer is available.",
    };
  }

  try {
    const rows = await client.selectRows<DurableStepUpSessionRow>(
      "admin_step_up_sessions",
      {
        select: "id,user_id,method,verified_at,expires_at,revoked_at",
        query: {
          id: `eq.${sessionId}`,
        },
        limit: 1,
      },
    );
    const row = rows[0];

    if (!row) {
      return {
        ok: false,
        status: "invalid",
        message:
          "The durable step-up session no longer exists and must be re-verified.",
      };
    }

    if (row.user_id !== actor.user.id) {
      return {
        ok: false,
        status: "invalid",
        message:
          "The durable step-up session does not belong to the current signed-in DS admin account.",
      };
    }

    if (row.revoked_at) {
      return {
        ok: false,
        status: "invalid",
        message: "The durable step-up session was revoked and must be re-verified.",
      };
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      return {
        ok: false,
        status: "expired",
        message:
          "The durable step-up session expired. Re-authenticate to continue with secure actions.",
      };
    }

    return {
      ok: true,
      row,
    };
  } catch {
    return {
      ok: false,
      status: "invalid",
      message:
        "The durable step-up session could not be confirmed. Re-authenticate after the Supabase control layer is healthy.",
    };
  }
}
