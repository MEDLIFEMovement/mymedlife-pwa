import type { PlanningGoalSettingCampaignPlan } from "@/services/planning-goal-setting-campaign";

type PlanningGoalSettingCampaignPanelProps = {
  plan: PlanningGoalSettingCampaignPlan;
};

export function PlanningGoalSettingCampaignPanel({
  plan,
}: PlanningGoalSettingCampaignPanelProps) {
  if (!plan.canReadPlan) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
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

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {plan.phases.map((phase) => (
          <article key={phase.key} className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/70">
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
            <p className="mt-3 rounded-2xl border border-white/10 bg-[#0b66cc]/70 p-3 text-xs leading-5 text-white/54">
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

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
          <h3 className="text-sm font-semibold text-white">Operation permissions</h3>
          <div className="mt-3 grid gap-3">
            {plan.operationPosture.map((operation) => (
              <div
                key={operation.operation}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{operation.operation}</p>
                  <span className="rounded-full border border-white/10 bg-[#bfdbfe]/40 px-2.5 py-1 text-[11px] font-semibold text-white/58">
                    {operation.approvalLabel}
                  </span>
                  <span className="rounded-full border border-white/10 bg-[#bfdbfe]/40 px-2.5 py-1 text-[11px] font-semibold text-white/58">
                    {operation.authorityStatus}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/60">
                  Roles: {operation.allowedRoles.join(", ")} | Scope: {operation.scopeSummary}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/54">{operation.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
          <h3 className="text-sm font-semibold text-white">Validators and handoffs</h3>
          <div className="mt-3 grid gap-3">
            {plan.validators.map((validator) => (
              <div
                key={validator.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <p className="text-sm font-semibold text-white">{validator.label}</p>
                <p className="mt-2 text-xs leading-5 text-white/60">
                  Roles: {validator.validatorRoles.join(", ")} | Phases:{" "}
                  {validator.phaseLabels.join(", ")}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/54">{validator.prompt}</p>
              </div>
            ))}
            {plan.handoffs.map((handoff) => (
              <div
                key={handoff.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <p className="text-sm font-semibold text-white">{handoff.label}</p>
                <p className="mt-2 text-xs leading-5 text-white/60">
                  Owners: {handoff.ownerRoles.join(", ")}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/54">
                  Destinations: {handoff.destinationRoutes.join(", ") || "none"}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
          <h3 className="text-sm font-semibold text-white">Risk and escalation posture</h3>
          <div className="mt-3 grid gap-3">
            {plan.risks.map((risk) => (
              <div
                key={risk.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{risk.label}</p>
                  <span className="rounded-full border border-white/10 bg-[#bfdbfe]/40 px-2.5 py-1 text-[11px] font-semibold text-white/58">
                    {risk.severity}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/54">
                  {risk.triggerCondition}
                </p>
              </div>
            ))}
            {plan.escalations.map((escalation) => (
              <div
                key={escalation.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <p className="text-sm font-semibold text-white">{escalation.label}</p>
                <p className="mt-2 text-xs leading-5 text-white/60">
                  Owners: {escalation.ownerRoles.join(", ")}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/54">
                  {escalation.action}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
          <h3 className="text-sm font-semibold text-white">Imported source coverage</h3>
          <div className="mt-3 grid gap-3">
            {plan.sourceCoverage.scriptTemplates.map((template) => (
              <div
                key={template.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <p className="text-sm font-semibold text-white">{template.label}</p>
                <p className="mt-2 text-xs leading-5 text-white/60">
                  Audience: {template.audience}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/54">
                  {template.summary}
                </p>
              </div>
            ))}
            {plan.sourceCoverage.resourceLinks.map((resource) => (
              <div
                key={resource.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <p className="text-sm font-semibold text-white">{resource.label}</p>
                <p className="mt-2 text-xs leading-5 break-all text-white/54">
                  {resource.href}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
          <h3 className="text-sm font-semibold text-white">Feature flag posture</h3>
          <div className="mt-3 grid gap-3">
            {plan.featureFlags.map((flag) => (
              <div
                key={flag.flagKey}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <p className="text-sm font-semibold text-white">{flag.flagKey}</p>
                <p className="mt-2 text-xs leading-5 text-white/60">
                  Default: {flag.defaultState} | Rollout: {flag.rolloutStage}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/54">{flag.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
          <h3 className="text-sm font-semibold text-white">Source trace posture</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Sources" value={`${plan.tracePosture.sourceCount}`} />
            <MiniStat label="Traces" value={`${plan.tracePosture.traceCount}`} />
            <MiniStat
              label="Missing confirms"
              value={`${plan.tracePosture.missingSourceConfirmations}`}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-white/60">{plan.tracePosture.note}</p>
        </article>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 px-3 py-2">
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
            className="rounded-full border border-white/10 bg-[#bfdbfe]/40 px-2.5 py-1 text-xs font-semibold text-white/58"
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
    <article className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
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
