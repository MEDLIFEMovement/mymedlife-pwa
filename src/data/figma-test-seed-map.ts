import {
  getTestProductionSeedEnvironment,
  getTestProductionVisibleLabels,
  type TestLogin,
  type TestProductionSeedEnvironment,
} from "../services/test-production-seed-environment.ts";

export const FIGMA_TEST_SEED_FAMILY = "figma_seed_v1";
export const FIGMA_TEST_SEED_SOURCE = "figma_seed";
export const FIGMA_TEST_SEED_ENVIRONMENT = "sandbox";

export type FigmaSeedShell =
  | "/app"
  | "/app/events"
  | "/campaigns"
  | "/proof-library"
  | "/app/slt-prep"
  | "/leader"
  | "/staff"
  | "/admin";

export type FigmaTestSeedDisposition = "seeded_sandbox" | "fixture_only";

export type FigmaTestSeedRecordKind =
  | "actor"
  | "chapter"
  | "event"
  | "campaign_instance"
  | "proof_fixture"
  | "staff_portfolio"
  | "admin_fixture"
  | "slt_fixture";

export type FigmaTestSeedMarkers = {
  is_test: true;
  source: typeof FIGMA_TEST_SEED_SOURCE;
  seed_family: typeof FIGMA_TEST_SEED_FAMILY;
  environment: typeof FIGMA_TEST_SEED_ENVIRONMENT;
};

export type FigmaTestSeedRecord = {
  key: string;
  kind: FigmaTestSeedRecordKind;
  sourceValues: string[];
  testLabel: string;
  disposition: FigmaTestSeedDisposition;
  supportsShells: FigmaSeedShell[];
  markers: FigmaTestSeedMarkers;
  notes: string;
};

export type FigmaTestSeedShellKey =
  | "member_app"
  | "leader_command_center"
  | "staff_command_center"
  | "admin_backend"
  | "slt_prep";

export type FigmaTestSeedLogin = TestLogin & {
  seedFamily: typeof FIGMA_TEST_SEED_FAMILY;
  source: typeof FIGMA_TEST_SEED_SOURCE;
  environment: typeof FIGMA_TEST_SEED_ENVIRONMENT;
  isTest: true;
};

export type FigmaTestSeedShellRecord = {
  shell: FigmaTestSeedShellKey;
  label: string;
  primaryRoute: string;
  supportedRoles: string[];
  logins: FigmaTestSeedLogin[];
  notes: string;
  excludedFromProductionEvidence: true;
  exclusionReason: string;
};

export type FigmaTestSeedManifest = {
  generatedAt: string;
  seedFamily: typeof FIGMA_TEST_SEED_FAMILY;
  source: typeof FIGMA_TEST_SEED_SOURCE;
  environment: typeof FIGMA_TEST_SEED_ENVIRONMENT;
  isTest: true;
  sharedPassword: string;
  shells: FigmaTestSeedShellRecord[];
};

export type FigmaTestSeedValidation = {
  ready: boolean;
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
};

export const figmaTestSeedMarkers: FigmaTestSeedMarkers = {
  is_test: true,
  source: FIGMA_TEST_SEED_SOURCE,
  seed_family: FIGMA_TEST_SEED_FAMILY,
  environment: FIGMA_TEST_SEED_ENVIRONMENT,
};

