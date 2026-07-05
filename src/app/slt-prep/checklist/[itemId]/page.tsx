import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getSltPrepRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepChecklistDetail");
export const dynamic = "force-dynamic";

type SltPrepChecklistItemPageProps = {
  params: Promise<{
    itemId: string;
  }>;
};

export default async function SltPrepChecklistItemPage({
  params,
}: SltPrepChecklistItemPageProps) {
  const [, actor] = await Promise.all([params, getLocalActorContext()]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/app/events"));
  }

  redirect(getSltPrepRouteRedirectHref(actor));
}
