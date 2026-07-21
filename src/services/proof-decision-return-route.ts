export type ProofDecisionReturnRoute =
  | "/rush-month/review"
  | "/admin/hq-proof-write";

const defaultReturnRoute: ProofDecisionReturnRoute = "/rush-month/review";

export function normalizeProofDecisionReturnTo(
  value: FormDataEntryValue | null,
): ProofDecisionReturnRoute {
  if (typeof value !== "string") {
    return defaultReturnRoute;
  }

  const trimmed = value.trim();

  if (
    trimmed !== "/rush-month/review" &&
    trimmed !== "/admin/hq-proof-write"
  ) {
    return defaultReturnRoute;
  }

  return trimmed;
}
