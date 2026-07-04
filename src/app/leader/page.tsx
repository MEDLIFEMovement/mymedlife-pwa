import { redirect } from "next/navigation";

import { FigmaLeaderCommandCenter } from "@/components/figma-leader-command-center";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessLeaderWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("leader");
export const dynamic = "force-dynamic";

type LeaderPageProps = {
  searchParams?: Promise<{
    view?: string;
  }>;
};

export default async function LeaderPage({}: LeaderPageProps) {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/leader?view=overview"));
  }

  if (!canAccessLeaderWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  return <FigmaLeaderCommandCenter />;
}
