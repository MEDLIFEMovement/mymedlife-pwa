import { redirect } from "next/navigation";

import { getLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthActionDetailRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthActionDetail");
export const dynamic = "force-dynamic";

type ActionDetailPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
  searchParams?: Promise<{
    event?: string;
    source?: string;
  }>;
};

export default async function ActionDetailPage({
  searchParams,
}: ActionDetailPageProps) {
  const emptySearchParams: { event?: string; source?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);

  redirect(
    getRushMonthActionDetailRouteRedirectHref(actor, {
      eventId: search.event,
      source: search.source,
    }) ?? "/app",
  );
}
