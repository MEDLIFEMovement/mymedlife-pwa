export type MemberActionRouteSource =
  | "home"
  | "stories"
  | "campaigns"
  | "evidence"
  | "events"
  | "points"
  | "profile";

export function buildMemberActionRouteHref(
  assignmentId: string,
  options: {
    eventId?: string;
    source?: MemberActionRouteSource;
    step?: "submit" | "submitted";
  } = {},
) {
  const searchParams = new URLSearchParams();

  if (options.step) {
    searchParams.set("step", options.step);
  }

  if (options.eventId) {
    searchParams.set("event", options.eventId);
  }

  if (options.source) {
    searchParams.set("source", options.source);
  }

  const query = searchParams.toString();
  const hash =
    options.step === "submit" || options.step === "submitted"
      ? "#submit-evidence"
      : "";

  return query.length > 0
    ? `/rush-month/actions/${assignmentId}?${query}${hash}`
    : `/rush-month/actions/${assignmentId}${hash}`;
}
