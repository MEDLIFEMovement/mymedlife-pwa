import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  renderRushMonthEventDetailPage,
  type RushMonthEventDetailPageProps,
} from "./page-content";

export const metadata = getStaticRouteMetadata("rushMonthEventDetail");
export const dynamic = "force-dynamic";

export default async function RushMonthEventDetailPage(
  props: RushMonthEventDetailPageProps,
) {
  return renderRushMonthEventDetailPage(props);
}
