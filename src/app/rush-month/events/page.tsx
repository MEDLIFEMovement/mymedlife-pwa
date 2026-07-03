import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  renderRushMonthEventsPage,
  type RushMonthEventsPageProps,
} from "./page-content";

export const metadata = getStaticRouteMetadata("rushMonthEvents");
export const dynamic = "force-dynamic";

export default async function RushMonthEventsPage(
  props: RushMonthEventsPageProps,
) {
  return renderRushMonthEventsPage(props);
}
