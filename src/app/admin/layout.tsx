import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessAdminWorkspace } from "@/services/role-visibility";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/admin"));
  }

  if (!canAccessAdminWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  return children;
}
