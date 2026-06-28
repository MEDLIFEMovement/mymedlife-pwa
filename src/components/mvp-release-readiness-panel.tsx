import type {
  MvpReleaseReadinessSummary,
  ReleaseReadinessStatus,
} from "@/services/mvp-release-readiness";

type MvpReleaseReadinessPanelProps = {
  summary: MvpReleaseReadinessSummary;
};

export function MvpReleaseReadinessPanel({
  summary,
}: MvpReleaseReadinessPanelProps) {
  if (!summary.canReadSummary) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
            Release readiness
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{summary.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {summary.plainEnglishVerdict}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Local review" value={summary.localReviewReady ? "yes" : "no"} />
          <MiniStat label="Live launch" value={summary.liveLaunchReady ? "yes" : "no"} />
          <MiniStat label="Writes" value={`${summary.browserWritesEnabled}`} />
          <MiniStat label="Sends" value={`${summary.externalWritesEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <ReadinessList title="Ready for local review" items={summary.achievements} />
        <ReadinessList title="Blocked before live launch" items={summary.blockers} />
      </div>

      {summary.roleModelReviewCheckpoint ? (
        <RoleModelCheckpoint checkpoint={summary.roleModelReviewCheckpoint} />
      ) : null}

      {summary.phase2Closeout ? (
        <Phase2CloseoutCard closeout={summary.phase2Closeout} />
      ) : null}

      <div className="mt-4 rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
        <p className="text-sm font-semibold text-white">Approvals needed next</p>
        <ul className="mt-3 grid gap-2">
          {summary.nextApprovals.map((approval) => (
            <li key={approval} className="text-sm leading-6 text-white/64">
              {approval}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Phase2CloseoutCard({
  closeout,
}: {
  closeout: NonNullable<MvpReleaseReadinessSummary["phase2Closeout"]>;
}) {
  return (
    <article className="mt-4 rounded-2xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{closeout.title}</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            {closeout.summary}
          </p>
        </div>
        <span className="rounded-full border border-[var(--mymedlife-border)]/20 bg-[var(--mymedlife-border)]/10 px-3 py-1 font-mono text-xs font-semibold text-[var(--mymedlife-badge-background)]/80">
          {closeout.packetPath}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <CloseoutList title="Proven now" items={closeout.provenNow} />
        <CloseoutList title="Still blocked" items={closeout.stillBlocked} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
        <p className="text-sm font-semibold text-white">Named owners still needed</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {closeout.namedOwnersStillNeeded.map((owner) => (
            <span
              key={owner}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/60"
            >
              {owner}
            </span>
          ))}
        </div>
        {closeout.recordedOwnerAnswers.length > 0 ? (
          <>
            <p className="mt-4 text-sm font-semibold text-white">Recorded owner answers</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {closeout.recordedOwnerAnswers.map((owner) => (
                <span
                  key={owner}
                  className="rounded-full border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 px-3 py-1 text-xs font-semibold text-[var(--mymedlife-badge-background)]/80"
                >
                  {owner}
                </span>
              ))}
            </div>
          </>
        ) : null}
        <p className="mt-3 text-xs leading-5 text-white/54">{closeout.nextDecision}</p>
      </div>
    </article>
  );
}

function CloseoutList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-white/60">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

type RoleModelCheckpointValue = NonNullable<
  MvpReleaseReadinessSummary["roleModelReviewCheckpoint"]
>;

function RoleModelCheckpoint({
  checkpoint,
}: {
  checkpoint: RoleModelCheckpointValue;
}) {
  return (
    <article className="mt-4 rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{checkpoint.title}</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            {checkpoint.plainEnglish}
          </p>
        </div>
        <span className="rounded-full border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 px-3 py-1 text-xs font-semibold text-[var(--mymedlife-badge-background)]">
          {checkpoint.items.length} route checks
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {checkpoint.items.map((item) => (
          <div key={`${item.route}-${item.label}`} className="rounded-2xl bg-white/[0.05] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                {item.route}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                {item.browserWritesExpected} writes
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                {item.externalWritesExpected} sends
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-white">{item.label}</h3>
            <p className="mt-2 break-words font-mono text-xs text-[var(--mymedlife-badge-background)]/70">
              {item.reviewerActorEmail}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/60">{item.passSignal}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/70 p-3 text-xs leading-5 text-white/54">
        {checkpoint.finalDecisionPrompt}
      </p>
    </article>
  );
}

function ReadinessList({
  items,
  title,
}: {
  items: MvpReleaseReadinessSummary["achievements"];
  title: string;
}) {
  return (
    <article className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-white/[0.05] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={item.status} />
              <p className="text-sm font-semibold text-white">{item.label}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {item.plainEnglish}
            </p>
          </div>
        ))}
      </div>
    </article>
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

function StatusPill({ status }: { status: ReleaseReadinessStatus }) {
  const className =
    status === "ready_for_local_review"
      ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
      : "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
