const completedStatuses = new Set(["completed", "feedback_collected"]);
const cancelledStatuses = new Set(["canceled", "cancelled"]);

export type MemberEventLifecycleState = "open" | "completed" | "cancelled";

export function getMemberEventLifecycleState(status: string): MemberEventLifecycleState {
  const normalizedStatus = status.trim().toLowerCase();

  if (cancelledStatuses.has(normalizedStatus)) {
    return "cancelled";
  }

  if (completedStatuses.has(normalizedStatus)) {
    return "completed";
  }

  return "open";
}

export function isMemberEventClosedStatus(status: string) {
  return getMemberEventLifecycleState(status) !== "open";
}

export function getMemberEventLifecycleLabel(state: MemberEventLifecycleState) {
  if (state === "cancelled") {
    return "Event canceled";
  }

  if (state === "completed") {
    return "Event completed";
  }

  return null;
}
