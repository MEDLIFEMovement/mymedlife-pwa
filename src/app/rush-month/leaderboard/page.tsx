import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  renderRushMonthLeaderboardPage,
  type RushMonthLeaderboardPageProps,
} from "./page-content";

export const metadata = getStaticRouteMetadata("rushMonthLeaderboard");
export const dynamic = "force-dynamic";

export default async function RushMonthLeaderboardPage(
  props: RushMonthLeaderboardPageProps,
) {
  return renderRushMonthLeaderboardPage(props);
}
