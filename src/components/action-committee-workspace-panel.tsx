import type { CommitteeWorkspaceSummary } from "@/services/campaign-ops-service";

type ActionCommitteeWorkspacePanelProps = {
  summary: CommitteeWorkspaceSummary;
};

export function ActionCommitteeWorkspacePanel({
  summary,
}: ActionCommitteeWorkspacePanelProps) {
  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Role-aware committee workspace
          </p>
          <h2 className="app-title mt-2">{summary.title}</h2>
          <p className="app-copy mt-2 max-w-3xl">{summary.detail}</p>
        </div>
        <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
          {summary.mode.replaceAll("_", " ")}
        </span>
      </div>

      <div className="app-surface mt-4 rounded-[1.25rem] p-4">
        <p className="app-eyebrow app-eyebrow-slate">
          What should I do next?
        </p>
        <p className="mt-2 text-base font-semibold leading-7 text-slate-950">{summary.nextAction}</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="app-surface rounded-[1.35rem] p-4">
          <p className="text-sm font-semibold text-slate-950">Priority event focus</p>
          <div className="mt-3 grid gap-2">
            {summary.priorityEvents.length > 0 ? (
              summary.priorityEvents.slice(0, 3).map((eventPlan) => (
                <article
                  key={eventPlan.id}
                  className="app-surface-soft rounded-[1.1rem] p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="app-eyebrow app-eyebrow-blue">
                        {eventPlan.timing} / {eventPlan.eventType.replaceAll("_", " ")}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-slate-950">{eventPlan.title}</h3>
                    </div>
                    <span className="w-fit rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                      {eventPlan.lumaStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Action: {eventPlan.expectedStudentAction}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Proof: {eventPlan.proofPrompt}
                  </p>
                </article>
              ))
            ) : (
              <p className="app-surface-soft rounded-[1.1rem] p-3 text-sm leading-6 text-slate-500">
                No student event truth is shown for this role. Use the integration
                outbox screens instead.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="app-surface rounded-[1.35rem] p-4">
            <p className="text-sm font-semibold text-slate-950">Structured events to watch</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.structuredEventsToWatch.map((eventName) => (
                <span
                  key={eventName}
                  className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-slate-500"
                >
                  {eventName}
                </span>
              ))}
            </div>
          </div>

          <div className="app-surface-warm rounded-[1.35rem] p-4">
            <p className="text-sm font-semibold text-[var(--mymedlife-info)]">Safety reminders</p>
            <ul className="mt-3 grid gap-2 text-xs leading-5 text-slate-600">
              {summary.safetyReminders.map((reminder) => (
                <li key={reminder}>{reminder}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
