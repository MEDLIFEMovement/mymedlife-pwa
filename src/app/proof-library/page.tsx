import { redirect } from "next/navigation";

import { getLocalActorContext } from "@/services/local-actor-context";
import { getProofLibraryRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("proofLibrary");
export const dynamic = "force-dynamic";

export default async function ProofLibraryPage() {
  const actor = await getLocalActorContext();
  redirect(getProofLibraryRouteRedirectHref(actor) ?? "/admin");
}
