import type { LocalActorContext } from "@/services/local-actor-context";

export type LoginRedirectSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | null
  | undefined;

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
