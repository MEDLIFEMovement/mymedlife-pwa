import type { ReactNode } from "react";

export function SltPrepMiniStat({
  label,
  value,
  note,
  variant = "dark",
}: {
  label: string;
  value: string;
  note?: string;
  variant?: "dark" | "light";
}) {
  const isLight = variant === "light";

  return (
    <div
      className={[
        "rounded-[1.4rem] p-4",
        isLight
          ? "border border-slate-200 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]"
          : "border border-white/10 bg-black/20",
      ].join(" ")}
    >
      <p
        className={[
          "text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
          isLight ? "text-slate-400" : "text-white/46",
        ].join(" ")}
      >
        {label}
      </p>
      <p
        className={[
          "mt-2 text-2xl font-semibold",
          isLight ? "text-slate-950" : "text-white",
        ].join(" ")}
      >
        {value}
      </p>
      {note ? (
        <p
          className={[
            "mt-2 text-sm leading-5",
            isLight ? "text-slate-500" : "text-white/64",
          ].join(" ")}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}

export function SltPrepTonePill({
  tone,
  label,
  variant = "dark",
}: {
  tone: "red" | "yellow" | "green";
  label: string;
  variant?: "dark" | "light";
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getToneClassName(
        tone,
        variant,
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
  variant = "dark",
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  variant?: "dark" | "light";
}) {
  const isLight = variant === "light";

  return (
    <section
      className={[
        "rounded-[2rem] p-5",
        isLight
          ? "border border-slate-200 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]"
          : "border border-white/10 bg-white/[0.05]",
      ].join(" ")}
    >
      <p
        className={[
          "text-xs font-semibold uppercase tracking-[0.24em]",
          isLight ? "text-slate-400" : "text-white/46",
        ].join(" ")}
      >
        {eyebrow}
      </p>
      <h2
        className={[
          "mt-2 text-2xl font-semibold",
          isLight ? "text-slate-950" : "text-white",
        ].join(" ")}
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function getToneClassName(
  tone: "red" | "yellow" | "green",
  variant: "dark" | "light" = "dark",
) {
  if (variant === "light") {
    switch (tone) {
      case "red":
        return "border-rose-200 bg-rose-50 text-rose-700";
      case "yellow":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "green":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
  }

  switch (tone) {
    case "red":
      return "border-rose-300/30 bg-rose-300/15 text-rose-100";
    case "yellow":
      return "border-[#f7d05e]/30 bg-[#f7d05e]/12 text-[#f9df8b]";
    case "green":
      return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
  }
}
