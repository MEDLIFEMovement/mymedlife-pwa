import type {
  ProductionBootstrapChapter,
  ProductionBootstrapLumaCalendar,
  ProductionRolloutBootstrapOptions,
  ProductionRolloutBootstrapPacket,
} from "./production-rollout-bootstrap.ts";

type RuntimeMappingStatus = "ready" | "shared_default" | "needs_setup" | "inactive";

type RuntimeMapping = {
  chapterId: string | null;
  chapterName: string | null;
  calendarId: string;
  status: RuntimeMappingStatus;
};

export type ProductionLumaMappingEnv = {
  MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON?: string;
};

export type ProductionLumaMappingReadinessOptions =
  ProductionRolloutBootstrapOptions & {
    runtimeMappingJson?: string | null;
    env?: ProductionLumaMappingEnv;
  };

export type ProductionLumaMappingReadiness = {
  ready: boolean;
  minimums: {
    chapters: number;
    pilotChapters: number;
  };
  counts: {
    activeChapters: number;
    packetLinkedMappings: number;
    packetMappedActiveChapters: number;
    runtimeMappedActiveChapters: number;
    runtimeMatchedActiveChapters: number;
    runtimeMismatchedActiveChapters: number;
    pilotMappedChapters: number;
  };
  blockers: string[];
  warnings: string[];
  nextSteps: string[];
};

export type ProductionLumaRuntimeRegistryEntry = {
  chapterId: string;
  chapterName: string;
  calendarId: string;
  calendarLabel: string;
  status: "ready";
  note: string;
};

export type ProductionLumaRuntimeRegistryExport = {
  ready: boolean;
  registry: Record<string, ProductionLumaRuntimeRegistryEntry>;
  registryJson: string;
  readiness: ProductionLumaMappingReadiness;
};

