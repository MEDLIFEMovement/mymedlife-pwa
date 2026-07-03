import { resolveRuntimeFeatureFlagEnvironment } from "@/services/runtime-feature-flags";
import type {
  ChapterLumaCalendarRow,
  ChapterRow,
  RolloutEnvironment,
} from "@/shared/types/persistence";

export type ChapterLumaCalendarEnv = {
  LUMA_CALENDAR_ID?: string;
  MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON?: string;
  MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID?: string;
  MYMEDLIFE_AUTH_MODE?: string;
  VERCEL_ENV?: string;
};

export type ChapterLumaCalendarStatus = "ready" | "shared_default" | "needs_setup";
export type ChapterLumaMappingMode =
  | "saved_map"
  | "temporary_map"
  | "shared_default"
  | "unmapped";

export type ChapterLumaCalendarSummaryRow = {
  chapterId: string;
  chapterName: string;
  campus: string;
  region: string;
  calendarId: string | null;
  calendarIdHint: string | null;
  calendarLabel: string;
  status: ChapterLumaCalendarStatus;
  readyForPilot: boolean;
  wideningReady: boolean;
  mappingMode: ChapterLumaMappingMode;
  mappingSourceLabel: string;
  note: string;
};

export type ChapterLumaCalendarSummary = {
  rows: ChapterLumaCalendarSummaryRow[];
  readyCount: number;
  explicitReadyCount: number;
  savedReadyCount: number;
  temporaryReadyCount: number;
  sharedDefaultCount: number;
  needsSetupCount: number;
  totalCount: number;
  detail: string;
};

export type ChapterLumaRolloutStageKey =
  | "pilot_1"
  | "wave_5"
  | "wave_25"
  | "wave_300";

export type ChapterLumaRolloutStage = {
  key: ChapterLumaRolloutStageKey;
  label: string;
  targetChapters: number;
  mappedChapters: number;
  status: "ready" | "blocked";
  detail: string;
};

type ChapterSeed = Pick<
  ChapterLumaCalendarSummaryRow,
  "chapterId" | "chapterName" | "campus" | "region"
>;

type VisibleChapterRow = Pick<ChapterRow, "id" | "name" | "campus" | "region">;
type ChapterLike = ChapterSeed | VisibleChapterRow;

type ChapterLumaCalendarConfig = {
  chapterId: string | null;
  chapterName: string | null;
  calendarId: string;
  calendarLabel: string | null;
  note: string | null;
  status: Extract<ChapterLumaCalendarStatus, "ready" | "shared_default">;
  source: "persisted" | "env_registry";
};

export type ChapterLumaCalendarSummaryOptions = {
  chapters?: readonly ChapterLike[] | readonly ChapterRow[];
  env?: ChapterLumaCalendarEnv;
  persistedRows?: readonly ChapterLumaCalendarRow[];
};

const defaultSeededChapters: readonly ChapterSeed[] = [
  {
    chapterId: "10000000-0000-4000-8000-000000000001",
    chapterName: "UCLA MEDLIFE",
    campus: "UCLA",
    region: "West Coast",
  },
  {
    chapterId: "10000000-0000-4000-8000-000000000002",
    chapterName: "Lakeside MEDLIFE",
    campus: "Lakeside College",
    region: "Northeast",
  },
  {
    chapterId: "10000000-0000-4000-8000-000000000003",
    chapterName: "Boston College MEDLIFE",
    campus: "Boston College",
    region: "Northeast",
  },
  {
    chapterId: "10000000-0000-4000-8000-000000000004",
    chapterName: "UC San Diego MEDLIFE",
    campus: "UC San Diego",
    region: "West Coast",
  },
  {
    chapterId: "10000000-0000-4000-8000-000000000005",
    chapterName: "McGill MEDLIFE",
    campus: "McGill University",
    region: "Canada",
  },
] as const;

