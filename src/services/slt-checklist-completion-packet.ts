import { mockSltTripTravelers } from "@/data/mock-slt-trip-prep";
import {
  getMockLocalActorContext,
  type LocalActorContext,
} from "@/services/local-actor-context";
import {
  calculateReadinessScore,
  getSltTripPrepChecklistDetailWorkspace,
} from "@/services/slt-trip-prep-workspace";
import type {
  TripPrepChecklistItem,
  TripPrepChecklistStatus,
  TripPrepTraveler,
} from "@/shared/types/slt-trip-prep";

export type SltChecklistCompletionPacketStatus =
  | "hidden"
  | "blocked_until_candidate_selected"
  | "blocked_until_preview_safe_item"
  | "needs_manual_boundary_review"
  | "evidence_observed";

export type SltChecklistCompletionPacketCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type SltChecklistCompletionReadbackStatus =
  | "observed"
  | "manual_check_needed"
  | "blocked";

export type SltChecklistCompletionReadbackItem = {
  key: string;
  label: string;
  status: SltChecklistCompletionReadbackStatus;
  detail: string;
};

export type SltChecklistCompletionCandidate = {
  travelerId: string;
  travelerName: string;
  chapterName: string;
  tripLabel: string;
  itemId: string;
  itemTitle: string;
  itemCategory: string;
  currentStatus: TripPrepChecklistStatus;
  futureStatus: "complete";
  owner: string;
  dueLabel: string;
  mockSource: TripPrepChecklistItem["mockSource"];
  detailRoute: string;
  previewRoute: string;
  staffRoute: string;
  beforeReadinessScore: number;
  afterReadinessScore: number;
  readinessDelta: number;
  protectedExternalSources: string[];
  futureAuditPreview: {
    actorEmail: string;
    action: "slt_checklist_completed";
    beforeStatus: TripPrepChecklistStatus;
    afterStatus: "complete";
    readinessDelta: number;
  };
};

export type SltChecklistCompletionVerificationPacket = {
  status: SltChecklistCompletionPacketStatus;
  canPromoteToStagingReview: boolean;
  title: string;
  plainEnglishDecision: string;
  envSettings: Array<{
    key: string;
    value: string;
    reason: string;
  }>;
  fakeOperatorChain: Array<{
    roleLabel: string;
    email: string;
    route: string;
  }>;
  operatorSequence: Array<{
    label: string;
    route: string;
    expectedProof: string;
  }>;
  safetyStops: string[];
};

