import { FigmaMemberStoriesPage } from "@/components/figma-member-stories-page";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getProofLibraryItemsForActor } from "@/services/campaign-ops-service";

export const metadata = getStaticRouteMetadata("proofLibrary");
export const dynamic = "force-dynamic";

export default async function ProofLibraryPage() {
  const actor = await getLocalActorContext();
  const proofItems = getProofLibraryItemsForActor(actor);

  return (
    <>
      {proofItems.length > 0 ? (
        <FigmaMemberStoriesPage
          canUpload={actor.audience !== "ds_admin"}
          proofItems={proofItems}
        />
      ) : (
        <main className="min-h-screen bg-[#f7f4ee] px-4 py-12">
          <div className="mx-auto max-w-[430px]">
            <RestrictedState
              title="Proof library is hidden for this role."
              message="DS Admin can inspect disabled integration posture, but should not read student proof, testimonials, or belief-building content assets."
              nextHref="/admin"
              nextLabel="Open integration posture"
            />
          </div>
        </main>
      )}

    </>
  );
}
