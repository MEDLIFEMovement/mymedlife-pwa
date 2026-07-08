import { renderMemberMobileShellPage } from "@/app/app/member-mobile-shell-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthLeaderboard");
export const dynamic = "force-dynamic";

type AppPointsPageProps = {
  searchParams?: Promise<{
    source?: string;
    event?: string;
  }>;
};

function getPointsSource(source?: string): "events" | "home" | "profile" | "points" {
  if (source === "events" || source === "home" || source === "profile" || source === "points") {
    return source;
  }

  return "points";
}

export default async function AppPointsPage(props: AppPointsPageProps) {
  const resolvedSearchParams: { source?: string; event?: string } = await (
    props.searchParams ?? Promise.resolve({})
  );

  return renderMemberMobileShellPage({
    initialScreen: "points",
    redirectPath: "/app/points",
    pointsSource: getPointsSource(resolvedSearchParams.source),
    pointsReturnEventId: resolvedSearchParams.event ?? null,
  });
}
