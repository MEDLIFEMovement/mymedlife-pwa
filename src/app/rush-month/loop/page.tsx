import { redirect } from "next/navigation";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthNonCoreRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthLoop");
export const dynamic = "force-dynamic";

export default async function RushMonthLoopPage() {
  const actor = await getLocalActorContext();
  redirect(getRushMonthNonCoreRouteRedirectHref(actor));
}
