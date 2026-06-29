import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getPhase2PilotRegistry,
  getPhase2PilotRegistryDurable,
  type Phase2PilotDefaultStatus,
  type Phase2PilotOwnerStatus,
} from "@/services/phase-2-pilot-registry";
import type { ReviewPacketSource } from "@/services/review-packet-registry";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

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
  pilotMode:
    | "staff_rehearsal"
    | "first_live_candidate"
    | "controlled_luma_pilot"
    | "manual_first"
    | "blocked";
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

export type PilotCloseoutOwnerSlot = {
  key: string;
  label: string;
  recordKey: string;
  status: Phase2PilotOwnerStatus;
  recommendedDefault: string;
  confirmationNeededFrom: "Nick/team" | "Kiomi" | "HQ ops" | "Coach lead" | "Data solutions";
  whyItMatters: string;
};

export type PilotCloseoutDefault = {
  key: string;
  label: string;
  recordKey: string;
  status: Phase2PilotDefaultStatus;
  recommendedDefault: string;
  whyThisIsDefault: string;
};

export type PilotScopePlanner = {
  canReadPlanner: boolean;
  title: string;
  verdict: "pilot_scope_not_approved";
  packetSource: ReviewPacketSource;
  plainEnglishSummary: string;
  recommendedScope: string;
  reviewSnapshot: {
    recordedNow: Array<{
      label: string;
      detail: string;
    }>;
    stillMissing: Array<{
      label: string;
      detail: string;
    }>;
  };
  closeoutDefaults: PilotCloseoutDefault[];
  ownerSlots: PilotCloseoutOwnerSlot[];
  approvalReplyGuide: string[];
  approvalReplyBlock: string[];
  candidates: PilotScopeCandidate[];
  minimumPilotPath: MinimumPilotPath[];
  decisions: PilotScopeDecision[];
  safetyRules: string[];
  counts: {
    candidates: number;
    recommendedCandidates: number;
    decisionsNeeded: number;
    blockedDecisions: number;
    pendingNamedOwners: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

type PilotDefaultsByKey = Partial<
  Record<PilotCloseoutDefault["key"], PilotCloseoutDefault>
>;

type PilotOwnersByKey = Partial<Record<PilotCloseoutOwnerSlot["key"], PilotCloseoutOwnerSlot>>;

export function getPilotScopePlanner(actor: LocalActorContext): PilotScopePlanner {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadPlanner: false,
      title: "Pilot scope planner hidden for this role",
      verdict: "pilot_scope_not_approved",
      packetSource: {
        mode: "env",
        reason: "Pilot scope review is hidden for this role.",
        recordCount: 0,
      },
      plainEnglishSummary:
        "Pilot planning is an HQ review surface, not a student or chapter operating view.",
      recommendedScope: "Use the student, leader, or coach operating routes instead.",
      reviewSnapshot: {
        recordedNow: [],
        stillMissing: [],
      },
      closeoutDefaults: [],
      ownerSlots: [],
      approvalReplyGuide: [],
      approvalReplyBlock: [],
      candidates: [],
      minimumPilotPath: [],
      decisions: [],
      safetyRules: [],
      counts: emptyCounts(),
    };
  }

  const candidates = getPilotCandidates();
  const registry = getPhase2PilotRegistry();
  const closeoutDefaults = registry.defaults.map((item) => ({
    key: item.key,
    label: item.label,
    recordKey: item.envKey,
    status: item.status,
    recommendedDefault: item.value,
    whyThisIsDefault: item.whyThisIsDefault,
  }));
  const ownerSlots = registry.owners.map((item) => ({
    key: item.key,
    label: item.label,
    recordKey: item.envKey,
    status: item.status,
    recommendedDefault: item.value,
    confirmationNeededFrom: item.confirmationNeededFrom,
    whyItMatters: item.whyItMatters,
  }));
  const decisions = getPilotDecisions(closeoutDefaults, ownerSlots);

  return {
    canReadPlanner: true,
    title: getTitle(surfaceFamily),
    verdict: "pilot_scope_not_approved",
    packetSource: registry.source,
    plainEnglishSummary:
      "Use this planner to choose and close the smallest safe first live MVP pilot before broader students, uploads, or integrations are activated. The default finish line is one hosted staging chapter, one campaign, one narrow write loop, one proof/review loop, and named human owners for pause and rollback.",
    recommendedScope:
      "Recommended first real pilot: UCLA MEDLIFE as the planning default, Rush Month only, 5-15 student users, one chapter leader owner, one coach owner, one HQ/admin owner, one DS owner, one named support owner, one support/pause channel, `action_started` as the first hosted write, and the approved Luma event/RSVP/attendance/points loop as the only external-family pilot path.",
    reviewSnapshot: getPilotReviewSnapshot(closeoutDefaults, ownerSlots, decisions),
    closeoutDefaults,
    ownerSlots,
    approvalReplyGuide: [
      "Reply `approved as written` if the defaults below are acceptable for the first pilot.",
      "If anything needs to change, replace only the chapter, owner slots, cohort size, event/NPS posture, or support/rollback lines.",
      "Do not open broader writes, uploads, or external sends in the same approval step.",
    ],
    approvalReplyBlock: registry.approvalReplyBlock,
    candidates,
    minimumPilotPath: getMinimumPilotPath(),
    decisions,
    safetyRules: [
      "Do not invite real students until staging, auth, first write path, proof consent, and support owner are approved.",
      "Keep HubSpot, n8n, warehouse, Power BI, SMS, email, AI, and non-approved Luma behavior disabled for the first pilot.",
      "Use the approved Luma event/RSVP/attendance/points loop only after hosted staging proof and rollback ownership are recorded.",
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
      pendingNamedOwners: ownerSlots.filter(
        (slot) => slot.status === "pending_named_owner",
      ).length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

export async function getPilotScopePlannerDurable(
  actor: LocalActorContext,
): Promise<PilotScopePlanner> {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return getPilotScopePlanner(actor);
  }

  const candidates = getPilotCandidates();
  const registry = await getPhase2PilotRegistryDurable();
  const closeoutDefaults = registry.defaults.map((item) => ({
    key: item.key,
    label: item.label,
    recordKey: item.envKey,
    status: item.status,
    recommendedDefault: item.value,
    whyThisIsDefault: item.whyThisIsDefault,
  }));
  const ownerSlots = registry.owners.map((item) => ({
    key: item.key,
    label: item.label,
    recordKey: item.envKey,
    status: item.status,
    recommendedDefault: item.value,
    confirmationNeededFrom: item.confirmationNeededFrom,
    whyItMatters: item.whyItMatters,
  }));
  const decisions = getPilotDecisions(closeoutDefaults, ownerSlots);

  return {
    canReadPlanner: true,
    title: getTitle(surfaceFamily),
    verdict: "pilot_scope_not_approved",
    packetSource: registry.source,
    plainEnglishSummary:
      "Use this planner to choose and close the smallest safe first live MVP pilot before broader students, uploads, or integrations are activated. The default finish line is one hosted staging chapter, one campaign, one narrow write loop, one proof/review loop, and named human owners for pause and rollback.",
    recommendedScope:
      "Recommended first real pilot: UCLA MEDLIFE as the planning default, Rush Month only, 5-15 student users, one chapter leader owner, one coach owner, one HQ/admin owner, one DS owner, one named support owner, one support/pause channel, `action_started` as the first hosted write, and the approved Luma event/RSVP/attendance/points loop as the only external-family pilot path.",
    reviewSnapshot: getPilotReviewSnapshot(closeoutDefaults, ownerSlots, decisions),
    closeoutDefaults,
    ownerSlots,
    approvalReplyGuide: [
      "Reply `approved as written` if the defaults below are acceptable for the first pilot.",
      "If anything needs to change, replace only the chapter, owner slots, cohort size, event/NPS posture, or support/rollback lines.",
      "Do not open broader writes, uploads, or external sends in the same approval step.",
    ],
    approvalReplyBlock: registry.approvalReplyBlock,
    candidates,
    minimumPilotPath: getMinimumPilotPath(),
    decisions,
    safetyRules: [
      "Do not invite real students until staging, auth, first write path, proof consent, and support owner are approved.",
      "Keep HubSpot, n8n, warehouse, Power BI, SMS, email, AI, and non-approved Luma behavior disabled for the first pilot.",
      "Use the approved Luma event/RSVP/attendance/points loop only after hosted staging proof and rollback ownership are recorded.",
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
      pendingNamedOwners: ownerSlots.filter(
        (slot) => slot.status === "pending_named_owner",
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
        "Luma event-loop proof via /admin/luma-live-pilot",
        "proof consent/storage posture",
        "named coach owner and support owner",
      ],
      mustStayManualOrDisabled: [
        "non-approved Luma behavior",
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
      key: "event_luma_loop",
      label: "Luma event, RSVP, attendance, and points loop",
      route: "/rush-month/events",
      localActorEmail: "leader.a@mymedlife.test",
      pilotMode: "controlled_luma_pilot",
      whatMustWork:
        "The pilot event must connect Luma event identity, member RSVP, attendance import, points award, and leaderboard impact without turning on reminders or broad automation.",
      structuredEvents: [
        "luma_event_linked",
        "luma_rsvp_recorded",
        "luma_attendance_imported",
        "event_points_awarded",
        "kpi_event_recorded",
      ],
      safetyBoundary:
        "Only the approved Luma event-loop path may run; Luma reminders, webhooks, NPS automation, n8n workflow, HubSpot sync, and warehouse export stay off.",
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

function getPilotDecisions(
  closeoutDefaults: PilotCloseoutDefault[],
  ownerSlots: PilotCloseoutOwnerSlot[],
): PilotScopeDecision[] {
  const defaultsByKey = Object.fromEntries(
    closeoutDefaults.map((item) => [item.key, item]),
  ) as PilotDefaultsByKey;
  const ownersByKey = Object.fromEntries(
    ownerSlots.map((item) => [item.key, item]),
  ) as PilotOwnersByKey;
  const pilotGroupReady =
    defaultsByKey.pilot_chapter?.status === "recorded_final" &&
    defaultsByKey.campaign_scope?.status === "recorded_final" &&
    defaultsByKey.cohort_size?.status === "recorded_final";
  const firstWriteReady =
    defaultsByKey.first_hosted_write?.status === "recorded_final";
  const eventLoopReady =
    defaultsByKey.event_nps_posture?.status === "recorded_final" &&
    defaultsByKey.integration_hold?.status === "recorded_final";
  const coachOwnerReady = ownersByKey.coach_owner?.status === "recorded_owner";

  return [
    {
      key: "pilot_group",
      label: "Choose the first pilot group",
      owner: "Nick/team",
      status: pilotGroupReady ? "staff_ready" : "needs_decision",
      recommendation:
        "Pick one chapter or one staff-plus-chapter rehearsal group, not multiple universities.",
      whyItMatters:
        "A tiny pilot lets the team watch support, permissions, proof handling, and behavior change closely.",
    },
    {
      key: "first_write",
      label: "Approve the first write path",
      owner: "Kiomi",
      status: firstWriteReady ? "staff_ready" : "blocked_before_pilot",
      recommendation:
        "Use `action_started` first; keep assignment creation, proof upload, HQ decisions, and coach decisions locked.",
      whyItMatters:
        "A narrow first write proves auth/RLS/audit behavior without opening the whole operating system at once.",
    },
    {
      key: "event_nps",
      label: "Confirm the Luma event loop and manual NPS posture",
      owner: "HQ ops",
      status: eventLoopReady ? "staff_ready" : "needs_decision",
      recommendation:
        "Use the approved Luma event/RSVP/attendance/points loop for the pilot, but keep NPS handling manual-first and do not enable reminders, webhooks, or downstream automation.",
      whyItMatters:
        "Events and points are the core product loop, while NPS and downstream automation can wait until attendance and leaderboard behavior are proven.",
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
      label: "Name the coach owner",
      owner: "Coach lead",
      status: coachOwnerReady ? "staff_ready" : "needs_decision",
      recommendation:
        "Assign one person who owns pilot questions, risk review, and intervention decisions.",
      whyItMatters:
        "A pilot without a named coach owner turns chapter risk and intervention decisions into invisible churn.",
    },
    {
      key: "external_writes",
      label: "Keep external writes disabled",
      owner: "Data solutions",
      status: eventLoopReady ? "staff_ready" : "needs_decision",
      recommendation:
        "Use the outbox for visibility only outside the approved Luma event loop; do not send HubSpot, n8n, warehouse, Power BI, SMS, email, AI, or non-approved Luma writes.",
      whyItMatters:
        "The app/Supabase operating loop and the controlled Luma event path must be stable before any other external system starts reacting to pilot behavior.",
    },
  ];
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Admin first pilot scope planner";
    case "ds_admin":
      return "DS Admin pilot safety planner";
    case "super_admin":
      return "Full first pilot scope planner";
    case "member":
    case "leader":
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
    pendingNamedOwners: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function getPilotReviewSnapshot(
  closeoutDefaults: PilotCloseoutDefault[],
  ownerSlots: PilotCloseoutOwnerSlot[],
  decisions: PilotScopeDecision[],
): PilotScopePlanner["reviewSnapshot"] {
  const recordedDefaults = closeoutDefaults.filter(
    (item) => item.status === "recorded_final",
  );
  const pendingDefaults = closeoutDefaults.filter(
    (item) => item.status !== "recorded_final",
  );
  const recordedOwners = ownerSlots.filter(
    (slot) => slot.status === "recorded_owner",
  );
  const pendingOwners = ownerSlots.filter(
    (slot) => slot.status !== "recorded_owner",
  );
  const staffReadyDecisions = decisions.filter(
    (decision) => decision.status === "staff_ready",
  );
  const needsDecision = decisions.filter(
    (decision) => decision.status === "needs_decision",
  );
  const blockedDecisions = decisions.filter(
    (decision) => decision.status === "blocked_before_pilot",
  );

  const recordedNow = [
    {
      label: "Planning default scope is defined",
      detail:
        "The current planning default stays one chapter, Rush Month only, a 5-15 user pilot, one narrow write lane, and the approved Luma event loop only.",
    },
    {
      label: "Recorded closeout defaults",
      detail:
        recordedDefaults.length > 0
          ? `${recordedDefaults.length} closeout default(s) are already recorded: ${recordedDefaults.map((item) => item.label).join(", ")}.`
          : "No Phase 2 closeout defaults have been explicitly recorded yet.",
    },
    {
      label: "Named owners already recorded",
      detail:
        recordedOwners.length > 0
          ? `${recordedOwners.length} owner slot(s) are already named: ${recordedOwners.map((slot) => slot.label).join(", ")}.`
          : "No owner slots have been explicitly named yet.",
    },
  ];

  if (staffReadyDecisions.length > 0) {
    recordedNow.push({
      label: "Staff-ready pilot decisions",
      detail: `${staffReadyDecisions.length} pilot decision(s) are already staff-ready: ${staffReadyDecisions.map((item) => item.label).join(", ")}.`,
    });
  }

  const stillMissing = [];

  if (pendingDefaults.length > 0) {
    stillMissing.push({
      label: "Closeout defaults still need confirmation",
      detail: `${pendingDefaults.length} closeout default(s) still need explicit confirmation: ${pendingDefaults.map((item) => item.label).join(", ")}.`,
    });
  }

  if (pendingOwners.length > 0) {
    stillMissing.push({
      label: "Named owners are still missing",
      detail: `${pendingOwners.length} owner slot(s) still need a named human owner: ${pendingOwners.map((slot) => slot.label).join(", ")}.`,
    });
  }

  if (needsDecision.length > 0) {
    stillMissing.push({
      label: "Pilot decisions still need approval",
      detail: `${needsDecision.length} decision(s) still need approval: ${needsDecision.map((item) => item.label).join(", ")}.`,
    });
  }

  if (blockedDecisions.length > 0) {
    stillMissing.push({
      label: "Pilot decisions are still blocked by gating work",
      detail: `${blockedDecisions.length} decision(s) remain blocked before pilot use: ${blockedDecisions.map((item) => item.label).join(", ")}.`,
    });
  }

  return {
    recordedNow,
    stillMissing,
  };
}
