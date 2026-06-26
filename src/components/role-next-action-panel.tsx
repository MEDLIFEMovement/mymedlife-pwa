import Link from "next/link";
import type { RoleNextActionBrief } from "@/services/role-next-actions";

type RoleNextActionPanelProps = {
  brief: RoleNextActionBrief;
};

export function RoleNextActionPanel({ brief }: RoleNextActionPanelProps) {
  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="app-eyebrow app-eyebrow-blue">{brief.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{brief.title}</h2>
          <p className="app-copy mt-2">{brief.summary}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Owner: {brief.ownerLabel}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={brief.primaryHref}
            className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-[#08224c]"
          >
            {brief.primaryLabel}
          </Link>
          {brief.secondaryHref && brief.secondaryLabel ? (
            <Link
              href={brief.secondaryHref}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {brief.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {brief.signals.map((signal) => (
          <article key={signal.label} className="app-surface rounded-2xl p-3">
            <p className="app-eyebrow app-eyebrow-slate">{signal.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{signal.value}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{signal.note}</p>
          </article>
        ))}
      </div>

      <p className="app-surface-soft mt-4 rounded-2xl p-3 text-xs leading-5 text-slate-500">
        {brief.safetyNote}
      </p>
    </section>
  );
}
