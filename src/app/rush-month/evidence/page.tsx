import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MemberProofStatusPanel } from "@/components/member-proof-status-panel";
import { RestrictedState } from "@/components/restricted-state";
import { assignments, evidenceItems } from "@/data/mock-rush-month";
import {
  getEvidenceSubmissionWorkspace,
  type EvidenceSubmissionPacket,
  type EvidenceSubmissionRow,
  type EvidenceSubmissionWorkspace,
} from "@/services/evidence-submission-workspace";
import { getReviewQueueForActor } from "@/services/local-action-contracts";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberProofStatusWorkspace } from "@/services/member-proof-status";
import { canReadAssignment } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEvidence");
export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const actor = await getLocalActorContext();
  const visibleAssignmentIds = new Set(
    assignments
      .filter((assignment) => canReadAssignment(actor, assignment))
      .map((assignment) => assignment.id),
  );
  const hqQueue = getReviewQueueForActor(actor, evidenceItems);
  const visibleEvidence =
    hqQueue.length > 0
      ? hqQueue
      : evidenceItems.filter((item) => visibleAssignmentIds.has(item.assignmentId));
  const evidenceSubmissionWorkspace = getEvidenceSubmissionWorkspace(actor);
  const proofStatusWorkspace = getMemberProofStatusWorkspace(actor);

  return (
    <AppShell actor={actor}>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Evidence
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Mock proof and testimonials</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          Proof is a testimonial, bridge video, event note, or other experience
          artifact. HQ decides what should be shared broadly; chapter leaders can
          track follow-up but do not own broad proof-sharing decisions.
        </p>
      </section>

      <EvidenceSubmissionReadinessPanel workspace={evidenceSubmissionWorkspace} />
      <MemberProofStatusPanel workspace={proofStatusWorkspace} />

      {visibleEvidence.length > 0 ? (
        <section className="grid gap-3">
          {visibleEvidence.map((item) => (
            <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-emerald-100/70">{item.evidenceType}</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{item.summary}</h2>
                  <p className="mt-2 text-sm text-white/62">Submitted by {item.submittedBy}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
                  {item.status}
                </span>
              </div>
              <Link
                href={`/rush-month/actions/${item.assignmentId}`}
                className="mt-4 inline-flex text-sm font-semibold text-emerald-100"
              >
                Open linked action
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <RestrictedState
          title="No proof rows are visible to this role."
          message="DS Admin and unrelated local contexts should not see student proof/testimonials. Use the local role switcher to preview member, leader, coach, admin, or super admin views."
        />
      )}
    </AppShell>
  );
}

function EvidenceSubmissionReadinessPanel({
  workspace,
}: {
  workspace: EvidenceSubmissionWorkspace;
}) {
  if (!workspace.canReadWorkspace) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            What should I submit next?
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {workspace.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
            {workspace.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Ready" value={`${workspace.counts.readyToSubmit}`} />
          <MiniStat label="Changes" value={`${workspace.counts.changesRequested}`} />
          <MiniStat label="Prep" value={`${workspace.counts.prepPackets}`} />
        </div>
      </div>

      {workspace.nextSubmission ? (
        <article className="mt-5 rounded-3xl border border-emerald-300/25 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/72">
            Next proof item
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {workspace.nextSubmission.assignmentTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/66">
                {workspace.nextSubmission.nextStep}
              </p>
              <p className="mt-3 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-sm leading-6 text-white/62">
                {workspace.nextSubmission.storyPrompt}
              </p>
            </div>
            <Link
              href={workspace.nextSubmission.proofIntakeHref}
              className="w-fit rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
            >
              {workspace.nextSubmission.proofIntakeLabel}
            </Link>
          </div>
        </article>
      ) : (
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">
            No proof item is ready to submit for this local role.
          </p>
          <p className="mt-2 text-sm leading-6 text-white/62">
            Review the queue below or switch local actors to inspect a different
            role.
          </p>
        </div>
      )}

      {workspace.submissionPacket ? (
        <EvidenceSubmissionPacketPanel packet={workspace.submissionPacket} />
      ) : null}

      <div className="mt-5 grid gap-3">
        {workspace.rows.map((row) => (
          <EvidenceSubmissionCard key={row.assignmentId} row={row} />
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <TokenList
          title="Future structured records"
          items={workspace.futureStructuredEvents.map((event) => event.eventType)}
        />
        <TokenList title="Blocked writes" items={workspace.blockedWrites} />
      </div>

      <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
        <p className="text-sm font-semibold text-amber-100">
          Metadata only until approval
        </p>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-amber-50/72">
          {workspace.safetyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EvidenceSubmissionPacketPanel({
  packet,
}: {
  packet: EvidenceSubmissionPacket;
}) {
  return (
    <section className="mt-5 rounded-3xl border border-sky-300/20 bg-sky-300/10 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/78">
            Proof packet
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {packet.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
            {packet.assignmentTitle} can be shaped for the local proof metadata
            function while saves, uploads, nudges, publishing, and external sends
            stay locked.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PacketToken label="Current" value={packet.currentResultCode} />
          <PacketToken label="Future" value={packet.futureResultCode} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Metadata payload
          </p>
          <div className="mt-3 grid gap-2 text-sm leading-6">
            <PacketRow label="Function" value={packet.localFunction} />
            <PacketRow label="Evidence type" value={packet.payload.evidenceType} />
            <PacketRow label="Summary" value={packet.payload.summary} />
            <PacketRow label="Action route" value={packet.targetRoute} />
            <PacketRow label="Review route" value={packet.reviewRoute} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Result preview
          </p>
          <div className="mt-3 grid gap-2">
            <p className="rounded-2xl bg-white/[0.05] p-3 text-sm leading-6 text-white/64">
              Now: {packet.currentResultTitle}
            </p>
            <p className="rounded-2xl bg-white/[0.05] p-3 text-sm leading-6 text-white/64">
              If enabled: {packet.futureResultTitle}
            </p>
            <p className="rounded-2xl bg-white/[0.05] p-3 text-xs leading-5 text-white/52">
              {packet.readinessReason}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Readiness checks</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {packet.readinessChecks.map((check) => (
              <span
                key={check.key}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  check.passed
                    ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
                    : "border-amber-300/30 bg-amber-300/15 text-amber-100"
                }`}
              >
                {check.label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Future records</p>
          <div className="mt-3 grid gap-2">
            {packet.recordPreview.map((record) => (
              <PacketRow
                key={`${record.label}-${record.value}`}
                label={record.label}
                value={record.value}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {packet.blockedControls.map((control) => (
          <span
            key={control}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/58"
          >
            Locked {control}
          </span>
        ))}
      </div>
    </section>
  );
}

function PacketRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-white/66">{value}</p>
    </div>
  );
}

function PacketToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/64">
      {label}: {value}
    </span>
  );
}

function EvidenceSubmissionCard({ row }: { row: EvidenceSubmissionRow }) {
  return (
    <article
      className={`rounded-2xl border bg-black/20 p-4 ${
        row.isRecommended ? "border-emerald-300/30" : "border-white/10"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/64">
              {row.statusLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/64">
              {row.ownerLabel}
            </span>
            {row.isRecommended ? (
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                next
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">
            {row.assignmentTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/66">
            {row.plainEnglishStatus}
          </p>
        </div>
        <Link
          href={row.actionHref}
          className="w-fit rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Open action
        </Link>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Proof needed
          </p>
          <p className="mt-2 text-sm leading-6 text-white/66">
            {row.evidenceRequired}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Write posture
          </p>
          <p className="mt-2 text-sm leading-6 text-white/66">
            {row.disabledReason}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Story prompt
          </p>
          <p className="mt-2 text-sm leading-6 text-white/66">
            {row.storyPrompt}
          </p>
          <p className="mt-3 text-xs leading-5 text-white/44">
            Review lane: {row.reviewLane}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Prep checklist
          </p>
          <ul className="mt-2 grid gap-2 text-sm leading-6 text-white/66">
            {row.preparationChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {row.disabledControls.map((control) => (
          <span
            key={`${row.assignmentId}-${control}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/56"
          >
            {control} off
          </span>
        ))}
      </div>
    </article>
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

function TokenList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/64"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
