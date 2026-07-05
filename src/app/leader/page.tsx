import { redirect } from "next/navigation";

import { FigmaLeaderCommandCenter } from "@/components/figma-leader-command-center";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessLeaderWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { isPreviewWorkspaceAccess } from "@/services/workspace-access";
import { getLeaderLaunchLaneCanonicalHref } from "@/services/leader-launch-lane";
import { resolveLeaderCommandCenterScreen } from "@/services/leader-command-center-routing";

export const metadata = getStaticRouteMetadata("leader");
export const dynamic = "force-dynamic";

type LeaderPageProps = {
  searchParams?: Promise<{
    view?: string;
  }>;
};

export default async function LeaderPage({ searchParams }: LeaderPageProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = await searchParams;
  const initialScreen = resolveLeaderCommandCenterScreen(resolvedSearchParams?.view);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/leader?view=overview"));
  }

  if (!canAccessLeaderWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const canonicalHref = getLeaderLaunchLaneCanonicalHref({
    view: resolvedSearchParams?.view,
  });

  if (canonicalHref) {
    redirect(canonicalHref);
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="leader_command_center" />
      {isPreviewWorkspaceAccess(actor, "leader_command_center") ? (
        <WorkspacePreviewBanner workspaceLabel="the Student Command Center" />
      ) : null}
      <FigmaLeaderCommandCenter initialScreen={initialScreen} />
    </>
  );
}
