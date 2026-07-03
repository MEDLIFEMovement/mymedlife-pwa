import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getCoachRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("coach");
export const dynamic = "force-dynamic";

type CoachPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function CoachPage({ searchParams }: CoachPageProps) {
  const emptySearchParams: Record<string, string | undefined> = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/coach"));
  }

  redirect(getCoachRouteRedirectHref(actor, search));
}
