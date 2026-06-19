export type Phase2Owner = "Codex" | "Kiomi / DS" | "Nick";

export type Phase2IssueStatus = "Backlog";

export type Phase2IssueType =
  | "umbrella"
  | "foundation"
  | "governance"
  | "write"
  | "runbook";

export type Phase2LinearIssue = {
  id: `MED-${number}`;
  title: string;
  type: Phase2IssueType;
  owner: Phase2Owner[];
  status: Phase2IssueStatus;
  purpose: string;
  liveWorkAllowed: false;
};

export type Phase2BlockedLiveAction = {
  key: string;
  label: string;
  reason: string;
  allowedNow: false;
};

export type Phase2AllowedPrepItem = {
  key: string;
  label: string;
  owner: Phase2Owner[];
  output: string;
};

export type Phase2EnvironmentItem = {
  key: string;
  environment: "local" | "staging" | "production" | "all";
  owner: Phase2Owner[];
  checklist: string[];
  secretExposureAllowed: false;
};

export type Phase2AuthStep = {
  order: number;
  label: string;
  owner: Phase2Owner[];
  evidenceRequired: string;
  liveEnabledNow: false;
};

export type Phase2SecurityTest = {
  key: string;
  label: string;
  evidenceRequired: string;
  mustPassBeforeWrite: true;
};

export type Phase2WriteKey =
  | "membership_approval"
  | "leader_assignment_creation"
  | "student_action_start"
  | "proof_metadata_submission"
  | "private_proof_upload"
  | "leader_proof_review_decision"
  | "hq_proof_sharing_decision"
  | "points_kpi_ledger_materialization"
  | "slt_checklist_completion"
  | "staff_chapter_decision_coach_note";

export type Phase2WriteGate = {
  issueId: `MED-${number}`;
  key: Phase2WriteKey;
  order: number;
  label: string;
  owner: Phase2Owner[];
  gateChecklist: [
    "staging proof",
    "RLS/security coverage",
    "audit readback",
    "duplicate/error handling",
    "rollback step",
    "Linear/GitHub evidence",
  ];
  liveEnabledNow: false;
  blockedUntil: string;
  externalWritesExpected: 0;
};

export type Phase2SafePrepPacket = {
  title: string;
  summary: string;
  status: {
    canStartSafePrepNow: true;
    canStartLiveImplementation: false;
    blockedUntil: string[];
  };
  stackDecision: string;
  sourceOfTruth: string;
  allowedPrepWork: Phase2AllowedPrepItem[];
  blockedLiveActions: Phase2BlockedLiveAction[];
  environmentChecklist: Phase2EnvironmentItem[];
  authOnboardingPlan: Phase2AuthStep[];
  rlsSecurityTestPlan: Phase2SecurityTest[];
  writePromotionSequence: Phase2WriteGate[];
  pilotScope: string[];
  mockOnlyBoundaries: string[];
  linearIssues: Phase2LinearIssue[];
  ownerResponsibilities: Record<Phase2Owner, string[]>;
  openQuestions: Record<"Kiomi / DS" | "Nick", string[]>;
  officialReferences: { label: string; url: string }[];
  counts: {
    linearIssues: number;
    writeGates: number;
    liveActionsAllowedNow: 0;
    externalWritesExpected: 0;
    secretsShown: 0;
  };
};

export function getPhase2SafePrepPacket(): Phase2SafePrepPacket {
  return {
    title: "MED-471 Phase 2 safe prep packet",
    summary:
      "Phase 2 prep can move forward while PR #94 is reviewed, but live infrastructure, auth, writes, migrations, credentials, uploads, production deploys, and external automation remain blocked.",
    status: {
      canStartSafePrepNow: true,
      canStartLiveImplementation: false,
      blockedUntil: [
        "PR #94 review is complete",
        "Kiomi/DS confirms the stack and environment path",
        "Supabase/Vercel ownership and production key handling are approved",
        "Auth, RLS/security, audit, and rollback evidence exists for the target write",
      ],
    },
    stackDecision:
      "Continue Next.js, Supabase, and Vercel through MVP and first live launch.",
    sourceOfTruth:
      "myMEDLIFE/Supabase owns app truth. HubSpot, Luma, Shopify, n8n, warehouse, Power BI, and AI remain downstream or read-only until separately approved.",
    allowedPrepWork: phase2AllowedPrepWork,
    blockedLiveActions: phase2BlockedLiveActions,
    environmentChecklist: phase2EnvironmentChecklist,
    authOnboardingPlan: phase2AuthOnboardingPlan,
    rlsSecurityTestPlan: phase2RlsSecurityTestPlan,
    writePromotionSequence: phase2WritePromotionSequence,
    pilotScope: phase2PilotScope,
    mockOnlyBoundaries: phase2MockOnlyBoundaries,
    linearIssues: phase2LinearIssues,
    ownerResponsibilities: phase2OwnerResponsibilities,
    openQuestions: phase2OpenQuestions,
    officialReferences: phase2OfficialReferences,
    counts: {
      linearIssues: phase2LinearIssues.length,
      writeGates: phase2WritePromotionSequence.length,
      liveActionsAllowedNow: 0,
      externalWritesExpected: 0,
      secretsShown: 0,
    },
  };
}

