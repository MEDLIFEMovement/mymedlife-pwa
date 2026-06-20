import type { Phase2Owner } from "@/services/phase-2-safe-prep";

export type Phase2EnvironmentSetupStatus =
  | "ready_for_review"
  | "owner_input_required";

export type Phase2EnvironmentLane = {
  key: "local" | "preview" | "staging" | "production";
  label: string;
  owners: Phase2Owner[];
  status: Phase2EnvironmentSetupStatus;
  appHost: string;
  authCallback: string;
  redirectPattern: string;
  supabaseProject: string;
  vercelEnvironment: string;
  notes: string[];
};

export type Phase2EnvironmentVariablePlan = {
  name: string;
  scope: "browser" | "server_only";
  environments: Array<"local" | "preview" | "staging" | "production">;
  owners: Phase2Owner[];
  notes: string;
};

export type Phase2EnvironmentExpectation = {
  key: string;
  label: string;
  owners: Phase2Owner[];
  evidenceRequired: string;
};

export type Phase2EnvironmentTopology = {
  key: "B";
  label: string;
  plainEnglishSummary: string;
  technicalSummary: string;
};

export type Phase2HostedSupabaseProject = {
  name: string;
  ref: string;
  region: string;
  status: string;
  createdAt: string;
  environmentRole: "unknown" | "staging" | "production";
};

export type Phase2HostedSupabaseState = {
  summary: string;
  projects: Phase2HostedSupabaseProject[];
  blockers: string[];
};

export type Phase2EnvironmentOwnerFollowUp = {
  key: string;
  label: string;
  owners: Phase2Owner[];
  nextAction: string;
};

export type Phase2EnvironmentSetupPacket = {
  title: string;
  summary: string;
  liveSetupBlocked: true;
  selectedTopology: Phase2EnvironmentTopology;
  hostedSupabaseState: Phase2HostedSupabaseState;
  environments: Phase2EnvironmentLane[];
  environmentVariables: Phase2EnvironmentVariablePlan[];
  expectations: Phase2EnvironmentExpectation[];
  ownerFollowUp: Phase2EnvironmentOwnerFollowUp[];
  blockedLiveActions: string[];
  officialReferences: { label: string; url: string }[];
  counts: {
    environments: number;
    hostedProjects: number;
    readyForReview: number;
    ownerInputRequired: number;
    browserVariables: number;
    serverOnlyVariables: number;
  };
};

const selectedTopology: Phase2EnvironmentTopology = {
  key: "B",
  label: "Environment path B",
  plainEnglishSummary:
    "Use three real lanes: local for development, staging for rehearsal and first approved writes, and production for the live app. Vercel preview stays connected to staging and never production.",
  technicalSummary:
    "Topology B = localhost + dedicated staging Supabase/Vercel + dedicated production Supabase/Vercel, with `https://*-<team-or-account-slug>.vercel.app/**` allowed as preview redirect URLs and preview secrets scoped to staging only.",
};

const environmentLanes: Phase2EnvironmentLane[] = [
  {
    key: "local",
    label: "Local development",
    owners: ["Codex", "Kiomi / DS"],
    status: "ready_for_review",
    appHost: "http://localhost:3000",
    authCallback: "http://localhost:3000/auth/callback",
    redirectPattern: "http://localhost:3000/** and http://127.0.0.1:3000/**",
    supabaseProject: "Local Docker Supabase only",
    vercelEnvironment: "Not used",
    notes: [
      "Keep mock mode as the default review path until live setup is approved.",
      "Local auth can use localhost-only Supabase config, but no production keys belong here.",
      "Local callback testing should cover both localhost and 127.0.0.1 because the app already uses both forms during review.",
    ],
  },
  {
    key: "preview",
    label: "Vercel preview",
    owners: ["Kiomi / DS", "Codex"],
    status: "ready_for_review",
    appHost: "https://<branch>.<project>.vercel.app",
    authCallback: "https://<branch>.<project>.vercel.app/auth/callback",
    redirectPattern: "https://*-<team-or-account-slug>.vercel.app/**",
    supabaseProject: "No dedicated Supabase project; preview should point at approved staging only",
    vercelEnvironment: "Preview",
    notes: [
      "Preview deployments get branch and commit URLs automatically on Vercel.",
      "Supabase redirect URLs should allow the preview wildcard, but production should still use an exact URL.",
      "Preview must never hold production service-role or secret keys.",
    ],
  },
  {
    key: "staging",
    label: "Staging pilot environment",
    owners: ["Kiomi / DS", "Codex", "Nick"],
    status: "owner_input_required",
    appHost: "https://staging.mymedlife.org",
    authCallback: "https://staging.mymedlife.org/auth/callback",
    redirectPattern: "Exact staging URL only",
    supabaseProject: "Dedicated staging Supabase project",
    vercelEnvironment: "Custom staging environment on Vercel",
    notes: [
      "The staging domain is confirmed as staging.mymedlife.org.",
      "The hosted Supabase project `rceupryepjgkdeqgxzrc` is confirmed as the staging project.",
      "The approved repo migrations have been applied to staging, including the MED-492 search-path security cleanup.",
      "The repo now supports a `staging_supabase` auth mode, but Vercel should keep auth disabled until the staging domain and browser env vars are loaded deliberately.",
      "Staging is where auth, RLS, and the first approved writes must be proven before a pilot invite goes out.",
      "Vercel staging, environment variables, backup posture, monitoring, and rollback owner still need to be named before staging is treated as a release candidate.",
    ],
  },
  {
    key: "production",
    label: "Production",
    owners: ["Kiomi / DS", "Nick"],
    status: "owner_input_required",
    appHost: "https://www.mymedlife.org",
    authCallback: "https://www.mymedlife.org/auth/callback",
    redirectPattern: "Exact production URL only",
    supabaseProject: "Dedicated production Supabase project",
    vercelEnvironment: "Production",
    notes: [
      "The production Supabase project `fnlhontvvprwgooevzdl` has been created and is ACTIVE_HEALTHY.",
      "Production migrations are intentionally empty until DS/security owners approve the production schema application path.",
      "Production Site URL should be the public myMEDLIFE domain, not localhost.",
      "Production secret and service-role keys stay server-only and human-owned.",
      "No production app data, auth/storage setup, or external integrations were applied during project creation.",
      "Production promotion and rollback must be run from an approved deployment, not by swapping hidden environment values in the browser.",
    ],
  },
];

