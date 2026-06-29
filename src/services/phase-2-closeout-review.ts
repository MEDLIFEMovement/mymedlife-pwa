import { getAuthOnboardingWorkspace } from "@/services/auth-onboarding-workspace";
import { getControlledPilotReadiness } from "@/services/controlled-pilot-readiness";
import { getDesignQaReadiness } from "@/services/design-qa-readiness";
import { getFirstWriteActivationDrill } from "@/services/first-write-activation-drill";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getMvpReleaseReadinessSummary } from "@/services/mvp-release-readiness";
import { getPhase2PilotRegistry } from "@/services/phase-2-pilot-registry";
import { getPilotScopePlanner } from "@/services/pilot-scope-planner";
import { getProofMetadataPacket } from "@/services/proof-metadata-verification-packet";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import { getStagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";
import { getStaffDryRunGuide } from "@/services/staff-dry-run-guide";

export type Phase2CloseoutLaneStatus =
  | "review_now"
  | "awaiting_human_confirmation"
  | "blocked_before_pilot";

export type Phase2CloseoutLane = {
  key: string;
  label: string;
  href: string;
  status: Phase2CloseoutLaneStatus;
  summary: string;
  evidence: string[];
};

export type Phase2DoneCriterionStatus =
  | "review_ready_in_repo"
  | "awaiting_human_confirmation"
  | "awaiting_hosted_proof";

export type Phase2DoneCriterion = {
  key: string;
  label: string;
  status: Phase2DoneCriterionStatus;
  evidence: string[];
};

export type Phase2CloseoutReview = {
  canReadReview: boolean;
  title: string;
  summary: string;
  packetPath: string;
  reviewerAction: string;
  approvalReplyHint: string;
  recordedAnswers: string[];
  approvalReplyBlock: string[];
  lanes: Phase2CloseoutLane[];
  doneCriteria: Phase2DoneCriterion[];
  hostedEvidenceChecklist: string[];
  requiredHumanDecisions: string[];
  blockedScope: string[];
  counts: {
    lanes: number;
    reviewNow: number;
    awaitingHumanConfirmation: number;
    blockedBeforePilot: number;
    criteriaReviewReadyInRepo: number;
    criteriaAwaitingHumanConfirmation: number;
    criteriaAwaitingHostedProof: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

type HostedActionStartProof = {
  assignmentId: string;
  assignmentTitle: string;
  assignmentStatus: string;
  eventId: string;
  integrationEventId: string;
  auditLogId: string;
};

type HostedProofLoopEvidence = {
  assignmentId: string;
  assignmentTitle: string;
  assignmentStatus: string;
  evidenceItemId: string;
  evidenceSummary: string;
  eventId: string;
  integrationEventId: string;
  auditLogId: string;
  outboxId: string;
};

export function getPhase2CloseoutReview(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): Phase2CloseoutReview {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadReview: false,
      title: "Phase 2 closeout review hidden for this role",
      summary:
        "Phase 2 closeout is an HQ review surface, not a student or chapter operating view.",
      packetPath: "docs/review/2026-06-24-phase-2-live-mvp-pilot-closeout-packet.md",
      reviewerAction: "Use the student, leader, or coach operating routes instead.",
      approvalReplyHint: "",
      recordedAnswers: [],
      approvalReplyBlock: [],
      lanes: [],
      doneCriteria: [],
      hostedEvidenceChecklist: [],
      requiredHumanDecisions: [],
      blockedScope: [],
      counts: emptyCounts(),
    };
  }

  const releaseReadiness = getMvpReleaseReadinessSummary(actor);
  const lumaReadModel = getStagingLumaEventLoopReadModel({
    mode: "staging",
    data,
  });
  const pilotReadiness = getControlledPilotReadiness(actor, {
    lumaReadModel,
  });
  const pilotScope = getPilotScopePlanner(actor);
  const pilotRegistry = getPhase2PilotRegistry();
  const onboarding = getAuthOnboardingWorkspace(actor);
  const dryRun = getStaffDryRunGuide(actor, data);
  const firstWrite = getFirstWriteActivationDrill(actor, data);
  const proofLoop = getProofMetadataPacket(actor, data);
  const designQa = getDesignQaReadiness(actor);
  const hostedActionStartProof = findHostedActionStartProof(data);
  const hostedProofLoopEvidence = findHostedProofLoopEvidence(data);
  const hostedLumaEvidenceObserved =
    data.source.mode === "supabase" &&
    lumaReadModel.providerStatusLabel === "Staging evidence rows recorded" &&
    lumaReadModel.summary.rsvpCount > 0 &&
    lumaReadModel.summary.attendanceCount > 0 &&
    lumaReadModel.summary.pointsAwarded > 0;
  const roleReadbackEvidenceObserved =
    Boolean(hostedActionStartProof) &&
    Boolean(hostedProofLoopEvidence) &&
    hostedLumaEvidenceObserved;
  const packetPath =
    releaseReadiness.phase2Closeout?.packetPath ??
    "docs/review/2026-06-24-phase-2-live-mvp-pilot-closeout-packet.md";
  const recordedAnswers = [
    ...pilotRegistry.defaults
      .filter((item) => item.status === "recorded_final")
      .map((item) => `${item.label}: ${item.value}`),
    ...pilotRegistry.owners
      .filter((item) => item.status === "recorded_owner")
      .map((item) => `${item.label}: ${item.value}`),
  ];
  const requiredHumanDecisions = [
    "Confirm the intended staging review target and reviewer access path; anonymous requests currently redirect to Vercel SSO and then to a Vercel-hosted `/login?next=/sso-api...` path before the app.",
    "Confirm the staff dry-run pass and note any confusing copy that should stay visible in the packet.",
    "Complete one human device and accessibility smoke pass before pilot approval.",
    ...(pilotRegistry.counts.ownersPending > 0
      ? [
          "Name the pilot chapter owners, DS owner, support owner, support/pause channel, and rollback owner.",
        ]
      : []),
    ...(firstWrite.hostedCloseout.namedOwnersStillNeeded.some(
      (item) => item.key === "hosted_write_approver",
    )
      ? [
          "Approve `action_started` as the first hosted write, or replace it with a narrower approved lane.",
        ]
      : []),
    "Confirm the smallest hosted proof/review loop is limited to proof metadata submission plus leader review readback, while leader decision writes, uploads, and public proof stay blocked.",
    "Confirm that HubSpot, Luma, n8n, warehouse / Power BI, SMS/email, and AI actions stay off for the pilot.",
  ];

  const doneCriteria: Phase2DoneCriterion[] = [
    {
      key: "named_owners",
      label: "Named pilot owners, support owner, support/pause channel, and rollback owner are recorded",
      status:
        pilotRegistry.counts.ownersPending === 0
          ? "review_ready_in_repo"
          : "awaiting_human_confirmation",
      evidence: [
        `${pilotRegistry.counts.ownersRecorded} owner slots are recorded in the Phase 2 registry.`,
        `${pilotRegistry.counts.ownersPending} owner slots still need a named human owner.`,
        "The review packet and `/admin/pilot-scope` now show pending slots separately from recorded answers.",
      ],
    },
    {
      key: "hosted_auth",
      label: "Hosted auth works for the pilot cohort",
      status: "awaiting_hosted_proof",
      evidence: [
        "Repo support exists for staging review auth and manual pre-provisioning of the first cohort.",
        "Observed on 2026-06-24 and again on 2026-06-29: anonymous staging requests redirect to Vercel SSO and then to a Vercel-hosted `/login?next=/sso-api...` path.",
        "Hosted reviewer sign-in proof now exists for a seeded DS/Admin staging session after that Vercel handoff.",
        "Cross-role pilot-cohort sign-in and final role-routed landing proof still need to be captured from the approved hosted session.",
      ],
    },
    {
      key: "first_hosted_write",
      label: "The first hosted write lane `action_started` is enabled and proven in staging",
      status: hostedActionStartProof
        ? "awaiting_human_confirmation"
        : "awaiting_hosted_proof",
      evidence: [
        `Recommended first hosted write remains ${firstWrite.hostedCloseout.recommendedHostedWrite}.`,
        `${firstWrite.hostedCloseout.requiredReadback.length} hosted readback checks are already defined.`,
        hostedActionStartProof
          ? `Hosted action-start evidence is already visible on assignment ${hostedActionStartProof.assignmentId} via event ${hostedActionStartProof.eventId}, integration event ${hostedActionStartProof.integrationEventId}, and audit log ${hostedActionStartProof.auditLogId}.`
          : "Hosted Luma event / RSVP / attendance proof now exists, but no hosted `action_started` before/after capture is recorded yet.",
      ],
    },
    {
      key: "proof_loop",
      label: "The smallest hosted proof/review loop is proven end to end",
      status: hostedProofLoopEvidence
        ? "awaiting_human_confirmation"
        : "awaiting_hosted_proof",
      evidence: [
        `Recommended proof loop remains ${proofLoop.hostedCloseout.recommendedProofLoop}.`,
        "Leader review readback is in scope; leader decision writes, uploads, and public proof stay blocked.",
        hostedProofLoopEvidence
          ? `Hosted proof-loop evidence is already visible on assignment ${hostedProofLoopEvidence.assignmentId} and evidence item ${hostedProofLoopEvidence.evidenceItemId}, with outbox row ${hostedProofLoopEvidence.outboxId} still disabled.`
          : "Hosted Luma proof is now recorded, but the proof metadata to leader-review loop still lacks its own end-to-end staging capture.",
      ],
    },
    {
      key: "readback_surfaces",
      label: "Leader, staff, DS/admin, and audit/outbox views show the correct readback",
      status: roleReadbackEvidenceObserved
        ? "awaiting_human_confirmation"
        : "awaiting_hosted_proof",
      evidence: [
        "Leader, staff, DS/admin, audit, and outbox review surfaces are explicitly named in the hosted closeout packets.",
        hostedLumaEvidenceObserved
          ? "Hosted Luma review has already been observed across member, leader, staff, admin, audit, and outbox surfaces."
          : "Hosted Luma review still needs an honest RSVP, attendance, and points readback pass.",
        roleReadbackEvidenceObserved
          ? "The remaining gap is reviewer confirmation and external recording of the current route/readback evidence bundle."
          : "First-write and proof-loop-specific readback screenshots or route captures are still missing from the final hosted evidence bundle.",
      ],
    },
    {
      key: "integration_hold",
      label: "All external integrations remain disabled",
      status: "review_ready_in_repo",
      evidence: [
        "The closeout packet, first-write packet, and proof-loop packet all keep external writes out of scope.",
        "Current review surfaces still expect zero external sends.",
        "DS still needs to confirm that this hold posture remains the pilot rule.",
      ],
    },
    {
      key: "evidence_separation",
      label: "Staging evidence, approval notes, and launch packet separate proven behavior from still-blocked scope",
      status: "review_ready_in_repo",
      evidence: [
        "The dated closeout packet now includes a criterion-by-criterion audit section.",
        "The `/admin/phase-2` lane now reports review-ready repo criteria separately from hosted-proof blockers.",
        "GitHub PR and Linear checkpoints have been kept in sync with the same truth line.",
      ],
    },
    {
      key: "controlled_pilot_not_production",
      label: "The result is controlled live pilot readiness, not full production launch",
      status: "review_ready_in_repo",
      evidence: [
        "The closeout packet explicitly says production launch is out of scope.",
        "The launch framing keeps staging as the rehearsal environment and the pilot as one chapter plus one campaign.",
        "No product-surface change in this lane claims broad rollout or production activation.",
      ],
    },
  ];

  const hostedEvidenceChecklist = [
    "Capture the approved staging reviewer path, including the real access gate reviewers are expected to use before the Vercel-hosted `/login?next=/sso-api...` handoff.",
    "Capture proof that the pilot user can sign in through that staging path and lands in the correct role-scoped app surface.",
    hostedActionStartProof
      ? `Record the current hosted \`action_started\` proof for assignment ${hostedActionStartProof.assignmentId}, including event ${hostedActionStartProof.eventId}, integration event ${hostedActionStartProof.integrationEventId}, audit log ${hostedActionStartProof.auditLogId}, and zero outbox sends.`
      : "Capture before/after evidence for the hosted `action_started` write from the signed-in student route.",
    hostedActionStartProof
      ? `Record the current assignment readback for ${hostedActionStartProof.assignmentId}; it has already moved beyond the first write into status \`${hostedActionStartProof.assignmentStatus}\`, so reviewers should use the event/integration/audit chain as the authoritative proof of start.`
      : "Capture assignment status, internal event, integration event, and audit-log readback for hosted `action_started`, while external sends remain at zero.",
    hostedLumaEvidenceObserved
      ? "Record the existing hosted Luma proof with current RSVP, attendance, points, leaderboard, audit, and outbox counters."
      : "Record the existing hosted Luma proof with current counters, or rerun one real host-side Luma check-in in the approved pilot event, then confirm attendance import, points, leaderboard, audit, and outbox readback honestly.",
    hostedProofLoopEvidence
      ? `Record the current hosted proof-loop evidence for assignment ${hostedProofLoopEvidence.assignmentId} and evidence item ${hostedProofLoopEvidence.evidenceItemId}, then confirm leader, staff, DS/admin, audit, and outbox readback against that same row set.`
      : "Capture the smallest hosted proof loop: metadata submission, leader review readback, staff readback, DS/admin readback, audit readback, and outbox readback.",
    "Capture explicit evidence that uploads, public proof sharing, HQ proof decisions, coach decisions, and all external integrations remain disabled during the hosted rehearsal.",
  ];

  const lanes: Phase2CloseoutLane[] = [
    {
      key: "closeout_packet",
      label: "Phase 2 closeout packet",
      href: "/admin/release-readiness",
      status: "review_now",
      summary:
        releaseReadiness.phase2Closeout?.summary ??
        releaseReadiness.plainEnglishVerdict,
      evidence: [
        `Packet: ${packetPath}`,
        `${releaseReadiness.achievements.length} items are already review-ready locally.`,
        `${releaseReadiness.blockers.length} live-launch blockers are still open.`,
        `${
          releaseReadiness.phase2Closeout?.provenNow.length ?? 0
        } Phase 2 closeout criteria are review-ready in repo, while ${
          releaseReadiness.phase2Closeout?.stillBlocked.length ?? 0
        } still need hosted proof or human signoff.`,
        "Status remains: staging reviewable, live pilot not yet approved.",
      ],
    },
    {
      key: "staff_dry_run",
      label: "Staff dry run",
      href: "/admin/staff-dry-run",
      status: "review_now",
      summary: dryRun.summary,
      evidence: [
        `${dryRun.counts.steps} rehearsal steps are laid out.`,
        `${dryRun.counts.passCriteria} pass checks are already named.`,
        `${dryRun.counts.browserWritesExpected} browser writes are expected in this rehearsal.`,
        `${dryRun.counts.externalWritesExpected} external sends are expected in this rehearsal.`,
      ],
    },
    {
      key: "design_qa",
      label: "Device and accessibility review",
      href: "/admin/design-qa",
      status: "awaiting_human_confirmation",
      summary:
        "Phone, tablet, offline, keyboard, and accessibility smoke proof still need a human signoff pass before the pilot can be closed honestly.",
      evidence: [
        `${designQa.counts.mobileSmokeChecks} phone-sized route checks are already listed.`,
        `${designQa.counts.accessibilitySmokeChecks} accessibility smoke checks are already listed.`,
        `${designQa.counts.devicePwaSmokeChecks} device and PWA checks are already listed.`,
        "This lane is about reviewer evidence, not enabling any new behavior.",
      ],
    },
    {
      key: "auth_onboarding",
      label: "Hosted auth and onboarding preflight",
      href: "/onboarding",
      status:
        (onboarding.launchPreflight?.counts.blocked ?? 0) > 0
          ? "blocked_before_pilot"
          : "awaiting_human_confirmation",
      summary:
        onboarding.launchPreflight?.summary ??
        "Hosted auth and onboarding still need explicit pilot approval before real users are invited.",
      evidence: [
        `${
          onboarding.launchPreflight?.counts.total ?? onboarding.counts.steps
        } auth and onboarding checks are visible here.`,
        `${
          onboarding.launchPreflight?.counts.blocked ?? 0
        } preflight items are still blocked.`,
        "Recommended default: manually pre-provision the first hosted pilot cohort.",
        "Observed 2026-06-24 and rechecked on 2026-06-29: anonymous staging requests redirect to Vercel SSO and then to `/login?next=/sso-api...` before the app.",
        "A seeded DS/Admin reviewer session has already completed that hosted sign-in path successfully.",
        "Live auth, production users, and onboarding writes remain disabled.",
      ],
    },
    {
      key: "pilot_scope",
      label: "Pilot scope and named owners",
      href: "/admin/pilot-scope",
      status: "awaiting_human_confirmation",
      summary: pilotScope.recommendedScope,
      evidence: [
        `${
          pilotRegistry.counts.ownersPending
        } named owner slots still need human names.`,
        `${
          pilotRegistry.counts.ownersRecorded
        } owner slots are already recorded in the Phase 2 registry.`,
        `${
          pilotScope.decisions.filter((decision) => decision.status === "needs_decision")
            .length
        } pilot-scope decisions still need confirmation.`,
        `Pilot chapter currently reads as ${
          pilotRegistry.defaults.find((item) => item.key === "pilot_chapter")?.value ??
          "UCLA MEDLIFE"
        }.`,
        "Rush Month only, 5-10 students, one support owner, and one support/pause channel remain the recommended minimum unless final approvals replace them.",
      ],
    },
    {
      key: "first_hosted_write",
      label: "First hosted write approval",
      href: "/admin/first-write",
      status: hostedActionStartProof
        ? "awaiting_human_confirmation"
        : "blocked_before_pilot",
      summary: hostedActionStartProof
        ? `${firstWrite.hostedCloseout.hostedDecision} Current staging evidence already exists on assignment ${hostedActionStartProof.assignmentId}; the remaining step is approval recording, not rediscovering the write.`
        : firstWrite.hostedCloseout.hostedDecision,
      evidence: [
        `Recommended first hosted write: ${firstWrite.hostedCloseout.recommendedHostedWrite}.`,
        `${firstWrite.hostedCloseout.requiredReadback.length} readback checks must be captured before any second write opens.`,
        `${firstWrite.hostedCloseout.namedOwnersStillNeeded.length} owner slots are still unnamed on the hosted write path.`,
        hostedActionStartProof
          ? `Hosted staging proof is already visible via event ${hostedActionStartProof.eventId}, integration event ${hostedActionStartProof.integrationEventId}, and audit log ${hostedActionStartProof.auditLogId}.`
          : "Hosted staging proof has not been recorded on this route yet.",
      ],
    },
    {
      key: "hosted_proof_loop",
      label: "Hosted proof loop closeout",
      href: "/admin/proof-write",
      status: hostedProofLoopEvidence
        ? "awaiting_human_confirmation"
        : "blocked_before_pilot",
      summary: hostedProofLoopEvidence
        ? `${proofLoop.hostedCloseout.hostedDecision} Current staging evidence already exists on evidence item ${hostedProofLoopEvidence.evidenceItemId}; the remaining step is reviewer confirmation and signoff.`
        : proofLoop.hostedCloseout.hostedDecision,
      evidence: [
        `Recommended proof loop: ${proofLoop.hostedCloseout.recommendedProofLoop}.`,
        `${proofLoop.hostedCloseout.requiredReadback.length} hosted readback checks must be captured before proof-loop approval is honest.`,
        `${proofLoop.hostedCloseout.namedOwnersStillNeeded.length} owner slots still affect the hosted proof loop.`,
        hostedProofLoopEvidence
          ? `Leader review readback is in scope for this loop and the current proof row set is anchored to ${hostedProofLoopEvidence.evidenceItemId}; leader decision writes remain blocked.`
          : "Leader review readback is in scope for this loop, but leader decision writes remain blocked.",
      ],
    },
    {
      key: "controlled_pilot_gate",
      label: "Pilot gate and integration hold",
      href: "/admin",
      status: "blocked_before_pilot",
      summary: pilotReadiness.plainEnglishVerdict,
      evidence: [
        `${pilotReadiness.counts.readyNow} pilot stages are ready for local review now.`,
        `${pilotReadiness.counts.blockedBeforePilot} stages or gates are still blocked before pilot use.`,
        `${recordedAnswers.length} approval answers are already recorded across the Phase 2 registry.`,
        "External systems stay off unless separately approved.",
        firstWrite.hostedCloseout.externalHoldPosture,
      ],
    },
  ];

  return {
    canReadReview: true,
    title: getTitle(surfaceFamily),
    summary:
      "This route is the clean review starting point for Phase 2. It turns the current closeout packet, dry-run proof, onboarding preflight, pilot scope, first hosted write, hosted proof loop, and integration hold into one reviewer path without claiming the pilot is approved.",
    packetPath,
    reviewerAction:
      "Reviewers should start here, open only the linked routes that need attention, and either reply `approved as written` or replace only the fields they want changed.",
    approvalReplyHint:
      "Recommended defaults are already filled in where the repo has evidence. Human approval is still required for naming owners, staging reviewer posture, accessibility signoff, first hosted write ownership, and the external-systems hold.",
    recordedAnswers,
    approvalReplyBlock: pilotRegistry.approvalReplyBlock,
    lanes,
    doneCriteria,
    hostedEvidenceChecklist,
    requiredHumanDecisions,
    blockedScope: Array.from(
      new Set([
        ...firstWrite.hostedCloseout.blockedScope,
        ...proofLoop.hostedCloseout.blockedScope,
      ]),
    ),
    counts: {
      lanes: lanes.length,
      reviewNow: lanes.filter((lane) => lane.status === "review_now").length,
      awaitingHumanConfirmation: lanes.filter(
        (lane) => lane.status === "awaiting_human_confirmation",
      ).length,
      blockedBeforePilot: lanes.filter(
        (lane) => lane.status === "blocked_before_pilot",
      ).length,
      criteriaReviewReadyInRepo: doneCriteria.filter(
        (item) => item.status === "review_ready_in_repo",
      ).length,
      criteriaAwaitingHumanConfirmation: doneCriteria.filter(
        (item) => item.status === "awaiting_human_confirmation",
      ).length,
      criteriaAwaitingHostedProof: doneCriteria.filter(
        (item) => item.status === "awaiting_hosted_proof",
      ).length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getTitle(surfaceFamily: ActorSurfaceFamily) {
  switch (surfaceFamily) {
    case "staff":
      return "Admin Phase 2 closeout review";
    case "ds_admin":
      return "DS Admin Phase 2 closeout review";
    case "super_admin":
      return "Full local Phase 2 closeout review";
    case "member":
    case "leader":
    case "coach":
      return "Phase 2 closeout review hidden for this role";
  }
}

function emptyCounts(): Phase2CloseoutReview["counts"] {
  return {
    lanes: 0,
    reviewNow: 0,
    awaitingHumanConfirmation: 0,
    blockedBeforePilot: 0,
    criteriaReviewReadyInRepo: 0,
    criteriaAwaitingHumanConfirmation: 0,
    criteriaAwaitingHostedProof: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function findHostedActionStartProof(
  data: ReadOnlyAppData,
): HostedActionStartProof | null {
  for (const event of data.eventRows) {
    if (event.event_type !== "action_started" || !event.assignment_id) {
      continue;
    }

    const assignment = data.assignments.find((item) => item.id === event.assignment_id);
    const integrationEvent = data.integrationEventRows.find((item) => {
      return item.event_type === "action_started" &&
        (item.source_event_id === event.id || item.external_object_id === event.assignment_id);
    });
    const auditLog = data.auditLogs.find((item) => {
      return item.action === "action_started" &&
        item.target_table === "assignments" &&
        item.target_id === event.assignment_id;
    });
    const outboxRows = data.automationOutboxRows.filter((item) => {
      return item.event_type === "action_started" ||
        item.source_event_id === event.id ||
        (integrationEvent?.id ? item.integration_event_id === integrationEvent.id : false);
    });

    if (!assignment || !integrationEvent || !auditLog || outboxRows.length > 0) {
      continue;
    }

    return {
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      assignmentStatus: assignment.status,
      eventId: event.id,
      integrationEventId: integrationEvent.id,
      auditLogId: auditLog.id,
    };
  }

  return null;
}

function findHostedProofLoopEvidence(
  data: ReadOnlyAppData,
): HostedProofLoopEvidence | null {
  for (const evidenceItem of data.evidenceItems) {
    if (!evidenceItem.assignmentId) {
      continue;
    }

    const assignment = data.assignments.find((item) => item.id === evidenceItem.assignmentId);
    const event = data.eventRows.find((item) => {
      return item.event_type === "evidence_submitted" &&
        item.assignment_id === evidenceItem.assignmentId;
    });
    const integrationEvent = data.integrationEventRows.find((item) => {
      return item.event_type === "evidence_submitted" &&
        (event?.id ? item.source_event_id === event.id : false);
    });
    const outboxRow = data.automationOutboxRows.find((item) => {
      return item.event_type === "evidence_submitted" &&
        item.status === "disabled" &&
        ((event?.id ? item.source_event_id === event.id : false) ||
          (integrationEvent?.id ? item.integration_event_id === integrationEvent.id : false));
    });
    const auditLog = data.auditLogs.find((item) => {
      return item.action === "evidence_submitted" &&
        item.target_table === "evidence_items" &&
        item.target_id === evidenceItem.id;
    });

    if (!assignment || !event || !integrationEvent || !outboxRow || !auditLog) {
      continue;
    }

    return {
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      assignmentStatus: assignment.status,
      evidenceItemId: evidenceItem.id,
      evidenceSummary: evidenceItem.summary,
      eventId: event.id,
      integrationEventId: integrationEvent.id,
      auditLogId: auditLog.id,
      outboxId: outboxRow.id,
    };
  }

  return null;
}
