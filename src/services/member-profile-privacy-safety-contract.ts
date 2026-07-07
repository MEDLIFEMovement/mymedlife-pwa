import { getFeatureFlagDefinition } from "@/services/admin-rollout-controls-registry";
import {
  getMissingProfileActorContext,
  getMockLocalActorContext,
} from "@/services/local-actor-context";
import { getMemberProofStatusWorkspace } from "@/services/member-proof-status";
import {
  getMembershipApprovalWriteConfig,
} from "@/services/membership-approval-write-readiness";
import { getProfileWorkspace } from "@/services/profile-workspace";
import {
  getBlockedProductionSignedInProofSourceMarkers,
} from "@/services/production-signed-in-route-proof-import";
import { getProofSharingReviewBoard } from "@/services/proof-sharing-review";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getAllowedWorkspaces } from "@/services/workspace-access";

export type MemberProfilePrivacySafetyLane = {
  key:
    | "profile_identity_scope"
    | "personal_contact_and_preferences"
    | "emergency_and_traveler_details"
    | "chapter_membership_and_role_scope"
    | "story_and_public_identity"
    | "proof_identity_and_private_source"
    | "hubspot_contact_sync"
    | "production_proof_and_rollout_evidence";
  label: string;
  route: string;
  status:
    | "read_only_preview"
    | "blocked_pending_future_lane";
  requiredTables: readonly string[];
  requiredFlags: readonly string[];
  allowedActors: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
  sourceOfTruth: readonly string[];
};