const hostedSupabaseState: Phase2HostedSupabaseState = {
  summary:
    "The existing hosted Supabase project is confirmed as staging and the dedicated production Supabase project has been created. Staging is migrated and clean after the MED-492 security cleanup. Production is healthy but intentionally empty until DS/security owners approve the production schema application path. Topology B is still not fully provisioned because Vercel staging, live environment variables, production schema application, and hosted validation ownership remain owner-owned setup work.",
  projects: [
    {
      name: "myMEDLIFE",
      ref: "rceupryepjgkdeqgxzrc",
      region: "us-east-1",
      status: "ACTIVE_HEALTHY",
      createdAt: "2026-06-17",
      environmentRole: "staging",
    },
    {
      name: "myMEDLIFE Production",
      ref: "fnlhontvvprwgooevzdl",
      region: "us-east-1",
      status: "ACTIVE_HEALTHY",
      createdAt: "2026-06-20",
      environmentRole: "production",
    },
  ],
  blockers: [
    "Vercel still needs `staging.mymedlife.org` attached to the staging environment.",
    "Preview, staging, and production environment variables still need to be loaded outside source control.",
    "Production schema migrations must not be applied until DS/security owners approve the path and rollback evidence.",
    "Hosted auth, RLS, and first-write validation still need approved owners before pilot users are invited.",
  ],
};

const environmentVariablePlan: Phase2EnvironmentVariablePlan[] = [
  {
    name: "MYMEDLIFE_AUTH_MODE",
    scope: "server_only",
    environments: ["local", "preview", "staging", "production"],
    owners: ["Kiomi / DS", "Codex"],
    notes:
      "Keep this `disabled` by default. `local_supabase` is for localhost only. `staging_supabase` is allowed only on staging.mymedlife.org against the staging Supabase project.",
  },
  {
    name: "MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES",
    scope: "server_only",
    environments: ["staging"],
    owners: ["Kiomi / DS", "Codex"],
    notes:
      "Leave this `false` until one approved hosted staging write rehearsal is underway. This is the master switch for staged write proof and should stay off outside the narrow validation window.",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    scope: "browser",
    environments: ["local", "preview", "staging", "production"],
    owners: ["Kiomi / DS", "Codex"],
    notes: "Required for browser and SSR clients in every environment.",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    scope: "browser",
    environments: ["preview", "staging", "production"],
    owners: ["Kiomi / DS"],
    notes:
      "Preferred live browser key name in current Supabase docs. The repo still supports legacy anon-key aliases during transition.",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    scope: "browser",
    environments: ["local", "preview", "staging", "production"],
    owners: ["Kiomi / DS", "Codex"],
    notes:
      "Legacy compatibility alias still read by the repo today. Decide whether to keep it, replace it, or populate both names during rollout.",
  },
  {
    name: "SUPABASE_SECRET_KEY",
    scope: "server_only",
    environments: ["staging", "production"],
    owners: ["Kiomi / DS"],
    notes:
      "Server-only live key if the app later needs privileged server operations. Never expose to the browser.",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    scope: "server_only",
    environments: ["local", "staging", "production"],
    owners: ["Kiomi / DS"],
    notes:
      "Legacy service-role name still worth documenting because existing scripts and docs may still reference it.",
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    scope: "browser",
    environments: ["preview", "staging", "production"],
    owners: ["Kiomi / DS", "Codex"],
    notes:
      "Used to compute redirect targets consistently across preview and production environments.",
  },
  {
    name: "NEXT_PUBLIC_VERCEL_URL",
    scope: "browser",
    environments: ["preview"],
    owners: ["Kiomi / DS"],
    notes:
      "Provided by Vercel for preview deployments and useful when building auth redirect helpers.",
  },
];

