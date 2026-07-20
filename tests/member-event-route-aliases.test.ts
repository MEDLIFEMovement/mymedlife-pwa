import { describe, expect, it } from "vitest";

import {
  getMemberTestEventRouteTemplate,
  resolveMemberEventRouteId,
} from "@/services/member-event-route-aliases";
import type { ChapterEventRow } from "@/shared/types/persistence";

describe("member event route aliases", () => {
  it("shares the canonical TEST event template with the write path", () => {
    expect(getMemberTestEventRouteTemplate("chapter-event-ucla-kickoff")).toMatchObject({
      title: "TEST Intro GBM",
      eventType: "social",
    });
    expect(getMemberTestEventRouteTemplate("unknown-test-alias")).toMatchObject({
      title: "TEST Intro GBM",
    });
  });

  it("preserves exact and unknown route ids", () => {
    const event = buildEvent({ id: "event-1" });

    expect(resolveMemberEventRouteId([event], "event-1")).toBe("event-1");
    expect(resolveMemberEventRouteId([event], "missing-event")).toBe("missing-event");
  });

  it("prefers the newest open persisted event for the canonical TEST route", () => {
    const newerClosed = buildEvent({
      id: "closed-event",
      status: "feedback_collected",
      starts_at: "2026-07-22T18:00:00Z",
    });
    const olderOpen = buildEvent({
      id: "older-open-event",
      starts_at: "2026-07-20T18:00:00Z",
    });
    const newerOpen = buildEvent({
      id: "newer-open-event",
      starts_at: "2026-07-21T18:00:00Z",
    });

    expect(
      resolveMemberEventRouteId(
        [newerClosed, olderOpen, newerOpen],
        "chapter-event-ucla-kickoff",
      ),
    ).toBe("newer-open-event");
  });
});

function buildEvent(overrides: Partial<ChapterEventRow> = {}): ChapterEventRow {
  return {
    id: "event-1",
    chapter_id: "chapter-1",
    campaign_id: "campaign-1",
    phase_id: null,
    action_committee_id: null,
    assignment_id: null,
    title: "TEST Intro GBM",
    event_type: "social",
    status: "published",
    planned_by_user_id: "member-1",
    owner_user_id: "member-1",
    starts_at: "2026-07-20T18:00:00Z",
    ends_at: "2026-07-20T20:00:00Z",
    promotion_summary: "TEST member event loop",
    attendance_count: 0,
    eligible_member_count: 1,
    attendance_rate: 0,
    nps_score: null,
    feedback_summary: null,
    warehouse_status: "disabled",
    luma_event_link_id: null,
    created_at: "2026-07-19T18:00:00Z",
    updated_at: "2026-07-19T18:00:00Z",
    ...overrides,
  };
}
