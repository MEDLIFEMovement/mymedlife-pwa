import type { EventLoopReadModel } from "@/services/event-loop";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getPhase2PilotRegistry } from "@/services/phase-2-pilot-registry";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

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
export type ProductionEnvironmentReadinessStatus = "missing_before_pilot";

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

export type ProductionEnvironmentReadinessItem = {
  key:
    | "production_supabase_project"
    | "production_vercel_environment"
    | "production_env_vars"
    | "rollout_control_layer"
    | "auth_callback_urls"
    | "dns_domain_plan"
    | "backup_restore_path"
    | "rollback_support_owners";
  label: string;
  ownerLane: string;
  status: ProductionEnvironmentReadinessStatus;
  requiredEvidence: string[];
  safeDefaults: string[];
  envVarManifest?: {
    label: string;
    names: string[];
  }[];
  blockedUntil: string;
  secretsShown: 0;
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
    environmentReadinessItems: number;
  };
  items: ProductionLaunchGateItem[];
  launchEvidenceChecks: ProductionLaunchEvidenceCheck[];
  environmentReadiness: ProductionEnvironmentReadinessItem[];
  finalReviewPrompt: string;
};

export function getProductionLaunchGate(
  actor: LocalActorContext,
  env: Record<string, string | undefined> = process.env,
  options: {
    lumaReadModel?: EventLoopReadModel;
  } = {},
): ProductionLaunchGate {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
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
        environmentReadinessItems: 0,
      },
      items: [],
      launchEvidenceChecks: [],
      environmentReadiness: [],
      finalReviewPrompt: "",
    };
  }

  const pilotRegistry = getPhase2PilotRegistry(env);
  const items = getProductionLaunchGateItems(pilotRegistry);
  const launchEvidenceChecks = getProductionLaunchEvidenceChecks(
    pilotRegistry,
    options.lumaReadModel,
  );
  const environmentReadiness = getProductionEnvironmentReadinessItems(pilotRegistry);
  const lumaProofMissing = isHostedLumaPointsProofMissing(options.lumaReadModel);

  return {
    canReadGate: true,
    title: getTitle(surfaceFamily),
    verdict: "not_live_ready",
    summary:
      lumaProofMissing
        ? "This gate gathers the local evidence that exists today and the exact evidence still missing before myMEDLIFE can move from local MVP review to a live student pilot. The sharpest remaining loop blocker is still a hosted Luma proof run where the RSVP guest appears in Luma's approved guest list, then a real host-side check-in flows through attendance import into points and leaderboard readback."
        : "This gate gathers the local evidence that exists today and the exact evidence still missing before myMEDLIFE can move from local MVP review to a live student pilot.",
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
      environmentReadinessItems: environmentReadiness.length,
    },
    items,
    launchEvidenceChecks,
    environmentReadiness,
    finalReviewPrompt:
      lumaProofMissing
        ? "Approve a live pilot only after every blocked gate has named evidence, owner sign-off, rollback, and a current smoke test. Until then, keep production writes and external sends disabled, and do not treat the Luma loop as proven until the RSVP guest is visible in Luma's approved guest list and one checked-in attendee creates points and leaderboard readback."
        : "Approve a live pilot only after every blocked gate has named evidence, owner sign-off, rollback, and a current smoke test. Until then, keep production writes and external sends disabled.",
  };
}

