import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionStartActivationContractPanel } from "@/components/action-start-activation-contract-panel";
import { ActionStartResultStatesPanel } from "@/components/action-start-result-states-panel";
import { ActionStartServerActionPanel } from "@/components/action-start-server-action-panel";
import { ActionProofHandoffPanel } from "@/components/action-proof-handoff-panel";
import { AppShell } from "@/components/app-shell";
import { BrowserWriteGateNotice } from "@/components/browser-write-gate-notice";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { MemberActionDetailPreview } from "@/components/member-action-detail-preview";
import { ProofSubmissionServerActionPanel } from "@/components/proof-submission-server-action-panel";
import { ProofSubmissionResultStatesPanel } from "@/components/proof-submission-result-states-panel";
import { RestrictedState } from "@/components/restricted-state";
import { StatusBadge } from "@/components/status-badge";
import { WriteReadinessNotice } from "@/components/write-readiness-notice";
import {
  getActionStartActivationContract,
  prepareDisabledActionStartActivationAttempt,
} from "@/services/action-start-activation-contract";
import {
  type ActionStartResultCode,
  getActionStartResultStates,
  getDisabledActionStartResultPreview,
} from "@/services/action-start-result-states";
import { getActionStartWriteReadiness } from "@/services/action-start-write";
import { getActionProofHandoffWorkspace } from "@/services/action-proof-handoff";
import {
  canSubmitProofForAssignment,
  createActionStartedMock,
  createProofSubmissionMock,
} from "@/services/local-action-contracts";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getActionDetailFacts,
  getActionSteps,
  getActionWhyItMatters,
} from "@/services/member-action-detail";
import {
  type ProofSubmissionResultCode,
  getDisabledProofSubmissionResultPreview,
  getProofSubmissionResultStates,
} from "@/services/proof-submission-result-states";
import { getProofSubmissionWriteReadiness } from "@/services/proof-submission-write";
import { canReadAssignment } from "@/services/role-visibility";
import {
  getActionStartBrowserWriteGate,
  getProofSubmissionBrowserWriteGate,
} from "@/services/browser-write-activation";
import {
  prepareDisabledActionStartWrite,
  prepareDisabledProofSubmissionWrite,
} from "@/services/write-readiness";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthActionDetail");
export const dynamic = "force-dynamic";

type ActionDetailPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
  searchParams?: Promise<ActionDetailSearchParams>;
};

type ActionDetailSearchParams = {
  actionStartResult?: string;
  proofSubmissionResult?: string;
};

export default async function ActionDetailPage({
  params,
  searchParams,
}: ActionDetailPageProps) {
  const { assignmentId } = await params;
  const emptySearchParams: ActionDetailSearchParams = {};
  const [actor, data, search] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const assignment = data.assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    notFound();
  }

  if (!canReadAssignment(actor, assignment)) {
    return (
      <AppShell actor={actor}>
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
    evidenceType: "testimonial_text",
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
  const actionStartWriteReadiness = getActionStartWriteReadiness(actor, assignment);
  const actionStartResultCode = parseActionStartResultCode(
    search.actionStartResult,
  );
  const proofSubmissionResultCode = parseProofSubmissionResultCode(
    search.proofSubmissionResult,
  );
  const proofSubmissionGate = getProofSubmissionBrowserWriteGate(
    actor,
    assignment,
    proofSubmissionInput,
  );
  const proofSubmissionWriteReadiness = getProofSubmissionWriteReadiness(
    actor,
    assignment,
    proofSubmissionInput,
  );
  const proofHandoff = getActionProofHandoffWorkspace(actor, assignment);
  const disabledProofSubmissionWrite = prepareDisabledProofSubmissionWrite(actor, assignment, {
    ...proofSubmissionInput,
  });
  const canSubmitProof = canSubmitProofForAssignment(actor, assignment);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
              Member action detail
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{assignment.title}</h1>
            <p className="mt-3 text-sm leading-6 text-white/82">
              {assignment.instructions}
            </p>
          </div>
          <StatusBadge status={assignment.status} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {getActionDetailFacts(assignment).map((fact) => (
            <div
              key={fact.label}
              className="rounded-[1.25rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm"
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/64">
                {fact.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{fact.value}</p>
              <p className="mt-2 text-sm leading-5 text-white/68">{fact.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Why it matters
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            One clear action should help the chapter move this week forward.
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/72">
            {getActionWhyItMatters(assignment)}
          </p>
          <div className="mt-4 rounded-[1.25rem] border border-[#f7d05e]/24 bg-[#f7d05e]/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
              Evidence requirement
            </p>
            <p className="mt-2 text-sm leading-6 text-white">
              {assignment.evidenceRequired}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Steps
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Finish the action, then capture the proof.
          </h2>
          <ol className="mt-4 grid gap-3">
            {getActionSteps(assignment).map((step, index) => (
              <li
                key={step}
                className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Action detail
          </p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                Assigned to
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {assignment.ownerRole}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                KPI this supports
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{assignment.kpi}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                Proof handoff
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                After the action happens, the next job is to explain what changed,
                what evidence backs it up, and why another student should care.
              </p>
            </div>
          </div>
        </section>

        {canSubmitProof ? (
          <MemberActionDetailPreview assignment={assignment} />
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
              Submit preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              This role can read the action, but not submit proof.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/68">
              The member-facing proof flow stays visible below as a handoff and
              review-state explanation, while this selected role keeps writes blocked.
            </p>
          </section>
        )}
      </section>

      <ActionProofHandoffPanel workspace={proofHandoff} />

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
      <ActionStartServerActionPanel
        assignment={assignment}
        readiness={actionStartWriteReadiness}
        resultCode={actionStartResultCode}
      />
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
            <>
              <BrowserWriteGateNotice gate={proofSubmissionGate} />
              <ProofSubmissionServerActionPanel
                assignment={assignment}
                readiness={proofSubmissionWriteReadiness}
                resultCode={proofSubmissionResultCode}
                defaultInput={proofSubmissionInput}
              />
            </>
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

function parseProofSubmissionResultCode(
  value: string | undefined,
): ProofSubmissionResultCode | undefined {
  const allowedCodes = new Set(
    getProofSubmissionResultStates().map((state) => state.code),
  );

  return value && allowedCodes.has(value as ProofSubmissionResultCode)
    ? (value as ProofSubmissionResultCode)
    : undefined;
}

function parseActionStartResultCode(
  value: string | undefined,
): ActionStartResultCode | undefined {
  const allowedCodes = new Set(
    getActionStartResultStates().map((state) => state.code),
  );

  return value && allowedCodes.has(value as ActionStartResultCode)
    ? (value as ActionStartResultCode)
    : undefined;
}
