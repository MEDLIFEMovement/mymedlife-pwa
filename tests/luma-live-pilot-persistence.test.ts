import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  SupabaseAppClient,
  SupabaseAppMutateOptions,
  SupabaseAppSelectOptions,
} from "@/lib/supabase-app-client";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  persistLumaAttendanceImportProof,
  persistLumaEventUpsertProof,
  persistLumaRsvpProof,
} from "@/services/luma-live-pilot-persistence";
import {
  getLaunchLaneChapterLeaderboardReadback,
  getLaunchLaneLeaderEventReadback,
  getLaunchLaneMemberPointsReadback,
  getLaunchLaneOrgLeaderboardRows,
  getLaunchLaneOrgPointsReadback,
} from "@/services/launch-lane-points-readback";
import type { LumaImportedAttendanceRawRow } from "@/services/luma-live-pilot";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";
import type {
  AuditLogRow,
  AutomationOutboxRow,
  ChapterEventRow,
  EventRow,
  IntegrationEventRow,
  JsonValue,
  LumaEventLinkRow,
  PointsEventRow,
  ProfileRow,
} from "@/shared/types/persistence";

const NOW = "2026-07-01T12:00:00.000Z";

vi.mock("next/navigation", () => ({
  usePathname: () => "/leader",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

vi.mock("@/services/luma-live-pilot", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/luma-live-pilot")>();

  return {
    ...actual,
    getLumaLivePilotGateDurable: vi.fn(),
  };
});

vi.mock("@/services/luma-live-pilot-persistence", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/luma-live-pilot-persistence")>();

  return {
    ...actual,
    getLumaPilotPersistenceReadiness: vi.fn(),
  };
});

describe("luma live pilot persistence", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("records event create proof with audit rows and a disabled outbox item", async () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const data = createSupabaseReadData();
    const state = createMockAppState();
    const client = createMockAppClient(state);

    const result = await persistLumaEventUpsertProof(
      {
        actor,
        request: {
          name: "UCLA Rush Month Kickoff",
          startAt: "2026-07-20T23:00:00.000Z",
          endAt: "2026-07-21T00:00:00.000Z",
          timezone: "America/Los_Angeles",
          address: "UCLA, Los Angeles, CA",
          descriptionMd: "Staging-only pilot event.",
        },
        result: {
          ok: true,
          operation: "event_create",
          status: "executed",
          safeMessage: "Luma event created.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-created",
          eventUrl: "https://lu.ma/evt-created",
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      {
        createClient: async () => ({
          client,
          persistence: {
            mode: "supabase",
            status: "ready",
            reason: "Test persistence.",
            isLocalOnly: false,
          },
        }),
        getData: async () => data,
        now: () => NOW,
      },
    );

    expect(result).toMatchObject({
      chapterEventId: "chapter-event-1",
      lumaEventLinkId: "luma-link-1",
      eventId: "evt-created",
      auditLogId: "audit-log-1",
      pointsCreated: 0,
      attendanceCount: 0,
      rsvpRecorded: false,
    });
    expect(state.chapterEvents).toHaveLength(1);
    expect(state.chapterEvents[0]).toMatchObject({
      title: "UCLA Rush Month Kickoff",
      status: "published",
      luma_event_link_id: "luma-link-1",
    });
    expect(state.lumaEventLinks[0]).toMatchObject({
      luma_event_id: "evt-created",
      status: "linked",
    });
    expect(state.eventRows[0]).toMatchObject({
      event_type: "luma_event_upserted",
      chapter_event_id: "chapter-event-1",
    });
    expect(state.integrationEventRows.map((row) => row.event_type)).toEqual([
      "luma_event_linked",
      "event_shared_to_feed",
    ]);
    expect(state.automationOutboxRows).toHaveLength(1);
    expect(state.automationOutboxRows[0]).toMatchObject({
      destination: "n8n",
      event_type: "luma_event_external_send_blocked",
      status: "disabled",
    });
    expect(state.auditLogRows[0]).toMatchObject({
      action: "luma_event_upsert_recorded",
      target_table: "luma_event_links",
      reason: "Recorded the staging Luma event proof in app tables.",
    });
  });

  it("does not duplicate RSVP proof rows for the same guest", async () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const attendee = createProfile("profile-1", "member.a@mymedlife.test");
    const data = createSupabaseReadData({
      profiles: [attendee],
    });
    const state = createMockAppState({
      lumaEventLinks: [
        createLumaEventLinkRow(data, {
          id: "luma-link-1",
          chapter_event_id: "chapter-event-1",
          luma_event_id: "evt-existing",
        }),
      ],
      eventRows: [
        createEventRowBase({
          id: "existing-rsvp-row",
          chapter_id: data.chapter.id,
          campaign_id: data.campaign.id,
          chapter_event_id: "chapter-event-1",
          event_type: "event_rsvp_recorded",
          actor_user_id: attendee.id,
          payload: {
            source: "luma_live_pilot",
            userId: attendee.id,
            userEmail: attendee.email,
          },
        }),
      ],
    });
    const client = createMockAppClient(state);

    const result = await persistLumaRsvpProof(
      {
        actor,
        request: {
          eventId: "evt-existing",
          email: attendee.email,
          name: "Member A",
        },
        result: {
          ok: true,
          operation: "rsvp_write",
          status: "executed",
          safeMessage: "RSVP recorded with email sending off.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-existing",
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      {
        createClient: async () => ({
          client,
          persistence: {
            mode: "supabase",
            status: "ready",
            reason: "Test persistence.",
            isLocalOnly: false,
          },
        }),
        getData: async () => data,
        now: () => NOW,
      },
    );

    expect(result).toMatchObject({
      chapterEventId: "chapter-event-1",
      lumaEventLinkId: "luma-link-1",
      eventId: "evt-existing",
      auditLogId: "existing-rsvp-proof",
      pointsCreated: 0,
      attendanceCount: 0,
      rsvpRecorded: false,
    });
    expect(state.eventRows).toHaveLength(1);
    expect(state.integrationEventRows).toHaveLength(0);
    expect(state.automationOutboxRows).toHaveLength(0);
    expect(state.auditLogRows).toHaveLength(0);
  });

  it("records attendance import proof, awards points for matched attendees, and keeps the outbox disabled", async () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const matchedProfile = createProfile("profile-1", "member.a@mymedlife.test");
    const data = createSupabaseReadData({
      profiles: [matchedProfile],
    });
    const state = createMockAppState({
      chapterEvents: [
        createChapterEventRow(data, {
          id: "chapter-event-1",
          title: "UCLA Rush Month Kickoff",
          status: "published",
          luma_event_link_id: "luma-link-1",
        }),
      ],
      lumaEventLinks: [
        createLumaEventLinkRow(data, {
          id: "luma-link-1",
          chapter_event_id: "chapter-event-1",
          luma_event_id: "evt-existing",
        }),
      ],
    });
    const client = createMockAppClient(state);

    const result = await persistLumaAttendanceImportProof(
      {
        actor,
        eventId: "evt-existing",
        result: {
          ok: true,
          operation: "attendance_import",
          status: "executed",
          safeMessage: "Attendance imported.",
          externalWrites: 0,
          externalReads: 1,
          eventId: "evt-existing",
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
        attendanceRows: [
          {
            guestId: "guest-1",
            email: matchedProfile.email,
            name: "Member A",
            approvalStatus: "approved",
            checkedInAt: NOW,
            attended: true,
          },
          {
            guestId: "guest-2",
            email: "unknown@mymedlife.test",
            name: "Unknown",
            approvalStatus: "approved",
            checkedInAt: NOW,
            attended: true,
          },
          {
            guestId: "guest-3",
            email: "late@mymedlife.test",
            name: "Late Arrival",
            approvalStatus: "approved",
            checkedInAt: null,
            attended: false,
          },
        ],
      },
      {
        createClient: async () => ({
          client,
          persistence: {
            mode: "supabase",
            status: "ready",
            reason: "Test persistence.",
            isLocalOnly: false,
          },
        }),
        getData: async () => data,
        now: () => NOW,
      },
    );

    expect(result).toMatchObject({
      chapterEventId: "chapter-event-1",
      lumaEventLinkId: "luma-link-1",
      eventId: "evt-existing",
      auditLogId: "audit-log-1",
      pointsCreated: 1,
      attendanceCount: 2,
      rsvpRecorded: false,
    });
    expect(state.pointsEventRows).toHaveLength(1);
    expect(state.pointsEventRows[0]).toMatchObject({
      chapter_event_id: "chapter-event-1",
      awarded_to_user_id: matchedProfile.id,
      points_delta: 20,
    });
    expect(state.chapterEvents[0]).toMatchObject({
      id: "chapter-event-1",
      attendance_count: 2,
      status: "completed",
    });
    expect(state.lumaEventLinks[0]).toMatchObject({
      id: "luma-link-1",
      last_imported_at: NOW,
      status: "linked",
    });
    expect(state.eventRows.at(-1)).toMatchObject({
      event_type: "event_attendance_recorded",
      chapter_event_id: "chapter-event-1",
    });
    expect(state.integrationEventRows.at(-1)).toMatchObject({
      event_type: "luma_attendance_imported",
      destination: "luma",
      status: "recorded",
    });
    expect(state.automationOutboxRows.at(-1)).toMatchObject({
      destination: "n8n",
      event_type: "luma_attendance_external_send_blocked",
      status: "disabled",
    });
    expect(state.auditLogRows[0]).toMatchObject({
      action: "luma_attendance_import_recorded",
      target_table: "chapter_events",
      reason: "Recorded the staging Luma attendance proof in app tables.",
    });
  });

  it("does not create duplicate points when the same attendee appears twice in one import", async () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const matchedProfile = createProfile("profile-1", "member.a@mymedlife.test");
    const data = createSupabaseReadData({
      profiles: [matchedProfile],
    });
    const state = createMockAppState({
      chapterEvents: [
        createChapterEventRow(data, {
          id: "chapter-event-1",
          title: "UCLA Rush Month Kickoff",
          status: "published",
          luma_event_link_id: "luma-link-1",
        }),
      ],
      lumaEventLinks: [
        createLumaEventLinkRow(data, {
          id: "luma-link-1",
          chapter_event_id: "chapter-event-1",
          luma_event_id: "evt-existing",
        }),
      ],
    });
    const client = createMockAppClient(state);

    const result = await persistLumaAttendanceImportProof(
      {
        actor,
        eventId: "evt-existing",
        result: {
          ok: true,
          operation: "attendance_import",
          status: "executed",
          safeMessage: "Attendance imported.",
          externalWrites: 0,
          externalReads: 1,
          eventId: "evt-existing",
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
        attendanceRows: [
          {
            guestId: "guest-1",
            email: matchedProfile.email,
            name: "Member A",
            approvalStatus: "approved",
            checkedInAt: NOW,
            attended: true,
          },
          {
            guestId: "guest-1-duplicate",
            email: matchedProfile.email,
            name: "Member A",
            approvalStatus: "approved",
            checkedInAt: NOW,
            attended: true,
          },
        ],
      },
      {
        createClient: async () => ({
          client,
          persistence: {
            mode: "supabase",
            status: "ready",
            reason: "Test persistence.",
            isLocalOnly: false,
          },
        }),
        getData: async () => data,
        now: () => NOW,
      },
    );

    expect(result).toMatchObject({
      pointsCreated: 1,
      attendanceCount: 1,
    });
    expect(state.pointsEventRows).toHaveLength(1);
    expect(state.pointsEventRows[0]).toMatchObject({
      chapter_event_id: "chapter-event-1",
      awarded_to_user_id: matchedProfile.id,
      points_delta: 20,
    });
    expect(state.chapterEvents[0]).toMatchObject({
      id: "chapter-event-1",
      attendance_count: 1,
      status: "completed",
    });
    expect(state.eventRows.at(-1)).toMatchObject({
      event_type: "event_attendance_recorded",
      payload: expect.objectContaining({
        attendanceCount: 1,
        importedGuestCount: 2,
        matchedUserCount: 1,
        pointsCreatedCount: 1,
      }),
    });
  });

  it("does not create duplicate points on a repeated attendance import for the same attendee", async () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const matchedProfile = createProfile("profile-1", "member.a@mymedlife.test");
    const data = createSupabaseReadData({
      profiles: [matchedProfile],
    });
    const state = createMockAppState({
      chapterEvents: [
        createChapterEventRow(data, {
          id: "chapter-event-1",
          title: "UCLA Rush Month Kickoff",
          status: "published",
          luma_event_link_id: "luma-link-1",
        }),
      ],
      lumaEventLinks: [
        createLumaEventLinkRow(data, {
          id: "luma-link-1",
          chapter_event_id: "chapter-event-1",
          luma_event_id: "evt-existing",
        }),
      ],
    });
    const client = createMockAppClient(state);

    const baseInput = {
      actor,
      eventId: "evt-existing",
      result: {
        ok: true,
        operation: "attendance_import" as const,
        status: "executed" as const,
        safeMessage: "Attendance imported.",
        externalWrites: 0,
        externalReads: 1,
        eventId: "evt-existing",
        eventUrl: null,
        attendanceRows: [],
        secretsReturned: false as const,
      },
      attendanceRows: [
        {
          guestId: "guest-1",
          email: matchedProfile.email,
          name: "Member A",
          approvalStatus: "approved",
          checkedInAt: NOW,
          attended: true,
        },
      ],
    };
    const deps = {
      createClient: async () => ({
        client,
        persistence: {
          mode: "supabase" as const,
          status: "ready" as const,
          reason: "Test persistence.",
          isLocalOnly: false,
        },
      }),
      getData: async () => data,
      now: () => NOW,
    };

    const firstResult = await persistLumaAttendanceImportProof(baseInput, deps);
    const secondResult = await persistLumaAttendanceImportProof(baseInput, deps);

    expect(firstResult).toMatchObject({
      pointsCreated: 1,
      attendanceCount: 1,
    });
    expect(secondResult).toMatchObject({
      pointsCreated: 0,
      attendanceCount: 1,
    });
    expect(state.pointsEventRows).toHaveLength(1);
    expect(state.pointsEventRows[0]).toMatchObject({
      awarded_to_user_id: matchedProfile.id,
      points_delta: 20,
    });
  });

  it("records event create proof against the selected chapter instead of always using the default active chapter", async () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const data = createSupabaseReadData();
    const state = createMockAppState();
    const client = createMockAppClient(state);

    const result = await persistLumaEventUpsertProof(
      {
        actor,
        request: {
          chapterId: "chapter-lakeside",
          name: "Lakeside Welcome Table",
          startAt: "2026-07-22T18:00:00.000Z",
          endAt: "2026-07-22T19:00:00.000Z",
          timezone: "America/New_York",
          address: "Lakeside College, Student Center",
          descriptionMd: "Second pilot chapter event.",
        },
        result: {
          ok: true,
          operation: "event_create",
          status: "executed",
          safeMessage: "Luma event created.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-lakeside",
          eventUrl: "https://lu.ma/evt-lakeside",
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      {
        createClient: async () => ({
          client,
          persistence: {
            mode: "supabase",
            status: "ready",
            reason: "Test persistence.",
            isLocalOnly: false,
          },
        }),
        getData: async () => data,
        now: () => NOW,
      },
    );

    expect(result.chapterEventId).toBe("chapter-event-1");
    expect(state.chapterEvents[0]).toMatchObject({
      chapter_id: "chapter-lakeside",
      campaign_id: "rush-month-2026-lakeside",
      title: "Lakeside Welcome Table",
    });
    expect(state.lumaEventLinks[0]).toMatchObject({
      chapter_id: "chapter-lakeside",
      campaign_id: "rush-month-2026-lakeside",
      luma_event_id: "evt-lakeside",
    });
  });

  it("keeps RSVP, attendance, and points tied to the linked chapter instead of falling back to the default chapter", async () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const memberProfile = createProfile("profile-1", member.user.email);
    const data = createSupabaseReadData({
      profiles: [memberProfile],
    });
    const state = createMockAppState();
    const client = createMockAppClient(state);
    const deps = {
      createClient: async () => ({
        client,
        persistence: {
          mode: "supabase" as const,
          status: "ready" as const,
          reason: "Test persistence.",
          isLocalOnly: false,
        },
      }),
      getData: async () => data,
      now: () => NOW,
    };

    const eventResult = await persistLumaEventUpsertProof(
      {
        actor: leader,
        request: {
          chapterId: "chapter-lakeside",
          chapterName: "Lakeside MEDLIFE",
          name: "Lakeside Welcome Table",
          startAt: "2026-07-22T18:00:00.000Z",
          endAt: "2026-07-22T19:00:00.000Z",
          timezone: "America/New_York",
          address: "Lakeside College, Student Center",
          descriptionMd: "Second pilot chapter event.",
        },
        result: {
          ok: true,
          operation: "event_create",
          status: "executed",
          safeMessage: "Luma event created.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-lakeside-live-loop",
          eventUrl: "https://lu.ma/evt-lakeside-live-loop",
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      deps,
    );

    const rsvpResult = await persistLumaRsvpProof(
      {
        actor: member,
        request: {
          eventId: eventResult.eventId,
          email: member.user.email,
          name: member.user.displayName,
        },
        result: {
          ok: true,
          operation: "rsvp_write",
          status: "executed",
          safeMessage: "RSVP recorded with email sending off.",
          externalWrites: 1,
          externalReads: 0,
          eventId: eventResult.eventId,
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      deps,
    );

    const attendanceResult = await persistLumaAttendanceImportProof(
      {
        actor: leader,
        eventId: eventResult.eventId,
        result: {
          ok: true,
          operation: "attendance_import",
          status: "executed",
          safeMessage: "Attendance imported.",
          externalWrites: 0,
          externalReads: 1,
          eventId: eventResult.eventId,
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
        attendanceRows: [
          {
            guestId: "guest-lakeside-1",
            email: member.user.email,
            name: member.user.displayName,
            approvalStatus: "approved",
            checkedInAt: NOW,
            attended: true,
          },
        ],
      },
      deps,
    );

    expect(rsvpResult).toMatchObject({
      chapterEventId: eventResult.chapterEventId,
      rsvpRecorded: true,
    });
    expect(attendanceResult).toMatchObject({
      chapterEventId: eventResult.chapterEventId,
      pointsCreated: 1,
      attendanceCount: 1,
    });
    expect(state.eventRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: "event_rsvp_recorded",
          chapter_id: "chapter-lakeside",
          campaign_id: "rush-month-2026-lakeside",
          chapter_event_id: eventResult.chapterEventId,
        }),
        expect.objectContaining({
          event_type: "event_attendance_recorded",
          chapter_id: "chapter-lakeside",
          campaign_id: "rush-month-2026-lakeside",
          chapter_event_id: eventResult.chapterEventId,
        }),
      ]),
    );
    expect(state.integrationEventRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: "luma_rsvp_recorded",
          chapter_id: "chapter-lakeside",
        }),
        expect.objectContaining({
          event_type: "luma_attendance_imported",
          chapter_id: "chapter-lakeside",
        }),
      ]),
    );
    expect(state.automationOutboxRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: "luma_rsvp_external_send_blocked",
          chapter_id: "chapter-lakeside",
        }),
        expect.objectContaining({
          event_type: "luma_attendance_external_send_blocked",
          chapter_id: "chapter-lakeside",
        }),
      ]),
    );
    expect(state.auditLogRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "luma_rsvp_recorded",
          chapter_id: "chapter-lakeside",
        }),
        expect.objectContaining({
          action: "luma_attendance_import_recorded",
          chapter_id: "chapter-lakeside",
        }),
      ]),
    );
    expect(state.pointsEventRows).toEqual([
      expect.objectContaining({
        chapter_id: "chapter-lakeside",
        campaign_id: "rush-month-2026-lakeside",
        chapter_event_id: eventResult.chapterEventId,
        awarded_to_user_id: memberProfile.id,
        points_delta: 20,
      }),
    ]);
  });

  it("feeds member, leader, and org readbacks from one persisted live event loop", async () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const memberProfile = createProfile("profile-1", member.user.email);
    const data = createSupabaseReadData({
      profiles: [memberProfile],
    });
    const state = createMockAppState();
    const client = createMockAppClient(state);
    const deps = {
      createClient: async () => ({
        client,
        persistence: {
          mode: "supabase" as const,
          status: "ready" as const,
          reason: "Test persistence.",
          isLocalOnly: false,
        },
      }),
      getData: async () => data,
      now: () => NOW,
    };

    const eventResult = await persistLumaEventUpsertProof(
      {
        actor: leader,
        request: {
          chapterId: data.chapter.id,
          chapterName: data.chapter.name,
          name: "Pilot Intro GBM",
          startAt: "2026-07-20T23:00:00.000Z",
          endAt: "2026-07-21T00:00:00.000Z",
          timezone: "America/Los_Angeles",
          address: "UCLA, Los Angeles, CA",
          descriptionMd: "Pilot kickoff event.",
        },
        result: {
          ok: true,
          operation: "event_create",
          status: "executed",
          safeMessage: "Luma event created.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-live-loop",
          eventUrl: "https://lu.ma/evt-live-loop",
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      deps,
    );

    const rsvpResult = await persistLumaRsvpProof(
      {
        actor: member,
        request: {
          eventId: eventResult.eventId,
          email: member.user.email,
          name: member.user.displayName,
        },
        result: {
          ok: true,
          operation: "rsvp_write",
          status: "executed",
          safeMessage: "RSVP recorded with email sending off.",
          externalWrites: 1,
          externalReads: 0,
          eventId: eventResult.eventId,
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      deps,
    );

    const attendanceRows: LumaImportedAttendanceRawRow[] = [
      {
        guestId: "guest-1",
        email: member.user.email,
        name: member.user.displayName,
        approvalStatus: "approved",
        checkedInAt: NOW,
        attended: true,
      },
    ];

    const attendanceResult = await persistLumaAttendanceImportProof(
      {
        actor: leader,
        eventId: eventResult.eventId,
        result: {
          ok: true,
          operation: "attendance_import",
          status: "executed",
          safeMessage: "Attendance imported.",
          externalWrites: 0,
          externalReads: 1,
          eventId: eventResult.eventId,
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
        attendanceRows,
      },
      deps,
    );

    expect(rsvpResult.rsvpRecorded).toBe(true);
    expect(attendanceResult.pointsCreated).toBe(1);

    const readbackData: ReadOnlyAppData = {
      ...data,
      chapterEventRows: state.chapterEvents,
      lumaEventLinkRows: state.lumaEventLinks,
      pointsEventRows: state.pointsEventRows,
      allChapterEventRows: state.chapterEvents,
      allLumaEventLinkRows: state.lumaEventLinks,
      allEventRows: state.eventRows,
      allPointsEventRows: state.pointsEventRows,
      eventRows: state.eventRows,
    };

    expect(getLaunchLaneMemberPointsReadback(member, readbackData)).toMatchObject({
      eventTitle: "Pilot Intro GBM",
      rsvpCount: 1,
      attendanceCount: 1,
      memberPointsAwarded: 20,
      chapterTotalPoints: 20,
      memberStatusLabel: "Points awarded",
    });
    expect(getLaunchLaneLeaderEventReadback(readbackData)).toMatchObject([
      {
        title: "Pilot Intro GBM",
        rsvpCount: 1,
        attendanceCount: 1,
        pointsAwarded: 20,
        statusLabel: "Attendance recorded",
      },
    ]);
    expect(getLaunchLaneChapterLeaderboardReadback(readbackData)).toMatchObject([
      {
        name: memberProfile.display_name,
        points: 20,
        detail: "Leading this chapter right now",
      },
    ]);
    expect(getLaunchLaneOrgPointsReadback(readbackData)).toMatchObject({
      totalRsvps: 1,
      totalAttendance: 1,
      totalPoints: 20,
      topChapterName: data.chapter.name,
      topChapterPoints: 20,
      featuredEventTitle: "Pilot Intro GBM",
      featuredEventAttendanceCount: 1,
      featuredEventPointsAwarded: 20,
    });
    expect(getLaunchLaneOrgLeaderboardRows(readbackData)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chapterName: data.chapter.name,
          points: 20,
          eventCount: 1,
        }),
      ]),
    );

    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.stubEnv(
      "MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON",
      JSON.stringify([
        {
          chapterId: data.chapter.id,
          chapterName: data.chapter.name,
          calendarId: "cal-ucla-1234",
          calendarLabel: "UCLA chapter calendar",
        },
      ]),
    );

    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(readbackData);
    vi.mocked(lumaModule.getLumaLivePilotGateDurable).mockResolvedValue({
      apiKeyConfigured: true,
      calendarIdConfigured: true,
      environment: "staging",
      productionBlocked: false,
      eventWritesEnabled: true,
      rsvpWritesEnabled: true,
      attendanceImportEnabled: true,
      enabledOperations: 3,
      detail: "Ready",
    });
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    const { default: MemberHomePage } = await import("@/app/app/page");
    const { default: MemberEventsPage } = await import("@/app/app/events/page");
    const { default: MemberEventDetailPage } = await import(
      "@/app/app/events/[eventId]/page"
    );
    const { default: MemberPointsPage } = await import("@/app/app/points/page");
    const memberHomeHtml = renderToStaticMarkup(await MemberHomePage({}));
    const memberEventsHtml = renderToStaticMarkup(await MemberEventsPage({}));
    const memberEventDetailHtml = renderToStaticMarkup(
      await MemberEventDetailPage({
        params: Promise.resolve({
          eventId: eventResult.chapterEventId,
        }),
      }),
    );
    const memberPointsHtml = renderToStaticMarkup(await MemberPointsPage({}));

    expect(memberHomeHtml).toContain("Chapter Leaderboard");
    expect(memberHomeHtml).toContain("My Points · Rush Month");
    expect(memberHomeHtml).toContain("Pilot Intro GBM");
    expect(memberHomeHtml).toContain("Leaderboard →");
    expect(memberEventsHtml).toContain("RSVP, attendance, and points all move together.");
    expect(memberEventsHtml).toContain("Pilot Intro GBM");
    expect(memberEventsHtml).toContain("RSVP&#x27;d");
    expect(memberEventDetailHtml).toContain("Pilot Intro GBM");
    expect(memberEventDetailHtml).toContain("Points awarded");
    expect(memberEventDetailHtml).toContain("Leaderboard view");
    expect(memberPointsHtml).toContain("Live pilot readback");
    expect(memberPointsHtml).toContain("Pilot Intro GBM");
    expect(memberPointsHtml).toContain("Points awarded");
    expect(memberPointsHtml).toContain("Chapter total: 20 pts");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    const { default: LeaderPage } = await import("@/app/leader/page");
    const leaderHtml = renderToStaticMarkup(await LeaderPage({}));

    expect(leaderHtml).toContain("Pilot Intro GBM");
    expect(leaderHtml).toContain("Attendance recorded");
    expect(leaderHtml).toContain("UCLA chapter calendar");
    expect(leaderHtml).toContain("Chapter Leadership Home");
    expect(leaderHtml).toContain("Quick Actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    const { default: StaffPage } = await import("@/app/staff/page");
    const staffPointsHtml = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "leaderboard",
        }),
      }),
    );
    const staffChaptersHtml = renderToStaticMarkup(await StaffPage({}));

    expect(staffPointsHtml).toContain(
      "Most recent attended event: Pilot Intro GBM",
    );
    expect(staffPointsHtml).toContain(
      "UCLA MEDLIFE currently shows 1 confirmed attendee(s) and 20 event point(s).",
    );
    expect(staffPointsHtml).toContain("Organization leaderboard");
    expect(staffChaptersHtml).toContain("UCLA chapter calendar");
  });
});

