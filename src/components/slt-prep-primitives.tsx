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
    <div className="app-surface rounded-[1.3rem] p-4">
      <p className="app-eyebrow app-eyebrow-slate text-[0.64rem] sm:text-[0.68rem]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {note ? <p className="app-copy mt-2 text-xs sm:text-sm">{note}</p> : null}
    </div>
  );
}

export function SltPrepTonePill({
  tone,
  label,
}: {
  tone: "red" | "yellow" | "blue" | "green";
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
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="app-surface rounded-[1.75rem] p-4">
      <p className="app-eyebrow app-eyebrow-slate">{eyebrow}</p>
      <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function getToneClassName(tone: "red" | "yellow" | "blue" | "green") {
  switch (tone) {
    case "red":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "yellow":
      return "border-[#2563eb]/30 bg-[#dbeafe] text-[#1d4ed8]";
    case "blue":
    case "green":
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}
