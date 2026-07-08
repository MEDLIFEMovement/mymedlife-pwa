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
    <section className="rounded-[2rem] border border-lime-300/20 bg-lime-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-100/80">
            System health
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {review.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
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

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/58">
        This route stays read-only. Use it to review health posture, then move
        into the linked follow-through routes only for approved runbook and
        evidence checks.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {review.checks.map((check) => (
          <HealthCheckCard key={check.key} check={check} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {review.blockedControls.map((control) => (
          <span
            key={control}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/64"
          >
            Blocked here {control}
          </span>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/58">
        {review.finalPrompt}
      </p>
    </section>
  );
}

function HealthCheckCard({ check }: { check: AdminSystemHealthCheck }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill status={check.status} />
          <h3 className="mt-3 text-lg font-semibold text-white">{check.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            {check.ownerLane}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/66">{check.signal}</p>
      <p className="mt-3 text-xs leading-5 text-lime-100/70">
        Next: {check.nextStep}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {check.routeEvidence.map((route) => (
          <span
            key={`${check.key}-${route}`}
            className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/56"
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

function StatusPill({ status }: { status: AdminSystemHealthStatus }) {
  const className =
    status === "local_ready"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "mock_safe"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : status === "needs_review"
          ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
          : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
