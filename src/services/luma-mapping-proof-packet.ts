import {
  createProductionLumaRuntimeRegistryExport,
  type ProductionLumaMappingReadinessOptions,
  type ProductionLumaRuntimeRegistryExport,
} from "@/services/production-luma-mapping-readiness";
import {
  getChapterLumaCalendarSummary,
  getChapterLumaRolloutReadiness,
  type ChapterLumaCalendarSummary,
  type ChapterLumaRolloutStage,
} from "@/services/chapter-luma-calendars";
import type {
  ProductionBootstrapLumaCalendar,
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";
import type {
  ChapterLumaCalendarRow,
  RolloutEnvironment,
} from "@/shared/types/persistence";

export type LumaMappingProofPacket = {
  canReadPacket: boolean;
  title: string;
  summary: string;
  localOnly: true;
  chapterCalendarSummary: ChapterLumaCalendarSummary;
  rolloutStages: ChapterLumaRolloutStage[];
  mappingReadiness: ProductionLumaRuntimeRegistryExport["readiness"];
  runtimeRegistryExport: ProductionLumaRuntimeRegistryExport;
  noGoRules: string[];
  proofNotes: string[];
  nextSmallestGoal: string;
};

export type LumaMappingProofPacketOptions = ProductionLumaMappingReadinessOptions;

const defaultOptions = {
  minimumChapterCount: 5,
  minimumPilotChapterCount: 5,
  allowSandboxTestData: true,
} as const;

export function getLumaMappingProofPacket(
  packet: ProductionRolloutBootstrapPacket,
  options: LumaMappingProofPacketOptions = {},
): LumaMappingProofPacket {
  const mappingOptions: ProductionLumaMappingReadinessOptions = {
    ...defaultOptions,
    ...options,
  };
  const summaryInput = {
    chapters: toSummaryChapters(packet.chapters),
    env: {},
    persistedRows: toPersistedChapterLumaCalendarRows(packet.lumaCalendars),
  };
  const chapterCalendarSummary = getChapterLumaCalendarSummary(summaryInput);
  const rolloutStages = getChapterLumaRolloutReadiness(summaryInput);
  const runtimeRegistryExport = createProductionLumaRuntimeRegistryExport(
    packet,
    mappingOptions,
  );

  return {
    canReadPacket: true,
    title: "Luma mapping proof packet",
    summary:
      "This packet proves chapter-to-Luma mapping readiness without live provider calls. It stays read-only, uses a generated runtime registry from the same packet, and keeps pilot readiness separate from rollout readiness.",
    localOnly: true,
    chapterCalendarSummary,
    rolloutStages,
    mappingReadiness: runtimeRegistryExport.readiness,
    runtimeRegistryExport,
    noGoRules: [
      "No live Luma provider calls.",
      "No production writes or reads.",
      "No shared UI edits.",
      "No API keys, tokens, or secret-like values in the proof packet.",
      "No pilot-ready mapping claim becomes rollout-ready until signed-in proof, pilot event proof, invite-gate proof, and live counts all exist.",
    ],
    proofNotes: [
      "The chapter calendar summary is built from the same local packet that generates the runtime registry JSON.",
      "The runtime registry export is synthetic and read-only; it is not a provider export.",
      "Pilot-ready mapping can be demonstrated here without widening into live provider integration.",
    ],
    nextSmallestGoal: runtimeRegistryExport.readiness.ready
      ? "Collect the five-chapter Luma event, RSVP, attendance, points, audit, and zero-send proof."
      : "Fix the chapter-to-Luma mapping blockers before widening into pilot evidence.",
  };
}

export function formatLumaMappingProofPacket(
  packet: LumaMappingProofPacket,
): string {
  return [
    packet.canReadPacket
      ? "Luma mapping proof packet: READY"
      : "Luma mapping proof packet: NOT READY",
    "",
    `Scope: ${packet.summary}`,
    "",
    "Counts:",
    `- visible chapters: ${packet.chapterCalendarSummary.totalCount}`,
    `- ready chapters: ${packet.chapterCalendarSummary.readyCount}`,
    `- explicit ready chapters: ${packet.chapterCalendarSummary.explicitReadyCount}`,
    `- shared default chapters: ${packet.chapterCalendarSummary.sharedDefaultCount}`,
    `- pilot-ready mapped chapters: ${packet.mappingReadiness.counts.pilotMappedChapters}`,
    `- packet mapped active chapters: ${packet.mappingReadiness.counts.packetMappedActiveChapters}`,
    `- runtime matched active chapters: ${packet.mappingReadiness.counts.runtimeMatchedActiveChapters}`,
    "",
    "Rollout stages:",
    ...packet.rolloutStages.map(
      (stage) =>
        `- ${stage.label}: ${stage.status} (${stage.mappedChapters}/${stage.targetChapters}) — ${stage.detail}`,
    ),
    "",
    "No-go rules:",
    ...packet.noGoRules.map((rule) => `- ${rule}`),
    "",
    "Proof notes:",
    ...packet.proofNotes.map((note) => `- ${note}`),
    "",
    `Next smallest goal: ${packet.nextSmallestGoal}`,
  ].join("\n");
}

type SummaryChapter = {
  chapterId: string;
  chapterName: string;
  campus: string;
  region: string;
};

function toSummaryChapters(
  chapters: ProductionRolloutBootstrapPacket["chapters"],
): SummaryChapter[] {
  return chapters.map((chapter) => ({
    chapterId: chapter.id,
    chapterName: chapter.name,
    campus: chapter.campus,
    region: chapter.region ?? "Unassigned region",
  }));
}

function toPersistedChapterLumaCalendarRows(
  calendars: readonly ProductionBootstrapLumaCalendar[] | undefined,
): ChapterLumaCalendarRow[] {
  return (calendars ?? []).map((calendar, index) => {
    const timestamp = `2026-07-08T0${String(index + 1)}:00:00.000Z`;

    return {
      id: `proof-luma-calendar-${String(index + 1).padStart(2, "0")}` as ChapterLumaCalendarRow["id"],
      chapter_id: calendar.chapterId as ChapterLumaCalendarRow["chapter_id"],
      environment: "local" as RolloutEnvironment,
      calendar_id: calendar.calendarId,
      calendar_label: calendar.calendarName ?? "Luma calendar",
      is_default: false,
      status: mapCalendarStatus(calendar.status),
      linked_by: null,
      linked_at: timestamp as ChapterLumaCalendarRow["linked_at"],
      notes: null,
      created_at: timestamp as ChapterLumaCalendarRow["created_at"],
      updated_at: timestamp as ChapterLumaCalendarRow["updated_at"],
    };
  });
}

function mapCalendarStatus(
  status: ProductionBootstrapLumaCalendar["status"] | undefined,
): ChapterLumaCalendarRow["status"] {
  if (status === "inactive") {
    return "disabled";
  }

  if (status === "needs_setup") {
    return "pending";
  }

  return "linked";
}
