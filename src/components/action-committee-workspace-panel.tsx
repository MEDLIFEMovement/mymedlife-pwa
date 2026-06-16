import type { CommitteeWorkspaceSummary } from "@/services/campaign-ops-service";

type ActionCommitteeWorkspacePanelProps = {
  summary: CommitteeWorkspaceSummary;
};

export function ActionCommitteeWorkspacePanel({
  summary,
}: ActionCommitteeWorkspacePanelProps) {
  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            Role-aware committee workspace
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{summary.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {summary.detail}
          </p>
        </div>
        <span className="w-fit rounded-full border border-white/12 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72">
          {summary.mode.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
          What should I do next?
        </p>
        <p className="mt-2 text-base font-semibold leading-7 text-white">
          {summary.nextAction}
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Priority event focus</p>
          <div className="mt-3 grid gap-2">
            {summary.priorityEvents.length > 0 ? (
              summary.priorityEvents.slice(0, 3).map((eventPlan) => (
                <article key={eventPlan.id} className="rounded-2xl bg-white/[0.05] p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
                        {eventPlan.timing} / {eventPlan.eventType.replaceAll("_", " ")}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-white">
                        {eventPlan.title}
                      </h3>
                    </div>
                    <span className="w-fit rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/62">
                      {eventPlan.lumaStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/58">
                    Action: {eventPlan.expectedStudentAction}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/48">
                    Proof: {eventPlan.proofPrompt}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-white/[0.05] p-3 text-sm leading-6 text-white/58">
                No student event truth is shown for this role. Use the integration
                outbox screens instead.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Structured events to watch</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.structuredEventsToWatch.map((eventName) => (
                <span
                  key={eventName}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/64"
                >
                  {eventName}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
            <p className="text-sm font-semibold text-amber-100">Safety reminders</p>
            <ul className="mt-3 grid gap-2 text-xs leading-5 text-amber-50/72">
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
