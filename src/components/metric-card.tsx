type MetricCardProps = {
  label: string;
  value: string;
  note: string;
};

export function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <section className="app-surface flex h-full min-h-[8.5rem] flex-col rounded-[1.55rem] p-4">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-3 text-[2.15rem] font-semibold leading-none text-slate-950 sm:text-[2.35rem]">
        {value}
      </p>
      <p className="app-copy mt-auto pt-3 text-sm">{note}</p>
    </section>
  );
}
