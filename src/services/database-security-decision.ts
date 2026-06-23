import type { LocalActorContext } from "@/services/local-actor-context";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type DatabaseDecisionStatus =
  | "preferred_for_mvp"
  | "reviewed_tradeoff"
  | "approval_required";

export type DatabaseSecurityControlStatus =
  | "local_evidence_ready"
  | "approval_required";

export type DatabasePlatformComparison = {
  key: string;
  label: string;
  status: DatabaseDecisionStatus;
  fit: string;
  securityImpact: string;
  tradeoff: string;
};

export type DatabaseSecurityControl = {
  key: string;
  label: string;
  ownerLane: string;
  status: DatabaseSecurityControlStatus;
  localEvidence: string;
  requiredBeforeLive: string;
};

export type DatabaseSecurityDecisionPacket = {
  canReadPacket: boolean;
  title: string;
  verdict: "keep_supabase_for_mvp_not_live_approved";
  recommendedStack: "Supabase Postgres/Auth/Storage";
  alternativeReviewed: "PlanetScale MySQL/Vitess";
  summary: string;
  decision: string;
  liveLaunchReady: false;
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  counts: {
    platformsReviewed: number;
    localEvidenceReady: number;
    approvalRequired: number;
  };
  comparisons: DatabasePlatformComparison[];
  controls: DatabaseSecurityControl[];
  nextApprovalPrompt: string;
};

export function getDatabaseSecurityDecisionPacket(
  actor: LocalActorContext,
): DatabaseSecurityDecisionPacket {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadPacket: false,
      title: "Database security decision hidden for this role",
      verdict: "keep_supabase_for_mvp_not_live_approved",
      recommendedStack: "Supabase Postgres/Auth/Storage",
      alternativeReviewed: "PlanetScale MySQL/Vitess",
      summary:
        "Database security review is an HQ and DS Admin launch-readiness surface.",
      decision: "",
      liveLaunchReady: false,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      counts: {
        platformsReviewed: 0,
        localEvidenceReady: 0,
        approvalRequired: 0,
      },
      comparisons: [],
      controls: [],
      nextApprovalPrompt: "",
    };
  }

  return {
    canReadPacket: true,
    title: getTitle(surfaceFamily),
    verdict: "keep_supabase_for_mvp_not_live_approved",
    recommendedStack: "Supabase Postgres/Auth/Storage",
    alternativeReviewed: "PlanetScale MySQL/Vitess",
    summary:
      "This packet turns the DS database concern into a concrete review gate: keep the approved Supabase stack for the MVP, document the PlanetScale/MySQL tradeoffs, and block live launch until DS/security evidence is signed off.",
    decision:
      "Recommendation: keep Supabase Postgres/Auth/Storage for the MVP because the current app, schema plan, RLS tests, proof-storage path, and audit/outbox posture are already built around database-enforced chapter and role boundaries. Treat PlanetScale MySQL as a future architecture choice only if the team accepts an authorization rewrite and a new proof-storage design.",
    liveLaunchReady: false,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    counts: {
      platformsReviewed: databasePlatformComparisons.length,
      localEvidenceReady: databaseSecurityControls.filter(
        (item) => item.status === "local_evidence_ready",
      ).length,
      approvalRequired: databaseSecurityControls.filter(
        (item) => item.status === "approval_required",
      ).length,
    },
    comparisons: databasePlatformComparisons,
    controls: databaseSecurityControls,
    nextApprovalPrompt:
      "Before live launch, DS/security should review this packet with the schema/RLS plan, confirm BAA/HIPAA posture if PHI/ePHI is in scope, approve service-key handling, and rerun RLS/security tests on the release branch.",
  };
}

