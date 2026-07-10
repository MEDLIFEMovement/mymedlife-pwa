import {
  getChapterLumaCalendarSummary,
  type ChapterLumaCalendarSummary,
} from "@/services/chapter-luma-calendars";
import {
  formatProductionPilotEventProofReadiness,
  getProductionPilotEventProofReadiness,
  type ProductionPilotEventProofReadiness,
  type ProductionPilotEventProofOptions,
} from "@/services/production-pilot-event-proof";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

export type PilotEventLoopProofPacket = {
  canReadPacket: boolean;
  title: string;
  summary: string;
  localOnly: true;
  chapterCalendarSummary: ChapterLumaCalendarSummary;
  pilotEventProofReadiness: ProductionPilotEventProofReadiness;
  noGoRules: string[];
  proofNotes: string[];
  nextSmallestGoal: string;
};

export type PilotEventLoopProofPacketOptions = ProductionPilotEventProofOptions;

export function getPilotEventLoopProofPacket(
  packet: ProductionRolloutBootstrapPacket,
  options: PilotEventLoopProofPacketOptions = {},
): PilotEventLoopProofPacket {
  const chapterCalendarSummary = getChapterLumaCalendarSummary({
    env: {
      MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON: JSON.stringify(
        packet.lumaCalendars?.map((calendar) => ({
          chapterId: calendar.chapterId,
          chapterName:
            packet.chapters.find((chapter) => chapter.id === calendar.chapterId)?.name ??
            null,
          calendarId: calendar.calendarId,
          calendarLabel: calendar.calendarName ?? null,
          note: null,
          status: calendar.status === "needs_setup" ? "shared_default" : "ready",
        })) ?? [],
      ),
    },
  });
  const pilotEventProofReadiness = getProductionPilotEventProofReadiness(packet, {
    minimumPilotChapterCount: options.minimumPilotChapterCount ?? 5,
  });

  return {
    canReadPacket: true,
    title: "Five-chapter pilot event-loop proof packet",
    summary:
      "This packet keeps the five-chapter pilot event loop read-only and honest. It ties RSVP, attendance, points, audit, and zero-send proof to the same review surface without calling providers or implying rollout readiness.",
    localOnly: true,
    chapterCalendarSummary,
    pilotEventProofReadiness,
    noGoRules: [
      "No live provider calls.",
      "No production writes or reads.",
      "No shared UI edits.",
      "No rollout-ready claim until five chapters each show RSVP, attendance, points, audit, and zero-send proof with known app routes and reviewers.",
    ],
    proofNotes: [
      "The mapping layer already landed, so this packet only needs the pilot proof rows to stay in lockstep with chapter calendars.",
      "The packet is read-only and can be validated without enabling provider writes.",
      "It is a support package for the pilot gate, not the rollout gate.",
    ],
    nextSmallestGoal: pilotEventProofReadiness.ready
      ? "Collect the signed-in route proof and final invite-gate evidence before widening the launch."
      : "Complete the five-chapter RSVP, attendance, points, audit, and zero-send rows before any live pilot claim.",
  };
}

export function formatPilotEventLoopProofPacket(
  packet: PilotEventLoopProofPacket,
): string {
  return [
    packet.canReadPacket
      ? "Five-chapter pilot event-loop proof packet: READY"
      : "Five-chapter pilot event-loop proof packet: NOT READY",
    "",
    `Scope: ${packet.summary}`,
    "",
    "Counts:",
    `- visible chapters: ${packet.chapterCalendarSummary.totalCount}`,
    `- ready chapter mappings: ${packet.chapterCalendarSummary.readyCount}`,
    `- pilot proof rows: ${packet.pilotEventProofReadiness.counts.pilotEventProofRows}`,
    `- proven pilot chapters: ${packet.pilotEventProofReadiness.counts.provenPilotChapters}`,
    `- RSVP-ready rows: ${packet.pilotEventProofReadiness.counts.rsvpReadyRows}`,
    `- attendance-ready rows: ${packet.pilotEventProofReadiness.counts.attendanceReadyRows}`,
    `- points-ready rows: ${packet.pilotEventProofReadiness.counts.pointsReadyRows}`,
    `- audit-ready rows: ${packet.pilotEventProofReadiness.counts.auditReadyRows}`,
    `- zero-send-ready rows: ${packet.pilotEventProofReadiness.counts.zeroSendReadyRows}`,
    "",
    "Pilot proof readiness:",
    ...packet.pilotEventProofReadiness.blockers.map((item) => `- ${item}`),
    "",
    "No-go rules:",
    ...packet.noGoRules.map((item) => `- ${item}`),
    "",
    "Proof notes:",
    ...packet.proofNotes.map((item) => `- ${item}`),
    "",
    `Next smallest goal: ${packet.nextSmallestGoal}`,
    "",
    formatProductionPilotEventProofReadiness(packet.pilotEventProofReadiness),
  ].join("\n");
}
