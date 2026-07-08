import type {
  DesignQaReadiness,
  DesignQaStatus,
} from "@/services/design-qa-readiness";

type DesignQaReadinessPanelProps = {
  readiness: DesignQaReadiness;
};

export function DesignQaReadinessPanel({
  readiness,
}: DesignQaReadinessPanelProps) {
  if (!readiness.canReadReadiness) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-lime-300/20 bg-lime-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-100/80">
            Figma and mobile QA
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {readiness.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
            {readiness.summary}
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-white/50">
            Figma target: {readiness.figmaTarget}
          </p>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-white/50">
            Primary mobile review size: {readiness.mobileViewport}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-6">
          <MiniStat
            label="Ready"
            value={`${readiness.counts.readyForLocalReview}`}
          />
          <MiniStat
            label="Review"
            value={`${readiness.counts.needsVisualReview}`}
          />
          <MiniStat
            label="Blocked"
            value={`${readiness.counts.blockedBeforeLaunch}`}
          />
          <MiniStat
            label="Mobile"
            value={`${readiness.counts.mobileSmokeChecks}`}
          />
          <MiniStat
            label="A11y"
            value={`${readiness.counts.accessibilitySmokeChecks}`}
          />
          <MiniStat
            label="Device"
            value={`${readiness.counts.devicePwaSmokeChecks}`}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ReviewBadge label="Read-only preview" />
        <ReviewBadge label="Blocked production writes" />
        <ReviewBadge label="Blocked external sends" />
        <ReviewBadge label="Source-backed QA routes" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {readiness.items.map((item) => (
          <article
            key={item.key}
            className="rounded-3xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <StatusPill status={item.status} />
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {item.label}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {item.evidence.map((evidence) => (
                  <span
                    key={`${item.key}-${evidence}`}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58"
                  >
                    {evidence}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/66">
              {item.plainEnglish}
            </p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/54">
              Review prompt: {item.reviewerPrompt}
            </p>
          </article>
        ))}
      </div>

      <article className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-100/70">
              Phone-sized route smoke
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Mobile visual smoke plan
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Run these routes at the primary phone viewport before approving a
              real pilot, live launch, uploads, writes, sends, or invitations.
            </p>
          </div>
          <MiniStat
            label="Checks"
            value={`${readiness.counts.mobileSmokeChecks}`}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {readiness.mobileSmokeChecks.map((check) => (
            <div
              key={check.key}
              className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="break-all text-sm font-semibold text-lime-100">
                    {check.route}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/46">
                    {check.viewport}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                  {check.reviewerActorEmail}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-sm leading-6">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                    Target
                  </dt>
                  <dd className="mt-1 text-white/66">{check.targetSignal}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                    Pass signal
                  </dt>
                  <dd className="mt-1 text-white/66">{check.passSignal}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                    Still blocked
                  </dt>
                  <dd className="mt-1 text-white/58">{check.blockedUntil}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </article>

      <article className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-100/70">
              Keyboard and screen-reader smoke
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Accessibility smoke plan
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Run these checks before pilot approval so focus order, labels,
              restricted states, disabled controls, and recovery copy work
              without a mouse.
            </p>
          </div>
          <MiniStat
            label="Checks"
            value={`${readiness.counts.accessibilitySmokeChecks}`}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {readiness.accessibilitySmokeChecks.map((check) => (
            <div
              key={check.key}
              className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="break-all text-sm font-semibold text-lime-100">
                    {check.route}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/46">
                    {check.interaction}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                  {check.reviewerActorEmail}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-sm leading-6">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                    Target
                  </dt>
                  <dd className="mt-1 text-white/66">{check.targetSignal}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                    Pass signal
                  </dt>
                  <dd className="mt-1 text-white/66">{check.passSignal}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                    Still blocked
                  </dt>
                  <dd className="mt-1 text-white/58">{check.blockedUntil}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </article>

      <article className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-100/70">
              Device and PWA release smoke
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Device and PWA smoke plan
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Run these checks on real devices and staging before approving
              pilot scope, PWA install behavior, offline recovery, or launch.
            </p>
          </div>
          <MiniStat
            label="Checks"
            value={`${readiness.counts.devicePwaSmokeChecks}`}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {readiness.devicePwaSmokeChecks.map((check) => (
            <div
              key={check.key}
              className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="break-all text-sm font-semibold text-lime-100">
                    {check.route}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/46">
                    {check.deviceBrowser}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                  {check.reviewerActorEmail}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-sm leading-6">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                    Scenario
                  </dt>
                  <dd className="mt-1 text-white/66">{check.scenario}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                    Pass signal
                  </dt>
                  <dd className="mt-1 text-white/66">{check.passSignal}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                    Still blocked
                  </dt>
                  <dd className="mt-1 text-white/58">{check.blockedUntil}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </article>

      <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
        <MiniStat
          label="Browser writes"
          value={`${readiness.counts.browserWritesExpected}`}
        />
        <MiniStat
          label="External sends"
          value={`${readiness.counts.externalWritesExpected}`}
        />
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

function StatusPill({ status }: { status: DesignQaStatus }) {
  const className =
    status === "ready_for_local_review"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "needs_visual_review"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function ReviewBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-lime-100/78">
      {label}
    </span>
  );
}
