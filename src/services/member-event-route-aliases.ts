import { isMemberEventClosedStatus } from "@/services/member-event-lifecycle";
import type { ChapterEventRow } from "@/shared/types/persistence";

export type MemberTestEventRouteTemplate = {
  title: string;
  eventType: string;
  promotionSummary: string;
  locationLabel: string;
};

const memberTestEventRouteAliases = new Map<string, MemberTestEventRouteTemplate>([
  [
    "chapter-event-ucla-kickoff",
    {
      title: "TEST Intro GBM",
      eventType: "social",
      promotionSummary:
        "Production-safe TEST event loop for RSVP, check-in, attendance, and points. No Luma or external provider write runs from this event.",
      locationLabel: "TEST chapter event",
    },
  ],
]);

export function getMemberTestEventRouteTemplate(routeEventId: string) {
  return (
    memberTestEventRouteAliases.get(routeEventId) ??
    memberTestEventRouteAliases.get("chapter-event-ucla-kickoff") ??
    null
  );
}

export function resolveMemberEventRouteId(
  chapterEvents: readonly ChapterEventRow[],
  routeEventId: string,
) {
  if (chapterEvents.some((event) => event.id === routeEventId)) {
    return routeEventId;
  }

  const template = memberTestEventRouteAliases.get(routeEventId);

  if (!template) {
    return routeEventId;
  }

  const matchingEvents = chapterEvents
    .filter((event) => event.title === template.title)
    .sort((left, right) => {
      const lifecycleDifference =
        Number(isMemberEventClosedStatus(left.status)) -
        Number(isMemberEventClosedStatus(right.status));

      if (lifecycleDifference !== 0) {
        return lifecycleDifference;
      }

      return getEventSortValue(right) - getEventSortValue(left);
    });

  return matchingEvents[0]?.id ?? routeEventId;
}

function getEventSortValue(event: ChapterEventRow) {
  return new Date(event.starts_at ?? event.created_at).getTime();
}
