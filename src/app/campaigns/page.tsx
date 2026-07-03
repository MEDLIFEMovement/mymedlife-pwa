import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getCampaignsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("campaigns");
export const dynamic = "force-dynamic";

type CampaignsPageProps = {
  searchParams?: Promise<{
    role?: string;
    source?: string;
  }>;
};

export default async function CampaignsPage(_props: CampaignsPageProps) {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/campaigns"));
  }

  redirect(getCampaignsRouteRedirectHref(actor) ?? "/admin");
}
