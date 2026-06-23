import { mockSltTripTravelers } from "@/data/mock-slt-trip-prep";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { buildSltChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import {
  calculateReadinessScore,
  getSltTripPrepWorkspace,
} from "@/services/slt-trip-prep-workspace";
import type { TripPrepChecklistItem, TripPrepTraveler } from "@/shared/types/slt-trip-prep";

export type SltTripPrepStaffRiskFilter = "all" | "high" | "medium" | "low";

export type SltTripPrepStaffFocusFilter =
  | "all"
  | "payments"
  | "forms"
  | "flights"
  | "meetings";

export type SltTripPrepStaffBulkAction =
  | "none"
  | "payment-follow-up"
  | "meeting-makeup"
  | "packet-review";

export type SltTripPrepStaffTravelerSummary = {
  id: string;
  displayName: string;
  chapterName: string;
  readinessScore: number;
  riskLabel: string;
  openItems: number;
  nextOwner: string;
  focusSummary: string;
  detailHref: string;
  detailLabel: string;
};

export type SltTripPrepStaffWorkspace = {
  canReadDashboard: boolean;
  title: string;
  summary: string;
  riskFilter: SltTripPrepStaffRiskFilter;
  focusFilter: SltTripPrepStaffFocusFilter;
  bulkAction: SltTripPrepStaffBulkAction;
  travelers: SltTripPrepStaffTravelerSummary[];
  selectedTraveler: TripPrepTraveler | null;
  selectedTravelerReadiness: number;
  selectedTravelerHighlights: string[];
  selectedTravelerDrilldown: {
    href: string;
    label: string;
    helper: string;
  } | null;
  bulkActionPreview: string | null;
  safetyNotes: string[];
  counts: {
    totalTravelers: number;
    readyTravelers: number;
    needsAttentionTravelers: number;
    highRiskTravelers: number;
    openChecklistItems: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getSltTripPrepStaffWorkspace(
  actor: LocalActorContext,
  options?: {
    riskFilter?: SltTripPrepStaffRiskFilter;
    focusFilter?: SltTripPrepStaffFocusFilter;
    bulkAction?: SltTripPrepStaffBulkAction;
    travelerId?: string;
  },
): SltTripPrepStaffWorkspace {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (
    surfaceFamily !== "coach" &&
    surfaceFamily !== "staff" &&
    surfaceFamily !== "super_admin"
  ) {
    const readWorkspace = getSltTripPrepWorkspace(actor);

    return {
      canReadDashboard: false,
      title: "Staff trip prep dashboard is hidden for this role",
      summary:
        "Traveler portfolio review belongs to coach and staff roles. Travelers should use the mobile prep view instead.",
      riskFilter: options?.riskFilter ?? "all",
      focusFilter: options?.focusFilter ?? "all",
      bulkAction: options?.bulkAction ?? "none",
      travelers: [],
      selectedTraveler: null,
      selectedTravelerReadiness: 0,
      selectedTravelerHighlights: [],
      selectedTravelerDrilldown: null,
      bulkActionPreview: null,
      safetyNotes: readWorkspace.safetyNotes,
      counts: {
        totalTravelers: 0,
        readyTravelers: 0,
        needsAttentionTravelers: 0,
        highRiskTravelers: 0,
        openChecklistItems: 0,
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      },
    };
  }

  const riskFilter = options?.riskFilter ?? "all";
  const focusFilter = options?.focusFilter ?? "all";
  const bulkAction = options?.bulkAction ?? "none";
  const travelers = mockSltTripTravelers
    .filter((traveler) => riskFilter === "all" || traveler.riskLevel === riskFilter)
    .map((traveler) => toTravelerSummary(traveler, focusFilter));
  const selectedTraveler =
    mockSltTripTravelers.find((traveler) => traveler.id === options?.travelerId) ??
    mockSltTripTravelers.find((traveler) => riskFilter === "all" || traveler.riskLevel === riskFilter) ??
    mockSltTripTravelers[0];
  const selectedTravelerReadiness = calculateReadinessScore(selectedTraveler.checklist);
  const readyTravelers = travelers.filter((traveler) => traveler.readinessScore >= 85).length;
  const needsAttentionTravelers = travelers.length - readyTravelers;

  return {
    canReadDashboard: true,
    title: getTitle(),
    summary:
      "Use this staff dashboard to sort travelers by risk, inspect the next blocker, and rehearse bulk support decisions without creating real reminders, CRM writes, or payment changes.",
    riskFilter,
    focusFilter,
    bulkAction,
    travelers,
    selectedTraveler,
    selectedTravelerReadiness,
    selectedTravelerHighlights: getTravelerHighlights(selectedTraveler, focusFilter),
    selectedTravelerDrilldown: getTravelerDrilldown(selectedTraveler, focusFilter),
    bulkActionPreview: getBulkActionPreview(bulkAction, focusFilter, travelers.length),
    safetyNotes: [
      "Bulk follow-up, payment edits, form reminders, flight changes, and meeting nudges stay preview-only.",
      selectedTraveler.mockSources.shopify,
      selectedTraveler.mockSources.hubspot,
      selectedTraveler.mockSources.luma,
    ],
    counts: {
      totalTravelers: travelers.length,
      readyTravelers,
      needsAttentionTravelers,
      highRiskTravelers: travelers.filter((traveler) => traveler.riskLabel === "high").length,
      openChecklistItems: travelers.reduce((total, traveler) => total + traveler.openItems, 0),
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function toTravelerSummary(
  traveler: TripPrepTraveler,
  focusFilter: SltTripPrepStaffFocusFilter,
): SltTripPrepStaffTravelerSummary {
  const readinessScore = calculateReadinessScore(traveler.checklist);
  const openItems = traveler.checklist.filter((item) => item.status !== "complete").length;
  const nextAlert = traveler.alerts[0];
  const drilldown = getTravelerDrilldown(traveler, focusFilter);

  return {
    id: traveler.id,
    displayName: traveler.displayName,
    chapterName: traveler.chapterName,
    readinessScore,
    riskLabel: traveler.riskLevel,
    openItems,
    nextOwner: nextAlert?.owner ?? "Traveler success",
    focusSummary: getFocusSummary(traveler, focusFilter),
    detailHref: drilldown?.href ?? buildSltChecklistDetailHref("flight-itinerary", {
      source: "staff",
      travelerId: traveler.id,
    }),
    detailLabel: drilldown?.label ?? "Review blocker",
  };
}

function getFocusSummary(
  traveler: TripPrepTraveler,
  focusFilter: SltTripPrepStaffFocusFilter,
): string {
  switch (focusFilter) {
    case "payments":
      return traveler.payments
        .filter((item) => item.status !== "paid")
        .map((item) => item.title)
        .join(" • ") || "No active payment blockers";
    case "forms":
      return traveler.forms
        .filter((item) => item.status !== "submitted")
        .map((item) => item.title)
        .join(" • ") || "Forms are on track";
    case "flights":
      return traveler.flights
        .filter((item) => item.status !== "confirmed")
        .map((item) => item.summary)
        .join(" • ") || "Flights are on track";
    case "meetings":
      return traveler.meetings
        .filter((item) => item.status !== "attended")
        .map((item) => item.title)
        .join(" • ") || "Meetings are on track";
    case "all":
      return traveler.alerts[0]?.summary ?? "Traveler plan is on track.";
  }
}

function getTravelerHighlights(
  traveler: TripPrepTraveler,
  focusFilter: SltTripPrepStaffFocusFilter,
): string[] {
  const highlights = [
    traveler.alerts[0]?.summary,
    traveler.alerts[1]?.summary,
    getFocusSummary(traveler, focusFilter),
  ].filter(Boolean);

  return Array.from(new Set(highlights)).slice(0, 3) as string[];
}

function getTravelerDrilldown(
  traveler: TripPrepTraveler,
  focusFilter: SltTripPrepStaffFocusFilter,
) {
  const checklistItem =
    getPriorityChecklistItem(traveler, focusFilter) ?? getFallbackChecklistItem(traveler);

  if (!checklistItem) {
    return null;
  }

  return {
    href: buildSltChecklistDetailHref(checklistItem.id, {
      source: "staff",
      travelerId: traveler.id,
    }),
    label: checklistItem.title,
    helper: checklistItem.summary,
  };
}

function getPriorityChecklistItem(
  traveler: TripPrepTraveler,
  focusFilter: SltTripPrepStaffFocusFilter,
): TripPrepChecklistItem | null {
  switch (focusFilter) {
    case "payments":
      return getChecklistItemByCategory(traveler, "Payments");
    case "forms":
      return (
        getChecklistItemByCategory(traveler, "Required forms") ??
        getChecklistItemByCategory(traveler, "Travel docs")
      );
    case "flights":
      return getChecklistItemByCategory(traveler, "Flights");
    case "meetings":
      return getChecklistItemByCategory(traveler, "Meetings");
    case "all":
      return getChecklistItemFromAlertHref(traveler) ?? getFallbackChecklistItem(traveler);
  }
}

function getChecklistItemByCategory(
  traveler: TripPrepTraveler,
  category: TripPrepChecklistItem["category"],
) {
  return (
    traveler.checklist.find((item) => item.category === category && item.status === "needs_attention") ??
    traveler.checklist.find((item) => item.category === category && item.status === "in_review") ??
    traveler.checklist.find((item) => item.category === category && item.status === "upcoming") ??
    null
  );
}

function getChecklistItemFromAlertHref(traveler: TripPrepTraveler) {
  const href = traveler.alerts[0]?.href;
  const itemId = parseChecklistItemIdFromHref(href);
  return itemId
    ? traveler.checklist.find((item) => item.id === itemId) ?? null
    : null;
}

function getFallbackChecklistItem(traveler: TripPrepTraveler) {
  return (
    traveler.checklist.find((item) => item.status === "needs_attention") ??
    traveler.checklist.find((item) => item.status === "in_review") ??
    traveler.checklist.find((item) => item.status === "upcoming") ??
    traveler.checklist[0] ??
    null
  );
}

function parseChecklistItemIdFromHref(href?: string) {
  if (!href) {
    return null;
  }

  const match = href.match(/^\/slt-prep\/checklist\/([^/?#]+)/);
  if (!match) {
    return null;
  }

  return match[1] === "flight-info" ? "flight-itinerary" : match[1];
}

function getBulkActionPreview(
  bulkAction: SltTripPrepStaffBulkAction,
  focusFilter: SltTripPrepStaffFocusFilter,
  travelerCount: number,
): string | null {
  if (bulkAction === "none") {
    return null;
  }

  if (bulkAction === "payment-follow-up") {
    return `Preview only: queue a finance follow-up plan for ${travelerCount} traveler(s) focused on ${focusFilter}. No Shopify or HubSpot write runs.`;
  }

  if (bulkAction === "meeting-makeup") {
    return `Preview only: prepare a make-up meeting list for ${travelerCount} traveler(s). No Luma event, email, or SMS write runs.`;
  }

  return `Preview only: prepare a traveler review list for ${travelerCount} traveler(s). No traveler readiness rows or audit rows are saved from this dashboard.`;
}

function getTitle() {
  return "Traveler Readiness Dashboard";
}
