import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import type { RushMonthOperatingPathStep, RushMonthOperatingPathView } from "@/services/rush-month-operating-path";

type NavigationAction = {
  href: string;
  label: string;
};

type RushMonthOperatingPathPanelProps = {
  view: RushMonthOperatingPathView;
  primaryAction: NavigationAction;
  secondaryAction?: NavigationAction;
};

export function RushMonthOperatingPathPanel({
  view,
  primaryAction,
  secondaryAction,
}: RushMonthOperatingPathPanelProps) {
  const focusStep = view.focusStepId
    ? view.steps.find((step) => step.id === view.focusStepId) ?? null
    : null;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">
            {view.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{view.title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/66">{view.summary}</p>
          {focusStep ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/78">
              Focus now: {focusStep.ownerLabel} / {focusStep.title}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={primaryAction.href}
            className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
          >
            {primaryAction.label}
          </Link>
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>

      {view.steps.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {view.steps.map((step, index) => (
            <article
              key={step.id}
              className={`rounded-3xl border p-4 ${stepCardClassName(step)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/25 text-sm font-semibold text-white/72">
                  {index + 1}
                </span>
                <StatusBadge status={step.status} />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
                {step.ownerLabel}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/62">{step.summary}</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
                    Due
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/78">{step.dueLabel}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/64">
                  {stepStateLabel(step)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm leading-6 text-white/64">
            Open the admin center to inspect disabled/mock integration posture instead
            of chapter operating truth.
          </p>
        </div>
      )}

      <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/58">
        {view.boundaryNote}
      </p>
    </section>
  );
}

function stepCardClassName(step: RushMonthOperatingPathStep): string {
  if (step.isFocus) {
    return "border-emerald-300/30 bg-emerald-300/10";
  }

  switch (step.stepState) {
    case "complete":
      return "border-emerald-300/20 bg-emerald-300/10";
    case "current":
      return "border-amber-300/30 bg-amber-300/10";
    case "upcoming":
      return "border-white/10 bg-black/20";
  }
}

function stepStateLabel(step: RushMonthOperatingPathStep): string {
  if (step.isFocus) {
    return "Your lane";
  }

  switch (step.stepState) {
    case "complete":
      return "Complete";
    case "current":
      return "Current";
    case "upcoming":
      return "Up next";
  }
}
