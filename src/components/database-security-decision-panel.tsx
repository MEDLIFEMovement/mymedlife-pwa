import type {
  DatabaseDecisionStatus,
  DatabasePlatformComparison,
  DatabaseSecurityControl,
  DatabaseSecurityDecisionPacket,
} from "@/services/database-security-decision";

type DatabaseSecurityDecisionPanelProps = {
  packet: DatabaseSecurityDecisionPacket;
};

export function DatabaseSecurityDecisionPanel({
  packet,
}: DatabaseSecurityDecisionPanelProps) {
  if (!packet.canReadPacket) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            Database security decision
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {packet.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Reviewed" value={`${packet.counts.platformsReviewed}`} />
          <MiniStat label="Evidence" value={`${packet.counts.localEvidenceReady}`} />
          <MiniStat label="Approvals" value={`${packet.counts.approvalRequired}`} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-4">
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Recommended" value={packet.recommendedStack} />
          <MiniToken label="Reviewed" value={packet.alternativeReviewed} />
          <MiniToken label="Launch" value={packet.liveLaunchReady ? "yes" : "no"} />
          <MiniToken label="Writes" value={`${packet.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${packet.externalWritesExpected}`} />
        </div>
        <p className="mt-3 text-sm leading-6 text-white/68">{packet.decision}</p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {packet.comparisons.map((item) => (
          <ComparisonCard key={item.key} item={item} />
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {packet.controls.map((item) => (
          <ControlCard key={item.key} item={item} />
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/60">
        {packet.nextApprovalPrompt}
      </p>
    </section>
  );
}

function ComparisonCard({ item }: { item: DatabasePlatformComparison }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-lg font-semibold text-white">{item.label}</h3>
        <DecisionPill status={item.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/66">{item.fit}</p>
      <p className="mt-3 text-sm leading-6 text-emerald-100/72">
        {item.securityImpact}
      </p>
      <p className="mt-3 text-xs leading-5 text-white/52">{item.tradeoff}</p>
    </article>
  );
}

function ControlCard({ item }: { item: DatabaseSecurityControl }) {
  const statusClass =
    item.status === "local_evidence_ready"
      ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
      : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{item.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            {item.ownerLane}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {item.status.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/66">{item.localEvidence}</p>
      <p className="mt-3 text-xs leading-5 text-amber-100/72">
        Required: {item.requiredBeforeLive}
      </p>
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

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/62">
      {label} {value}
    </span>
  );
}

function DecisionPill({ status }: { status: DatabaseDecisionStatus }) {
  const className =
    status === "preferred_for_mvp"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "reviewed_tradeoff"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
