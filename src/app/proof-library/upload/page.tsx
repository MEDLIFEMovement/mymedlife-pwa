import Link from "next/link";
import { redirect } from "next/navigation";

import { PrivateProofUploadPanel } from "@/components/private-proof-upload-panel";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getPrivateProofUploadResultStates,
  type PrivateProofUploadResultCode,
} from "@/services/private-proof-upload-result-states";
import { getPrivateProofUploadWorkspace } from "@/services/private-proof-upload-workspace";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";

export const metadata = getStaticRouteMetadata("proofUpload");
export const dynamic = "force-dynamic";

export default async function ProofLibraryUploadPage({
  searchParams,
}: {
  searchParams?: Promise<{ proofUploadResult?: string }>;
}) {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/proof-library/upload"));
  }

  if (getActorSurfaceFamily(actor) === "ds_admin") {
    redirect(getLandingRouteForActor(actor));
  }

  const workspace = await getPrivateProofUploadWorkspace(actor);
  const authConfig = getSupabaseAuthConfig();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const resultCode = getPrivateProofUploadResultStates().some(
    (state) => state.code === resolvedSearchParams?.proofUploadResult,
  )
    ? (resolvedSearchParams?.proofUploadResult as PrivateProofUploadResultCode)
    : undefined;
  const uploadClientConfig = authConfig.enabled && workspace.config.enabled
    ? {
        supabaseUrl: authConfig.url,
        supabasePublishableKey: authConfig.anonKey,
      }
    : null;

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
                Private proof upload
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Attach source media for private MEDLIFE review
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64">
                Signed-in submitters can attach one approved file to an existing proof record.
                Files stay private while consent, audit history, and removal controls remain
                attached to the original record.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                {workspace.config.enabled ? "Private uploads enabled" : "Uploads locked"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/62">
                No public publishing
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/62">
                No external exports
              </span>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <PrivateProofUploadPanel
            workspace={workspace}
            resultCode={resultCode}
            uploadClientConfig={uploadClientConfig}
          />
        </div>
      </div>
    </main>
  );
}
