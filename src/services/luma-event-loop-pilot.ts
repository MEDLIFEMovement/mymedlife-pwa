import type { LumaCalendarReadinessSnapshot } from "@/services/luma-calendar-readiness";
import type { StagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";

export type LumaEventLoopPilotRole = "member" | "leader" | "staff" | "admin";

export type LumaEventLoopPilotCard = {
  label: string;
  value: string;
  detail: string;
};

export type LumaEventLoopPilotEvent = {
  id: string;
  title: string;
  timing: string;
  href: string | null;
};

export type LumaEventLoopPilotReadback = {
  role: LumaEventLoopPilotRole;
  eyebrow: string;
  title: string;
  summary: string;
  statusLabel: string;
  statusDetail: string;
  importedEvents: LumaEventLoopPilotEvent[];
  cards: LumaEventLoopPilotCard[];
  safetyGates: string[];
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction: {
    label: string;
    href: string;
  };
  counts: {
    importedEvents: number;
    writesEnabled: 0;
    externalSends: 0;
    attendeeRowsReturned: number;
    secretsReturned: 0;
  };
};

export function getLumaEventLoopPilotReadback(
  role: LumaEventLoopPilotRole,
  snapshot: LumaCalendarReadinessSnapshot,
  options: {
    activation?: StagingLumaEventLoopReadModel | null;
  } = {},
): LumaEventLoopPilotReadback {
  const activation = options.activation ?? null;
  const importedEvents = snapshot.safeEvents.slice(0, 3).map((event) => ({
    id: event.apiId ?? event.id,
    title: event.title,
    timing: formatEventTiming(event.startAt, event.timezone),
    href: event.url,
  }));
  const ready = snapshot.status === "ready";
  const evidence = activation
    ? {
        rsvpCount: activation.summary.rsvpCount,
        attendanceCount: activation.summary.attendanceCount,
        pointsAwarded: activation.summary.pointsAwarded,
        externalWritesEnabled: activation.summary.externalWritesEnabled,
      }
    : null;
  const evidenceStatus = getEvidenceStatus(activation);

  return {
    role,
    eyebrow: getRoleEyebrow(role),
    title: getRoleTitle(role, ready),
    summary: getRoleSummary(role, ready, snapshot.eventCount, evidence),
    statusLabel: getStatusLabel(snapshot, evidenceStatus),
    statusDetail: getStatusDetail(snapshot, activation, evidenceStatus),
    importedEvents,
    cards: [
      {
        label: "Luma events",
        value: ready ? `${snapshot.eventCount}` : "0",
        detail: getLumaEventsCardDetail(snapshot, ready),
      },
      {
        label: "RSVP path",
        value: evidence ? `${evidence.rsvpCount}` : "Preview",
        detail: getRoleRsvpDetail(role, evidence),
      },
      {
        label: "Attendance",
        value: evidence ? `${evidence.attendanceCount}` : "Manual",
        detail: getAttendanceDetail(evidence),
      },
      {
        label: "Points",
        value: evidence ? `${evidence.pointsAwarded} pts` : "Gated",
        detail: getPointsDetail(evidence),
      },
    ],
    safetyGates: [
      "Luma event creation and updates are off.",
      "Luma RSVP and attendee writes are off.",
      "Attendance imports, reminders, webhooks, and n8n sends are off.",
      "HubSpot, warehouse, Power BI, SMS/email, and AI actions are off.",
      "No Luma secret is returned to browser-safe UI data.",
    ],
    primaryAction: getPrimaryAction(role),
    secondaryAction: getSecondaryAction(role),
    counts: {
      importedEvents: snapshot.eventCount,
      writesEnabled: 0,
      externalSends: snapshot.externalWritesEnabled,
      attendeeRowsReturned: evidence?.attendanceCount ?? 0,
      secretsReturned: 0,
    },
  };
}

function getRoleEyebrow(role: LumaEventLoopPilotRole): string {
  switch (role) {
    case "member":
      return "Luma live-pilot loop";
    case "leader":
      return "Chapter event operating loop";
    case "staff":
      return "Portfolio event health";
    case "admin":
      return "Integration safety readback";
  }
}

function getRoleTitle(role: LumaEventLoopPilotRole, ready: boolean): string {
  switch (role) {
    case "member":
      return ready
        ? "Live Luma events can drive your next RSVP."
        : "Your event loop is ready for Luma staging reads.";
    case "leader":
      return ready
        ? "Luma-backed events are ready for leader review."
        : "Leader review keeps event creation, RSVP, attendance, and points together.";
    case "staff":
      return ready
        ? "Staff can read Luma event health without turning on sends."
        : "Staff review keeps Luma in read-only pilot posture.";
    case "admin":
      return ready
        ? "Admin can verify Luma readback with zero external sends."
        : "Admin safety gates stay closed until staging readback is proven.";
  }
}

function getRoleSummary(
  role: LumaEventLoopPilotRole,
  ready: boolean,
  eventCount: number,
  evidence: {
    rsvpCount: number;
    attendanceCount: number;
    pointsAwarded: number;
    externalWritesEnabled: false;
  } | null,
): string {
  const countLabel = `${eventCount} Luma event${eventCount === 1 ? "" : "s"}`;

  if (!ready) {
    return "The app is prepared to show Luma events once staging environment variables are present. Until then, the existing mock event loop remains visible and every live write stays blocked.";
  }

  const evidenceSummary = evidence
    ? `${evidence.rsvpCount} RSVP, ${evidence.attendanceCount} attendance, and ${evidence.pointsAwarded} points`
    : null;

  switch (role) {
    case "member":
      return evidenceSummary
        ? `${countLabel} are available from the MEDLIFE calendar. Current staging evidence shows ${evidenceSummary}, so members can see how RSVP and attendance become real chapter momentum.`
        : `${countLabel} are available from the MEDLIFE calendar. Members should discover the event, RSVP intent in myMEDLIFE, show up, and see how attendance can become points after review.`;
    case "leader":
      return evidenceSummary
        ? `${countLabel} are available for leader readback. Leaders can compare live event posture against ${evidenceSummary} in the staging proof lane before opening any broader write lane.`
        : `${countLabel} are available for leader readback. Leaders can compare event posture, RSVP intent, attendance confirmation, and point validation before opening any live write lane.`;
    case "staff":
      return evidenceSummary
        ? `${countLabel} are available for portfolio review. Staff can inspect chapter event health with ${evidenceSummary} already visible in staging while external systems remain manual or read-only.`
        : `${countLabel} are available for portfolio review. Staff can inspect chapter event health and leaderboard impact while external systems remain manual or read-only.`;
    case "admin":
      return evidenceSummary
        ? `${countLabel} are available through the server-only read path. Admin review can now compare imported event visibility against ${evidenceSummary} and zero external sends in the staging proof lane.`
        : `${countLabel} are available through the server-only read path. Admin review should verify imported event visibility, audit/outbox posture, and zero external sends before any write is enabled.`;
  }
}

function getLumaEventsCardDetail(
  snapshot: LumaCalendarReadinessSnapshot,
  ready: boolean,
): string {
  if (ready) {
    return "Server-side calendar events available for staging review";
  }

  if (snapshot.status === "api_error") {
    return "Luma config exists, but the hosted credential or calendar read needs review before imported events render.";
  }

  return "Waiting for staging env configuration before imported events render";
}

function getRoleRsvpDetail(
  role: LumaEventLoopPilotRole,
  evidence: {
    rsvpCount: number;
    attendanceCount: number;
    pointsAwarded: number;
    externalWritesEnabled: false;
  } | null,
): string {
  if (evidence) {
    switch (role) {
      case "member":
        return `${evidence.rsvpCount} staging RSVP row(s) are visible without turning on member-side Luma writes.`;
      case "leader":
        return `${evidence.rsvpCount} RSVP row(s) are visible for leader review before attendance validation.`;
      case "staff":
        return `${evidence.rsvpCount} RSVP row(s) are visible for portfolio health review.`;
      case "admin":
        return `${evidence.rsvpCount} RSVP row(s) are visible while external sends stay at zero.`;
    }
  }

  switch (role) {
    case "member":
      return "Members see the event and move into RSVP intent without writing back to Luma.";
    case "leader":
      return "Leaders inspect RSVP posture and attendance gaps before validating points.";
    case "staff":
      return "Staff compare RSVP conversion, attendance, and leaderboard movement across chapters.";
    case "admin":
      return "Admins verify RSVP remains app-owned and external sends stay at zero.";
  }
}

function getAttendanceDetail(
  evidence: {
    rsvpCount: number;
    attendanceCount: number;
    pointsAwarded: number;
    externalWritesEnabled: false;
  } | null,
): string {
  if (evidence) {
    return evidence.attendanceCount > 0
      ? "Attendance-backed staging evidence is visible in the current proof lane."
      : "Attendance confirmation still needs a completed staging proof pass.";
  }

  return "Attendance confirmation stays in myMEDLIFE review posture before any Luma attendee import opens.";
}

function getPointsDetail(
  evidence: {
    rsvpCount: number;
    attendanceCount: number;
    pointsAwarded: number;
    externalWritesEnabled: false;
  } | null,
): string {
  if (evidence) {
    return evidence.pointsAwarded > 0
      ? "Points and leaderboard readback are already visible in staging review."
      : "Points and leaderboard readback stay pending until attendance-backed proof is recorded.";
  }

  return "Points and leaderboards update only after the approved review path records the right audit evidence.";
}

function getStatusLabel(
  snapshot: LumaCalendarReadinessSnapshot,
  evidenceStatus: "none" | "linked" | "in_progress" | "recorded",
): string {
  if (snapshot.status !== "ready") {
    return snapshot.status === "api_error"
      ? "Luma read needs review"
      : "Luma read not configured";
  }

  switch (evidenceStatus) {
    case "recorded":
      return "Staging proof recorded";
    case "in_progress":
      return "Staging proof in progress";
    case "linked":
      return "Staging loop linked";
    case "none":
      return "Luma read connected";
  }
}

function getStatusDetail(
  snapshot: LumaCalendarReadinessSnapshot,
  activation: StagingLumaEventLoopReadModel | null,
  evidenceStatus: "none" | "linked" | "in_progress" | "recorded",
): string {
  if (!activation || evidenceStatus === "none") {
    return snapshot.detail;
  }

  const proofEvidence = activation.proofEvidence;
  const evidenceFootprint = proofEvidence
    ? `${proofEvidence.disabledOutboxRows} disabled outbox row(s), ${proofEvidence.auditRows} audit row(s), and ${proofEvidence.sentOutboxRows} sent row(s)`
    : activation.summary.externalWritesEnabled
      ? "review-required external writes"
      : "zero external sends";
  const base = `${activation.providerStatusLabel}. Current staging evidence shows ${activation.summary.rsvpCount} RSVP, ${activation.summary.attendanceCount} attendance, ${activation.summary.pointsAwarded} points, and ${evidenceFootprint}.`;

  if (snapshot.status === "ready") {
    return `${base} ${snapshot.detail}`;
  }

  return base;
}

function getEvidenceStatus(
  activation: StagingLumaEventLoopReadModel | null,
): "none" | "linked" | "in_progress" | "recorded" {
  if (!activation) {
    return "none";
  }

  if (
    activation.providerStatusLabel === "Staging evidence rows recorded" &&
    activation.summary.attendanceCount > 0 &&
    activation.summary.pointsAwarded > 0
  ) {
    return "recorded";
  }

  if (
    activation.summary.rsvpCount > 0 ||
    activation.summary.attendanceCount > 0 ||
    activation.summary.pointsAwarded > 0
  ) {
    return "in_progress";
  }

  if (activation.summary.lumaLinkReady || activation.summary.eventStored) {
    return "linked";
  }

  return "none";
}

function getPrimaryAction(role: LumaEventLoopPilotRole) {
  switch (role) {
    case "member":
      return { label: "Open events", href: "/rush-month/events?source=luma-loop" };
    case "leader":
      return { label: "Review events", href: "/leader?view=events&source=luma-loop" };
    case "staff":
      return { label: "Open staff events", href: "/staff?view=chapters&source=luma-loop" };
    case "admin":
      return { label: "Open outbox", href: "/admin/integration-outbox?source=luma-loop" };
  }
}

function getSecondaryAction(role: LumaEventLoopPilotRole) {
  switch (role) {
    case "member":
      return { label: "View leaderboard", href: "/rush-month/leaderboard?source=luma-loop" };
    case "leader":
      return { label: "Validate points", href: "/leader?view=leaderboard&source=luma-loop" };
    case "staff":
      return { label: "View analytics", href: "/staff?view=feed_analytics&source=luma-loop" };
    case "admin":
      return { label: "Review audit log", href: "/admin/audit-log?source=luma-loop" };
  }
}

function formatEventTiming(startAt: string | null, timezone: string | null): string {
  if (!startAt) {
    return "Time from Luma pending";
  }

  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return "Time from Luma pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone ?? "UTC",
  }).format(date);
}