export function getPhase2WritePromotionSequence(): Phase2WriteGate[] {
  return [...phase2WritePromotionSequence];
}

export function getBlockedPhase2LiveActions(): Phase2BlockedLiveAction[] {
  return [...phase2BlockedLiveActions];
}

const phase2AllowedPrepWork: Phase2AllowedPrepItem[] = [
  {
    key: "linear_breakdown",
    label: "Break Phase 2 into clear Linear issues",
    owner: ["Codex"],
    output: "MED-471 through MED-486",
  },
  {
    key: "auth_plan",
    label: "Write auth/onboarding implementation plan",
    owner: ["Codex", "Kiomi / DS"],
    output: "Auth flow, callback, profile, join, role, audit, and rollback plan",
  },
  {
    key: "rls_security_plan",
    label: "Write RLS/security test plan",
    owner: ["Codex", "Kiomi / DS"],
    output: "Default-deny, role/chapter isolation, audit, storage, and CI proof plan",
  },
  {
    key: "write_sequence",
    label: "Write one-at-a-time write promotion sequence",
    owner: ["Codex", "Kiomi / DS"],
    output: "Ten gated writes with staging, RLS, audit, rollback, and evidence rules",
  },
  {
    key: "environment_checklist",
    label: "Document env vars, callback URLs, staging, and production needs",
    owner: ["Codex", "Kiomi / DS"],
    output: "Supabase/Vercel setup checklist with no secrets committed",
  },
  {
    key: "runbook",
    label: "Prepare rollout and rollback runbook docs",
    owner: ["Codex", "Nick", "Kiomi / DS"],
    output: "Pilot support, dry run, rollback, stop-rule, and owner checklist",
  },
  {
    key: "mock_safe_tests",
    label: "Add or refine tests that do not require live credentials",
    owner: ["Codex"],
    output: "Service-level tests proving live actions remain blocked",
  },
];

const phase2BlockedLiveActions: Phase2BlockedLiveAction[] = [
  {
    key: "real_supabase_vercel_setup",
    label: "Real Supabase or Vercel setup",
    reason: "Kiomi/DS must approve ownership, security posture, and environment path first.",
    allowedNow: false,
  },
  {
    key: "staging_production_credentials",
    label: "Staging or production credentials",
    reason: "Production keys and staging credentials must be owned by the human DS/security owner.",
    allowedNow: false,
  },
  {
    key: "live_auth",
    label: "Live auth or production users",
    reason: "Callback URLs, profile mapping, role routing, and rollback are not approved yet.",
    allowedNow: false,
  },
  {
    key: "live_browser_writes",
    label: "Live browser writes",
    reason: "Each write needs staging, RLS/security, audit, duplicate/error, rollback, and evidence gates.",
    allowedNow: false,
  },
  {
    key: "proof_uploads",
    label: "Proof uploads",
    reason: "Storage buckets and storage object policies need DS/security approval first.",
    allowedNow: false,
  },
  {
    key: "live_db_migrations",
    label: "Live database migrations",
    reason: "No live Supabase project is approved for migration from this prep lane.",
    allowedNow: false,
  },
  {
    key: "production_deploys",
    label: "Production deploys",
    reason: "Pilot support, rollback, monitoring, and owner sign-off are not complete.",
    allowedNow: false,
  },
  {
    key: "external_integrations",
    label: "HubSpot, Luma, Shopify, n8n, warehouse, or Power BI writes",
    reason: "External systems stay manual, read-only, mocked, or outbox-disabled until separate approval.",
    allowedNow: false,
  },
  {
    key: "external_automation",
    label: "Email, SMS, AI, or other external automation",
    reason: "Automation cannot run before outbox governance and destination approvals exist.",
    allowedNow: false,
  },
];

