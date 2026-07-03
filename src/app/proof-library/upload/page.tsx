import { redirect } from "next/navigation";

import { getLocalActorContext } from "@/services/local-actor-context";
import { getProofLibraryRouteRedirectHref } from "@/services/owned-route-redirect";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("proofUpload");
export const dynamic = "force-dynamic";

type ProofUploadPageProps = {
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
  }>;
};

export default async function ProofUploadPage(_props: ProofUploadPageProps) {
  const actor = await getLocalActorContext();
  redirect(getProofLibraryRouteRedirectHref(actor) ?? "/admin");
}
