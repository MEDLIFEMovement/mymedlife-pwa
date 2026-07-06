import Link from "next/link";
import { redirect } from "next/navigation";

import { ProofUploadIntakePanel } from "@/components/proof-upload-intake-panel";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProofUploadIntakeWorkspace } from "@/services/proof-upload-intake";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("proofUpload");
export const dynamic = "force-dynamic";

export default async function ProofLibraryUploadPage() {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/proof-library/upload"));
  }

  if (getActorSurfaceFamily(actor) === "ds_admin") {
    redirect(getLandingRouteForActor(actor));
  }

  const workspace = getProofUploadIntakeWorkspace(actor);

  return (
    <main
      className="min-h-screen bg-[#08131f] px-4 py-8 text-white sm:px-6"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/proof-library"
          className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/72"
        >
          Back to proof library
        </Link>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
                Proof upload readiness
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Preview file, consent, and storage rules before uploads exist
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64">
                This route is read-only. It explains what proof upload will require later while
                keeping file writes, publish actions, provider exports, and production proof claims
                turned off.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                Uploads stay disabled
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/62">
                No storage writes
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/62">
                No external exports
              </span>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <ProofUploadIntakePanel workspace={workspace} />
        </div>
      </div>
    </main>
  );
}