export function getProductionEnvironmentReadinessItems(
  pilotRegistry = getPhase2PilotRegistry(),
): ProductionEnvironmentReadinessItem[] {
  const rollbackOwner = pilotRegistry.owners.find(
    (item) => item.key === "rollback_owner",
  );
  const supportChannel = pilotRegistry.owners.find(
    (item) => item.key === "support_pause_channel",
  );
  const dsOwner = pilotRegistry.owners.find((item) => item.key === "ds_owner");
  const hqOwner = pilotRegistry.owners.find((item) => item.key === "hq_admin_owner");

  return [
    {
      key: "production_supabase_project",
      label: "Production Supabase project",
      ownerLane: "DS / Platform",
      status: "missing_before_pilot",
      requiredEvidence: [
        "Separate production Supabase project reference recorded without printing service keys.",
        "Approved migration list and migration owner named before any hosted production apply.",
        "RLS/security advisor output captured after approved migrations.",
        "Production seed/user provisioning plan limited to the tiny pilot cohort.",
      ],
      safeDefaults: [
        "Staging project remains `rceupryepjgkdeqgxzrc`.",
        "Production project is separate from staging.",
        "No production migration is applied from this packet.",
      ],
      blockedUntil:
        "DS/platform records the production project, migration owner, and security proof.",
      secretsShown: 0,
    },
    {
      key: "production_vercel_environment",
      label: "Production Vercel environment",
      ownerLane: "Platform / Security",
      status: "missing_before_pilot",
      requiredEvidence: [
        "Production Vercel project or production target confirmed for `mymedlife-pwa`.",
        "Production deploy source branch and rollback deployment target recorded.",
        "Vercel SSO / access posture chosen for pilot reviewers and real users.",
      ],
      safeDefaults: [
        "Preview branch deployments remain the review lane.",
        "Production env vars stay unset until approved.",
        "No production promotion is performed by this packet.",
      ],
      blockedUntil:
        "Platform owner confirms production Vercel target, deploy source, and rollback target.",
      secretsShown: 0,
    },
    {
      key: "production_env_vars",
      label: "Production environment variables",
      ownerLane: "DS / Platform",
      status: "missing_before_pilot",
      requiredEvidence: [
        "`NEXT_PUBLIC_SUPABASE_URL` points to production Supabase.",
        "`NEXT_PUBLIC_SUPABASE_ANON_KEY` is the production browser-safe key.",
        "Server-only Supabase service key is set without `NEXT_PUBLIC_`.",
        "`MYMEDLIFE_CONTROL_LAYER_SOURCE=supabase` is set only after production control-layer migration approval.",
        "Luma pilot variables are scoped to the approved pilot calendar only.",
      ],
      safeDefaults: [
        "Never expose service role, Luma API, HubSpot, n8n, warehouse, Power BI, SMS/email, or AI keys through `NEXT_PUBLIC_`.",
        "Keep non-approved integration env vars unset/off.",
        "Record presence and scope only; do not paste secret values into docs, PRs, Linear, or logs.",
      ],
      envVarManifest: [
        {
          label: "Browser-safe public values",
          names: [
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          ],
        },
        {
          label: "Server-only Supabase values",
          names: [
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_DB_URL",
          ],
        },
        {
          label: "App data and control-layer mode",
          names: [
            "MYMEDLIFE_DATA_SOURCE",
            "MYMEDLIFE_CONTROL_LAYER_SOURCE",
            "MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH",
          ],
        },
        {
          label: "Approved Luma pilot only",
          names: [
            "LUMA_API_KEY",
            "LUMA_CALENDAR_ID",
            "MYMEDLIFE_LUMA_ENVIRONMENT",
            "MYMEDLIFE_ENABLE_LUMA_WRITES",
            "MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES",
            "MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES",
            "MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT",
          ],
        },
        {
          label: "External systems held off",
          names: [
            "HUBSPOT_*",
            "N8N_*",
            "WAREHOUSE_*",
            "POWER_BI_*",
            "OPENAI_API_KEY",
            "SMS_*",
            "EMAIL_*",
          ],
        },
      ],
      blockedUntil:
        "DS/platform confirms production env-var names, scopes, and secret ownership.",
      secretsShown: 0,
    },
    {
      key: "rollout_control_layer",
      label: "Rollout control layer readiness",
      ownerLane: "DS / Platform",
      status: "missing_before_pilot",
      requiredEvidence: [
        "The rollout-controls migration is applied in the target environment so `app.feature_flags`, `app.theme_settings`, and the audited write functions are readable.",
        "`/admin/feature-flags` and `/admin/theme` render without the persistence warning in the target environment.",
        "One DS/Admin feature-flag save and one theme-token save record visible audit rows before the environment is treated as control-layer ready.",
        "`MYMEDLIFE_CONTROL_LAYER_SOURCE=supabase` is enabled only after DS/Admin control-layer read/write proof is captured.",
      ],
      safeDefaults: [
        "Keep the app on default or env fallback posture until the rollout-control migration is readable there.",
        "Do not treat `Supabase-backed` UI copy alone as proof; the pages must stop showing the persistence warning.",
        "Production remains blocked if reviewers cannot read or audit the feature-flag and theme tables in that environment.",
      ],
      blockedUntil:
        "DS/platform applies the rollout-controls migration in the target environment and captures the DS/Admin persistence proof.",
      secretsShown: 0,
    },
    {
      key: "auth_callback_urls",
      label: "Auth callback URLs and role routing",
      ownerLane: "Security / Student Access",
      status: "missing_before_pilot",
      requiredEvidence: [
        "Production callback URL for `https://www.mymedlife.org` approved.",
        "Staging callback URL for `https://staging.mymedlife.org` stays separate.",
        "Role-routing smoke proves member, leader, staff, DS Admin, Super Admin, and eligible traveler paths.",
        "Wrong-workspace URL access is blocked server-side.",
      ],
      safeDefaults: [
        "One sign-in surface remains the entry point.",
        "Backend role/scope decides the destination after auth.",
        "Staff preview remains read-only unless separately approved.",
      ],
      blockedUntil:
        "Security and student-access owners approve callbacks and role-routing proof.",
      secretsShown: 0,
    },
    {
      key: "dns_domain_plan",
      label: "DNS and domain plan",
      ownerLane: "Platform / HQ",
      status: "missing_before_pilot",
      requiredEvidence: [
        "`staging.mymedlife.org` remains the reviewer target until production cutover.",
        "`www.mymedlife.org` production DNS owner and registrar access are named.",
        "Cutover, rollback, and cache/DNS propagation plan are documented.",
      ],
      safeDefaults: [
        "Do not repoint production DNS from this packet.",
        "Keep staging and production hostnames visibly separate.",
        "Record DNS owner and rollback target before pilot invites.",
      ],
      blockedUntil:
        "Platform/HQ confirms DNS owner, cutover plan, and rollback route.",
      secretsShown: 0,
    },
    {
      key: "backup_restore_path",
      label: "Backup and restore path",
      ownerLane: "DS / Platform",
      status: "missing_before_pilot",
      requiredEvidence: [
        "Production Supabase backup posture confirmed.",
        "Restore drill owner named.",
        "Pilot data repair path documented for assignment, RSVP, attendance, points, and audit rows.",
      ],
      safeDefaults: [
        "Do not invite real users until backup posture is named.",
        "Do not enable irreversible writes without a repair path.",
        "Keep production proof uploads disabled until storage restore policy is approved.",
      ],
      blockedUntil:
        "Backup/restore owner and drill evidence are recorded for the production project.",
      secretsShown: 0,
    },
    {
      key: "rollback_support_owners",
      label: "Rollback and support owners",
      ownerLane: "Launch / HQ Ops / DS",
      status: "missing_before_pilot",
      requiredEvidence: [
        `Rollback owner: ${rollbackOwner?.value ?? "pending"}.`,
        `Support/pause channel: ${supportChannel?.value ?? "pending"}.`,
        `DS owner: ${dsOwner?.value ?? "pending"}.`,
        `HQ/admin owner: ${hqOwner?.value ?? "pending"}.`,
        "Stop rules and student communication plan are recorded before invitations.",
      ],
      safeDefaults: [
        "Pilot owner and rollback owner stay visible in the launch packet.",
        "One support/pause channel is used during the pilot.",
        "No broad launch happens without day-one support coverage.",
      ],
      blockedUntil:
        "Named launch owners, stop rules, and support coverage are recorded.",
      secretsShown: 0,
    },
  ];
}

