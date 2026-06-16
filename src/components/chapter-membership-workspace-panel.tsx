import type {
  ChapterMembershipStatus,
  ChapterMembershipWorkspace,
  RoleCoverageItem,
} from "@/services/chapter-membership-workspace";

type ChapterMembershipWorkspacePanelProps = {
  workspace: ChapterMembershipWorkspace;
};

export function ChapterMembershipWorkspacePanel({
  workspace,
}: ChapterMembershipWorkspacePanelProps) {
  if (!workspace.canReadWorkspace) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
          Chapter members
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {workspace.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
          {workspace.summary}
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/54">
          {workspace.safetyNote}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Active members" value={`${workspace.counts.activeMembers}`} />
        <MiniStat label="Join requests" value={`${workspace.counts.pendingRequests}`} />
        <MiniStat label="Leaders" value={`${workspace.counts.leaders}`} />
        <MiniStat label="Enabled controls" value={`${workspace.counts.enabledControls}`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Roster follow-up
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Who needs what next?
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.members.map((member) => (
              <div
                key={member.id}
                className="rounded-3xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill status={member.membershipStatus} />
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                        {member.committeeLane}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-white">
                      {member.displayName}
                    </h3>
                    <p className="mt-1 text-sm text-white/50">{member.email}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-emerald-100">
                      {member.roleLabel}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/42">
                      {member.points} pts / {member.completedActions} done
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <MiniStat label="Open actions" value={`${member.openAssignments}`} />
                  <MiniStat
                    label="Proof"
                    value={member.proofStatus.replaceAll("_", " ")}
                  />
                  <MiniStat label="Role" value={member.roleKey.replaceAll("_", " ")} />
                </div>
                <p className="mt-3 text-sm leading-6 text-white/64">
                  {member.nextStep}
                </p>
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-4">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
              Join requests
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Approval queue is visible, not editable.
            </h2>
            <div className="mt-4 grid gap-3">
              {workspace.joinRequests.length > 0 ? (
                workspace.joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3"
                  >
                    <p className="font-semibold text-white">{request.displayName}</p>
                    <p className="mt-1 text-sm text-white/50">{request.email}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/70">
                      {request.requestedRoleLabel} / {request.source.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      {request.nextStep}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/62">
                  This role can read roster health but does not own join-request
                  approval.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
              Role coverage
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Are the right roles covered?
            </h2>
            <div className="mt-4 grid gap-3">
              {workspace.roleCoverage.map((item) => (
                <RoleCoverageCard key={item.roleKey} item={item} />
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
            Disabled controls
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Future membership writes stay locked.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.disabledControls.map((control) => (
              <div key={control.key} className="rounded-2xl bg-black/20 p-3">
                <p className="font-semibold text-white">{control.label}</p>
                <p className="mt-1 text-sm leading-6 text-white/62">
                  {control.reason}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/70">
                  Future event: {control.futureEventType}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            Automation-ready, still disabled
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Events and audit logs come before integrations.
          </h2>
          <div className="mt-4 grid gap-3">
            {[...workspace.auditPreview, ...workspace.outboxPreview].map((item) => (
              <p
                key={item}
                className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/62"
              >
                {item}
              </p>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: ChapterMembershipStatus }) {
  const className =
    status === "approved"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "requested"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : status === "needs_follow_up"
          ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
          : "border-white/10 bg-white/10 text-white/70";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function RoleCoverageCard({ item }: { item: RoleCoverageItem }) {
  const className =
    item.status === "covered"
      ? "border-emerald-300/20 bg-emerald-300/10"
      : item.status === "thin"
        ? "border-amber-300/20 bg-amber-300/10"
        : "border-rose-300/20 bg-rose-300/10";

  return (
    <div className={`rounded-2xl border p-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-white">{item.roleLabel}</p>
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/64">
          {item.currentCount}/{item.recommendedMinimum}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {item.status}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/62">{item.nextStep}</p>
    </div>
  );
}