export function getChapterLumaCalendarSummary(
  input: ChapterLumaCalendarSummaryOptions | ChapterLumaCalendarEnv = process.env as ChapterLumaCalendarEnv,
): ChapterLumaCalendarSummary {
  const env = getSummaryEnv(input);
  const explicitConfigs = [
    ...parsePersistedChapterCalendarConfigs(getPersistedRows(input), env),
    ...parseChapterCalendarConfigs(env),
  ];
  const { chapters } = normalizeSummaryOptions(input, explicitConfigs);
  const sharedCalendarId = normalizeOptionalString(env.LUMA_CALENDAR_ID);
  const sharedDefaultChapterId =
    normalizeOptionalString(env.MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID) ??
    chapters[0]?.chapterId ??
    null;
  const rows = chapters.map((chapter) =>
    buildSummaryRow(chapter, {
      explicitConfigs,
      sharedCalendarId,
      sharedDefaultChapterId,
    }),
  );
  const readyCount = rows.filter((row) => row.readyForPilot).length;
  const explicitReadyCount = rows.filter((row) => row.status === "ready").length;
  const savedReadyCount = rows.filter((row) => row.mappingMode === "saved_map").length;
  const temporaryReadyCount = rows.filter(
    (row) => row.mappingMode === "temporary_map",
  ).length;
  const sharedDefaultCount = rows.filter((row) => row.status === "shared_default").length;
  const needsSetupCount = rows.filter((row) => row.status === "needs_setup").length;

  return {
    rows,
    readyCount,
    explicitReadyCount,
    savedReadyCount,
    temporaryReadyCount,
    sharedDefaultCount,
    needsSetupCount,
    totalCount: rows.length,
    detail: describeCoverage({
      readyCount,
      sharedDefaultCount,
      needsSetupCount,
      totalCount: rows.length,
    }),
  };
}

export function getChapterLumaRolloutReadiness(
  input: ChapterLumaCalendarSummaryOptions | ChapterLumaCalendarEnv = process.env as ChapterLumaCalendarEnv,
): ChapterLumaRolloutStage[] {
  const summary = getChapterLumaCalendarSummary(input);
  const mappedChapters = summary.readyCount;
  const explicitMappedChapters = summary.explicitReadyCount;

  return [
    createRolloutStage({
      key: "pilot_1",
      label: "1 chapter pilot",
      targetChapters: 1,
      mappedChapters,
      requiredMappedChapters: 1,
      detailWhenReady:
        "One chapter has a Luma calendar path, so the live event loop can run as a narrow pilot once write gates and reviewer proof are approved.",
      detailWhenBlocked:
        "Map at least one chapter to a usable Luma calendar before opening the first live event loop.",
    }),
    createRolloutStage({
      key: "wave_5",
      label: "First 5 chapters",
      targetChapters: 5,
      mappedChapters,
      requiredMappedChapters: 5,
      detailWhenReady:
        "Five chapters have calendar coverage, so the event loop can widen to a small multi-chapter launch once attendance and points proof stays stable.",
      detailWhenBlocked:
        "Map five chapters to Luma before widening beyond the narrow pilot. Shared-default coverage is fine for one chapter, but each chapter still needs its own clear calendar path.",
    }),
    createRolloutStage({
      key: "wave_25",
      label: "25 chapter rollout",
      targetChapters: 25,
      mappedChapters: explicitMappedChapters,
      requiredMappedChapters: 25,
      detailWhenReady:
        "Twenty-five chapters have explicit calendar assignments, which is the minimum healthy base for a managed regional rollout.",
      detailWhenBlocked:
        "Use explicit chapter-to-calendar assignments for the 25 chapter rollout. Shared-default staging coverage does not count at this size.",
    }),
    createRolloutStage({
      key: "wave_300",
      label: "300 chapter network",
      targetChapters: 300,
      mappedChapters: explicitMappedChapters,
      requiredMappedChapters: 300,
      detailWhenReady:
        "All 300 chapters have explicit calendar assignments, which is the minimum mapping posture for a network-wide Luma event loop.",
      detailWhenBlocked:
        "The 300 chapter goal requires explicit chapter-to-calendar assignments at full network scale. Do not treat shared-default staging coverage as production readiness.",
    }),
  ];
}

export function resolveChapterLumaCalendar(
  input: {
    chapterId?: string | null;
    chapterName?: string | null;
    allowSharedDefaultFallback?: boolean;
  },
  options: ChapterLumaCalendarSummaryOptions | ChapterLumaCalendarEnv = process.env as ChapterLumaCalendarEnv,
): ChapterLumaCalendarSummaryRow | null {
  const summary = getChapterLumaCalendarSummary(options);
  const normalizedChapterId = normalizeOptionalString(input.chapterId);
  const normalizedChapterName = normalizeName(input.chapterName);
  const matched =
    summary.rows.find((row) => row.chapterId === normalizedChapterId) ??
    summary.rows.find((row) => normalizeName(row.chapterName) === normalizedChapterName);

  if (matched) {
    if (
      normalizedChapterName &&
      matched.chapterId === normalizedChapterId &&
      matched.chapterName.startsWith("Configured chapter ")
    ) {
      return {
        ...matched,
        chapterName: input.chapterName?.trim() ?? matched.chapterName,
      };
    }

    return matched;
  }

  if (!input.allowSharedDefaultFallback) {
    return null;
  }

  return summary.rows.find((row) => row.status === "shared_default") ?? null;
}

