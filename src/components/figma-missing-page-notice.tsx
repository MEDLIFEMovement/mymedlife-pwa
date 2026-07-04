type FigmaMissingPageNoticeProps = {
  route: string;
  expectedSource: string;
  currentSurface: string;
  nextStep: string;
};

export function FigmaMissingPageNotice({
  route,
  expectedSource,
  currentSurface,
  nextStep,
}: FigmaMissingPageNoticeProps) {
  return (
    <section className="rounded-[1.35rem] border border-blue-200 bg-white p-4 text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
            Figma page missing - implementation blocked
          </p>
          <h2 className="mt-2 text-lg font-black text-slate-950">{route}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This route is not being claimed as a completed Figma port. It keeps
            the current safe surface visible while the exact Figma-generated
            page is missing.
          </p>
        </div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-blue-700">
          Not Chapter reuse
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniFact label="Expected source" value={expectedSource} />
        <MiniFact label="Current surface" value={currentSurface} />
        <MiniFact label="Next step" value={nextStep} />
      </div>
    </section>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">{value}</p>
    </div>
  );
}