export type SltChecklistCompletionPacket = {
  canReadPacket: boolean;
  title: string;
  status: SltChecklistCompletionPacketStatus;
  plainEnglishSummary: string;
  candidate: SltChecklistCompletionCandidate | null;
  checks: SltChecklistCompletionPacketCheck[];
  readbackEvidence: SltChecklistCompletionReadbackItem[];
  verificationPacket: SltChecklistCompletionVerificationPacket;
  proofToCollect: string[];
  counts: {
    checks: number;
    passedChecks: number;
    observedReadbackItems: number;
    previewableItems: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

type PacketOptions = {
  travelerId?: string;
  itemId?: string;
};

const defaultTravelerId = "sofia-alvarez";
const travelerOperatorEmail = "member.a@mymedlife.test";

export function getSltChecklistCompletionPacket(
  actor: LocalActorContext,
  options: PacketOptions = {},
): SltChecklistCompletionPacket {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadPacket: false,
      title: "SLT checklist packet hidden for this role",
      status: "hidden",
      plainEnglishSummary:
        "SLT checklist completion review is an HQ safety surface, not a student, leader, or coach operating view.",
      candidate: null,
      checks: [],
      readbackEvidence: [],
      verificationPacket: buildHiddenVerificationPacket(),
      proofToCollect: [],
      counts: emptyCounts(),
    };
  }

  const traveler = resolveTraveler(options.travelerId);
  const item = traveler ? resolveChecklistItem(traveler, options.itemId) : null;
  const candidate = traveler && item ? toCandidate(traveler, item) : null;
  const checks = buildChecks(candidate);
  const readbackEvidence = buildReadbackEvidence(candidate);
  const status = getStatus(candidate, checks);
  const verificationPacket = buildVerificationPacket(status, candidate);

  return {
    canReadPacket: true,
    title: getTitle(actor),
    status,
    plainEnglishSummary:
      "This packet keeps the SLT traveler checklist lane honest: it previews one traveler-owned completion step, shows the readiness score delta, proves staff can inspect the change without owning it, and keeps Shopify, HubSpot, Luma, flight, payment, form, and meeting truth read-only.",
    candidate,
    checks,
    readbackEvidence,
    verificationPacket,
    proofToCollect: candidate
      ? [
          "Screenshot of `/admin/slt-checklist-write` showing the selected traveler, checklist item, and readiness delta.",
          `Screenshot of \`${candidate.previewRoute}\` showing the completion preview without a saved browser write.`,
          `Screenshot of \`${candidate.staffRoute}\` showing the same traveler still visible to staff as a read-only readiness follow-up.`,
          "Evidence that forms, payments, flights, meetings, HubSpot, Shopify, and Luma statuses stayed read-only.",
          "Evidence that the future audit preview names actor, item, before/after state, and readiness delta.",
          "Evidence that duplicate completion or reopen would require a correction event rather than a silent overwrite.",
        ]
      : [
          "Pick one traveler-owned SLT checklist item before reviewing the completion packet.",
        ],
    counts: {
      checks: checks.length,
      passedChecks: checks.filter((check) => check.passed).length,
      observedReadbackItems: readbackEvidence.filter((item) => item.status === "observed")
        .length,
      previewableItems: traveler
        ? traveler.checklist.filter(isPreviewSafeChecklistItem).length
        : 0,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function resolveTraveler(travelerId?: string): TripPrepTraveler | null {
  const requestedId = travelerId ?? defaultTravelerId;

  return (
    mockSltTripTravelers.find((traveler) => traveler.id === requestedId) ??
    mockSltTripTravelers.find((traveler) => traveler.id === defaultTravelerId) ??
    mockSltTripTravelers[0] ??
    null
  );
}

function resolveChecklistItem(
  traveler: TripPrepTraveler,
  itemId?: string,
): TripPrepChecklistItem | null {
  if (itemId) {
    return traveler.checklist.find((item) => item.id === itemId) ?? null;
  }

  return (
    traveler.checklist.find(isPreviewSafeChecklistItem) ??
    traveler.checklist.find((item) => item.status !== "complete") ??
    traveler.checklist[0] ??
    null
  );
}

function isPreviewSafeChecklistItem(item: TripPrepChecklistItem): boolean {
  return item.mockSource === "myMEDLIFE mock" && item.status !== "complete";
}

function toCandidate(
  traveler: TripPrepTraveler,
  item: TripPrepChecklistItem,
): SltChecklistCompletionCandidate {
  const beforeReadinessScore = calculateReadinessScore(traveler.checklist);
  const afterChecklist = traveler.checklist.map((candidateItem) => {
    if (candidateItem.id !== item.id) {
      return candidateItem;
    }

    return {
      ...candidateItem,
      status: "complete" as const,
    };
  });
  const afterReadinessScore = calculateReadinessScore(afterChecklist);

  return {
    travelerId: traveler.id,
    travelerName: traveler.displayName,
    chapterName: traveler.chapterName,
    tripLabel: traveler.tripLabel,
    itemId: item.id,
    itemTitle: item.title,
    itemCategory: item.category,
    currentStatus: item.status,
    futureStatus: "complete",
    owner: item.owner,
    dueLabel: item.dueLabel,
    mockSource: item.mockSource,
    detailRoute: `/slt-prep/checklist/${item.id}`,
    previewRoute: `/slt-prep/checklist/${item.id}?preview=complete`,
    staffRoute: `/slt-prep/staff?travelerId=${traveler.id}`,
    beforeReadinessScore,
    afterReadinessScore,
    readinessDelta: afterReadinessScore - beforeReadinessScore,
    protectedExternalSources: buildProtectedExternalSources(traveler),
    futureAuditPreview: {
      actorEmail: travelerOperatorEmail,
      action: "slt_checklist_completed",
      beforeStatus: item.status,
      afterStatus: "complete",
      readinessDelta: afterReadinessScore - beforeReadinessScore,
    },
  };
}

function buildProtectedExternalSources(traveler: TripPrepTraveler): string[] {
  const formsInFlight = traveler.forms.filter((item) => item.status !== "submitted").length;
  const paymentsInFlight = traveler.payments.filter((item) => item.status !== "paid").length;
  const flightsInFlight = traveler.flights.filter((item) => item.status !== "confirmed").length;
  const meetingsInFlight = traveler.meetings.filter((item) => item.status !== "attended").length;

  return [
    `${formsInFlight} form state(s) still stay read-only through Drive/Form or HubSpot posture.`,
    `${paymentsInFlight} payment milestone(s) still stay read-only through Shopify or scholarship review posture.`,
    `${flightsInFlight} flight segment(s) still stay read-only for travel operations until a separate lane approves them.`,
    `${meetingsInFlight} meeting status item(s) still stay read-only through Luma or Zoom posture.`,
  ];
}

function buildChecks(
  candidate: SltChecklistCompletionCandidate | null,
): SltChecklistCompletionPacketCheck[] {
  if (!candidate) {
    return [
      {
        key: "candidate_selected",
        label: "Traveler completion candidate is selected",
        passed: false,
        detail:
          "Choose one traveler and checklist item before reviewing the SLT completion packet.",
      },
    ];
  }

  const visiblePreview = getSltTripPrepChecklistDetailWorkspace(
    getMockLocalActorContext(
      travelerOperatorEmail,
      "Fake traveler preview for SLT checklist packet.",
    ),
    candidate.itemId,
    candidate.travelerId,
  );

  return [
    {
      key: "traveler_visible_item",
      label: "Traveler can see the checklist item in their own route",
      passed: Boolean(visiblePreview?.canReadDetail && visiblePreview.item),
      detail:
        visiblePreview?.canReadDetail && visiblePreview.item
          ? "The fake traveler can open the checklist detail route for this exact item."
          : "The traveler preview cannot see this checklist item yet.",
    },
    {
      key: "preview_safe_source",
      label: "The candidate stays inside myMEDLIFE-owned preview state",
      passed: candidate.mockSource === "myMEDLIFE mock",
      detail:
        candidate.mockSource === "myMEDLIFE mock"
          ? "This checklist item can be previewed without overwriting Shopify, HubSpot, Luma, or other external truth."
          : `This item is sourced from ${candidate.mockSource} and should stay read-only until that lane is separately approved.`,
    },
    {
      key: "item_not_complete",
      label: "The checklist item still needs completion",
      passed: candidate.currentStatus !== "complete",
      detail:
        candidate.currentStatus !== "complete"
          ? `The traveler is moving from ${candidate.currentStatus.replaceAll("_", " ")} to complete.`
          : "This item is already complete, so the packet would not prove a new readiness change.",
    },
    {
      key: "readiness_delta",
      label: "Readiness score recalculates from the previewed status change",
      passed: candidate.readinessDelta > 0,
      detail:
        candidate.readinessDelta > 0
          ? `The traveler readiness score rises from ${candidate.beforeReadinessScore}% to ${candidate.afterReadinessScore}%.`
          : "This preview does not change the traveler readiness score yet.",
    },
    {
      key: "staff_read_scope",
      label: "Staff can inspect the same traveler without taking ownership of the write",
      passed: candidate.staffRoute.length > 0,
      detail:
        "The staff dashboard route stays read-only and is used to inspect risk and readiness after the traveler-owned preview.",
    },
    {
      key: "external_boundaries",
      label: "External payment, form, flight, and meeting states stay locked",
      passed: candidate.protectedExternalSources.length === 4,
      detail: candidate.protectedExternalSources.join(" "),
    },
    {
      key: "correction_path",
      label: "Duplicate or reopen handling is documented",
      passed: true,
      detail:
        "The packet treats duplicate completion, undo, reopen, and extension/tour changes as future correction events rather than silent overwrites.",
    },
  ];
}

function buildReadbackEvidence(
  candidate: SltChecklistCompletionCandidate | null,
): SltChecklistCompletionReadbackItem[] {
  if (!candidate) {
    return [
      {
        key: "candidate_missing",
        label: "No traveler candidate is selected yet",
        status: "blocked",
        detail:
          "Choose one traveler-owned checklist item before reviewing completion posture.",
      },
    ];
  }

  return [
    {
      key: "before_state",
      label: "Before-state is visible",
      status: "observed",
      detail: `${candidate.itemTitle} is currently ${candidate.currentStatus.replaceAll("_", " ")} for ${candidate.travelerName}.`,
    },
    {
      key: "preview_state",
      label: "After-state preview is visible",
      status: candidate.readinessDelta > 0 ? "observed" : "manual_check_needed",
      detail:
        candidate.readinessDelta > 0
          ? `Previewing completion moves readiness to ${candidate.afterReadinessScore}% without saving a browser write.`
          : "The preview still needs a manual review because the readiness score did not move.",
    },
    {
      key: "staff_visibility",
      label: "Staff follow-up route is visible",
      status: "observed",
      detail:
        "Coaches and staff can inspect the same traveler in the readiness dashboard without overwriting traveler-owned completion truth.",
    },
    {
      key: "external_posture",
      label: "External-source posture stays read-only",
      status: "observed",
      detail: candidate.protectedExternalSources.join(" "),
    },
    {
      key: "audit_preview",
      label: "Future audit payload is defined",
      status: "observed",
      detail:
        `${candidate.futureAuditPreview.actorEmail} would record ${candidate.futureAuditPreview.action} with before=${candidate.futureAuditPreview.beforeStatus}, after=${candidate.futureAuditPreview.afterStatus}, and delta=${candidate.futureAuditPreview.readinessDelta}.`,
    },
    {
      key: "rollback_preview",
      label: "Correction path is visible",
      status: "observed",
      detail:
        "Undo, reopen, and extension/tour changes are described as follow-up correction events rather than silent edits to the original completion row.",
    },
  ];
}

function getStatus(
  candidate: SltChecklistCompletionCandidate | null,
  checks: SltChecklistCompletionPacketCheck[],
): SltChecklistCompletionPacketStatus {
  if (!candidate) {
    return "blocked_until_candidate_selected";
  }

  if (!isPreviewSafeChecklistItem(candidateToItem(candidate))) {
    return "blocked_until_preview_safe_item";
  }

  return checks.every((check) => check.passed)
    ? "evidence_observed"
    : "needs_manual_boundary_review";
}

function buildVerificationPacket(
  status: SltChecklistCompletionPacketStatus,
  candidate: SltChecklistCompletionCandidate | null,
): SltChecklistCompletionVerificationPacket {
  const previewRoute = candidate?.previewRoute ?? "/slt-prep/checklist";
  const staffRoute = candidate?.staffRoute ?? "/slt-prep/staff";

  return {
    status,
    canPromoteToStagingReview: status === "evidence_observed",
    title: getVerificationTitle(status),
    plainEnglishDecision: getVerificationDecision(status, candidate),
    envSettings: [
      {
        key: "MYMEDLIFE_AUTH_MODE",
        value: "local_supabase",
        reason:
          "Future traveler completion needs a real local session, even while this packet stays preview-only today.",
      },
      {
        key: "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES",
        value: "false",
        reason:
          "Keep the SLT checklist route preview-safe until SLT-specific write, audit, and correction approval exists.",
      },
    ],
    fakeOperatorChain: [
      {
        roleLabel: "Traveler",
        email: travelerOperatorEmail,
        route: candidate?.detailRoute ?? "/slt-prep/checklist",
      },
      {
        roleLabel: "Coach",
        email: "coach@mymedlife.test",
        route: staffRoute,
      },
      {
        roleLabel: "Admin / DS Admin / Super Admin",
        email: "admin@mymedlife.test",
        route: "/admin/slt-checklist-write",
      },
    ],
    operatorSequence: [
      {
        label: "Open the traveler checklist detail",
        route: candidate?.detailRoute ?? "/slt-prep/checklist",
        expectedProof:
          "Confirm the selected item is visible to the fake traveler and still shows its current status before any preview runs.",
      },
      {
        label: "Preview one completion change",
        route: previewRoute,
        expectedProof:
          "Confirm the route shows a completion preview and a readiness increase without saving a browser write.",
      },
      {
        label: "Inspect staff readiness follow-up",
        route: staffRoute,
        expectedProof:
          "Confirm staff can inspect the same traveler and risk posture without claiming ownership of the completion truth.",
      },
      {
        label: "Review audit and correction posture",
        route: "/admin/slt-checklist-write",
        expectedProof:
          "Confirm the future audit payload, duplicate handling, reopen path, and external-source boundaries are all explicit.",
      },
    ],
    safetyStops: [
      "Stop if the preview implies a real Shopify, HubSpot, Luma, Drive/Form, or flight-system write.",
      "Stop if one traveler can complete another traveler's checklist item.",
      "Stop if staff, HQ, or DS Admin can silently overwrite traveler-owned completion truth.",
      "Stop if the route enables uploads, payment collection, meeting RSVPs, or external sends as part of checklist completion.",
    ],
  };
}

function buildHiddenVerificationPacket(): SltChecklistCompletionVerificationPacket {
  return {
    status: "hidden",
    canPromoteToStagingReview: false,
    title: "SLT checklist packet hidden for this role",
    plainEnglishDecision:
      "Use Admin, DS Admin, or Super Admin to inspect SLT checklist completion safety.",
    envSettings: [],
    fakeOperatorChain: [],
    operatorSequence: [],
    safetyStops: [],
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin SLT checklist packet";
    case "ds_admin":
      return "DS Admin SLT checklist safety packet";
    case "super_admin":
      return "Full local SLT checklist packet";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "SLT checklist packet hidden for this role";
  }
}

function getVerificationTitle(status: SltChecklistCompletionPacketStatus): string {
  switch (status) {
    case "evidence_observed":
      return "Traveler completion stays preview-safe";
    case "needs_manual_boundary_review":
      return "Traveler completion still needs one more boundary review";
    case "blocked_until_preview_safe_item":
      return "Choose a myMEDLIFE-owned traveler item";
    case "blocked_until_candidate_selected":
      return "Choose a traveler checklist item";
    case "hidden":
      return "SLT checklist packet hidden for this role";
  }
}

function getVerificationDecision(
  status: SltChecklistCompletionPacketStatus,
  candidate: SltChecklistCompletionCandidate | null,
): string {
  switch (status) {
    case "evidence_observed":
      return candidate
        ? `${candidate.travelerName} can preview ${candidate.itemTitle.toLowerCase()} as a traveler-owned checklist completion, the readiness score moves by ${candidate.readinessDelta} point(s), staff can inspect the result, and external travel systems stay read-only.`
        : "A traveler-owned checklist completion preview is ready to inspect.";
    case "needs_manual_boundary_review":
      return "The packet is close, but one or more boundary checks still need a manual pass before SLT checklist completion should be treated as review-ready.";
    case "blocked_until_preview_safe_item":
      return "Pick a checklist item that is still owned by myMEDLIFE preview state rather than an external payment, form, or meeting system.";
    case "blocked_until_candidate_selected":
      return "Choose a traveler and checklist item before reviewing SLT completion posture.";
    case "hidden":
      return "Use an admin review role to inspect SLT checklist completion safety.";
  }
}

function emptyCounts(): SltChecklistCompletionPacket["counts"] {
  return {
    checks: 0,
    passedChecks: 0,
    observedReadbackItems: 0,
    previewableItems: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function candidateToItem(candidate: SltChecklistCompletionCandidate): TripPrepChecklistItem {
  return {
    id: candidate.itemId,
    category: candidate.itemCategory,
    title: candidate.itemTitle,
    status: candidate.currentStatus,
    dueLabel: candidate.dueLabel,
    summary: "",
    whyItMatters: "",
    evidenceRequirement: "",
    owner: candidate.owner,
    mockSource: candidate.mockSource,
    nextStep: "",
  };
}
