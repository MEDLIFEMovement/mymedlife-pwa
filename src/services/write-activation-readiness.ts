import { evidenceItems } from "@/data/mock-rush-month";
import {
  getActionStartBrowserWriteGate,
  getAssignmentCreateBrowserWriteGate,
  getBlockingActivationChecks,
  getCoachDecisionBrowserWriteGate,
  getHqSharingDecisionBrowserWriteGate,
  getPassedActivationChecks,
  getProofSubmissionBrowserWriteGate,
  type BrowserWriteActivationGate,
} from "@/services/browser-write-activation";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { Assignment, EvidenceItem, KpiSummary } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type WriteActivationReadinessItem = {
  operation: BrowserWriteActivationGate["operation"];
  label: string;
  route: BrowserWriteActivationGate["route"];
  localFunction: BrowserWriteActivationGate["localFunction"];
  allowedByRole: boolean;
  enabledControl: boolean;
  readyCheckCount: number;
  blockerCount: number;
  blockingLabels: string[];
};

export type WriteActivationReadinessSummary = {
  operationCount: number;
  allControlsDisabled: boolean;
  enabledControlCount: number;
  approvalBlockerCount: number;
  items: WriteActivationReadinessItem[];
};

export function getWriteActivationReadinessSummary(
  actor: LocalActorContext,
  input: {
    assignments: Assignment[];
    coachDecision: KpiSummary["coachDecision"];
    evidenceItem?: EvidenceItem;
  },
  env: EnvSource = process.env,
): WriteActivationReadinessSummary {
  const actionAssignment = findAssignment(input.assignments, "member-push");
  const hqEvidenceItem = input.evidenceItem ?? evidenceItems[0];
  const gates = [
    getActionStartBrowserWriteGate(actor, actionAssignment, env),
    getAssignmentCreateBrowserWriteGate(
      actor,
      {
        title: "Assign a Rush Month event owner",
        instructions:
          "Choose one student owner, confirm the event goal, and tell them what proof/testimonial should be collected afterward.",
        ownerRole: "Action Committee Member",
        dueLabel: "Next Friday",
        evidenceRequired: "Owner name, Luma/event link, and proof collection plan.",
        points: 15,
        kpi: "Rush Month event owner assigned",
      },
      {
        chapterId: "mock-chapter",
        campaignId: "mock-campaign",
        existingAssignments: input.assignments,
      },
      env,
    ),
    getProofSubmissionBrowserWriteGate(
      actor,
      actionAssignment,
      {
        evidenceType: "bridge_video",
        summary:
          "Local preview: this testimonial explains what happened and why another student should take action.",
      },
      env,
    ),
    getHqSharingDecisionBrowserWriteGate(
      actor,
      hqEvidenceItem,
      {
        decision: "approved",
        note: "Local preview only: useful proof to share with other chapters later.",
      },
      env,
    ),
    getCoachDecisionBrowserWriteGate(
      actor,
      {
        decision: input.coachDecision,
        note:
          "Local preview only: coach logs whether this chapter should advance, hold, or receive intervention.",
        blockerSummary:
          input.coachDecision === "intervene"
            ? "Follow-up owners and proof quality need coach attention."
            : undefined,
      },
      env,
    ),
  ];
  const items = gates.map(toReadinessItem);

  return {
    operationCount: items.length,
    allControlsDisabled: items.every((item) => !item.enabledControl),
    enabledControlCount: items.filter((item) => item.enabledControl).length,
    approvalBlockerCount: items.reduce((sum, item) => sum + item.blockerCount, 0),
    items,
  };
}

function toReadinessItem(
  gate: BrowserWriteActivationGate,
): WriteActivationReadinessItem {
  const passedChecks = getPassedActivationChecks(gate);
  const blockingChecks = getBlockingActivationChecks(gate);
  const roleCheck = gate.checks.find((check) => check.key.startsWith("actor_"));
  const planCheck = gate.checks.find((check) => {
    return check.key === "actor_allowed_by_write_plan";
  });

  return {
    operation: gate.operation,
    label: gate.label,
    route: gate.route,
    localFunction: gate.localFunction,
    allowedByRole: Boolean(roleCheck?.passed && planCheck?.passed),
    enabledControl: gate.canRenderEnabledControl,
    readyCheckCount: passedChecks.length,
    blockerCount: blockingChecks.length,
    blockingLabels: blockingChecks.map((check) => check.label),
  };
}

function findAssignment(assignments: Assignment[], assignmentId: string): Assignment {
  const assignment =
    assignments.find((item) => item.id === assignmentId) ?? assignments[0];

  if (!assignment) {
    throw new Error("Write activation readiness needs at least one assignment.");
  }

  return assignment;
}
