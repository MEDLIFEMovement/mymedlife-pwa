import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { PrivateProofUploadPanel } from "@/components/private-proof-upload-panel";
import { ProofUploadIntakePanel } from "@/components/proof-upload-intake-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getPrivateProofUploadResultStates,
  type PrivateProofUploadResultCode,
} from "@/services/private-proof-upload-result-states";
import { getPrivateProofUploadWorkspace } from "@/services/private-proof-upload-workspace";
import { getProofUploadIntakeWorkspace } from "@/services/proof-upload-intake";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("proofUpload");
export const dynamic = "force-dynamic";

type ProofUploadPageProps = {
  searchParams?: Promise<{
    proofUploadResult?: string;
  }>;
};

export default async function ProofUploadPage({ searchParams }: ProofUploadPageProps) {
  const emptySearchParams: { proofUploadResult?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getProofUploadIntakeWorkspace(actor);
  const uploadWorkspace = await getPrivateProofUploadWorkspace(actor);
  const resultCode = parseProofUploadResultCode(search.proofUploadResult);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={actor.source} />
      {workspace.canReadWorkspace ? (
        <section className="grid gap-4">
          <ProofUploadIntakePanel workspace={workspace} />
          <PrivateProofUploadPanel
            workspace={uploadWorkspace}
            resultCode={resultCode}
          />
        </section>
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

function parseProofUploadResultCode(
  value: string | undefined,
): PrivateProofUploadResultCode | undefined {
  const allowedCodes = new Set(
    getPrivateProofUploadResultStates().map((state) => state.code),
  );

  return value && allowedCodes.has(value as PrivateProofUploadResultCode)
    ? (value as PrivateProofUploadResultCode)
    : undefined;
}
