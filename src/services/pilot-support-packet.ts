import type { LocalActorContext } from "@/services/local-actor-context";

export type PilotSupportPacketStatus =
  | "review_ready"
  | "needs_decision"
  | "blocked_before_live";

export type PilotSupportPacketOwner = {
  key: string;
  label: string;
  ownerLane: string;
  status: PilotSupportPacketStatus;
  expectation: string;
  currentPosture: string;
  nextStep: string;
};

export type PilotSupportPacketCheck = {
  key: string;
  label: string;
  ownerLane: string;
  status: PilotSupportPacketStatus;
  currentPosture: string;
  missingApproval: string;
  reviewRoutes: string[];
};

export type PilotSupportPacketStopRule = {
  key: string;
  label: string;
  reason: string;
  response: string;
};

export type PilotSupportPacket = {
  canReadPacket: boolean;
  title: string;
  summary: string;
  recommendedNextMove: string;
  decisionPacket: {
    summary: string;
    pilotIdentityFields: string[];
    ownerFields: string[];
    firstWriteFields: string[];
    integrationHoldFields: string[];
  };
  pilotConstraints: string[];
  ownerChecklist: PilotSupportPacketOwner[];
  readinessChecks: PilotSupportPacketCheck[];
  stopRules: PilotSupportPacketStopRule[];
  studentCommsPolicy: string[];
  counts: {
    owners: number;
    checks: number;
    reviewReady: number;
    needsDecision: number;
    blockedBeforeLive: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getPilotSupportPacket(
  actor: LocalActorContext,
): PilotSupportPacket {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadPacket: false,
      title: "Pilot support packet hidden for this role",
      summary:
        "Pilot support planning is limited to HQ, DS Admin, and Super Admin review roles.",
      recommendedNextMove:
        "Use the student, chapter, or coach operating routes instead.",
      decisionPacket: emptyDecisionPacket(),
      pilotConstraints: [],
      ownerChecklist: [],
      readinessChecks: [],
      stopRules: [],
      studentCommsPolicy: [],
      counts: emptyCounts(),
    };
  }

  const ownerChecklist = getOwnerChecklist();
  const readinessChecks = getReadinessChecks();
  const statuses = [...ownerChecklist, ...readinessChecks].map((item) => item.status);

  return {
    canReadPacket: true,
    title: getTitle(actor),
    summary:
      "Use this packet to name the first pilot owners, prove the dry-run and rollback posture on the current review path, and make the stop rules explicit before any real student invitation.",
    recommendedNextMove:
      "Finish the staff dry run, name the chapter and owner lanes, capture the remaining device/accessibility evidence, confirm the first approved hosted write path, and keep uploads plus external sends disabled until the remaining gates are approved.",
    decisionPacket: {
      summary:
        "Leave the pilot approval meeting with one note that captures exactly who the pilot is for, who owns day-one support, which write path is approved first, and which integrations remain off.",
      pilotIdentityFields: [
        "Exact pilot chapter or internal cohort name.",
        "Launch window or review date for the first live rehearsal.",
        "Maximum student count allowed in the first wave.",
      ],
      ownerFields: [
        "Named chapter leader owner, coach owner, HQ/admin owner, and DS owner.",
        "Pause or support channel for day-one questions.",
        "Who approves student-facing pause or correction messages.",
      ],
      firstWriteFields: [
        "The one hosted write lane approved first.",
        "Rollback owner and disable-write owner for that lane.",
        "Audit/readback proof that must be reviewed before any second write lane opens.",
      ],
      integrationHoldFields: [
        "Confirmation that HubSpot, Luma writes, n8n, warehouse, Power BI, SMS, email, and AI remain disabled.",
        "Any narrow read-only exceptions approved for the pilot.",
        "Who owns replay or escalation if an outbox or integration row looks wrong.",
      ],
    },
    pilotConstraints: [
      "One chapter only.",
      "Five to fifteen students.",
      "One chapter leader owner.",
      "One coach owner.",
      "One HQ/admin owner.",
      "One DS owner.",
      "Manual-first event attendance and NPS unless a narrow Luma read path is approved separately.",
    ],
    ownerChecklist,
    readinessChecks,
    stopRules: getStopRules(),
    studentCommsPolicy: [
      "Student invitations, pause notices, and rollback messages must be sent through approved MEDLIFE channels, not from app automation.",
      "Pause the pilot immediately if auth, role scope, wrong-chapter data, uploads, or external sends appear enabled unexpectedly.",
      "Keep all real pilot changes inside the smallest approved chapter scope until week-one evidence is reviewed.",
    ],
    counts: {
      owners: ownerChecklist.length,
      checks: readinessChecks.length,
      reviewReady: statuses.filter((status) => status === "review_ready").length,
      needsDecision: statuses.filter((status) => status === "needs_decision")
        .length,
      blockedBeforeLive: statuses.filter(
        (status) => status === "blocked_before_live",
      ).length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getOwnerChecklist(): PilotSupportPacketOwner[] {
  return [
    {
      key: "pilot_group",
      label: "Pilot chapter and launch window",
      ownerLane: "Nick/team",
      status: "needs_decision",
      expectation:
        "Name the first chapter or internal cohort, the date window, and the smallest allowed member set.",
      currentPosture:
        "The pilot scope planner recommends one chapter and 5-15 students, but no real pilot group is approved yet.",
      nextStep:
        "Use /admin/pilot-scope to name the chapter, chapter leader owner, and launch window before any invitation goes out.",
    },
    {
      key: "coach_owner",
      label: "Coach owner and support lane",
      ownerLane: "Coach lead",
      status: "needs_decision",
      expectation:
        "One coach owns chapter risk review, intervention decisions, and first-response support during the pilot.",
      currentPosture:
        "Coach review surfaces exist, but the day-one owner and escalation backup still need to be named.",
      nextStep:
        "Assign the coach owner and backup before approving any live student path.",
    },
    {
      key: "hq_owner",
      label: "HQ/admin owner and student communications",
      ownerLane: "HQ operations",
      status: "needs_decision",
      expectation:
        "One HQ/admin owner approves student communications, pause messages, and day-one support hours.",
      currentPosture:
        "The operations runbook and launch gate call for named support ownership, but no final owner is recorded yet.",
      nextStep:
        "Confirm the HQ/admin owner, support channel, and pause-message approver in the pilot plan.",
    },
    {
      key: "ds_owner",
      label: "DS owner for data and integration recovery",
      ownerLane: "Data solutions",
      status: "review_ready",
      expectation:
        "One DS owner watches integration/outbox posture and owns data or RLS escalation if the pilot hits a truth mismatch.",
      currentPosture:
        "The production operations runbook already names Data Solutions as the owner lane for integration and outbox recovery.",
      nextStep:
        "Confirm which DS person will own day-one monitoring and replay decisions for the hosted pilot rehearsal.",
    },
  ];
}

function getReadinessChecks(): PilotSupportPacketCheck[] {
  return [
    {
      key: "staff_dry_run",
      label: "Staff dry run",
      ownerLane: "HQ operations",
      status: "review_ready",
      currentPosture:
        "The admin staff dry-run route already walks the team through member, leader, event/NPS, proof, coach, and DS safety review with zero writes and zero sends.",
      missingApproval:
        "Run the rehearsal on the current review or staging build and record who completed it.",
      reviewRoutes: ["/admin/staff-dry-run", "/rush-month/loop"],
    },
    {
      key: "rollback_drill",
      label: "Rollback and disable-write drill",
      ownerLane: "App and Data",
      status: "review_ready",
      currentPosture:
        "The write-sequence and admin operations surfaces already define rollback prompts, audit readback review, and a keep-it-disabled posture for unsafe writes.",
      missingApproval:
        "Name the rollback owner for the first enabled write and rehearse the disable path on the release candidate.",
      reviewRoutes: ["/admin/first-write", "/admin/write-sequence", "/admin/operations"],
    },
    {
      key: "device_accessibility",
      label: "Phone, tablet, desktop, and accessibility smoke",
      ownerLane: "Product and launch",
      status: "blocked_before_live",
      currentPosture:
        "The design QA and route-smoke plans exist, but release-build device smoke and accessibility evidence are still missing.",
      missingApproval:
        "Complete phone/tablet/desktop smoke plus keyboard or screen-reader checks on the release build before invitations.",
      reviewRoutes: ["/admin/design-qa", "/offline", "/admin"],
    },
    {
      key: "student_comms_stop_rules",
      label: "Stop rules and student communications",
      ownerLane: "Nick/team and HQ operations",
      status: "needs_decision",
      currentPosture:
        "The launch gate and operations runbook name the need for stop conditions and a pause path, but the final student-facing wording is still pending.",
      missingApproval:
        "Approve the stop conditions, pause message, and pilot support channel before the first invitation.",
      reviewRoutes: ["/admin/launch-gate", "/admin/operations", "/admin/pilot-scope"],
    },
  ];
}

function getStopRules(): PilotSupportPacketStopRule[] {
  return [
    {
      key: "wrong_role_or_chapter",
      label: "Wrong role or wrong chapter access",
      reason:
        "A pilot must stop if a user sees the wrong chapter, wrong role, or more data than expected.",
      response:
        "Pause invitations, capture the affected route and actor, and keep any new write path disabled until the auth or RLS issue is resolved.",
    },
    {
      key: "unexpected_upload_or_send",
      label: "Uploads or external sends appear active",
      reason:
        "Proof uploads, public proof sharing, HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes are outside the approved first pilot path.",
      response:
        "Stop the pilot, disable the affected path, and confirm the app plus Supabase remain the source of truth before continuing.",
    },
    {
      key: "write_readback_mismatch",
      label: "Write readback or audit mismatch",
      reason:
        "A first pilot cannot continue if the saved result, audit row, or chapter truth disagrees with the expected readback.",
      response:
        "Hold the next write promotion, review audit and integration evidence, and use the rollback owner path before reopening the lane.",
    },
    {
      key: "support_load_exceeds_capacity",
      label: "Support load exceeds day-one capacity",
      reason:
        "The pilot should stay intentionally small; a support queue that outruns the named owner lane is a launch risk, not a badge of progress.",
      response:
        "Pause expansion, route all new questions through the approved support channel, and review week-one evidence before resuming.",
    },
  ];
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin pilot support and stop-rules packet";
    case "ds_admin":
      return "DS Admin pilot support and recovery packet";
    case "super_admin":
      return "Full pilot support and stop-rules packet";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Pilot support packet hidden for this role";
  }
}

function emptyCounts(): PilotSupportPacket["counts"] {
  return {
    owners: 0,
    checks: 0,
    reviewReady: 0,
    needsDecision: 0,
    blockedBeforeLive: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function emptyDecisionPacket(): PilotSupportPacket["decisionPacket"] {
  return {
    summary: "",
    pilotIdentityFields: [],
    ownerFields: [],
    firstWriteFields: [],
    integrationHoldFields: [],
  };
}
