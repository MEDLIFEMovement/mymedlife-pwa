import { redirect } from "next/navigation";

import {
  FigmaMemberMobileHome,
  type MemberMobileLaunchScreen,
} from "@/components/figma-member-mobile-home";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessMemberWorkspace } from "@/services/role-visibility";
import { isPreviewWorkspaceAccess } from "@/services/workspace-access";

export async function renderMemberMobileShellPage({
  initialScreen,
  redirectPath,
}: {
  initialScreen?: MemberMobileLaunchScreen;
  redirectPath: string;
}) {
  const actor = await getLocalActorContext();
  const landingRoute = getLandingRouteForActor(actor);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(redirectPath));
  }

  if (!canAccessMemberWorkspace(actor)) {
    redirect(landingRoute);
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="student_app" />
      {isPreviewWorkspaceAccess(actor, "student_app") ? (
        <WorkspacePreviewBanner workspaceLabel="the General Student App" />
      ) : null}
      <FigmaMemberMobileHome initialScreen={initialScreen} />
    </>
  );
}