type MockAppState = {
  chapterEvents: ChapterEventRow[];
  lumaEventLinks: LumaEventLinkRow[];
  eventRows: EventRow[];
  integrationEventRows: IntegrationEventRow[];
  automationOutboxRows: AutomationOutboxRow[];
  auditLogRows: AuditLogRow[];
  pointsEventRows: PointsEventRow[];
};

function createMockAppState(
  input: Partial<MockAppState> = {},
): MockAppState {
  return {
    chapterEvents: input.chapterEvents ?? [],
    lumaEventLinks: input.lumaEventLinks ?? [],
    eventRows: input.eventRows ?? [],
    integrationEventRows: input.integrationEventRows ?? [],
    automationOutboxRows: input.automationOutboxRows ?? [],
    auditLogRows: input.auditLogRows ?? [],
    pointsEventRows: input.pointsEventRows ?? [],
  };
}

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

function createMockAppClient(state: MockAppState): SupabaseAppClient {
  let chapterEventCounter = state.chapterEvents.length;
  let lumaLinkCounter = state.lumaEventLinks.length;
  let eventCounter = state.eventRows.length;
  let integrationCounter = state.integrationEventRows.length;
  let outboxCounter = state.automationOutboxRows.length;
  let auditCounter = state.auditLogRows.length;

  return {
    persistence: {
      mode: "supabase",
      status: "ready",
      reason: "Mock app client.",
      isLocalOnly: false,
    },
    async selectRows<TRow>(
      tableName: string,
      options: SupabaseAppSelectOptions = {},
    ) {
      const query = options.query ?? {};

      switch (tableName) {
        case "luma_event_links":
          return filterByQuery(state.lumaEventLinks, query) as TRow[];
        case "chapter_events":
          return filterByQuery(state.chapterEvents, query) as TRow[];
        case "events":
          return filterByQuery(state.eventRows, query) as TRow[];
        case "points_events":
          return filterByQuery(state.pointsEventRows, query) as TRow[];
        default:
          return [];
      }
    },
    async insertRows<TRow>(tableName: string, rows: Record<string, unknown>[]) {
      switch (tableName) {
        case "chapter_events": {
          const inserted = rows.map((row) => ({
            luma_event_link_id: null,
            ...row,
            id: `chapter-event-${++chapterEventCounter}`,
            created_at: NOW,
            updated_at: NOW,
          })) as ChapterEventRow[];
          state.chapterEvents.push(...inserted);
          return inserted as TRow[];
        }
        case "luma_event_links": {
          const inserted = rows.map((row) => ({
            ...row,
            id: `luma-link-${++lumaLinkCounter}`,
            created_at: NOW,
            updated_at: NOW,
          })) as LumaEventLinkRow[];
          state.lumaEventLinks.push(...inserted);
          return inserted as TRow[];
        }
        case "events": {
          const inserted = rows.map((row) => ({
            ...row,
            id: `event-row-${++eventCounter}`,
            created_at: NOW,
          }));
          state.eventRows.push(...(inserted as EventRow[]));
          return inserted as TRow[];
        }
        case "integration_events": {
          const inserted = rows.map((row) => ({
            ...row,
            id: `integration-row-${++integrationCounter}`,
            created_at: NOW,
            updated_at: NOW,
          }));
          state.integrationEventRows.push(...(inserted as IntegrationEventRow[]));
          return inserted as TRow[];
        }
        case "automation_outbox": {
          const inserted = rows.map((row) => ({
            ...row,
            id: `outbox-row-${++outboxCounter}`,
            attempt_count: 0,
            available_at: NOW,
            locked_at: null,
            sent_at: null,
            last_error: null,
            created_at: NOW,
            updated_at: NOW,
          }));
          state.automationOutboxRows.push(...(inserted as AutomationOutboxRow[]));
          return inserted as TRow[];
        }
        case "audit_logs": {
          const inserted = rows.map((row) => ({
            ...row,
            id: `audit-log-${++auditCounter}`,
            created_at: NOW,
          }));
          state.auditLogRows.push(...(inserted as AuditLogRow[]));
          return inserted as TRow[];
        }
        case "points_events": {
          const inserted = rows.map((row, index) => ({
            ...row,
            id: `points-row-${state.pointsEventRows.length + index + 1}`,
            created_at: NOW,
          }));
          state.pointsEventRows.push(...(inserted as PointsEventRow[]));
          return inserted as TRow[];
        }
        default:
          return [] as TRow[];
      }
    },
    async upsertRows<TRow>() {
      return [] as TRow[];
    },
    async updateRows<TRow>(
      tableName: string,
      values: Record<string, unknown>,
      options: SupabaseAppMutateOptions,
    ) {
      const query = options.query ?? {};
      const idFilter = String(query.id ?? "").replace("eq.", "");

      if (tableName === "chapter_events") {
        state.chapterEvents = state.chapterEvents.map((row) =>
          row.id === idFilter ? { ...row, ...values, updated_at: NOW } : row,
        );
        return state.chapterEvents.filter((row) => row.id === idFilter) as TRow[];
      }

      if (tableName === "luma_event_links") {
        state.lumaEventLinks = state.lumaEventLinks.map((row) =>
          row.id === idFilter ? { ...row, ...values, updated_at: NOW } : row,
        );
        return state.lumaEventLinks.filter((row) => row.id === idFilter) as TRow[];
      }

      return [] as TRow[];
    },
  };
}

