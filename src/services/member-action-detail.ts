import type { Assignment } from "@/shared/types/domain";

export function getActionWhyItMatters(assignment: Assignment) {
  return `This ${assignment.points}-point action makes ${assignment.kpi} believable. One member invite push, one clean proof note, and one readable handoff are what turn chapter energy into something leaders and coaches can trust.`;
}

export function getActionSteps(assignment: Assignment) {
  return [
    assignment.instructions,
    `Capture proof that answers this requirement: ${assignment.evidenceRequired}`,
    "Confirm the proof is accurate, preview the submission locally, and use the confirmation state before any real save path is approved.",
  ];
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
