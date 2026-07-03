import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getChapterRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("chapter");
export const dynamic = "force-dynamic";

type ChapterPageProps = {
  searchParams?: Promise<{
    source?: string;
    view?: string;
    member?: string;
    committee?: string;
    eventCommittee?: string;
    event?: string;
    leaderboardMetric?: string;
    region?: string;
    benchmark?: string;
    impactStory?: string;
    pipeline?: string;
    q?: string;
    bridge?: string;
    bridgeFilter?: string;
    bridgeVideo?: string;
    feedPost?: string;
    quickAction?: string;
  }>;
};

export default async function ChapterPage({ searchParams }: ChapterPageProps) {
  const emptySearchParams: Awaited<NonNullable<ChapterPageProps["searchParams"]>> = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/chapter"));
  }

  redirect(getChapterRouteRedirectHref(actor, search));
}
