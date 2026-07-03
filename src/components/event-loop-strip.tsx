export type EventLoopTone = "blue" | "slate" | "yellow" | "gold";

type EventLoopPillProps = {
  label: string;
  detail: string;
  tone: EventLoopTone;
};

export function EventLoopPill({ label, detail, tone }: EventLoopPillProps) {
  const toneClasses =
    tone === "blue"
      ? "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
      : tone === "yellow"
        ? "border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]"
        : tone === "gold"
          ? "border-[#2563eb]/40 bg-[#dbeafe] text-[#1d4ed8]"
          : "border-slate-200 bg-white text-slate-700";

  return (
    <article className={`rounded-[1.15rem] border px-4 py-3 ${toneClasses}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{detail}</p>
    </article>
  );
}

export type EventLoopStripItem = {
  label: string;
  detail: string;
  tone: EventLoopTone;
};

type EventLoopStripProps = {
  items: readonly EventLoopStripItem[];
  className?: string;
};

export function EventLoopStrip({ items, className }: EventLoopStripProps) {
  return (
    <div className={className ?? "grid gap-2 sm:grid-cols-2 xl:grid-cols-4"}>
      {items.map((item) => (
        <EventLoopPill
          key={`${item.label}-${item.detail}`}
          label={item.label}
          detail={item.detail}
          tone={item.tone}
        />
      ))}
    </div>
  );
}
