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
      <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
          Local Rush Month loop
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Click through the MVP operating path.
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/68">
          This is a browser-local simulation. It proves the end-to-end product
          loop and records mock events, disabled outbox rows, and audit logs
          without saving to Supabase or sending external automation.
        </p>

        <div className="mt-5 rounded-3xl bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Progress</p>
            <p className="text-sm font-semibold text-emerald-100">{progress}%</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-emerald-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-white/68">{state.nextAction}</p>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                Active assignment
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                {state.assignment.title}
              </h3>
            </div>
            <StatusBadge status={state.assignment.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-white/64">
            {state.assignment.instructions}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Points earned" value={`${state.pointsSummary.earned}`} />
            <MiniMetric label="Invite KPIs" value={`${state.kpiSummary.invitePushes}`} />
            <MiniMetric label="Proof pending" value={`${state.kpiSummary.proofPending}`} />
            <MiniMetric label="Coach state" value={state.kpiSummary.coachDecision} />
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-[#071d1a]/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
            Proof and review posture
          </p>
          {state.evidenceItem ? (
            <>
              <div className="mt-3 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-white">
                  {state.evidenceItem.evidenceType.replace("_", " ")}
                </h3>
                <StatusBadge status={state.evidenceItem.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                {state.evidenceItem.summary}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-white/64">
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

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                    {step.owner}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{step.label}</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/64">
                  {step.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/62">{step.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
          Local action controls
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          These buttons only update browser-local state.
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/66">
          They are useful for MVP review because they show the whole operating
          loop. They do not create production auth sessions, Supabase writes, or
          external sends.
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
                    ? "border-emerald-300/30 bg-emerald-300/20 text-white hover:bg-emerald-300/25"
                    : "border-white/10 bg-black/20 text-white/38"
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

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
          Audit log
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          App-truth actions stay traceable.
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {state.auditLogs.map((auditLog) => (
            <article
              key={auditLog.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-3"
            >
              <p className="font-mono text-xs text-emerald-100/70">{auditLog.action}</p>
              <p className="mt-2 text-sm text-white/62">
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
    <div className="rounded-2xl bg-black/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function stepClassName(status: RushMonthLoopStepStatus): string {
  switch (status) {
    case "complete":
      return "border-emerald-300/20 bg-emerald-300/10";
    case "current":
      return "border-amber-300/30 bg-amber-300/10";
    case "locked":
      return "border-white/10 bg-black/20";
  }
}
