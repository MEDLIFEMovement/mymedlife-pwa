import { AppShell } from "@/components/app-shell";
import { ProofUploadIntakePanel } from "@/components/proof-upload-intake-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProofUploadIntakeWorkspace } from "@/services/proof-upload-intake";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("proofUpload");
export const dynamic = "force-dynamic";

export default async function ProofUploadPage() {
  const actor = await getLocalActorContext();
  const workspace = getProofUploadIntakeWorkspace(actor);

  return (
    <AppShell actor={actor}>
      {workspace.canReadWorkspace ? (
        <ProofUploadIntakePanel workspace={workspace} />
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
