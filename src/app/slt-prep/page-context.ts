import { redirect } from "next/navigation";

import { getLocalActorContext } from "@/services/local-actor-context";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getReadOnlyAppData } from "@/services/read-only-app-data";

export async function getSltPrepPageContext(redirectPath: string) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(redirectPath));
  }

  return { actor, data };
}
