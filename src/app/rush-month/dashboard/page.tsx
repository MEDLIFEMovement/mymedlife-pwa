import { redirect } from "next/navigation";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthHomeRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthDashboard");
export const dynamic = "force-dynamic";

export default async function RushMonthDashboardPage() {
  const actor = await getLocalActorContext();
  redirect(getRushMonthHomeRouteRedirectHref(actor));
}
