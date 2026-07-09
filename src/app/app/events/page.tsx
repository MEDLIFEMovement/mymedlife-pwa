import { renderMemberMobileShellPage } from "@/app/app/member-mobile-shell-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEvents");
export const dynamic = "force-dynamic";

type AppEventsPageProps = {
  searchParams?: Promise<{
    source?: string;
    campaign?: string;
    profileSource?: string;
  }>;
};

function getEventsSource(source?: string): "events" | "home" | "profile" | "points" {
  if (source === "home" || source === "profile" || source === "points") {
    return source;
  }

  return "events";
}

export default async function AppEventsPage({ searchParams }: AppEventsPageProps) {
  const resolvedSearchParams: { source?: string; campaign?: string; profileSource?: string } = await (
    searchParams ?? Promise.resolve({})
  );

  return renderMemberMobileShellPage({
    initialScreen: "events",
    redirectPath: "/app/events",
    initialEventsCampaign: resolvedSearchParams.campaign ?? null,
    eventsSource: getEventsSource(resolvedSearchParams.source),
    eventsProfileSource: resolvedSearchParams.profileSource === "points" ? "points" : null,
  });
}
