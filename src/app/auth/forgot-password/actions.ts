"use server";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthRecoveryRedirectUrl } from "@/services/auth-recovery";

export type ForgotPasswordActionState = {
  status: "idle" | "sent" | "error" | "disabled";
  message: string;
  email: string;
};

type RecoveryClient = {
  auth: {
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<{ error: { message?: string } | null }>;
  };
};

type ForgotPasswordDeps = {
  createServerClient?: () => Promise<{
    client: RecoveryClient | null;
    config: { reason: string };
  }>;
  env?: Record<string, string | undefined>;
};

const sentMessage =
  "If an account exists for that email, a secure password reset link is on its way.";

export async function requestPasswordRecovery(
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  return submitPasswordRecoveryRequest(formData);
}

export async function submitPasswordRecoveryRequest(
  formData: FormData,
  deps: ForgotPasswordDeps = {},
): Promise<ForgotPasswordActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
      email,
    };
  }

  const createServerClient =
    deps.createServerClient ?? createServerClientForPasswordRecovery;
  const { client, config } = await createServerClient();

  if (!client) {
    return {
      status: "disabled",
      message: config.reason,
      email,
    };
  }

  const redirectTo = getAuthRecoveryRedirectUrl(
    formData.get("redirectTo"),
    deps.env,
  );
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("Password recovery request failed", error.message);
  }

  // Do not reveal whether an email address belongs to an account.
  return {
    status: "sent",
    message: sentMessage,
    email,
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createServerClientForPasswordRecovery() {
  const { client, config } = await createLocalSupabaseServerClient();

  return {
    client: client as RecoveryClient | null,
    config,
  };
}
