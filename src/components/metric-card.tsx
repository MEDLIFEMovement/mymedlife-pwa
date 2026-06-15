type MetricCardProps = {
  label: string;
  value: string;
  note: string;
};

export function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/48">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/64">{note}</p>
    </section>
  );
}
