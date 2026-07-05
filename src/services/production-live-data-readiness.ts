export const productionLiveDataRelations = [
  "auth.users",
  "app.profiles",
  "app.chapters.active",
  "app.memberships.approved",
  "app.staff_role_assignments.active",
  "app.coach_chapter_assignments.active",
  "app.campaigns.active",
  "app.assignments",
  "app.points_events",
  "app.audit_logs",
] as const;

export type ProductionLiveDataRelation =
  (typeof productionLiveDataRelations)[number];

export type ProductionLiveDataCounts = Record<ProductionLiveDataRelation, number>;

export type ProductionLiveDataReadiness = {
  ready: boolean;
  minimumChapterCount: number;
  minimumApprovedMembershipCount: number;
  counts: ProductionLiveDataCounts;
  blockers: string[];
  warnings: string[];
  nextSteps: string[];
};

export type ProductionLiveDataReadinessOptions = {
  minimumChapterCount?: number;
  minimumApprovedMembershipCount?: number;
};

export function getProductionLiveDataReadiness(
  counts: ProductionLiveDataCounts,
  options: ProductionLiveDataReadinessOptions = {},
): ProductionLiveDataReadiness {
  const minimumChapterCount = options.minimumChapterCount ?? 30;
  const minimumApprovedMembershipCount =
    options.minimumApprovedMembershipCount ?? 500;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const nextSteps: string[] = [];
  const activeChapters = counts["app.chapters.active"];
  const approvedMemberships = counts["app.memberships.approved"];
  const activeCoachAssignments = counts["app.coach_chapter_assignments.active"];
  const activeCampaigns = counts["app.campaigns.active"];

  if (counts["auth.users"] === 0) {
    blockers.push("Create production Supabase Auth users before inviting chapters.");
  }

  if (counts["app.profiles"] === 0) {
    blockers.push("Create matching production app.profiles rows for launch users.");
  }

  if (activeChapters < minimumChapterCount) {
    blockers.push(
      `Add at least ${minimumChapterCount} active production chapters. Current active chapters: ${activeChapters}.`,
    );
  }

  if (approvedMemberships === 0) {
    blockers.push("Add approved production memberships for launch users.");
  } else if (approvedMemberships < minimumApprovedMembershipCount) {
    blockers.push(
      `Add at least ${minimumApprovedMembershipCount} approved production memberships before inviting students. Current approved memberships: ${approvedMemberships}.`,
    );
  }

  if (counts["app.staff_role_assignments.active"] === 0) {
    blockers.push("Add active staff/admin role assignments for day-one support.");
  }

  if (activeCoachAssignments === 0) {
    blockers.push("Add active production coach assignments for launch chapters.");
  } else if (activeCoachAssignments < activeChapters) {
    blockers.push(
      `Add active coach assignments for every active chapter. Current active chapters: ${activeChapters}; active coach assignments: ${activeCoachAssignments}.`,
    );
  }

  if (activeCampaigns === 0) {
    blockers.push("Add active production launch campaigns for rollout chapters.");
  } else if (activeCampaigns < activeChapters) {
    blockers.push(
      `Add one active launch campaign for every active chapter. Current active chapters: ${activeChapters}; active campaigns: ${activeCampaigns}.`,
    );
  }

  if (counts["app.assignments"] === 0) {
    warnings.push(
      "No production assignments exist yet; chapter/member route checks will be thin until launch work is seeded.",
    );
  }

  if (counts["app.points_events"] === 0) {
    warnings.push(
      "No production points events exist yet; leaderboard proof still needs a live event/points rehearsal.",
    );
  }

  if (counts["app.audit_logs"] === 0) {
    warnings.push(
      "No production audit logs exist yet; run the approved write/readback rehearsal before broad rollout.",
    );
  }

  if (blockers.length > 0) {
    nextSteps.push(
      "Apply the reviewed 30-chapter rollout packet through the approved production path.",
    );
    nextSteps.push(
      "Rerun this count check, then run signed-in route checks for /app, /leader, /staff, and /admin.",
    );
  } else {
    nextSteps.push(
      "Run the rollout packet validator and signed-in role checks; this count check does not prove row-by-row ownership.",
    );
  }

  return {
    ready: blockers.length === 0,
    minimumChapterCount,
    minimumApprovedMembershipCount,
    counts,
    blockers,
    warnings,
    nextSteps,
  };
}

export function formatProductionLiveDataReadiness(
  readiness: ProductionLiveDataReadiness,
): string {
  return [
    readiness.ready
      ? "Production live data count check: READY"
      : "Production live data count check: NOT READY",
    "",
    `Minimum active chapters: ${readiness.minimumChapterCount}`,
    `Minimum approved memberships: ${readiness.minimumApprovedMembershipCount}`,
    "",
    "Counts:",
    ...productionLiveDataRelations.map(
      (relation) => `- ${relation}: ${readiness.counts[relation]}`,
    ),
    "",
    "Blockers:",
    ...formatList(readiness.blockers, "None"),
    "",
    "Warnings:",
    ...formatList(readiness.warnings, "None"),
    "",
    "Next steps:",
    ...formatList(readiness.nextSteps, "None"),
  ].join("\n");
}

export function parseProductionLiveDataCountCsv(
  csvOutput: string,
): ProductionLiveDataCounts {
  const allowedRelations = new Set<string>(productionLiveDataRelations);
  const counts = Object.fromEntries(
    productionLiveDataRelations.map((relation) => [relation, null]),
  ) as Record<ProductionLiveDataRelation, number | null>;
  const lines = csvOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headerIndex = lines.findIndex((line) => line === "relation,rows");

  if (headerIndex === -1) {
    throw new Error("Could not find relation,rows CSV header in Supabase output.");
  }

  for (const line of lines.slice(headerIndex + 1)) {
    const match = /^([^,]+),(\d+)$/.exec(line);

    if (!match) {
      continue;
    }

    const [, relation, rowCount] = match;

    if (!allowedRelations.has(relation)) {
      continue;
    }

    counts[relation as ProductionLiveDataRelation] = Number(rowCount);
  }

  const missing = productionLiveDataRelations.filter(
    (relation) => counts[relation] === null,
  );

  if (missing.length > 0) {
    throw new Error(`Supabase count output is missing: ${missing.join(", ")}.`);
  }

  return counts as ProductionLiveDataCounts;
}

function formatList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}
