import type { LocalActorContext } from "@/services/local-actor-context";
import { getPhase2PilotRegistry } from "@/services/phase-2-pilot-registry";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import type { StagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";

export type PilotReadinessStatus =
  | "ready_now"
  | "needs_decision"
  | "blocked_before_pilot"
  | "blocked_before_scale";

export type PilotReadinessStageKey =
  | "local_stakeholder_review"
  | "staff_dry_run"
  | "staging_review"
  | "first_student_pilot"
  | "pilot_expansion";

export type PilotReadinessStage = {
  key: PilotReadinessStageKey;
  label: string;
  status: PilotReadinessStatus;
  plainEnglish: string;
  requiredProof: string[];
};

export type PilotReadinessGate = {
  key: string;
  label: string;
  owner: "Nick/team" | "Kiomi" | "HQ ops" | "Data solutions" | "Coach lead";
  status: PilotReadinessStatus;
  plainEnglish: string;
  nextStep: string;
};

export type ControlledPilotReadiness = {
  canReadReadiness: boolean;
  title: string;
  verdict: "staff_dry_run_ready_not_student_pilot";
  plainEnglishVerdict: string;
  recommendedNextMove: string;
  stages: PilotReadinessStage[];
  gates: PilotReadinessGate[];
  counts: {
    stages: number;
    gates: number;
    readyNow: number;
    needsDecision: number;
    blockedBeforePilot: number;
    blockedBeforeScale: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getControlledPilotReadiness(
  actor: LocalActorContext,
  options: {
    lumaReadModel?: StagingLumaEventLoopReadModel;
  } = {},
): ControlledPilotReadiness {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadReadiness: false,
      title: "Controlled pilot readiness hidden for this role",
      verdict: "staff_dry_run_ready_not_student_pilot",
      plainEnglishVerdict:
        "Pilot readiness is an HQ review surface, not a student or chapter operating view.",
      recommendedNextMove:
        "Use the student, leader, or coach operating routes instead.",
      stages: [],
      gates: [],
      counts: emptyCounts(),
    };
  }

  const pilotRegistry = getPhase2PilotRegistry();
  const stages = getPilotStages(pilotRegistry);
  const gates = getPilotGates(pilotRegistry, options.lumaReadModel);
  const statuses = [...stages, ...gates].map((item) => item.status);
  const lumaProofGate = gates.find((gate) => gate.key === "luma_points_proof");
  const lumaProofMissing = lumaProofGate?.status === "blocked_before_pilot";

  return {
    canReadReadiness: true,
    title: getTitle(surfaceFamily),
    verdict: "staff_dry_run_ready_not_student_pilot",
    plainEnglishVerdict:
      lumaProofMissing
        ? "The app is ready for a staff dry run of the Rush Month operating loop, but it is not ready to invite real students until one real Luma check-in proves attendance-to-points readback, and until pilot scope, staging, auth, writes, proof consent/storage, event/NPS handling, and support ownership are approved."
        : "The app is ready for a staff dry run of the Rush Month operating loop, but it is not ready to invite real students until pilot scope, staging, auth, writes, proof consent/storage, event/NPS handling, and support ownership are approved.",
    recommendedNextMove:
      lumaProofMissing
        ? "Use `/admin/luma-live-pilot` to complete one real host-side Luma check-in, rerun attendance import, then confirm points, leaderboard, audit, and outbox readback before any student invitations."
        : pilotRegistry.counts.ownersRecorded > 0 ||
            pilotRegistry.counts.defaultsRecorded > 0
        ? "Use `/admin/phase-2`, `/admin/pilot-scope`, and `/admin/first-write` to confirm the recorded pilot answers, then approve staging/auth/write gates before any student invitations."
        : "Run a staff dry run with fake users, pick one pilot chapter or internal test group, then approve staging/auth/write gates before any student invitations.",
    stages,
    gates,
    counts: {
      stages: stages.length,
      gates: gates.length,
      readyNow: statuses.filter((status) => status === "ready_now").length,
      needsDecision: statuses.filter((status) => status === "needs_decision")
        .length,
      blockedBeforePilot: statuses.filter(
        (status) => status === "blocked_before_pilot",
      ).length,
      blockedBeforeScale: statuses.filter(
        (status) => status === "blocked_before_scale",
      ).length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getPilotStages(
  pilotRegistry: ReturnType<typeof getPhase2PilotRegistry>,
): PilotReadinessStage[] {
  const pilotChapter = pilotRegistry.defaults.find(
    (item) => item.key === "pilot_chapter",
  );

  return [
    {
      key: "local_stakeholder_review",
      label: "Local stakeholder review",
      status: "ready_now",
      plainEnglish:
        "The team can review the current app locally across member, leader, coach, admin, DS admin, and super admin roles.",
      requiredProof: [
        "Run `/admin` review panels.",
        "Click through `/rush-month/loop`.",
        "Confirm route smoke manifest stays at zero writes and zero sends.",
      ],
    },
    {
      key: "staff_dry_run",
      label: "Staff dry run with fake users",
      status: "ready_now",
      plainEnglish:
        "HQ can rehearse the Rush Month loop with fake seed users before staging or real student data enters the app.",
      requiredProof: [
        "Open `/admin/staff-dry-run`.",
        "Member week, leader follow-up, event/NPS, proof, coach, and DS safety steps are rehearsed.",
        "Admin confirms browser writes and external sends stay at zero.",
      ],
    },
    {
      key: "staging_review",
      label: "Staging deployment review",
      status: "blocked_before_pilot",
      plainEnglish:
        "The app still needs an approved staging environment, staging Supabase posture, and mobile/Figma smoke pass before student pilot use.",
      requiredProof: [
        "Staging URL exists.",
        "Secrets and environment flags are reviewed.",
        "Mobile and accessibility smoke checks pass.",
        "Hosted `/admin/luma-live-pilot` proof includes one checked-in attendee creating points and leaderboard readback.",
      ],
    },
    {
      key: "first_student_pilot",
      label: "First student pilot",
      status: "blocked_before_pilot",
      plainEnglish:
        pilotChapter?.status === "recorded_final"
          ? `A real pilot should wait until auth, write gates, proof consent/storage, and support ownership are approved for ${pilotChapter.value}.`
          : "A real pilot should wait until pilot scope, auth, write gates, proof consent/storage, and support ownership are approved.",
      requiredProof: [
        pilotChapter?.status === "recorded_final"
          ? `Pilot chapter or internal group is named as ${pilotChapter.value}.`
          : "Pilot chapter or internal group is named.",
        "Open `/admin/pilot-scope` and confirm the selected scope is the smallest safe pilot.",
        "Auth/onboarding is approved.",
        "First write path and rollback plan are approved.",
        "One hosted Luma attendance import produces real points and leaderboard readback.",
        "Proof consent language is approved.",
      ],
    },
    {
      key: "pilot_expansion",
      label: "Pilot expansion",
      status: "blocked_before_scale",
      plainEnglish:
        "Do not expand beyond the first pilot until real usage evidence proves support, moderation, permissions, and operations are stable.",
      requiredProof: [
        "Week-one pilot evidence is reviewed.",
        "Support capacity is proven.",
        "Permission incidents are zero or resolved.",
        "Batch expansion receives separate approval.",
      ],
    },
  ];
}

function getPilotGates(
  pilotRegistry: ReturnType<typeof getPhase2PilotRegistry>,
  lumaReadModel?: StagingLumaEventLoopReadModel,
): PilotReadinessGate[] {
  const pilotChapter = pilotRegistry.defaults.find(
    (item) => item.key === "pilot_chapter",
  );
  const eventNpsPosture = pilotRegistry.defaults.find(
    (item) => item.key === "event_nps_posture",
  );
  const coachOwner = pilotRegistry.owners.find((item) => item.key === "coach_owner");

  return [
    {
      key: "pilot_scope",
      label: "Pilot chapter or internal group",
      owner: "Nick/team",
      status:
        pilotChapter?.status === "recorded_final" ? "ready_now" : "needs_decision",
      plainEnglish:
        pilotChapter?.status === "recorded_final"
          ? `The first real pilot now names ${pilotChapter.value} as the current pilot chapter or internal group.`
          : "The first real pilot still needs a named chapter, internal cohort, or staff-only test group.",
      nextStep:
        pilotChapter?.status === "recorded_final"
          ? "Use `/admin/pilot-scope` and `/admin/phase-2` to confirm the recorded pilot chapter still matches the smallest safe pilot."
          : "Open `/admin/pilot-scope`, choose the smallest safe pilot group, and document who is allowed in.",
    },
    {
      key: "staging_environment",
      label: "Staging environment",
      owner: "Kiomi",
      status: "blocked_before_pilot",
      plainEnglish:
        "A real pilot needs a staging deployment and reviewed Supabase/environment settings.",
      nextStep:
        "Create staging hosting and Supabase projects after secrets/access ownership is approved.",
    },
    {
      key: "auth_onboarding",
      label: "Production auth and onboarding",
      owner: "Kiomi",
      status: "blocked_before_pilot",
      plainEnglish:
        "Real students cannot be invited until sign-in, profile creation, chapter join, role approval, and coach assignment boundaries are approved.",
      nextStep:
        "Approve the auth/onboarding plan and implement the minimum pilot path.",
    },
    {
      key: "pilot_writes",
      label: "Minimum approved write paths",
      owner: "Kiomi",
      status: "blocked_before_pilot",
      plainEnglish:
        "A pilot needs the smallest safe save paths for the Rush Month loop, with audit logs and rollback posture.",
      nextStep:
        "Approve which write path goes live first and keep every other write disabled.",
    },
    {
      key: "proof_consent_storage",
      label: "Proof consent and storage",
      owner: "HQ ops",
      status: "blocked_before_pilot",
      plainEnglish:
        "Bridge videos/testimonials need approved consent language, upload limits, visibility rules, and HQ review ownership.",
      nextStep:
        "Approve consent language and storage rules before enabling uploads.",
    },
    {
      key: "luma_points_proof",
      label: "Hosted Luma attendance to points proof",
      owner: "HQ ops",
      status: getLumaPointsProofStatus(lumaReadModel),
      plainEnglish: getLumaPointsProofPlainEnglish(lumaReadModel),
      nextStep: getLumaPointsProofNextStep(lumaReadModel),
    },
    {
      key: "event_nps_path",
      label: "Event attendance and NPS path",
      owner: "HQ ops",
      status:
        eventNpsPosture?.status === "recorded_final" ? "ready_now" : "needs_decision",
      plainEnglish:
        eventNpsPosture?.status === "recorded_final"
          ? `The first pilot currently records ${eventNpsPosture.value} for event attendance and NPS posture.`
          : "The first pilot must confirm the Luma event/RSVP/attendance/points loop and keep NPS support manual-first.",
      nextStep:
        eventNpsPosture?.status === "recorded_final"
          ? "Keep the recorded event/NPS posture unless the team explicitly replaces it during pilot approval."
          : "Use the approved Luma event-loop staging proof, then confirm NPS reminders and downstream automation remain off.",
    },
    {
      key: "coach_support",
      label: "Coach support ownership",
      owner: "Coach lead",
      status:
        coachOwner?.status === "recorded_owner" ? "ready_now" : "needs_decision",
      plainEnglish:
        coachOwner?.status === "recorded_owner"
          ? `The pilot now records ${coachOwner.value} as the current coach/support owner.`
          : "The pilot needs a named coach/support owner for chapter risk, questions, and intervention decisions.",
      nextStep:
        coachOwner?.status === "recorded_owner"
          ? "Confirm the recorded coach/support owner still matches the launch plan before inviting pilot users."
          : "Assign the coach/support owner before inviting pilot users.",
    },
    {
      key: "external_integrations",
      label: "External integrations",
      owner: "Data solutions",
      status: "blocked_before_scale",
      plainEnglish:
        "Only the approved Luma event loop may be rehearsed for the first pilot; HubSpot, n8n, warehouse, Power BI, SMS, email, AI, and non-approved Luma behavior stay disabled.",
      nextStep:
        "Keep non-approved external writes off until the app source-of-truth loop and Luma event path are stable.",
    },
  ];
}

function getLumaPointsProofStatus(
  lumaReadModel?: StagingLumaEventLoopReadModel,
): PilotReadinessStatus {
  if (!lumaReadModel) {
    return "blocked_before_pilot";
  }

  if (
    lumaReadModel.summary.attendanceCount > 0 &&
    lumaReadModel.summary.pointsAwarded > 0
  ) {
    return "ready_now";
  }

  return "blocked_before_pilot";
}

function getLumaPointsProofPlainEnglish(
  lumaReadModel?: StagingLumaEventLoopReadModel,
): string {
  if (!lumaReadModel) {
    return "The pilot still needs one hosted Luma proof run where a checked-in attendee creates real points and leaderboard readback.";
  }

  if (
    lumaReadModel.summary.attendanceCount > 0 &&
    lumaReadModel.summary.pointsAwarded > 0
  ) {
    return `Hosted staging now shows ${lumaReadModel.summary.attendanceCount} attendance row(s) and ${lumaReadModel.summary.pointsAwarded} point(s) through the Luma event loop readback.`;
  }

  if (lumaReadModel.summary.rsvpCount > 0 && lumaReadModel.summary.lumaLinkReady) {
    return `Hosted staging shows the Luma event and RSVP path, but only ${lumaReadModel.summary.attendanceCount} attendance row(s) and ${lumaReadModel.summary.pointsAwarded} point(s). One real checked-in attendee is still required before the pilot can claim attendance-to-points proof.`;
  }

  return "The Luma event loop has not yet proven a real attendance-to-points result on hosted staging.";
}

function getLumaPointsProofNextStep(
  lumaReadModel?: StagingLumaEventLoopReadModel,
): string {
  if (
    lumaReadModel &&
    lumaReadModel.summary.attendanceCount > 0 &&
    lumaReadModel.summary.pointsAwarded > 0
  ) {
    return "Keep `/admin/luma-live-pilot`, `/admin/audit-log`, and `/admin/integration-outbox` aligned with the recorded hosted proof before widening pilot scope.";
  }

  return "Check in one approved guest in Luma host tools, rerun `/admin/luma-live-pilot` attendance import, then confirm points, leaderboard, audit, and outbox readback while all other external systems stay off.";
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Admin controlled pilot readiness";
    case "ds_admin":
      return "DS Admin controlled pilot safety readiness";
    case "super_admin":
      return "Full controlled pilot readiness";
    case "member":
    case "leader":
    case "coach":
      return "Controlled pilot readiness hidden for this role";
  }
}

function emptyCounts(): ControlledPilotReadiness["counts"] {
  return {
    stages: 0,
    gates: 0,
    readyNow: 0,
    needsDecision: 0,
    blockedBeforePilot: 0,
    blockedBeforeScale: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
