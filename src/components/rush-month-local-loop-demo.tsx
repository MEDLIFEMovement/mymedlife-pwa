"use client";

import { useReducer } from "react";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { StatusBadge } from "@/components/status-badge";
import {
  applyRushMonthLoopCommand,
  canApplyRushMonthLoopCommand,
  createInitialRushMonthLocalLoopState,
  getRushMonthLoopProgress,
  getRushMonthLoopSteps,
  type RushMonthLocalLoopState,
  type RushMonthLoopCommand,
  type RushMonthLoopStepStatus,
} from "@/services/rush-month-local-loop";

type RushMonthLocalLoopDemoProps = {
  initialState?: RushMonthLocalLoopState;
};

const commandLabels: Record<RushMonthLoopCommand, string> = {
  assign_action: "Assign action",
  start_action: "Start action",
  submit_proof: "Submit proof",
  review_completion: "Approve completion",
  record_hq_sharing: "Record HQ sharing",
  log_coach_decision: "Log coach decision",
};

const commandHelpers: Record<RushMonthLoopCommand, string> = {
  assign_action: "Leader creates the student action.",
  start_action: "Member begins the work.",
  submit_proof: "Member submits testimonial/proof metadata.",
  review_completion: "Leader approves local completion for points.",
  record_hq_sharing: "HQ marks proof for future reuse review.",
  log_coach_decision: "Coach records advance/hold/intervene.",
};

export function RushMonthLocalLoopDemo({
  initialState = createInitialRushMonthLocalLoopState(),
}: RushMonthLocalLoopDemoProps) {
  const [state, dispatch] = useReducer(loopReducer, initialState);
  const steps = getRushMonthLoopSteps(state);
  const progress = getRushMonthLoopProgress(state);

  return (
    <section className="grid gap-4">
      <section className="app-surface-info rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-blue">
          Rush Month walkthrough
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          Walk through the operating path.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use this review flow to trace how leader assignment, member action,
          proof, completion, and coach support connect across one chapter
          cycle.
        </p>

        <div className="app-surface mt-5 rounded-[1.5rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">Progress</p>
            <p className="text-sm font-semibold text-[#2563eb]">{progress}%</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#5d8ff6] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{state.nextAction}</p>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="app-surface rounded-[2rem] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="app-eyebrow app-eyebrow-slate">
                Active assignment
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                {state.assignment.title}
              </h3>
            </div>
            <StatusBadge status={state.assignment.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {state.assignment.instructions}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Points earned" value={`${state.pointsSummary.earned}`} />
            <MiniMetric label="Invite KPIs" value={`${state.kpiSummary.invitePushes}`} />
            <MiniMetric label="Proof pending" value={`${state.kpiSummary.proofPending}`} />
            <MiniMetric label="Coach state" value={state.kpiSummary.coachDecision} />
          </div>
        </article>

        <article className="app-surface rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-slate">
            Proof and review posture
          </p>
          {state.evidenceItem ? (
            <>
              <div className="mt-3 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-950">
                  {state.evidenceItem.evidenceType.replace("_", " ")}
                </h3>
                <StatusBadge status={state.evidenceItem.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {state.evidenceItem.summary}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              No proof submitted yet. The member will add a testimonial-style
              proof item after starting the action.
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Completion review" value={state.completionReviewStatus} />
            <MiniMetric label="HQ sharing" value={state.hqSharingStatus} />
          </div>
        </article>
      </section>

      <section className="app-surface rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-slate">
          What happens next
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.command}
              className={`rounded-3xl border p-4 ${stepClassName(step.status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="app-eyebrow app-eyebrow-slate">
                    {step.owner}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{step.label}</h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {step.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="app-surface-warm rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-warm">
          Review controls
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          These buttons update this review session only.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use them to inspect each handoff and result state without changing
          real records or sending anything outward.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(commandLabels) as RushMonthLoopCommand[]).map((command) => {
            const enabled = canApplyRushMonthLoopCommand(state, command);

            return (
              <button
                key={command}
                type="button"
                disabled={!enabled}
                onClick={() => dispatch(command)}
                className={`rounded-2xl border p-4 text-left transition ${
                  enabled
                    ? "border-[#5d8ff6]/28 bg-[#eaf2ff] text-slate-950 hover:bg-[#dce8ff]"
                    : "border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                <span className="block text-sm font-semibold">{commandLabels[command]}</span>
                <span className="mt-2 block text-xs leading-5 opacity-75">
                  {commandHelpers[command]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <EventOutboxLog
        events={state.integrationEvents}
        outboxItems={state.automationOutbox}
      />

      <section className="app-surface rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-slate">
          Audit log
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          App-truth actions stay traceable.
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {state.auditLogs.map((auditLog) => (
            <article
              key={auditLog.id}
              className="app-surface-soft rounded-[1.05rem] p-3"
            >
              <p className="font-mono text-xs text-[#2563eb]">{auditLog.action}</p>
              <p className="mt-2 text-sm text-slate-600">
                {auditLog.actorUserId}
                {" -> "}
                {auditLog.targetType}:{auditLog.targetId}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function loopReducer(
  state: RushMonthLocalLoopState,
  command: RushMonthLoopCommand,
): RushMonthLocalLoopState {
  return applyRushMonthLoopCommand(state, command);
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface-soft rounded-[1.05rem] p-3">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function stepClassName(status: RushMonthLoopStepStatus): string {
  switch (status) {
    case "complete":
      return "border-emerald-200 bg-emerald-50";
    case "current":
      return "border-amber-200 bg-amber-50";
    case "locked":
      return "border-slate-200 bg-slate-100";
  }
}
