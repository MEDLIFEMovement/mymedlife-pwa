import { getAdminAccessWriteConfig } from "@/services/admin-management-write";
import { getAdminMasterDataWorkspace } from "@/services/admin-master-data-workspace";
import { getAdminChapterWriteConfig } from "@/services/admin-chapter-management-write";
import { getAppRouteRegistry } from "@/services/app-route-registry";
import { getAuthOnboardingWorkspace } from "@/services/auth-onboarding-workspace";
import { getCoachDecisionWriteConfig } from "@/services/coach-decision-write";
import { getCoachPortfolioReadiness } from "@/services/coach-portfolio-readiness";
import { getCoachSupportNotesWorkspace } from "@/services/coach-support-notes";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getProfileWorkspace } from "@/services/profile-workspace";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";

type EnvSource = Record<string, string | undefined>;

export type CoachStaffPortfolioAssignmentLane = {
  key:
    | "coach_portfolio_preview"
    | "staff_chapter_portfolio"
    | "coach_support_notes"
    | "coach_decision_local_write"
    | "admin_user_portfolio_assignment"
    | "admin_chapter_coach_assignment"
    | "risk_and_recommendation_persistence"
    | "provider_outbox_and_notifications"
    | "production_rollout_evidence";
  label: string;
  route: string;
  status:
    | "read_only_preview"
    | "implemented_local_only"
    | "blocked_pending_future_lane";
  roleScope: readonly string[];
  requiredTables: readonly string[];
  requiredFlags: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
  sourceOfTruth: readonly string[];
};

