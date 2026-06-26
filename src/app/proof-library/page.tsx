import Link from "next/link";
import { redirect } from "next/navigation";
import { StudentAppShell } from "@/components/student-app-shell";
import { MetricCard } from "@/components/metric-card";
import { ProofSharingReviewPanel } from "@/components/proof-sharing-review-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProofLibraryRouteRedirectHref } from "@/services/owned-route-redirect";
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
  const redirectHref = getProofLibraryRouteRedirectHref(actor);

  if (redirectHref) {
    redirect(redirectHref);
  }

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
    <StudentAppShell actor={actor}>
      <section className="app-surface-info rounded-[2rem] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
          Proof library
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Proof exists to break self-limiting beliefs.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Proof is a bridge video, testimonial, event recap, photo, or UGC asset
          that helps another student or chapter believe action is possible. Use
          this library to review what is ready for learning, follow-up, and later
          storytelling while broader sharing stays curated.
        </p>
        <Link
          href="/proof-library/upload"
          className="mt-4 inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          Open proof requirements
        </Link>
      </section>

      <ProofSharingReviewPanel board={proofReviewBoard} />

      {proofItems.length > 0 ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Ready for review"
              value={`${needsHqReview.length}`}
              note="Ready for a sharing decision"
            />
            <MetricCard
              label="Internal examples"
              value={`${internallyApproved.length}`}
              note="Useful for coaching and playbooks"
            />
            <MetricCard
              label="Future stories"
              value={`${futurePublicCandidates.length}`}
              note="Worth revisiting for broader storytelling"
            />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            {proofItems.map((proofItem) => {
              const campaign = getCampaignShellBySlug(proofItem.campaignSlug);

              return (
                <article key={proofItem.id} className="app-surface rounded-3xl p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="app-eyebrow app-eyebrow-blue">
                        {proofItem.proofType.replaceAll("_", " ")}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">
                        {proofItem.sourceLabel}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {proofItem.summary}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-[#dbeafe] px-3 py-1 text-xs text-slate-500">
                      {proofItem.sharingStatus.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="app-surface-soft rounded-2xl p-3">
                      <p className="app-eyebrow app-eyebrow-slate">Hesitation addressed</p>
                      <p className="mt-1 text-slate-700">{proofItem.hesitationAddressed}</p>
                    </div>
                    <div className="app-surface-soft rounded-2xl p-3">
                      <p className="app-eyebrow app-eyebrow-slate">Recommended use</p>
                      <p className="mt-1 text-slate-700">{proofItem.recommendedUse}</p>
                    </div>
                  </div>

                  {campaign ? (
                    <Link
                      href={`/campaigns/${campaign.slug}`}
                      className="mt-4 inline-flex text-sm font-semibold text-[#2563eb]"
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
    </StudentAppShell>
  );
}
