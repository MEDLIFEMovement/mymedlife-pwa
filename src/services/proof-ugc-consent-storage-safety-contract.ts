import { assignments } from "@/data/mock-rush-month";
import { getActionProofHandoffWorkspace } from "@/services/action-proof-handoff";
import { getAppRouteRegistry } from "@/services/app-route-registry";
import { getEvidenceSubmissionWorkspace } from "@/services/evidence-submission-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberProofStatusWorkspace } from "@/services/member-proof-status";
import {
  getPrivateProofUploadWriteConfig,
} from "@/services/private-proof-upload-write";
import { getProofSharingReviewBoard } from "@/services/proof-sharing-review";
import {
  getProofStoragePlan,
  getProofStorageReadinessConfig,
} from "@/services/proof-storage-readiness";
import { getProofUploadIntakeWorkspace } from "@/services/proof-upload-intake";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";
import { getApprovedEmbedDomains } from "@/services/user-generated-content-safety";

type EnvSource = Record<string, string | undefined>;

export type ProofUgcConsentStorageLane = {
  key:
    | "evidence_submission_queue"
    | "member_proof_status"
    | "private_proof_upload_localhost"
    | "hq_proof_review"
    | "proof_sharing_review"
    | "ugc_embed_and_social_links"
    | "coach_notes_and_moderation"
    | "campaign_proof_handoff_and_exports"
    | "production_proof";
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

export type ProofUgcConsentStorageSafetyContract = {
  title: string;
  summary: readonly string[];
  currentLocalWritePath: {
    exists: true;
    route: "/proof-library/upload";
    serverActions: readonly [
      "submitPrivateProofUploadForLocalSupabase",
      "removePrivateProofUploadForLocalSupabase",
    ];
    requiredFlags: readonly string[];
    allowedActors: readonly string[];
    futureWrites: readonly string[];
    localOnlyReason: string;
  };
  globalGuards: readonly string[];
  requiredFoundations: readonly string[];
  lanes: readonly ProofUgcConsentStorageLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const localRequiredFlags = [
  "MYMEDLIFE_AUTH_MODE=local_supabase",
  "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key",
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE=true",
] as const;

const lanes = [
  {
    key: "evidence_submission_queue",
    label: "Member and chapter proof-submission queue",
    route: "/rush-month/evidence",
    status: "read_only_preview",
    roleScope: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["evidence_items", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No production proof metadata save.",
      "No file upload.",
      "No public proof publishing.",
      "No reminder, warehouse, Power BI, HubSpot, Luma, SMS, email, or AI send.",
    ],
    plainEnglishRule:
      "The evidence queue can preview what proof needs to be prepared next, but it must stay metadata-and-readiness only until storage, consent, audit, and rollback are fully approved.",
    sourceOfTruth: [
      "src/services/evidence-submission-workspace.ts",
      "src/services/proof-submission-write.ts",
    ],
  },
  {
    key: "member_proof_status",
    label: "Member-visible proof status and learning posture",
    route: "/proof-library",
    status: "read_only_preview",
    roleScope: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["evidence_items", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No public publish.",
      "No raw proof export.",
      "No AI summary or social sync.",
      "No browser claim that approved_internal means public-ready.",
    ],
    plainEnglishRule:
      "The proof library can explain status and future sharing posture, but it cannot publish stories, sync providers, or turn local/Test proof into rollout evidence.",
    sourceOfTruth: [
      "src/services/member-proof-status.ts",
      "src/services/proof-sharing-review.ts",
    ],
  },
  {
    key: "private_proof_upload_localhost",
    label: "Localhost-only private raw-proof upload",
    route: "/proof-library/upload",
    status: "implemented_local_only",
    roleScope: ["chapter_member", "chapter_leader", "admin", "super_admin"],
    requiredTables: [
      "storage.objects",
      "evidence_items",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ],
    requiredFlags: localRequiredFlags,
    forbiddenSideEffects: [
      "No public proof URL.",
      "No story/UGC publishing.",
      "No provider sync or external moderation send.",
      "No hosted staging or hosted production write approval.",
    ],
    plainEnglishRule:
      "A narrow localhost-only server path can store private source files for an existing proof row, but it stays private, local, and non-publishing by design.",
    sourceOfTruth: [
      "src/services/private-proof-upload-write.ts",
      "src/app/proof-library/upload/actions.ts",
      "src/services/proof-storage-readiness.ts",
    ],
  },
  {
    key: "hq_proof_review",
    label: "Leader and HQ proof review posture",
    route: "/rush-month/review",
    status: "read_only_preview",
    roleScope: ["chapter_leader", "admin", "super_admin"],
    requiredTables: ["evidence_items", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No public publish.",
      "No member reminder send.",
      "No coach-note persistence from browser review alone.",
      "No campaign proof completion claim from review posture alone.",
    ],
    plainEnglishRule:
      "Leader and HQ review can stay visible for chapter learning and HQ triage, but consent, publishing, points, and outbound side effects still need separate approved write lanes.",
    sourceOfTruth: [
      "src/services/leader-proof-decision-workspace.ts",
      "src/services/hq-proof-decision-write.ts",
    ],
  },
  {
    key: "proof_sharing_review",
    label: "HQ proof-sharing and consent posture",
    route: "/proof-library",
    status: "read_only_preview",
    roleScope: ["chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["evidence_items", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No public publish now.",
      "No external export.",
      "No takedown/delete shortcut without manual-first cleanup.",
      "No fake consent approval counted as live sharing proof.",
    ],
    plainEnglishRule:
      "HQ can classify future sharing posture, but every row still treats raw media as private source material until later consent and publish tools exist.",
    sourceOfTruth: [
      "src/services/proof-sharing-review.ts",
      "src/services/proof-upload-intake.ts",
    ],
  },
  {
    key: "ugc_embed_and_social_links",
    label: "UGC embed links and social references",
    route: "/proof-library",
    status: "blocked_pending_future_lane",
    roleScope: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["evidence_items", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No arbitrary HTML embed.",
      "No unsupported social iframe publish.",
      "No dangerous URL or script content.",
      "No fake social-post completion evidence.",
    ],
    plainEnglishRule:
      "User-generated links can be classified and sanitized, but they are not a live publishing workflow and must not imply social or story distribution is approved.",
    sourceOfTruth: [
      "src/services/user-generated-content-safety.ts",
      "src/services/proof-sharing-review.ts",
    ],
  },
  {
    key: "coach_notes_and_moderation",
    label: "Coach notes, moderation, and consent decisions",
    route: "/rush-month/review",
    status: "blocked_pending_future_lane",
    roleScope: ["coach", "admin", "super_admin"],
    requiredTables: ["proof_moderation_decisions", "coach_support_notes", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No coach-note persistence.",
      "No moderation approval write.",
      "No silent reviewer override of student proof truth.",
      "No browser-only consent decision counted as durable history.",
    ],
    plainEnglishRule:
      "Moderation and coach-note ideas can be reviewed conceptually, but no durable decision model exists yet for live writes or rollback.",
    sourceOfTruth: [
      "src/services/leader-proof-decision-workspace.ts",
      "src/services/proof-sharing-review.ts",
    ],
  },
  {
    key: "campaign_proof_handoff_and_exports",
    label: "Campaign proof handoff, social reuse, and exports",
    route: "/proof-library/upload",
    status: "blocked_pending_future_lane",
    roleScope: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No warehouse or Power BI export.",
      "No n8n handoff.",
      "No social/provider sync.",
      "No campaign-proof complete signal from local/Test evidence.",
    ],
    plainEnglishRule:
      "Proof handoff can explain the future journey, but no campaign export, provider sync, or public story reuse can happen from the current route family.",
    sourceOfTruth: [
      "src/services/action-proof-handoff.ts",
      "src/services/proof-upload-intake.ts",
    ],
  },
  {
    key: "production_proof",
    label: "Production proof and rollout evidence posture",
    route: "/proof-library/upload",
    status: "blocked_pending_future_lane",
    roleScope: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["evidence_items", "storage.objects", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/sample row counts as production pilot proof.",
      "No localhost upload or review screenshot counts as rollout evidence.",
      "No fake consent, fake publishing, or fake story sync counts as production readiness.",
    ],
    plainEnglishRule:
      "Local proof rehearsal remains useful for safety review only. It must stay separate from production pilot proof, rollout packet evidence, and invite-gate truth.",
    sourceOfTruth: [
      "src/services/local-vs-production-role-proof-separation.ts",
      "src/services/production-launch-gate.ts",
      "src/services/production-invite-gate.ts",
    ],
  },
] as const satisfies readonly ProofUgcConsentStorageLane[];

export function getProofUgcConsentStorageSafetyContract(
  env: EnvSource = process.env,
): ProofUgcConsentStorageSafetyContract {
  const memberActor = getMockLocalActorContext("member.a@mymedlife.test");
  const leaderActor = getMockLocalActorContext("leader.a@mymedlife.test");
  const adminActor = getMockLocalActorContext("admin@mymedlife.test");

  const evidenceWorkspace = getEvidenceSubmissionWorkspace(memberActor);
  const proofStatus = getMemberProofStatusWorkspace(memberActor);
  const intakeWorkspace = getProofUploadIntakeWorkspace(memberActor);
  const reviewBoard = getProofSharingReviewBoard(adminActor);
  const handoffWorkspace = getActionProofHandoffWorkspace(adminActor, assignments[0]!);
  const storagePlan = getProofStoragePlan();
  const registry = new Set(getAppRouteRegistry().map((route) => route.href));
  const localUploadConfig = getPrivateProofUploadWriteConfig({
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE: "true",
    ...env,
  });
  const hostedStagingAuth = getSupabaseAuthConfig({
    MYMEDLIFE_AUTH_MODE: "staging_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
    NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE: "true",
    ...env,
  });
  const hostedProductionAuth = getSupabaseAuthConfig({
    MYMEDLIFE_AUTH_MODE: "production_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
    NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE: "true",
    ...env,
  });

  const validationChecks = [
    {
      key: "evidence_submission_queue_zero_writes",
      passed:
        evidenceWorkspace.counts.localWriteControlsEnabled === 0 &&
        evidenceWorkspace.counts.uploadsEnabled === 0 &&
        evidenceWorkspace.counts.externalSendsEnabled === 0,
      message:
        "The member/chapter evidence queue still reports zero local write controls, zero uploads, and zero external sends.",
    },
    {
      key: "proof_status_stays_non_public",
      passed:
        proofStatus.counts.publicPublishesEnabled === 0 &&
        proofStatus.counts.externalExportsEnabled === 0,
      message:
        "Member proof status stays non-public and non-exporting even when rows are approved for internal learning.",
    },
    {
      key: "proof_upload_intake_stays_review_first",
      passed:
        intakeWorkspace.uploadsEnabled === false &&
        intakeWorkspace.publicPublishingEnabled === false &&
        intakeWorkspace.externalExportsEnabled === false &&
        intakeWorkspace.storagePacket?.targetRoute === "/proof-library/upload",
      message:
        "The proof upload intake route stays review-first: upload, public publishing, and exports remain disabled.",
    },
    {
      key: "private_upload_local_lane_exists_but_stays_private",
      passed:
        localUploadConfig.enabled &&
        localUploadConfig.isLocalOnly &&
        localUploadConfig.publicPublishingEnabled === false &&
        localUploadConfig.externalWritesEnabled === false,
      message:
        "The only implemented raw-proof write lane remains localhost-only and private, with public publishing and external writes disabled.",
    },
    {
      key: "hosted_staging_blocked_when_proof_upload_flags_on",
      passed:
        !hostedStagingAuth.enabled &&
        hostedStagingAuth.reason.includes("MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE"),
      message:
        "Hosted staging Supabase Auth stays disabled when proof-upload write flags are on.",
    },
    {
      key: "hosted_production_blocked_when_proof_upload_flags_on",
      passed:
        !hostedProductionAuth.enabled &&
        hostedProductionAuth.reason.includes("MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE"),
      message:
        "Hosted production Supabase Auth stays disabled when proof-upload write flags are on.",
    },
    {
      key: "hq_review_stays_non_publishing",
      passed:
        reviewBoard.canReadBoard &&
        reviewBoard.canDecideSharing &&
        reviewBoard.counts.publishActionsEnabled === 0 &&
        reviewBoard.counts.externalExportsEnabled === 0,
      message:
        "HQ proof-sharing review can classify posture, but publish actions and external exports remain disabled.",
    },
    {
      key: "ugc_allowlist_stays_curated",
      passed:
        Object.keys(getApprovedEmbedDomains()).length >= 6 &&
        getApprovedEmbedDomains().youtube.includes("youtube.com"),
      message:
        "UGC embed handling stays curated and allowlisted rather than becoming an open arbitrary embed surface.",
    },
    {
      key: "proof_routes_present_in_registry",
      passed: lanes.every((lane) => registry.has(lane.route)),
      message:
        "Every route referenced by this safety contract still exists in the launch-lane route registry.",
    },
    {
      key: "campaign_handoff_stays_send_free",
      passed:
        handoffWorkspace.disabledOutboxDestinations.includes("public proof publishing disabled") &&
        handoffWorkspace.safetyNotes.some((note) => note.includes("No HubSpot")),
      message:
        "Campaign proof handoff still describes the workflow without enabling provider sends or public proof publishing.",
    },
    {
      key: "storage_plan_separates_private_and_public_buckets",
      passed:
        storagePlan.privateSubmissionBucket === "proof-submissions-private" &&
        storagePlan.publicLibraryBucket === "proof-library-public" &&
        getProofStorageReadinessConfig(env).publicPublishingEnabled === false,
      message:
        "Storage readiness still separates private submission media from future public library assets while keeping publishing disabled.",
    },
    {
      key: "leader_review_surface_still_exists",
      passed: getProofSharingReviewBoard(leaderActor).canReadBoard,
      message:
        "Leader-visible proof posture still exists as a read path without turning chapter review into public-sharing authority.",
    },
  ];

  return {
    title: "Proof / evidence / UGC consent and storage safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not create production users, write production Supabase rows, upload files to production, publish stories, sync providers, or claim rollout proof.",
      "Current source supports preview-only proof submission, preview-only consent and sharing review, and one localhost-only private raw-proof upload lane guarded by local auth plus explicit write flags.",
      "Anything that looks like consent approval, story publishing, coach-note persistence, moderation, social sync, campaign completion, or pilot proof must remain blocked until a later approved server boundary exists.",
    ],
    currentLocalWritePath: {
      exists: true,
      route: "/proof-library/upload",
      serverActions: [
        "submitPrivateProofUploadForLocalSupabase",
        "removePrivateProofUploadForLocalSupabase",
      ],
      requiredFlags: localRequiredFlags,
      allowedActors: ["submitter", "admin", "super_admin"],
      futureWrites: [
        "storage.objects",
        "evidence_items",
        "events",
        "integration_events",
        "automation_outbox",
        "audit_logs",
      ],
      localOnlyReason:
        localUploadConfig.reason,
    },
    globalGuards: [
      "Test/Figma/sandbox/sample rows, localhost uploads, preview-cookie review, and staging artifacts do not count as production pilot proof, rollout packet evidence, or invite-gate truth.",
      "Public publishing, social/provider sync, warehouse export, AI proof summaries, and external moderation remain disabled even when a local private raw-proof upload succeeds.",
      "Consent review posture is not the same thing as public-sharing approval, moderation approval, or story-publish readiness.",
      "Coach notes, moderation outcomes, campaign proof completion, and reminder delivery must not appear live until a later audited server boundary exists.",
    ],
    requiredFoundations: [
      "A dedicated consent-and-moderation schema with durable audit history, rollback posture, and reviewer ownership.",
      "A story/UGC publishing boundary that separates private source media from future public reuse and social/provider sync.",
      "A reviewed storage and deletion model for takedown requests, retention, and raw-file cleanup.",
      "Hosted staging and hosted production gates that remain off by default until Coordinator-approved proof, storage, and rollback drills exist.",
      "Explicit operator evidence showing local/Test/sandbox proof stays excluded from production pilot proof, rollout packet evidence, and invite-gate decisions.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatProofUgcConsentStorageSafetyContract(
  contract: ProofUgcConsentStorageSafetyContract = getProofUgcConsentStorageSafetyContract(),
): string {
  return [
    contract.title,
    "",
    "Summary:",
    ...formatList(contract.summary),
    "",
    "Current local write path:",
    `- exists: ${contract.currentLocalWritePath.exists ? "yes" : "no"}`,
    `- route: ${contract.currentLocalWritePath.route}`,
    `- server actions: ${contract.currentLocalWritePath.serverActions.join(", ")}`,
    `- allowed actors: ${contract.currentLocalWritePath.allowedActors.join(", ")}`,
    `- local-only reason: ${contract.currentLocalWritePath.localOnlyReason}`,
    "- required flags:",
    ...formatNestedList(contract.currentLocalWritePath.requiredFlags),
    "- future writes:",
    ...formatNestedList(contract.currentLocalWritePath.futureWrites),
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
