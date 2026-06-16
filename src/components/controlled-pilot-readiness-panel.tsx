import type {
  ControlledPilotReadiness,
  PilotReadinessStatus,
} from "@/services/controlled-pilot-readiness";

type ControlledPilotReadinessPanelProps = {
  readiness: ControlledPilotReadiness;
};

export function ControlledPilotReadinessPanel({
  readiness,
}: ControlledPilotReadinessPanelProps) {
  if (!readiness.canReadReadiness) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-orange-300/20 bg-orange-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-100/80">
            Controlled pilot gate
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {readiness.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
            {readiness.plainEnglishVerdict}
          </p>
          <p className="mt-3 max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-orange-50/78">
            Recommended next move: {readiness.recommendedNextMove}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Ready" value={`${readiness.counts.readyNow}`} />
          <MiniStat label="Decide" value={`${readiness.counts.needsDecision}`} />
          <MiniStat
            label="Pilot blocks"
            value={`${readiness.counts.blockedBeforePilot}`}
          />
          <MiniStat
            label="Scale blocks"
            value={`${readiness.counts.blockedBeforeScale}`}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {readiness.stages.map((stage) => (
          <article
            key={stage.key}
            className="rounded-3xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <StatusPill status={stage.status} />
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {stage.label}
                </h3>
              </div>
              <p className="font-mono text-xs text-white/42">{stage.key}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/66">
              {stage.plainEnglish}
            </p>
            <ul className="mt-3 grid gap-2">
              {stage.requiredProof.map((proof) => (
                <li key={proof} className="text-xs leading-5 text-white/52">
                  {proof}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {readiness.gates.map((gate) => (
          <article
            key={gate.key}
            className="rounded-3xl border border-white/10 bg-[#071d1a]/70 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <StatusPill status={gate.status} />
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {gate.label}
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-100/60">
                  Owner: {gate.owner}
                </p>
              </div>
              <p className="font-mono text-xs text-white/42">{gate.key}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/66">
              {gate.plainEnglish}
            </p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/54">
              Next step: {gate.nextStep}
            </p>
          </article>
        ))}
      </div>

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

function StatusPill({ status }: { status: PilotReadinessStatus }) {
  const className =
    status === "ready_now"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "needs_decision"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : status === "blocked_before_pilot"
          ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
          : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
