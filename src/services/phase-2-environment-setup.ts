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
    appHost: "https://staging.mymedlife.org (placeholder pending owner confirmation)",
    authCallback: "https://staging.mymedlife.org/auth/callback",
    redirectPattern: "Exact staging URL once Kiomi / DS names the staging domain",
    supabaseProject: "Dedicated staging Supabase project",
    vercelEnvironment: "Custom staging environment on Vercel",
    notes: [
      "Kiomi / DS still needs to name the exact staging domain and the staging Supabase project.",
      "Staging is where auth, RLS, and the first approved writes must be proven before a pilot invite goes out.",
      "Backup posture, monitoring, and rollback owner need to be named before staging is treated as a release candidate.",
    ],
  },
  {
    key: "production",
    label: "Production",
    owners: ["Kiomi / DS", "Nick"],
    status: "ready_for_review",
    appHost: "https://www.mymedlife.org",
    authCallback: "https://www.mymedlife.org/auth/callback",
    redirectPattern: "Exact production URL only",
    supabaseProject: "Dedicated production Supabase project",
    vercelEnvironment: "Production",
    notes: [
      "Production Site URL should be the public myMEDLIFE domain, not localhost.",
      "Production secret and service-role keys stay server-only and human-owned.",
      "Production promotion and rollback must be run from an approved deployment, not by swapping hidden environment values in the browser.",
    ],
  },
];

const hostedSupabaseState: Phase2HostedSupabaseState = {
  summary:
    "Read-only connector inspection currently shows one healthy hosted Supabase project. Its environment role is still unconfirmed, so topology B is not fully provisioned yet.",
  projects: [
    {
      name: "myMEDLIFE",
      ref: "rceupryepjgkdeqgxzrc",
      region: "us-east-1",
      status: "ACTIVE_HEALTHY",
      createdAt: "2026-06-17",
      environmentRole: "unknown",
    },
  ],
  blockers: [
    "Kiomi / DS still needs to confirm whether `rceupryepjgkdeqgxzrc` is meant to be staging or production.",
    "Whichever role is missing in topology B still needs its own hosted Supabase project.",
    "Supabase branch listing through the connector still errors, so branch-based environment proof is not available yet.",
  ],
};

const environmentVariablePlan: Phase2EnvironmentVariablePlan[] = [
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
    key: "confirm_existing_project_role",
    label: "Confirm the current hosted project role",
    owners: ["Kiomi / DS"],
    nextAction:
      "Decide whether the existing hosted Supabase project `rceupryepjgkdeqgxzrc` is the staging project or the production project.",
  },
  {
    key: "create_missing_hosted_project",
    label: "Create the missing hosted Supabase lane",
    owners: ["Kiomi / DS"],
    nextAction:
      "If the current project is staging, create production; if it is production, create staging. Keep local on Docker only.",
  },
  {
    key: "name_staging_domain_and_vercel_env",
    label: "Name the staging domain and Vercel target",
    owners: ["Kiomi / DS", "Nick"],
    nextAction:
      "Confirm the exact staging domain, attach it to the Vercel staging environment, and keep preview deployments mapped to staging rather than production.",
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
      "Environment path B is selected: local + staging + production, with preview pointed at staging. This packet keeps the hosted setup reviewable without creating live environments or committing secrets.",
    liveSetupBlocked: true,
    selectedTopology,
    hostedSupabaseState,
    environments: environmentLanes,
    environmentVariables: environmentVariablePlan,
    expectations: environmentExpectations,
    ownerFollowUp: environmentOwnerFollowUp,
    blockedLiveActions: [
      "Creating or linking real Supabase projects",
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
