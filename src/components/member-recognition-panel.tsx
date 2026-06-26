import type { MemberRecognitionSummary } from "@/services/member-recognition";

type MemberRecognitionPanelProps = {
  recognition: MemberRecognitionSummary;
};

export function MemberRecognitionPanel({ recognition }: MemberRecognitionPanelProps) {
  if (!recognition.canReadRecognition) {
    return null;
  }

  return (
    <section className="app-surface rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">Friendly competition</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {recognition.title}
          </h2>
          <p className="app-copy mt-2 max-w-3xl">{recognition.summary}</p>
        </div>
        {recognition.selectedMember ? (
          <div className="app-surface-info rounded-[1.5rem] p-4">
            <p className="app-eyebrow app-eyebrow-blue">Highlight</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              #{recognition.selectedMember.rank} {recognition.selectedMember.displayName}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {recognition.selectedMember.points} pts /{" "}
              {recognition.selectedMember.recognition}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {recognition.impacts.map((impact) => (
          <article key={impact.label} className="app-surface-soft rounded-[1.3rem] p-4">
            <p className="app-eyebrow app-eyebrow-slate">{impact.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{impact.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{impact.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-2">
        {recognition.leaderboard.map((row, index) => (
          <article key={row.id} className="app-surface-soft rounded-[1.3rem] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {index + 1}. {row.displayName}
                </p>
                <p className="mt-1 text-xs text-slate-500">{row.roleLabel}</p>
              </div>
              <span className="rounded-full border border-[#2563eb]/30 bg-[#dbeafe] px-3 py-1 text-sm font-semibold text-[#1d4ed8]">
                {row.points} pts
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {row.recognition} / {row.completedActions} completed action
              {row.completedActions === 1 ? "" : "s"}
            </p>
          </article>
        ))}
      </div>

      <p className="app-surface-soft mt-4 rounded-2xl p-3 text-xs leading-5 text-slate-500">
        Points ledger posture: {recognition.pointsLedgerPosture}. This is local
        recognition data, not a final production points ledger.
      </p>
    </section>
  );
}
