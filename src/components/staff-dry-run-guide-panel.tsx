import Link from "next/link";
import type { StaffDryRunGuide } from "@/services/staff-dry-run-guide";

type StaffDryRunGuidePanelProps = {
  guide: StaffDryRunGuide;
};

export function StaffDryRunGuidePanel({ guide }: StaffDryRunGuidePanelProps) {
  if (!guide.canReadGuide) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            Staff dry run
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{guide.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            {guide.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Steps" value={`${guide.counts.steps}`} />
          <MiniStat label="Checks" value={`${guide.counts.passCriteria}`} />
          <MiniStat label="Writes" value={`${guide.counts.browserWritesExpected}`} />
          <MiniStat label="Sends" value={`${guide.counts.externalWritesExpected}`} />
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">How to run this</p>
        <ul className="mt-3 grid gap-2">
          {guide.staffInstructions.map((instruction) => (
            <li key={instruction} className="text-sm leading-6 text-white/64">
              {instruction}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
              Local write rehearsal
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {guide.writeRehearsal.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
              {guide.writeRehearsal.summary}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <MiniStat label="Packets" value={`${guide.writeRehearsal.counts.steps}`} />
            <MiniStat
              label="Ready"
              value={`${guide.writeRehearsal.counts.readyOrObserved}`}
            />
            <MiniStat
              label="Candidates"
              value={`${guide.writeRehearsal.counts.localBrowserWriteCandidates}`}
            />
            <MiniStat
              label="Sends"
              value={`${guide.writeRehearsal.counts.externalWritesExpected}`}
            />
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-50/78">
          This is not a write button. It tells staff which local packet to inspect,
          which fake actor to use, and when to stop before any hosted write
          promotion, student pilot, or external automation approval.
        </p>

        <div className="mt-4 grid gap-3">
          {guide.writeRehearsal.steps.map((step) => (
            <article
              key={step.operation}
              className="rounded-[1.5rem] border border-white/10 bg-[#061f25]/72 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                    {step.operation.replaceAll("_", " ")} / {step.actorLabel}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {step.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {step.rehearsalAction}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-cyan-100">
                  {step.packetStatus.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-semibold text-white">
                    Rehearsal actor
                  </p>
                  <p className="mt-2 rounded-xl bg-black/20 p-3 font-mono text-xs text-cyan-100/78">
                    MYMEDLIFE_LOCAL_ACTOR_EMAIL={step.localActorEmail}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={step.packetRoute}
                      className="rounded-full bg-cyan-300 px-3 py-2 text-xs font-semibold text-[#061f25]"
                    >
                      Open packet
                    </Link>
                    <Link
                      href={step.operatingRoute}
                      className="rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold text-white/72"
                    >
                      Open route
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-semibold text-white">
                    Role responsibility
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/70">
                    {step.roleResponsibility.responsibility}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/58">
                    {step.roleResponsibility.reviewPrompt}
                  </p>
                  <p className="mt-3 rounded-xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/52">
                    {step.roleResponsibility.safetyBoundary}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-semibold text-white">
                    Responsible role
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/58">
                    {step.roleResponsibility.roleLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-semibold text-white">
                    Packet decision
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/58">
                    {step.packetDecision}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <MiniStat
                      label="Readback"
                      value={`${step.observedReadbackItems}`}
                    />
                    <MiniStat
                      label="Candidate"
                      value={`${step.packetBrowserWritesExpected}`}
                    />
                    <MiniStat
                      label="Staging"
                      value={step.canPromoteToStagingReview ? "Review" : "Blocked"}
                    />
                  </div>
                </div>
              </div>

              <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-50/72">
                Stop condition: {step.stopCondition}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {guide.steps.map((step, index) => (
          <article
            key={step.id}
            className="rounded-3xl border border-white/10 bg-[#071d1a]/78 p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
                  Step {index + 1} / {step.actorLabel}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  {step.rehearsalGoal}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                <Link
                  href={step.route}
                  className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
                >
                  Open {step.route}
                </Link>
                <p className="max-w-xs rounded-xl bg-black/20 px-3 py-2 font-mono text-xs text-emerald-100/78">
                  MYMEDLIFE_LOCAL_ACTOR_EMAIL={step.localActorEmail}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.85fr]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-semibold text-white">Pass criteria</p>
                <ul className="mt-3 grid gap-2">
                  {step.passCriteria.map((criterion) => (
                    <li key={criterion} className="text-xs leading-5 text-white/58">
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-semibold text-white">Events to notice</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {step.structuredEventsToNotice.map((eventName) => (
                    <span
                      key={`${step.id}-${eventName}`}
                      className="rounded-full border border-emerald-200/15 bg-emerald-200/10 px-3 py-1 font-mono text-[0.68rem] text-emerald-100/80"
                    >
                      {eventName}
                    </span>
                  ))}
                </div>
                <p className="mt-3 rounded-xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/52">
                  Safety: {step.safetyAssertion}
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
