"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeLoginRedirect } from "@/services/auth-session";
import {
  localActorOptions,
  localActorPreviewCookieName,
} from "@/services/local-actor-context";

const previewCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

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
      message: "Enter the local seed password.",
      email,
    };
  }

  const { client, config } = await createLocalSupabaseServerClient();

  if (!client) {
    const knownActor = localActorOptions.find(
      (option) => option.email === email,
    );

    if (!knownActor) {
      return {
        status: "disabled",
        message: config.reason,
        email,
      };
    }

    if (password !== getExpectedSeedPassword(email)) {
      return {
        status: "error",
        message: "Use the seeded review password for this account.",
        email,
      };
    }

    const cookieStore = await cookies();
    cookieStore.set(localActorPreviewCookieName, email, {
      httpOnly: true,
      maxAge: previewCookieMaxAgeSeconds,
      path: "/",
      sameSite: "lax",
    });

    redirect(redirectTo);
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

  redirect(redirectTo);
}

export async function signOut() {
  const { client } = await createLocalSupabaseServerClient();
  const cookieStore = await cookies();

  if (client) {
    await client.auth.signOut();
  }

  cookieStore.delete(localActorPreviewCookieName);

  redirect("/login");
}

function getExpectedSeedPassword(email: string): string {
  return email === "nellis@medlifemovement.org" ? "6598" : "password";
}
