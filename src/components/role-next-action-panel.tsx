import Link from "next/link";
import type { RoleNextActionBrief } from "@/services/role-next-actions";

type RoleNextActionPanelProps = {
  brief: RoleNextActionBrief;
};

export function RoleNextActionPanel({ brief }: RoleNextActionPanelProps) {
  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            {brief.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{brief.title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/68">{brief.summary}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
            Owner: {brief.ownerLabel}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={brief.primaryHref}
            className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
          >
            {brief.primaryLabel}
          </Link>
          {brief.secondaryHref && brief.secondaryLabel ? (
            <Link
              href={brief.secondaryHref}
              className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
            >
              {brief.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {brief.signals.map((signal) => (
          <article key={signal.label} className="rounded-2xl bg-black/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
              {signal.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{signal.value}</p>
            <p className="mt-1 text-xs leading-5 text-white/58">{signal.note}</p>
          </article>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/58">
        {brief.safetyNote}
      </p>
    </section>
  );
}
