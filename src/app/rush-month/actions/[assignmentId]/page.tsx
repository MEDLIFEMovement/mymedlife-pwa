import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionStartActivationContractPanel } from "@/components/action-start-activation-contract-panel";
import { ActionStartResultStatesPanel } from "@/components/action-start-result-states-panel";
import { AppShell } from "@/components/app-shell";
import { BrowserWriteGateNotice } from "@/components/browser-write-gate-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import { ProofSubmissionResultStatesPanel } from "@/components/proof-submission-result-states-panel";
import { RestrictedState } from "@/components/restricted-state";
import { StatusBadge } from "@/components/status-badge";
import { WriteReadinessNotice } from "@/components/write-readiness-notice";
import { getAssignmentById } from "@/lib/rush-month";
import {
  getActionStartActivationContract,
  prepareDisabledActionStartActivationAttempt,
} from "@/services/action-start-activation-contract";
import {
  getActionStartResultStates,
  getDisabledActionStartResultPreview,
} from "@/services/action-start-result-states";
import {
  canSubmitProofForAssignment,
  createActionStartedMock,
  createProofSubmissionMock,
  getProofSubmissionGuidance,
} from "@/services/local-action-contracts";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getDisabledProofSubmissionResultPreview,
  getProofSubmissionResultStates,
} from "@/services/proof-submission-result-states";
import { canReadAssignment } from "@/services/role-visibility";
import {
  getActionStartBrowserWriteGate,
  getProofSubmissionBrowserWriteGate,
} from "@/services/browser-write-activation";
import {
  prepareDisabledActionStartWrite,
  prepareDisabledProofSubmissionWrite,
} from "@/services/write-readiness";

export const dynamic = "force-dynamic";

type ActionDetailPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export default async function ActionDetailPage({ params }: ActionDetailPageProps) {
  const { assignmentId } = await params;
  const actor = await getLocalActorContext();
  const assignment = getAssignmentById(assignmentId);

  if (!assignment) {
    notFound();
  }

  if (!canReadAssignment(actor, assignment)) {
    return (
      <AppShell actor={actor}>
        <LocalActorNotice actor={actor} />
        <RestrictedState
          title="This action is hidden for the selected local role."
          message="The assignment exists in mock data, but the current actor should not read it. Use the local role switcher from the actions page to preview another fake role."
          nextHref="/rush-month/actions"
          nextLabel="Back to visible actions"
        />
      </AppShell>
    );
  }

  const proofSubmissionInput = {
    evidenceType: "bridge_video",
    summary:
      "Local preview: this testimonial explains what happened and why another student should take action.",
  } as const;
  const actionStartedPreview = createActionStartedMock(actor, assignment);
  const proofSubmissionPreview = createProofSubmissionMock(
    actor,
    assignment,
    proofSubmissionInput,
  );
  const proofSubmissionResultPreview = getDisabledProofSubmissionResultPreview(
    actor,
    assignment,
    proofSubmissionInput,
  );
  const actionStartContract = getActionStartActivationContract();
  const disabledActionStartWrite = prepareDisabledActionStartWrite(actor, assignment);
  const disabledActionStartActivation = prepareDisabledActionStartActivationAttempt(
    actor,
    assignment,
  );
  const actionStartResultPreview = getDisabledActionStartResultPreview(
    actor,
    assignment,
  );
  const actionStartGate = getActionStartBrowserWriteGate(actor, assignment);
  const proofSubmissionGate = getProofSubmissionBrowserWriteGate(
    actor,
    assignment,
    proofSubmissionInput,
  );
  const disabledProofSubmissionWrite = prepareDisabledProofSubmissionWrite(actor, assignment, {
    ...proofSubmissionInput,
  });
  const canSubmitProof = canSubmitProofForAssignment(actor, assignment);

  return (
    <AppShell actor={actor}>
      <LocalActorNotice actor={actor} />
      <LocalRoleSwitcher actor={actor} />
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Member action detail
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{assignment.title}</h1>
          </div>
          <StatusBadge status={assignment.status} />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68">
          {assignment.instructions}
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <h2 className="text-2xl font-semibold text-white">What evidence is needed?</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl bg-black/20 p-3">
              <dt className="text-white/44">Owner</dt>
              <dd className="mt-1 text-white">{assignment.ownerRole}</dd>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <dt className="text-white/44">Due</dt>
              <dd className="mt-1 text-white">{assignment.dueLabel}</dd>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <dt className="text-white/44">Proof requirement</dt>
              <dd className="mt-1 text-white">{assignment.evidenceRequired}</dd>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <dt className="text-white/44">KPI</dt>
              <dd className="mt-1 text-white">{assignment.kpi}</dd>
            </div>
          </dl>
        </div>

        <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
          <h2 className="text-2xl font-semibold text-white">Submit proof preview</h2>
          <p className="mt-2 text-sm leading-6 text-white/68">
            {getProofSubmissionGuidance(actor)}
          </p>
          <label className="mt-4 block text-sm font-semibold text-white" htmlFor="proof-link">
            Evidence link or note preview
          </label>
          <textarea
            id="proof-link"
            className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/34"
            placeholder="Paste a message screenshot link, event RSVP link, or short proof note."
            disabled
          />
          <button
            type="button"
            disabled
            className="mt-4 rounded-full bg-emerald-300/70 px-4 py-2 text-sm font-semibold text-[#06211d]"
          >
            Preview only: no save happens
          </button>
          <p className="mt-3 text-xs leading-5 text-white/54">
            {canSubmitProof
              ? "Future implementation should persist this only after local auth/RLS/write rules are approved."
              : "This selected role cannot submit proof for this action."}
          </p>
        </section>
      </section>

      {actionStartedPreview.success ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Local action contract
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Starting this action would create an internal event.
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/66">
            Preview status: {actionStartedPreview.data.assignment.status}. Audit action:
            {" "}
            {actionStartedPreview.data.auditLog.action}. This is not saved yet.
          </p>
        </section>
      ) : null}

      <WriteReadinessNotice
        operationLabel="Action start write remains disabled"
        wouldWriteTables={disabledActionStartWrite.wouldWriteTables}
      />

      <BrowserWriteGateNotice gate={actionStartGate} />
      <ActionStartActivationContractPanel
        contract={actionStartContract}
        attempt={disabledActionStartActivation}
      />
      <ActionStartResultStatesPanel
        preview={actionStartResultPreview}
        states={getActionStartResultStates()}
      />

      {proofSubmissionPreview.success ? (
        <>
          <EventOutboxLog
            events={[proofSubmissionPreview.data.integrationEvent]}
            outboxItems={[proofSubmissionPreview.data.automationOutbox]}
          />
          <WriteReadinessNotice
            operationLabel="Proof submission write remains disabled"
            wouldWriteTables={disabledProofSubmissionWrite.wouldWriteTables}
          />
          <ProofSubmissionResultStatesPanel
            preview={proofSubmissionResultPreview}
            states={getProofSubmissionResultStates()}
          />
          {canSubmitProof ? (
            <BrowserWriteGateNotice gate={proofSubmissionGate} />
          ) : null}
        </>
      ) : (
        <RestrictedState
          eyebrow="Proof contract"
          title="Proof submission is restricted for this local role."
          message={proofSubmissionPreview.error}
        />
      )}

      <Link href="/rush-month/actions" className="text-sm font-semibold text-emerald-100">
        Back to all actions
      </Link>
    </AppShell>
  );
}
