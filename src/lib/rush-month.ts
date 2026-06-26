import { assignments } from "@/data/mock-rush-month";
import {
  getAssignmentById as findAssignmentById,
  getAssignmentsForRole as findAssignmentsForRole,
} from "@/services/rush-month-service";
import type { Assignment, AssignmentStatus, EvidenceItem, RoleKey } from "@/shared/types/domain";

export type DisplayStatus = AssignmentStatus | EvidenceItem["status"];

export function getAssignmentsForRole(role: RoleKey): Assignment[] {
  return findAssignmentsForRole(assignments, role);
}

export function getAssignmentById(id: string): Assignment | undefined {
  return findAssignmentById(assignments, id);
}

export function getNextMemberAction(): Assignment {
  return (
    assignments.find(
      (assignment) => assignment.lane === "Member" && assignment.status !== "approved",
    ) ?? assignments[0]
  );
}

export function getProgressCounts() {
  const approved = assignments.filter((assignment) => assignment.status === "approved");
  const pendingReview = assignments.filter((assignment) => assignment.status === "submitted");
  const needsWork = assignments.filter(
    (assignment) =>
      assignment.status === "not_started" ||
      assignment.status === "in_progress" ||
      assignment.status === "changes_requested",
  );

  return {
    approved: approved.length,
    pendingReview: pendingReview.length,
    needsWork: needsWork.length,
    total: assignments.length,
  };
}

export function statusLabel(status: DisplayStatus): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "in_progress":
      return "In progress";
    case "submitted":
      return "Submitted";
    case "pending_review":
      return "Pending HQ review";
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Needs changes";
    case "rejected":
      return "Rejected";
  }
}

export function statusClassName(status: DisplayStatus): string {
  switch (status) {
    case "approved":
      return "border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8]";
    case "submitted":
    case "pending_review":
      return "border-blue-200 bg-[#dbeafe] text-[#1d4ed8]";
    case "in_progress":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "changes_requested":
    case "rejected":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "not_started":
      return "border-slate-200 bg-[#dbeafe] text-slate-600";
  }
}
