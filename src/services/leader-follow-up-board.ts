import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadChapterData,
  getVisibleAssignmentsForActor,
} from "@/services/role-visibility";
import type { Assignment } from "@/shared/types/domain";

export type FollowUpUrgency =
  | "ready_to_review"
  | "needs_owner_nudge"
  | "needs_revision"
  | "complete";

export type LeaderFollowUpRow = {
  assignmentId: string;
  title: string;
  ownerRole: string;
  dueLabel: string;
  status: Assignment["status"];
  urgency: FollowUpUrgency;
  actionNeeded: string;
  nextHref: string;
  reminderPosture: "disabled";
};

export type LeaderFollowUpBoard = {
  canReadBoard: boolean;
  title: string;
  summary: string;
  emptyMessage: string;
  rows: LeaderFollowUpRow[];
  counts: {
    total: number;
    needsFollowUp: number;
    readyToReview: number;
    remindersEnabled: 0;
  };
};

export function getLeaderFollowUpBoard(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): LeaderFollowUpBoard {
  if (!canReadChapterData(actor) || actor.audience === "ds_admin") {
    return buildRestrictedBoard(
      "Integration roles do not own member follow-up.",
      "DS Admin can inspect disabled outbox posture, but assignment follow-up stays with chapter, coach, and HQ operating roles.",
    );
  }

  if (actor.audience === "chapter_member") {
    return buildRestrictedBoard(
      "Members see their own actions below.",
      "This leader follow-up board is intentionally hidden from general members so they are not shown leadership operating queues.",
    );
  }

  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const rows = visibleAssignments.map(toFollowUpRow);
  const readyToReview = rows.filter((row) => row.urgency === "ready_to_review").length;
  const needsFollowUp = rows.filter((row) => row.urgency !== "complete").length;

  return {
    canReadBoard: true,
    title: getBoardTitle(actor),
    summary: getBoardSummary(actor),
    emptyMessage:
      "No follow-up rows are visible for this role in the local read model.",
    rows: sortRows(rows),
    counts: {
      total: rows.length,
      needsFollowUp,
      readyToReview,
      remindersEnabled: 0,
    },
  };
}

function toFollowUpRow(assignment: Assignment): LeaderFollowUpRow {
  const urgency = getUrgency(assignment.status);

  return {
    assignmentId: assignment.id,
    title: assignment.title,
    ownerRole: assignment.ownerRole,
    dueLabel: assignment.dueLabel,
    status: assignment.status,
    urgency,
    actionNeeded: getActionNeeded(assignment),
    nextHref:
      assignment.status === "submitted" || assignment.status === "changes_requested"
        ? "/rush-month/review"
        : `/rush-month/actions/${assignment.id}`,
    reminderPosture: "disabled",
  };
}

function getUrgency(status: Assignment["status"]): FollowUpUrgency {
  switch (status) {
    case "submitted":
      return "ready_to_review";
    case "changes_requested":
      return "needs_revision";
    case "not_started":
    case "in_progress":
      return "needs_owner_nudge";
    case "approved":
      return "complete";
  }
}

function getActionNeeded(assignment: Assignment): string {
  switch (assignment.status) {
    case "submitted":
      return "Review the submitted proof and decide whether completion should count.";
    case "changes_requested":
      return "Ask the owner for clearer proof or testimonial context before counting it.";
    case "not_started":
      return "Confirm the owner understands the action, due date, and proof requirement.";
    case "in_progress":
      return "Check whether the owner needs help before the due date.";
    case "approved":
      return "Recognize the completion and keep the next action moving.";
  }
}

function getBoardTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_leader":
      return "Leader follow-up board";
    case "coach":
      return "Coach-visible follow-up board";
    case "admin":
      return "HQ follow-up posture";
    case "super_admin":
      return "Full local follow-up board";
    case "chapter_member":
    case "ds_admin":
      return "Follow-up board unavailable";
  }
}

function getBoardSummary(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_leader":
      return "Use this queue to decide who needs a nudge, what proof needs review, and where the chapter is stuck this week.";
    case "coach":
      return "Use this read-only queue to spot stuck work before deciding advance, hold, or intervene.";
    case "admin":
      return "HQ can read proof and support posture without taking over chapter assignment truth.";
    case "super_admin":
      return "Review all local follow-up rows while writes, reminders, and external automation remain disabled.";
    case "chapter_member":
    case "ds_admin":
      return "This role should not read the leader follow-up board.";
  }
}

function sortRows(rows: LeaderFollowUpRow[]): LeaderFollowUpRow[] {
  const priority: Record<FollowUpUrgency, number> = {
    ready_to_review: 0,
    needs_revision: 1,
    needs_owner_nudge: 2,
    complete: 3,
  };

  return [...rows].sort((left, right) => priority[left.urgency] - priority[right.urgency]);
}

function buildRestrictedBoard(title: string, summary: string): LeaderFollowUpBoard {
  return {
    canReadBoard: false,
    title,
    summary,
    emptyMessage: summary,
    rows: [],
    counts: {
      total: 0,
      needsFollowUp: 0,
      readyToReview: 0,
      remindersEnabled: 0,
    },
  };
}
