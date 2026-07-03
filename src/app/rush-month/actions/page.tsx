import { redirect } from "next/navigation";

import { getLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthActionsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthActions");
export const dynamic = "force-dynamic";

type ActionsPageProps = {
  searchParams?: Promise<{
    source?: string;
  }>;
};

export default async function ActionsPage({ searchParams }: ActionsPageProps) {
  const actor = await getLocalActorContext();
  const search = (await searchParams) ?? {};

  redirect(
    getRushMonthActionsRouteRedirectHref(actor, {
      source: search.source,
    }) ?? "/admin",
  );
}
