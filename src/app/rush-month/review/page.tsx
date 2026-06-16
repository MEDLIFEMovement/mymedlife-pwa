import { AppShell } from "@/components/app-shell";
import { BrowserWriteGateNotice } from "@/components/browser-write-gate-notice";
import { HqProofDecisionServerActionPanel } from "@/components/hq-proof-decision-server-action-panel";
import { HqProofDecisionResultStatesPanel } from "@/components/hq-proof-decision-result-states-panel";
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
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { prepareDisabledHqSharingDecisionWrite } from "@/services/write-readiness";

export const metadata = getStaticRouteMetadata("rushMonthReview");
export const dynamic = "force-dynamic";

type ReviewPageProps = {
  searchParams?: Promise<ReviewSearchParams>;
};

type ReviewSearchParams = {
  evidenceItemId?: string;
  hqDecisionResult?: string;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const emptySearchParams: ReviewSearchParams = {};
  const [actor, data, search] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const reviewEvidence = getReviewQueueForActor(actor, data.evidenceItems);
  const canDecideSharing = canMakeHqSharingDecision(actor);
  const sampleDecisionInput = {
    decision: "approved",
    note: "Local preview only: useful proof to share with other chapters later.",
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
  const selectedEvidenceId = search.evidenceItemId;
  const scopedDecisionResultCode =
    reviewEvidence[0]?.id === selectedEvidenceId ? hqDecisionResultCode : undefined;

  return (
    <AppShell actor={actor}>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          HQ proof-sharing review
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Proof/testimonial queue</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          This local queue reflects the MEDLIFE proof model: students submit
          proof or testimonials, and MEDLIFE HQ decides what should be shared broadly.
          Chapter leaders can track pending proof, but they do not own the
          sharing decision.
        </p>
      </section>

      {reviewEvidence.length > 0 ? (
        <section className="grid gap-3">
          {reviewEvidence.map((evidence) => {
            const assignment = data.assignments.find((item) => {
              return item.id === evidence.assignmentId;
            });

            return (
              <article key={evidence.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {assignment?.title ?? "Unlinked proof item"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/64">
                      Proof: {evidence.summary}
                    </p>
                    <p className="mt-2 text-sm text-white/54">
                      Submitted by {evidence.submittedBy}
                      {assignment ? ` for ${assignment.ownerRole}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={evidence.status} />
                </div>
                {canDecideSharing ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Approve for sharing", "Request better context", "Do not share"].map((label) => (
                      <button
                        key={label}
                        type="button"
                        disabled
                        className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/72"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-white/58">
                    Read-only: this local role can track proof posture, but HQ
                    Admin or Super Admin owns the sharing decision.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <RestrictedState
          title="No proof review rows are visible to this role."
          message="Members and DS Admin should not see the HQ proof-sharing queue. Use Admin or Super Admin to preview sharing decisions."
        />
      )}

      {firstDecisionPreview?.success ? (
        <>
          <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              Local decision contract
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              HQ decision would create a recorded event and disabled outbox row.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/66">
              Preview decision: {firstDecisionPreview.data.approval.decision}.
              Outbox status: {firstDecisionPreview.data.automationOutbox.status}.
              No sharing, warehouse export, or automation happens in Goal 12.
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
    </AppShell>
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