export const figmaTestSeedRecords: FigmaTestSeedRecord[] = [
  {
    key: "actor-member-sofia",
    kind: "actor",
    sourceValues: [
      "Sofia",
      "Sofia R.",
      "Sofia Alvarez",
      "Sofia Reyes",
      "Sofia Chen",
      "Alex Kim",
      "Marcus Rivera",
      "Marcus T.",
    ],
    testLabel: "Test Sofia Alvarez",
    disposition: "seeded_sandbox",
    supportsShells: ["/app", "/app/events", "/campaigns", "/proof-library", "/app/slt-prep", "/leader"],
    markers: figmaTestSeedMarkers,
    notes: "General member/traveler/leader-facing Figma persona for signed-in sandbox proof.",
  },
  {
    key: "actor-leader-roster",
    kind: "actor",
    sourceValues: [
      "Marcus Chen",
      "Amara Okonkwo",
      "Jordan Kim",
      "Priya Sharma",
      "DeShawn Williams",
      "Elena Vasquez",
      "Theo Nakamura",
      "Nadia Osei",
      "Ryan O'Brien",
      "Aaliyah Brooks",
      "Caleb Torres",
    ],
    testLabel: "Test Leader Roster",
    disposition: "seeded_sandbox",
    supportsShells: ["/leader", "/proof-library"],
    markers: figmaTestSeedMarkers,
    notes: "Representative chapter leadership and committee roster rows for leader shell proof.",
  },
  {
    key: "actor-staff-admins",
    kind: "actor",
    sourceValues: [
      "Renato Coach",
      "Coach Cam",
      "Maria Santos",
      "James Okafor",
      "Carlos Quispe",
      "Fernanda Lima",
      "Lucia Herrera",
      "Samuel Mutua",
      "Soledad Vega",
      "Chen Wei",
    ],
    testLabel: "Test Staff And Admin Roster",
    disposition: "seeded_sandbox",
    supportsShells: ["/staff", "/admin", "/app/slt-prep"],
    markers: figmaTestSeedMarkers,
    notes: "Coach, support, DS admin, and super admin identities for sandbox role proof.",
  },
  {
    key: "chapter-ucla",
    kind: "chapter",
    sourceValues: ["UCLA MEDLIFE", "UCLA"],
    testLabel: "Test UCLA MEDLIFE",
    disposition: "seeded_sandbox",
    supportsShells: ["/app", "/app/events", "/campaigns", "/proof-library", "/app/slt-prep", "/leader", "/staff", "/admin"],
    markers: figmaTestSeedMarkers,
    notes: "Primary Figma member/leader chapter instance.",
  },
  {
    key: "chapter-leader-network",
    kind: "chapter",
    sourceValues: [
      "McGill MEDLIFE",
      "Boston College MEDLIFE",
      "UT Austin MEDLIFE",
      "UBC MEDLIFE",
      "NYU MEDLIFE",
      "Emory MEDLIFE",
    ],
    testLabel: "Test Leader Network Chapters",
    disposition: "seeded_sandbox",
    supportsShells: ["/leader", "/staff", "/admin"],
    markers: figmaTestSeedMarkers,
    notes: "Chapter leaderboard and benchmark rows used by the copied Figma leader shell.",
  },
  {
    key: "chapter-staff-portfolio",
    kind: "staff_portfolio",
    sourceValues: [
      "UC Berkeley",
      "Yale University",
      "University of Florida",
      "Emory University",
      "PUCP Lima",
      "UNMSM Lima",
      "USP Sao Paulo",
      "UFMG Belo Horizonte",
      "UNAH Tegucigalpa",
      "UNAN Managua",
      "University of Nairobi",
      "Makerere University",
      "Stanford University",
      "Johns Hopkins",
      "MIT",
      "University of Ghana",
      "University of Toronto",
      "Howard University",
      "Morehouse College",
      "Michigan State",
      "Spelman College",
    ],
    testLabel: "Test Staff Portfolio Chapters",
    disposition: "fixture_only",
    supportsShells: ["/staff", "/admin"],
    markers: figmaTestSeedMarkers,
    notes: "Broad portfolio examples stay fixture-only until owner-approved seed scope narrows them.",
  },
  {
    key: "event-member-launch",
    kind: "event",
    sourceValues: [
      "Intro GBM",
      "Tabling at Bruin Walk",
      "Rush Week Social",
      "Spring Showcase Kickoff",
      "Fundraising Bake Sale",
      "Community Health Fair",
      "First Aid Training Workshop",
      "Blood Drive Volunteer Day",
      "Spring Blood Drive",
    ],
    testLabel: "Test Member Launch Events",
    disposition: "seeded_sandbox",
    supportsShells: ["/app", "/app/events", "/campaigns", "/leader", "/staff"],
    markers: figmaTestSeedMarkers,
    notes: "Local RSVP, attendance, points, and event-loop proof rows with real provider writes disabled.",
  },
  {
    key: "campaign-instances",
    kind: "campaign_instance",
    sourceValues: ["Rush Month", "Safe Homes Fundraiser", "Moving Mountains Kickoff", "SLT Interest Meeting"],
    testLabel: "Test Campaign Instances",
    disposition: "seeded_sandbox",
    supportsShells: ["/app", "/campaigns", "/leader", "/staff", "/admin"],
    markers: figmaTestSeedMarkers,
    notes: "Persist chapter-owned campaign instances only; campaign templates remain unprefixed concepts.",
  },
  {
    key: "proof-stories",
    kind: "proof_fixture",
    sourceValues: [
      "Penn State MEDLIFE",
      "UConn MEDLIFE",
      "Florida State",
      "Rutgers",
      "Miami MEDLIFE",
      "Yale",
      "Program Staff",
      "National Campaign",
      "Ana",
      "Cassandra",
      "Doña Carmen",
      "Priya from Johns Hopkins",
      "Students in Lima joined a Mobile Clinic this weekend",
      "A grandmother's story: forty years without access to a doctor",
      "images.unsplash.com",
      "instagram.com",
      "loom",
      "youtube",
      "facebook",
    ],
    testLabel: "Test Story And Proof Fixtures",
    disposition: "fixture_only",
    supportsShells: ["/proof-library", "/leader", "/staff"],
    markers: figmaTestSeedMarkers,
    notes: "Stories, patient/student quotes, external embeds, and stock imagery stay fixture-only until consent and storage are approved.",
  },
  {
    key: "training-resource-fixtures",
    kind: "proof_fixture",
    sourceValues: [
      "Sofia Reyes",
      "MEDLIFE Bridge Videos",
      "Stanford d.school",
      "Harvard Leadership Lab",
      "NASPA Leadership Institute",
      "Greenleaf Center for Servant Leadership",
      "VitalSmarts",
      "Ashoka",
      "Gallup",
      "Johns Hopkins Bloomberg School of Public Health",
      "greenleaf.org",
      "cruciallearning.com",
      "ashoka.org",
      "gallup.com/cliftonstrengths",
      "coursera.org",
    ],
    testLabel: "Test Training Resource Fixtures",
    disposition: "fixture_only",
    supportsShells: ["/leader"],
    markers: figmaTestSeedMarkers,
    notes: "Leader training titles, org names, and external resource links stay fixture-only unless approved for persisted sandbox content.",
  },
  {
    key: "slt-prep",
    kind: "slt_fixture",
    sourceValues: ["Peru SLT | July 2026", "Traveler success staff", "Drive/Form mock", "Shopify mock", "Luma mock", "Zoom mock"],
    testLabel: "Test Peru SLT | July 2026",
    disposition: "fixture_only",
    supportsShells: ["/app/slt-prep", "/staff", "/admin"],
    markers: figmaTestSeedMarkers,
    notes: "SLT Prep remains fixture-only until the exact Figma source and persisted SLT schema are approved.",
  },
  {
    key: "admin-fixtures",
    kind: "admin_fixture",
    sourceValues: [
      "Howard University",
      "Morehouse College",
      "Spelman College",
      "Michigan State",
      "Luma",
      "HubSpot",
      "BigQuery",
      "n8n",
      "OpenAI",
      "Power BI",
      "luma_live_<mock-token>",
      "pat-na1-<mock-token>",
      "bq-sa-medlife-prod-<mock-token>",
      "n8n_whsec_<mock-token>",
      "sk-proj-<mock-token>",
      "pbi_sec_<mock-token>",
      "secret-ref:luma:staging:v1",
    ],
    testLabel: "Test Admin Fixture Rows",
    disposition: "fixture_only",
    supportsShells: ["/admin", "/staff"],
    markers: figmaTestSeedMarkers,
    notes: "Admin module, audit, and API key rows stay fixture-only; exported live-looking key strings must be sanitized before any persisted sandbox adapter is allowed.",
  },
];

