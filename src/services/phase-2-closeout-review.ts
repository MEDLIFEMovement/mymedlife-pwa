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
      requiredHumanDecisions: [],
      blockedScope: [],
      counts: emptyCounts(),
    };
  }

  const releaseReadiness = getMvpReleaseReadinessSummary(actor);
  const pilotReadiness = getControlledPilotReadiness(actor);
  const pilotScope = getPilotScopePlanner(actor);
  const pilotRegistry = getPhase2PilotRegistry();
  const onboarding = getAuthOnboardingWorkspace(actor);
  const dryRun = getStaffDryRunGuide(actor, data);
  const firstWrite = getFirstWriteActivationDrill(actor, data);
  const proofLoop = getProofMetadataPacket(actor, data);
  const designQa = getDesignQaReadiness(actor);
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
    "Confirm the intended staging review target and reviewer access path; anonymous requests currently redirect through Vercel SSO before app login.",
    "Confirm the staff dry-run pass and note any confusing copy that should stay visible in the packet.",
    "Complete one human device and accessibility smoke pass before pilot approval.",
    ...(pilotRegistry.counts.ownersPending > 0
      ? [
          "Name the pilot chapter owners, DS owner, support/pause channel, and rollback owner.",
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
      label: "Named pilot owners, rollback owner, and support/pause channel are recorded",
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
        "Observed on 2026-06-24: anonymous staging requests redirect through Vercel SSO before app login.",
        "Hosted reviewer-path approval and real signed-in staging proof are still missing.",
      ],
    },
    {
      key: "first_hosted_write",
      label: "The first hosted write lane `action_started` is enabled and proven in staging",
      status: "awaiting_hosted_proof",
      evidence: [
        `Recommended first hosted write remains ${firstWrite.hostedCloseout.recommendedHostedWrite}.`,
        `${firstWrite.hostedCloseout.requiredReadback.length} hosted readback checks are already defined.`,
        "The hosted write packet is framed, but no real staging proof is recorded yet.",
      ],
    },
    {
      key: "proof_loop",
      label: "The smallest hosted proof/review loop is proven end to end",
      status: "awaiting_hosted_proof",
      evidence: [
        `Recommended proof loop remains ${proofLoop.hostedCloseout.recommendedProofLoop}.`,
        "Leader review readback is in scope; leader decision writes, uploads, and public proof stay blocked.",
        "The loop is review-framed in repo, but no hosted end-to-end proof is recorded yet.",
      ],
    },
    {
      key: "readback_surfaces",
      label: "Leader, staff, DS/admin, and audit/outbox views show the correct readback",
      status: "awaiting_hosted_proof",
      evidence: [
        "Leader, staff, DS/admin, audit, and outbox review surfaces are explicitly named in the hosted closeout packets.",
        "Those routes are reviewable locally and mapped in the Phase 2 packet.",
        "Hosted staging readback screenshots and route evidence are still missing.",
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
        "Observed 2026-06-24: anonymous staging requests redirect through Vercel SSO before the app login route.",
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
        "Rush Month only, 5-10 students, and one support/pause channel remain the recommended minimum unless final approvals replace them.",
      ],
    },
    {
      key: "first_hosted_write",
      label: "First hosted write approval",
      href: "/admin/first-write",
      status: "blocked_before_pilot",
      summary: firstWrite.hostedCloseout.hostedDecision,
      evidence: [
        `Recommended first hosted write: ${firstWrite.hostedCloseout.recommendedHostedWrite}.`,
        `${firstWrite.hostedCloseout.requiredReadback.length} readback checks must be captured before any second write opens.`,
        `${firstWrite.hostedCloseout.namedOwnersStillNeeded.length} owner slots are still unnamed on the hosted write path.`,
        "Hosted staging proof has not been recorded on this route yet.",
      ],
    },
    {
      key: "hosted_proof_loop",
      label: "Hosted proof loop closeout",
      href: "/admin/proof-write",
      status: "blocked_before_pilot",
      summary: proofLoop.hostedCloseout.hostedDecision,
      evidence: [
        `Recommended proof loop: ${proofLoop.hostedCloseout.recommendedProofLoop}.`,
        `${proofLoop.hostedCloseout.requiredReadback.length} hosted readback checks must be captured before proof-loop approval is honest.`,
        `${proofLoop.hostedCloseout.namedOwnersStillNeeded.length} owner slots still affect the hosted proof loop.`,
        "Leader review readback is in scope for this loop, but leader decision writes remain blocked.",
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
