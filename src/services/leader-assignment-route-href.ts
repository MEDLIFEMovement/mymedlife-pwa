export type LeaderAssignmentRouteSource =
  | "leader_follow_up"
  | "leader_assignment_card"
  | "dashboard_assignment_card"
  | "proof_status"
  | "evidence_queue"
  | "first_write_packet"
  | "proof_metadata_packet"
  | "hq_proof_packet";

export function buildLeaderAssignmentRouteHref(
  assignmentId: string,
  options: {
    source?: LeaderAssignmentRouteSource;
  } = {},
) {
  const searchParams = new URLSearchParams({
    assignmentId,
  });

  if (options.source) {
    searchParams.set("source", options.source);
  }

  return `/rush-month/actions?${searchParams.toString()}`;
}
