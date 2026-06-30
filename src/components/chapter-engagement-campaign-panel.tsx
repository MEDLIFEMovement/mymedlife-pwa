import type { ChapterEngagementCampaignPlan } from "@/services/chapter-engagement-campaign";

type ChapterEngagementCampaignPanelProps = {
  plan: ChapterEngagementCampaignPlan;
};

export function ChapterEngagementCampaignPanel({
  plan,
}: ChapterEngagementCampaignPanelProps) {
  if (!plan.canReadPlan) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
            Deepened starter campaign
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{plan.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {plan.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Phases" value={`${plan.phases.length}`} />
          <MiniStat label="Workflow" value={plan.workflowVersionLabel} />
          <MiniStat label="Import" value={plan.importStatus.replaceAll("_", " ")} />
        </div>
      </div>

      <article className="mt-4 rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
          Current workflow state
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/62">
            {plan.workflowName}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/62">
            source {plan.workflowSource.replaceAll("_", " ")}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-white">{plan.currentPhaseLabel}</h3>
        <p className="mt-2 text-sm leading-6 text-white/66">{plan.currentPhaseObjective}</p>
        <p className="mt-3 rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/70 p-3 text-xs leading-5 text-white/54">
          Exit signal: {plan.currentPhaseExitSignal}
        </p>
      </article>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {plan.phases.map((phase) => (
          <article key={phase.key} className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
                  {phase.key.replaceAll("_", " ")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{phase.label}</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/62">
                {phase.ownerRole}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-white/66">
              {phase.studentVisibleOutcome}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/56">
              Leader task: {phase.leaderTask}
            </p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/70 p-3 text-xs leading-5 text-white/54">
              Proof prompt: {phase.proofPrompt}
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TokenList title="KPI signals" items={phase.kpiSignals} />
              <TokenList title="Structured events" items={phase.structuredEvents} />
            </div>
            <TokenList
              title="Disabled outbox destinations"
              items={phase.disabledOutboxDestinations}
            />
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Checklist title="Closeout checks" items={plan.closeoutChecks} />
        <Checklist title="Safety reminders" items={plan.safetyReminders} />
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function TokenList({ items, title }: { items: readonly string[]; title: string }) {
  return (
    <div className="mt-3 rounded-2xl bg-white/[0.05] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-[var(--mymedlife-border)]/40 px-2.5 py-1 text-xs font-semibold text-white/58"
          >
            {item.replaceAll("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}

function Checklist({ items, title }: { items: readonly string[]; title: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-white/62">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
