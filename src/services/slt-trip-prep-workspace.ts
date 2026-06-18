import {
  mockSltTripCurrentDateIso,
  mockSltTripTravelers,
} from "@/data/mock-slt-trip-prep";
import type { LocalActorContext } from "@/services/local-actor-context";
import type {
  TripPrepAlertTone,
  TripPrepChecklistItem,
  TripPrepChecklistStatus,
  TripPrepRiskLevel,
  TripPrepTraveler,
} from "@/shared/types/slt-trip-prep";

export type SltTripPrepChecklistFilter = "all" | "needs_attention" | "complete";

export type SltTripPrepSectionLink = {
  href: string;
  label: string;
  helper: string;
  tone: TripPrepAlertTone;
};

export const sltTripPrepSubnavItems: ReadonlyArray<{
  href: string;
  label: string;
}> = [
  { href: "/slt-prep", label: "Overview" },
  { href: "/slt-prep/checklist", label: "Checklist" },
  { href: "/slt-prep/forms", label: "Forms" },
  { href: "/slt-prep/payments", label: "Payments" },
  { href: "/slt-prep/meetings", label: "Meetings" },
  { href: "/slt-prep/extensions", label: "Extensions" },
  { href: "/slt-prep/timeline", label: "Timeline" },
  { href: "/slt-prep/notifications", label: "Alerts" },
  { href: "/slt-prep/profile", label: "Profile" },
  { href: "/slt-prep/staff", label: "Staff" },
];

