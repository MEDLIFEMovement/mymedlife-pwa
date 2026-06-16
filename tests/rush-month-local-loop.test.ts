import { describe, expect, it } from "vitest";
import {
  applyRushMonthLoopCommand,
  canApplyRushMonthLoopCommand,
  createInitialRushMonthLocalLoopState,
  getRushMonthLoopProgress,
  getRushMonthLoopSteps,
  type RushMonthLoopCommand,
} from "@/services/rush-month-local-loop";

const fullLoopCommands = [
  "assign_action",
  "start_action",
  "submit_proof",
  "review_completion",
  "record_hq_sharing",
  "log_coach_decision",
] as const satisfies readonly RushMonthLoopCommand[];

describe("Rush Month local operating loop", () => {
  it("starts with a mock-safe local state and no external outbox rows", () => {
    const state = createInitialRushMonthLocalLoopState();

    expect(state.assignment.status).toBe("not_started");
    expect(state.assignmentAssigned).toBe(false);
    expect(state.nextAction).toContain("Leader assigns");
    expect(state.integrationEvents.map((event) => event.eventType)).toEqual([
      "campaign_opened",
    ]);
    expect(state.automationOutbox).toEqual([]);
    expect(state.auditLogs).toHaveLength(1);
    expect(getRushMonthLoopProgress(state)).toBe(0);
  });

  it("advances through the full Rush Month operating loop in order", () => {
    const finalState = runFullLoop();

    expect(finalState.assignmentAssigned).toBe(true);
    expect(finalState.assignment.status).toBe("approved");
    expect(finalState.evidenceItem?.status).toBe("approved");
    expect(finalState.completionReviewStatus).toBe("approved");
    expect(finalState.hqSharingStatus).toBe("approved");
    expect(finalState.pointsSummary).toEqual({
      earned: 15,
      available: 15,
      approvedActions: 1,
    });
    expect(finalState.pointsEvents).toHaveLength(1);
    expect(finalState.kpiSummary).toEqual({
      invitePushes: 1,
      proofPending: 0,
      eventsLinked: 1,
      coachDecision: "advance",
    });
    expect(finalState.coachDecisionLogged).toBe(true);
    expect(finalState.nextAction).toContain("Local MVP loop complete");
    expect(getRushMonthLoopProgress(finalState)).toBe(100);
  });

  it("records structured events, disabled outbox rows, and audit logs for meaningful actions", () => {
    const finalState = runFullLoop();

    expect(finalState.integrationEvents.map((event) => event.eventType)).toEqual([
      "campaign_opened",
      "action_assigned",
      "action_started",
      "evidence_submitted",
      "evidence_approved",
      "points_awarded",
      "kpi_event_recorded",
      "hq_sharing_decision",
      "coach_decision_logged",
      "phase_completed",
    ]);
    expect(finalState.automationOutbox.map((item) => item.destination)).toEqual([
      "n8n",
      "n8n",
      "warehouse",
      "n8n",
    ]);
    expect(finalState.automationOutbox.every((item) => item.status === "disabled")).toBe(
      true,
    );
    expect(finalState.auditLogs.map((log) => log.action)).toEqual([
      "campaign_opened",
      "action_assigned",
      "action_started",
      "evidence_submitted",
      "completion_review_approved",
      "points_awarded",
      "kpi_event_recorded",
      "hq_sharing_decision",
      "coach_decision_logged",
      "phase_completed",
    ]);
  });

  it("keeps chapter completion review separate from HQ proof-sharing posture", () => {
    const state = fullLoopCommands
      .slice(0, 4)
      .reduce(applyRushMonthLoopCommand, createInitialRushMonthLocalLoopState());

    expect(state.assignment.status).toBe("approved");
    expect(state.completionReviewStatus).toBe("approved");
    expect(state.pointsSummary.earned).toBe(15);
    expect(state.hqSharingStatus).toBe("pending");
    expect(canApplyRushMonthLoopCommand(state, "record_hq_sharing")).toBe(true);
  });

  it("locks commands until their prerequisites are complete", () => {
    const state = createInitialRushMonthLocalLoopState();

    expect(canApplyRushMonthLoopCommand(state, "assign_action")).toBe(true);
    expect(canApplyRushMonthLoopCommand(state, "start_action")).toBe(false);
    expect(() => applyRushMonthLoopCommand(state, "submit_proof")).toThrow(
      "submit_proof",
    );
  });

  it("returns current, locked, and complete step statuses for the UI", () => {
    const initialState = createInitialRushMonthLocalLoopState();
    const assignedState = applyRushMonthLoopCommand(initialState, "assign_action");

    expect(getRushMonthLoopSteps(initialState).map((step) => step.status)).toEqual([
      "current",
      "locked",
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
    expect(getRushMonthLoopSteps(assignedState).map((step) => step.status)).toEqual([
      "complete",
      "current",
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
  });
});

function runFullLoop() {
  return fullLoopCommands.reduce(
    applyRushMonthLoopCommand,
    createInitialRushMonthLocalLoopState(),
  );
}
