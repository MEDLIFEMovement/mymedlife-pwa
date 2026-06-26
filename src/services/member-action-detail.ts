import type { Assignment } from "@/shared/types/domain";
import { getSopWorkflowRuntime } from "@/services/sop-workflow-runtime";

export function getActionWhyItMatters(assignment: Assignment) {
  const runtimeStep = getActionWorkflowStep(assignment);
  const runtimePhase = getActionWorkflowPhase(assignment);

  if (!runtimeStep) {
    return `This ${assignment.points}-point action makes ${assignment.kpi} believable. One member invite push, one clean proof note, and one readable handoff are what turn chapter energy into something leaders and coaches can trust.`;
  }

  const phaseObjective = runtimePhase?.objective
    ? ` Current phase objective: ${runtimePhase.objective}`
    : "";

  return `This ${assignment.points}-point action advances the "${runtimeStep.title}" workflow step and makes ${assignment.kpi} believable. ${runtimeStep.whyItMatters}${phaseObjective}`;
}

export function getActionSteps(assignment: Assignment) {
  const runtimeStep = getActionWorkflowStep(assignment);
  const runtimePhase = getActionWorkflowPhase(assignment);
  const steps = [
    assignment.instructions,
  ];

  if (runtimeStep) {
    steps.push(
      `Advance the "${runtimeStep.title}" workflow step by meeting this completion signal: ${runtimeStep.completionSignal}`,
    );
  }

  if (runtimePhase?.exitCriteria[0]) {
    steps.push(`Keep the broader phase on track by preserving this exit signal: ${runtimePhase.exitCriteria[0]}`);
  }

  steps.push(
    `Capture proof that answers this requirement: ${assignment.evidenceRequired}`,
    "Confirm the proof is accurate, preview the submission locally, and use the confirmation state before any real save path is approved.",
  );

  return steps;
}

export function getActionWorkflowStep(assignment: Assignment) {
  const runtime = getSopWorkflowRuntime("rush-month");

  if (!runtime) {
    return null;
  }

  if (assignment.lane === "Member") {
    return (
      runtime.steps.find(
        (step) =>
          step.route.startsWith("/rush-month/actions") &&
          step.primaryRole === "student_member",
      ) ?? null
    );
  }

  if (assignment.lane === "Coach") {
    return (
      runtime.steps.find((step) => step.primaryRole === "coach") ?? runtime.currentStep
    );
  }

  return (
    runtime.steps.find((step) =>
      step.primaryRole === "president" || step.primaryRole === "committee_chair",
    ) ?? runtime.currentStep
  );
}

export function getActionWorkflowPhase(assignment: Assignment) {
  const runtime = getSopWorkflowRuntime("rush-month");
  const runtimeStep = getActionWorkflowStep(assignment);

  if (!runtimeStep || !runtime) {
    return null;
  }

  return runtime.phases.find((phase) => phase.stepIds.includes(runtimeStep.id)) ?? runtime.currentPhase;
}

export function getActionDetailFacts(assignment: Assignment) {
  return [
    {
      label: "Due date",
      value: assignment.dueLabel,
      note: "What needs to happen this week.",
    },
    {
      label: "Assignee",
      value: assignment.ownerRole,
      note: "Who owns the next real move.",
    },
    {
      label: "Status",
      value: assignment.status.replaceAll("_", " "),
      note: "Current local preview posture.",
    },
    {
      label: "Points",
      value: `${assignment.points}`,
      note: "Recognition unlocked after review.",
    },
  ];
}
