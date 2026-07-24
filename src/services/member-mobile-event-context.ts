import { ensureVisibleTestLabel } from "@/services/member-mobile-identity-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { ChapterEventRow } from "@/shared/types/persistence";

export type MemberMobileEventType =
  | "GBM"
  | "Fundraising"
  | "Local Volunteering"
  | "Growing the Movement"
  | "Meet People / Social"
  | "MED Talk"
  | "Pre-MED"
  | "Pre-Dental"
  | "Smiles Movement"
  | "Safe Homes"
  | "Engaged Education"
  | "SLT Prep"
  | "SLT Reflection"
  | "Eboard Transition"
  | "Moving Mountains"
  | "Rush Month"
  | "Mentorship Meeting"
  | "Tutoring"
  | "Skills Session";

export type MemberMobileEventContext = {
  id: string;
  routeId: string;
  title: string;
  date: string;
  loc: string;
  pts: number;
  status: "RSVP Open" | "Upcoming" | "Completed";
  campaign: string;
  eventType: MemberMobileEventType;
  featured: boolean;
  luma: boolean;
  rsvps: number | null;
};

export type MemberMobileCampaignContext = {
  name: string;
  objective: string;
};

export function buildMemberMobileEventContext(data: ReadOnlyAppData): {
  events: MemberMobileEventContext[];
  campaign: MemberMobileCampaignContext;
} {
  const campaignName = ensureVisibleTestLabel(data.campaign.name);
  const lumaEventIds = new Set(
    data.lumaEventLinkRows
      .map((row) => row.chapter_event_id)
      .filter((id): id is string => Boolean(id)),
  );

  const orderedRows = [...data.chapterEventRows].sort((left, right) => {
    const statusDifference = getMemberEventStatusRank(left.status) - getMemberEventStatusRank(right.status);
    if (statusDifference !== 0) {
      return statusDifference;
    }

    if (getMemberEventStatus(left.status) === "Completed") {
      return getTimestamp(right.starts_at) - getTimestamp(left.starts_at);
    }

    return getTimestamp(left.starts_at) - getTimestamp(right.starts_at);
  });

  const events = orderedRows.map((row, index) => {
    const lumaLinked = lumaEventIds.has(row.id);

    return {
      id: row.id,
      routeId: row.id,
      title: ensureVisibleTestLabel(row.title),
      date: formatMemberEventDate(row.starts_at),
      loc: getMemberEventLocation(row),
      pts: getEventPoints(data, row.id),
      status: getMemberEventStatus(row.status),
      campaign:
        lumaLinked && row.campaign_id === null
          ? "Luma calendar history"
          : campaignName,
      eventType: getMemberEventType(row.event_type, row.title),
      featured: index === 0,
      luma: lumaLinked,
      rsvps: row.attendance_count,
    };
  });

  return {
    events,
    campaign: {
      name: campaignName,
      objective: ensureVisibleTestLabel(data.campaign.objective),
    },
  };
}

function getMemberEventLocation(row: ChapterEventRow) {
  const locationName = row.location_name?.trim();
  const virtualUrl = row.virtual_url?.trim();
  const importedLocation = getImportedLumaLocation(row.promotion_summary);

  if (row.location_type === "hybrid" && locationName && virtualUrl) {
    return `${locationName} + virtual`;
  }

  if (locationName) {
    return locationName;
  }

  if (virtualUrl) {
    return "Virtual event";
  }

  if (importedLocation) {
    return importedLocation;
  }

  return "Location not set";
}

function getImportedLumaLocation(value: string | null) {
  const prefix = "Imported from Luma. Location:";
  const summary = value?.trim();

  return summary?.startsWith(prefix)
    ? summary.slice(prefix.length).trim() || null
    : null;
}

function getMemberEventStatusRank(status: string) {
  return getMemberEventStatus(status) === "Completed" ? 1 : 0;
}

function getTimestamp(value: string | null) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function formatMemberEventDate(value: string | null) {
  if (!value) {
    return "Date not set";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}

function getEventPoints(data: ReadOnlyAppData, chapterEventId: string) {
  return data.pointsEventRows
    .filter((row) => row.chapter_event_id === chapterEventId)
    .reduce((total, row) => total + row.points_delta, 0);
}

function getMemberEventStatus(status: string): MemberMobileEventContext["status"] {
  if (["completed", "feedback_collected", "canceled", "cancelled"].includes(status)) {
    return "Completed";
  }

  if (["published", "open", "rsvp_open"].includes(status)) {
    return "RSVP Open";
  }

  return "Upcoming";
}

function getMemberEventType(eventType: string, title: string): MemberMobileEventType {
  const value = `${eventType} ${title}`.toLowerCase();

  if (value.includes("fundrais")) return "Fundraising";
  if (value.includes("volunteer") || value.includes("service")) return "Local Volunteering";
  if (value.includes("social")) return "Meet People / Social";
  if (value.includes("slt")) return "SLT Prep";
  if (value.includes("skill") || value.includes("training")) return "Skills Session";
  if (value.includes("mentor")) return "Mentorship Meeting";
  if (value.includes("tutor")) return "Tutoring";
  if (value.includes("gbm") || value.includes("general body")) return "GBM";

  return "Growing the Movement";
}
