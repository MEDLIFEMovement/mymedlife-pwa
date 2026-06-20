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
      "Hosted staging is now technically proven, but the app is not ready to invite real students until PR #120 review closes, pilot scope is named, auth and write boundaries are approved, proof consent/storage is approved, and support ownership is explicit.",
    recommendedNextMove:
      "Merge PR #120, keep staging on the merged codepath, choose one pilot chapter or internal test group with named support owners, and keep uploads plus external sends disabled until the remaining pilot gates are approved.",
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
      status: "needs_decision",
      plainEnglish:
        "Hosted staging now exists and is proven for signed-in reads plus the narrow membership-approval rehearsal, but the release-candidate review and owner handoff still need explicit sign-off.",
      requiredProof: [
        "PR #120 / MED-494 is reviewed and merged.",
        "staging.mymedlife.org sign-in and signed-in reads are re-verified on the merged path.",
        "Phone and accessibility smoke checks are recorded against the release candidate.",
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
      status: "needs_decision",
      plainEnglish:
        "The staging deployment and Supabase posture now exist; the remaining work is to merge the hosted review lane and record the human owner handoff.",
      nextStep:
        "Merge PR #120, confirm staging.mymedlife.org stays on the approved merged path, and record the staging auth, RLS, rollback, and monitoring owners.",
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
      status: "needs_decision",
      plainEnglish:
        "One narrow hosted membership-approval write path is already proven on staging, but the pilot still needs an explicit decision about which writes stay enabled.",
      nextStep:
        "Approve whether the pilot keeps only membership approval live at first or pauses all writes beyond the review posture until a later approval.",
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