const phase2EnvironmentChecklist: Phase2EnvironmentItem[] = [
  {
    key: "local",
    environment: "local",
    owner: ["Codex"],
    secretExposureAllowed: false,
    checklist: [
      "Mock data remains the default",
      "Local Supabase reads and writes stay behind explicit local-only flags",
      "Fake local actor emails remain available for reviewer walkthroughs",
      ".env.local secrets stay out of source control",
    ],
  },
  {
    key: "staging",
    environment: "staging",
    owner: ["Kiomi / DS", "Codex"],
    secretExposureAllowed: false,
    checklist: [
      "Staging Supabase project or branch pattern is approved",
      "Staging anon and service-role key handling is approved",
      "Vercel preview/staging env vars are configured outside source control",
      "Staging auth callback and redirect URLs are approved",
      "RLS/security, seed strategy, backups, and rollback are reviewed",
    ],
  },
  {
    key: "production",
    environment: "production",
    owner: ["Kiomi / DS", "Nick"],
    secretExposureAllowed: false,
    checklist: [
      "Production Supabase project is approved",
      "Production service-role keys are server-only",
      "Vercel production env vars are owned by the production secret owner",
      "Production auth callback and redirect URLs are approved",
      "Monitoring, backups, incident owner, and rollback are named",
    ],
  },
  {
    key: "callback_urls",
    environment: "all",
    owner: ["Kiomi / DS", "Codex"],
    secretExposureAllowed: false,
    checklist: [
      "Local auth callback URL",
      "Vercel preview or staging auth callback URL",
      "Production auth callback URL",
      "Post-login role route for every launch role",
    ],
  },
];

const phase2AuthOnboardingPlan: Phase2AuthStep[] = [
  {
    order: 1,
    label: "Supabase Auth sign-in",
    owner: ["Kiomi / DS", "Codex"],
    evidenceRequired: "Approved provider, callback URL, redirect URL, and session handling.",
    liveEnabledNow: false,
  },
  {
    order: 2,
    label: "Profile creation or lookup",
    owner: ["Codex"],
    evidenceRequired: "One auth user maps to one app profile with duplicate handling.",
    liveEnabledNow: false,
  },
  {
    order: 3,
    label: "Chapter join request",
    owner: ["Codex", "Nick"],
    evidenceRequired: "User can request chapter membership without gaining member-only access.",
    liveEnabledNow: false,
  },
  {
    order: 4,
    label: "Membership approval",
    owner: ["Codex", "Kiomi / DS"],
    evidenceRequired: "President/VP approves own-chapter requests with audit readback.",
    liveEnabledNow: false,
  },
  {
    order: 5,
    label: "Chapter role assignment",
    owner: ["Codex", "Nick"],
    evidenceRequired: "Chapter-scoped roles are explicit and separated from signup.",
    liveEnabledNow: false,
  },
  {
    order: 6,
    label: "Coach and staff assignment",
    owner: ["Codex", "Nick", "Kiomi / DS"],
    evidenceRequired: "Coach portfolio and staff roles are assigned by approved owners.",
    liveEnabledNow: false,
  },
  {
    order: 7,
    label: "Server actor context",
    owner: ["Codex", "Kiomi / DS"],
    evidenceRequired: "Actor context derives from auth/session state, not local preview email.",
    liveEnabledNow: false,
  },
  {
    order: 8,
    label: "Audit, support, and rollback",
    owner: ["Codex", "Nick", "Kiomi / DS"],
    evidenceRequired: "Events, audit rows, support owner, and rollback steps are documented.",
    liveEnabledNow: false,
  },
];

const phase2RlsSecurityTestPlan: Phase2SecurityTest[] = [
  {
    key: "default_deny",
    label: "Default-deny RLS on app tables",
    evidenceRequired: "Every app table exposed to app users has RLS enabled and denied by default.",
    mustPassBeforeWrite: true,
  },
  {
    key: "role_chapter_isolation",
    label: "Role and chapter isolation",
    evidenceRequired: "Users cannot read or write unrelated chapter or private role data.",
    mustPassBeforeWrite: true,
  },
  {
    key: "direct_write_denials",
    label: "Direct table write denial",
    evidenceRequired: "Guarded flows reject direct INSERT/UPDATE/DELETE attempts.",
    mustPassBeforeWrite: true,
  },
  {
    key: "approved_rpc",
    label: "Approved RPC/function writes",
    evidenceRequired: "Authorized RPC/function path succeeds only for the expected actor and scope.",
    mustPassBeforeWrite: true,
  },
  {
    key: "audit_readback",
    label: "Audit readback",
    evidenceRequired: "Audit row persists with actor, target, before/after state, and reason.",
    mustPassBeforeWrite: true,
  },
  {
    key: "storage_policy",
    label: "Storage policy before proof upload",
    evidenceRequired: "Storage object policies protect private proof files before upload is enabled.",
    mustPassBeforeWrite: true,
  },
  {
    key: "service_role_boundary",
    label: "Service role secret boundary",
    evidenceRequired: "Service role keys are server-only and never exposed to browser code.",
    mustPassBeforeWrite: true,
  },
  {
    key: "ci_evidence",
    label: "CI or staging evidence",
    evidenceRequired: "GitHub/Linear evidence is attached before the next write is promoted.",
    mustPassBeforeWrite: true,
  },
];

