import type { WriteActivationApprovalPlan } from "@/services/write-activation-approval-plan";

type WriteActivationApprovalPlanPanelProps = {
  plan: WriteActivationApprovalPlan;
};

export function WriteActivationApprovalPlanPanel({
  plan,
}: WriteActivationApprovalPlanPanelProps) {
  const firstCandidate = plan.candidates.find((candidate) => {
    return candidate.operation === plan.recommendedFirstOperation;
  });

  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
        Activation approval plan
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        First recommended write: {firstCandidate?.operation ?? "not selected"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        This is a planning view only. It names the order and approvals required
        before any disabled browser gate can become a real save button.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-sm font-semibold text-white">Recommended order</p>
          <div className="mt-3 grid gap-2">
            {plan.candidates.map((candidate) => (
              <article key={candidate.operation} className="rounded-xl bg-white/[0.05] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                  {candidate.recommendedOrder}. {candidate.riskLevel} risk
                </p>
                <p className="mt-1 font-mono text-xs text-[var(--mymedlife-badge-background)]/80">
                  {candidate.operation}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/58">
                  {candidate.route}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/54">
                  {candidate.reason}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-sm font-semibold text-white">Required before activation</p>
          <div className="mt-3 grid gap-2">
            {plan.requirements.map((requirement) => (
              <article key={requirement.key} className="rounded-xl bg-white/[0.05] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{requirement.label}</p>
                  <span className="rounded-full border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 px-2 py-1 text-xs text-[var(--mymedlife-badge-background)]">
                    not approved
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-white/54">
                  Owner: {requirement.owner}. {requirement.notes}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/62">
        Browser writes enabled? {plan.browserWritesEnabled ? "yes" : "no"}.
        External writes enabled? {plan.externalWritesEnabled ? "yes" : "no"}.
        Can activate without Nick approval?{" "}
        {plan.canActivateWithoutNickApproval ? "yes" : "no"}.
      </p>
    </section>
  );
}
