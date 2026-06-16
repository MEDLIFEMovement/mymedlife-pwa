import { getCoachDecisionPacket } from "@/services/coach-decision-verification-packet";
import { getFirstWriteActivationDrill } from "@/services/first-write-activation-drill";
import { getHqProofDecisionPacket } from "@/services/hq-proof-decision-verification-packet";
import { getLeaderAssignmentPacket } from "@/services/leader-assignment-verification-packet";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getProofMetadataPacket } from "@/services/proof-metadata-verification-packet";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

type EnvSource = Record<string, string | undefined>;

export type WriteSequenceOperationStatus =
  | "packet_ready"
  | "server_action_ready"
  | "needs_operator_packet"
  | "blocked_until_first_write"
  | "external_disabled";

export type WriteSequenceOperation = {
  key:
    | "action_started"
    | "evidence_submitted"
    | "hq_sharing_decision_logged"
    | "action_assigned"
    | "coach_decision_logged";
  label: string;
  promotionOrder: number;
  studentJourneyOrder: number;
  route: string;
  localActorEmail: string;
  actorLabel: string;
  status: WriteSequenceOperationStatus;
  plainEnglish: string;
  expectedTables: string[];
  structuredEvents: string[];
  auditEvidence: string[];
  outboxPosture: string;
  safetyBoundary: string;
  nextGate: string;
  packetStatus: WriteSequencePacketStatus;
};

export type WriteSequencePacketStatus = {
  route: string;
  status: string;
  label: string;
  plainEnglish: string;
  canPromoteToStagingReview: boolean;
  observedReadbackItems: number;
  browserWritesExpected: 0 | 1;
  externalWritesExpected: 0;
};

export type WriteSequencePlanner = {
  canReadPlanner: boolean;
  title: string;
  summary: string;
  studentJourneySummary: string;
  promotionSummary: string;
  firstWriteRuntimeStatus: string;
  nextRecommendedOperation: WriteSequenceOperation["key"] | null;
  operations: WriteSequenceOperation[];
  counts: {
    operations: number;
    packetReady: number;
    serverActionReady: number;
    needsOperatorPacket: number;
    blockedUntilFirstWrite: number;
    localBrowserWriteCandidates: number;
    externalWritesExpected: 0;
  };
};

export function getWriteSequencePlanner(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: EnvSource = process.env,
): WriteSequencePlanner {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadPlanner: false,
      title: "Write sequence planner hidden for this role",
      summary:
        "Write promotion planning is an HQ safety surface, not a student, leader, or coach operating view.",
      studentJourneySummary: "",
      promotionSummary: "",
      firstWriteRuntimeStatus: "hidden",
      nextRecommendedOperation: null,
      operations: [],
      counts: emptyCounts(),
    };
  }

  const firstWriteDrill = getFirstWriteActivationDrill(actor, data, env);
  const candidateRoute =
    firstWriteDrill.candidateAssignment?.route ?? "/rush-month/actions";
  const packetStatuses = buildPacketStatuses(actor, data, firstWriteDrill, env);
  const operations = buildOperations(candidateRoute, packetStatuses);

  return {
    canReadPlanner: true,
    title: getTitle(actor),
    summary:
      "This planner shows the safe order for promoting the local Rush Month write paths. It is a control-room view: it explains which local write should be proven first, what evidence to inspect, and what must stay disabled.",
    studentJourneySummary:
      "The real student-facing journey is leader assigns action, member starts action, member submits proof/testimonial, HQ decides whether proof can be shared, and coach logs advance/hold/intervene.",
    promotionSummary:
      "The safest technical promotion order starts with action_started because seed assignments already exist. Broader assignment creation, proof, HQ decisions, and coach decisions should follow only after the first action-start readback is proven.",
    firstWriteRuntimeStatus: firstWriteDrill.status,
    nextRecommendedOperation:
      firstWriteDrill.counts.observedReadbackItems >= 3
        ? "evidence_submitted"
        : "action_started",
    operations,
    counts: {
      operations: operations.length,
      packetReady: operations.filter((operation) => operation.status === "packet_ready")
        .length,
      serverActionReady: operations.filter(
        (operation) => operation.status === "server_action_ready",
      ).length,
      needsOperatorPacket: operations.filter(
        (operation) => operation.status === "needs_operator_packet",
      ).length,
      blockedUntilFirstWrite: operations.filter(
        (operation) => operation.status === "blocked_until_first_write",
      ).length,
      localBrowserWriteCandidates: operations.length,
      externalWritesExpected: 0,
    },
  };
}