function filterByQuery<T extends Record<string, unknown>>(
  rows: T[],
  query: Record<string, string>,
): T[] {
  return rows.filter((row) =>
    Object.entries(query).every(([key, value]) => {
      if (!value.startsWith("eq.")) {
        return true;
      }

      return String(row[key] ?? "") === value.slice(3);
    }),
  );
}

function createSupabaseReadData(
  input: {
    profiles?: ProfileRow[];
  } = {},
): ReadOnlyAppData {
  const mock = getMockReadOnlyAppData("Supabase-backed staging test data.");

  return {
    ...mock,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "Supabase-backed staging test data.",
    },
    profiles: input.profiles ?? [],
  };
}

function createProfile(id: string, email: string): ProfileRow {
  return {
    id,
    display_name: email.split("@")[0] ?? "Member",
    email,
    status: "active",
    created_at: NOW,
    updated_at: NOW,
  };
}

function createLumaEventLinkRow(
  data: ReadOnlyAppData,
  input: {
    id: string;
    chapter_event_id: string;
    luma_event_id: string;
  },
): LumaEventLinkRow {
  return {
    id: input.id,
    chapter_id: data.chapter.id,
    campaign_id: data.campaign.id,
    phase_id: null,
    chapter_event_id: input.chapter_event_id,
    luma_event_id: input.luma_event_id,
    luma_event_url: "https://lu.ma/example",
    status: "linked",
    linked_by: "00000000-0000-4000-8000-000000000009",
    linked_at: NOW,
    last_imported_at: null,
    created_at: NOW,
    updated_at: NOW,
  };
}