const environmentOwnerFollowUp: Phase2EnvironmentOwnerFollowUp[] = [
  {
    key: "approve_production_schema_path",
    label: "Approve the production schema path",
    owners: ["Kiomi / DS"],
    nextAction:
      "Review the empty production Supabase project, then approve whether and when Codex should apply the already-approved schema migrations with rollback evidence.",
  },
  {
    key: "assign_staging_validation_owners",
    label: "Assign hosted staging validation owners",
    owners: ["Kiomi / DS"],
    nextAction:
      "Name who owns hosted auth, RLS, first-write validation, backup checks, monitoring, and rollback evidence for staging.",
  },
  {
    key: "name_staging_domain_and_vercel_env",
    label: "Attach the confirmed staging domain and Vercel target",
    owners: ["Kiomi / DS", "Nick"],
    nextAction:
      "Attach staging.mymedlife.org to the Vercel staging environment and keep preview deployments mapped to staging rather than production.",
  },
  {
    key: "load_env_vars_without_source_control",
    label: "Load environment variables outside source control",
    owners: ["Kiomi / DS", "Codex"],
    nextAction:
      "Populate preview, staging, and production variables in Vercel/Supabase, then hand Codex the approved names and callback URLs without posting secrets into the repo.",
  },
];

const environmentExpectations: Phase2EnvironmentExpectation[] = [
  {
    key: "supabase_ownership",
    label: "Supabase project ownership is named",
    owners: ["Kiomi / DS"],
    evidenceRequired:
      "Local, staging, and production Supabase projects are named and the human owner of each live key is explicit.",
  },
  {
    key: "vercel_environment_plan",
    label: "Vercel environment plan is named",
    owners: ["Kiomi / DS"],
    evidenceRequired:
      "Preview, staging, and production environment-variable scope is documented outside source control.",
  },
  {
    key: "callback_and_redirects",
    label: "Auth callback and redirect URLs are approved",
    owners: ["Kiomi / DS", "Codex"],
    evidenceRequired:
      "Localhost, preview wildcard, staging exact URL, and production exact URL are listed and approved in Supabase URL Configuration.",
  },
  {
    key: "backup_monitoring",
    label: "Backup and monitoring expectations are named",
    owners: ["Kiomi / DS", "Nick"],
    evidenceRequired:
      "The team names who checks backups, who watches staging/production health, and how a failed pilot build is rolled back.",
  },
  {
    key: "promotion_and_rollback",
    label: "Promotion and rollback path is named",
    owners: ["Kiomi / DS", "Nick"],
    evidenceRequired:
      "The team agrees whether staging promotes through Vercel preview promotion or rebuild-to-production, and who owns rollback during pilot week.",
  },
];

export function getPhase2EnvironmentSetupPacket(): Phase2EnvironmentSetupPacket {
  return {
    title: "MED-472 environment setup checklist",
    summary:
      "Environment path B is selected: local + staging + production, with preview pointed at staging. Staging Supabase is provisioned and migrated; production Supabase is provisioned but intentionally empty; the repo now supports a gated staging-only auth mode; Vercel staging, live environment variables, production schema application, and hosted validation ownership remain blocked outside source control.",
    liveSetupBlocked: true,
    selectedTopology,
    hostedSupabaseState,
    environments: environmentLanes,
    environmentVariables: environmentVariablePlan,
    expectations: environmentExpectations,
    ownerFollowUp: environmentOwnerFollowUp,
    blockedLiveActions: [
      "Applying production schema migrations or enabling production writes without DS/security approval",
      "Adding staging or production keys to source control",
      "Pointing production DNS at a live Vercel deployment",
      "Promoting a preview deployment to production before the security gate is approved",
    ],
    officialReferences: [
      {
        label: "Supabase redirect URLs",
        url: "https://supabase.com/docs/guides/auth/redirect-urls",
      },
      {
        label: "Supabase SSR client setup",
        url: "https://supabase.com/docs/guides/auth/server-side/creating-a-client",
      },
      {
        label: "Vercel environments",
        url: "https://vercel.com/docs/deployments/environments",
      },
      {
        label: "Vercel deployment promotion and rollback",
        url: "https://vercel.com/docs/deployments/promoting-a-deployment",
      },
      {
        label: "Vercel system environment variables",
        url: "https://vercel.com/docs/environment-variables/system-environment-variables",
      },
    ],
    counts: {
      environments: environmentLanes.length,
      hostedProjects: hostedSupabaseState.projects.length,
      readyForReview: environmentLanes.filter((lane) => lane.status === "ready_for_review")
        .length,
      ownerInputRequired: environmentLanes.filter(
        (lane) => lane.status === "owner_input_required",
      ).length,
      browserVariables: environmentVariablePlan.filter((item) => item.scope === "browser")
        .length,
      serverOnlyVariables: environmentVariablePlan.filter(
        (item) => item.scope === "server_only",
      ).length,
    },
  };
}
