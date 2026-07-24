import type { LocalActorContext } from "@/services/local-actor-context";
import { isLocalRolePreviewEnabled } from "@/services/local-role-preview";

export type LoginRedirectSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | null
  | undefined;

export function shouldRedirectActorToLogin(
  actor: Pick<LocalActorContext, "identitySource" | "authSessionStatus">,
  env: Record<string, string | undefined> = process.env,
) {
  if (actor.authSessionStatus === "signed_in") {
    return false;
  }

  if (!isLocalRolePreviewEnabled(env)) {
    return true;
  }

  return actor.identitySource === "local_actor_email";
}

export function buildLoginRedirectHref(redirectTo: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("redirectTo", normalizeRedirectTo(redirectTo));
  return `/login?${searchParams.toString()}`;
}

export function buildLoginRedirectHrefForPath(
  pathname: string,
  searchParams?: LoginRedirectSearchParams,
) {
  return buildLoginRedirectHref(buildPathWithSearchParams(pathname, searchParams));
}

function normalizeRedirectTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function buildPathWithSearchParams(
  pathname: string,
  searchParams: LoginRedirectSearchParams,
) {
  const normalizedPathname = normalizeRedirectTo(pathname);
  const resolvedSearchParams = new URLSearchParams();

  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => {
      resolvedSearchParams.append(key, value);
    });
  } else {
    Object.entries(searchParams ?? {}).forEach(([key, value]) => {
      if (typeof value === "string") {
        resolvedSearchParams.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          resolvedSearchParams.append(key, item);
        });
      }
    });
  }

  const query = resolvedSearchParams.toString();

  return `${normalizedPathname}${query ? `?${query}` : ""}`;
}