function normalizeSummaryOptions(
  input: ChapterLumaCalendarSummaryOptions | ChapterLumaCalendarEnv,
  explicitConfigs: ChapterLumaCalendarConfig[],
) {
  if (isSummaryOptions(input)) {
    return {
      chapters: normalizeChapters(input.chapters, explicitConfigs),
    };
  }

  return {
    chapters: normalizeChapters(undefined, explicitConfigs),
  };
}

function normalizeChapters(
  chapters?: readonly ChapterLike[] | readonly ChapterRow[],
  explicitConfigs: ChapterLumaCalendarConfig[] = [],
): ChapterSeed[] {
  const source = chapters && chapters.length > 0 ? chapters : defaultSeededChapters;
  const normalized = source.map((chapter) => toChapterSeed(chapter));

  if (chapters && chapters.length > 0) {
    return normalized;
  }

  return mergeChapterSeeds(normalized, explicitConfigs);
}

function buildSummaryRow(
  chapter: ChapterSeed,
  input: {
    explicitConfigs: ChapterLumaCalendarConfig[];
    sharedCalendarId: string | null;
    sharedDefaultChapterId: string | null;
  },
): ChapterLumaCalendarSummaryRow {
  const explicitConfig = findExplicitConfig(chapter, input.explicitConfigs);

  if (explicitConfig) {
    const mappingMode = getConfigMappingMode(explicitConfig);

    return {
      ...chapter,
      calendarId: explicitConfig.calendarId,
      calendarIdHint: maskCalendarId(explicitConfig.calendarId),
      calendarLabel:
        explicitConfig.calendarLabel ?? `${chapter.chapterName} calendar`,
      status: explicitConfig.status,
      readyForPilot: true,
      wideningReady: mappingMode === "saved_map",
      mappingMode,
      mappingSourceLabel: getMappingSourceLabel(mappingMode),
      note:
        explicitConfig.note ??
        getExplicitConfigNote(explicitConfig),
    };
  }

  if (
    input.sharedCalendarId &&
    chapter.chapterId === input.sharedDefaultChapterId
  ) {
    return {
      ...chapter,
      calendarId: input.sharedCalendarId,
      calendarIdHint: maskCalendarId(input.sharedCalendarId),
      calendarLabel: "Shared staging Luma calendar",
      status: "shared_default",
      readyForPilot: true,
      wideningReady: false,
      mappingMode: "shared_default",
      mappingSourceLabel: getMappingSourceLabel("shared_default"),
      note:
        "This chapter can use the current shared staging calendar while chapter-by-chapter calendars are still being assigned.",
    };
  }

  return {
    ...chapter,
    calendarId: null,
    calendarIdHint: null,
    calendarLabel: "Calendar not assigned",
    status: "needs_setup",
    readyForPilot: false,
    wideningReady: false,
    mappingMode: "unmapped",
    mappingSourceLabel: getMappingSourceLabel("unmapped"),
    note:
      "Assign a dedicated chapter calendar before this chapter uses live event creation, RSVP writeback, or attendance import.",
  };
}

function findExplicitConfig(
  chapter: ChapterSeed,
  configs: ChapterLumaCalendarConfig[],
) {
  const normalizedChapterName = normalizeName(chapter.chapterName);

  return configs.find((config) => {
    if (config.chapterId && config.chapterId === chapter.chapterId) {
      return true;
    }

    return config.chapterName !== null &&
      normalizeName(config.chapterName) === normalizedChapterName;
  });
}

function parseChapterCalendarConfigs(
  env: ChapterLumaCalendarEnv,
): ChapterLumaCalendarConfig[] {
  const raw = normalizeOptionalString(env.MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      return parsed
        .map((value) => normalizeConfigValue(value))
        .filter((value): value is ChapterLumaCalendarConfig => value !== null);
    }

    if (isRecord(parsed)) {
      return Object.entries(parsed)
        .map(([key, value]) => normalizeConfigValue(value, key))
        .filter((value): value is ChapterLumaCalendarConfig => value !== null);
    }
  } catch {
    return [];
  }

  return [];
}