const requiredFigmaShells: FigmaSeedShell[] = [
  "/app",
  "/app/events",
  "/campaigns",
  "/proof-library",
  "/app/slt-prep",
  "/leader",
  "/staff",
  "/admin",
];

const figmaSeedMarkerStrings = new Set([
  FIGMA_TEST_SEED_SOURCE,
  FIGMA_TEST_SEED_FAMILY,
  "test_production_seed",
  "test_production_v1",
]);

const shellDefinitions: Record<
  FigmaTestSeedShellKey,
  Omit<FigmaTestSeedShellRecord, "logins" | "excludedFromProductionEvidence" | "exclusionReason">
> = {
  member_app: {
    shell: "member_app",
    label: "Member app",
    primaryRoute: "/app",
    supportedRoles: ["general_member"],
    notes: "Use a signed-in Test member to review the Figma member shell, events, and points routes.",
  },
  leader_command_center: {
    shell: "leader_command_center",
    label: "Leader command center",
    primaryRoute: "/leader?view=overview",
    supportedRoles: ["president_vp", "action_committee_chair"],
    notes: "Use a signed-in Test chapter leader to review overview, committees, events, and stories.",
  },
  staff_command_center: {
    shell: "staff_command_center",
    label: "Staff command center",
    primaryRoute: "/staff?view=chapters",
    supportedRoles: ["coach", "admin"],
    notes: "Use coach or admin Test staff accounts for portfolio, event operations, and read-only support views.",
  },
  admin_backend: {
    shell: "admin_backend",
    label: "Admin backend",
    primaryRoute: "/admin",
    supportedRoles: ["ds_admin", "super_admin"],
    notes: "Use DS Admin or Super Admin Test accounts for audit, outbox, users, chapters, and launch controls.",
  },
  slt_prep: {
    shell: "slt_prep",
    label: "SLT Prep",
    primaryRoute: "/app/slt-prep",
    supportedRoles: ["general_member"],
    notes: "This visible shell rides on the member sign-in path today; it remains sandbox-only and outside rollout proof.",
  },
};

