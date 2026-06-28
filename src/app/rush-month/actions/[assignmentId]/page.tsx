import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getChapterEventPlans } from "@/services/campaign-ops-service";
import { ActionStartActivationContractPanel } from "@/components/action-start-activation-contract-panel";
import { ActionStartResultStatesPanel } from "@/components/action-start-result-states-panel";
import { ActionStartServerActionPanel } from "@/components/action-start-server-action-panel";
import { ActionProofHandoffPanel } from "@/components/action-proof-handoff-panel";
import { StudentAppShell } from "@/components/student-app-shell";
import { BrowserWriteGateNotice } from "@/components/browser-write-gate-notice";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { MemberActionDetailPanel } from "@/components/member-action-detail-panel";
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
import { getMemberActionDetailWorkspace } from "@/services/member-action-detail-workspace";
import { getRushMonthActionDetailRouteRedirectHref } from "@/services/owned-route-redirect";
import {
  type MemberActionRouteSource,
  buildMemberActionRouteHref,
} from "@/services/member-action-route-href";
import {
  type ProofSubmissionResultCode,
  getDisabledProofSubmissionResultPreview,
  getProofSubmissionResultStates,
} from "@/services/proof-submission-result-states";
import { getProofSubmissionWriteReadiness } from "@/services/proof-submission-write";
import {
  canReadAssignment,
  isMemberSurfaceFamily,
} from "@/services/role-visibility";
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
  event?: string;
  proofSubmissionResult?: string;
  source?: string;
  step?: string;
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
  const redirectHref = getRushMonthActionDetailRouteRedirectHref(actor);

  if (redirectHref) {
    redirect(redirectHref);
  }

  const assignment = data.assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    notFound();
  }

  if (!canReadAssignment(actor, assignment)) {
    const isMemberAssignmentSurface = isMemberSurfaceFamily(actor);

    return (
      <StudentAppShell
        actor={actor}
        hideTopHeader={isMemberAssignmentSurface}
        showMobileQuickItemHelpers={!isMemberAssignmentSurface}
        showDebugTools={!isMemberAssignmentSurface}
      >
        <RestrictedState
          title="This action is hidden for the selected local role."
          message="The assignment exists in mock data, but the current actor should not read it. Use the local role switcher from the actions page to preview another fake role."
          nextHref="/rush-month/actions"
          nextLabel="Back to visible actions"
        />
      </StudentAppShell>
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
  const memberActionStep = parseMemberActionStep(search.step);
  const memberActionSource = parseMemberActionSource(search.source);
  const relatedEvent = search.event
    ? getChapterEventPlans().find(
        (eventPlan) =>
          eventPlan.id === search.event && eventPlan.campaignSlug === "rush-month",
      ) ?? null
    : null;
  const effectiveMemberActionSource =
    memberActionSource ?? (relatedEvent ? "events" : null);
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
  const isMemberActionDetail = isMemberSurfaceFamily(actor);
  const memberWorkspace = isMemberActionDetail
    ? getMemberActionDetailWorkspace(assignment)
    : null;

  if (isMemberActionDetail && memberWorkspace) {
    const defaultActionHref = buildMemberActionRouteHref(assignment.id, {
      eventId: relatedEvent?.id,
      source: effectiveMemberActionSource ?? undefined,
    });
    const submitEvidenceHref = buildMemberActionRouteHref(assignment.id, {
      eventId: relatedEvent?.id,
      source: effectiveMemberActionSource ?? undefined,
      step: "submit",
    });
    const submittedEvidenceHref = buildMemberActionRouteHref(assignment.id, {
      eventId: relatedEvent?.id,
      source: effectiveMemberActionSource ?? undefined,
      step: "submitted",
    });
    const showSubmitStep = memberActionStep === "submit" && canSubmitProof;
    const showSubmittedStep = memberActionStep === "submitted" && canSubmitProof;
    const showMemberSubmitState = showSubmitStep || showSubmittedStep;
    const memberActionOrigin = relatedEvent
      ? null
      : getMemberActionOrigin(effectiveMemberActionSource);
    const memberActionSourceContext = relatedEvent
      ? {
          eyebrow: "From event",
          detail: showMemberSubmitState
            ? "You are submitting proof from this event handoff. Keep the story or evidence tied to the event moment so the chapter can reuse it later."
            : "This action was opened from the event detail route. Keep the task and proof connected to the event moment you are helping create.",
          href: getRelatedEventBackHref(relatedEvent.id, effectiveMemberActionSource),
          backLabel: "Back to event detail",
        }
      : memberActionOrigin
        ? {
            eyebrow: memberActionOrigin.eyebrow,
            detail: showMemberSubmitState
              ? memberActionOrigin.submitDetail
              : memberActionOrigin.detail,
            href: memberActionOrigin.href,
            backLabel: memberActionOrigin.backLabel,
          }
        : null;

    return (
      <StudentAppShell
        actor={actor}
        hideTopHeader
        showMobileQuickItemHelpers={false}
        showDebugTools={false}
      >
        <section className="grid gap-4">
          {showMemberSubmitState && memberActionSourceContext ? (
            <section className="app-surface rounded-[1.8rem] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="app-eyebrow app-eyebrow-blue">{memberActionSourceContext.eyebrow}</p>
                  {relatedEvent ? (
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {relatedEvent.title}
                    </h2>
                  ) : null}
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {memberActionSourceContext.detail}
                  </p>
                </div>
                <Link
                  href={memberActionSourceContext.href}
                  className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
                >
                  {memberActionSourceContext.backLabel}
                </Link>
              </div>
            </section>
          ) : null}

          {showSubmitStep ? (
            <div className="flex justify-start">
              <Link
                href={defaultActionHref}
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
              >
                Back to action details
              </Link>
            </div>
          ) : null}

          {showSubmitStep ? (
            <MemberActionDetailPreview
              assignment={memberWorkspace.previewAssignment}
              editHref={submitEvidenceHref}
              actionDetailHref={defaultActionHref}
              queueHref={buildMemberEvidenceRouteHref(effectiveMemberActionSource)}
              sectionId="submit-evidence"
              submittedHref={submittedEvidenceHref}
            />
          ) : null}

          {showSubmittedStep ? (
            <MemberActionDetailPreview
              assignment={memberWorkspace.previewAssignment}
              actionDetailHref={defaultActionHref}
              editHref={submitEvidenceHref}
              queueHref={buildMemberEvidenceRouteHref(effectiveMemberActionSource)}
              mode="submitted"
              sectionId="submit-evidence"
            />
          ) : null}

          {!showMemberSubmitState ? (
            <MemberActionDetailPanel
              workspace={memberWorkspace}
              actionHref={submitEvidenceHref}
              sourceContext={memberActionSourceContext}
            />
          ) : null}
        </section>
      </StudentAppShell>
    );
  }

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader={isMemberActionDetail}
      showMobileQuickItemHelpers={!isMemberActionDetail}
      showDebugTools={!isMemberActionDetail}
    >
      <section className="overflow-hidden rounded-[2rem] border border-[var(--accent)]/30 bg-[linear-gradient(145deg,var(--mymedlife-gradient-blue-start)_0%,var(--mymedlife-gradient-blue-mid)_58%,var(--mymedlife-gradient-blue-end)_100%)] p-5 shadow-[0_24px_80px_rgb(var(--mymedlife-deep-rgb)/0.32)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/82">
                Member action detail
              </span>
              <span className="rounded-full border border-[var(--mymedlife-primary-button)]/30 bg-[var(--mymedlife-primary-button)]/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
                {assignment.points} points
              </span>
            </div>
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

      <DataSourceNotice source={data.source} />

      <div className="grid gap-4 rounded-[2rem] bg-[var(--mymedlife-panel-tint)] p-4 shadow-[0_18px_50px_rgb(var(--mymedlife-deep-rgb)/0.12)]">
        <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
          <article className="app-surface-info rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-blue">Action flow</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Finish the task, then submit one clean proof note.
            </h2>
            <p className="app-copy mt-3">
              This screen should keep the student focused on one action, one outcome, and one believable proof handoff instead of spreading the work across multiple tools.
            </p>
          </article>

          <article className="app-surface-warm rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-warm">Before you submit</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Make sure the proof matches the action.
            </h2>
            <p className="app-copy mt-3">
              Reviewers need one accurate note, screenshot, or link that clearly shows what happened and why it counts toward the chapter goal.
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="app-surface rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">Why it matters</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              One clear action should help the chapter move this week forward.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {getActionWhyItMatters(assignment)}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="app-surface-soft rounded-[1.15rem] p-4">
                <p className="app-eyebrow app-eyebrow-slate">Due date</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{assignment.dueLabel}</p>
              </div>
              <div className="app-surface-soft rounded-[1.15rem] p-4">
                <p className="app-eyebrow app-eyebrow-slate">Assigned lane</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{assignment.ownerRole}</p>
              </div>
            </div>
            <div className="app-surface-warm mt-4 rounded-[1.25rem] p-4">
              <p className="app-eyebrow app-eyebrow-warm">Evidence requirement</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {assignment.evidenceRequired}
              </p>
            </div>
          </section>

          <section className="app-surface rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">Steps</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Finish the action, then capture the proof.
            </h2>
            <ol className="mt-4 grid gap-3">
              {getActionSteps(assignment).map((step, index) => (
                <li
                  key={step}
                  className="app-surface-soft rounded-[1.25rem] p-4"
                >
                  <p className="app-eyebrow app-eyebrow-blue">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="app-surface rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">Action detail</p>
            <div className="mt-4 grid gap-3">
              <div className="app-surface-soft rounded-[1.25rem] p-4">
                <p className="app-eyebrow app-eyebrow-slate">Assigned to</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {assignment.ownerRole}
                </p>
              </div>
              <div className="app-surface-soft rounded-[1.25rem] p-4">
                <p className="app-eyebrow app-eyebrow-slate">KPI this supports</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{assignment.kpi}</p>
              </div>
              <div className="app-surface-soft rounded-[1.25rem] p-4">
                <p className="app-eyebrow app-eyebrow-slate">Proof handoff</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  After the action happens, the next job is to explain what changed,
                  what evidence backs it up, and why another student should care.
                </p>
              </div>
              <div className="app-surface-info rounded-[1.25rem] p-4">
                <p className="app-eyebrow app-eyebrow-blue">Submit path</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Finish the task, confirm your proof is accurate, then submit one clean note or link for review.
                </p>
              </div>
            </div>
          </section>

          {canSubmitProof ? (
            <MemberActionDetailPreview assignment={assignment} />
          ) : (
            <section className="app-surface rounded-[2rem] p-5">
              <p className="app-eyebrow app-eyebrow-slate">Submit preview</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                This role can read the action, but not submit proof.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The member-facing proof flow stays visible below as a handoff and
                review-state explanation, while this selected role keeps writes blocked.
              </p>
            </section>
          )}
        </section>
      </div>

      <>
          <ActionProofHandoffPanel workspace={proofHandoff} />

          {actionStartedPreview.success ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Local action contract
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Starting this action would create an internal event.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
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

          <Link href="/rush-month/actions" className="text-sm font-semibold text-[var(--mymedlife-focus-blue)]">
            Back to all actions
          </Link>
      </>
    </StudentAppShell>
  );
}

function parseMemberActionStep(
  value: string | undefined,
): "details" | "submit" | "submitted" {
  if (value === "submit" || value === "submitted") {
    return value;
  }

  return "details";
}

function parseMemberActionSource(value: string | undefined): MemberActionRouteSource | null {
  switch (value) {
    case "home":
    case "campaigns":
    case "evidence":
    case "events":
    case "points":
    case "profile":
      return value;
    default:
      return null;
  }
}

function getMemberActionOrigin(source: MemberActionRouteSource | null) {
  switch (source) {
    case "home":
      return {
        eyebrow: "From home",
        title: "This action started from your member home.",
        detail:
          "Keep the action tied to the weekly priority you opened from the home route so the member loop still feels like one clear next step.",
        submitDetail:
          "You are submitting from the home priority handoff. Keep the proof specific to the weekly task the home screen surfaced.",
        href: "/",
        backLabel: "Back to home",
      };
    case "campaigns":
      return {
        eyebrow: "From campaigns",
        title: "This action came from the Rush Month campaign view.",
        detail:
          "The campaign route framed why this task matters. Keep the proof and follow-through tied to that same Rush Month operating context.",
        submitDetail:
          "You are submitting from the campaign handoff. Keep the evidence connected to the campaign action this route asked you to finish.",
        href: "/campaigns",
        backLabel: "Back to campaigns",
      };
    case "evidence":
      return {
        eyebrow: "From proof",
        title: "This action came from your proof queue.",
        detail:
          "The proof route should stay the broader queue, while this action route keeps the member focused on the exact task that still needs evidence or clearer context.",
        submitDetail:
          "You are submitting from the proof handoff. Keep the note, screenshot, or story tied to the specific action your proof queue surfaced.",
        href: "/rush-month/evidence",
        backLabel: "Back to proof",
      };
    case "events":
      return {
        eyebrow: "From events",
        title: "This action came from the events route.",
        detail:
          "The events surface should move the member into one concrete next action while keeping the chapter moment and RSVP context visible.",
        submitDetail:
          "You are submitting from the events handoff. Keep the evidence tied to the chapter moment this event flow surfaced.",
        href: "/rush-month/events",
        backLabel: "Back to events",
      };
    case "points":
      return {
        eyebrow: "From points",
        title: "This action was opened from points and recognition.",
        detail:
          "The points screen should lead to the next concrete action, not a dead-end leaderboard. Finishing this task is how the recognition loop moves.",
        submitDetail:
          "You are submitting from the recognition handoff. Keep the proof clear enough that the later review can explain why the points should move.",
        href: "/rush-month/leaderboard",
        backLabel: "Back to points",
      };
    case "profile":
      return {
        eyebrow: "From profile",
        title: "This action came from your profile route.",
        detail:
          "The profile screen should stay owned and distinct while still pointing you back into the real member work that needs attention.",
        submitDetail:
          "You are submitting from the profile handoff. Keep the proof tied to the member task your profile surfaced as the next thing to finish.",
        href: "/profile",
        backLabel: "Back to profile",
      };
    default:
      return null;
  }
}

function buildMemberEvidenceRouteHref(source: MemberActionRouteSource | null) {
  if (!source || source === "evidence") {
    return "/rush-month/evidence";
  }

  return `/rush-month/evidence?source=${source}`;
}

function getRelatedEventBackHref(
  eventId: string,
  source: MemberActionRouteSource | null,
) {
  if (source === "campaigns") {
    return `/rush-month/events/${eventId}?source=campaigns`;
  }

  if (source === "home") {
    return `/rush-month/events/${eventId}?source=home`;
  }

  return `/rush-month/events/${eventId}`;
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
