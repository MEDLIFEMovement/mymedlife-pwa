import type { LocalActorContext } from "@/services/local-actor-context";

export type ProductionLaunchGateKey =
  | "production_auth"
  | "rls_security"
  | "write_promotion"
  | "proof_storage"
  | "campaign_templates"
  | "integration_outbox"
  | "audit_observability"
  | "pilot_operations";

export type ProductionLaunchGateStatus =
  | "local_evidence_ready"
  | "blocked_before_live";

export type ProductionLaunchEvidenceStatus = "missing_before_pilot";

export type ProductionLaunchGateItem = {
  key: ProductionLaunchGateKey;
  label: string;
  ownerLane: string;
  status: ProductionLaunchGateStatus;
  localEvidence: string;
  missingLiveEvidence: string[];
  reviewRoutes: string[];
  approvalRequired: string;
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type ProductionLaunchEvidenceCheck = {
  key: string;
  label: string;
  ownerLane: string;
  status: ProductionLaunchEvidenceStatus;
  requiredEvidence: string;
  reviewRoute: string;
  acceptanceSignal: string;
  blockedUntil: string;
};

export type ProductionLaunchGate = {
  canReadGate: boolean;
  title: string;
  verdict: "not_live_ready";
  summary: string;
  launchReady: false;
  browserWritesEnabled: 0;
  externalWritesEnabled: 0;
  counts: {
    total: number;
    localEvidenceReady: number;
    blockedBeforeLive: number;
    launchEvidenceChecks: number;
  };
  items: ProductionLaunchGateItem[];
  launchEvidenceChecks: ProductionLaunchEvidenceCheck[];
  finalReviewPrompt: string;
};

export function getProductionLaunchGate(
  actor: LocalActorContext,
): ProductionLaunchGate {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadGate: false,
      title: "Production launch gate hidden for this role",
      verdict: "not_live_ready",
      summary:
        "Production launch gating is an HQ/security review surface, not a chapter operating view.",
      launchReady: false,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      counts: {
        total: 0,
        localEvidenceReady: 0,
        blockedBeforeLive: 0,
        launchEvidenceChecks: 0,
      },
      items: [],
      launchEvidenceChecks: [],
      finalReviewPrompt: "",
    };
  }

  const items = productionLaunchGateItems;
  const launchEvidenceChecks = getProductionLaunchEvidenceChecks();

  return {
    canReadGate: true,
    title: getTitle(actor),
    verdict: "not_live_ready",
    summary:
      "This gate gathers the deployed evidence that exists today and the exact evidence still missing before myMEDLIFE can move from production deployment to a 30-chapter live rollout.",
    launchReady: false,
    browserWritesEnabled: 0,
    externalWritesEnabled: 0,
    counts: {
      total: items.length,
      localEvidenceReady: items.filter((item) => item.status === "local_evidence_ready")
        .length,
      blockedBeforeLive: items.filter((item) => item.status === "blocked_before_live")
        .length,
      launchEvidenceChecks: launchEvidenceChecks.length,
    },
    items,
    launchEvidenceChecks,
    finalReviewPrompt:
      "Approve a live pilot only after every blocked gate has named evidence, owner sign-off, rollback, and a current smoke test. Until then, keep production writes and external sends disabled.",
  };
}

