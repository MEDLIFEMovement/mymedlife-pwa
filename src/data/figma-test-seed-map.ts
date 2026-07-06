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
    sourceValues: ["Sofia", "Sofia R.", "Sofia Alvarez", "Sofia Reyes"],
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
    ],
    testLabel: "Test Story And Proof Fixtures",
    disposition: "fixture_only",
    supportsShells: ["/proof-library", "/leader", "/staff"],
    markers: figmaTestSeedMarkers,
    notes: "Stories, patient/student quotes, external embeds, and stock imagery stay fixture-only until consent and storage are approved.",
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
    sourceValues: ["Howard University", "Morehouse College", "Spelman College", "Michigan State", "secret-ref:luma:staging:v1"],
    testLabel: "Test Admin Fixture Rows",
    disposition: "fixture_only",
    supportsShells: ["/admin", "/staff"],
    markers: figmaTestSeedMarkers,
    notes: "Admin module, audit, and API key placeholder rows stay fixture-only unless a safe secret-reference model is approved.",
  },
];

const figmaSeedMarkerStrings = new Set([
  FIGMA_TEST_SEED_SOURCE,
  FIGMA_TEST_SEED_FAMILY,
  "test_production_seed",
  "test_production_v1",
]);

export function getFigmaTestSeedRecordsByShell(shell: FigmaSeedShell) {
  return figmaTestSeedRecords.filter((record) => record.supportsShells.includes(shell));
}

export function getFigmaTestSeedValidation() {
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
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
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

