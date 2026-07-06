import { renderMemberMobileShellPage } from "@/app/app/member-mobile-shell-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEvents");
export const dynamic = "force-dynamic";

export default async function AppEventsPage() {
  return renderMemberMobileShellPage({
    initialScreen: "events",
    redirectPath: "/app/events",
  });
}
