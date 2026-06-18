import type { ReactNode } from "react";

export function SltPrepMiniStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/46">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {note ? <p className="mt-2 text-sm leading-5 text-white/64">{note}</p> : null}
    </div>
  );
}

export function SltPrepTonePill({
  tone,
  label,
}: {
  tone: "red" | "yellow" | "green";
  label: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getToneClassName(
        tone,
      )}`}
    >
      {label}
    </span>
  );
}

export function SltPrepSectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/46">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function getToneClassName(tone: "red" | "yellow" | "green") {
  switch (tone) {
    case "red":
      return "border-rose-300/30 bg-rose-300/15 text-rose-100";
    case "yellow":
      return "border-[#f7d05e]/30 bg-[#f7d05e]/12 text-[#f9df8b]";
    case "green":
      return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
  }
}
