import type { LumaCalendarReadinessSnapshot } from "@/services/luma-calendar-readiness";

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
    attendeeRowsReturned: 0;
    secretsReturned: 0;
  };
};

export function getLumaEventLoopPilotReadback(
  role: LumaEventLoopPilotRole,
  snapshot: LumaCalendarReadinessSnapshot,
): LumaEventLoopPilotReadback {
  const importedEvents = snapshot.safeEvents.slice(0, 3).map((event) => ({
    id: event.apiId ?? event.id,
    title: event.title,
    timing: formatEventTiming(event.startAt, event.timezone),
    href: event.url,
  }));
  const ready = snapshot.status === "ready";

  return {
    role,
    eyebrow: getRoleEyebrow(role),
    title: getRoleTitle(role, ready),
    summary: getRoleSummary(role, ready, snapshot.eventCount),
    statusLabel: ready
      ? "Luma read connected"
      : snapshot.status === "api_error"
        ? "Luma read needs review"
        : "Luma read not configured",
    statusDetail: snapshot.detail,
    importedEvents,
    cards: [
      {
        label: "Luma events",
        value: ready ? `${snapshot.eventCount}` : "0",
        detail: ready
          ? "Server-side calendar events available for staging review"
          : "Waiting for staging env configuration before imported events render",
      },
      {
        label: "RSVP path",
        value: "Preview",
        detail: getRoleRsvpDetail(role),
      },
      {
        label: "Attendance",
        value: "Manual",
        detail:
          "Attendance confirmation stays in myMEDLIFE review posture before any Luma attendee import opens.",
      },
      {
        label: "Points",
        value: "Gated",
        detail:
          "Points and leaderboards update only after the approved review path records the right audit evidence.",
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
      attendeeRowsReturned: 0,
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
): string {
  const countLabel = `${eventCount} Luma event${eventCount === 1 ? "" : "s"}`;

  if (!ready) {
    return "The app is prepared to show Luma events once staging environment variables are present. Until then, the existing mock event loop remains visible and every live write stays blocked.";
  }

  switch (role) {
    case "member":
      return `${countLabel} are available from the MEDLIFE calendar. Members should discover the event, RSVP intent in myMEDLIFE, show up, and see how attendance can become points after review.`;
    case "leader":
      return `${countLabel} are available for leader readback. Leaders can compare event posture, RSVP intent, attendance confirmation, and point validation before opening any live write lane.`;
    case "staff":
      return `${countLabel} are available for portfolio review. Staff can inspect chapter event health and leaderboard impact while external systems remain manual or read-only.`;
    case "admin":
      return `${countLabel} are available through the server-only read path. Admin review should verify imported event visibility, audit/outbox posture, and zero external sends before any write is enabled.`;
  }
}

function getRoleRsvpDetail(role: LumaEventLoopPilotRole): string {
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
