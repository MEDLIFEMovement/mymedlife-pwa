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
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
            Coach notes
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{workspace.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {workspace.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Notes" value={`${workspace.counts.total}`} />
          <MiniStat label="Ready" value={`${workspace.counts.readyForCheckIn}`} />
          <MiniStat label="Follow-up" value={`${workspace.counts.needsFollowUp}`} />
          <MiniStat label="Watch" value={`${workspace.counts.escalationWatch}`} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MiniToken label="Chapter" value={workspace.chapterName} />
        <MiniToken label="Decision" value={workspace.decision} />
        <MiniToken label="Coach-private" value={`${workspace.counts.coachPrivate}`} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-[#dbeafe] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Intervention checklist
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {workspace.interventionChecklist.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {workspace.interventionChecklist.summary}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
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
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {workspace.interventionChecklist.items.map((item) => (
            <InterventionChecklistCard key={item.key} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {workspace.notes.map((note) => (
          <SupportNoteCard key={note.key} note={note} />
        ))}
      </div>
    </section>
  );
}

function InterventionChecklistCard({
  item,
}: {
  item: CoachInterventionChecklistItem;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <ChecklistStatusPill status={item.status} />
          <h4 className="mt-3 text-base font-semibold text-slate-950">{item.label}</h4>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{item.question}</p>
      <p className="mt-2 text-xs leading-5 text-[#2563eb]">
        Next: {item.action}
      </p>
      <p className="mt-3 rounded-2xl border border-slate-200 bg-[#dbeafe] p-3 text-xs leading-5 text-slate-500">
        Signal: {item.sourceSignal}
      </p>
    </article>
  );
}

function SupportNoteCard({ note }: { note: CoachSupportNote }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-[#dbeafe] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={note.status} />
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {note.visibility.replaceAll("_", " ")}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{note.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {note.ownerLane}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{note.note}</p>
      <p className="mt-3 text-xs leading-5 text-[#2563eb]">
        Next: {note.nextStep}
      </p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Source signals
        </p>
        <ul className="mt-2 grid gap-2">
          {note.sourceSignals.map((signal) => (
            <li key={`${note.key}-${signal}`} className="text-sm leading-6 text-slate-600">
              {signal}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ChecklistStatusPill({ status }: { status: CoachInterventionChecklistStatus }) {
  const className =
    status === "ready"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : status === "watch"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
      {label} {value}
    </span>
  );
}

function StatusPill({ status }: { status: CoachSupportNoteStatus }) {
  const className =
    status === "ready_for_check_in"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : status === "needs_follow_up"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
