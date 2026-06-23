import { getWriteReadinessConfig } from "@/services/write-readiness";

type WriteReadinessNoticeProps = {
  operationLabel: string;
  wouldWriteTables: string[];
};

export function WriteReadinessNotice({
  operationLabel,
  wouldWriteTables,
}: WriteReadinessNoticeProps) {
  const config = getWriteReadinessConfig();

  return (
    <section className="app-surface-warm rounded-[2rem] p-4">
      <p className="app-eyebrow app-eyebrow-warm">Writes disabled</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950">{operationLabel}</h2>
      <p className="app-copy mt-2">{config.reason}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{config.approvalRequired}</p>
      <p className="app-eyebrow app-eyebrow-slate mt-3">Future tables touched after approval</p>
      <p className="mt-1 font-mono text-xs leading-5 text-amber-700">
        {wouldWriteTables.join(" -> ")}
      </p>
    </section>
  );
}
