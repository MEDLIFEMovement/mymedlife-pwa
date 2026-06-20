import type { Phase2Owner } from "@/services/phase-2-safe-prep";

export type Phase2SecurityGateStatus =
  | "local_evidence_ready"
  | "ds_review_required"
  | "blocked_until_storage_review";

export type Phase2SecurityGateCheck = {
  key: string;
  label: string;
  owners: Phase2Owner[];
  status: Phase2SecurityGateStatus;
  localEvidence: string;
  requiredBeforeLive: string;
};

export type Phase2SecurityEvidenceItem = {
  label: string;
  artifact: string;
  whyItMatters: string;
};

export type Phase2SecurityReleaseGatePacket = {
  title: string;
  summary: string;
  liveSecurityGateOpen: false;
  checks: Phase2SecurityGateCheck[];
  currentEvidence: Phase2SecurityEvidenceItem[];
  blockedLiveActions: string[];
  officialReferences: { label: string; url: string }[];
  counts: {
    localEvidenceReady: number;
    dsReviewRequired: number;
    blockedUntilStorageReview: number;
  };
};

const securityChecks: Phase2SecurityGateCheck[] = [
  {
    key: "schema_exposure_review",
    label: "Schema exposure and Data API grants review",
    owners: ["Kiomi / DS", "Codex"],
    status: "ds_review_required",
    localEvidence:
      "The repo keeps business tables in the `app` schema and already carries schema/RLS planning docs. On June 20, 2026, hosted staging reads proved the staging project also needs `app` exposed alongside `public` and `graphql_public` before signed-in browser or server reads will pass. Supabase's April 2026 change still means any new `public` tables exposed through the Data API need explicit grants plus RLS.",
    requiredBeforeLive:
      "DS/security should confirm which schemas are exposed, whether the staging and future production projects expose `app` for signed-in reads, whether any `public` tables remain reachable, and whether explicit grants are in place for every table that must be reachable via the Data API.",
  },
  {
    key: "rls_enabled_on_app_tables",
    label: "RLS enabled on app tables",
    owners: ["Kiomi / DS"],
    status: "local_evidence_ready",
    localEvidence:
      "Local migrations and pgTAP-style tests cover chapter membership, assignment, proof, audit, and outbox boundaries.",
    requiredBeforeLive:
      "Hosted staging must show RLS enabled on every app table touched by browser or server reads and writes.",
  },
  {
    key: "direct_write_denials",
    label: "Direct table writes are denied",
    owners: ["Kiomi / DS", "Codex"],
    status: "local_evidence_ready",
    localEvidence:
      "The existing local write pattern uses narrow database functions and RLS tests rather than broad client writes.",
    requiredBeforeLive:
      "Staging proof must show direct table writes fail for guarded flows and approved function/RPC paths succeed only for the correct role and chapter scope.",
  },
  {
    key: "audit_persistence",
    label: "Audit rows persist for approved writes",
    owners: ["Kiomi / DS", "Codex"],
    status: "local_evidence_ready",
    localEvidence:
      "Current write slices already model audit and integration-event intent, and the admin audit-log route reads that posture back.",
    requiredBeforeLive:
      "Every promoted write must prove actor, target record, before/after state, and reason are written and readable from the review surface.",
  },
  {
    key: "role_and_chapter_isolation",
    label: "Role and chapter isolation proof",
    owners: ["Kiomi / DS"],
    status: "ds_review_required",
    localEvidence:
      "Local RLS tests already cover multiple role families and chapter-scoped boundaries for the first Rush Month slices.",
    requiredBeforeLive:
      "DS/security needs hosted proof that unrelated members, leaders, coaches, and admins cannot cross chapter boundaries or read private proof and audit records outside approved scope.",
  },
  {
    key: "storage_policy_gate",
    label: "Storage policy gate before proof upload",
    owners: ["Kiomi / DS", "Nick"],
    status: "blocked_until_storage_review",
    localEvidence:
      "The repo carries proof metadata and disabled upload posture, but no live bucket or storage policy is enabled.",
    requiredBeforeLive:
      "Bucket names, path rules, file limits, consent, moderation, deletion, and storage policies must be approved before MED-480 or any private proof upload path moves forward.",
  },
  {
    key: "service_key_boundary",
    label: "Service key stays server-only",
    owners: ["Kiomi / DS"],
    status: "ds_review_required",
    localEvidence:
      "Current local review surfaces do not show secrets, and current browser config only expects public keys.",
    requiredBeforeLive:
      "DS/security should verify that no service-role or secret key is exposed through `NEXT_PUBLIC_` variables, browser bundles, or client logs.",
  },
  {
    key: "ci_evidence_capture",
    label: "CI evidence captured before every write promotion",
    owners: ["Codex", "Kiomi / DS"],
    status: "local_evidence_ready",
    localEvidence:
      "Local and PR review already rely on explicit test counts, build output, and documented security checks.",
    requiredBeforeLive:
      "Each write promotion must attach route, test, audit, and rollback evidence to GitHub and Linear before the next write is approved.",
  },
];