const shellRoleMap: Record<FigmaTestSeedShellKey, string[]> = {
  member_app: ["general_member"],
  leader_command_center: ["president_vp", "action_committee_chair"],
  staff_command_center: ["coach", "admin"],
  admin_backend: ["ds_admin", "super_admin"],
  slt_prep: ["general_member"],
};

export function getFigmaTestSeedRecordsByShell(shell: FigmaSeedShell) {
  return figmaTestSeedRecords.filter((record) => record.supportsShells.includes(shell));
}

export function buildFigmaTestSeedManifest(
  environment = getTestProductionSeedEnvironment(),
): FigmaTestSeedManifest {
  return {
    generatedAt: environment.generatedAt,
    seedFamily: FIGMA_TEST_SEED_FAMILY,
    source: FIGMA_TEST_SEED_SOURCE,
    environment: FIGMA_TEST_SEED_ENVIRONMENT,
    isTest: true,
    sharedPassword: environment.password,
    shells: (Object.keys(shellDefinitions) as FigmaTestSeedShellKey[]).map((shell) => ({
      ...shellDefinitions[shell],
      logins: getShellLogins(environment, shell),
      excludedFromProductionEvidence: true,
      exclusionReason: getFigmaTestSeedExclusionMessage(),
    })),
  };
}

