import type {
  AdminSystemHealthCheck,
  AdminSystemHealthReview,
  AdminSystemHealthStatus,
} from "@/services/admin-system-health-review";

type AdminSystemHealthReviewPanelProps = {
  review: AdminSystemHealthReview;
};

export function AdminSystemHealthReviewPanel({
  review,
}: AdminSystemHealthReviewPanelProps) {
  if (!review.canReadReview) {
    return null;
  }

  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            System health
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {review.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {review.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Checks" value={`${review.counts.total}`} />
          <MiniStat label="Local" value={`${review.counts.localReady}`} />
          <MiniStat label="Mock" value={`${review.counts.mockSafe}`} />
          <MiniStat label="Review" value={`${review.counts.needsReview}`} />
          <MiniStat
            label="Blocked"
            value={`${review.counts.blockedBeforeLive}`}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MiniToken label="Launch" value={review.launchReady ? "yes" : "no"} />
        <MiniToken label="Source" value={review.sourceLabel} />
        <MiniToken label="Writes" value={`${review.browserWritesEnabled}`} />
        <MiniToken label="Sends" value={`${review.externalWritesEnabled}`} />
        <MiniToken label="Secrets" value={`${review.secretsShown}`} />
      </div>

      <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
        Packet sources: production{" "}
        <span className="font-semibold text-slate-950">
          {review.packetSources.production.mode === "supabase"
            ? "Supabase review records"
            : "env/default fallback"}
        </span>
        {" · "}
        {review.packetSources.production.recordCount} recorded row
        {review.packetSources.production.recordCount === 1 ? "" : "s"}
        {" · "}pilot{" "}
        <span className="font-semibold text-slate-950">
          {review.packetSources.pilot.mode === "supabase"
            ? "Supabase review records"
            : "env/default fallback"}
        </span>
        {" · "}
        {review.packetSources.pilot.recordCount} recorded row
        {review.packetSources.pilot.recordCount === 1 ? "" : "s"}
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {review.checks.map((check) => (
          <HealthCheckCard key={check.key} check={check} />
        ))}
      </div>

      <p className="app-surface mt-4 rounded-2xl p-3 text-xs leading-5 text-slate-600">
        {review.finalPrompt}
      </p>
    </section>
  );
}

function HealthCheckCard({ check }: { check: AdminSystemHealthCheck }) {
  return (
    <article className="app-surface rounded-2xl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill status={check.status} />
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{check.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {check.ownerLane}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{check.signal}</p>
      <p className="mt-3 text-xs leading-5 text-[var(--mymedlife-info)]">
        Next: {check.nextStep}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {check.routeEvidence.map((route) => (
          <span
            key={`${check.key}-${route}`}
            className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-2.5 py-1 text-xs font-semibold text-slate-500"
          >
            {route}
          </span>
        ))}
      </div>
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

function StatusPill({ status }: { status: AdminSystemHealthStatus }) {
  const className =
    status === "local_ready"
      ? "border-[var(--mymedlife-focus-blue)]/60 bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
      : status === "mock_safe"
        ? "border-[var(--mymedlife-focus-blue)]/60 bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
        : status === "needs_review"
          ? "border-[var(--mymedlife-focus-blue)]/60 bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
          : "border-[var(--mymedlife-focus-blue)]/60 bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
