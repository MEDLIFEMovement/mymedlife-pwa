import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthEventsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEventDetail");
export const dynamic = "force-dynamic";

type RushMonthEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function RushMonthEventDetailPage({
  params,
}: RushMonthEventDetailPageProps) {
  const [{ eventId }, actor] = await Promise.all([
    params,
    getLocalActorContext(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(`/app/events/${eventId}`));
  }

  redirect(
    getRushMonthEventsRouteRedirectHref(actor, { eventId }) ??
      `/app/events/${eventId}`,
  );
}
