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
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Database security decision
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {packet.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Reviewed" value={`${packet.counts.platformsReviewed}`} />
          <MiniStat label="Evidence" value={`${packet.counts.localEvidenceReady}`} />
          <MiniStat label="Approvals" value={`${packet.counts.approvalRequired}`} />
        </div>
      </div>

      <div className="app-surface rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Recommended" value={packet.recommendedStack} />
          <MiniToken label="Reviewed" value={packet.alternativeReviewed} />
          <MiniToken label="Launch" value={packet.liveLaunchReady ? "yes" : "no"} />
          <MiniToken label="Writes" value={`${packet.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${packet.externalWritesExpected}`} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{packet.decision}</p>
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

      <p className="app-surface mt-4 rounded-2xl p-3 text-xs leading-5 text-slate-600">
        {packet.nextApprovalPrompt}
      </p>
    </section>
  );
}

function ComparisonCard({ item }: { item: DatabasePlatformComparison }) {
  return (
    <article className="app-surface rounded-2xl p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-950">{item.label}</h3>
        <DecisionPill status={item.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.fit}</p>
      <p className="mt-3 text-sm leading-6 text-[#1d4ed8]">
        {item.securityImpact}
      </p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{item.tradeoff}</p>
    </article>
  );
}

function ControlCard({ item }: { item: DatabaseSecurityControl }) {
  const statusClass =
    item.status === "local_evidence_ready"
      ? "border-blue-300/60 bg-blue-50 text-blue-700"
      : "border-blue-300/60 bg-blue-50 text-blue-700";

  return (
    <article className="app-surface rounded-2xl p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{item.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {item.ownerLane}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {item.status.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.localEvidence}</p>
      <p className="mt-3 text-xs leading-5 text-[#1d4ed8]">
        Required: {item.requiredBeforeLive}
      </p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface rounded-2xl px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
      {label} {value}
    </span>
  );
}

function DecisionPill({ status }: { status: DatabaseDecisionStatus }) {
  const className =
    status === "preferred_for_mvp"
      ? "border-blue-300/60 bg-blue-50 text-blue-700"
      : status === "reviewed_tradeoff"
        ? "border-blue-300/60 bg-blue-50 text-blue-700"
        : "border-blue-300/60 bg-blue-50 text-blue-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