function buildOperations(
  candidateRoute: string,
  packetStatuses: Record<WriteSequenceOperation["key"], WriteSequencePacketStatus>,
): WriteSequenceOperation[] {
  return [
    {
      key: "action_started",
      label: "Member starts an assigned action",
      promotionOrder: 1,
      studentJourneyOrder: 2,
      route: candidateRoute,
      localActorEmail: "member.a@mymedlife.test",
      actorLabel: "General Member",
      status: "packet_ready",
      plainEnglish:
        "A fake local member starts one already-seeded Rush Month assignment. This proves the smallest useful browser-to-Supabase write before wider flows are promoted.",
      expectedTables: ["assignments", "events", "integration_events", "audit_logs"],
      structuredEvents: ["action_started"],
      auditEvidence: [
        "assignment status changes to in_progress",
        "internal event row records action_started",
        "integration event records future automation intent",
        "audit log records the guarded write",
      ],
      outboxPosture:
        "No reminder, Luma, HubSpot, warehouse, email, SMS, AI, or n8n send should be queued.",
      safetyBoundary:
        "Local Supabase Auth, fake seed user, localhost-only write flags, and `/admin/first-write` proof are required.",
      nextGate:
        "Run the first-write packet and collect readback evidence before promoting the next write.",
      packetStatus: packetStatuses.action_started,
    },
    {
      key: "evidence_submitted",
      label: "Member submits proof/testimonial metadata",
      promotionOrder: 2,
      studentJourneyOrder: 3,
      route: candidateRoute,
      localActorEmail: "member.a@mymedlife.test",
      actorLabel: "General Member",
      status: "blocked_until_first_write",
      plainEnglish:
        "A member submits proof/testimonial metadata after an action is in progress. This is metadata only; bridge-video file upload remains locked.",
      expectedTables: ["evidence_items", "events", "integration_events", "audit_logs"],
      structuredEvents: ["evidence_submitted"],
      auditEvidence: [
        "evidence item row records the submitted testimonial metadata",
        "event row records evidence_submitted",
        "integration event records future proof workflow intent",
        "audit log records the guarded proof metadata write",
      ],
      outboxPosture:
        "No file upload, public proof publish, warehouse export, AI summary, or external send should happen.",
      safetyBoundary:
        "Requires proven action-start readback, local auth, assignment eligibility, and proof upload controls staying disabled.",
      nextGate:
        "Open `/admin/proof-write` before allowing staff to test proof metadata in a browser.",
      packetStatus: packetStatuses.evidence_submitted,
    },
    {
      key: "hq_sharing_decision_logged",
      label: "HQ decides whether proof can be shared",
      promotionOrder: 3,
      studentJourneyOrder: 4,
      route: "/admin/hq-proof-write",
      localActorEmail: "admin@mymedlife.test",
      actorLabel: "Admin or Super Admin",
      status: "packet_ready",
      plainEnglish:
        "HQ records whether a submitted proof/testimonial should stay internal, needs changes, or can later be shared broadly.",
      expectedTables: ["approvals", "evidence_items", "events", "integration_events", "audit_logs"],
      structuredEvents: ["hq_sharing_decision_logged"],
      auditEvidence: [
        "approval row records the HQ decision",
        "proof metadata reflects the sharing posture",
        "event row records hq_sharing_decision_logged",
        "audit log records the staff decision",
      ],
      outboxPosture:
        "No public proof publish, social share, warehouse export, AI summary, or external send should happen.",
      safetyBoundary:
        "Requires Admin or Super Admin identity, proof consent rules, and public sharing controls staying disabled.",
      nextGate:
        "Open `/admin/hq-proof-write` before allowing staff to test HQ proof decisions in a browser.",
      packetStatus: packetStatuses.hq_sharing_decision_logged,
    },
    {
      key: "action_assigned",
      label: "Leader creates a new assignment",
      promotionOrder: 4,
      studentJourneyOrder: 1,
      route: "/admin/assignment-write",
      localActorEmail: "leader.a@mymedlife.test",
      actorLabel: "Chapter Leader",
      status: "packet_ready",
      plainEnglish:
        "A chapter leader creates a real assignment for a role or committee after the smaller action-start and proof writes have been proven.",
      expectedTables: ["assignments", "events", "integration_events", "audit_logs"],
      structuredEvents: ["action_assigned"],
      auditEvidence: [
        "assignment row is created with chapter and campaign ownership",
        "event row records action_assigned",
        "integration event records future reminder/handoff intent",
        "audit log records the leader-created assignment",
      ],
      outboxPosture:
        "No reminder email, SMS, HubSpot handoff, or n8n workflow should send automatically.",
      safetyBoundary:
        "Requires leader chapter scope, duplicate checks, rollback, and reminder automation staying disabled.",
      nextGate:
        "Open `/admin/assignment-write` before allowing staff to test leader assignment creation in a browser.",
      packetStatus: packetStatuses.action_assigned,
    },
    {
      key: "coach_decision_logged",
      label: "Coach logs advance / hold / intervene decision",
      promotionOrder: 5,
      studentJourneyOrder: 5,
      route: "/admin/coach-write",
      localActorEmail: "coach@mymedlife.test",
      actorLabel: "Coach",
      status: "packet_ready",
      plainEnglish:
        "A coach records whether the chapter should advance, hold, or receive intervention after the Rush Month closeout signals are reviewed.",
      expectedTables: ["kpi_events", "events", "integration_events", "audit_logs"],
      structuredEvents: ["coach_decision_logged"],
      auditEvidence: [
        "KPI event records the decision state",
        "event row records coach_decision_logged",
        "integration event records future escalation packet intent",
        "audit log records the coach decision",
      ],
      outboxPosture:
        "No n8n escalation packet, email, SMS, HubSpot note, warehouse export, or AI summary should send automatically.",
      safetyBoundary:
        "Requires coach portfolio scope, decision notes, intervention blocker summary, and escalation packets staying disabled.",
      nextGate:
        "Open `/admin/coach-write` before allowing staff to test coach decisions in a browser.",
      packetStatus: packetStatuses.coach_decision_logged,
    },
  ];
}

