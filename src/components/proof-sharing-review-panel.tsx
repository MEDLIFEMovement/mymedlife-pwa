import type {
  ProofSharingReviewBoard,
  ProofSharingReviewState,
} from "@/services/proof-sharing-review";

type ProofSharingReviewPanelProps = {
  board: ProofSharingReviewBoard;
};

export function ProofSharingReviewPanel({ board }: ProofSharingReviewPanelProps) {
  if (!board.canReadBoard) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
            HQ sharing posture
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{board.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {board.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <MiniStat label="Rows" value={`${board.counts.total}`} />
          <MiniStat label="Consent" value={`${board.counts.needsConsentOrContext}`} />
          <MiniStat label="HQ review" value={`${board.counts.readyForHqReview}`} />
          <MiniStat label="Internal" value={`${board.counts.internalLearning}`} />
          <MiniStat label="Publish" value={`${board.counts.publishActionsEnabled}`} />
          <MiniStat label="Exports" value={`${board.counts.externalExportsEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {board.rows.map((row) => (
          <article key={row.id} className="rounded-2xl bg-black/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <ReviewStatePill state={row.reviewState} />
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                    {row.proofType.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                    {row.sharingStatus.replaceAll("_", " ")}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {row.sourceLabel}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  Addresses: {row.hesitationAddressed}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  {row.actionNeeded}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                  Privacy boundary
                </p>
                <p className="mt-2 text-xs leading-5 text-white/58">
                  {row.privacyBoundary}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                  Deletion / takedown
                </p>
                <p className="mt-2 text-xs leading-5 text-white/58">
                  {row.deletionBoundary}
                </p>
              </div>
            </div>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/54">
              Publish now: {row.canBePublishedNow ? "yes" : "no"}. External
              export posture: {row.externalExportPosture}. No public proof page,
              warehouse export, n8n workflow, HubSpot, or Luma write happens.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ReviewStatePill({ state }: { state: ProofSharingReviewState }) {
  const className =
    state === "needs_consent_or_context"
      ? "border-rose-300/30 bg-rose-300/15 text-rose-100"
      : state === "ready_for_hq_review"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : state === "future_public_candidate"
          ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
          : state === "internal_learning"
            ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
            : "border-white/10 bg-white/10 text-white/70";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {state.replaceAll("_", " ")}
    </span>
  );
}
