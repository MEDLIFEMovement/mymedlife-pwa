import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { ProofSharingReviewPanel } from "@/components/proof-sharing-review-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProofSharingReviewBoard } from "@/services/proof-sharing-review";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  getCampaignShellBySlug,
  getProofLibraryItemsForActor,
} from "@/services/campaign-ops-service";

export const metadata = getStaticRouteMetadata("proofLibrary");
export const dynamic = "force-dynamic";

export default async function ProofLibraryPage() {
  const actor = await getLocalActorContext();
  const proofItems = getProofLibraryItemsForActor(actor);
  const proofReviewBoard = getProofSharingReviewBoard(actor, proofItems);
  const needsHqReview = proofItems.filter(
    (item) => item.sharingStatus === "needs_hq_review",
  );
  const internallyApproved = proofItems.filter(
    (item) => item.sharingStatus === "approved_for_internal_learning",
  );
  const futurePublicCandidates = proofItems.filter(
    (item) => item.sharingStatus === "future_public_candidate",
  );

  return (
    <AppShell actor={actor}>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Proof library
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Proof exists to break self-limiting beliefs.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
          Proof is a bridge video, testimonial, event recap, photo, or UGC asset
          that helps another student or chapter believe action is possible. HQ
          decides what should be shared broadly. This page is read-only and does
          not publish anything.
        </p>
        {actor.audience !== "ds_admin" ? (
          <Link
            href="/proof-library/upload"
            className="mt-4 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
          >
            Preview proof upload requirements
          </Link>
        ) : null}
      </section>

      <ProofSharingReviewPanel board={proofReviewBoard} />

      {proofItems.length > 0 ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Needs HQ review"
              value={`${needsHqReview.length}`}
              note="Sharing decision not made"
            />
            <MetricCard
              label="Internal learning"
              value={`${internallyApproved.length}`}
              note="Useful for playbooks/SOPs"
            />
            <MetricCard
              label="Future public"
              value={`${futurePublicCandidates.length}`}
              note="Candidate, not published"
            />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            {proofItems.map((proofItem) => {
              const campaign = getCampaignShellBySlug(proofItem.campaignSlug);

              return (
                <article key={proofItem.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
                        {proofItem.proofType.replaceAll("_", " ")}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">
                        {proofItem.sourceLabel}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/64">
                        {proofItem.summary}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/68">
                      {proofItem.sharingStatus.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-black/20 p-3">
                      <p className="text-white/42">Hesitation addressed</p>
                      <p className="mt-1 text-white/72">{proofItem.hesitationAddressed}</p>
                    </div>
                    <div className="rounded-2xl bg-black/20 p-3">
                      <p className="text-white/42">Recommended use</p>
                      <p className="mt-1 text-white/72">{proofItem.recommendedUse}</p>
                    </div>
                  </div>

                  {campaign ? (
                    <Link
                      href={`/campaigns/${campaign.slug}`}
                      className="mt-4 inline-flex text-sm font-semibold text-emerald-100"
                    >
                      Open {campaign.name}
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </section>
        </>
      ) : (
        <RestrictedState
          title="Proof library is hidden for this role."
          message="DS Admin can inspect disabled integration posture, but should not read student proof, testimonials, or belief-building content assets."
          nextHref="/admin"
          nextLabel="Open integration posture"
        />
      )}
    </AppShell>
  );
}