export type CoachStaffPortfolioAssignmentSafetyContract = {
  title: string;
  summary: readonly string[];
  currentLocalWritePaths: readonly {
    route: string;
    localFunction: string;
    requiredFlags: readonly string[];
    allowedActors: readonly string[];
    blockedInHostedByCurrentGuards: boolean;
    localOnlyReason: string;
  }[];
  globalGuards: readonly string[];
  requiredFoundations: readonly string[];
  lanes: readonly CoachStaffPortfolioAssignmentLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const coachDecisionFlags = [
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=true",
] as const;

const adminAccessFlags = [
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE=true",
] as const;

const lanes = [
  {
    key: "coach_portfolio_preview",
    label: "Coach portfolio readiness preview",
    route: "/coach",
    status: "read_only_preview",
    roleScope: ["coach", "admin", "super_admin"],
    requiredTables: ["chapters", "coach_assignments", "campaigns", "risk_flags", "evidence_items"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No coach reassignment write.",
      "No chapter ownership change.",
      "No risk-score persistence.",
      "No production rollout evidence claim from portfolio mock rows.",
    ],
    plainEnglishRule:
      "The coach portfolio surface can compare chapter posture, but it must stay read-only until a dedicated assignment boundary and hosted-disable posture are fully approved.",
    sourceOfTruth: [
      "src/services/coach-portfolio-readiness.ts",
      "src/services/staff-command-center.ts",
    ],
  },
  {
    key: "staff_chapter_portfolio",
    label: "Staff command-center chapter portfolio",
    route: "/staff",
    status: "read_only_preview",
    roleScope: ["coach", "admin", "super_admin"],
    requiredTables: ["chapters", "coach_assignments", "campaigns", "risk_flags", "points_events"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No support action write from the chapter list.",
      "No coach assignment save from drawer state.",
      "No fake best-practice save.",
      "No provider or outbox send from visible portfolio recommendations.",
    ],
    plainEnglishRule:
      "The staff portfolio can rank at-risk chapters and show next-step copy, but recommendation text must not behave like a live intervention or reassignment tool.",
    sourceOfTruth: [
      "src/services/staff-command-center.ts",
      "src/services/staff-launch-lane.ts",
    ],
  },
  {
    key: "coach_support_notes",
    label: "Coach support notes and intervention checklist",
    route: "/coach",
    status: "read_only_preview",
    roleScope: ["coach", "admin", "super_admin"],
    requiredTables: ["risk_flags", "evidence_items", "assignments", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No coach note save.",
      "No escalation packet send.",
      "No chapter hold/advance/intervene write from note review alone.",
      "No fake risk follow-up counted as chapter support proof.",
    ],
    plainEnglishRule:
      "Coaches and HQ can rehearse intervention logic, but support notes remain planning artifacts until the audited write boundary and rollback posture are approved.",
    sourceOfTruth: [
      "src/services/coach-support-notes.ts",
      "src/services/coach-decision-write.ts",
    ],
  },
  {
    key: "coach_decision_local_write",
    label: "Local coach decision packet",
    route: "/admin/coach-write",
    status: "implemented_local_only",
    roleScope: ["coach", "admin", "super_admin"],
    requiredTables: ["phase_reviews", "events", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: coachDecisionFlags,
    forbiddenSideEffects: [
      "No escalation packet send.",
      "No provider or notification send.",
      "No hosted staging or hosted production write approval.",
      "No fake production rollout evidence from localhost coach decisions.",
    ],
    plainEnglishRule:
      "The coach decision packet can write only in localhost Supabase with explicit flags. It is not a green light for hosted or production support actions.",
    sourceOfTruth: [
      "src/services/coach-decision-write.ts",
      "src/services/coach-decision-verification-packet.ts",
    ],
  },
  {
    key: "admin_user_portfolio_assignment",
    label: "Admin user access and coach portfolio assignment",
    route: "/admin/users",
    status: "implemented_local_only",
    roleScope: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["profiles", "memberships", "staff_role_assignments", "coach_assignments", "audit_logs"],
    requiredFlags: adminAccessFlags,
    forbiddenSideEffects: [
      "No hosted portfolio reassignment without a dedicated hosted gate.",
      "No browser-visible staff or coach ownership change outside audited RPC readback.",
      "No external automation send.",
      "No production owner-packet truth claim from local admin review rows.",
    ],
    plainEnglishRule:
      "Admin access can change coach portfolio scope locally through an audited RPC, but the visible portfolio surfaces must still behave as read-only previews.",
    sourceOfTruth: [
      "src/services/admin-management-write.ts",
      "src/app/admin/users/actions.ts",
    ],
  },
  {
    key: "admin_chapter_coach_assignment",
    label: "Admin chapter coach assignment and leader ownership",
    route: "/admin/chapters",
    status: "implemented_local_only",
    roleScope: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["chapters", "coach_assignments", "memberships", "audit_logs"],
    requiredFlags: adminAccessFlags,
    forbiddenSideEffects: [
      "No hosted coach assignment save without a dedicated hosted gate.",
      "No fake chapter ownership transfer from mock rows.",
      "No provider or outbox send.",
      "No rollout evidence claim from local chapter management rehearsal.",
    ],
    plainEnglishRule:
      "Admin chapter management can change coach assignments locally through an audited RPC, but it must not be mistaken for a hosted rollout-ready ownership workflow.",
    sourceOfTruth: [
      "src/services/admin-chapter-management-write.ts",
      "src/app/admin/chapters/actions.ts",
    ],
  },
  {
    key: "risk_and_recommendation_persistence",
    label: "Risk scoring and best-practice recommendation persistence",
    route: "/staff",
    status: "blocked_pending_future_lane",
    roleScope: ["coach", "admin", "super_admin"],
    requiredTables: ["risk_flags", "support_notes", "best_practice_selections", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No risk score save from visible staff cards.",
      "No recommendation acceptance save.",
      "No silent intervention state mutation.",
      "No fake chapter-improvement evidence from preview-only advice.",
    ],
    plainEnglishRule:
      "Risk labels and recommendations are useful review signals, but no durable risk or best-practice write model is approved yet.",
    sourceOfTruth: [
      "src/services/staff-command-center.ts",
      "src/services/coach-support-notes.ts",
    ],
  },
  {
    key: "provider_outbox_and_notifications",
    label: "Provider, outbox, and follow-up delivery",
    route: "/coach",
    status: "blocked_pending_future_lane",
    roleScope: ["coach", "admin", "super_admin"],
    requiredTables: ["automation_outbox", "integration_events", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No reminder email or SMS.",
      "No n8n send.",
      "No HubSpot task or note sync.",
      "No fake intervention delivery or owner handoff proof.",
    ],
    plainEnglishRule:
      "Support and portfolio workflows can describe future follow-up, but no send path or external system handoff is approved from this lane.",
    sourceOfTruth: [
      "src/services/coach-support-notes.ts",
      "src/services/notifications-communications-send-safety.ts",
    ],
  },
  {
    key: "production_rollout_evidence",
    label: "Production rollout and owner-data evidence posture",
    route: "/admin/users",
    status: "blocked_pending_future_lane",
    roleScope: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["profiles", "memberships", "staff_role_assignments", "coach_assignments", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/mock coach row counts as production rollout evidence.",
      "No localhost admin write screenshot counts as owner CSV apply proof.",
      "No coach portfolio preview counts as production support ownership proof.",
    ],
    plainEnglishRule:
      "Local staff and coach safety review remains useful, but it cannot substitute for real returned owner CSVs, approved coach assignments, or production proof.",
    sourceOfTruth: [
      "src/services/production-rollout-data-request.ts",
      "src/services/production-live-data-readiness.ts",
    ],
  },
] as const satisfies readonly CoachStaffPortfolioAssignmentLane[];

export function getCoachStaffPortfolioAssignmentSafetyContract(
  env: EnvSource = process.env,
): CoachStaffPortfolioAssignmentSafetyContract {
  const data = getMockReadOnlyAppData("Coach and staff portfolio safety contract.");
  const coachActor = getMockLocalActorContext("coach@mymedlife.test");
  const adminActor = getMockLocalActorContext("admin@mymedlife.test");
  const dsAdminActor = getMockLocalActorContext("ds.admin@mymedlife.test");

  const portfolio = getCoachPortfolioReadiness(coachActor, data);
  const supportNotes = getCoachSupportNotesWorkspace(coachActor, data);
  const adminInventory = getAdminMasterDataWorkspace(adminActor, data);
  const onboarding = getAuthOnboardingWorkspace(dsAdminActor);
  const coachProfile = getProfileWorkspace(coachActor, data);
  const registry = new Set(getAppRouteRegistry().map((route) => route.href));

  const coachDecisionConfig = getCoachDecisionWriteConfig({
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
    ...env,
  });
  const adminAccessConfig = getAdminAccessWriteConfig({
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE: "true",
    ...env,
  });
  const adminChapterConfig = getAdminChapterWriteConfig({
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE: "true",
    ...env,
  });

  const hostedStagingCoachDecision = getSupabaseAuthConfig({
    MYMEDLIFE_AUTH_MODE: "staging_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
    NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
    ...env,
  });
  const hostedProductionCoachDecision = getSupabaseAuthConfig({
    MYMEDLIFE_AUTH_MODE: "production_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
    NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
    ...env,
  });
  const hostedStagingAdminAccess = getSupabaseAuthConfig({
    MYMEDLIFE_AUTH_MODE: "staging_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
    NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE: "true",
    ...env,
  });
  const hostedProductionAdminAccess = getSupabaseAuthConfig({
    MYMEDLIFE_AUTH_MODE: "production_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
    NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE: "true",
    ...env,
  });

  const validationChecks = [
    {
      key: "coach_portfolio_stays_read_only",
      passed:
        portfolio.canReadPortfolio &&
        portfolio.counts.coachChangesEnabled === 0 &&
        portfolio.rows.every((row) => row.coachChangePosture === "read_only"),
      message:
        "Coach portfolio rows remain read-only and do not expose direct coach-change controls.",
    },
    {
      key: "coach_support_notes_stay_send_free",
      passed:
        supportNotes.browserWritesEnabled === 0 &&
        supportNotes.externalWritesEnabled === 0 &&
        supportNotes.interventionChecklist.counts.browserWritesEnabled === 0 &&
        supportNotes.interventionChecklist.counts.externalWritesEnabled === 0,
      message:
        "Coach support notes and intervention checklists still rehearse support posture without writes or sends.",
    },
    {
      key: "coach_profile_keeps_scope_read_only",
      passed:
        coachProfile.counts.membershipWritesExpected === 0 &&
        coachProfile.counts.roleWritesExpected === 0 &&
        coachProfile.counts.externalWritesExpected === 0,
      message:
        "Coach profile scope stays read-only and does not expose coach-assignment changes.",
    },
    {
      key: "admin_inventory_explicitly_blocks_coach_assignment_changes",
      passed:
        adminInventory.blockedWrites.includes("coach assignment changes") &&
        adminInventory.counts.mutationControlsEnabled === 0,
      message:
        "The admin inventory still names coach assignment changes as blocked review-only work.",
    },
    {
      key: "onboarding_preflight_keeps_coach_assignment_watch_only",
      passed:
        onboarding.launchPreflight?.items.some(
          (item) =>
            item.key === "coach_assignment" &&
            item.status === "watch" &&
            item.browserWritesExpected === 0 &&
            item.externalWritesExpected === 0,
        ) ?? false,
      message:
        "Auth/onboarding preflight still treats coach assignment as a watch-only readiness lane rather than live onboarding.",
    },
    {
      key: "coach_decision_write_is_local_only",
      passed:
        coachDecisionConfig.enabled &&
        coachDecisionConfig.isLocalOnly &&
        coachDecisionConfig.externalWritesEnabled === false &&
        coachDecisionConfig.escalationPacketsEnabled === false,
      message:
        "Coach decision writes are enabled only for localhost Supabase and keep external sends and escalation packets off.",
    },
    {
      key: "admin_assignment_writes_are_local_only_by_config",
      passed:
        adminAccessConfig.enabled &&
        adminAccessConfig.isLocalOnly &&
        adminAccessConfig.externalWritesEnabled === false &&
        adminChapterConfig.enabled &&
        adminChapterConfig.isLocalOnly &&
        adminChapterConfig.externalWritesEnabled === false,
      message:
        "Admin user/chapter coach-assignment writes are config-gated as local-only and keep external sends off.",
    },
    {
      key: "hosted_staging_blocks_coach_decision_flag",
      passed:
        !hostedStagingCoachDecision.enabled &&
        hostedStagingCoachDecision.reason.includes("MYMEDLIFE_ENABLE_COACH_DECISION_WRITE"),
      message:
        "Hosted staging auth refuses the coach-decision write flag, keeping coach decisions out of hosted review.",
    },
    {
      key: "hosted_production_blocks_coach_decision_flag",
      passed:
        !hostedProductionCoachDecision.enabled &&
        hostedProductionCoachDecision.reason.includes("MYMEDLIFE_ENABLE_COACH_DECISION_WRITE"),
      message:
        "Hosted production auth refuses the coach-decision write flag, keeping coach decisions out of production.",
    },
    {
      key: "hosted_staging_blocks_admin_access_flag",
      passed:
        !hostedStagingAdminAccess.enabled &&
        hostedStagingAdminAccess.reason.includes("MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE"),
      message:
        "Hosted staging should refuse the admin-access write flag before any live coach assignment or ownership change exists.",
    },
    {
      key: "hosted_production_blocks_admin_access_flag",
      passed:
        !hostedProductionAdminAccess.enabled &&
        hostedProductionAdminAccess.reason.includes("MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE"),
      message:
        "Hosted production should refuse the admin-access write flag before any live coach assignment or ownership change exists.",
    },
    {
      key: "routes_stay_present",
      passed: ["/coach", "/staff", "/admin/coach-write", "/admin/users", "/admin/chapters"].every(
        (route) => registry.has(route),
      ),
      message:
        "All coach/staff portfolio and packet routes referenced by this contract still exist in the route registry.",
    },
  ];

  return {
    title: "Coach / staff portfolio assignment-scope safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not create production users, assign coaches in production, move chapter ownership, persist interventions, or send provider traffic.",
      "Current source supports read-only coach and staff portfolio review plus narrow localhost-only audited write packets for coach decisions and admin access changes.",
      "Visible coach recommendations, support notes, risk posture, and portfolio ownership hints must stay clearly separate from real production owner data and rollout proof.",
    ],
    currentLocalWritePaths: [
      {
        route: "/admin/coach-write",
        localFunction: "app.log_coach_decision",
        requiredFlags: coachDecisionFlags,
        allowedActors: ["coach", "admin", "super_admin"],
        blockedInHostedByCurrentGuards:
          !hostedStagingCoachDecision.enabled && !hostedProductionCoachDecision.enabled,
        localOnlyReason: coachDecisionConfig.reason,
      },
      {
        route: "/admin/users",
        localFunction: "app.admin_change_user_access",
        requiredFlags: adminAccessFlags,
        allowedActors: ["admin", "ds_admin", "super_admin"],
        blockedInHostedByCurrentGuards:
          !hostedStagingAdminAccess.enabled && !hostedProductionAdminAccess.enabled,
        localOnlyReason: adminAccessConfig.reason,
      },
      {
        route: "/admin/chapters",
        localFunction: "app.admin_manage_chapter",
        requiredFlags: adminAccessFlags,
        allowedActors: ["admin", "ds_admin", "super_admin"],
        blockedInHostedByCurrentGuards:
          !hostedStagingAdminAccess.enabled && !hostedProductionAdminAccess.enabled,
        localOnlyReason: adminChapterConfig.reason,
      },
    ],
    globalGuards: [
      "Test/Figma/sandbox/mock coach rows, localhost packets, and preview readouts do not count as production rollout evidence or owner-packet proof.",
      "Coach portfolio preview, support notes, and staff chapter rankings must not silently create intervention records, reassign coaches, or change chapter ownership.",
      "Risk labels and best-practice suggestions are advisory only until a later audited persistence model and rollback plan exist.",
      "Provider sends, outbox writes, reminder delivery, and ownership-transfer side effects remain blocked from this lane.",
    ],
    requiredFoundations: [
      "A dedicated hosted-disable guard for admin access writes before any coach assignment or chapter-ownership workflow is considered live outside localhost.",
      "A real coach-assignment schema review that separates chapter ownership truth, staff role truth, and support-only viewing rights.",
      "An audited persistence model for support notes, risk response, recommendation saves, and escalation history.",
      "Explicit operator evidence showing returned owner CSV truth, active coach assignments, and production role mappings before any rollout proof can cite coach ownership.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatCoachStaffPortfolioAssignmentSafetyContract(
  contract: CoachStaffPortfolioAssignmentSafetyContract = getCoachStaffPortfolioAssignmentSafetyContract(),
): string {
  return [
    contract.title,
    "",
    "Summary:",
    ...formatList(contract.summary),
    "",
    "Current local write paths:",
    ...contract.currentLocalWritePaths.flatMap((path) => [
      `- ${path.route}`,
      `  - local function: ${path.localFunction}`,
      `  - hosted-blocked now: ${path.blockedInHostedByCurrentGuards ? "yes" : "no"}`,
      `  - local-only reason: ${path.localOnlyReason}`,
      "  - required flags:",
      ...formatNestedList(path.requiredFlags),
    ]),
    "",
    "Lanes:",
    ...contract.lanes.flatMap((lane) => [
      `- ${lane.label}`,
      `  - route: ${lane.route}`,
      `  - status: ${lane.status}`,
      `  - role scope: ${lane.roleScope.join(", ")}`,
      "  - forbidden side effects:",
      ...formatNestedList(lane.forbiddenSideEffects),
      `  - rule: ${lane.plainEnglishRule}`,
    ]),
    "",
    "Global guards:",
    ...formatList(contract.globalGuards),
    "",
    "Required foundations:",
    ...formatList(contract.requiredFoundations),
    "",
    "Validation:",
    ...contract.validation.checks.map(
      (check) => `- [${check.passed ? "x" : " "}] ${check.key}: ${check.message}`,
    ),
  ].join("\n");
}

function formatList(items: readonly string[]): string[] {
  return items.map((item) => `- ${item}`);
}

function formatNestedList(items: readonly string[]): string[] {
  return items.map((item) => `  - ${item}`);
}
