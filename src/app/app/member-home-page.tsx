import { redirect } from "next/navigation";

import { FigmaMemberMobileHome } from "@/components/figma-member-mobile-home";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessMemberWorkspace } from "@/services/role-visibility";

type MemberHomePageProps = {
  searchParams?: Promise<{
    lumaResult?: string;
    lumaMessage?: string;
  }>;
};

export default async function MemberHomePage(props: MemberHomePageProps) {
  const emptySearchParams: { lumaResult?: string; lumaMessage?: string } = {};
  const actor = await getLocalActorContext();
  await (props.searchParams ?? Promise.resolve(emptySearchParams));
  const landingRoute = getLandingRouteForActor(actor);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/app"));
  }

  if (!canAccessMemberWorkspace(actor)) {
    redirect(landingRoute);
  }

  return <FigmaMemberMobileHome />;
}
