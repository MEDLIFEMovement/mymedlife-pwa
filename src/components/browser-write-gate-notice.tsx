import {
  getBlockingActivationChecks,
  getPassedActivationChecks,
  type BrowserWriteActivationGate,
} from "@/services/browser-write-activation";

type BrowserWriteGateNoticeProps = {
  gate: BrowserWriteActivationGate;
};

export function BrowserWriteGateNotice({ gate }: BrowserWriteGateNoticeProps) {
  const passedChecks = getPassedActivationChecks(gate);
  const blockingChecks = getBlockingActivationChecks(gate);

  return (
    <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
        First browser write gate
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{gate.label}</h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        The local database function exists, but this browser control remains
        disabled until live auth and explicit write approval are in place.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3">
          <p className="text-sm font-semibold text-emerald-100">Ready pieces</p>
          <div className="mt-3 grid gap-2">
            {passedChecks.map((check) => (
              <div key={check.key} className="rounded-xl bg-black/20 p-3">
                <p className="text-sm font-semibold text-white">{check.label}</p>
                <p className="mt-1 text-xs leading-5 text-white/58">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
          <p className="text-sm font-semibold text-amber-100">Still blocked</p>
          <div className="mt-3 grid gap-2">
            {blockingChecks.map((check) => (
              <div key={check.key} className="rounded-xl bg-black/20 p-3">
                <p className="text-sm font-semibold text-white">{check.label}</p>
                <p className="mt-1 text-xs leading-5 text-white/58">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
          Future local function
        </p>
        <p className="mt-1 font-mono text-xs text-cyan-100/80">
          {gate.localFunction}(assignment_uuid)
        </p>
        <p className="mt-2 text-sm leading-6 text-white/62">
          Enabled control now? {gate.canRenderEnabledControl ? "yes" : "no"}.
          Local write env requested? {gate.envRequestedLocalWrites ? "yes" : "no"}.
        </p>
      </div>
    </section>
  );
}
