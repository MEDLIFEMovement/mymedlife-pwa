import Link from "next/link";
import { StudentAppShell } from "@/components/student-app-shell";
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
import { buildLeaderAssignmentRouteHref } from "@/services/leader-assignment-route-href";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  buildMemberActionRouteHref,
  type MemberActionRouteSource,
} from "@/services/member-action-route-href";
import { getMemberProofStatusWorkspace } from "@/services/member-proof-status";
import { canReadAssignment, getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEvidence");
export const dynamic = "force-dynamic";

type EvidencePageProps = {
  searchParams?: Promise<{
    source?: string;
  }>;
};

export default async function EvidencePage({ searchParams }: EvidencePageProps) {
  const emptySearchParams: { source?: string } = {};
  const actor = await getLocalActorContext();
  const search = await (searchParams ?? Promise.resolve(emptySearchParams));
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
  const isMemberEvidence = getActorSurfaceFamily(actor) === "member";
  const evidenceSource = parseEvidenceSource(search.source);
  const evidenceSourceContext = getEvidenceSourceContext(evidenceSource);
  const actionHrefForEvidence = (assignmentId: string) => {
    return isMemberEvidence
      ? buildMemberActionRouteHref(assignmentId, {
          source: "evidence",
        })
      : buildLeaderAssignmentRouteHref(assignmentId, {
          source: "evidence_queue",
        });
  };
  const actionHrefForProofStatus = (assignmentId: string) => {
    return isMemberEvidence
      ? `/rush-month/actions/${assignmentId}`
      : buildLeaderAssignmentRouteHref(assignmentId, {
          source: "proof_status",
        });
  };

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader={isMemberEvidence}
      showMobileQuickItemHelpers={!isMemberEvidence}
      showDebugTools={!isMemberEvidence}
    >
      {isMemberEvidence ? (
        <>
          <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]">
              Proof
            </p>
            <h1 className="mt-3 text-[2.15rem] font-semibold leading-none text-slate-950">
              Turn your action into one believable story.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Proof should explain what happened, why it mattered, and what another
              student would believe because of it. Keep it clean and simple.
            </p>
            {evidenceSourceContext ? (
              <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {evidenceSourceContext.eyebrow}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {evidenceSourceContext.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {evidenceSourceContext.detail}
                    </p>
                  </div>
                  <Link
                    href={evidenceSourceContext.href}
                    className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
                  >
                    {evidenceSourceContext.backLabel}
                  </Link>
                </div>
              </div>
            ) : null}
            {evidenceSubmissionWorkspace.nextSubmission ? (
              <article className="mt-5 rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
                  Next proof item
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {evidenceSubmissionWorkspace.nextSubmission.assignmentTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {evidenceSubmissionWorkspace.nextSubmission.statusLabel}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {evidenceSubmissionWorkspace.nextSubmission.storyPrompt}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={evidenceSubmissionWorkspace.nextSubmission.proofIntakeHref}
                    className="inline-flex rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
                  >
                    {evidenceSubmissionWorkspace.nextSubmission.proofIntakeLabel}
                  </Link>
                  <Link
                    href={evidenceSubmissionWorkspace.nextSubmission.actionHref}
                    className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
                  >
                    Open linked action
                  </Link>
                </div>
              </article>
            ) : null}
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[var(--mymedlife-panel-tint)] p-4 shadow-[0_18px_50px_rgb(var(--mymedlife-deep-rgb)/0.12)]">
            <section className="grid gap-3 sm:grid-cols-3">
              <MemberEvidenceStat
                label="Need proof"
                value={`${proofStatusWorkspace.counts.proofNeeded}`}
                note="Actions that need a testimonial, note, or context handoff."
              />
              <MemberEvidenceStat
                label="HQ review"
                value={`${proofStatusWorkspace.counts.waitingHqReview}`}
                note="Proof is visible internally, but broader sharing still waits on HQ."
              />
              <MemberEvidenceStat
                label="Needs context"
                value={`${proofStatusWorkspace.counts.changesRequested}`}
                note="Some proof ideas need a clearer story, consent, or hesitation answered."
              />
            </section>

            <section className="app-surface rounded-[2rem] p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="app-eyebrow app-eyebrow-blue">What good proof does</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Help the next student believe the chapter is real.
                  </h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <MemberEvidenceTip
                  title="Say what happened"
                  detail="Use plain English. What was the action, event, or conversation?"
                />
                <MemberEvidenceTip
                  title="Say why it mattered"
                  detail="Explain the outcome or feeling, not just that something occurred."
                />
                <MemberEvidenceTip
                  title="Answer one hesitation"
                  detail="A good proof note helps someone else picture why MEDLIFE is worth showing up for."
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.98fr_1.02fr]">
              <section className="app-surface-info rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-blue">Your proof queue</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  What should happen next for each action?
                </h2>
                <div className="mt-4 grid gap-3">
                  {evidenceSubmissionWorkspace.rows.map((row) => (
                    <article
                      key={row.assignmentId}
                      className="app-surface rounded-[1.25rem] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="app-eyebrow app-eyebrow-blue">{row.statusLabel}</p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-950">
                            {row.assignmentTitle}
                          </h3>
                        </div>
                        {row.isRecommended ? (
                          <span className="rounded-full border border-[var(--mymedlife-primary-button)]/35 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
                            Start here
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {row.nextStep}
                      </p>
                      <p className="mt-3 rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700">
                        {row.storyPrompt}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={row.proofIntakeHref}
                          className="rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                        >
                          {row.proofIntakeLabel}
                        </Link>
                        <Link
                          href={row.actionHref}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          Open action
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="app-surface rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-blue">What happens after you submit</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Sharing stays human-reviewed.
                </h2>
                <div className="mt-4 grid gap-3">
                  {proofStatusWorkspace.rows.map((row) => (
                    <article
                      key={row.id}
                      className="app-surface-soft rounded-[1.2rem] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="app-eyebrow app-eyebrow-slate">{row.statusLabel}</p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-950">
                            {row.assignmentTitle}
                          </h3>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {row.proofTypeLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {row.plainEnglishStatus}
                      </p>
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Next: {row.nextStep}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <MemberEvidenceLink
                href="/rush-month/actions?source=evidence"
                eyebrow="Actions"
                title="Go back to the work"
                detail="Proof should point back to the action, not replace it."
              />
              <MemberEvidenceLink
                href="/rush-month/events"
                eyebrow="Events"
                title="Turn events into stories"
                detail="Good event proof helps the next student picture the chapter in motion."
              />
              <MemberEvidenceLink
                href="/rush-month/leaderboard"
                eyebrow="Points"
                title="See how effort is recognized"
                detail="Recognition stays chapter-scoped and follows visible action."
              />
            </section>
            {visibleEvidence.length > 0 ? (
              <section className="app-surface-warm rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-warm">Existing proof examples</p>
                <div className="mt-4 grid gap-3">
                  {visibleEvidence.map((item) => (
                    <article key={item.id} className="app-surface rounded-[1.2rem] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="app-eyebrow app-eyebrow-slate">{item.evidenceType}</p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-950">
                            {item.summary}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            Submitted by {item.submittedBy}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {item.status}
                        </span>
                      </div>
                      <Link
                        href={actionHrefForEvidence(item.assignmentId)}
                        className="mt-4 inline-flex text-sm font-semibold text-[var(--mymedlife-primary-button)]"
                      >
                        Open linked action
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="app-surface-warm rounded-[2rem] p-5">
              <p className="app-eyebrow app-eyebrow-warm">A few reminders</p>
              <div className="mt-4 grid gap-3">
                <MemberEvidenceTip
                  title="Keep it specific"
                  detail="One clear moment, quote, or screenshot is more useful than a long explanation."
                />
                <MemberEvidenceTip
                  title="Keep it tied to the action"
                  detail="The best proof shows what happened because of the event, outreach, or task you just completed."
                />
                <MemberEvidenceTip
                  title="Keep it okay to share internally"
                  detail="Right now, proof stays in chapter and review spaces, so make sure the note or image is appropriate for leaders and coaches."
                />
              </div>
            </section>
          </div>

        </>
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-[var(--accent)]/30 bg-[linear-gradient(145deg,var(--mymedlife-gradient-blue-start)_0%,var(--mymedlife-gradient-blue-mid)_58%,var(--mymedlife-gradient-blue-end)_100%)] p-5 shadow-[0_24px_80px_rgb(var(--mymedlife-deep-rgb)/0.32)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
              Evidence
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Proof and testimonials</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
              Proof is a testimonial, bridge video, event note, or other experience
              artifact. HQ decides what should be shared broadly; chapter leaders can
              track follow-up but do not own broad proof-sharing decisions.
            </p>
          </section>

          <EvidenceSubmissionReadinessPanel workspace={evidenceSubmissionWorkspace} />
          <MemberProofStatusPanel
            workspace={proofStatusWorkspace}
            buildActionHref={actionHrefForProofStatus}
          />

          {visibleEvidence.length > 0 ? (
            <section className="grid gap-3">
              {visibleEvidence.map((item) => (
                <article
                  key={item.id}
                  className="app-surface rounded-[1.7rem] p-4 shadow-[0_10px_28px_rgb(var(--mymedlife-shadow-rgb)/0.05)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-xs text-[var(--mymedlife-primary-button)]">{item.evidenceType}</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">{item.summary}</h2>
                      <p className="mt-2 text-sm text-slate-600">Submitted by {item.submittedBy}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.status}
                    </span>
                  </div>
                  <Link
                    href={actionHrefForEvidence(item.assignmentId)}
                    className="mt-4 inline-flex text-sm font-semibold text-[var(--mymedlife-primary-button)]"
                  >
                    Open linked action
                  </Link>
                </article>
              ))}
            </section>
          ) : (
            <RestrictedState
              title="No proof rows are visible to this role."
              message="DS Admin and unrelated local contexts should not see student proof/testimonials. Use the local role switcher to preview member, leader, staff, admin, or super admin views."
            />
          )}
        </>
      )}
    </StudentAppShell>
  );
}

function MemberEvidenceStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="app-surface rounded-[1.35rem] p-4">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="app-copy mt-2">{note}</p>
    </article>
  );
}

function MemberEvidenceTip({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <article className="app-surface-soft rounded-[1.2rem] p-4">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function MemberEvidenceLink({
  href,
  eyebrow,
  title,
  detail,
}: {
  href: string;
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="app-surface rounded-[1.35rem] p-4 transition hover:border-[var(--mymedlife-primary-button)]/35 hover:bg-white"
    >
      <p className="app-eyebrow app-eyebrow-blue">{eyebrow}</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="app-copy mt-2">{detail}</p>
    </Link>
  );
}

function parseEvidenceSource(value?: string): MemberActionRouteSource | null {
  switch (value) {
    case "home":
    case "campaigns":
    case "events":
    case "points":
    case "profile":
      return value;
    default:
      return null;
  }
}

function getEvidenceSourceContext(source: MemberActionRouteSource | null) {
  switch (source) {
    case "home":
      return {
        eyebrow: "From home",
        title: "This proof queue opened from your member home flow.",
        detail:
          "Home pushed you here because proof is part of the weekly loop. Review what still needs a believable story, then return without losing that member-home context.",
        href: "/",
        backLabel: "Back to home",
      };
    case "campaigns":
      return {
        eyebrow: "From campaigns",
        title: "This proof queue opened from the Rush Month campaign route.",
        detail:
          "Campaign context explains why these stories matter. Keep the proof tied to that same campaign loop instead of letting it become a disconnected upload lane.",
        href: "/campaigns",
        backLabel: "Back to campaigns",
      };
    case "events":
      return {
        eyebrow: "From events",
        title: "This proof queue opened from the events route.",
        detail:
          "Events can become real chapter stories only when the follow-up stays specific. Use the queue here, then return to the event context if that is still the clearest next step.",
        href: "/rush-month/events",
        backLabel: "Back to events",
      };
    case "points":
      return {
        eyebrow: "From points",
        title: "This proof queue opened from points and recognition.",
        detail:
          "Recognition should stay tied to visible action and believable proof. Review what still needs context here, then jump back once the recognition loop makes sense.",
        href: "/rush-month/leaderboard",
        backLabel: "Back to points",
      };
    case "profile":
      return {
        eyebrow: "From profile",
        title: "This proof queue opened from your profile route.",
        detail:
          "Profile surfaced proof as part of your member-owned next step. Keep the queue tied to that profile context instead of treating it like a separate admin-style review surface.",
        href: "/profile",
        backLabel: "Back to profile",
      };
    default:
      return null;
  }
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
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            What should happen next?
          </p>
          <h2 className="app-title mt-2">{workspace.title}</h2>
          <p className="app-copy mt-2 max-w-3xl">{workspace.summary}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Ready" value={`${workspace.counts.readyToSubmit}`} />
          <MiniStat label="Changes" value={`${workspace.counts.changesRequested}`} />
          <MiniStat label="Prep" value={`${workspace.counts.prepPackets}`} />
        </div>
      </div>

      {workspace.nextSubmission ? (
        <article className="app-surface mt-5 rounded-[1.7rem] p-4">
          <p className="app-eyebrow app-eyebrow-slate">
            Next proof item
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">
                {workspace.nextSubmission.assignmentTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {workspace.nextSubmission.nextStep}
              </p>
              <p className="app-surface-soft mt-3 rounded-[1.2rem] p-3 text-sm leading-6 text-slate-600">
                {workspace.nextSubmission.storyPrompt}
              </p>
            </div>
            <Link
              href={workspace.nextSubmission.proofIntakeHref}
              className="w-fit rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              {workspace.nextSubmission.proofIntakeLabel}
            </Link>
          </div>
        </article>
      ) : (
        <div className="app-surface mt-5 rounded-[1.7rem] p-4">
          <p className="text-sm font-semibold text-slate-950">
            No proof item is ready to submit for this local role.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
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
        <TokenList title="Held actions" items={workspace.blockedWrites} />
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4">
        <p className="text-sm font-semibold text-[var(--mymedlife-badge-background)]">
          Sharing stays reviewed
        </p>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-[var(--mymedlife-badge-background)]/72">
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
    <section className="app-surface mt-5 rounded-[1.7rem] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Submission preview
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{packet.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {packet.assignmentTitle} is the proof story currently in focus.
            Review the summary, destination, and next-step posture before this
            moves forward.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PacketToken label="Current" value={packet.currentResultCode} />
          <PacketToken label="Future" value={packet.futureResultCode} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="app-surface-soft rounded-[1.2rem] p-4">
          <p className="app-eyebrow app-eyebrow-slate">
            Story details
          </p>
          <div className="mt-3 grid gap-2 text-sm leading-6">
            <PacketRow label="Save path" value={packet.localFunction} />
            <PacketRow label="Evidence type" value={packet.payload.evidenceType} />
            <PacketRow label="Summary" value={packet.payload.summary} />
            <PacketRow label="Action route" value={packet.targetRoute} />
            <PacketRow label="Review route" value={packet.reviewRoute} />
          </div>
        </div>

        <div className="app-surface-soft rounded-[1.2rem] p-4">
          <p className="app-eyebrow app-eyebrow-slate">
            Current proof path
          </p>
          <div className="mt-3 grid gap-2">
            <p className="rounded-[1.1rem] bg-white p-3 text-sm leading-6 text-slate-600 shadow-[0_6px_20px_rgb(var(--mymedlife-shadow-rgb)/0.04)]">
              Now: {packet.currentResultTitle}
            </p>
            <p className="rounded-[1.1rem] bg-white p-3 text-sm leading-6 text-slate-600 shadow-[0_6px_20px_rgb(var(--mymedlife-shadow-rgb)/0.04)]">
              If enabled: {packet.futureResultTitle}
            </p>
            <p className="rounded-[1.1rem] bg-white p-3 text-xs leading-5 text-slate-500 shadow-[0_6px_20px_rgb(var(--mymedlife-shadow-rgb)/0.04)]">
              {packet.readinessReason}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="app-surface-soft rounded-[1.2rem] p-4">
          <p className="text-sm font-semibold text-slate-950">Readiness checks</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {packet.readinessChecks.map((check) => (
              <span
                key={check.key}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  check.passed
                    ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
                    : "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
                }`}
              >
                {check.label}
              </span>
            ))}
          </div>
        </div>

        <div className="app-surface-soft rounded-[1.2rem] p-4">
          <p className="text-sm font-semibold text-slate-950">Later handoffs</p>
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
            className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-slate-500"
          >
            Hold {control}
          </span>
        ))}
      </div>
    </section>
  );
}

function PacketRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.05rem] bg-white p-3 shadow-[0_6px_20px_rgb(var(--mymedlife-shadow-rgb)/0.04)]">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-600">{value}</p>
    </div>
  );
}

function PacketToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
      {label}: {value}
    </span>
  );
}

function EvidenceSubmissionCard({ row }: { row: EvidenceSubmissionRow }) {
  return (
    <article
      className={`app-surface rounded-[1.45rem] p-4 ${
        row.isRecommended ? "border-[var(--mymedlife-primary-button)]/40 bg-[var(--background)]" : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-slate-600">
              {row.statusLabel}
            </span>
            <span className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-slate-600">
              {row.ownerLabel}
            </span>
            {row.isRecommended ? (
              <span className="rounded-full border border-[var(--mymedlife-primary-button)]/40 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
                next
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{row.assignmentTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{row.plainEnglishStatus}</p>
        </div>
        <Link
          href={row.actionHref}
          className="w-fit rounded-full border border-[var(--accent)]/28 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-primary-button)]"
        >
          Open action
        </Link>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="app-surface-soft rounded-[1.1rem] p-3">
          <p className="app-eyebrow app-eyebrow-slate">
            Proof needed
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{row.evidenceRequired}</p>
        </div>
        <div className="app-surface-soft rounded-[1.1rem] p-3">
          <p className="app-eyebrow app-eyebrow-slate">
            Submission path
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{row.disabledReason}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="app-surface-soft rounded-[1.1rem] p-3">
          <p className="app-eyebrow app-eyebrow-slate">
            Story prompt
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{row.storyPrompt}</p>
          <p className="mt-3 text-xs leading-5 text-slate-500">Review path: {row.reviewLane}</p>
        </div>
        <div className="app-surface-soft rounded-[1.1rem] p-3">
          <p className="app-eyebrow app-eyebrow-slate">
            Prep checklist
          </p>
          <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-600">
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
            className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-2.5 py-1 text-xs text-slate-500"
          >
            Hold {control}
          </span>
        ))}
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function TokenList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="app-surface rounded-[1.3rem] p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs text-slate-500"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
