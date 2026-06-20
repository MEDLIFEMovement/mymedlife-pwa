import type { LocalActorContext } from "@/services/local-actor-context";

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
): ControlledPilotReadiness {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
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

  const stages = getPilotStages();
  const gates = getPilotGates();
  const statuses = [...stages, ...gates].map((item) => item.status);

  return {
    canReadReadiness: true,
    title: getTitle(actor),
    verdict: "staff_dry_run_ready_not_student_pilot",
    plainEnglishVerdict:
      "The app is ready for a staff dry run and hosted staging review of the Rush Month operating loop, but it is not ready to invite real students until pilot scope, auth, writes, proof consent/storage, event/NPS handling, device/accessibility evidence, and support ownership are approved.",
    recommendedNextMove:
      "Run a staff dry run with fake users, collect the remaining staging device/accessibility evidence, pick one pilot chapter or internal test group, then approve auth and the first hosted write lane before any student invitations.",
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

function getPilotStages(): PilotReadinessStage[] {
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
        "HQ can rehearse the Rush Month loop with fake seed users while hosted staging review and real student access stay separate.",
      requiredProof: [
        "Open `/admin/staff-dry-run`.",
        "Member week, leader follow-up, event/NPS, proof, coach, and DS safety steps are rehearsed.",
        "Admin confirms browser writes and external sends stay at zero.",
      ],
    },
    {
      key: "staging_review",
      label: "Staging deployment review",
      status: "ready_now",
      plainEnglish:
        "A hosted staging review path exists, so the team can verify branch, domain, environment, and mobile/browser posture before student pilot use.",
      requiredProof: [
        "Staging URL exists.",
        "Secrets and environment flags are reviewed on the hosted build.",
        "Mobile and accessibility smoke checks pass on staging.",
      ],
    },
    {
      key: "first_student_pilot",
      label: "First student pilot",
      status: "blocked_before_pilot",
      plainEnglish:
        "A real pilot should wait until pilot scope, auth, write gates, proof consent/storage, and support ownership are approved.",
      requiredProof: [
        "Pilot chapter or internal group is named.",
        "Open `/admin/pilot-scope` and confirm the selected scope is the smallest safe pilot.",
        "Auth/onboarding is approved.",
        "First write path and rollback plan are approved.",
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

function getPilotGates(): PilotReadinessGate[] {
  return [
    {
      key: "pilot_scope",
      label: "Pilot chapter or internal group",
      owner: "Nick/team",
      status: "needs_decision",
      plainEnglish:
        "The first real pilot still needs a named chapter, internal cohort, or staff-only test group.",
      nextStep:
        "Open `/admin/pilot-scope`, choose the smallest safe pilot group, and document who is allowed in.",
    },
    {
      key: "staging_environment",
      label: "Staging environment",
      owner: "Kiomi",
      status: "ready_now",
      plainEnglish:
        "A hosted staging deployment and reviewed Supabase/environment posture now exist for narrow pilot rehearsals.",
      nextStep:
        "Keep the staging branch, domain, and environment ownership fixed, then use the current build to collect auth, device, and first-write evidence.",
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
      key: "event_nps_path",
      label: "Event attendance and NPS path",
      owner: "HQ ops",
      status: "needs_decision",
      plainEnglish:
        "The first pilot must decide whether event attendance/NPS starts manually or through Luma integration.",
      nextStep:
        "Choose manual import first or approve a narrow Luma read/import plan.",
    },
    {
      key: "coach_support",
      label: "Coach support ownership",
      owner: "Coach lead",
      status: "needs_decision",
      plainEnglish:
        "The pilot needs a named coach/support owner for chapter risk, questions, and intervention decisions.",
      nextStep: "Assign the coach/support owner before inviting pilot users.",
    },
    {
      key: "external_integrations",
      label: "External integrations",
      owner: "Data solutions",
      status: "blocked_before_scale",
      plainEnglish:
        "HubSpot, Luma writes, n8n, warehouse, Power BI, SMS, email, and AI should stay disabled for the first pilot unless separately approved.",
      nextStep:
        "Keep external writes off until the app source-of-truth loop is stable.",
    },
  ];
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin controlled pilot readiness";
    case "ds_admin":
      return "DS Admin controlled pilot safety readiness";
    case "super_admin":
      return "Full controlled pilot readiness";
    case "chapter_member":
    case "chapter_leader":
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
