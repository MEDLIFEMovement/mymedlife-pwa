import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthActionDetailRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthActionDetail");
export const dynamic = "force-dynamic";

type ActionDetailPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function ActionDetailPage({
  params,
  searchParams,
}: ActionDetailPageProps) {
  const emptySearchParams: Record<string, string | undefined> = {};
  const [, actor, search] = await Promise.all([
    params,
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/app/events"));
  }

  redirect(
    getRushMonthActionDetailRouteRedirectHref(actor, {
      eventId: search.eventId,
      source: search.source,
    }) ?? "/app/events",
  );
}