export function getProductionLaunchEvidenceChecks(): ProductionLaunchEvidenceCheck[] {
  return [
    {
      key: "production_domain_dns",
      label: "Production domain DNS",
      ownerLane: "Platform and DNS",
      status: "missing_before_pilot",
      requiredEvidence:
        "`www.mymedlife.org` points to Vercel, no longer serves GoDaddy parking, and `pnpm production:domain https://www.mymedlife.org` reports READY.",
      reviewRoute: "/admin/environment-setup",
      acceptanceSignal:
        "Vercel verifies `mymedlife.org` and `www.mymedlife.org`, and `/login` serves the myMEDLIFE app copy on the public domain.",
      blockedUntil:
        "GoDaddy DNS parking records are removed, Vercel DNS records are live, and the production domain readiness check is green.",
    },
    {
      key: "thirty_chapter_rollout_packet",
      label: "30-chapter rollout packet",
      ownerLane: "Launch Operations and DS",
      status: "missing_before_pilot",
      requiredEvidence:
        "A real production packet for at least 30 active chapters passes `pnpm rollout:check`, and `pnpm rollout:handoff` is reviewed before production Auth users or app rows are created.",
      reviewRoute: "/admin/master-data",
      acceptanceSignal:
        "The packet has real users, chapters, approved memberships, staff roles, coach assignments, launch campaigns, no fake emails, and no secret-like fields.",
      blockedUntil:
        "The 30-chapter packet and handoff are approved, applied through the approved production path, and signed-in role readback passes.",
    },
    {
      key: "staging_url",
      label: "Staging deployment URL",
      ownerLane: "Engineering",
      status: "missing_before_pilot",
      requiredEvidence:
        "A stable staging URL for the release branch that Nick, HQ, DS, and security can open.",
      reviewRoute: "/admin/launch-gate",
      acceptanceSignal:
        "The staging URL renders `/admin`, `/admin/design-qa`, `/admin/nick-review`, `/rush-month`, and `/offline` with the expected local-review posture.",
      blockedUntil: "Staging URL and release branch ownership are approved.",
    },
    {
      key: "staging_supabase",
      label: "Staging Supabase posture",
      ownerLane: "Data and Security",
      status: "missing_before_pilot",
      requiredEvidence:
        "Staging Supabase project, migration state, seed strategy, anon/service key handling, and network restrictions reviewed.",
      reviewRoute: "/admin/database-security",
      acceptanceSignal:
        "DS/security signs off that staging mirrors approved schema/RLS decisions without exposing service keys.",
      blockedUntil: "Staging Supabase, schema, and key handling are approved.",
    },
    {
      key: "auth_callbacks",
      label: "Auth callback and role routing",
      ownerLane: "Security and Student Access",
      status: "missing_before_pilot",
      requiredEvidence:
        "Approved callback URLs, invite flow, profile creation flow, role assignment rules, Goal 157 auth preflight sign-off, and restricted-state review.",
      reviewRoute: "/onboarding",
      acceptanceSignal:
        "A staging actor signs in through approved auth, lands in the correct role-scoped view without local preview email, and matches the preflight evidence.",
      blockedUntil: "Production auth and role routing are approved.",
    },
    {
      key: "rls_ci",
      label: "RLS and CI proof",
      ownerLane: "Data and Security",
      status: "missing_before_pilot",
      requiredEvidence:
        "Green app checks and Docker-backed Supabase/RLS tests for the release branch.",
      reviewRoute: "/admin/system-health",
      acceptanceSignal:
        "CI proves the release branch and RLS/security tests pass before any staging write promotion.",
      blockedUntil: "CI and Supabase/RLS validation are green on the release branch.",
    },
    {
      key: "proof_storage",
      label: "Proof storage and consent",
      ownerLane: "Proof Library and HQ Review",
      status: "missing_before_pilot",
      requiredEvidence:
        "Storage bucket policy, file limits, consent copy, deletion policy, moderation path, and disabled public-sharing default.",
      reviewRoute: "/proof-library/upload",
      acceptanceSignal:
        "HQ/security approves proof storage and confirms public sharing stays disabled until separately approved.",
      blockedUntil: "Proof storage, consent, and moderation policies are approved.",
    },
    {
      key: "device_qa_signoff",
      label: "Device, PWA, and accessibility QA sign-off",
      ownerLane: "Product Design and Launch",
      status: "missing_before_pilot",
      requiredEvidence:
        "Completed Goal 146 mobile visual checks, Goal 148 accessibility checks, and Goal 149 device/PWA matrix on staging.",
      reviewRoute: "/admin/design-qa",
      acceptanceSignal:
        "Reviewer records device, browser, route, issue, pass/fail, and owner for every launch-blocking visual/accessibility/PWA item.",
      blockedUntil: "Design, accessibility, device, and staging QA are approved.",
    },
    {
      key: "monitoring_backup",
      label: "Monitoring, backup, and incident owner",
      ownerLane: "Platform and Security",
      status: "missing_before_pilot",
      requiredEvidence:
        "Monitoring destination, alert owner, backup posture, rollback command/path, and incident escalation channel approved.",
      reviewRoute: "/admin/operations",
      acceptanceSignal:
        "Operations owners can name who gets paged, how rollback works, and what data is backed up before pilot launch.",
      blockedUntil: "Monitoring, backup, rollback, and incident ownership are approved.",
    },
    {
      key: "outbox_integration_hold",
      label: "External integration hold",
      ownerLane: "Data Solutions",
      status: "missing_before_pilot",
      requiredEvidence:
        "Explicit confirmation that HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes remain disabled for pilot.",
      reviewRoute: "/admin/integration-outbox",
      acceptanceSignal:
        "DS confirms outbox/integration records are review-only and no external destination can send during the pilot.",
      blockedUntil: "Integration hold and future approval path are documented.",
    },
    {
      key: "pilot_support_owner",
      label: "Pilot support owner and stop rules",
      ownerLane: "Launch and HQ Operations",
      status: "missing_before_pilot",
      requiredEvidence:
        "Named pilot group, day-one support owner, coach support lane, stop conditions, and student communication plan.",
      reviewRoute: "/admin/pilot-scope",
      acceptanceSignal:
        "Nick/HQ can name the exact pilot group, support owner, rollback/stop rule, and communication path before invitations.",
      blockedUntil: "Pilot scope, support ownership, and stop rules are approved.",
    },
  ];
}

