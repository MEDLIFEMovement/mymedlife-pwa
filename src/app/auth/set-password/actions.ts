"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeLoginRedirect } from "@/services/auth-session";

export type SetPasswordActionState = {
  status: "idle" | "error";
  message: string;
};

type PasswordUpdater = {
  auth: {
    updateUser: (attributes: {
      password: string;
    }) => Promise<{
      error: { message: string } | null;
    }>;
  };
};

type SetPasswordDeps = {
  createServerClient?: () => Promise<{
    client: PasswordUpdater | null;
    config: { reason: string };
  }>;
};

const minimumPasswordLength = 12;

export async function savePasswordFromRecovery(
  _previousState: SetPasswordActionState,
  formData: FormData,
): Promise<SetPasswordActionState> {
  return submitPasswordFromRecovery(formData);
}

export async function submitPasswordFromRecovery(
  formData: FormData,
  deps: SetPasswordDeps = {},
): Promise<SetPasswordActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const redirectTo = normalizeLoginRedirect(formData.get("redirectTo"));

  if (password.length < minimumPasswordLength) {
    return {
      status: "error",
      message: `Choose a password with at least ${minimumPasswordLength} characters.`,
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "The password confirmation does not match.",
    };
  }

  const createServerClient =
    deps.createServerClient ?? createServerClientForPasswordRecovery;
  const { client, config } = await createServerClient();

  if (!client) {
    return {
      status: "error",
      message: config.reason,
    };
  }

  const { error } = await client.auth.updateUser({ password });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  redirect(redirectTo);
}

async function createServerClientForPasswordRecovery() {
  const { client, config } = await createLocalSupabaseServerClient();

  return {
    client: client as PasswordUpdater | null,
    config,
  };
}
