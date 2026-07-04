import { redirect } from "next/navigation";

import { FigmaMemberMobileHome } from "@/components/figma-member-mobile-home";
import { shouldShowTravelerPrepEntry } from "@/services/events-points-launch-lane";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMvpMemberHome } from "@/services/mvp-event-tracking-workspace";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canAccessMemberWorkspace } from "@/services/role-visibility";

type MemberHomePageProps = {
  searchParams?: Promise<{
    lumaResult?: string;
    lumaMessage?: string;
  }>;
};

export default async function MemberHomePage(props: MemberHomePageProps) {
  const emptySearchParams: { lumaResult?: string; lumaMessage?: string } = {};
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  await (props.searchParams ?? Promise.resolve(emptySearchParams));
  const landingRoute = getLandingRouteForActor(actor);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/app"));
  }

  if (!canAccessMemberWorkspace(actor)) {
    redirect(landingRoute);
  }

  const workspace = getMvpMemberHome(actor, data);
  const showTravelerEntry = Boolean(
    workspace.travelerHref && shouldShowTravelerPrepEntry(),
  );

  return (
    <FigmaMemberMobileHome
      workspace={workspace}
      showTravelerEntry={showTravelerEntry}
    />
  );
}
