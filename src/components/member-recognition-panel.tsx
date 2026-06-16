import type { MemberRecognitionSummary } from "@/services/member-recognition";

type MemberRecognitionPanelProps = {
  recognition: MemberRecognitionSummary;
};

export function MemberRecognitionPanel({ recognition }: MemberRecognitionPanelProps) {
  if (!recognition.canReadRecognition) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            Friendly competition
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {recognition.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {recognition.summary}
          </p>
        </div>
        {recognition.selectedMember ? (
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
              Highlight
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              #{recognition.selectedMember.rank} {recognition.selectedMember.displayName}
            </p>
            <p className="mt-1 text-sm text-white/64">
              {recognition.selectedMember.points} pts /{" "}
              {recognition.selectedMember.recognition}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {recognition.impacts.map((impact) => (
          <article key={impact.label} className="rounded-2xl bg-black/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
              {impact.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{impact.value}</p>
            <p className="mt-1 text-xs leading-5 text-white/58">{impact.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-2">
        {recognition.leaderboard.map((row, index) => (
          <article key={row.id} className="rounded-2xl bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {index + 1}. {row.displayName}
                </p>
                <p className="mt-1 text-xs text-white/52">{row.roleLabel}</p>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-100">
                {row.points} pts
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/62">
              {row.recognition} / {row.completedActions} completed action
              {row.completedActions === 1 ? "" : "s"}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/54">
        Points ledger posture: {recognition.pointsLedgerPosture}. This is local
        recognition data, not a final production points ledger.
      </p>
    </section>
  );
}
