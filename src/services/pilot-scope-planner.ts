import type { LocalActorContext } from "@/services/local-actor-context";

export type PilotScopeCandidateStatus =
  | "ready_for_staff_only"
  | "recommended_after_gates"
  | "later"
  | "not_recommended";

export type PilotScopeDecisionStatus =
  | "needs_decision"
  | "blocked_before_pilot"
  | "staff_ready";

export type PilotScopeCandidate = {
  key: string;
  label: string;
  status: PilotScopeCandidateStatus;
  recommendedOrder: number;
  plainEnglish: string;
  expectedPeople: string;
  includedRoles: string[];
  routeEvidence: string[];
  requiredApprovals: string[];
  mustStayManualOrDisabled: string[];
};

export type MinimumPilotPath = {
  key: string;
  label: string;
  route: string;
  localActorEmail: string;
  pilotMode: "staff_rehearsal" | "first_live_candidate" | "manual_first" | "blocked";
  whatMustWork: string;
  structuredEvents: string[];
  safetyBoundary: string;
};

export type PilotScopeDecision = {
  key: string;
  label: string;
  owner: "Nick/team" | "Kiomi" | "HQ ops" | "Coach lead" | "Data solutions";
  status: PilotScopeDecisionStatus;
  recommendation: string;
  whyItMatters: string;
};

