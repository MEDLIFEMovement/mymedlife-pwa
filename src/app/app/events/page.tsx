import { renderMemberMobileShellPage } from "@/app/app/member-mobile-shell-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEvents");
export const dynamic = "force-dynamic";

type AppEventsPageProps = {
  searchParams?: Promise<{
    source?: string;
    campaign?: string;
    profileSource?: string;
    storyFilter?: string;
  }>;
};

function getEventsSource(source?: string): "events" | "home" | "profile" | "points" | "stories" {
  if (source === "home" || source === "profile" || source === "points" || source === "stories") {
    return source;
  }

  return "events";
}

function getInitialEventsCampaign(campaign?: string) {
  return campaign && campaign !== "All" ? campaign : null;
}

export default async function AppEventsPage({ searchParams }: AppEventsPageProps) {
  const resolvedSearchParams: { source?: string; campaign?: string; profileSource?: string; storyFilter?: string } = await (
    searchParams ?? Promise.resolve({})
  );

  return renderMemberMobileShellPage({
    initialScreen: "events",
    redirectPath: "/app/events",
    initialEventsCampaign: getInitialEventsCampaign(resolvedSearchParams.campaign),
    eventsSource: getEventsSource(resolvedSearchParams.source),
    eventsProfileSource: resolvedSearchParams.profileSource === "points" ? "points" : null,
    eventsStoryFilter: resolvedSearchParams.storyFilter ?? null,
  });
}
