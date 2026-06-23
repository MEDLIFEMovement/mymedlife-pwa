type MetricCardProps = {
  label: string;
  value: string;
  note: string;
};

export function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <section className="app-surface rounded-[1.55rem] p-4">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="app-copy mt-2">{note}</p>
    </section>
  );
}
