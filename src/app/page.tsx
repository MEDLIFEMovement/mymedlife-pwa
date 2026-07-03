import { redirect } from "next/navigation";

import { getLandingRouteForActor } from "@/services/landing-route";
import { shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("home");
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect("/login");
  }

  redirect(getLandingRouteForActor(actor));
}
