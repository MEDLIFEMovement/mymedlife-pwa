import { redirect } from "next/navigation";

import { getLocalActorContext } from "@/services/local-actor-context";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getReadOnlyAppData } from "@/services/read-only-app-data";

export async function getSltPrepPageContext(redirectPath: string) {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(redirectPath));
  }

  const data = await getReadOnlyAppData({ actorUserId: actor.user.id });

  return { actor, data };
}
