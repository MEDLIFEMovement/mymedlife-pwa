import type {
  CoachInterventionChecklistItem,
  CoachInterventionChecklistStatus,
  CoachSupportNote,
  CoachSupportNoteStatus,
  CoachSupportNotesWorkspace,
} from "@/services/coach-support-notes";

type CoachSupportNotesPanelProps = {
  workspace: CoachSupportNotesWorkspace;
};

export function CoachSupportNotesPanel({ workspace }: CoachSupportNotesPanelProps) {
  if (!workspace.canReadWorkspace) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            Coach notes
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{workspace.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {workspace.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <MiniStat label="Notes" value={`${workspace.counts.total}`} />
          <MiniStat label="Ready" value={`${workspace.counts.readyForCheckIn}`} />
          <MiniStat label="Follow-up" value={`${workspace.counts.needsFollowUp}`} />
          <MiniStat label="Watch" value={`${workspace.counts.escalationWatch}`} />
          <MiniStat label="Writes" value={`${workspace.browserWritesEnabled}`} />
          <MiniStat label="Sends" value={`${workspace.externalWritesEnabled}`} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MiniToken label="Chapter" value={workspace.chapterName} />
        <MiniToken label="Decision" value={workspace.decision} />
        <MiniToken label="Coach-private" value={`${workspace.counts.coachPrivate}`} />
        <MiniToken label="Writes" value={`${workspace.browserWritesEnabled}`} />
        <MiniToken label="Sends" value={`${workspace.externalWritesEnabled}`} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
              Intervention checklist
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              {workspace.interventionChecklist.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
              {workspace.interventionChecklist.summary}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
            <MiniStat
              label="Items"
              value={`${workspace.interventionChecklist.counts.total}`}
            />
            <MiniStat
              label="Ready"
              value={`${workspace.interventionChecklist.counts.ready}`}
            />
            <MiniStat
              label="Watch"
              value={`${workspace.interventionChecklist.counts.watch}`}
            />
            <MiniStat
              label="Blocked"
              value={`${workspace.interventionChecklist.counts.blocked}`}
            />
            <MiniStat
              label="Sends"
              value={`${workspace.interventionChecklist.counts.externalWritesEnabled}`}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {workspace.interventionChecklist.items.map((item) => (
            <InterventionChecklistCard key={item.key} item={item} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {workspace.interventionChecklist.blockedControls.map((control) => (
            <MiniToken key={control} label="Locked" value={control} />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {workspace.notes.map((note) => (
          <SupportNoteCard key={note.key} note={note} />
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/58">
        {workspace.finalPrompt}
      </p>
    </section>
  );
}

function InterventionChecklistCard({
  item,
}: {
  item: CoachInterventionChecklistItem;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <ChecklistStatusPill status={item.status} />
          <h4 className="mt-3 text-base font-semibold text-white">{item.label}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Writes" value={`${item.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${item.externalWritesExpected}`} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/72">{item.question}</p>
      <p className="mt-2 text-xs leading-5 text-emerald-100/70">
        Next: {item.action}
      </p>
      <p className="mt-3 rounded-2xl bg-white/[0.05] p-3 text-xs leading-5 text-white/54">
        Signal: {item.sourceSignal}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.routeEvidence.map((route) => (
          <span
            key={`${item.key}-${route}`}
            className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/58"
          >
            {route}
          </span>
        ))}
      </div>
    </article>
  );
}

function SupportNoteCard({ note }: { note: CoachSupportNote }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={note.status} />
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
              {note.visibility.replaceAll("_", " ")}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{note.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            {note.ownerLane}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Writes" value={`${note.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${note.externalWritesExpected}`} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/66">{note.note}</p>
      <p className="mt-3 text-xs leading-5 text-emerald-100/70">
        Next: {note.nextStep}
      </p>

      <div className="mt-3 rounded-2xl bg-white/[0.05] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
          Source signals
        </p>
        <ul className="mt-2 grid gap-2">
          {note.sourceSignals.map((signal) => (
            <li key={`${note.key}-${signal}`} className="text-sm leading-6 text-white/62">
              {signal}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {note.routeEvidence.map((route) => (
          <span
            key={`${note.key}-${route}`}
            className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/58"
          >
            {route}
          </span>
        ))}
      </div>
    </article>
  );
}

function ChecklistStatusPill({ status }: { status: CoachInterventionChecklistStatus }) {
  const className =
    status === "ready"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "watch"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
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

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/58">
      {label} {value}
    </span>
  );
}

function StatusPill({ status }: { status: CoachSupportNoteStatus }) {
  const className =
    status === "ready_for_check_in"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "needs_follow_up"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
