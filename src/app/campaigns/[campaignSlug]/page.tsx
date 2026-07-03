import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getCampaignsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("campaignDetail");
export const dynamic = "force-dynamic";

type CampaignDetailPageProps = {
  params: Promise<{
    campaignSlug: string;
  }>;
};

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { campaignSlug } = await params;
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(`/campaigns/${campaignSlug}`));
  }

  redirect(
    getCampaignsRouteRedirectHref(actor, {
      campaignSlug,
    }) ?? "/admin",
  );
}