const currentEvidence: Phase2SecurityEvidenceItem[] = [
  {
    label: "Schema and RLS planning",
    artifact: "docs/architecture/supabase-schema-auth-rls-plan.md",
    whyItMatters:
      "Defines the `app` schema, role boundaries, and the starting point for hosted-policy review.",
  },
  {
    label: "Hosted staging schema-exposure proof",
    artifact: "docs/architecture/phase-2-rls-security-release-gate.md",
    whyItMatters:
      "Captures the June 20 staging fix where `app` had to be exposed through PostgREST before signed-in staging reads moved from 406 failures to 200 success.",
  },
  {
    label: "RLS test plan",
    artifact: "docs/testing/rls-test-plan.md",
    whyItMatters:
      "Explains what local and staged RLS evidence should prove before live work is trusted.",
  },
  {
    label: "Existing direct-write and review proofs",
    artifact:
      "supabase/tests/database/rls_goal_5.test.sql and supabase/tests/database/rls_goal_115.test.sql",
    whyItMatters:
      "Shows the project already has concrete RLS checks around early write slices and staff/admin review context.",
  },
  {
    label: "Security decision review surface",
    artifact: "src/services/database-security-decision.ts and /admin/database-security",
    whyItMatters:
      "Gives DS and HQ a readable route for the stack decision, key handling, proof storage, and compliance boundary.",
  },
];

export function getPhase2SecurityReleaseGatePacket(): Phase2SecurityReleaseGatePacket {
  return {
    title: "MED-474 RLS and security release gate",
    summary:
      "Converts the local Supabase planning and tests into a concrete release gate for staging and the first pilot, with explicit proof required before any live write is trusted.",
    liveSecurityGateOpen: false,
    checks: securityChecks,
    currentEvidence,
    blockedLiveActions: [
      "Running live migrations against hosted Supabase",
      "Enabling proof storage or uploads",
      "Allowing production browser writes",
      "Pointing the app at production Supabase without DS/security sign-off",
    ],
    officialReferences: [
      {
        label: "Supabase row level security",
        url: "https://supabase.com/docs/guides/database/postgres/row-level-security",
      },
      {
        label: "Supabase auth overview",
        url: "https://supabase.com/docs/guides/auth",
      },
      {
        label: "Supabase SSR auth setup",
        url: "https://supabase.com/docs/guides/auth/server-side/creating-a-client",
      },
      {
        label: "Supabase 2026 Data API grants change",
        url: "https://supabase.com/changelog",
      },
    ],
    counts: {
      localEvidenceReady: securityChecks.filter(
        (item) => item.status === "local_evidence_ready",
      ).length,
      dsReviewRequired: securityChecks.filter(
        (item) => item.status === "ds_review_required",
      ).length,
      blockedUntilStorageReview: securityChecks.filter(
        (item) => item.status === "blocked_until_storage_review",
      ).length,
    },
  };
}
