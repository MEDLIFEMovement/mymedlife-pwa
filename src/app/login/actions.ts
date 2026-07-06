"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeLoginRedirect } from "@/services/auth-session";
import { getLocalSandboxAuthLandingRoute } from "@/services/local-sandbox-auth-routing";
import { localActorPreviewCookieName } from "@/services/local-actor-context";

export type LoginActionState = {
  status: "idle" | "disabled" | "error";
  message: string;
  email: string;
};

export async function signInWithPassword(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = normalizeLoginRedirect(formData.get("redirectTo"));

  if (!email.includes("@")) {
    return {
      status: "error",
      message: "Enter a valid email address.",
      email,
    };
  }

  if (password.length < 1) {
    return {
      status: "error",
      message: "Enter a password.",
      email,
    };
  }

  const { client, config } = await createLocalSupabaseServerClient();

  if (!client) {
    return {
      status: "disabled",
      message: config.reason,
      email,
    };
  }

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
      email,
    };
  }

  const localSandboxRoute =
    redirectTo === "/" ? getLocalSandboxAuthLandingRoute(email) : null;

  redirect(localSandboxRoute ?? redirectTo);
}

export async function signOut() {
  const { client } = await createLocalSupabaseServerClient();

  if (client) {
    await client.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore.delete(localActorPreviewCookieName);

  redirect("/login");
}