const databasePlatformComparisons: DatabasePlatformComparison[] = [
  {
    key: "supabase_postgres_rls",
    label: "Supabase Postgres and RLS",
    status: "preferred_for_mvp",
    fit:
      "Best fit for chapter-scoped membership, role-based visibility, assignment/proof review, and future audit readback.",
    securityImpact:
      "Authorization can be enforced in the database with default-deny RLS, small helper functions, and tested RPC write paths.",
    tradeoff:
      "RLS must be reviewed like application code. Missing or overly broad policies are launch blockers.",
  },
  {
    key: "supabase_auth_storage",
    label: "Supabase Auth and Storage",
    status: "preferred_for_mvp",
    fit:
      "Matches the existing auth/onboarding plan and the proof-library upload path.",
    securityImpact:
      "Auth identity can flow into RLS, and storage objects can be protected with storage policies before uploads are enabled.",
    tradeoff:
      "Proof upload buckets, file limits, consent, moderation, and service-key use still need DS/security approval.",
  },
  {
    key: "planetscale_mysql",
    label: "PlanetScale MySQL/Vitess",
    status: "reviewed_tradeoff",
    fit:
      "Strong managed database option, especially when the product needs MySQL/Vitess scale and schema workflow.",
    securityImpact:
      "The app would need to own more chapter and role authorization logic instead of leaning on Postgres RLS policies.",
    tradeoff:
      "Switching now would rewrite migrations, data access, auth assumptions, RLS tests, and proof-storage design.",
  },
  {
    key: "app_layer_authorization",
    label: "Application-layer authorization rewrite",
    status: "approval_required",
    fit:
      "Possible, but it changes the security ownership model and the test surface for every role-scoped query and write.",
    securityImpact:
      "Every route, query, server action, and background job would need explicit chapter/role filters and regression tests.",
    tradeoff:
      "This is a major architecture project, not a low-risk database swap for the MVP.",
  },
];

const databaseSecurityControls: DatabaseSecurityControl[] = [
  {
    key: "approved_stack_boundary",
    label: "Approved stack boundary",
    ownerLane: "Product and Engineering",
    status: "local_evidence_ready",
    localEvidence:
      "Repo guidance, operating brief, migrations, local auth, and write gates are built around Next.js, Supabase, and Vercel.",
    requiredBeforeLive:
      "Do not change vendors without a signed architecture decision and migration plan.",
  },
  {
    key: "chapter_scoped_rls",
    label: "Chapter-scoped RLS",
    ownerLane: "Data and Security",
    status: "approval_required",
    localEvidence:
      "Local migrations and pgTAP-style tests cover the first chapter, role, assignment, proof, outbox, and audit boundaries.",
    requiredBeforeLive:
      "DS/security must review all production policies, helper functions, grants, and direct-write denials.",
  },
  {
    key: "audited_rpc_writes",
    label: "Audited RPC write paths",
    ownerLane: "App and Data",
    status: "local_evidence_ready",
    localEvidence:
      "The MVP write pattern uses narrow database functions, audit intent, integration events, and disabled outbox rows.",
    requiredBeforeLive:
      "Promote one production write at a time after auth identity, RLS proof, rollback, and readback evidence are current.",
  },
  {
    key: "service_key_handling",
    label: "Service key handling",
    ownerLane: "Platform and Security",
    status: "approval_required",
    localEvidence:
      "Admin safety surfaces show no secrets and production service-role usage remains disabled.",
    requiredBeforeLive:
      "Service-role keys must stay server-only, never appear in browser bundles, and have rotation and incident ownership.",
  },
  {
    key: "proof_storage",
    label: "Proof storage and consent",
    ownerLane: "Proof Library and HQ Review",
    status: "approval_required",
    localEvidence:
      "Proof metadata and disabled upload-readiness routes exist, but no file upload is enabled.",
    requiredBeforeLive:
      "Approve buckets, storage policies, file limits, consent, moderation, deletion, and retry behavior.",
  },
  {
    key: "compliance_contracts",
    label: "Compliance and vendor contracts",
    ownerLane: "DS Admin and Security",
    status: "approval_required",
    localEvidence:
      "The local MVP avoids live production data and keeps real external integrations disabled.",
    requiredBeforeLive:
      "Confirm whether PHI/ePHI is in scope and complete BAA, DPA, data-retention, and access-review decisions.",
  },
  {
    key: "migration_cost",
    label: "Switching cost control",
    ownerLane: "Engineering",
    status: "approval_required",
    localEvidence:
      "PlanetScale/MySQL has been reviewed as a tradeoff, not as a current MVP blocker.",
    requiredBeforeLive:
      "If DS still wants MySQL, scope a separate architecture review before rewriting schema, auth, proof storage, and tests.",
  },
];

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Admin database security decision";
    case "ds_admin":
      return "DS Admin database security decision";
    case "super_admin":
      return "Full database security decision";
    case "member":
    case "leader":
    case "coach":
      return "Database security decision hidden for this role";
  }
}