export type SltTripPrepWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  traveler: TripPrepTraveler | null;
  countdownLabel: string;
  readiness: {
    score: number;
    tone: TripPrepAlertTone;
    label: string;
  };
  nextStep: {
    href: string;
    label: string;
    summary: string;
  };
  sectionLinks: SltTripPrepSectionLink[];
  safetyNotes: string[];
  counts: {
    alerts: number;
    checklistComplete: number;
    checklistTotal: number;
    meetingsRemaining: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export type SltTripPrepChecklistWorkspace = {
  canReadChecklist: boolean;
  title: string;
  summary: string;
  filter: SltTripPrepChecklistFilter;
  traveler: TripPrepTraveler | null;
  items: TripPrepChecklistItem[];
  counts: {
    total: number;
    complete: number;
    needsAttention: number;
    upcoming: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export type SltTripPrepChecklistDetailWorkspace = {
  canReadDetail: boolean;
  title: string;
  summary: string;
  traveler: TripPrepTraveler | null;
  item: TripPrepChecklistItem | null;
  readinessScore: number;
  readinessTone: TripPrepAlertTone;
  relatedLinks: SltTripPrepSectionLink[];
  safetyNotes: string[];
  counts: {
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
} | null;

const travelerPreviewByEmail: Record<string, string> = {
  "member.a@mymedlife.test": "sofia-alvarez",
  "committee.member@mymedlife.test": "sofia-alvarez",
  "committee.chair@mymedlife.test": "sofia-alvarez",
  "leader.a@mymedlife.test": "sofia-alvarez",
  "eboard.a@mymedlife.test": "sofia-alvarez",
  "coach@mymedlife.test": "daniel-kim",
  "admin@mymedlife.test": "daniel-kim",
  "super.admin@mymedlife.test": "daniel-kim",
};

export function getSltTripPrepWorkspace(
  actor: LocalActorContext,
  travelerId?: string,
): SltTripPrepWorkspace {
  if (actor.audience === "ds_admin") {
    return {
      canReadWorkspace: false,
      title: "Trip prep is hidden for DS Admin",
      summary:
        "Trip readiness belongs to the chapter, traveler, coach, and staff workflow. DS Admin should stay in integration and audit safety routes.",
      traveler: null,
      countdownLabel: "No traveler selected",
      readiness: {
        score: 0,
        tone: "yellow",
        label: "Trip prep is restricted for this role",
      },
      nextStep: {
        href: "/admin/integration-outbox",
        label: "Open integration outbox",
        summary: "Use admin safety routes instead of traveler readiness details.",
      },
      sectionLinks: [],
      safetyNotes: [
        "No traveler packet rows are shown to DS Admin.",
        "No HubSpot, Shopify, Luma, warehouse, or n8n actions are enabled from this route.",
      ],
      counts: {
        alerts: 0,
        checklistComplete: 0,
        checklistTotal: 0,
        meetingsRemaining: 0,
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
    };
  }

  const traveler = getTripPrepTraveler(actor, travelerId);
  const readinessScore = calculateReadinessScore(traveler.checklist);
  const readinessTone = getReadinessTone(readinessScore, traveler.riskLevel);
  const countdownLabel = buildCountdownLabel(traveler.departureDateIso);
  const checklistComplete = traveler.checklist.filter((item) => item.status === "complete").length;
  const meetingsRemaining = traveler.meetings.filter(
    (meeting) => meeting.status === "upcoming",
  ).length;
  const nextAlert = traveler.alerts[0];

  return {
    canReadWorkspace: true,
    title: getWorkspaceTitle(actor),
    summary:
      "Use this mobile-first trip prep lane to keep one traveler moving from open blocker to clear departure readiness without turning on live Shopify, HubSpot, or Luma writes.",
    traveler,
    countdownLabel,
    readiness: {
      score: readinessScore,
      tone: readinessTone,
      label: getReadinessLabel(readinessScore, traveler.riskLevel),
    },
    nextStep: {
      href: nextAlert?.href ?? "/slt-prep/checklist",
      label: nextAlert ? nextAlert.label : "Review readiness checklist",
      summary: nextAlert
        ? nextAlert.summary
        : "Open the traveler checklist and close the highest-risk missing item first.",
    },
    sectionLinks: [
      {
        href: "/slt-prep/checklist",
        label: "Readiness checklist",
        helper: `${traveler.checklist.length} traveler checkpoints`,
        tone: readinessTone,
      },
      {
        href: "/slt-prep/forms",
        label: "Required forms",
        helper: `${traveler.forms.length} form states`,
        tone: traveler.forms.some((item) => item.status === "needs_signature")
          ? "yellow"
          : "green",
      },
      {
        href: "/slt-prep/payments",
        label: "Payment status",
        helper: `${traveler.payments.length} payment milestones`,
        tone: traveler.payments.some((item) => item.status === "due") ? "red" : "green",
      },
      {
        href: "/slt-prep/meetings",
        label: "Pre-trip meetings",
        helper: `${traveler.meetings.length} meeting touchpoints`,
        tone: meetingsRemaining > 0 ? "yellow" : "green",
      },
      {
        href: "/slt-prep/extensions",
        label: "Extensions and tours",
        helper: `${traveler.extensions.length} optional choices`,
        tone: traveler.extensions.some((item) => item.status === "considering")
          ? "yellow"
          : "green",
      },
      {
        href: "/slt-prep/timeline",
        label: "Trip timeline",
        helper: `${traveler.timeline.length} milestones to departure`,
        tone: "green",
      },
      {
        href: "/slt-prep/notifications",
        label: "Notifications",
        helper: `${traveler.notifications.length} recent updates`,
        tone: traveler.notifications.some((item) => item.tone === "urgent") ? "red" : "green",
      },
      {
        href: "/slt-prep/profile",
        label: "Traveler profile",
        helper: "Passport, contact, and flight context",
        tone: "green",
      },
    ],
    safetyNotes: [
      traveler.mockSources.shopify,
      traveler.mockSources.hubspot,
      traveler.mockSources.luma,
      "Checklist completion, payment collection, flight edits, meeting RSVPs, and notifications are still mock-safe previews only.",
    ],
    counts: {
      alerts: traveler.alerts.length,
      checklistComplete,
      checklistTotal: traveler.checklist.length,
      meetingsRemaining,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

export function getSltTripPrepChecklistWorkspace(
  actor: LocalActorContext,
  filter: SltTripPrepChecklistFilter = "all",
  travelerId?: string,
): SltTripPrepChecklistWorkspace {
  const workspace = getSltTripPrepWorkspace(actor, travelerId);

  if (!workspace.canReadWorkspace || !workspace.traveler) {
    return {
      canReadChecklist: false,
      title: workspace.title,
      summary: workspace.summary,
      filter,
      traveler: null,
      items: [],
      counts: {
        total: 0,
        complete: 0,
        needsAttention: 0,
        upcoming: 0,
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
    };
  }

  const traveler = workspace.traveler;
  const items = traveler.checklist.filter((item) => matchesChecklistFilter(item.status, filter));

  return {
    canReadChecklist: true,
    title: `${traveler.firstName}'s traveler checklist`,
    summary:
      "Each item is shaped like a future traveler-readiness record: owner, reason, evidence, due date, and the safe next action.",
    filter,
    traveler,
    items,
    counts: {
      total: traveler.checklist.length,
      complete: traveler.checklist.filter((item) => item.status === "complete").length,
      needsAttention: traveler.checklist.filter(
        (item) => item.status === "needs_attention" || item.status === "in_review",
      ).length,
      upcoming: traveler.checklist.filter((item) => item.status === "upcoming").length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

export function getSltTripPrepChecklistDetailWorkspace(
  actor: LocalActorContext,
  itemId: string,
  travelerId?: string,
): SltTripPrepChecklistDetailWorkspace {
  const workspace = getSltTripPrepWorkspace(actor, travelerId);

  if (!workspace.canReadWorkspace || !workspace.traveler) {
    return {
      canReadDetail: false,
      title: workspace.title,
      summary: workspace.summary,
      traveler: null,
      item: null,
      readinessScore: 0,
      readinessTone: "yellow",
      relatedLinks: [],
      safetyNotes: workspace.safetyNotes,
      counts: {
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
    };
  }

  const item = workspace.traveler.checklist.find((candidate) => candidate.id === itemId);

  if (!item) {
    return null;
  }

  return {
    canReadDetail: true,
    title: item.title,
    summary: item.summary,
    traveler: workspace.traveler,
    item,
    readinessScore: workspace.readiness.score,
    readinessTone: workspace.readiness.tone,
    relatedLinks: workspace.sectionLinks.filter((link) => {
      return link.href === "/slt-prep/checklist" ||
        link.href === "/slt-prep/forms" ||
        link.href === "/slt-prep/payments" ||
        link.href === "/slt-prep/meetings" ||
        link.href === "/slt-prep/profile";
    }),
    safetyNotes: [
      "Completion and correction flows stay preview-only until a real traveler write path is approved.",
      "This item can explain the future evidence packet, but it cannot save a status change or send a reminder yet.",
      workspace.traveler.mockSources.hubspot,
    ],
    counts: {
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

export function calculateReadinessScore(items: TripPrepChecklistItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  const score = items.reduce((total, item) => total + getChecklistWeight(item.status), 0);

  return Math.round((score / items.length) * 100);
}

function getTripPrepTraveler(actor: LocalActorContext, travelerId?: string): TripPrepTraveler {
  const resolvedId =
    travelerId ??
    travelerPreviewByEmail[actor.selectedEmail.toLowerCase()] ??
    mockSltTripTravelers[0]?.id;

  return (
    mockSltTripTravelers.find((traveler) => traveler.id === resolvedId) ??
    mockSltTripTravelers[0]
  );
}

function getWorkspaceTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Trip prep";
    case "chapter_leader":
      return "Traveler trip prep preview";
    case "coach":
      return "Coach traveler prep preview";
    case "admin":
      return "Staff traveler prep preview";
    case "super_admin":
      return "Full traveler prep preview";
    case "ds_admin":
      return "Trip prep is hidden for DS Admin";
  }
}

function getReadinessLabel(score: number, riskLevel: TripPrepRiskLevel): string {
  if (riskLevel === "high") {
    return `${score}% ready • high-touch follow-up needed`;
  }

  if (riskLevel === "medium") {
    return `${score}% ready • a few blockers remain`;
  }

  return `${score}% ready • mostly on track`;
}

function getReadinessTone(score: number, riskLevel: TripPrepRiskLevel): TripPrepAlertTone {
  if (riskLevel === "high" || score < 60) {
    return "red";
  }

  if (riskLevel === "medium" || score < 85) {
    return "yellow";
  }

  return "green";
}

function buildCountdownLabel(departureDateIso: string): string {
  const currentDate = new Date(mockSltTripCurrentDateIso);
  const departureDate = new Date(departureDateIso);
  const differenceMs = departureDate.getTime() - currentDate.getTime();
  const daysUntilDeparture = Math.max(Math.ceil(differenceMs / (1000 * 60 * 60 * 24)), 0);

  return `${daysUntilDeparture} days until ${formatDateLabel(departureDateIso)}`;
}

function formatDateLabel(dateIso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateIso));
}

function getChecklistWeight(status: TripPrepChecklistStatus): number {
  switch (status) {
    case "complete":
      return 1;
    case "in_review":
      return 0.85;
    case "upcoming":
      return 0.6;
    case "needs_attention":
      return 0.35;
  }
}

function matchesChecklistFilter(
  status: TripPrepChecklistStatus,
  filter: SltTripPrepChecklistFilter,
): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "complete") {
    return status === "complete";
  }

  return status === "needs_attention" || status === "in_review";
}
