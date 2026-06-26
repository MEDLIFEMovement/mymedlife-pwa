import Link from "next/link";

import { StudentAppShell } from "@/components/student-app-shell";
import { BrowserWriteGateNotice } from "@/components/browser-write-gate-notice";
import { HqProofDecisionServerActionPanel } from "@/components/hq-proof-decision-server-action-panel";
import { HqProofDecisionResultStatesPanel } from "@/components/hq-proof-decision-result-states-panel";
import { LeaderEvidenceFollowUpBoardPanel } from "@/components/leader-evidence-follow-up-board-panel";
import { LeaderProofDecisionResultStatesPanel } from "@/components/leader-proof-decision-result-states-panel";
import { LeaderProofDecisionServerActionPanel } from "@/components/leader-proof-decision-server-action-panel";
import { LeaderProofDecisionWorkspacePanel } from "@/components/leader-proof-decision-workspace-panel";
import { RestrictedState } from "@/components/restricted-state";
import { StatusBadge } from "@/components/status-badge";
import { WriteReadinessNotice } from "@/components/write-readiness-notice";
import { getHqSharingDecisionBrowserWriteGate } from "@/services/browser-write-activation";
import {
  type HqProofDecisionResultCode,
  getDisabledHqProofDecisionResultPreview,
  getHqProofDecisionResultStates,
} from "@/services/hq-proof-decision-result-states";
import { getHqProofDecisionWriteReadiness } from "@/services/hq-proof-decision-write";
import {
  canMakeHqSharingDecision,
  createHqSharingDecisionMock,
  getReviewQueueForActor,
} from "@/services/local-action-contracts";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getLeaderEvidenceFollowUpBoard } from "@/services/leader-evidence-follow-up";
import {
  type LeaderProofDecisionResultCode,
  getDisabledLeaderProofDecisionResultPreview,
  getLeaderProofDecisionResultStates,
} from "@/services/leader-proof-decision-result-states";
import { getLeaderProofDecisionWriteReadiness } from "@/services/leader-proof-decision-write";
import { getLeaderProofDecisionWorkspace } from "@/services/leader-proof-decision-workspace";
import { getLeaderReviewFocus } from "@/services/leader-review-focus";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { prepareDisabledHqSharingDecisionWrite } from "@/services/write-readiness";

export const metadata = getStaticRouteMetadata("rushMonthReview");
export const dynamic = "force-dynamic";

type ReviewPageProps = {
  searchParams?: Promise<ReviewSearchParams>;
};