export function getFigmaTestSeedValidation(
  environment = getTestProductionSeedEnvironment(),
): FigmaTestSeedValidation {
  const manifest = buildFigmaTestSeedManifest(environment);
  const visibleLabels = getTestProductionVisibleLabels(environment);
  const checks = [
    {
      key: "all_records_have_exact_markers",
      passed: figmaTestSeedRecords.every(
        (record) =>
          record.markers.is_test === true &&
          record.markers.source === FIGMA_TEST_SEED_SOURCE &&
          record.markers.seed_family === FIGMA_TEST_SEED_FAMILY &&
          record.markers.environment === FIGMA_TEST_SEED_ENVIRONMENT,
      ),
      message: "Every Figma seed map record carries the sandbox Test markers.",
    },
    {
      key: "seeded_records_are_test_prefixed",
      passed: figmaTestSeedRecords
        .filter((record) => record.disposition === "seeded_sandbox")
        .every((record) => record.testLabel.startsWith("Test ")),
      message: "Every seeded sandbox Figma record has a Test-prefixed visible label.",
    },
    {
      key: "shells_have_records",
      passed: requiredFigmaShells.every((shell) => getFigmaTestSeedRecordsByShell(shell).length > 0),
      message: "Every audited Figma shell has at least one mapped Test or fixture record.",
    },
    {
      key: "fixture_only_content_is_not_seeded",
      passed: figmaTestSeedRecords
        .filter((record) => ["proof_fixture", "admin_fixture", "slt_fixture"].includes(record.kind))
        .every((record) => record.disposition === "fixture_only"),
      message: "Story, secret-placeholder, and SLT fixture rows are not marked for seeding.",
    },
    {
      key: "manifest_markers",
      passed:
        manifest.seedFamily === FIGMA_TEST_SEED_FAMILY &&
        manifest.source === FIGMA_TEST_SEED_SOURCE &&
        manifest.environment === FIGMA_TEST_SEED_ENVIRONMENT &&
        manifest.isTest,
      message: "Manifest carries figma_seed_v1, figma_seed, sandbox, and isTest markers.",
    },
    {
      key: "manifest_shell_coverage",
      passed: manifest.shells.length === 5,
      message: "Manifest covers /app, /leader, /staff, /admin, and /app/slt-prep.",
    },
    {
      key: "visible_test_prefix",
      passed: visibleLabels.every((label) => label.startsWith("Test")),
      message: "Every visible seeded label remains Test-prefixed.",
    },
    {
      key: "login_test_prefix",
      passed: manifest.shells.every((shell) =>
        shell.logins.every(
          (login) =>
            login.displayName.startsWith("Test") &&
            (login.chapterName === null || login.chapterName.startsWith("Test")),
        ),
      ),
      message: "Every shell login preserves Test-prefixed names and chapters.",
    },
    {
      key: "login_email_scope",
      passed: manifest.shells.every((shell) =>
        shell.logins.every(
          (login) => login.email.startsWith("test.") && login.email.endsWith("@example.com"),
        ),
      ),
      message: "Every shell login uses a fake test.*@example.com email.",
    },
    {
      key: "production_exclusion",
      passed: manifest.shells.every(
        (shell) =>
          shell.excludedFromProductionEvidence &&
          shell.exclusionReason.includes("must stay out of production rollout evidence"),
      ),
      message: "Every shell record is explicitly marked as excluded from production rollout evidence.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatFigmaTestSeedLoginsMarkdown(
  manifest = buildFigmaTestSeedManifest(),
): string {
  const lines = [
    "# myMEDLIFE Figma Test Logins",
    "",
    `Seed family: \`${manifest.seedFamily}\``,
    `Source: \`${manifest.source}\``,
    `Environment: \`${manifest.environment}\``,
    "",
    "All accounts are sandbox-only Test data and must stay out of production rollout evidence.",
    "",
  ];

  for (const shell of manifest.shells) {
    lines.push(`## ${shell.label}`);
    lines.push("");
    lines.push(`- Primary route: \`${shell.primaryRoute}\``);
    lines.push(`- Supported roles: ${shell.supportedRoles.map((role) => `\`${role}\``).join(", ")}`);
    lines.push(`- Notes: ${shell.notes}`);
    lines.push(`- Evidence posture: ${shell.exclusionReason}`);
    lines.push("");
    lines.push("| Display name | Email | Password | Role | Chapter | Demonstrates |");
    lines.push("|---|---|---|---|---|---|");
    for (const login of shell.logins) {
      lines.push(
        `| ${[
          login.displayName,
          login.email,
          login.password,
          login.role,
          login.chapterName ?? "Test staff",
          login.demonstrates,
        ]
          .map(escapeCell)
          .join(" | ")} |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function getFigmaOrTestSeedEvidenceReason(value: unknown): string | null {
  return getFigmaOrTestSeedEvidenceReasonAtPath(value, "packet");
}

function getFigmaOrTestSeedEvidenceReasonAtPath(value: unknown, path: string): string | null {
  if (typeof value === "string") {
    return getStringEvidenceReason(value, path);
  }

  if (typeof value === "boolean") {
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const [index, child] of value.entries()) {
      const reason = getFigmaOrTestSeedEvidenceReasonAtPath(child, `${path}[${index}]`);
      if (reason) {
        return reason;
      }
    }
    return null;
  }

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.trim().toLowerCase();
    if (normalizedKey === "is_test" && child === true) {
      return `${path}.${key} is marked is_test=true`;
    }

    if (
      normalizedKey === "source" &&
      typeof child === "string" &&
      child.trim().toLowerCase() === FIGMA_TEST_SEED_SOURCE
    ) {
      return `${path}.${key} is marked source=${FIGMA_TEST_SEED_SOURCE}`;
    }

    if (
      normalizedKey === "seed_family" &&
      typeof child === "string" &&
      child.trim().toLowerCase() === FIGMA_TEST_SEED_FAMILY
    ) {
      return `${path}.${key} is marked seed_family=${FIGMA_TEST_SEED_FAMILY}`;
    }

    if (
      normalizedKey === "environment" &&
      typeof child === "string" &&
      child.trim().toLowerCase() === FIGMA_TEST_SEED_ENVIRONMENT
    ) {
      return `${path}.${key} is marked environment=${FIGMA_TEST_SEED_ENVIRONMENT}`;
    }

    const reason = getFigmaOrTestSeedEvidenceReasonAtPath(child, `${path}.${key}`);
    if (reason) {
      return reason;
    }
  }

  return null;
}

function getStringEvidenceReason(value: string, path: string): string | null {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();

  if (/^test\s+/.test(normalized)) {
    return `${path} starts with Test`;
  }

  if (normalized.endsWith(".test") || normalized.includes("@mymedlife.test")) {
    return `${path} uses a test-only domain`;
  }

  for (const marker of figmaSeedMarkerStrings) {
    if (normalized.includes(marker)) {
      return `${path} contains ${marker}`;
    }
  }

  return null;
}

function getFigmaTestSeedExclusionMessage() {
  return "Sandbox-only figma_seed_v1/Test data must stay out of production rollout evidence.";
}

function getShellLogins(
  environment: TestProductionSeedEnvironment,
  shell: FigmaTestSeedShellKey,
): FigmaTestSeedLogin[] {
  const roles = new Set(shellRoleMap[shell]);
  return environment.logins
    .filter((login) => roles.has(login.role))
    .slice(0, shell === "staff_command_center" || shell === "admin_backend" ? 2 : 1)
    .map((login) => ({
      ...login,
      seedFamily: FIGMA_TEST_SEED_FAMILY,
      source: FIGMA_TEST_SEED_SOURCE,
      environment: FIGMA_TEST_SEED_ENVIRONMENT,
      isTest: true,
    }));
}

function escapeCell(value: string) {
  return value.replaceAll("|", "\\|");
}