export function getProductionLaunchEvidenceChecks(
  pilotRegistry = getPhase2PilotRegistry(),
  lumaReadModel?: EventLoopReadModel,
): ProductionLaunchEvidenceCheck[] {
  const pilotChapter = pilotRegistry.defaults.find(
    (item) => item.key === "pilot_chapter",
  );
  const supportChannel = pilotRegistry.owners.find(
    (item) => item.key === "support_pause_channel",
  );
  const rollbackOwner = pilotRegistry.owners.find(
    (item) => item.key === "rollback_owner",
  );

  return [
    {
      key: "staging_url",
      label: "Staging deployment URL",
      ownerLane: "Engineering",
      status: "missing_before_pilot",
      requiredEvidence:
        "A stable staging URL for the release branch that Nick, HQ, DS, and security can open, plus an approved reviewer access path if the hostname currently redirects through Vercel SSO into `/login?next=/sso-api...`.",
      reviewRoute: "/admin/launch-gate",
      acceptanceSignal:
        "The staging URL renders `/admin`, `/admin/design-qa`, `/admin/nick-review`, `/rush-month`, and `/offline` with the expected local-review posture, and reviewers know how to pass the current Vercel-SSO-to-login staging gate.",
      blockedUntil: "Staging URL, reviewer access path, and release branch ownership are approved.",
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
        "Approved callback URLs, invite flow, profile creation flow, role assignment rules, Goal 157 auth preflight sign-off, restricted-state review, and an explicit decision on the current Vercel-SSO-gated staging access path.",
      reviewRoute: "/onboarding",
      acceptanceSignal:
        "A staging actor passes the approved staging access path, signs in through approved auth, lands in the correct role-scoped view without local preview email, and matches the preflight evidence.",
      blockedUntil: "Production auth, role routing, and the staging access path are approved.",
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
      key: "luma_event_loop",
      label: "Luma event, RSVP, attendance, and points loop",
      ownerLane: "Events, Data Solutions, and Launch",
      status: "missing_before_pilot",
      requiredEvidence: getLumaLaunchRequiredEvidence(lumaReadModel),
      reviewRoute: "/admin/luma-live-pilot",
      acceptanceSignal: getLumaLaunchAcceptanceSignal(lumaReadModel),
      blockedUntil: getLumaLaunchBlockedUntil(lumaReadModel),
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
      label: "External integration hold outside Luma event loop",
      ownerLane: "Data Solutions",
      status: "missing_before_pilot",
      requiredEvidence:
        "Explicit confirmation that HubSpot, n8n, warehouse, Power BI, SMS, email, AI writes, and any non-approved Luma behavior remain disabled for pilot.",
      reviewRoute: "/admin/integration-outbox",
      acceptanceSignal:
        "DS confirms outbox/integration records are review-only, the Luma pilot path is the only approved external-family exception under review, and no other external destination can send during the pilot.",
      blockedUntil: "Integration hold and future approval path are documented.",
    },
    {
      key: "pilot_support_owner",
      label: "Pilot support owner and stop rules",
      ownerLane: "Launch and HQ Operations",
      status: "missing_before_pilot",
      requiredEvidence:
        pilotChapter?.status === "recorded_final" ||
        supportChannel?.status === "recorded_owner" ||
        rollbackOwner?.status === "recorded_owner"
          ? `Recorded pilot defaults now need final launch evidence: pilot group ${pilotChapter?.value ?? "still pending"}, support/pause channel ${supportChannel?.value ?? "still pending"}, rollback owner ${rollbackOwner?.value ?? "still pending"}, plus coach support lane, stop conditions, and student communication plan.`
          : "Named pilot group, day-one support owner, coach support lane, stop conditions, and student communication plan.",
      reviewRoute: "/admin/pilot-scope",
      acceptanceSignal:
        "Nick/HQ can name the exact pilot group, support owner, rollback/stop rule, and communication path before invitations.",
      blockedUntil: "Pilot scope, support ownership, and stop rules are approved.",
    },
  ];
}

