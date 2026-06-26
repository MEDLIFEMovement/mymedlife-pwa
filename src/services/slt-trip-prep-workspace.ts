import {
  mockSltTripCurrentDateIso,
  mockSltTripTravelers,
} from "@/data/mock-slt-trip-prep";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { buildSltChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import type { MobileNavigationItem } from "@/services/role-visibility";
import type {
  TripPrepAlertTone,
  TripPrepChecklistItem,
  TripPrepChecklistStatus,
  TripPrepRiskLevel,
  TripPrepTraveler,
} from "@/shared/types/slt-trip-prep";

export type SltTripPrepChecklistFilter =
  | "all"
  | "missing"
  | "due_soon"
  | "complete"
  | "needs_attention";

export type SltTripPrepSectionLink = {
  href: string;
  label: string;
  helper: string;
  tone: TripPrepAlertTone;
};

export type SltTripPrepRouteSource = "notifications" | "profile" | "staff";

export const sltTripPrepSubnavItems: ReadonlyArray<{
  href: string;
  label: string;
}> = [
  { href: "/slt-prep", label: "Overview" },
  { href: "/slt-prep/checklist", label: "Checklist" },
  { href: "/slt-prep/forms", label: "Forms" },
  { href: "/slt-prep/payments", label: "Payments" },
  { href: "/slt-prep/flights", label: "Flights" },
  { href: "/slt-prep/meetings", label: "Meetings" },
  { href: "/slt-prep/extensions", label: "Extensions" },
  { href: "/slt-prep/timeline", label: "Timeline" },
  { href: "/slt-prep/notifications", label: "Notifications" },
  { href: "/slt-prep/profile", label: "Profile" },
  { href: "/slt-prep/staff", label: "Staff" },
];

export const sltTripPrepMobileQuickNavItems: ReadonlyArray<MobileNavigationItem> = [
  { href: "/slt-prep", label: "Home", helper: "Trip" },
  { href: "/slt-prep/checklist", label: "Trip Prep", helper: "Steps" },
  { href: "/slt-prep/timeline", label: "Events", helper: "Dates" },
  { href: "/slt-prep/profile", label: "Profile", helper: "Me" },
];

export function buildSltTripPrepRouteHref(
  href: string,
  options: {
    source?: SltTripPrepRouteSource;
    travelerId?: string;
  } = {},
) {
  const [pathAndQuery, hash = ""] = href.split("#");
  const [pathname, query = ""] = pathAndQuery.split("?");
  const searchParams = new URLSearchParams(query);

  if (options.source) {
    searchParams.set("source", options.source);
  }

  if (options.travelerId) {
    searchParams.set("traveler", options.travelerId);
  }

  const nextHref = searchParams.toString().length > 0 ? `${pathname}?${searchParams}` : pathname;

  return hash.length > 0 ? `${nextHref}#${hash}` : nextHref;
}

export function getSltTripPrepSubnavItems(options: {
  source?: SltTripPrepRouteSource;
  travelerId?: string;
} = {}) {
  return sltTripPrepSubnavItems.map((item) => ({
    ...item,
    href: buildSltTripPrepRouteHref(item.href, options),
  }));
}

export function getSltTripPrepMobileQuickNavItems(options: {
  source?: SltTripPrepRouteSource;
  travelerId?: string;
} = {}) {
  return sltTripPrepMobileQuickNavItems.map((item) => ({
    ...item,
    href: buildSltTripPrepRouteHref(item.href, options),
  }));
}

export function parseSltTripPrepRouteSource(value?: string): SltTripPrepRouteSource | null {
  switch (value) {
    case "notifications":
    case "profile":
    case "staff":
      return value;
    default:
      return null;
  }
}

export function getSltTripPrepRouteSourceContext(
  source: SltTripPrepRouteSource | null,
  travelerId?: string,
  travelerDisplayName?: string,
) {
  const travelerLabel = travelerDisplayName ?? "the selected traveler";

  switch (source) {
    case "notifications":
      return {
        eyebrow: "Opened from notifications",
        title: `Notifications opened this prep route for ${travelerLabel}.`,
        detail: `Keep ${travelerLabel} anchored in the readiness update that sent them here, with a clear path back to the notification center.`,
        backHref: buildSltTripPrepRouteHref("/slt-prep/notifications", { travelerId }),
        backLabel: "Back to notifications",
      };
    case "profile":
      return {
        eyebrow: "Opened from profile",
        title: `Profile opened this prep route for ${travelerLabel}.`,
        detail: `The profile route mixes traveler identity with recent updates, so the next prep move should still feel attached to ${travelerLabel}'s member-owned destination.`,
        backHref: buildSltTripPrepRouteHref("/slt-prep/profile", { travelerId }),
        backLabel: "Back to profile",
      };
    case "staff":
      return {
        eyebrow: "Opened from staff",
        title: `Staff traveler review opened this prep route for ${travelerLabel}.`,
        detail: `Keep ${travelerLabel} attached to the prep flow so reviewers can move between context and next-step routes without losing the route they opened.`,
        backHref: buildSltTripPrepRouteHref("/slt-prep/staff", { travelerId }),
        backLabel: "Back to staff",
      };
    default:
      return null;
  }
}

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
  notificationActions: SltTripPrepSectionLink[];
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
  if (getActorSurfaceFamily(actor) === "ds_admin") {
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
      notificationActions: [],
      safetyNotes: [
        "No traveler readiness rows are shown to DS Admin.",
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
      href: nextAlert
        ? buildSltChecklistDetailHref(resolveChecklistRouteItemId(nextAlert.href), {
            source: "overview",
          })
        : "/slt-prep/checklist",
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
          : "blue",
      },
      {
        href: "/slt-prep/payments",
        label: "Payment status",
        helper: `${traveler.payments.length} payment milestones`,
        tone: traveler.payments.some((item) => item.status === "due") ? "red" : "blue",
      },
      {
        href: "/slt-prep/flights",
        label: "Flight details",
        helper: `${traveler.flights.length} itinerary segments`,
        tone: traveler.flights.some((item) => item.status !== "confirmed") ? "red" : "blue",
      },
      {
        href: "/slt-prep/meetings",
        label: "Pre-trip meetings",
        helper: `${traveler.meetings.length} meeting touchpoints`,
        tone: meetingsRemaining > 0 ? "yellow" : "blue",
      },
      {
        href: "/slt-prep/extensions",
        label: "Extensions and tours",
        helper: `${traveler.extensions.length} optional choices`,
        tone: traveler.extensions.some((item) => item.status === "considering")
          ? "yellow"
          : "blue",
      },
      {
        href: "/slt-prep/timeline",
        label: "Trip timeline",
        helper: `${traveler.timeline.length} milestones to departure`,
        tone: "blue",
      },
      {
        href: "/slt-prep/notifications",
        label: "Notifications",
        helper: `${traveler.notifications.length} recent updates`,
        tone: traveler.notifications.some((item) => item.tone === "urgent") ? "red" : "blue",
      },
      {
        href: "/slt-prep/profile",
        label: "Profile & alerts",
        helper: "Passport, contact, flights, and notifications",
        tone: "blue",
      },
    ],
    notificationActions: getNotificationActions(traveler),
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

function getNotificationActions(traveler: TripPrepTraveler): SltTripPrepSectionLink[] {
  const duePayments = traveler.payments.filter((item) => item.status !== "paid");
  const unresolvedFlights = traveler.flights.filter((item) => item.status !== "confirmed");
  const meetingAttention = traveler.meetings.filter((item) => item.status !== "attended");
  const extensionChoices = traveler.extensions.filter((item) => item.status !== "selected");

  return [
    {
      href: "/slt-prep/flights",
      label: "Submit flight info",
      helper:
        unresolvedFlights.length > 0
          ? `${unresolvedFlights.length} itinerary item still needs review`
          : "Flight details are already confirmed",
      tone: unresolvedFlights.length > 0 ? "red" : "blue",
    },
    {
      href: "/slt-prep/meetings",
      label: "Join meeting",
      helper:
        meetingAttention.length > 0
          ? `${meetingAttention.length} meeting touchpoint still needs attention`
          : "All required meetings are complete",
      tone: meetingAttention.some((item) => item.status === "missed")
        ? "red"
        : meetingAttention.length > 0
          ? "yellow"
          : "blue",
    },
    {
      href: "/slt-prep/payments",
      label: "Pay balance",
      helper:
        duePayments.length > 0
          ? `${duePayments.length} payment milestone still open`
          : "No travel balance is currently due",
      tone: duePayments.some((item) => item.status === "due")
        ? "red"
        : duePayments.length > 0
          ? "yellow"
          : "blue",
    },
    {
      href: "/slt-prep/extensions",
      label: "Choose extension",
      helper:
        extensionChoices.length > 0
          ? `${extensionChoices.length} optional choice is still undecided`
          : "Extension decisions are already set",
      tone: extensionChoices.length > 0 ? "yellow" : "blue",
    },
  ];
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

  const resolvedItemId = resolveChecklistDetailItemId(itemId);
  const item = workspace.traveler.checklist.find(
    (candidate) => candidate.id === resolvedItemId,
  );

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
    relatedLinks: buildChecklistDetailRelatedLinks(workspace, item),
    safetyNotes: [
      "Completion and correction flows stay preview-only until a real traveler write path is approved.",
      "This item can explain the future evidence step, but it cannot save a status change or send a reminder yet.",
      workspace.traveler.mockSources.hubspot,
    ],
    counts: {
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function buildChecklistDetailRelatedLinks(
  workspace: SltTripPrepWorkspace,
  item: TripPrepChecklistItem,
): SltTripPrepSectionLink[] {
  const sectionLinkByHref = new Map(
    workspace.sectionLinks.map((link) => [link.href, link] as const),
  );
  const prioritizedHrefs = [
    "/slt-prep/checklist",
    getChecklistSectionHref(item),
    "/slt-prep/timeline",
    "/slt-prep/profile",
  ];
  const relatedLinks = prioritizedHrefs.flatMap((href) => {
    const link = sectionLinkByHref.get(href);
    return link ? [link] : [];
  });

  relatedLinks.push({
    href: "/slt-prep/staff",
    label: "Staff dashboard",
    helper: "Open the traveler-readiness review surface with risk filters and support posture.",
    tone: workspace.readiness.tone,
  });

  return relatedLinks.filter((link, index, links) => {
    return links.findIndex((candidate) => candidate.href === link.href) === index;
  });
}

function getChecklistSectionHref(item: TripPrepChecklistItem): string {
  switch (item.category) {
    case "Travel docs":
    case "Required forms":
      return "/slt-prep/forms";
    case "Payments":
      return "/slt-prep/payments";
    case "Flights":
      return "/slt-prep/flights";
    case "Meetings":
      return "/slt-prep/meetings";
    case "Extensions":
      return "/slt-prep/extensions";
    default:
      return "/slt-prep/checklist";
  }
}

function resolveChecklistDetailItemId(itemId: string): string {
  switch (itemId) {
    case "flight-info":
      return "flight-itinerary";
    default:
      return itemId;
  }
}

function resolveChecklistRouteItemId(href: string): string {
  const match = href.match(/^\/slt-prep\/checklist\/([^/?#]+)/);
  return match ? resolveChecklistDetailItemId(match[1]) : "flight-itinerary";
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
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return "Trip prep";
    case "leader":
      return "Traveler trip prep preview";
    case "coach":
      return "Coach traveler prep preview";
    case "staff":
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

  return "blue";
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

  if (filter === "due_soon") {
    return status === "in_review" || status === "upcoming";
  }

  return status === "needs_attention" || status === "in_review";
}
