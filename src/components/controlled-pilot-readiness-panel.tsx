import Link from "next/link";
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
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Controlled pilot gate
          </p>
          <h2 className="app-title mt-2">{readiness.title}</h2>
          <p className="app-copy mt-2 max-w-3xl">{readiness.plainEnglishVerdict}</p>
          <p className="app-surface mt-3 max-w-3xl rounded-[1.2rem] p-3 text-sm leading-6 text-slate-600">
            Recommended next move: {readiness.recommendedNextMove}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/staff-dry-run"
              className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-[#10223f]"
            >
              Open staff dry-run guide
            </Link>
            <Link
              href="/admin/pilot-scope"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Open pilot scope planner
            </Link>
          </div>
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
            className="app-surface rounded-[1.5rem] p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <StatusPill status={stage.status} />
                <h3 className="mt-3 text-lg font-semibold text-slate-950">{stage.label}</h3>
              </div>
              <p className="font-mono text-xs text-slate-400">{stage.key}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{stage.plainEnglish}</p>
            <ul className="mt-3 grid gap-2">
              {stage.requiredProof.map((proof) => (
                <li key={proof} className="text-xs leading-5 text-slate-500">
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
            className="app-surface rounded-[1.5rem] p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <StatusPill status={gate.status} />
                <h3 className="mt-3 text-lg font-semibold text-slate-950">{gate.label}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Owner: {gate.owner}
                </p>
              </div>
              <p className="font-mono text-xs text-slate-400">{gate.key}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{gate.plainEnglish}</p>
            <p className="app-surface-soft mt-3 rounded-[1.1rem] p-3 text-xs leading-5 text-slate-500">
              Next step: {gate.nextStep}
            </p>
          </article>
        ))}
      </div>

      <div className="app-surface mt-4 grid gap-2 rounded-[1.2rem] p-4 sm:grid-cols-2">
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
    <div className="app-surface rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: PilotReadinessStatus }) {
  const className =
    status === "ready_now"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : status === "needs_decision"
        ? "border-[#bfdbfe] bg-[#eaf2ff] text-[#2563eb]"
        : status === "blocked_before_pilot"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
