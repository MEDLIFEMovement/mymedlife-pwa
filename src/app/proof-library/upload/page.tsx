import { AppShell } from "@/components/app-shell";
import { ProofUploadIntakePanel } from "@/components/proof-upload-intake-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProofUploadIntakeWorkspace } from "@/services/proof-upload-intake";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("proofUpload");
export const dynamic = "force-dynamic";

type ProofUploadPageProps = {
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
  }>;
};

export default async function ProofUploadPage({
  searchParams,
}: ProofUploadPageProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspace = getProofUploadIntakeWorkspace(actor);
  const sourceContext = getProofUploadSourceContext(
    resolvedSearchParams?.source,
    resolvedSearchParams?.returnTo,
  );

  return (
    <AppShell actor={actor}>
      {workspace.canReadWorkspace ? (
        <>
          {sourceContext ? (
            <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
              <p className="app-eyebrow app-eyebrow-blue">{sourceContext.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {sourceContext.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {sourceContext.detail}
              </p>
              <a
                href={sourceContext.href}
                className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
              >
                {sourceContext.backLabel}
              </a>
            </section>
          ) : null}
          <ProofUploadIntakePanel workspace={workspace} />
        </>
      ) : (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/admin"
          nextLabel="Open integration safety"
        />
      )}
    </AppShell>
  );
}

function getProofUploadSourceContext(
  source: string | undefined,
  returnTo: string | undefined,
) {
  if (source !== "chapter_bridge_video") {
    return null;
  }

  return {
    eyebrow: "From bridge videos",
    title: "Stay in the bridge-video story flow.",
    detail:
      "Use this proof-prep lane without losing the selected chapter story, filters, or bridge-video context that opened it from the command center.",
    href: normalizeProofUploadReturnTo(returnTo),
    backLabel: "Back to bridge library",
  };
}

function normalizeProofUploadReturnTo(value: string | undefined) {
  if (!value) {
    return "/chapter?view=bridge_videos";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/chapter?view=bridge_videos";
  }

  return value;
}
