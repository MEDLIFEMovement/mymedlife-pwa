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
      return "Proof submitted";
    case "pending_review":
      return "Pending HQ review";
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Needs changes";
  }
}

export function statusClassName(status: DisplayStatus): string {
  switch (status) {
    case "approved":
      return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
    case "submitted":
    case "pending_review":
      return "border-sky-300/30 bg-sky-300/15 text-sky-100";
    case "in_progress":
      return "border-amber-300/30 bg-amber-300/15 text-amber-100";
    case "changes_requested":
      return "border-rose-300/30 bg-rose-300/15 text-rose-100";
    case "not_started":
      return "border-white/10 bg-white/10 text-white/70";
  }
}
