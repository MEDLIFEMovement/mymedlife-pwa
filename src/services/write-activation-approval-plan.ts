import type { WriteOperation } from "@/services/write-readiness";

export type WriteActivationRequirementKey =
  | "live_auth_session_verified"
  | "server_action_identity_bound"
  | "rls_ci_green"
  | "rollback_path_defined"
  | "success_error_states_reviewed"
  | "external_writes_disabled"
  | "audit_event_reviewed";

export type WriteActivationCandidate = {
  operation: WriteOperation;
  route: string;
  recommendedOrder: number;
  riskLevel: "low" | "medium" | "high";
  reason: string;
  mustStayDisabled: readonly string[];
};

export type WriteActivationRequirement = {
  key: WriteActivationRequirementKey;
  label: string;
  complete: false;
  owner: "Nick/team" | "engineering" | "security/review";
  notes: string;
};

export type WriteActivationApprovalPlan = {
  browserWritesEnabled: false;
  externalWritesEnabled: false;
  canActivateWithoutNickApproval: false;
  recommendedFirstOperation: WriteOperation;
  candidates: readonly WriteActivationCandidate[];
  requirements: readonly WriteActivationRequirement[];
};

export const writeActivationCandidates = [
  {
    operation: "action_started",
    route: "/rush-month/actions/[assignmentId]",
    recommendedOrder: 1,
    riskLevel: "low",
    reason:
      "Starting an action is the narrowest first write: it updates one assignment status and records internal event/audit intent without creating an outbox row.",
    mustStayDisabled: ["external sends", "proof uploads", "production Supabase"],
  },
  {
    operation: "evidence_submitted",
    route: "/rush-month/actions/[assignmentId]",
    recommendedOrder: 2,
    riskLevel: "medium",
    reason:
      "Proof/testimonial metadata should wait until auth identity and upload-disabled behavior are clearly reviewed.",
    mustStayDisabled: ["file uploads", "public proof sharing", "external automation"],
  },
  {
    operation: "leader_proof_decision",
    route: "/rush-month/review",
    recommendedOrder: 3,
    riskLevel: "high",
    reason:
      "Leader proof decisions change assignment truth, points, and KPI movement, so they should wait until proof metadata, local auth, and Goal 115 RLS coverage are current.",
    mustStayDisabled: ["member nudges", "public proof sharing", "external automation"],
  },
  {
    operation: "hq_sharing_decision",
    route: "/rush-month/review",
    recommendedOrder: 4,
    riskLevel: "high",
    reason:
      "HQ sharing decisions affect whether proof can be reused broadly, so they should wait until proof metadata and review-state UX are stable.",
    mustStayDisabled: ["public publishing", "warehouse exports", "external automation"],
  },
  {
    operation: "action_assigned",
    route: "/rush-month/actions",
    recommendedOrder: 5,
    riskLevel: "medium",
    reason:
      "Leader assignment creation changes chapter operating truth and creates a disabled n8n outbox row, so it should follow proof decision and HQ review paths.",
    mustStayDisabled: ["reminder sends", "production Supabase", "live external writes"],
  },
  {
    operation: "coach_decision_logged",
    route: "/coach",
    recommendedOrder: 6,
    riskLevel: "high",
    reason:
      "Coach advance, hold, or intervene decisions change chapter readiness truth and may later trigger escalation packets, so they should be activated only after the member, proof, HQ, and assignment writes are proven.",
    mustStayDisabled: ["n8n escalation packets", "email/SMS", "AI summaries"],
  },
  {
    operation: "membership_approved",
    route: "/chapter/members",
    recommendedOrder: 7,
    riskLevel: "high",
    reason:
      "Membership approval changes chapter access and role scope, so it should wait until production auth identity, duplicate prevention, RLS, rollback, audit readback, and disabled welcome/CRM behavior are proven.",
    mustStayDisabled: ["welcome sends", "CRM sync", "role escalation"],
  },
] as const satisfies readonly WriteActivationCandidate[];

export const writeActivationRequirements = [
  {
    key: "live_auth_session_verified",
    label: "Live auth/session verified",
    complete: false,
    owner: "Nick/team",
    notes: "Browser identity must be trusted before any save control can write.",
  },
  {
    key: "server_action_identity_bound",
    label: "Server write identity bound",
    complete: false,
    owner: "engineering",
    notes: "The server-side write handler must derive actor identity from auth, not from client-provided role strings.",
  },
  {
    key: "rls_ci_green",
    label: "RLS/security CI green",
    complete: false,
    owner: "security/review",
    notes: "The relevant pgTAP test must pass in GitHub CI before activation.",
  },
  {
    key: "rollback_path_defined",
    label: "Rollback path defined",
    complete: false,
    owner: "engineering",
    notes: "The team needs a clear rollback and audit story if the first write is wrong.",
  },
  {
    key: "success_error_states_reviewed",
    label: "Success/error states reviewed",
    complete: false,
    owner: "Nick/team",
    notes: "Student-facing copy should explain what saved, what did not, and what to do next.",
  },
  {
    key: "external_writes_disabled",
    label: "External writes confirmed disabled",
    complete: false,
    owner: "security/review",
    notes: "n8n, HubSpot, Luma, warehouse, Power BI, SMS/email, and AI writes stay off.",
  },
  {
    key: "audit_event_reviewed",
    label: "Audit/event payload reviewed",
    complete: false,
    owner: "security/review",
    notes: "Event, integration event, outbox, and audit payloads should be readable and non-secret.",
  },
] as const satisfies readonly WriteActivationRequirement[];

export function getWriteActivationApprovalPlan(): WriteActivationApprovalPlan {
  return {
    browserWritesEnabled: false,
    externalWritesEnabled: false,
    canActivateWithoutNickApproval: false,
    recommendedFirstOperation: "action_started",
    candidates: writeActivationCandidates,
    requirements: writeActivationRequirements,
  };
}

export function getNextWriteActivationCandidate(
  completedOperations: readonly WriteOperation[],
): WriteActivationCandidate | null {
  return (
    writeActivationCandidates.find((candidate) => {
      return !completedOperations.includes(candidate.operation);
    }) ?? null
  );
}
