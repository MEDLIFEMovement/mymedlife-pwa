import type {
  RouteSmokeManifest,
  RouteSmokePriority,
} from "@/services/route-smoke-manifest";

type RouteSmokeManifestPanelProps = {
  manifest: RouteSmokeManifest;
};

export function RouteSmokeManifestPanel({ manifest }: RouteSmokeManifestPanelProps) {
  if (!manifest.canReadManifest) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
            Manual QA
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{manifest.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {manifest.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <MiniStat label="Routes" value={`${manifest.counts.totalRoutes}`} />
          <MiniStat label="Critical" value={`${manifest.counts.criticalRoutes}`} />
          <MiniStat
            label="Mobile"
            value={`${manifest.counts.mobileVisualChecks}`}
          />
          <MiniStat label="Roles" value={`${manifest.counts.roleVariants}`} />
          <MiniStat label="Writes" value={`${manifest.counts.browserWritesExpected}`} />
          <MiniStat label="Sends" value={`${manifest.counts.externalWritesExpected}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {manifest.routes.map((route) => (
          <article key={route.path} className="rounded-2xl bg-[#bfdbfe]/40 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <PriorityPill priority={route.priority} />
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                    {route.path}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{route.label}</h3>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  {route.expectedResult}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/48">
                  Safety: {route.safetyAssertion}
                </p>
                {route.mobileReview ? (
                  <div className="mt-3 rounded-2xl border border-blue-300/20 bg-blue-300/10 p-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-xs font-semibold text-blue-100">
                        Mobile check
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                        {route.mobileReview.viewport}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                        {route.mobileReview.reviewerActorEmail}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-white/64">
                      Target: {route.mobileReview.targetSignal}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/58">
                      Pass signal: {route.mobileReview.passSignal}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/48">
                      Still blocked: {route.mobileReview.blockedUntil}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex max-w-md flex-wrap gap-2">
                {route.audiences.map((audience) => (
                  <span
                    key={`${route.path}-${audience}`}
                    className="rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-xs font-semibold text-blue-100"
                  >
                    {audience.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#0b66cc]/70 p-3 text-xs leading-5 text-white/54">
        This manifest is for human smoke testing. It does not run browser tests,
        approve release, or enable any write or integration.
      </p>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function PriorityPill({ priority }: { priority: RouteSmokePriority }) {
  const className =
    priority === "critical"
      ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
      : priority === "important"
        ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
        : "border-white/10 bg-white/10 text-white/70";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {priority}
    </span>
  );
}