function normalizeConfigValue(
  value: unknown,
  fallbackMatchKey?: string,
): ChapterLumaCalendarConfig | null {
  if (typeof value === "string") {
    const calendarId = normalizeOptionalString(value);

    if (!calendarId) {
      return null;
    }

    return {
      chapterId: looksLikeChapterId(fallbackMatchKey) ? fallbackMatchKey ?? null : null,
      chapterName:
        !looksLikeChapterId(fallbackMatchKey) && fallbackMatchKey
          ? fallbackMatchKey
          : null,
      calendarId,
      calendarLabel: null,
      note: null,
      status: "ready",
      source: "env_registry",
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const calendarId = readRecordString(value, "calendarId");

  if (!calendarId) {
    return null;
  }

  return {
    chapterId:
      readRecordString(value, "chapterId") ??
      (looksLikeChapterId(fallbackMatchKey) ? fallbackMatchKey ?? null : null),
    chapterName:
      readRecordString(value, "chapterName") ??
      (!looksLikeChapterId(fallbackMatchKey) && fallbackMatchKey
        ? fallbackMatchKey
        : null),
    calendarId,
    calendarLabel: readRecordString(value, "calendarLabel"),
    note: readRecordString(value, "note"),
    status:
      value.status === "shared_default" ? "shared_default" : "ready",
    source: "env_registry",
  };
}

function parsePersistedChapterCalendarConfigs(
  rows: readonly ChapterLumaCalendarRow[],
  env: ChapterLumaCalendarEnv,
): ChapterLumaCalendarConfig[] {
  const environment = resolveChapterLumaCalendarEnvironment(env);
  const environmentRows = selectPersistedRowsForEnvironment(rows, environment);

  return environmentRows
    .filter(isUsablePersistedCalendarRow)
    .map((row) => ({
      chapterId: row.chapter_id,
      chapterName: null,
      calendarId: row.calendar_id,
      calendarLabel: normalizeOptionalString(row.calendar_label),
      note: normalizeOptionalString(row.notes),
      status: row.is_default ? "shared_default" : "ready",
      source: "persisted" as const,
    }));
}

function selectPersistedRowsForEnvironment(
  rows: readonly ChapterLumaCalendarRow[],
  environment: RolloutEnvironment,
) {
  const matchingRows = rows.filter((row) => row.environment === environment);

  if (matchingRows.length > 0) {
    return matchingRows;
  }

  if (environment === "local") {
    return rows.filter((row) => row.environment === "staging");
  }

  return matchingRows;
}

function getSummaryEnv(
  input: ChapterLumaCalendarSummaryOptions | ChapterLumaCalendarEnv,
): ChapterLumaCalendarEnv {
  if (isSummaryOptions(input)) {
    return input.env ?? (process.env as ChapterLumaCalendarEnv);
  }

  return input;
}

function getPersistedRows(
  input: ChapterLumaCalendarSummaryOptions | ChapterLumaCalendarEnv,
): readonly ChapterLumaCalendarRow[] {
  if (isSummaryOptions(input)) {
    return input.persistedRows ?? [];
  }

  return [];
}

function mergeChapterSeeds(
  chapters: ChapterSeed[],
  explicitConfigs: ChapterLumaCalendarConfig[],
): ChapterSeed[] {
  const rows = [...chapters];

  for (const config of explicitConfigs) {
    const seed = toChapterSeedFromConfig(config);

    if (!seed) {
      continue;
    }

    const alreadyPresent = rows.some((row) => {
      if (config.chapterId && row.chapterId === config.chapterId) {
        return true;
      }

      return normalizeName(row.chapterName) === normalizeName(seed.chapterName);
    });

    if (!alreadyPresent) {
      rows.push(seed);
    }
  }

  return rows;
}

function toChapterSeedFromConfig(
  config: ChapterLumaCalendarConfig,
): ChapterSeed | null {
  const chapterId = config.chapterId ?? normalizeConfigChapterId(config.chapterName);
  const chapterName =
    config.chapterName ??
    (config.chapterId ? `Configured chapter ${config.chapterId.slice(-8)}` : null);

  if (!chapterId || !chapterName) {
    return null;
  }

  return {
    chapterId,
    chapterName,
    campus: "Configured in calendar registry",
    region: "Unassigned region",
  };
}

function normalizeConfigChapterId(value: string | null) {
  if (!value) {
    return null;
  }

  return `configured-${value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function describeCoverage(input: {
  readyCount: number;
  sharedDefaultCount: number;
  needsSetupCount: number;
  totalCount: number;
}): string {
  if (input.totalCount === 0) {
    return "No chapters are visible yet, so there is no chapter-to-Luma mapping to review.";
  }

  if (input.readyCount === 0) {
    return "No chapter calendars are configured yet, so every chapter stays blocked.";
  }

  if (input.needsSetupCount === 0) {
    return `All ${input.totalCount} visible chapters have a calendar path. Keep production writes off until each chapter's reviewer path and event loop are validated.`;
  }

  if (input.sharedDefaultCount > 0) {
    const sharedDefaultLabel =
      input.sharedDefaultCount === 1 ? "chapter uses" : "chapters use";
    const remainingLabel =
      input.needsSetupCount === 1
        ? "remaining chapter still needs"
        : "remaining chapters still need";

    return `${input.readyCount} of ${input.totalCount} visible chapters have a calendar path today. ${input.sharedDefaultCount} ${sharedDefaultLabel} the shared staging default first, and ${input.needsSetupCount} ${remainingLabel} explicit calendar assignment before the loop can scale cleanly.`;
  }

  return `${input.readyCount} of ${input.totalCount} visible chapters have an explicit calendar assignment. ${input.needsSetupCount} still need setup before widening the pilot.`;
}

function getExplicitConfigNote(config: ChapterLumaCalendarConfig): string {
  if (config.source === "persisted") {
    return config.status === "shared_default"
      ? "This chapter uses the saved in-app staging default while dedicated chapter calendars are still being assigned."
      : "This chapter has a saved in-app Luma calendar assignment and can use the live event loop once the write gates are approved.";
  }

  return config.status === "shared_default"
    ? "This chapter is still using an env-backed shared default. Save it in myMEDLIFE before widening the pilot."
    : "This chapter is using an env-backed Luma calendar mapping. Save it in myMEDLIFE before widening the pilot.";
}

function createRolloutStage(input: {
  key: ChapterLumaRolloutStageKey;
  label: string;
  targetChapters: number;
  mappedChapters: number;
  requiredMappedChapters: number;
  detailWhenReady: string;
  detailWhenBlocked: string;
}): ChapterLumaRolloutStage {
  const status =
    input.mappedChapters >= input.requiredMappedChapters ? "ready" : "blocked";

  return {
    key: input.key,
    label: input.label,
    targetChapters: input.targetChapters,
    mappedChapters: input.mappedChapters,
    status,
    detail: status === "ready"
      ? input.detailWhenReady
      : `${input.detailWhenBlocked} ${input.mappedChapters} of ${input.requiredMappedChapters} needed chapters are mapped right now.`,
  };
}

function getConfigMappingMode(
  config: ChapterLumaCalendarConfig,
): ChapterLumaMappingMode {
  if (config.status === "shared_default") {
    return "shared_default";
  }

  return config.source === "persisted" ? "saved_map" : "temporary_map";
}

function getMappingSourceLabel(mode: ChapterLumaMappingMode) {
  switch (mode) {
    case "saved_map":
      return "Saved in myMEDLIFE";
    case "temporary_map":
      return "Temporary env map";
    case "shared_default":
      return "Shared default";
    case "unmapped":
      return "Needs saved map";
  }
}

function looksLikeChapterId(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0 && value.includes("-");
}

function resolveChapterLumaCalendarEnvironment(
  env: ChapterLumaCalendarEnv,
): RolloutEnvironment {
  return resolveRuntimeFeatureFlagEnvironment(env);
}

function maskCalendarId(value: string): string {
  if (value.length <= 8) {
    return value;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function normalizeName(value: string | null | undefined): string {
  return normalizeOptionalString(value)?.toLowerCase() ?? "";
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isSummaryOptions(
  value: ChapterLumaCalendarSummaryOptions | ChapterLumaCalendarEnv,
): value is ChapterLumaCalendarSummaryOptions {
  return "chapters" in value || "env" in value || "persistedRows" in value;
}

function toChapterSeed(chapter: ChapterLike | ChapterRow): ChapterSeed {
  if ("id" in chapter) {
    return {
      chapterId: chapter.id,
      chapterName: chapter.name,
      campus: chapter.campus,
      region: chapter.region ?? "Unassigned region",
    };
  }

  return {
    chapterId: chapter.chapterId,
    chapterName: chapter.chapterName,
    campus: chapter.campus,
    region: chapter.region,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUsablePersistedCalendarRow(row: ChapterLumaCalendarRow) {
  if (!normalizeOptionalString(row.calendar_id)) {
    return false;
  }

  return row.status === "linked" || row.status === "mocked" || row.status === "pending";
}

function readRecordString(
  value: Record<string, unknown>,
  key: string,
): string | null {
  return normalizeOptionalString(
    typeof value[key] === "string" ? value[key] : null,
  );
}