export type MemberProfilePrivacySafetyContract = {
  title: string;
  summary: readonly string[];
  currentWritePath: {
    exists: false;
    reason: string;
    blockedUntil: readonly string[];
  };
  adjacentGuardrails: readonly {
    lane: string;
    route: string;
    currentPosture: string;
  }[];
  globalGuards: readonly string[];
  requiredFoundations: readonly string[];
  lanes: readonly MemberProfilePrivacySafetyLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const externalWriteFlagKeys = [
  "hubspot_write",
] as const;

const lanes = [
  {
    key: "profile_identity_scope",
    label: "Profile identity, session source, and role scope",
    route: "/profile",
    status: "read_only_preview",
    requiredTables: ["profiles", "memberships", "staff_role_assignments", "coach_chapter_assignments", "chapters"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake profile save.",
      "No fake display-name or preference update.",
      "No fake join request or role-change approval from profile review.",
      "No production truth claim from Test/Figma/sandbox/mock profile rows.",
    ],
    plainEnglishRule:
      "The profile route can show identity source, role scope, and next safe action, but it remains a read-only explanation of future profile truth rather than a live account-management tool.",
    sourceOfTruth: [
      "src/services/profile-workspace.ts",
      "src/services/local-actor-context.ts",
      "src/services/workspace-access.ts",
    ],
  },
  {
    key: "personal_contact_and_preferences",
    label: "Personal contact details and member preferences",
    route: "/profile",
    status: "blocked_pending_future_lane",
    requiredTables: ["profiles", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake phone, email, or preference persistence.",
      "No fake contact opt-in write.",
      "No fake self-service account update from preview profile rows.",
      "No fake production account evidence from sandbox identity text.",
    ],
    plainEnglishRule:
      "Personal contact and preference data need a reviewed server-side write path, privacy rules, and audit coverage before profile fields can become editable.",
    sourceOfTruth: [
      "src/services/profile-workspace.ts",
      "src/services/local-actor-context.ts",
    ],
  },
  {
    key: "emergency_and_traveler_details",
    label: "Emergency contact and traveler-detail boundary",
    route: "/app/slt-prep",
    status: "blocked_pending_future_lane",
    requiredTables: ["profiles", "traveler_profiles", "emergency_contacts", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake emergency-contact save.",
      "No fake traveler-profile update.",
      "No fake scholarship, payment, or trip-readiness inference from profile previews.",
      "No fake staff approval or provider handoff from traveler identity copy.",
    ],
    plainEnglishRule:
      "Traveler and emergency details are higher-sensitivity profile data. They must stay blocked until SLT-specific schemas, privacy rules, and audited write boundaries exist.",
    sourceOfTruth: [
      "src/services/local-actor-context.ts",
      "src/services/workspace-access.ts",
      "src/services/profile-workspace.ts",
    ],
  },
  {
    key: "chapter_membership_and_role_scope",
    label: "Chapter membership, role scope, and coach portfolio truth",
    route: "/profile",
    status: "read_only_preview",
    requiredTables: ["memberships", "staff_role_assignments", "coach_chapter_assignments", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake chapter membership change.",
      "No fake role grant or revocation.",
      "No fake coach portfolio reassignment.",
      "No self-granted workspace access from browser profile context.",
    ],
    plainEnglishRule:
      "Membership and role scope may be explained on the profile route, but role changes and chapter access remain separate membership/write lanes with explicit review and audit requirements.",
    sourceOfTruth: [
      "src/services/profile-workspace.ts",
      "src/services/membership-approval-write-readiness.ts",
      "src/services/workspace-access.ts",
    ],
  },
  {
    key: "story_and_public_identity",
    label: "Stories, public-facing identity, and member storytelling posture",
    route: "/app/stories",
    status: "blocked_pending_future_lane",
    requiredTables: ["profiles", "story_submissions", "evidence_items", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake public story publish.",
      "No fake profile-to-story identity promotion.",
      "No fake consent approval for public storytelling.",
      "No fake social/provider reuse from mock member identity.",
    ],
    plainEnglishRule:
      "Story surfaces can preview MEDLIFE storytelling posture, but member identity must not become public story truth until separate consent, publishing, and moderation lanes exist.",
    sourceOfTruth: [
      "src/services/proof-sharing-review.ts",
      "src/services/member-proof-status.ts",
      "src/services/profile-workspace.ts",
    ],
  },
  {
    key: "proof_identity_and_private_source",
    label: "Proof identity, private source media, and HQ review posture",
    route: "/proof-library",
    status: "read_only_preview",
    requiredTables: ["evidence_items", "audit_logs", "integration_events", "automation_outbox"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake proof ownership rewrite.",
      "No fake identity disclosure from private source media.",
      "No fake raw-media export or publish.",
      "No fake production proof from internal-learning status alone.",
    ],
    plainEnglishRule:
      "Proof identity remains private source material first. HQ review, internal-learning approval, and future public-candidate labels must not be confused with public identity or rollout evidence.",
    sourceOfTruth: [
      "src/services/member-proof-status.ts",
      "src/services/proof-sharing-review.ts",
      "src/services/proof-ugc-consent-storage-safety-contract.ts",
    ],
  },
  {
    key: "hubspot_contact_sync",
    label: "HubSpot/contact sync and external identity propagation",
    route: "/admin/integration-outbox",
    status: "blocked_pending_future_lane",
    requiredTables: ["profiles", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: externalWriteFlagKeys,
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake HubSpot contact sync.",
      "No fake profile/contact export.",
      "No fake lead enrichment or marketing opt-in propagation.",
      "No fake external identity proof from disabled outbox rows.",
    ],
    plainEnglishRule:
      "Profile and contact identity must stay inside the app until external contact schemas, consent rules, and production-blocked provider gates are explicitly approved.",
    sourceOfTruth: [
      "src/services/admin-rollout-controls-registry.ts",
      "src/services/profile-workspace.ts",
      "docs/hubspot-rollout-data-request-template.md",
    ],
  },
  {
    key: "production_proof_and_rollout_evidence",
    label: "Production signed-in proof and rollout evidence posture",
    route: "/profile",
    status: "blocked_pending_future_lane",
    requiredTables: ["profiles", "memberships", "staff_role_assignments", "signed_in_route_proof", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/mock profile row counts as production signed-in proof.",
      "No preview-cookie, localhost, or auth-profile-missing screenshot counts as rollout evidence.",
      "No fake member identity setup screen counts as real account proof.",
      "No local profile or story artifact counts as invite-gate truth.",
    ],
    plainEnglishRule:
      "Profile and identity rehearsal is useful for local QA only. Real production signed-in proof still requires actual production users, profile rows, role rows, and approved evidence collection.",
    sourceOfTruth: [
      "src/services/production-signed-in-route-proof-readiness.ts",
      "src/services/production-signed-in-route-proof-import.ts",
      "src/services/local-vs-production-role-proof-separation.ts",
    ],
  },
] as const satisfies readonly MemberProfilePrivacySafetyLane[];

function getExternalWriteFlagsSummary() {
  return externalWriteFlagKeys.map((key) => {
    const definition = getFeatureFlagDefinition(key);

    if (!definition) {
      throw new Error(`Missing ${key} rollout control definition.`);
    }

    if (
      definition.approvalPolicy !== "production_blocked" ||
      definition.defaultEnabledByEnvironment.local ||
      definition.defaultEnabledByEnvironment.staging ||
      definition.defaultEnabledByEnvironment.production
    ) {
      throw new Error(`${key} rollout control drifted away from the blocked default.`);
    }

    return definition;
  });
}

export function getMemberProfilePrivacySafetyContract(): MemberProfilePrivacySafetyContract {
  const data = getMockReadOnlyAppData("Testing member profile privacy safety.");
  const memberActor = getMockLocalActorContext("member.a@mymedlife.test");
  const coachActor = getMockLocalActorContext("coach@mymedlife.test");
  const travelerActor = getMockLocalActorContext("traveler.a@mymedlife.test");
  const dsAdminActor = getMockLocalActorContext("ds.admin@mymedlife.test");
  const profileWorkspace = getProfileWorkspace(memberActor, data);
  const coachProfileWorkspace = getProfileWorkspace(coachActor, data);
  const dsAdminProfileWorkspace = getProfileWorkspace(dsAdminActor, data);
  const travelerWorkspaces = getAllowedWorkspaces(travelerActor);
  const missingProfileActor = getMissingProfileActorContext(
    "new.user@medlifemovement.org",
    "Profile setup required.",
  );
  const membershipApprovalConfig = getMembershipApprovalWriteConfig();
  const proofStatusWorkspace = getMemberProofStatusWorkspace(memberActor);
  const proofSharingReviewBoard = getProofSharingReviewBoard(
    getMockLocalActorContext("admin@mymedlife.test"),
  );
  const blockedSources = getBlockedProductionSignedInProofSourceMarkers();
  const externalWriteFlags = getExternalWriteFlagsSummary();

  const validationChecks = [
    {
      key: "profile_workspace_zero_write",
      passed:
        profileWorkspace.counts.profileWritesExpected === 0 &&
        profileWorkspace.counts.membershipWritesExpected === 0 &&
        profileWorkspace.counts.roleWritesExpected === 0 &&
        profileWorkspace.counts.externalWritesExpected === 0,
      message:
        "Profile workspace remains explicitly zero-write for profile, membership, role, and external actions.",
    },
    {
      key: "coach_scope_stays_portfolio_only",
      passed:
        coachProfileWorkspace.counts.coachPortfolioChapters > 0 &&
        coachProfileWorkspace.counts.membershipWritesExpected === 0,
      message:
        "Coach profile still shows portfolio scope without implying coach assignment writes.",
    },
    {
      key: "traveler_scope_stays_local_preview",
      passed:
        travelerActor.canonicalRoles.includes("traveler") &&
        travelerWorkspaces.some((workspace) => workspace.key === "slt_prep"),
      message:
        "Traveler-specific preview scope still exists, but only as a local workspace boundary rather than a live traveler-profile write path.",
    },
    {
      key: "ds_admin_student_truth_hidden",
      passed:
        dsAdminProfileWorkspace.scopeRows.some((row) => row.value === "Integration posture only") &&
        dsAdminProfileWorkspace.scopeRows.some((row) => row.value === "Hidden"),
      message:
        "DS Admin profile still stays on integration posture instead of student/chapter truth.",
    },
    {
      key: "missing_profile_actor_stays_setup_only",
      passed:
        missingProfileActor.source.status === "auth_profile_missing" &&
        missingProfileActor.chapterRoles.length === 0 &&
        missingProfileActor.staffRoles.length === 0 &&
        !missingProfileActor.isLocalOnly,
      message:
        "Missing-profile signed-in actors remain setup-only instead of collapsing onto the first mock profile row.",
    },
    {
      key: "membership_write_not_profile_write",
      passed:
        membershipApprovalConfig.externalWritesEnabled === false &&
        membershipApprovalConfig.sendsWelcome === false &&
        membershipApprovalConfig.syncsCrm === false,
      message:
        "Existing membership approval lane still keeps external sends and CRM sync off and does not widen into general profile editing.",
    },
    {
      key: "proof_identity_stays_private_first",
      passed:
        proofStatusWorkspace.counts.publicPublishesEnabled === 0 &&
        proofStatusWorkspace.counts.externalExportsEnabled === 0 &&
        proofSharingReviewBoard.counts.publishActionsEnabled === 0 &&
        proofSharingReviewBoard.counts.externalExportsEnabled === 0,
      message:
        "Proof and story identity surfaces remain private-first, with publishing and exports disabled.",
    },
    {
      key: "hubspot_write_stays_blocked",
      passed: externalWriteFlags.length === 1 && externalWriteFlags[0]?.key === "hubspot_write",
      message:
        "HubSpot/contact sync remains governed by a production-blocked rollout control.",
    },
    {
      key: "production_proof_blocked_sources_visible",
      passed:
        blockedSources.includes("preview-cookie") &&
        blockedSources.includes("local sandbox") &&
        blockedSources.includes("figma_seed") &&
        blockedSources.includes("auth_profile_missing") &&
        blockedSources.includes("staging.mymedlife.org"),
      message:
        "Blocked production-proof source markers still explicitly reject preview, sandbox, Figma/Test, missing-profile, and staging profile evidence.",
    },
  ];

  return {
    title: "Member profile / privacy safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not save profile edits, update contact or emergency details, change memberships or roles, sync HubSpot contacts, publish identity publicly, or create production proof.",
      "Current source supports route-backed local profile review, honest role/workspace scope, setup-only missing-profile sessions, and private-first proof identity posture only.",
      "Member/profile data must stay clearly separate from production identity truth until approved Supabase Auth, profile schema, RLS, audit, and provider boundaries exist.",
    ],
    currentWritePath: {
      exists: false,
      reason:
        "No reviewed general member-profile write/update path exists yet for profile edits, personal contact data, emergency/traveler details, public identity, or HubSpot/contact propagation.",
      blockedUntil: [
        "A real profile schema and audited server-side write path exist.",
        "Emergency/traveler data has explicit privacy, retention, and role-access rules.",
        "Profile/contact sync boundaries and production proof collection are approved separately.",
      ],
    },
    adjacentGuardrails: [
      {
        lane: "Membership approval",
        route: "/chapter/members",
        currentPosture:
          "Separate reviewed membership lane only, with welcome sends and CRM sync still disabled.",
      },
      {
        lane: "Proof / UGC consent and storage",
        route: "/proof-library",
        currentPosture:
          "Private-first proof posture, with publishing and exports still disabled.",
      },
      {
        lane: "Production signed-in proof readiness",
        route: "/profile",
        currentPosture:
          "Real production profile/account proof still blocked on actual production users, rows, and evidence collection.",
      },
    ],
    globalGuards: [
      "Preview-cookie, localhost, local sandbox, Test/Figma, SOP/sample, staging, and mock profile data do not count as production signed-in proof, rollout evidence, or invite-gate truth.",
      "Traveler, emergency-contact, chapter-membership, coach-portfolio, and public-story identity fields must not imply a live write happened without matching audited server readback.",
      "Missing-profile signed-in sessions are setup-only identity states, not proof of a real launch-ready profile record.",
      "Disabled or mocked outbox/provider posture is review evidence only; it is not approval to export or sync member identity to HubSpot or any other external system.",
    ],
    requiredFoundations: [
      "A profile schema and server-only write boundary for personal contact and preference fields.",
      "Explicit privacy, retention, and role-access rules for emergency/traveler details and sensitive profile data.",
      "Separate audited write lanes for chapter membership/role changes, public identity publishing, and external contact sync.",
      "Role and RLS proof that member, leader, coach, staff, and admin actors only read the profile and chapter identity they actually own.",
      "Operator evidence that local/Test/Figma/sandbox/mock profile artifacts stay excluded from production signed-in proof and rollout evidence.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatMemberProfilePrivacySafetyContract(
  contract: MemberProfilePrivacySafetyContract = getMemberProfilePrivacySafetyContract(),
): string {
  return [
    contract.title,
    "",
    "Summary:",
    ...formatList(contract.summary),
    "",
    "Current write path:",
    `- exists: ${String(contract.currentWritePath.exists)}`,
    `- reason: ${contract.currentWritePath.reason}`,
    "- blocked until:",
    ...formatList(contract.currentWritePath.blockedUntil),
    "",
    "Adjacent guardrails:",
    ...contract.adjacentGuardrails.flatMap((guardrail) => [
      `- ${guardrail.lane} (${guardrail.route})`,
      `  - ${guardrail.currentPosture}`,
    ]),
    "",
    "Lanes:",
    ...contract.lanes.flatMap((lane) => [
      `- ${lane.label}`,
      `  - key: ${lane.key}`,
      `  - route: ${lane.route}`,
      `  - status: ${lane.status}`,
      `  - allowed actors: ${lane.allowedActors.join(", ")}`,
      `  - required tables: ${lane.requiredTables.join(", ")}`,
      `  - required flags: ${lane.requiredFlags.length > 0 ? lane.requiredFlags.join(", ") : "none"}`,
      `  - rule: ${lane.plainEnglishRule}`,
      ...lane.forbiddenSideEffects.map((effect) => `  - blocked: ${effect}`),
      `  - source of truth: ${lane.sourceOfTruth.join(", ")}`,
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
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.key}: ${check.message}`,
    ),
  ].join("\n");
}

function formatList(items: readonly string[]): string[] {
  return items.map((item) => `- ${item}`);
}