function isHostedLumaPointsProofMissing(
  lumaReadModel?: EventLoopReadModel,
) {
  if (!lumaReadModel) {
    return true;
  }

  return !(
    lumaReadModel.summary.attendanceCount > 0 &&
    lumaReadModel.summary.pointsAwarded > 0
  );
}

function getLumaLaunchRequiredEvidence(
  lumaReadModel?: EventLoopReadModel,
) {
  if (!lumaReadModel) {
    return "Hosted staging proof that /admin/luma-live-pilot shows Proof rows as Ready, then myMEDLIFE can create or update the approved Luma event, write a member RSVP to Luma, verify that guest appears in Luma's approved guest list, import approved attendance from Luma, and show points plus chapter/organization leaderboard readback without exposing Luma secrets.";
  }

  if (isHostedLumaPointsProofMissing(lumaReadModel)) {
    return `Hosted staging already shows the Luma event and RSVP path, but the review run still needs /admin/luma-live-pilot to stay in the Proof rows Ready posture while the RSVP guest is verified in Luma's approved guest list and one real host-side Luma check-in flows through attendance import into points and chapter/organization leaderboard readback. Current staging summary: ${lumaReadModel.summary.rsvpCount} RSVP(s), ${lumaReadModel.summary.attendanceCount} attendance row(s), ${lumaReadModel.summary.pointsAwarded} point(s).`;
  }

  return `Hosted staging shows the approved Luma loop with Proof rows Ready, ${lumaReadModel.summary.rsvpCount} RSVP(s), ${lumaReadModel.summary.attendanceCount} attendance row(s), and ${lumaReadModel.summary.pointsAwarded} point(s). Reviewers still need the final launch packet, owner signoff, and rollback proof before a live pilot invite.`;
}

