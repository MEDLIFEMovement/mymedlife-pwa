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
    <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
        Writes disabled
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">{operationLabel}</h2>
      <p className="mt-2 text-sm leading-6 text-white/66">{config.reason}</p>
      <p className="mt-2 text-sm leading-6 text-white/58">{config.approvalRequired}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/44">
        Future tables touched after approval
      </p>
      <p className="mt-1 font-mono text-xs leading-5 text-amber-100/80">
        {wouldWriteTables.join(" -> ")}
      </p>
    </section>
  );
}