export function getProductionLumaMappingReadiness(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionLumaMappingReadinessOptions = {},
): ProductionLumaMappingReadiness {
  const minimums = {
    chapters: options.minimumChapterCount ?? 30,
    pilotChapters: options.minimumPilotChapterCount ?? 5,
  };
  const blockers: string[] = [];
  const warnings: string[] = [];
  const activeChapters = packet.chapters.filter(
    (chapter) => (chapter.status ?? "active") === "active",
  );
  const activeChapterIds = new Set(activeChapters.map((chapter) => chapter.id));
  const linkedPacketMappings = (packet.lumaCalendars ?? []).filter(
    (calendar) => (calendar.status ?? "linked") === "linked",
  );
  const packetMappingsByChapter = indexPacketMappings(
    linkedPacketMappings,
    activeChapters,
    blockers,
  );
  const runtimeMappingJson =
    options.runtimeMappingJson ??
    options.env?.MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON ??
    null;
  const runtimeMappings = parseRuntimeMappings(
    runtimeMappingJson,
    activeChapters,
    blockers,
  );
  const runtimeMappingsByChapter = indexRuntimeMappings(
    runtimeMappings,
    activeChapters,
    blockers,
  );
  let runtimeMatchedActiveChapters = 0;
  let runtimeMismatchedActiveChapters = 0;

  if (activeChapters.length < minimums.chapters) {
    blockers.push(
      `Add at least ${minimums.chapters} active chapters before the 30-chapter Luma mapping gate. Current active chapters: ${activeChapters.length}.`,
    );
  }

  addMissingPacketMappingBlockers(blockers, activeChapters, packetMappingsByChapter);

  if (packetMappingsByChapter.size < minimums.chapters) {
    blockers.push(
      `Add linked Luma calendar mappings for all ${minimums.chapters} launch chapters. Current mapped active chapters: ${packetMappingsByChapter.size}.`,
    );
  }

  for (const calendar of linkedPacketMappings) {
    if (!activeChapterIds.has(calendar.chapterId)) {
      blockers.push(
        `Linked Luma mapping ${maskExternalId(calendar.calendarId)} references unknown or inactive chapter ${calendar.chapterId}.`,
      );
    }

    if (!normalizeString(calendar.calendarId)) {
      blockers.push(`${calendar.chapterId} needs a non-empty Luma calendar id.`);
    }

    if (looksLikeSecret(calendar.calendarId)) {
      blockers.push(
        `${calendar.chapterId} has a calendar id that looks like a secret or API key. Replace it with the Luma calendar id only.`,
      );
    }
  }

  if (!runtimeMappingJson) {
    blockers.push(
      "Add the runtime chapter-to-Luma mapping before hosted rollout proof. Set MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON or pass --mapping-json with the approved registry.",
    );
  }

  if (runtimeMappingJson) {
    addMissingRuntimeMappingBlockers(
      blockers,
      activeChapters,
      runtimeMappingsByChapter,
    );

    for (const chapter of activeChapters) {
      const packetMapping = packetMappingsByChapter.get(chapter.id);
      const runtimeMapping = runtimeMappingsByChapter.get(chapter.id);

      if (!packetMapping || !runtimeMapping) {
        continue;
      }

      if (normalizeId(packetMapping.calendarId) !== normalizeId(runtimeMapping.calendarId)) {
        runtimeMismatchedActiveChapters += 1;
        blockers.push(
          `${chapter.name} has different packet and runtime Luma calendar ids (${maskExternalId(packetMapping.calendarId)} vs ${maskExternalId(runtimeMapping.calendarId)}).`,
        );
      } else {
        runtimeMatchedActiveChapters += 1;
      }
    }
  }

  const pilotMappedChapters = getPilotMappedChapterCount(
    activeChapters,
    packetMappingsByChapter,
    runtimeMappingJson ? runtimeMappingsByChapter : null,
  );

  if (pilotMappedChapters < minimums.pilotChapters) {
    blockers.push(
      `Map at least ${minimums.pilotChapters} pilot chapters in both the packet and runtime registry before five-chapter event-loop proof. Current pilot-ready mapped chapters: ${pilotMappedChapters}.`,
    );
  }

  if (packet.pilotEventProof && packet.pilotEventProof.length > 0) {
    const proofChapterIds = new Set(
      packet.pilotEventProof.map((proof) => proof.chapterId),
    );

    for (const chapterId of proofChapterIds) {
      if (!packetMappingsByChapter.has(chapterId)) {
        blockers.push(
          `${chapterId} has pilot event proof but no linked Luma calendar mapping in the rollout packet.`,
        );
      }

      if (runtimeMappingJson && !runtimeMappingsByChapter.has(chapterId)) {
        blockers.push(
          `${chapterId} has pilot event proof but no runtime Luma calendar mapping.`,
        );
      }
    }
  } else {
    warnings.push(
      "No pilot event proof rows are present yet. This mapping check can pass before event proof, but broad invites still require the five-chapter RSVP, attendance, points, audit, and zero-send proof.",
    );
  }

  return {
    ready: blockers.length === 0,
    minimums,
    counts: {
      activeChapters: activeChapters.length,
      packetLinkedMappings: linkedPacketMappings.length,
      packetMappedActiveChapters: packetMappingsByChapter.size,
      runtimeMappedActiveChapters: runtimeMappingsByChapter.size,
      runtimeMatchedActiveChapters,
      runtimeMismatchedActiveChapters,
      pilotMappedChapters,
    },
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    nextSteps:
      blockers.length === 0
        ? [
            "Save this report with the MED-504 rollout evidence.",
            "Run the five-chapter Luma event, RSVP, attendance, points, audit, and zero-send proof next.",
            "Keep Luma writes and invitations gated until the pilot proof and final invite gate are ready.",
          ]
        : [
            "Fix the Luma mapping blockers above before inviting launch chapters.",
            "Re-run this check before production data apply or hosted event proof.",
            "Do not paste Luma API keys, tokens, or secrets into rollout CSVs or runtime mapping JSON.",
          ],
  };
}

export function createProductionLumaRuntimeRegistryExport(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionRolloutBootstrapOptions = {},
): ProductionLumaRuntimeRegistryExport {
  const registry = createRuntimeRegistryFromPacket(packet);
  const registryJson = `${JSON.stringify(registry, null, 2)}\n`;
  const readiness = getProductionLumaMappingReadiness(packet, {
    ...options,
    runtimeMappingJson: registryJson,
  });

  return {
    ready: readiness.ready,
    registry,
    registryJson,
    readiness,
  };
}

