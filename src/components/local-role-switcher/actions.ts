"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  localActorOptions,
  localActorPreviewCookieName,
} from "@/services/local-actor-context";
import { normalizeLocalRoleSwitcherReturnTo } from "@/components/local-role-switcher/return-to";

const previewCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

export async function setLocalActorPreviewAction(formData: FormData) {
  const selectedEmail = String(formData.get("selectedEmail") ?? "").trim().toLowerCase();
  const isKnownActor = localActorOptions.some((option) => option.email === selectedEmail);
  const requestedReturnTo = normalizeLocalRoleSwitcherReturnTo(
    formData.get("returnTo"),
  );

  if (isKnownActor) {
    const cookieStore = await cookies();
    cookieStore.set(localActorPreviewCookieName, selectedEmail, {
      httpOnly: true,
      maxAge: previewCookieMaxAgeSeconds,
      path: "/",
      sameSite: "lax",
    });
  }

  redirect(requestedReturnTo ?? await getReturnToPath());
}

export async function clearLocalActorPreviewAction() {
  const cookieStore = await cookies();
  cookieStore.delete(localActorPreviewCookieName);
  redirect(await getReturnToPath());
}

async function getReturnToPath() {
  const headerStore = await headers();
  const referer = headerStore.get("referer");

  if (!referer) {
    return "/";
  }

  try {
    const url = new URL(referer);
    return normalizeLocalRoleSwitcherReturnTo(`${url.pathname}${url.search}`) ?? "/";
  } catch {
    return "/";
  }
}
