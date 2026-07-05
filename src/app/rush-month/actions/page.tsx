import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthActionsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthActions");
export const dynamic = "force-dynamic";

type ActionsPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function ActionsPage({ searchParams }: ActionsPageProps) {
  const emptySearchParams: Record<string, string | undefined> = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/app/events"));
  }

  redirect(getRushMonthActionsRouteRedirectHref(actor, { source: search.source }) ?? "/app/events");
}
