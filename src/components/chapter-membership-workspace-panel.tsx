import type {
  ChapterMembershipStatus,
  ChapterMembershipWorkspace,
  MembershipApprovalPacket,
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
      <section className="app-surface-info rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-blue">
          Chapter members
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{workspace.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{workspace.summary}</p>
        <p className="app-surface mt-3 max-w-3xl rounded-[1.05rem] p-3 text-xs leading-5 text-slate-500">
          {workspace.safetyNote}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Active members" value={`${workspace.counts.activeMembers}`} />
        <MiniStat label="Join requests" value={`${workspace.counts.pendingRequests}`} />
        <MiniStat label="Leaders" value={`${workspace.counts.leaders}`} />
        <MiniStat label="Enabled controls" value={`${workspace.counts.enabledControls}`} />
      </section>

      {workspace.membershipApprovalPacket ? (
        <MembershipApprovalPacketPanel packet={workspace.membershipApprovalPacket} />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="app-surface rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-slate">
            Roster follow-up
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Who needs what next?
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.members.map((member) => (
              <div
                key={member.id}
                className="app-surface-soft rounded-[1.5rem] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill status={member.membershipStatus} />
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {member.committeeLane}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">
                      {member.displayName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-[#2563eb]">
                      {member.roleLabel}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
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
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {member.nextStep}
                </p>
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-4">
          <article className="app-surface rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">
              Join requests
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {workspace.counts.enabledControls > 0
                ? "Approval queue is locally testable."
                : "Approval queue is visible, not editable."}
            </h2>
            <div className="mt-4 grid gap-3">
              {workspace.joinRequests.length > 0 ? (
                workspace.joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="app-surface-soft rounded-[1.05rem] p-3"
                  >
                    <p className="font-semibold text-slate-950">{request.displayName}</p>
                    <p className="mt-1 text-sm text-slate-500">{request.email}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
                      {request.requestedRoleLabel} / {request.source.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {request.nextStep}
                    </p>
                  </div>
                ))
              ) : (
                <p className="app-surface-soft rounded-[1.05rem] p-3 text-sm leading-6 text-slate-600">
                  This role can read roster health but does not own join-request
                  approval.
                </p>
              )}
            </div>
          </article>

          <article className="app-surface rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">
              Role coverage
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
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
        <article className="app-surface-warm rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-warm">
            Held actions
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {workspace.counts.enabledControls > 0
              ? "Only the staged join-approval lane is open."
              : "Roster-changing actions stay paused."}
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.disabledControls.map((control) => (
              <div key={control.key} className="app-surface rounded-[1.05rem] p-3">
                <p className="font-semibold text-slate-950">{control.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {control.reason}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#a16207]">
                  Future trail: {control.futureEventType}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="app-surface-info rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-blue">
            Future handoffs stay paused
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            App records come before broader system handoffs.
          </h2>
          <div className="mt-4 grid gap-3">
            {[...workspace.auditPreview, ...workspace.outboxPreview].map((item) => (
              <p
                key={item}
                className="app-surface rounded-[1.05rem] p-3 text-sm leading-6 text-slate-600"
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

function MembershipApprovalPacketPanel({
  packet,
}: {
  packet: MembershipApprovalPacket;
}) {
  return (
    <section className="app-surface rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Approval preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {packet.readinessReason}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-80">
          <PacketToken label="Now" value={packet.currentResultCode} />
          <PacketToken label="Future" value={packet.futureResultCode} />
          <PacketToken
            label="Readiness"
            value={packet.writeReadiness.resultCodeIfSubmitted}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="app-surface-soft rounded-[1.25rem] p-4">
          <p className="text-sm font-semibold text-slate-950">Approval details</p>
          <div className="mt-3 grid gap-3">
            <PacketRow label="Save path" value={packet.futureFunction} />
            <PacketRow label="Request record" value={packet.joinRequestId} />
            <PacketRow label="Applicant" value={packet.applicantName} />
            <PacketRow label="Email" value={packet.applicantEmail} />
            <PacketRow label="Role" value={packet.requestedRoleLabel} />
            <PacketRow
              label="Committee"
              value={packet.payload.requestedCommitteeLane}
            />
            <PacketRow
              label="Reviewer"
              value={packet.payload.approvedByActorEmail}
            />
            <PacketRow label="Approval note" value={packet.payload.auditReason} />
            <PacketRow
              label="Decision outcomes"
              value="Join approval result states"
            />
            <PacketRow
              label="Approval readiness"
              value={packet.writeReadiness.title}
            />
            <PacketRow
              label="Approval open"
              value={packet.writeReadiness.canSubmit ? "yes" : "not yet"}
            />
            <PacketRow label="Current outcome" value={packet.currentResultTitle} />
            <PacketRow label="Future outcome" value={packet.futureResultTitle} />
          </div>
        </div>

        <div className="app-surface-soft rounded-[1.25rem] p-4">
          <p className="text-sm font-semibold text-slate-950">What updates later</p>
          <div className="mt-3 grid gap-2">
            {packet.futureRecords.map((record) => (
              <div
                key={record.label}
                className="rounded-[1.05rem] bg-white p-3 shadow-[0_6px_20px_rgba(15,23,42,0.04)]"
              >
                <p className="app-eyebrow app-eyebrow-slate">{record.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {record.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        <PacketList
          title="Before approval opens"
          items={packet.readinessChecks.map((check) =>
            `${check.passed ? "ready" : "blocked"} ${check.label}`,
          )}
        />
        <PacketList
          title="Current gate checks"
          items={packet.writeReadiness.checks.map((check) =>
            `${check.passed ? "ready" : "blocked"} ${check.label}`,
          )}
        />
        <PacketList title="Review prompts" items={packet.reviewPrompts} />
        <PacketList
          title="Required safety checks"
          items={Array.from(packet.writeReadiness.requiredRlsTests)}
        />
      </div>

      <div className="mt-4">
        <PacketList
          title="Held actions"
          items={packet.blockedControls.map((control) => `Held ${control}`)}
        />
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PacketList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] p-3">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PacketRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PacketToken({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface-soft rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#2563eb]">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: ChapterMembershipStatus }) {
  const className =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "requested"
        ? "border-[#bfdbfe] bg-[#eaf2ff] text-[#2563eb]"
        : status === "needs_follow_up"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function RoleCoverageCard({ item }: { item: RoleCoverageItem }) {
  const className =
    item.status === "covered"
      ? "border-emerald-200 bg-emerald-50"
      : item.status === "thin"
        ? "border-amber-200 bg-amber-50"
        : "border-rose-200 bg-rose-50";

  return (
    <div className={`rounded-2xl border p-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-950">{item.roleLabel}</p>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
          {item.currentCount}/{item.recommendedMinimum}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {item.status}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.nextStep}</p>
    </div>
  );
}
