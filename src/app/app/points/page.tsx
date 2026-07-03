import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { renderRushMonthLeaderboardPage } from "../../rush-month/leaderboard/page-content";

type AppPointsPageProps = {
  searchParams?: Promise<{
    campaign?: string;
    source?: string;
  }>;
};

export const metadata = getStaticRouteMetadata("rushMonthLeaderboard");
export const dynamic = "force-dynamic";

export default async function AppPointsPage(props: AppPointsPageProps) {
  return renderRushMonthLeaderboardPage({
    ...props,
    routeFamily: "app",
  });
}