function createChapterEventRow(
  data: ReadOnlyAppData,
  input: {
    id: string;
    title: string;
    status: ChapterEventRow["status"];
    luma_event_link_id: string | null;
  },
): ChapterEventRow {
  return {
    id: input.id,
    chapter_id: data.chapter.id,
    campaign_id: data.campaign.id,
    phase_id: null,
    action_committee_id: null,
    assignment_id: null,
    title: input.title,
    event_type: "luma_event",
    status: input.status,
    planned_by_user_id: "00000000-0000-4000-8000-000000000009",
    owner_user_id: "00000000-0000-4000-8000-000000000009",
    starts_at: NOW,
    ends_at: null,
    promotion_summary: "Pilot event",
    attendance_count: 0,
    eligible_member_count: null,
    attendance_rate: null,
    nps_score: null,
    feedback_summary: null,
    warehouse_status: "disabled",
    luma_event_link_id: input.luma_event_link_id,
    created_at: NOW,
    updated_at: NOW,
  };
}

function createEventRowBase(
  input: {
    id: string;
    event_type: string;
    actor_user_id: string;
    chapter_id: string;
    campaign_id: string;
    chapter_event_id: string | null;
    payload: JsonValue;
  },
): EventRow {
  return {
    id: input.id,
    event_type: input.event_type,
    actor_user_id: input.actor_user_id,
    chapter_id: input.chapter_id,
    campaign_id: input.campaign_id,
    assignment_id: null,
    chapter_event_id: input.chapter_event_id,
    payload: input.payload,
    correlation_id: `correlation:${input.id}`,
    occurred_at: NOW,
    created_at: NOW,
  };
}
