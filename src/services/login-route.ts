import type { LocalActorContext } from "@/services/local-actor-context";

export function shouldRedirectActorToLogin(
  actor: Pick<LocalActorContext, "identitySource" | "authSessionStatus">,
) {
  return (
    actor.identitySource === "local_actor_email" &&
    actor.authSessionStatus !== "signed_in"
  );
}

export function buildLoginRedirectHref(redirectTo: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("redirectTo", normalizeRedirectTo(redirectTo));
  return `/login?${searchParams.toString()}`;
}

function normalizeRedirectTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
