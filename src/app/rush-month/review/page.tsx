import { AppShell } from "@/components/app-shell";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import { RestrictedState } from "@/components/restricted-state";
import { StatusBadge } from "@/components/status-badge";
import { WriteReadinessNotice } from "@/components/write-readiness-notice";
import { assignments, evidenceItems } from "@/data/mock-rush-month";
import {
  canMakeHqSharingDecision,
  createHqSharingDecisionMock,
  getReviewQueueForActor,
} from "@/services/local-action-contracts";
import { getLocalActorContext } from "@/services/local-actor-context";
import { prepareDisabledHqSharingDecisionWrite } from "@/services/write-readiness";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const actor = await getLocalActorContext();
  const reviewEvidence = getReviewQueueForActor(actor, evidenceItems);
  const canDecideSharing = canMakeHqSharingDecision(actor);
  const firstDecisionPreview = reviewEvidence[0]
    ? createHqSharingDecisionMock(actor, reviewEvidence[0], {
        decision: "approved",
        note: "Local preview only: useful proof to share with other chapters later.",
      })
    : undefined;
  const disabledDecisionWrite = reviewEvidence[0]
    ? prepareDisabledHqSharingDecisionWrite(actor, reviewEvidence[0], {
        decision: "approved",
        note: "Local preview only: useful proof to share with other chapters later.",
      })
    : undefined;

  return (
    <AppShell actor={actor}>
      <LocalActorNotice actor={actor} />
      <LocalRoleSwitcher actor={actor} />

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
            const assignment = assignments.find((item) => item.id === evidence.assignmentId);

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
        </>
      ) : null}
    </AppShell>
  );
}