function getLumaLaunchAcceptanceSignal(
  lumaReadModel?: EventLoopReadModel,
) {
  if (!lumaReadModel || isHostedLumaPointsProofMissing(lumaReadModel)) {
    return "Reviewers can see Proof rows Ready plus the event id, RSVP count, verified approved-guest evidence, attendance import count, points awarded, leaderboard status, audit/readback notes, and zero unauthorized outbox sends in the staged Luma live-pilot surface after one checked-in attendee has been imported.";
  }

  return `Reviewers can see the staged Luma live-pilot surface with Proof rows Ready, ${lumaReadModel.summary.attendanceCount} attendance row(s), ${lumaReadModel.summary.pointsAwarded} point(s), leaderboard readback, audit notes, and zero unauthorized outbox sends.`;
}

function getLumaLaunchBlockedUntil(
  lumaReadModel?: EventLoopReadModel,
) {
  if (!lumaReadModel || isHostedLumaPointsProofMissing(lumaReadModel)) {
    return "The Luma event loop stays blocked until /admin/luma-live-pilot is running with a signed-in reviewer session and Supabase-backed data, the RSVP guest is proven in Luma's approved guest list, one checked-in attendee is proven on staging, production Luma calendar ownership is approved, and rollback/disable owners are named before any live pilot event uses it.";
  }

  return "The hosted Luma loop evidence exists, but live-pilot use still waits on production Luma calendar ownership, rollback/disable owners, and final launch approval.";
}

function getProductionLaunchGateItems(
  pilotRegistry = getPhase2PilotRegistry(),
): ProductionLaunchGateItem[] {
  const firstHostedWrite = pilotRegistry.defaults.find(
    (item) => item.key === "first_hosted_write",
  );
  const pilotChapter = pilotRegistry.defaults.find(
    (item) => item.key === "pilot_chapter",
  );
  const supportChannel = pilotRegistry.owners.find(
    (item) => item.key === "support_pause_channel",
  );
  const rollbackOwner = pilotRegistry.owners.find(
    (item) => item.key === "rollback_owner",
  );
  const coachOwner = pilotRegistry.owners.find((item) => item.key === "coach_owner");

  return [
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
        firstHostedWrite?.status === "recorded_final" &&
        rollbackOwner?.status === "recorded_owner"
          ? `Run hosted staging proof for ${firstHostedWrite.value} and confirm ${rollbackOwner.value} owns rollback for the first live drill.`
          : "Choose the first production write path and rollback owner.",
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
        "Luma event-loop contract approved for the narrow pilot, while n8n, HubSpot, warehouse, Power BI, SMS, email, and AI contracts remain disabled.",
        "Retry, idempotency, dead-letter, and manual recovery rules documented.",
        firstHostedWrite?.status === "recorded_final"
          ? `First staged app loop proves ${firstHostedWrite.value} as app truth before any external write consumes it.`
          : "First production app loop proves app truth before any external write consumes it.",
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
        rollbackOwner?.status === "recorded_owner"
          ? `Rollback and incident contacts are recorded alongside the launch packet, with ${rollbackOwner.value} as the current rollback owner.`
          : "Rollback and incident contacts are recorded alongside the launch packet.",
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
        pilotChapter?.status === "recorded_final" ||
        supportChannel?.status === "recorded_owner" ||
        coachOwner?.status === "recorded_owner"
          ? `Pilot scope route, stakeholder review plan, review-path docs, and the production operations runbook exist locally. Recorded pilot answers currently name ${pilotChapter?.value ?? "the pilot chapter as pending"}, ${supportChannel?.value ?? "the support channel as pending"}, and ${coachOwner?.value ?? "the coach owner as pending"}.`
          : "Pilot scope route, stakeholder review plan, review-path docs, and the production operations runbook exist locally.",
      missingLiveEvidence: [
        pilotChapter?.status === "recorded_final" &&
        supportChannel?.status === "recorded_owner" &&
        coachOwner?.status === "recorded_owner"
          ? `Final launch evidence still needs the exact pilot group invite list for ${pilotChapter.value}, day-one owner confirmation, and the rehearsed coach escalation flow owned by ${coachOwner.value}.`
          : "Exact pilot group, launch day owner, support channel, and coach escalation flow named.",
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
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Admin production launch gate";
    case "ds_admin":
      return "DS Admin production launch and integration gate";
    case "super_admin":
      return "Full production launch gate";
    case "member":
    case "leader":
    case "coach":
      return "Production launch gate hidden for this role";
  }
}
