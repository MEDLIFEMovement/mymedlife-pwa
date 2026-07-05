import { redirect } from "next/navigation";

import { FigmaStaffCommandCenter } from "@/components/figma-staff-command-center";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessStaffWorkspace } from "@/services/role-visibility";
import { getStaffLaunchLaneCanonicalHref } from "@/services/staff-launch-lane";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("staff");
export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = await searchParams;

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/staff?view=chapters"));
  }

  if (!canReadStaffWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const canonicalHref = getStaffLaunchLaneCanonicalHref({
    view: resolvedSearchParams?.view,
    chapter: resolvedSearchParams?.chapter,
    risk: resolvedSearchParams?.risk,
    source: resolvedSearchParams?.source,
    campaign: resolvedSearchParams?.campaign,
    event: resolvedSearchParams?.event,
  });

  if (canonicalHref) {
    redirect(canonicalHref);
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="staff_command_center" />
      <FigmaStaffCommandCenter initialView={resolvedSearchParams?.view} />
    </>
  );
}

function canReadStaffWorkspace(actor: Awaited<ReturnType<typeof getLocalActorContext>>) {
  return canAccessStaffWorkspace(actor);
}