type ReviewSearchParams = {
  assignmentId?: string;
  evidenceItemId?: string;
  hqDecisionResult?: string;
  leaderProofDecisionResult?: string;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const emptySearchParams: ReviewSearchParams = {};
  const [actor, data, search] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const reviewEvidence = getReviewQueueForActor(actor, data.evidenceItems);
  const leaderEvidenceFollowUpBoard = getLeaderEvidenceFollowUpBoard(
    actor,
    data.assignments,
    data.evidenceItems,
  );
  const leaderProofDecisionWorkspace = getLeaderProofDecisionWorkspace(
    actor,
    data.assignments,
    data.evidenceItems,
  );
  const leaderProofDecisionPreviewRow =
    leaderProofDecisionWorkspace.rows.find((row) => {
      return row.status === "ready_for_approval";
    }) ?? leaderProofDecisionWorkspace.rows[0];
  const leaderProofDecisionPreviewAssignment = leaderProofDecisionPreviewRow
    ? data.assignments.find((item) => {
        return item.id === leaderProofDecisionPreviewRow.assignmentId;
      })
    : undefined;
  const leaderProofDecisionPreviewEvidence = leaderProofDecisionPreviewRow?.evidenceId
    ? data.evidenceItems.find((item) => {
        return item.id === leaderProofDecisionPreviewRow.evidenceId;
      })
    : undefined;
  const leaderProofDecisionResultPreview =
    leaderProofDecisionPreviewRow && leaderProofDecisionPreviewAssignment
    ? getDisabledLeaderProofDecisionResultPreview(
        actor,
        leaderProofDecisionPreviewAssignment,
        leaderProofDecisionPreviewEvidence ?? null,
        {
          decision: leaderProofDecisionPreviewRow.recommendedDecision,
          note: `Preview chapter outcome: ${leaderProofDecisionPreviewRow.leaderNextStep}`,
        },
      )
    : undefined;
  const leaderProofDecisionWriteInput = leaderProofDecisionPreviewRow
    ? {
        decision: leaderProofDecisionPreviewRow.recommendedDecision,
        note: `Local leader review: ${leaderProofDecisionPreviewRow.leaderNextStep}`,
      }
    : undefined;
  const leaderProofDecisionWriteReadiness =
    leaderProofDecisionPreviewAssignment &&
    leaderProofDecisionPreviewEvidence &&
    leaderProofDecisionWriteInput
      ? getLeaderProofDecisionWriteReadiness(
          actor,
          leaderProofDecisionPreviewAssignment,
          leaderProofDecisionPreviewEvidence,
          leaderProofDecisionWriteInput,
        )
      : undefined;
  const leaderReviewFocus = getLeaderReviewFocus(actor, leaderEvidenceFollowUpBoard);
  const canDecideSharing = canMakeHqSharingDecision(actor);
  const sampleDecisionInput = {
    decision: "approved",
    note: "Preview sharing posture: useful proof to share with other chapters later.",
  } as const;
  const firstDecisionPreview = reviewEvidence[0]
    ? createHqSharingDecisionMock(actor, reviewEvidence[0], sampleDecisionInput)
    : undefined;
  const disabledDecisionWrite = reviewEvidence[0]
    ? prepareDisabledHqSharingDecisionWrite(actor, reviewEvidence[0], sampleDecisionInput)
    : undefined;
  const hqDecisionResultPreview = reviewEvidence[0]
    ? getDisabledHqProofDecisionResultPreview(
        actor,
        reviewEvidence[0],
        sampleDecisionInput,
      )
    : undefined;
  const decisionGate = reviewEvidence[0]
    ? getHqSharingDecisionBrowserWriteGate(actor, reviewEvidence[0], sampleDecisionInput)
    : undefined;
  const hqDecisionWriteReadiness = reviewEvidence[0]
    ? getHqProofDecisionWriteReadiness(actor, reviewEvidence[0], sampleDecisionInput)
    : undefined;
  const hqDecisionResultCode = parseHqDecisionResultCode(search.hqDecisionResult);
  const leaderProofDecisionResultCode = parseLeaderProofDecisionResultCode(
    search.leaderProofDecisionResult,
  );
  const selectedEvidenceId = search.evidenceItemId;
  const selectedAssignmentId = search.assignmentId;
  const scopedDecisionResultCode =
    reviewEvidence[0]?.id === selectedEvidenceId ? hqDecisionResultCode : undefined;
  const scopedLeaderProofDecisionResultCode =
    leaderProofDecisionPreviewEvidence?.id === selectedEvidenceId &&
    leaderProofDecisionPreviewAssignment?.id === selectedAssignmentId
      ? leaderProofDecisionResultCode
      : undefined;
  const showHqQueue = canDecideSharing;
  const showLeaderTechnicalPanels = getActorSurfaceFamily(actor) === "super_admin";

  return (
    <StudentAppShell actor={actor} showDebugTools={false}>
      <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
          {showHqQueue ? "HQ proof-sharing review" : "Leader proof review"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          {showHqQueue ? "Proof sharing desk" : "Chapter proof follow-up"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {showHqQueue
            ? "Review proof that may be useful beyond one chapter, keep publishing decisions separate from local follow-through, and hold every broader-sharing step inside the HQ lane."
            : "Keep chapter proof accountable, coach owners toward clearer submissions, and hand off anything worth broader reuse to HQ without taking over the sharing decision."}
        </p>
      </section>

      {leaderReviewFocus.canReadFocus ? (
        <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
            {leaderReviewFocus.roleLabel}
          </p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                {leaderReviewFocus.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {leaderReviewFocus.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={leaderReviewFocus.primaryHref}
                className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
              >
                {leaderReviewFocus.primaryLabel}
              </Link>
              <Link
                href={leaderReviewFocus.secondaryHref}
                className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#eef5ff] hover:text-slate-950"
              >
                {leaderReviewFocus.secondaryLabel}
              </Link>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {leaderReviewFocus.items.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#bfdbfe] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-3 text-sm leading-6 text-slate-600">
            {leaderReviewFocus.safetyNote}
          </p>
        </section>
      ) : null}

      <LeaderEvidenceFollowUpBoardPanel board={leaderEvidenceFollowUpBoard} />
      <LeaderProofDecisionWorkspacePanel workspace={leaderProofDecisionWorkspace} />
      {showLeaderTechnicalPanels &&
      leaderProofDecisionWorkspace.canReadWorkspace &&
      leaderProofDecisionResultPreview ? (
        <LeaderProofDecisionResultStatesPanel
          preview={leaderProofDecisionResultPreview}
          states={getLeaderProofDecisionResultStates()}
        />
      ) : null}
      {showLeaderTechnicalPanels &&
      leaderProofDecisionWorkspace.canReadWorkspace &&
      leaderProofDecisionPreviewAssignment &&
      leaderProofDecisionPreviewEvidence &&
      leaderProofDecisionWriteReadiness &&
      leaderProofDecisionWriteInput ? (
        <LeaderProofDecisionServerActionPanel
          assignment={leaderProofDecisionPreviewAssignment}
          evidenceItem={leaderProofDecisionPreviewEvidence}
          readiness={leaderProofDecisionWriteReadiness}
          resultCode={scopedLeaderProofDecisionResultCode}
          defaultInput={leaderProofDecisionWriteInput}
        />
      ) : null}

      {showHqQueue && reviewEvidence.length > 0 ? (
        <section className="grid gap-3">
          {reviewEvidence.map((evidence) => {
            const assignment = data.assignments.find((item) => {
              return item.id === evidence.assignmentId;
            });

            return (
              <article key={evidence.id} className="rounded-3xl border border-[#bfdbfe] bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      {assignment?.title ?? "Unlinked proof item"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Proof: {evidence.summary}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Submitted by {evidence.submittedBy}
                      {assignment ? ` for ${assignment.ownerRole}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={evidence.status} />
                </div>
                {canDecideSharing ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Approve for later sharing", "Request better context", "Keep private"].map((label) => (
                      <button
                        key={label}
                        type="button"
                        disabled
                        className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        {label}
                      </button>
                    ))}
                </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    This role can track proof posture here, but HQ Admin or
                    Super Admin owns the broader-sharing decision.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      ) : showHqQueue ? (
        <RestrictedState
          title="No proof review rows are visible to this role."
          message="Members and DS Admin should not see the HQ proof-sharing queue. Use Admin or Super Admin to preview sharing decisions."
        />
      ) : null}

      {showHqQueue && firstDecisionPreview?.success ? (
        <>
          <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
              Sharing trail preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              HQ decision trail stays visible before broader sharing opens.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/66">
              Preview decision: {firstDecisionPreview.data.approval.decision}.
              Outbox status: {firstDecisionPreview.data.automationOutbox.status}.
              Broader sharing, warehouse export, and automation stay off in
              this review pass.
            </p>
          </section>
          {disabledDecisionWrite ? (
            <WriteReadinessNotice
              operationLabel="HQ proof-sharing write remains disabled"
              wouldWriteTables={disabledDecisionWrite.wouldWriteTables}
            />
          ) : null}
          {hqDecisionResultPreview ? (
            <HqProofDecisionResultStatesPanel
              preview={hqDecisionResultPreview}
              states={getHqProofDecisionResultStates()}
            />
          ) : null}
          {canDecideSharing && decisionGate ? (
            <>
              <BrowserWriteGateNotice gate={decisionGate} />
              {hqDecisionWriteReadiness && reviewEvidence[0] ? (
                <HqProofDecisionServerActionPanel
                  evidenceItem={reviewEvidence[0]}
                  readiness={hqDecisionWriteReadiness}
                  resultCode={scopedDecisionResultCode}
                  defaultInput={sampleDecisionInput}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </StudentAppShell>
  );
}

function parseHqDecisionResultCode(
  value: string | undefined,
): HqProofDecisionResultCode | undefined {
  const allowedCodes = new Set(
    getHqProofDecisionResultStates().map((state) => state.code),
  );

  return value && allowedCodes.has(value as HqProofDecisionResultCode)
    ? (value as HqProofDecisionResultCode)
    : undefined;
}

function parseLeaderProofDecisionResultCode(
  value: string | undefined,
): LeaderProofDecisionResultCode | undefined {
  const allowedCodes = new Set(
    getLeaderProofDecisionResultStates().map((state) => state.code),
  );

  return value && allowedCodes.has(value as LeaderProofDecisionResultCode)
    ? (value as LeaderProofDecisionResultCode)
    : undefined;
}
