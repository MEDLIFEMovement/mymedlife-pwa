import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { renderRushMonthEventDetailPage } from "../../../rush-month/events/[eventId]/page-content";

type AppEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
    lumaResult?: string;
    lumaMessage?: string;
  }>;
};

export const metadata = getStaticRouteMetadata("rushMonthEventDetail");
export const dynamic = "force-dynamic";

export default async function AppEventDetailPage(
  props: AppEventDetailPageProps,
) {
  return renderRushMonthEventDetailPage({
    ...props,
    routeFamily: "app",
  });
}
