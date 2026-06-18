import Link from "next/link";
import type { StakeholderReviewPlan } from "@/services/stakeholder-review-plan";

type StakeholderReviewPlanPanelProps = {
  plan: StakeholderReviewPlan;
};

export function StakeholderReviewPlanPanel({
  plan,
}: StakeholderReviewPlanPanelProps) {
  if (!plan.canReadPlan) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
            No-code review path
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{plan.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {plan.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Steps" value={`${plan.counts.steps}`} />
          <MiniStat label="Writes" value={`${plan.counts.browserWritesExpected}`} />
          <MiniStat label="Sends" value={`${plan.counts.externalWritesExpected}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {plan.phases.map((phase) => (
          <article key={phase.id} className="rounded-2xl bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">
              Steps {phase.stepRange} · {phase.stepCount} checks
            </p>
            <h3 className="mt-2 text-base font-semibold text-white">{phase.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/62">{phase.summary}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {plan.steps.map((step, index) => (
          <article key={step.id} className="rounded-2xl bg-black/20 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">
                  Step {index + 1} · {step.actorLabel}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  {step.expectedReview}
                </p>
                <p className="mt-2 rounded-xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/52">
                  Safety: {step.safetyBoundary}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                <Link
                  href={step.route}
                  className="rounded-full bg-amber-200 px-3 py-2 text-sm font-semibold text-[#211704]"
                >
                  Open {step.route}
                </Link>
                <p className="max-w-xs rounded-xl bg-black/20 px-3 py-2 font-mono text-xs text-amber-100/78">
                  MYMEDLIFE_LOCAL_ACTOR_EMAIL={step.localActorEmail}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
