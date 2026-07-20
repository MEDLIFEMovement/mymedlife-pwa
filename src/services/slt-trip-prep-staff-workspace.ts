import { mockSltTripTravelers } from "@/data/mock-slt-trip-prep";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  calculateReadinessScore,
  getSltTripPrepWorkspace,
} from "@/services/slt-trip-prep-workspace";
import type { TripPrepTraveler } from "@/shared/types/slt-trip-prep";

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
  bulkActionPreview: string | null;
  safetyNotes: string[];
  counts: {
    totalTravelers: number;
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
  if (
    actor.audience !== "coach" &&
    actor.audience !== "admin" &&
    actor.audience !== "super_admin"
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
      bulkActionPreview: null,
      safetyNotes: readWorkspace.safetyNotes,
      counts: {
        totalTravelers: 0,
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
  const filteredTravelers = mockSltTripTravelers.filter(
    (traveler) => riskFilter === "all" || traveler.riskLevel === riskFilter,
  );
  const travelers = filteredTravelers.map((traveler) =>
    toTravelerSummary(traveler, focusFilter),
  );
  const selectedTraveler =
    filteredTravelers.find((traveler) => traveler.id === options?.travelerId) ??
    filteredTravelers[0] ??
    mockSltTripTravelers[0];
  const selectedTravelerReadiness = calculateReadinessScore(selectedTraveler.checklist);

  return {
    canReadDashboard: true,
    title: getTitle(actor),
    summary:
      "Use this staff dashboard to sort travelers by risk, inspect the next blocker, and rehearse bulk support decisions without creating real reminders, CRM writes, or payment changes.",
    riskFilter,
    focusFilter,
    bulkAction,
    travelers,
    selectedTraveler,
    selectedTravelerReadiness,
    selectedTravelerHighlights: getTravelerHighlights(selectedTraveler, focusFilter),
    bulkActionPreview: getBulkActionPreview(bulkAction, focusFilter, travelers.length),
    safetyNotes: [
      "Bulk follow-up, payment edits, form reminders, flight changes, and meeting nudges stay preview-only.",
      selectedTraveler.mockSources.shopify,
      selectedTraveler.mockSources.hubspot,
      selectedTraveler.mockSources.luma,
    ],
    counts: {
      totalTravelers: travelers.length,
      highRiskTravelers: mockSltTripTravelers.filter((traveler) => traveler.riskLevel === "high")
        .length,
      openChecklistItems: mockSltTripTravelers.reduce((total, traveler) => {
        return total + traveler.checklist.filter((item) => item.status !== "complete").length;
      }, 0),
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

  return {
    id: traveler.id,
    displayName: traveler.displayName,
    chapterName: traveler.chapterName,
    readinessScore,
    riskLabel: traveler.riskLevel,
    openItems,
    nextOwner: nextAlert?.owner ?? "Traveler success",
    focusSummary: getFocusSummary(traveler, focusFilter),
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
        .map((item) => item.label)
        .join(" • ") || "Flights are on track";
    case "meetings":
      return traveler.meetings
        .filter((item) => item.status !== "attended")
        .map((item) => item.title)
        .join(" • ") || "Meetings are on track";
    case "all":
      return traveler.alerts[0]?.summary ?? "Traveler packet is on track.";
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

  return highlights.slice(0, 3) as string[];
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
    return `Preview only: queue a finance follow-up packet for ${travelerCount} traveler(s) focused on ${focusFilter}. No Shopify or HubSpot write runs.`;
  }

  if (bulkAction === "meeting-makeup") {
    return `Preview only: prepare a make-up meeting list for ${travelerCount} traveler(s). No Luma event, email, or SMS write runs.`;
  }

  return `Preview only: prepare a traveler packet review list for ${travelerCount} traveler(s). No traveler readiness rows or audit rows are saved from this dashboard.`;
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "coach":
      return "Coach traveler readiness dashboard";
    case "admin":
      return "Staff traveler readiness dashboard";
    case "super_admin":
      return "Full traveler readiness dashboard";
    case "chapter_member":
    case "chapter_leader":
    case "ds_admin":
      return "Staff trip prep dashboard is hidden for this role";
  }
}