const productionLaunchGateItems: ProductionLaunchGateItem[] = [
  {
    key: "production_auth",
    label: "Production auth and onboarding",
    ownerLane: "Security and Student Access",
    status: "blocked_before_live",
    localEvidence:
      "Local fake actor previews, localhost Supabase Auth seed-user mapping, a read-only onboarding readiness route, the Goal 157 production auth preflight, the Goal 160 membership approval packet, and Goal 161 membership approval result states exist for reviewer roles.",
    missingLiveEvidence: [
      "Production Supabase Auth project and callback URLs approved.",
      "Goal 157 callback, role coverage, profile mapping, join approval, chapter role, coach scope, staff scope, audit/outbox, and rollback evidence signed off.",
      "Invite, join request, membership approval, and staff role assignment rules approved.",
      "Server-side actor context derives from auth identity, not local preview email.",
    ],
    reviewRoutes: [
      "/login",
      "/onboarding",
      "/admin/launch-gate",
      "/chapter/members",
    ],
    approvalRequired:
      "Nick, engineering, and security must approve before real users sign in.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "rls_security",
    label: "RLS and schema security",
    ownerLane: "Data and Security",
    status: "blocked_before_live",
    localEvidence:
      "Supabase migrations, helper functions, seed data, local write functions, RLS/security tests, and a database security decision packet exist for the first Rush Month slices.",
    missingLiveEvidence: [
      "DS/security signs off on the Supabase versus PlanetScale/MySQL decision packet.",
      "Full migration review against production schema.",
      "GitHub CI green for RLS/security tests on the release branch.",
      "Direct table writes remain blocked outside approved RPC functions.",
    ],
    reviewRoutes: [
      "/admin/launch-gate",
      "/admin/database-security",
      "/admin/first-write",
      "/admin/write-sequence",
    ],
    approvalRequired:
      "Security review must sign off before production data is writable.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "write_promotion",
    label: "Guarded write promotion",
    ownerLane: "App and Data",
    status: "blocked_before_live",
    localEvidence:
      "Seven localhost-only write candidates are modeled with result states, audit intent, disabled outbox posture, and role-specific review packets.",
    missingLiveEvidence: [
      "Choose the first production write path and rollback owner.",
      "Confirm success, error, and duplicate-submission states in staging.",
      "Promote one write at a time after auth/RLS proof is current.",
    ],
    reviewRoutes: [
      "/admin/write-sequence",
      "/admin/proof-write",
      "/admin/hq-proof-write",
      "/admin/assignment-write",
      "/admin/coach-write",
    ],
    approvalRequired:
      "Nick must approve each write path before a live control is enabled.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "proof_storage",
    label: "Proof upload, storage, and consent",
    ownerLane: "Proof Library and HQ Review",
    status: "blocked_before_live",
    localEvidence:
      "Proof metadata, Goal 158 proof submission packet, Goal 159 proof storage intake packet, HQ sharing posture, disabled upload intake, and proof-review routes exist.",
    missingLiveEvidence: [
      "Supabase Storage buckets, file limits, and virus/content review policy approved.",
      "Consent, public/private sharing, and deletion rules approved.",
      "Upload UI tested with failure, retry, and moderation states.",
    ],
    reviewRoutes: ["/proof-library", "/proof-library/upload", "/rush-month/evidence"],
    approvalRequired:
      "HQ proof and security owners must approve before files are uploaded.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "campaign_templates",
    label: "Campaign template writes",
    ownerLane: "Campaign Operations",
    status: "local_evidence_ready",
    localEvidence:
      "All seven required non-Rush campaign shells have read-only local plans with phases, roles, KPI signals, structured events, proof prompts, closeout checks, and disabled outbox destinations.",
    missingLiveEvidence: [
      "Database-backed campaign template workflow approved.",
      "Staff-only template editing permissions and audit payloads designed.",
      "Production write path chosen after core Rush Month writes are stable.",
    ],
    reviewRoutes: [
      "/campaigns",
      "/campaigns/planning-goal-setting",
      "/campaigns/chapter-engagement",
      "/campaigns/slt-promotion",
      "/campaigns/moving-mountains",
      "/campaigns/leadership-transition",
      "/campaigns/grow-the-movement",
      "/campaigns/start-a-chapter",
    ],
    approvalRequired:
      "Campaign template writes wait until the core operating loop is live-safe.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "integration_outbox",
    label: "Integration outbox and external automation",
    ownerLane: "Data Solutions",
    status: "blocked_before_live",
    localEvidence:
      "IntegrationEvent, AutomationOutbox, AuditLog, disabled destinations, and DS Admin outbox views are visible locally.",
    missingLiveEvidence: [
      "n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, and AI contracts approved.",
      "Retry, idempotency, dead-letter, and manual recovery rules documented.",
      "First production app loop proves app truth before any external write consumes it.",
    ],
    reviewRoutes: [
      "/admin/launch-gate",
      "/admin/integration-outbox",
      "/rush-month/dashboard",
      "/rush-month/events",
      "/rush-month/evidence",
    ],
    approvalRequired:
      "External writes stay disabled until DS and Nick approve them one destination at a time.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "audit_observability",
    label: "Audit and system observability",
    ownerLane: "Security and Operations",
    status: "blocked_before_live",
    localEvidence:
      "Admin audit log review, system health review, and the production operations runbook exist for local launch review.",
    missingLiveEvidence: [
      "Every approved write path proves persisted actor, target, before/after value, reason, and timestamp readback in staging.",
      "System health review is updated with staging and production monitor owners.",
      "Rollback and incident contacts are recorded alongside the launch packet.",
    ],
    reviewRoutes: [
      "/admin/launch-gate",
      "/admin/audit-log",
      "/admin/system-health",
      "/admin/operations",
    ],
    approvalRequired:
      "Operations and security owners must sign off before pilot writes or invites begin.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "pilot_operations",
    label: "Pilot scope and day-one operations",
    ownerLane: "Launch and HQ Operations",
    status: "blocked_before_live",
    localEvidence:
      "Pilot scope route, stakeholder review plan, review-path docs, and the production operations runbook exist locally.",
    missingLiveEvidence: [
      "Exact pilot group, launch day owner, support channel, and coach escalation flow named.",
      "Student comms, support hours, and stop conditions approved.",
      "Issue triage and rollback path rehearsed against staging.",
    ],
    reviewRoutes: [
      "/admin/launch-gate",
      "/admin/pilot-scope",
      "/admin/review-path",
      "/admin/operations",
    ],
    approvalRequired:
      "Nick and HQ operations must approve the pilot scope before any live invites go out.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
];

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin production launch gate";
    case "ds_admin":
      return "DS Admin production launch and integration gate";
    case "super_admin":
      return "Full production launch gate";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Production launch gate hidden for this role";
  }
}
