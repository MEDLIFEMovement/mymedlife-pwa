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
    <section className="app-surface-info rounded-[2rem] p-5">
      <p className="app-eyebrow app-eyebrow-blue">First browser write gate</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{gate.label}</h2>
      <p className="app-copy mt-2">
        The local database function exists, but this browser control remains
        disabled until live auth and explicit write approval are in place.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="app-surface rounded-2xl p-3">
          <p className="text-sm font-semibold text-[var(--mymedlife-info)]">Ready pieces</p>
          <div className="mt-3 grid gap-2">
            {passedChecks.map((check) => (
              <div key={check.key} className="app-surface-soft rounded-xl p-3">
                <p className="text-sm font-semibold text-slate-950">{check.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="app-surface-info rounded-2xl p-3">
          <p className="text-sm font-semibold text-[var(--mymedlife-info)]">Still blocked</p>
          <div className="mt-3 grid gap-2">
            {blockingChecks.map((check) => (
              <div key={check.key} className="app-surface rounded-xl p-3">
                <p className="text-sm font-semibold text-slate-950">{check.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="app-surface mt-4 rounded-2xl p-3">
        <p className="app-eyebrow app-eyebrow-slate">Future local function</p>
        <p className="mt-1 font-mono text-xs text-slate-600">
          {gate.functionSignature}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enabled control now? {gate.canRenderEnabledControl ? "yes" : "no"}.
          Local write env requested? {gate.envRequestedLocalWrites ? "yes" : "no"}.
        </p>
      </div>
    </section>
  );
}
