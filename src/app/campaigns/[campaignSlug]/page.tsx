import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getCampaignsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("campaigns");
export const dynamic = "force-dynamic";

type CampaignPageProps = {
  params: Promise<{
    campaignSlug: string;
  }>;
};

export default async function CampaignPage({ params }: CampaignPageProps) {
  const [{ campaignSlug }, actor] = await Promise.all([
    params,
    getLocalActorContext(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/app/events"));
  }

  redirect(
    getCampaignsRouteRedirectHref(actor, { campaignSlug }) ??
      "/app/events",
  );
}
