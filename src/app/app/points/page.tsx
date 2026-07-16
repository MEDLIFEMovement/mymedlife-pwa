import { renderMemberMobileShellPage } from "@/app/app/member-mobile-shell-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthLeaderboard");
export const dynamic = "force-dynamic";

type AppPointsPageProps = {
  searchParams?: Promise<{
    source?: string;
    event?: string;
    campaign?: string;
    storyFilter?: string;
    story?: string;
  }>;
};

function getPointsSource(source?: string): "events" | "home" | "profile" | "points" | "stories" {
  if (source === "events" || source === "home" || source === "profile" || source === "points" || source === "stories") {
    return source;
  }

  return "points";
}

function getPointsReturnCampaign(campaign?: string) {
  return campaign && campaign !== "All" ? campaign : null;
}

export default async function AppPointsPage(props: AppPointsPageProps) {
  const resolvedSearchParams: { source?: string; event?: string; campaign?: string; storyFilter?: string; story?: string } = await (
    props.searchParams ?? Promise.resolve({})
  );
  const repaintKey = buildRouteKey("/app/points", resolvedSearchParams);

  return renderMemberMobileShellPage({
    initialScreen: "points",
    redirectPath: "/app/points",
    pointsSource: getPointsSource(resolvedSearchParams.source),
    pointsReturnEventId: resolvedSearchParams.event ?? null,
    pointsReturnCampaign: getPointsReturnCampaign(resolvedSearchParams.campaign),
    pointsStoryFilter: resolvedSearchParams.storyFilter ?? null,
    pointsStoryId: resolvedSearchParams.story ?? null,
    repaintKey,
  });
}

function buildRouteKey(
  pathname: string,
  params: { source?: string; event?: string; campaign?: string; storyFilter?: string; story?: string },
) {
  const searchParams = new URLSearchParams();

  if (params.source) {
    searchParams.set("source", params.source);
  }

  if (params.event) {
    searchParams.set("event", params.event);
  }

  if (params.campaign) {
    searchParams.set("campaign", params.campaign);
  }

  if (params.storyFilter) {
    searchParams.set("storyFilter", params.storyFilter);
  }

  if (params.story) {
    searchParams.set("story", params.story);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
