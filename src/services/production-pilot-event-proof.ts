import { isKnownAppRouteHref } from "./app-route-registry.ts";
import type {
  ProductionBootstrapPilotEventProof,
  ProductionRolloutBootstrapPacket,
} from "./production-rollout-bootstrap.ts";

export type ProductionPilotEventProofReadiness = {
  ready: boolean;
  minimumPilotChapterCount: number;
  counts: {
    activeChapters: number;
    linkedLumaCalendars: number;
    pilotEventProofRows: number;
    readyProofRows: number;
    provenPilotChapters: number;
    rsvpReadyRows: number;
    attendanceReadyRows: number;
    pointsReadyRows: number;
    reconciledReadyRows: number;
    auditReadyRows: number;
    zeroSendReadyRows: number;
    appRouteReadyRows: number;
  };
  blockers: string[];
  warnings: string[];
  nextSteps: string[];
};

export type ProductionPilotEventProofOptions = {
  minimumPilotChapterCount?: number;
};

type PilotProofRouteKey =
  | "eventRoute"
  | "attendanceRoute"
  | "pointsRoute"
  | "auditRoute"
  | "outboxRoute";

const routeLabels: Record<PilotProofRouteKey, string> = {
  eventRoute: "event route",
  attendanceRoute: "attendance route",
  pointsRoute: "points route",
  auditRoute: "audit route",
  outboxRoute: "outbox route",
};

export function getProductionPilotEventProofReadiness(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionPilotEventProofOptions = {},
): ProductionPilotEventProofReadiness {
  const minimumPilotChapterCount = options.minimumPilotChapterCount ?? 5;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const activeChapters = packet.chapters.filter(
    (chapter) => (chapter.status ?? "active") === "active",
  );
  const activeChapterIds = new Set(activeChapters.map((chapter) => chapter.id));
  const chapterNames = new Map(
    packet.chapters.map((chapter) => [chapter.id, chapter.name]),
  );
  const linkedLumaChapterIds = new Set(
    (packet.lumaCalendars ?? [])
      .filter((calendar) => (calendar.status ?? "linked") === "linked")
      .map((calendar) => calendar.chapterId),
  );
  const userEmails = new Set(
    packet.users.map((user) => user.email.trim().toLowerCase()),
  );
  const pilotProofRows = packet.pilotEventProof ?? [];
  const readyProofRows = pilotProofRows.filter(
    (proof) => (proof.status ?? "ready") === "ready",
  );
  const provenPilotChapterIds = new Set<string>();
  const duplicateProofKeys = getDuplicates(
    pilotProofRows.map((proof) =>
      [proof.chapterId, proof.lumaEventId].map((part) => part.trim().toLowerCase()).join(" / "),
    ),
  );

  for (const duplicate of duplicateProofKeys) {
    blockers.push(`Duplicate pilot event proof row: ${duplicate}.`);
  }

  if (activeChapters.length < minimumPilotChapterCount) {
    blockers.push(
      `Add at least ${minimumPilotChapterCount} active pilot chapters before five-chapter event-loop proof. Current active chapters: ${activeChapters.length}.`,
    );
  }

  if (linkedLumaChapterIds.size < minimumPilotChapterCount) {
    blockers.push(
      `Add linked Luma calendar mappings for at least ${minimumPilotChapterCount} pilot chapters. Current linked Luma calendars: ${linkedLumaChapterIds.size}.`,
    );
  }

  if (readyProofRows.length === 0) {
    blockers.push("Add ready rows to pilot-event-proof.csv before running the five-chapter proof gate.");
  }

  for (const proof of readyProofRows) {
    const proofBlockers = getReadyPilotProofBlockers({
      proof,
      activeChapterIds,
      linkedLumaChapterIds,
      userEmails,
    });

    blockers.push(...proofBlockers);

    if (proofBlockers.length === 0) {
      provenPilotChapterIds.add(proof.chapterId);
    }
  }

  if (provenPilotChapterIds.size < minimumPilotChapterCount) {
    blockers.push(
      `Complete ready event-loop proof for at least ${minimumPilotChapterCount} pilot chapters. Current proven pilot chapters: ${provenPilotChapterIds.size}.`,
    );
  }

  for (const proof of pilotProofRows) {
    if ((proof.status ?? "ready") !== "ready") {
      warnings.push(
        `${formatProofLabel(proof)} is marked ${proof.status}; it will not count toward the five-chapter pilot proof.`,
      );
    }

    if (proof.chapterId && !chapterNames.has(proof.chapterId)) {
      warnings.push(
        `${formatProofLabel(proof)} references a chapter handle that is not in chapters.csv.`,
      );
    }
  }

  return {
    ready: blockers.length === 0,
    minimumPilotChapterCount,
    counts: {
      activeChapters: activeChapters.length,
      linkedLumaCalendars: linkedLumaChapterIds.size,
      pilotEventProofRows: pilotProofRows.length,
      readyProofRows: readyProofRows.length,
      provenPilotChapters: provenPilotChapterIds.size,
      rsvpReadyRows: readyProofRows.filter((proof) => proof.rsvpCount >= 1).length,
      attendanceReadyRows: readyProofRows.filter((proof) => proof.attendanceCount >= 1).length,
      pointsReadyRows: readyProofRows.filter((proof) => proof.pointsAwardedCount >= 1).length,
      reconciledReadyRows: readyProofRows.filter(hasReconciledAttendanceAndPoints).length,
      auditReadyRows: readyProofRows.filter((proof) => proof.auditEvidence === "recorded").length,
      zeroSendReadyRows: readyProofRows.filter((proof) => proof.outboxStatus === "zero_sends").length,
      appRouteReadyRows: readyProofRows.filter(hasAllKnownAppRoutes).length,
    },
    blockers,
    warnings,
    nextSteps:
      blockers.length === 0
        ? [
            "Save this report with the MED-504 evidence packet.",
            "Run production live-data count proof and signed-in route proof before the 30-chapter invite gate.",
            "Keep HubSpot, n8n, warehouse, Power BI, SMS, email, and AI sends off for this proof.",
          ]
        : [
            "Fix the pilot-event-proof.csv blockers.",
            "Rebuild the production rollout packet.",
            "Rerun this pilot proof gate before inviting more than the pilot chapters.",
          ],
  };
}

