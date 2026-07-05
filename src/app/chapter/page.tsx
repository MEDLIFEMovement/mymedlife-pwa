import { redirect } from "next/navigation";

import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getChapterRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("chapter");
export const dynamic = "force-dynamic";

type ChapterPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function ChapterPage({ searchParams }: ChapterPageProps) {
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve({}),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/app"));
  }

  redirect(getChapterRouteRedirectHref(actor, search));
}