function buildPacketStatuses(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  firstWriteDrill: ReturnType<typeof getFirstWriteActivationDrill>,
  env: EnvSource,
): Record<WriteSequenceOperation["key"], WriteSequencePacketStatus> {
  const proofPacket = getProofMetadataPacket(actor, data, env);
  const hqPacket = getHqProofDecisionPacket(actor, data, env);
  const assignmentPacket = getLeaderAssignmentPacket(actor, data, env);
  const coachPacket = getCoachDecisionPacket(actor, data, env);

  return {
    action_started: {
      route: "/admin/first-write",
      status: firstWriteDrill.verificationPacket.status,
      label: "Action-start packet",
      plainEnglish: firstWriteDrill.verificationPacket.plainEnglishDecision,
      canPromoteToStagingReview:
        firstWriteDrill.verificationPacket.canPromoteToStagingReview,
      observedReadbackItems: firstWriteDrill.counts.observedReadbackItems,
      browserWritesExpected: firstWriteDrill.counts.browserWritesExpected,
      externalWritesExpected: firstWriteDrill.counts.externalWritesExpected,
    },
    evidence_submitted: {
      route: "/admin/proof-write",
      status: proofPacket.status,
      label: "Proof metadata packet",
      plainEnglish: proofPacket.verificationPacket.plainEnglishDecision,
      canPromoteToStagingReview:
        proofPacket.verificationPacket.canPromoteToStagingReview,
      observedReadbackItems: proofPacket.counts.observedReadbackItems,
      browserWritesExpected: proofPacket.counts.browserWritesExpected,
      externalWritesExpected: proofPacket.counts.externalWritesExpected,
    },
    hq_sharing_decision_logged: {
      route: "/admin/hq-proof-write",
      status: hqPacket.status,
      label: "HQ proof decision packet",
      plainEnglish: hqPacket.verificationPacket.plainEnglishDecision,
      canPromoteToStagingReview:
        hqPacket.verificationPacket.canPromoteToStagingReview,
      observedReadbackItems: hqPacket.counts.observedReadbackItems,
      browserWritesExpected: hqPacket.counts.browserWritesExpected,
      externalWritesExpected: hqPacket.counts.externalWritesExpected,
    },
    action_assigned: {
      route: "/admin/assignment-write",
      status: assignmentPacket.status,
      label: "Leader assignment packet",
      plainEnglish: assignmentPacket.verificationPacket.plainEnglishDecision,
      canPromoteToStagingReview:
        assignmentPacket.verificationPacket.canPromoteToStagingReview,
      observedReadbackItems: assignmentPacket.counts.observedReadbackItems,
      browserWritesExpected: assignmentPacket.counts.browserWritesExpected,
      externalWritesExpected: assignmentPacket.counts.externalWritesExpected,
    },
    coach_decision_logged: {
      route: "/admin/coach-write",
      status: coachPacket.status,
      label: "Coach decision packet",
      plainEnglish: coachPacket.verificationPacket.plainEnglishDecision,
      canPromoteToStagingReview:
        coachPacket.verificationPacket.canPromoteToStagingReview,
      observedReadbackItems: coachPacket.counts.observedReadbackItems,
      browserWritesExpected: coachPacket.counts.browserWritesExpected,
      externalWritesExpected: coachPacket.counts.externalWritesExpected,
    },
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin write sequence planner";
    case "ds_admin":
      return "DS Admin write sequence safety planner";
    case "super_admin":
      return "Full local write sequence planner";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Write sequence planner hidden for this role";
  }
}

function emptyCounts(): WriteSequencePlanner["counts"] {
  return {
    operations: 0,
    packetReady: 0,
    serverActionReady: 0,
    needsOperatorPacket: 0,
    blockedUntilFirstWrite: 0,
    localBrowserWriteCandidates: 0,
    externalWritesExpected: 0,
  };
}