export function formatProductionPilotEventProofReadiness(
  readiness: ProductionPilotEventProofReadiness,
): string {
  return [
    readiness.ready
      ? "5-chapter pilot event loop proof: READY"
      : "5-chapter pilot event loop proof: NOT READY",
    "",
    `Minimum pilot chapters: ${readiness.minimumPilotChapterCount}`,
    "",
    "Counts:",
    `- active chapters: ${readiness.counts.activeChapters}`,
    `- linked Luma calendars: ${readiness.counts.linkedLumaCalendars}`,
    `- pilot event proof rows: ${readiness.counts.pilotEventProofRows}`,
    `- ready proof rows: ${readiness.counts.readyProofRows}`,
    `- proven pilot chapters: ${readiness.counts.provenPilotChapters}`,
    `- rows with RSVP proof: ${readiness.counts.rsvpReadyRows}`,
    `- rows with attendance proof: ${readiness.counts.attendanceReadyRows}`,
    `- rows with points proof: ${readiness.counts.pointsReadyRows}`,
    `- rows with reconciled attendance and points: ${readiness.counts.reconciledReadyRows}`,
    `- rows with audit proof: ${readiness.counts.auditReadyRows}`,
    `- rows with zero-send proof: ${readiness.counts.zeroSendReadyRows}`,
    `- rows with known app route proof: ${readiness.counts.appRouteReadyRows}`,
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

function getReadyPilotProofBlockers({
  proof,
  activeChapterIds,
  linkedLumaChapterIds,
  userEmails,
}: {
  proof: ProductionBootstrapPilotEventProof;
  activeChapterIds: Set<string>;
  linkedLumaChapterIds: Set<string>;
  userEmails: Set<string>;
}) {
  const blockers: string[] = [];
  const proofLabel = formatProofLabel(proof);

  if (!activeChapterIds.has(proof.chapterId)) {
    blockers.push(`${proofLabel} needs an active chapter in chapters.csv.`);
  }

  if (!linkedLumaChapterIds.has(proof.chapterId)) {
    blockers.push(`${proofLabel} needs a linked Luma calendar mapping.`);
  }

  if (!proof.eventName.trim()) {
    blockers.push(`${proofLabel} is missing an event name.`);
  }

  if (!proof.lumaEventId.trim()) {
    blockers.push(`${proofLabel} is missing a Luma event id.`);
  }

  if (proof.rsvpCount < 1) {
    blockers.push(`${proofLabel} needs at least one RSVP.`);
  }

  if (proof.attendanceCount < 1) {
    blockers.push(`${proofLabel} needs at least one attendance check-in.`);
  }

  if (proof.pointsAwardedCount < 1) {
    blockers.push(`${proofLabel} needs at least one points award.`);
  }

  if (proof.attendanceCount > proof.rsvpCount) {
    blockers.push(
      `${proofLabel} attendanceCount cannot exceed rsvpCount until walk-in reconciliation is represented in the packet.`,
    );
  }

  if (proof.pointsAwardedCount !== proof.attendanceCount) {
    blockers.push(
      `${proofLabel} pointsAwardedCount must match attendanceCount so every checked-in attendee is reflected in the leaderboard.`,
    );
  }

  if (proof.auditEvidence !== "recorded") {
    blockers.push(`${proofLabel} needs recorded audit evidence.`);
  }

  if (proof.outboxStatus !== "zero_sends") {
    blockers.push(`${proofLabel} needs zero external sends in the outbox.`);
  }

  for (const routeKey of Object.keys(routeLabels) as PilotProofRouteKey[]) {
    addRouteBlockers(blockers, proofLabel, proof[routeKey], routeLabels[routeKey]);
  }

  if (!proof.checkedAt?.trim()) {
    blockers.push(`${proofLabel} needs a checkedAt timestamp.`);
  }

  if (!proof.reviewedByEmail?.trim()) {
    blockers.push(`${proofLabel} needs a reviewedByEmail owner.`);
  } else if (!userEmails.has(proof.reviewedByEmail.trim().toLowerCase())) {
    blockers.push(
      `${proofLabel} reviewedByEmail references unknown user ${proof.reviewedByEmail}.`,
    );
  }

  return blockers;
}

function addRouteBlockers(
  blockers: string[],
  proofLabel: string,
  route: string | undefined,
  label: string,
) {
  if (!route?.trim()) {
    blockers.push(`${proofLabel} needs ${label} proof link.`);
    return;
  }

  if (!route.startsWith("/")) {
    blockers.push(`${proofLabel} ${label} proof link must be an app route.`);
    return;
  }

  if (!isKnownAppRouteHref(route)) {
    blockers.push(`${proofLabel} ${label} proof link is not a known launch route: ${route}.`);
  }
}

function hasAllKnownAppRoutes(proof: ProductionBootstrapPilotEventProof) {
  return (Object.keys(routeLabels) as PilotProofRouteKey[]).every((routeKey) => {
    const route = proof[routeKey];

    return Boolean(route?.startsWith("/") && isKnownAppRouteHref(route));
  });
}

function hasReconciledAttendanceAndPoints(
  proof: ProductionBootstrapPilotEventProof,
) {
  return (
    proof.attendanceCount <= proof.rsvpCount &&
    proof.pointsAwardedCount === proof.attendanceCount
  );
}

function formatProofLabel(proof: ProductionBootstrapPilotEventProof) {
  const chapterId = proof.chapterId || "unknown chapter";
  const lumaEventId = proof.lumaEventId || "unknown event";

  return `${chapterId} pilot event ${lumaEventId}`;
}

function getDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function formatList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}
