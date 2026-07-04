import { redirect } from "next/navigation";

import { FigmaStaffCommandCenter } from "@/components/figma-staff-command-center";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canAccessStaffWorkspace } from "@/services/role-visibility";
import { getStaffCommandCenter } from "@/services/staff-command-center";
import { getStaffLaunchLaneCanonicalHref } from "@/services/staff-launch-lane";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("staff");
export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const emptySearchParams: Record<string, string | undefined> = {};
  const [actor, search, data] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
    getReadOnlyAppData(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/staff?view=chapters"));
  }

  if (!canReadStaffWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const launchLaneCanonicalHref = getStaffLaunchLaneCanonicalHref(search);

  if (launchLaneCanonicalHref) {
    redirect(launchLaneCanonicalHref);
  }

  const commandCenter = getStaffCommandCenter(actor, data, {
    routeBase: "/staff",
    source: search.source,
    view: search.view,
    campaign: search.campaign,
    campaignRisk: search.campaignRisk,
    risk: search.risk,
    country: search.country,
    coach: search.coach,
    portfolioCampaign: search.portfolioCampaign,
    query: search.q,
    chapterId: search.chapter,
    decision: search.decision,
    proof: search.proof,
    proofQueue: search.proofQueue,
    proofType: search.proofType,
    feedDraft: search.feedDraft,
    feedPost: search.feedPost,
    hubspotChapter: search.hubspotChapter,
    bestPractice: search.bestPractice,
    practiceCountry: search.practiceCountry,
    practiceCampaign: search.practiceCampaign,
    feedRole: search.feedRole,
    feedAudience: search.feedAudience,
  });

  if (search.view && !commandCenter.viewOptions.some((option) => option.key === search.view)) {
    redirect(buildCanonicalStaffHref(search, commandCenter.selectedView));
  }

  return <FigmaStaffCommandCenter commandCenter={commandCenter} />;
}

function canReadStaffWorkspace(actor: Awaited<ReturnType<typeof getLocalActorContext>>) {
  return canAccessStaffWorkspace(actor);
}

function buildCanonicalStaffHref(
  searchParams: Record<string, string | undefined>,
  view: string,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  params.set("view", view);

  return `/staff?${params.toString()}`;
}
