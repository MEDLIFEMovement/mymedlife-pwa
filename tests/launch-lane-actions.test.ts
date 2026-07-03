import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";
import type { ChapterEventRow, LumaEventLinkRow } from "@/shared/types/persistence";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
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

vi.mock("@/services/luma-live-pilot", () => ({
  createOrUpdateLumaEvent: vi.fn(),
  writeLumaRsvp: vi.fn(),
  importLumaAttendance: vi.fn(),
}));

vi.mock("@/services/luma-live-pilot-persistence", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/services/luma-live-pilot-persistence")
  >();

  return {
    ...actual,
    getLumaPilotPersistenceReadiness: vi.fn(),
    persistLumaEventUpsertProof: vi.fn(),
    persistLumaRsvpProof: vi.fn(),
    persistLumaAttendanceImportProof: vi.fn(),
  };
});

describe("launch lane actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks member RSVP writes for non-member actors", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const { runLaunchLaneMemberRsvpAction } = await import("@/app/launch-lane/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const formData = new FormData();
    formData.set("returnTo", "/app");
    formData.set("chapterEventId", "chapter-event-ucla-kickoff");

    await expect(runLaunchLaneMemberRsvpAction(formData)).rejects.toThrow(
      /redirect:\/app\?lumaResult=error/,
    );
  });

  it("runs the leader event upsert and records proof when readiness is green", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLaunchLaneLeaderEventUpsertAction } = await import(
      "@/app/launch-lane/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      withLinkedChapterEvent(getMockReadOnlyAppData("Testing leader event upsert."), {
        event: {
          id: "chapter-event-ucla-live",
          chapter_id: "chapter-northview",
          title: "Rush Month kickoff social",
          luma_event_link_id: "luma-link-ucla-live",
        },
        link: {
          id: "luma-link-ucla-live",
          chapter_id: "chapter-northview",
          chapter_event_id: "chapter-event-ucla-live",
          luma_event_id: "evt-live",
        },
      }),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });
    vi.mocked(lumaModule.createOrUpdateLumaEvent).mockResolvedValue({
      ok: true,
      operation: "event_update",
      status: "executed",
      safeMessage: "Luma event updated.",
      externalWrites: 1,
      externalReads: 0,
      eventId: "evt-live",
      eventUrl: "https://lu.ma/evt-live",
      attendanceRows: [],
      secretsReturned: false,
    });

    const formData = new FormData();
    formData.set("returnTo", "/leader?view=events");
    formData.set("chapterEventId", "chapter-event-ucla-live");

    await expect(runLaunchLaneLeaderEventUpsertAction(formData)).rejects.toThrow(
      /redirect:\/leader\?view=events&lumaResult=success/,
    );
    expect(vi.mocked(lumaModule.createOrUpdateLumaEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(lumaModule.createOrUpdateLumaEvent)).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-live",
        chapterId: "chapter-northview",
        chapterName: "UCLA MEDLIFE",
        name: "Rush Month kickoff social",
        timezone: "America/Los_Angeles",
      }),
    );
    expect(
      vi.mocked(persistenceModule.persistLumaEventUpsertProof),
    ).toHaveBeenCalledTimes(1);
  });

  it("uses the chapter timezone when an admin reviewer updates a Boston event", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLaunchLaneLeaderEventUpsertAction } = await import(
      "@/app/launch-lane/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      withLinkedChapterEvent(getMockReadOnlyAppData("Testing Boston event upsert."), {
        event: {
          id: "chapter-event-boston-live",
          chapter_id: "chapter-boston",
          title: "Boston kickoff info night",
          luma_event_link_id: "luma-link-boston-live",
        },
        link: {
          id: "luma-link-boston-live",
          chapter_id: "chapter-boston",
          chapter_event_id: "chapter-event-boston-live",
          luma_event_id: "evt-boston-live",
        },
      }),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });
    vi.mocked(lumaModule.createOrUpdateLumaEvent).mockResolvedValue({
      ok: true,
      operation: "event_update",
      status: "executed",
      safeMessage: "Luma event updated.",
      externalWrites: 1,
      externalReads: 0,
      eventId: "evt-boston-live",
      eventUrl: "https://lu.ma/evt-boston-live",
      attendanceRows: [],
      secretsReturned: false,
    });

    const formData = new FormData();
    formData.set("returnTo", "/leader?view=events");
    formData.set("chapterEventId", "chapter-event-boston-live");

    await expect(runLaunchLaneLeaderEventUpsertAction(formData)).rejects.toThrow(
      /redirect:\/leader\?view=events&lumaResult=success/,
    );
    expect(vi.mocked(lumaModule.createOrUpdateLumaEvent)).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-boston-live",
        chapterId: "chapter-boston",
        chapterName: "Boston College MEDLIFE",
        timezone: "America/New_York",
      }),
    );
  });

  it("blocks a leader from updating a Luma event that belongs to a different chapter", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLaunchLaneLeaderEventUpsertAction } = await import(
      "@/app/launch-lane/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      withLinkedChapterEvent(getMockReadOnlyAppData("Testing cross-chapter event block."), {
        event: {
          id: "chapter-event-lakeside-live",
          chapter_id: "chapter-lakeside",
          title: "Lakeside live event",
          luma_event_link_id: "luma-link-lakeside-live",
        },
        link: {
          id: "luma-link-lakeside-live",
          chapter_id: "chapter-lakeside",
          chapter_event_id: "chapter-event-lakeside-live",
          luma_event_id: "evt-lakeside-live",
        },
      }),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const formData = new FormData();
    formData.set("returnTo", "/leader?view=events");
    formData.set("chapterEventId", "chapter-event-lakeside-live");

    await expect(runLaunchLaneLeaderEventUpsertAction(formData)).rejects.toThrow(
      /redirect:\/leader\?view=events&lumaResult=error.*cannot\+manage\+the\+event\+loop\+for\+that\+chapter/,
    );
    expect(vi.mocked(lumaModule.createOrUpdateLumaEvent)).not.toHaveBeenCalled();
  });

  it("short-circuits a duplicate member RSVP before the external Luma write", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLaunchLaneMemberRsvpAction } = await import("@/app/launch-lane/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing duplicate member RSVP."),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const formData = new FormData();
    formData.set("returnTo", "/app");
    formData.set("chapterEventId", "chapter-event-ucla-kickoff");

    await expect(runLaunchLaneMemberRsvpAction(formData)).rejects.toThrow(
      /redirect:\/app\?lumaResult=success/,
    );
    expect(vi.mocked(lumaModule.writeLumaRsvp)).not.toHaveBeenCalled();
    expect(vi.mocked(persistenceModule.persistLumaRsvpProof)).not.toHaveBeenCalled();
  });

  it("reports attendance confirmation and points awarded after a successful import", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLaunchLaneAttendanceImportAction } = await import(
      "@/app/launch-lane/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      withLinkedChapterEvent(getMockReadOnlyAppData("Testing attendance import."), {
        event: {
          id: "chapter-event-ucla-live",
          chapter_id: "chapter-northview",
          title: "Rush Month kickoff social",
          luma_event_link_id: "luma-link-ucla-live",
        },
        link: {
          id: "luma-link-ucla-live",
          chapter_id: "chapter-northview",
          chapter_event_id: "chapter-event-ucla-live",
          luma_event_id: "evt-live",
        },
      }),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });
    vi.mocked(lumaModule.importLumaAttendance).mockImplementation(
      async (_input, options) => {
        options?.onImportedRows?.([
          {
            guestId: "guest-1",
            email: "member.a@mymedlife.test",
            name: "Member A",
            approvalStatus: "approved",
            checkedInAt: "2026-07-20T18:15:00Z",
            attended: true,
          },
        ]);

        return {
          ok: true,
          operation: "attendance_import",
          status: "executed",
          safeMessage: "Imported 1 approved Luma guest row; 1 row includes check-in attendance.",
          externalWrites: 0,
          externalReads: 1,
          eventId: "evt-live",
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        };
      },
    );
    vi.mocked(persistenceModule.persistLumaAttendanceImportProof).mockResolvedValue({
      chapterEventId: "chapter-event-1",
      lumaEventLinkId: "link-1",
      eventId: "evt-live",
      auditLogId: "audit-1",
      pointsCreated: 1,
      attendanceCount: 1,
      rsvpRecorded: false,
    });

    const formData = new FormData();
    formData.set("returnTo", "/leader?view=attendance");
    formData.set("chapterEventId", "chapter-event-ucla-live");
    formData.set("limit", "25");

    await expect(runLaunchLaneAttendanceImportAction(formData)).rejects.toThrow(
      /redirect:\/leader\?view=attendance&lumaResult=success.*1\+attendee%28s%29\+confirmed\+and\+1\+point\+award%28s%29\+recorded\./,
    );
    expect(vi.mocked(lumaModule.importLumaAttendance)).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-live",
        limit: 25,
      }),
      expect.any(Object),
    );
  });

  it("blocks a member from posting an RSVP into another chapter's linked event", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLaunchLaneMemberRsvpAction } = await import("@/app/launch-lane/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      withLinkedChapterEvent(getMockReadOnlyAppData("Testing cross-chapter RSVP block."), {
        event: {
          id: "chapter-event-lakeside-live",
          chapter_id: "chapter-lakeside",
          title: "Lakeside live event",
          luma_event_link_id: "luma-link-lakeside-live",
        },
        link: {
          id: "luma-link-lakeside-live",
          chapter_id: "chapter-lakeside",
          chapter_event_id: "chapter-event-lakeside-live",
          luma_event_id: "evt-lakeside-live",
        },
      }),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const formData = new FormData();
    formData.set("returnTo", "/app");
    formData.set("chapterEventId", "chapter-event-lakeside-live");

    await expect(runLaunchLaneMemberRsvpAction(formData)).rejects.toThrow(
      /redirect:\/app\?lumaResult=error.*another\+chapter/,
    );
    expect(vi.mocked(lumaModule.writeLumaRsvp)).not.toHaveBeenCalled();
  });
});

function withLinkedChapterEvent(
  data: ReadOnlyAppData,
  input: {
    event: Pick<ChapterEventRow, "id" | "chapter_id" | "title" | "luma_event_link_id">;
    link: Pick<LumaEventLinkRow, "id" | "chapter_id" | "chapter_event_id" | "luma_event_id">;
  },
): ReadOnlyAppData {
  const baseEvent = data.allChapterEventRows[0]!;
  const baseLink = data.allLumaEventLinkRows[0]!;
  const chapterEvent: ChapterEventRow = {
    ...baseEvent,
    id: input.event.id,
    chapter_id: input.event.chapter_id,
    title: input.event.title,
    luma_event_link_id: input.event.luma_event_link_id,
  };
  const link: LumaEventLinkRow = {
    ...baseLink,
    id: input.link.id,
    chapter_id: input.link.chapter_id,
    chapter_event_id: input.link.chapter_event_id,
    luma_event_id: input.link.luma_event_id,
  };

  return {
    ...data,
    allChapterEventRows: [...data.allChapterEventRows, chapterEvent],
    allLumaEventLinkRows: [...data.allLumaEventLinkRows, link],
  };
}