export type PilotScopePlanner = {
  canReadPlanner: boolean;
  title: string;
  verdict: "pilot_scope_not_approved";
  plainEnglishSummary: string;
  recommendedScope: string;
  candidates: PilotScopeCandidate[];
  minimumPilotPath: MinimumPilotPath[];
  decisions: PilotScopeDecision[];
  safetyRules: string[];
  counts: {
    candidates: number;
    recommendedCandidates: number;
    decisionsNeeded: number;
    blockedDecisions: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getPilotScopePlanner(actor: LocalActorContext): PilotScopePlanner {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadPlanner: false,
      title: "Pilot scope planner hidden for this role",
      verdict: "pilot_scope_not_approved",
      plainEnglishSummary:
        "Pilot planning is an HQ review surface, not a student or chapter operating view.",
      recommendedScope: "Use the student, leader, or coach operating routes instead.",
      candidates: [],
      minimumPilotPath: [],
      decisions: [],
      safetyRules: [],
      counts: emptyCounts(),
    };
  }

  const candidates = getPilotCandidates();
  const decisions = getPilotDecisions();

  return {
    canReadPlanner: true,
    title: getTitle(actor),
    verdict: "pilot_scope_not_approved",
    plainEnglishSummary:
      "Use this planner to choose the smallest safe first pilot before real students, production auth, browser writes, uploads, or integrations are activated.",
    recommendedScope:
      "Recommended first real pilot: one chapter or one internal staff-plus-chapter rehearsal group, Rush Month only, with action-start as the first possible write and every external integration kept manual or disabled.",
    candidates,
    minimumPilotPath: getMinimumPilotPath(),
    decisions,
    safetyRules: [
      "Do not invite real students until staging, auth, first write path, proof consent, and support owner are approved.",
      "Keep Luma, HubSpot, n8n, warehouse, Power BI, SMS, email, and AI writes disabled for the first pilot unless separately approved.",
      "Use manual event attendance/NPS handling first unless the team approves a narrow Luma read/import path.",
      "Treat bridge videos/testimonials as HQ-owned proof; chapter leaders can help collect them but do not approve network-wide sharing.",
      "Use fake or staff-only data during dry runs. Do not mix real student data into local review.",
    ],
    counts: {
      candidates: candidates.length,
      recommendedCandidates: candidates.filter(
        (candidate) => candidate.status === "recommended_after_gates",
      ).length,
      decisionsNeeded: decisions.filter(
        (decision) => decision.status === "needs_decision",
      ).length,
      blockedDecisions: decisions.filter(
        (decision) => decision.status === "blocked_before_pilot",
      ).length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getPilotCandidates(): PilotScopeCandidate[] {
  return [
    {
      key: "staff_only_dry_run",
      label: "Staff-only dry run",
      status: "ready_for_staff_only",
      recommendedOrder: 1,
      plainEnglish:
        "Use fake local actors to rehearse the whole loop with HQ staff before any real student data enters the system.",
      expectedPeople: "3-6 staff reviewers",
      includedRoles: ["Admin", "DS Admin", "Coach", "fake member", "fake leader"],
      routeEvidence: ["/admin/staff-dry-run", "/rush-month/loop", "/admin"],
      requiredApprovals: ["None for local rehearsal"],
      mustStayManualOrDisabled: [
        "production auth",
        "browser writes",
        "uploads",
        "student invitations",
        "external sends",
      ],
    },
    {
      key: "one_chapter_rush_month",
      label: "One chapter Rush Month pilot",
      status: "recommended_after_gates",
      recommendedOrder: 2,
      plainEnglish:
        "The safest first real pilot is one carefully chosen chapter running Rush Month with staff watching the loop closely.",
      expectedPeople: "1 chapter, 5-15 student users, 1 coach, 1 HQ owner",
      includedRoles: [
        "General Member",
        "Chapter Leader",
        "Coach",
        "Admin",
        "DS Admin",
      ],
      routeEvidence: [
        "/login",
        "/chapter",
        "/rush-month/dashboard",
        "/rush-month/actions",
        "/proof-library/upload",
        "/coach",
      ],
      requiredApprovals: [
        "staging environment",
        "auth/onboarding",
        "first write path via /admin/first-write",
        "proof consent/storage posture",
        "named coach/support owner",
      ],
      mustStayManualOrDisabled: [
        "Luma writes",
        "HubSpot sync",
        "n8n automation",
        "warehouse exports",
        "public proof sharing",
      ],
    },
    {
      key: "two_chapter_comparison",
      label: "Two-chapter comparison pilot",
      status: "later",
      recommendedOrder: 3,
      plainEnglish:
        "A two-chapter test is useful after the first chapter proves support, permissions, and proof handling are stable.",
      expectedPeople: "2 chapters, 20-40 student users, 2 coaches or one coach owner",
      includedRoles: ["two chapter teams", "coach", "admin", "DS Admin"],
      routeEvidence: ["/campaigns", "/coach", "/admin"],
      requiredApprovals: [
        "week-one evidence from first pilot",
        "support capacity",
        "permission incident review",
      ],
      mustStayManualOrDisabled: [
        "batch expansion",
        "broad leaderboards",
        "external automation",
      ],
    },
    {
      key: "broad_launch",
      label: "Broad student launch",
      status: "not_recommended",
      recommendedOrder: 4,
      plainEnglish:
        "A broad launch before the first tiny pilot would hide bugs inside too many users and make support harder.",
      expectedPeople: "Many chapters and real students",
      includedRoles: ["all student and staff roles"],
      routeEvidence: ["/admin"],
      requiredApprovals: [
        "successful first pilot",
        "launch-day support plan",
        "moderation plan",
        "production monitoring",
        "batch expansion approval",
      ],
      mustStayManualOrDisabled: [
        "all broad launch invitations",
        "scale automation",
        "public proof sharing",
      ],
    },
  ];
}

function getMinimumPilotPath(): MinimumPilotPath[] {
  return [
    {
      key: "auth_entry",
      label: "Pilot user signs in and lands in chapter context",
      route: "/login",
      localActorEmail: "member.a@mymedlife.test",
      pilotMode: "blocked",
      whatMustWork:
        "The pilot user must be tied to one chapter and one approved role before seeing student work.",
      structuredEvents: ["user_signed_in", "chapter_join_requested", "role_approved"],
      safetyBoundary:
        "Do not invite real users until auth and membership approval are reviewed.",
    },
    {
      key: "member_next_action",
      label: "Member sees what to do next",
      route: "/rush-month/dashboard",
      localActorEmail: "member.a@mymedlife.test",
      pilotMode: "staff_rehearsal",
      whatMustWork:
        "A student should immediately understand the current campaign, next action, recognition, and chapter impact.",
      structuredEvents: ["campaign_opened", "action_started"],
      safetyBoundary: "Points and leaderboard rows stay controlled by the app ledger.",
    },
    {
      key: "action_start",
      label: "Member starts an assigned action",
      route: "/rush-month/actions/[assignmentId]",
      localActorEmail: "member.a@mymedlife.test",
      pilotMode: "first_live_candidate",
      whatMustWork:
        "This is the smallest first write candidate because it updates one assignment and records event/audit history.",
      structuredEvents: ["action_started", "audit_log_recorded"],
      safetyBoundary:
        "Only enable after auth identity, RLS, rollback, and result states are approved.",
    },
    {
      key: "leader_follow_up",
      label: "Leader tracks completion and follow-up",
      route: "/rush-month/actions",
      localActorEmail: "leader.a@mymedlife.test",
      pilotMode: "manual_first",
      whatMustWork:
        "A leader should know who owns each action and which student needs follow-up.",
      structuredEvents: ["action_assigned", "automation_outbox_recorded"],
      safetyBoundary: "Assignment creation and reminders can stay disabled in the first pilot.",
    },
    {
      key: "event_nps_manual",
      label: "Event attendance and NPS run manually first",
      route: "/rush-month/events",
      localActorEmail: "leader.a@mymedlife.test",
      pilotMode: "manual_first",
      whatMustWork:
        "Event owners, student action, NPS prompt, and proof prompt should be clear even if Luma import is manual.",
      structuredEvents: [
        "luma_event_linked",
        "luma_attendance_import_mocked",
        "kpi_event_recorded",
      ],
      safetyBoundary:
        "No Luma writes, NPS reminders, n8n workflow, or warehouse export should run in the first pilot.",
    },
    {
      key: "proof_intake",
      label: "Proof/testimonial intake stays consent-first",
      route: "/proof-library/upload",
      localActorEmail: "member.a@mymedlife.test",
      pilotMode: "blocked",
      whatMustWork:
        "Students need plain-English consent and context before bridge videos or testimonials are accepted.",
      structuredEvents: ["evidence_submitted", "proof_consent_recorded"],
      safetyBoundary:
        "Do not enable uploads until storage, consent, moderation, and HQ review rules are approved.",
    },
    {
      key: "coach_readout",
      label: "Coach reads risk and decides support posture",
      route: "/coach",
      localActorEmail: "coach@mymedlife.test",
      pilotMode: "manual_first",
      whatMustWork:
        "The coach should see chapter health, overdue work, proof posture, KPI movement, and advance/hold/intervene state.",
      structuredEvents: ["coach_decision_logged", "audit_log_recorded"],
      safetyBoundary: "Coach decisions and escalation packets stay manual until approved.",
    },
  ];
}

function getPilotDecisions(): PilotScopeDecision[] {
  return [
    {
      key: "pilot_group",
      label: "Choose the first pilot group",
      owner: "Nick/team",
      status: "needs_decision",
      recommendation:
        "Pick one chapter or one staff-plus-chapter rehearsal group, not multiple universities.",
      whyItMatters:
        "A tiny pilot lets the team watch support, permissions, proof handling, and behavior change closely.",
    },
    {
      key: "first_write",
      label: "Approve the first write path",
      owner: "Kiomi",
      status: "blocked_before_pilot",
      recommendation:
        "Use `action_started` first; keep assignment creation, proof upload, HQ decisions, and coach decisions locked.",
      whyItMatters:
        "A narrow first write proves auth/RLS/audit behavior without opening the whole operating system at once.",
    },
    {
      key: "event_nps",
      label: "Choose manual versus Luma/NPS import",
      owner: "HQ ops",
      status: "needs_decision",
      recommendation:
        "Start with manual event/NPS handling and structured event logs before any Luma automation.",
      whyItMatters:
        "Rush Month can prove the student behavior loop before external event automation adds failure modes.",
    },
    {
      key: "proof_rules",
      label: "Approve proof consent and sharing rules",
      owner: "HQ ops",
      status: "blocked_before_pilot",
      recommendation:
        "Keep uploads disabled until consent, storage, moderation, and HQ sharing posture are final.",
      whyItMatters:
        "Proof/testimonials are belief-building assets, so consent and sharing boundaries need to be unambiguous.",
    },
    {
      key: "coach_owner",
      label: "Name the coach/support owner",
      owner: "Coach lead",
      status: "needs_decision",
      recommendation:
        "Assign one person who owns pilot questions, risk review, and intervention decisions.",
      whyItMatters:
        "A pilot without named support ownership turns product bugs and chapter confusion into invisible churn.",
    },
    {
      key: "external_writes",
      label: "Keep external writes disabled",
      owner: "Data solutions",
      status: "staff_ready",
      recommendation:
        "Use the outbox for visibility only; do not send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes.",
      whyItMatters:
        "The app/Supabase operating loop must be stable before external systems start reacting to it.",
    },
  ];
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin first pilot scope planner";
    case "ds_admin":
      return "DS Admin pilot safety planner";
    case "super_admin":
      return "Full first pilot scope planner";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Pilot scope planner hidden for this role";
  }
}

function emptyCounts(): PilotScopePlanner["counts"] {
  return {
    candidates: 0,
    recommendedCandidates: 0,
    decisionsNeeded: 0,
    blockedDecisions: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