export function formatProductionLumaMappingReadiness(
  readiness: ProductionLumaMappingReadiness,
): string {
  return [
    readiness.ready
      ? "Production Luma mapping readiness: READY"
      : "Production Luma mapping readiness: NOT READY",
    "",
    "Minimums:",
    `- active chapters: ${readiness.minimums.chapters}`,
    `- pilot mapped chapters: ${readiness.minimums.pilotChapters}`,
    "",
    "Counts:",
    `- active chapters: ${readiness.counts.activeChapters}`,
    `- packet linked mappings: ${readiness.counts.packetLinkedMappings}`,
    `- packet mapped active chapters: ${readiness.counts.packetMappedActiveChapters}`,
    `- runtime mapped active chapters: ${readiness.counts.runtimeMappedActiveChapters}`,
    `- runtime matched active chapters: ${readiness.counts.runtimeMatchedActiveChapters}`,
    `- runtime mismatched active chapters: ${readiness.counts.runtimeMismatchedActiveChapters}`,
    `- pilot-ready mapped chapters: ${readiness.counts.pilotMappedChapters}`,
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

export function formatProductionLumaRuntimeRegistryExport(
  output: ProductionLumaRuntimeRegistryExport,
  outPath: string,
): string {
  return [
    output.ready
      ? "Production Luma runtime registry export: READY"
      : "Production Luma runtime registry export: NOT READY",
    "",
    output.ready
      ? `Output file: ${outPath}`
      : "Output file: not written",
    "",
    formatProductionLumaMappingReadiness(output.readiness),
  ].join("\n");
}

function createRuntimeRegistryFromPacket(
  packet: ProductionRolloutBootstrapPacket,
): Record<string, ProductionLumaRuntimeRegistryEntry> {
  const chaptersById = new Map(packet.chapters.map((chapter) => [
    chapter.id,
    chapter,
  ]));
  const linkedCalendars = (packet.lumaCalendars ?? []).filter(
    (calendar) => (calendar.status ?? "linked") === "linked",
  );

  return Object.fromEntries(
    linkedCalendars
      .filter((calendar) => chaptersById.has(calendar.chapterId))
      .map((calendar) => {
        const chapter = chaptersById.get(calendar.chapterId)!;

        return [
          calendar.chapterId,
          {
            chapterId: calendar.chapterId,
            chapterName: chapter.name,
            calendarId: calendar.calendarId,
            calendarLabel:
              calendar.calendarName?.trim() || `${chapter.name} Luma calendar`,
            status: "ready" as const,
            note:
              "Generated from the approved myMEDLIFE production rollout packet. Apply through the approved Vercel environment process; do not paste API keys here.",
          },
        ];
      }),
  );
}

function indexPacketMappings(
  calendars: readonly ProductionBootstrapLumaCalendar[],
  activeChapters: readonly ProductionBootstrapChapter[],
  blockers: string[],
) {
  const activeChapterIds = new Set(activeChapters.map((chapter) => chapter.id));
  const byChapter = new Map<string, ProductionBootstrapLumaCalendar>();
  const calendarIds = new Map<string, ProductionBootstrapLumaCalendar>();

  for (const calendar of calendars) {
    if (!activeChapterIds.has(calendar.chapterId)) {
      continue;
    }

    if (byChapter.has(calendar.chapterId)) {
      blockers.push(`Duplicate linked Luma mapping for chapter ${calendar.chapterId}.`);
    }

    byChapter.set(calendar.chapterId, calendar);

    const normalizedCalendarId = normalizeId(calendar.calendarId);
    if (!normalizedCalendarId) {
      continue;
    }

    if (calendarIds.has(normalizedCalendarId)) {
      blockers.push(
        `Duplicate linked Luma calendar id ${maskExternalId(calendar.calendarId)}.`,
      );
    }

    calendarIds.set(normalizedCalendarId, calendar);
  }

  return byChapter;
}

function indexRuntimeMappings(
  mappings: readonly RuntimeMapping[],
  activeChapters: readonly ProductionBootstrapChapter[],
  blockers: string[],
) {
  const byChapter = new Map<string, RuntimeMapping>();
  const byName = new Map(activeChapters.map((chapter) => [
    normalizeName(chapter.name),
    chapter.id,
  ]));
  const activeChapterIds = new Set(activeChapters.map((chapter) => chapter.id));

  for (const mapping of mappings) {
    if (mapping.status !== "ready") {
      continue;
    }

    const chapterId =
      mapping.chapterId ??
      (mapping.chapterName ? byName.get(normalizeName(mapping.chapterName)) : undefined);

    if (!chapterId || !activeChapterIds.has(chapterId)) {
      blockers.push(
        `Runtime Luma mapping ${maskExternalId(mapping.calendarId)} does not match an active launch chapter.`,
      );
      continue;
    }

    if (byChapter.has(chapterId)) {
      blockers.push(`Duplicate runtime Luma mapping for chapter ${chapterId}.`);
    }

    if (looksLikeSecret(mapping.calendarId)) {
      blockers.push(
        `${chapterId} has a runtime Luma value that looks like a secret or API key. Replace it with the Luma calendar id only.`,
      );
    }

    byChapter.set(chapterId, mapping);
  }

  return byChapter;
}

function addMissingPacketMappingBlockers(
  blockers: string[],
  chapters: readonly ProductionBootstrapChapter[],
  mappings: Map<string, ProductionBootstrapLumaCalendar>,
) {
  const missing = chapters.filter((chapter) => !mappings.has(chapter.id));

  if (missing.length === 0) {
    return;
  }

  blockers.push(
    `Missing packet Luma calendar mappings for ${formatChapterList(missing)}.`,
  );
}

function addMissingRuntimeMappingBlockers(
  blockers: string[],
  chapters: readonly ProductionBootstrapChapter[],
  mappings: Map<string, RuntimeMapping>,
) {
  const missing = chapters.filter((chapter) => !mappings.has(chapter.id));

  if (missing.length === 0) {
    return;
  }

  blockers.push(
    `Missing runtime Luma calendar mappings for ${formatChapterList(missing)}.`,
  );
}

function getPilotMappedChapterCount(
  chapters: readonly ProductionBootstrapChapter[],
  packetMappings: Map<string, ProductionBootstrapLumaCalendar>,
  runtimeMappings: Map<string, RuntimeMapping> | null,
) {
  return chapters.filter((chapter) => {
    if (!packetMappings.has(chapter.id)) {
      return false;
    }

    if (!runtimeMappings) {
      return false;
    }

    return runtimeMappings.has(chapter.id);
  }).length;
}

function parseRuntimeMappings(
  raw: string | null,
  activeChapters: readonly ProductionBootstrapChapter[],
  blockers: string[],
): RuntimeMapping[] {
  const trimmed = normalizeString(raw);

  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (Array.isArray(parsed)) {
      return parsed
        .map((value) => normalizeRuntimeMapping(value))
        .filter((value): value is RuntimeMapping => value !== null);
    }

    if (isRecord(parsed)) {
      return Object.entries(parsed)
        .map(([key, value]) => normalizeRuntimeMapping(value, key, activeChapters))
        .filter((value): value is RuntimeMapping => value !== null);
    }
  } catch {
    blockers.push(
      "Runtime Luma mapping JSON could not be parsed. Provide a valid object or array registry.",
    );
    return [];
  }

  blockers.push(
    "Runtime Luma mapping JSON must be an object or array registry.",
  );
  return [];
}

function normalizeRuntimeMapping(
  value: unknown,
  fallbackKey?: string,
  activeChapters: readonly ProductionBootstrapChapter[] = [],
): RuntimeMapping | null {
  if (typeof value === "string") {
    const calendarId = normalizeString(value);

    if (!calendarId) {
      return null;
    }

    return {
      chapterId: matchChapterId(fallbackKey, activeChapters),
      chapterName: matchChapterId(fallbackKey, activeChapters) ? null : normalizeString(fallbackKey),
      calendarId,
      status: "ready",
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const calendarId = normalizeString(readRecordString(value, "calendarId"));

  if (!calendarId) {
    return null;
  }

  return {
    chapterId:
      normalizeString(readRecordString(value, "chapterId")) ??
      matchChapterId(fallbackKey, activeChapters),
    chapterName:
      normalizeString(readRecordString(value, "chapterName")) ??
      (matchChapterId(fallbackKey, activeChapters)
        ? null
        : normalizeString(fallbackKey)),
    calendarId,
    status: normalizeRuntimeStatus(readRecordString(value, "status")),
  };
}

function normalizeRuntimeStatus(value: string | null): RuntimeMappingStatus {
  switch (value) {
    case "shared_default":
      return "shared_default";
    case "needs_setup":
      return "needs_setup";
    case "inactive":
      return "inactive";
    default:
      return "ready";
  }
}

function matchChapterId(
  value: string | undefined,
  activeChapters: readonly ProductionBootstrapChapter[],
) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  if (activeChapters.some((chapter) => chapter.id === normalized)) {
    return normalized;
  }

  return null;
}

function formatChapterList(chapters: readonly ProductionBootstrapChapter[]) {
  const visible = chapters.slice(0, 5).map((chapter) => chapter.name);
  const extraCount = chapters.length - visible.length;
  const suffix = extraCount > 0 ? ` and ${extraCount} more` : "";

  return `${visible.join(", ")}${suffix}`;
}

function looksLikeSecret(value: string) {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.startsWith("bearer ") ||
    normalized.startsWith("sk_") ||
    normalized.startsWith("sk-") ||
    normalized.startsWith("pk_") ||
    normalized.startsWith("api_") ||
    normalized.startsWith("pat_") ||
    normalized.includes("api_key") ||
    normalized.includes("access_token") ||
    normalized.includes("secret") ||
    normalized.includes("-----begin") ||
    (normalized.startsWith("eyj") && normalized.includes(".")) ||
    normalized.length >= 96
  );
}

function maskExternalId(value: string) {
  const trimmed = value.trim();

  if (trimmed.length <= 8) {
    return trimmed || "[blank]";
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

function normalizeId(value: string) {
  return normalizeString(value)?.toLowerCase() ?? "";
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readRecordString(value: Record<string, unknown>, key: string) {
  const raw = value[key];
  return typeof raw === "string" ? raw : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}
