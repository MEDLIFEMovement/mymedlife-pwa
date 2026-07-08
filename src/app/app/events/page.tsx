import { renderMemberMobileShellPage } from "@/app/app/member-mobile-shell-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEvents");
export const dynamic = "force-dynamic";

type AppEventsPageProps = {
  searchParams?: Promise<{
    source?: string;
  }>;
};

function getEventsSource(source?: string): "events" | "profile" | "points" {
  if (source === "profile" || source === "points") {
    return source;
  }

  return "events";
}

export default async function AppEventsPage({ searchParams }: AppEventsPageProps) {
  const resolvedSearchParams: { source?: string } = await (searchParams ?? Promise.resolve({}));

  return renderMemberMobileShellPage({
    initialScreen: "events",
    redirectPath: "/app/events",
    eventsSource: getEventsSource(resolvedSearchParams.source),
  });
}
