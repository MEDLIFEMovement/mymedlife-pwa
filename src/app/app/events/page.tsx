import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { renderRushMonthEventsPage } from "../../rush-month/events/page-content";

type AppEventsPageProps = {
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
    lumaResult?: string;
    lumaMessage?: string;
  }>;
};

export const metadata = getStaticRouteMetadata("rushMonthEvents");
export const dynamic = "force-dynamic";

export default async function AppEventsPage(props: AppEventsPageProps) {
  return renderRushMonthEventsPage({
    ...props,
    routeFamily: "app",
  });
}