const gateChecklist: Phase2WriteGate["gateChecklist"] = [
  "staging proof",
  "RLS/security coverage",
  "audit readback",
  "duplicate/error handling",
  "rollback step",
  "Linear/GitHub evidence",
];

const phase2WritePromotionSequence: Phase2WriteGate[] = [
  {
    issueId: "MED-476",
    key: "membership_approval",
    order: 1,
    label: "Membership approval",
    owner: ["Codex", "Kiomi / DS"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "PR #94 review, environment approval, auth approval, and RLS/security evidence.",
    externalWritesExpected: 0,
  },
  {
    issueId: "MED-477",
    key: "leader_assignment_creation",
    order: 2,
    label: "Leader assignment creation",
    owner: ["Codex", "Kiomi / DS"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "MED-476 evidence is complete.",
    externalWritesExpected: 0,
  },
  {
    issueId: "MED-478",
    key: "student_action_start",
    order: 3,
    label: "Student action start",
    owner: ["Codex", "Kiomi / DS"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "MED-477 evidence is complete.",
    externalWritesExpected: 0,
  },
  {
    issueId: "MED-479",
    key: "proof_metadata_submission",
    order: 4,
    label: "Proof metadata submission",
    owner: ["Codex", "Kiomi / DS"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "MED-478 evidence is complete.",
    externalWritesExpected: 0,
  },
  {
    issueId: "MED-480",
    key: "private_proof_upload",
    order: 5,
    label: "Private proof upload",
    owner: ["Kiomi / DS", "Codex"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "MED-479 evidence is complete and storage policy is approved.",
    externalWritesExpected: 0,
  },
  {
    issueId: "MED-481",
    key: "leader_proof_review_decision",
    order: 6,
    label: "Leader proof review decision",
    owner: ["Codex", "Kiomi / DS"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "MED-480 evidence is complete.",
    externalWritesExpected: 0,
  },
  {
    issueId: "MED-482",
    key: "hq_proof_sharing_decision",
    order: 7,
    label: "HQ proof-sharing decision",
    owner: ["Codex", "Kiomi / DS"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "MED-481 evidence is complete.",
    externalWritesExpected: 0,
  },
  {
    issueId: "MED-483",
    key: "points_kpi_ledger_materialization",
    order: 8,
    label: "Points and KPI ledger materialization",
    owner: ["Codex", "Kiomi / DS"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "MED-482 evidence is complete.",
    externalWritesExpected: 0,
  },
  {
    issueId: "MED-484",
    key: "slt_checklist_completion",
    order: 9,
    label: "SLT checklist completion",
    owner: ["Codex", "Kiomi / DS"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "MED-483 evidence is complete and SLT-specific boundaries are approved.",
    externalWritesExpected: 0,
  },
  {
    issueId: "MED-485",
    key: "staff_chapter_decision_coach_note",
    order: 10,
    label: "Staff chapter decision and coach note path",
    owner: ["Codex", "Kiomi / DS"],
    gateChecklist,
    liveEnabledNow: false,
    blockedUntil: "MED-484 evidence is complete.",
    externalWritesExpected: 0,
  },
];

const phase2PilotScope = [
  "one chapter only",
  "5 to 15 students",
  "one chapter leader owner",
  "one coach owner",
  "one HQ/admin owner",
  "one DS owner",
  "manual-first event attendance and NPS unless a narrow Luma read/import path is approved",
];

const phase2MockOnlyBoundaries = [
  "HubSpot remains CRM/follow-up reference only",
  "Luma remains event registration/attendance reference only unless a read/import path is approved",
  "Shopify remains SLT payment status reference only",
  "n8n can later consume approved outbox events but is not source of truth",
  "warehouse and Power BI remain downstream analytics only",
  "AI recommendations are logged, bounded, and never unsupervised",
  "proof/UGC publishing requires consent, moderation, takedown, deletion, and public/private separation",
];

const phase2LinearIssues: Phase2LinearIssue[] = [
  {
    id: "MED-471",
    title: "Phase 2 safe prep packet and live MVP pilot boundary",
    type: "umbrella",
    owner: ["Codex"],
    status: "Backlog",
    purpose: "Keep safe prep moving while live implementation remains blocked.",
    liveWorkAllowed: false,
  },
  {
    id: "MED-472",
    title: "Live environment setup checklist",
    type: "foundation",
    owner: ["Kiomi / DS", "Codex"],
    status: "Backlog",
    purpose: "Define local, staging, production, Vercel, Supabase, backups, and secret ownership.",
    liveWorkAllowed: false,
  },
  {
    id: "MED-473",
    title: "Production auth and onboarding implementation",
    type: "foundation",
    owner: ["Kiomi / DS", "Codex"],
    status: "Backlog",
    purpose: "Plan real sign-in, callbacks, profile creation, role routing, and onboarding writes.",
    liveWorkAllowed: false,
  },
  {
    id: "MED-474",
    title: "RLS and security release gate",
    type: "foundation",
    owner: ["Kiomi / DS"],
    status: "Backlog",
    purpose: "Require RLS, storage, audit, rollback, and CI/security evidence before live writes.",
    liveWorkAllowed: false,
  },
  {
    id: "MED-475",
    title: "Write promotion sequence governance",
    type: "governance",
    owner: ["Codex", "Kiomi / DS"],
    status: "Backlog",
    purpose: "Promote one write at a time with staging proof and Linear/GitHub evidence.",
    liveWorkAllowed: false,
  },
  ...phase2WritePromotionSequence.map((write): Phase2LinearIssue => ({
    id: write.issueId,
    title: write.label,
    type: "write",
    owner: write.owner,
    status: "Backlog",
    purpose: `Gate write ${write.order}: ${write.label}.`,
    liveWorkAllowed: false,
  })),
  {
    id: "MED-486",
    title: "Pilot support runbook and rollback drill",
    type: "runbook",
    owner: ["Nick", "Kiomi / DS", "Codex"],
    status: "Backlog",
    purpose: "Prepare staff dry run, support owner, rollback, smoke checks, and stop rules.",
    liveWorkAllowed: false,
  },
];

const phase2OwnerResponsibilities: Record<Phase2Owner, string[]> = {
  Codex: [
    "Implement mock-safe code, tests, docs, and route/state wiring",
    "Update Linear and GitHub after each completed item",
    "Avoid live auth, live writes, uploads, deploys, and external sends until the matching issue is approved",
  ],
  "Kiomi / DS": [
    "Confirm stack and environment path",
    "Own Supabase and Vercel production keys",
    "Approve RLS, storage, backup, monitoring, and security posture",
  ],
  Nick: [
    "Choose pilot chapter and owners",
    "Approve launch go/no-go",
    "Name support and stop-rule ownership",
  ],
};

const phase2OpenQuestions: Phase2SafePrepPacket["openQuestions"] = {
  "Kiomi / DS": [
    "Are we confirmed on Next.js, Supabase, and Vercel through MVP and first live launch?",
    "Who owns Supabase and Vercel production keys?",
    "Should staging use a separate Supabase project or a Supabase branch/project pattern?",
    "Which sign-in providers and callback domains are approved?",
    "What monitoring, backup, and incident tooling should be used for pilot?",
  ],
  Nick: [
    "Which chapter should be the first pilot chapter?",
    "Who are the pilot leader, coach, HQ/admin, and DS owners?",
    "What is the stop condition for pausing the pilot?",
  ],
};

const phase2OfficialReferences = [
  {
    label: "Supabase server-side auth client setup",
    url: "https://supabase.com/docs/guides/auth/server-side/creating-a-client",
  },
  {
    label: "Supabase row level security",
    url: "https://supabase.com/docs/guides/database/postgres/row-level-security",
  },
  {
    label: "Supabase Storage access control",
    url: "https://supabase.com/docs/guides/storage/security/access-control",
  },
  {
    label: "Supabase API security",
    url: "https://supabase.com/docs/guides/api/securing-your-api",
  },
  {
    label: "Supabase changelog",
    url: "https://supabase.com/changelog",
  },
  {
    label: "Vercel environments",
    url: "https://vercel.com/docs/deployments/environments",
  },
  {
    label: "Vercel environment variables",
    url: "https://vercel.com/docs/environment-variables",
  },
  {
    label: "Managing Vercel environment variables",
    url: "https://vercel.com/docs/environment-variables/managing-environment-variables",
  },
  {
    label: "Vercel deployment protection",
    url: "https://vercel.com/docs/deployment-protection",
  },
];
