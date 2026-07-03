import type {
  Phase2SecurityEvidenceItem,
  Phase2SecurityGateCheck,
  Phase2SecurityReleaseGatePacket,
} from "@/services/phase-2-security-release-gate";

export function Phase2SecurityReleaseGatePanel({
  packet,
}: {
  packet: Phase2SecurityReleaseGatePacket;
}) {
  return (
    <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
            MED-474 foundation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {packet.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Ready" value={`${packet.counts.localEvidenceReady}`} />
          <MiniStat label="DS review" value={`${packet.counts.dsReviewRequired}`} />
          <MiniStat
            label="Storage gate"
            value={`${packet.counts.blockedUntilStorageReview}`}
          />
          <MiniStat label="Live gate" value="closed" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">
            Gate checks
          </p>
          <div className="mt-4 grid gap-2">
            {packet.checks.map((item) => (
              <SecurityCheckCard key={item.key} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">
            Current evidence
          </p>
          <div className="mt-4 grid gap-2">
            {packet.currentEvidence.map((item) => (
              <SecurityEvidenceCard key={item.artifact} item={item} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">
            Blocked live actions
          </p>
          <ul className="mt-3 grid gap-2">
            {packet.blockedLiveActions.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/62">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">
            Official references
          </p>
          <div className="mt-3 grid gap-2">
            {packet.officialReferences.map((reference) => (
              <a
                key={reference.url}
                href={reference.url}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white transition hover:border-amber-200/40 hover:bg-white/[0.07]"
              >
                {reference.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function SecurityCheckCard({ item }: { item: Phase2SecurityGateCheck }) {
  const tone =
    item.status === "local_evidence_ready"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : item.status === "ds_review_required"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{item.label}</p>
          <p className="mt-1 text-xs text-white/48">{item.owners.join(" / ")}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
          {item.status.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/62">
        Local evidence: {item.localEvidence}
      </p>
      <p className="mt-2 text-xs leading-5 text-amber-50/72">
        Required before live: {item.requiredBeforeLive}
      </p>
    </article>
  );
}

function SecurityEvidenceCard({ item }: { item: Phase2SecurityEvidenceItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-sm font-semibold text-white">{item.label}</p>
      <p className="mt-1 font-mono text-xs text-white/46">{item.artifact}</p>
      <p className="mt-2 text-sm leading-6 text-white/62">{item.whyItMatters}</p>
    </article>
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
