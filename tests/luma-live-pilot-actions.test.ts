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

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: vi.fn(),
}));

vi.mock("@/services/auth-session", () => ({
  getAuthSessionState: vi.fn(),
}));

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

describe("Luma live pilot actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks event create/update before the external call when proof rows are not ready", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLumaEventUpsertAction } = await import(
      "@/app/admin/luma-live-pilot/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: false,
      message:
        "A signed-in Supabase reviewer session is required before myMEDLIFE can run Luma staging writes or imports, because the proof rows must be recorded at the same time.",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterId", "chapter-northview");
    formData.set("name", "Staging Event");
    formData.set("startAt", "2026-07-20T23:00:00.000Z");

    await expect(runLumaEventUpsertAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=error/,
    );
    expect(vi.mocked(lumaModule.createOrUpdateLumaEvent)).not.toHaveBeenCalled();
    expect(
      vi.mocked(persistenceModule.persistLumaEventUpsertProof),
    ).not.toHaveBeenCalled();
  });

  it("blocks chapter mapping saves before any Supabase RPC when required fields are missing", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const clientModule = await import("@/lib/supabase-server");
    const { saveChapterLumaCalendarAction } = await import(
      "@/app/admin/luma-live-pilot/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing blocked chapter calendar save."),
    );

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterId", "chapter-northview");
    formData.set("reason", "Save this mapping.");

    await expect(saveChapterLumaCalendarAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=error/,
    );
    expect(
      vi.mocked(clientModule.createLocalSupabaseServerClient),
    ).not.toHaveBeenCalled();
  });

  it("saves a chapter Luma calendar mapping through the DS/Admin Supabase session", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const clientModule = await import("@/lib/supabase-server");
    const authModule = await import("@/services/auth-session");
    const { saveChapterLumaCalendarAction } = await import(
      "@/app/admin/luma-live-pilot/actions"
    );

    const rpc = vi.fn(async () => ({
      data: [
        {
          calendar_mapping_id: "chapter-luma-1",
          audit_log_id: "audit-1",
          chapter_id: "chapter-northview",
          environment: "staging",
          calendar_label: "UCLA chapter calendar",
          status: "linked",
          updated_at: new Date().toISOString(),
        },
      ],
      error: null,
    }));

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter calendar save."),
    );
    vi.mocked(clientModule.createLocalSupabaseServerClient).mockResolvedValue({
      config: {
        enabled: true,
        mode: "staging_supabase",
        reviewEnvironment: "staging",
        url: "https://example.supabase.co",
        anonKey: "anon",
        isLocalOnly: false,
        reason: "Hosted staging Supabase Auth is enabled.",
      },
      client: {
        schema: () => ({
          rpc,
        }),
      } as never,
    });
    vi.mocked(authModule.getAuthSessionState).mockResolvedValue({
      status: "signed_in",
      isLocalOnly: false,
      message: "Hosted staging Supabase Auth session is active.",
      user: {
        id: "00000000-0000-4000-8000-000000000005",
        email: "ds.admin@mymedlife.test",
        displayName: "Dee Systems",
      },
    });

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterId", "chapter-northview");
    formData.set("environment", "staging");
    formData.set("calendarId", "cal-ucla-1234");
    formData.set("calendarLabel", "UCLA chapter calendar");
    formData.set("reason", "Save UCLA for the staging event loop.");
    formData.set("notes", "Saved in app for staging review.");
    formData.set("isDefault", "on");

    await expect(saveChapterLumaCalendarAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=success/,
    );
    expect(rpc).toHaveBeenCalledWith("set_chapter_luma_calendar", {
      chapter_id_input: "chapter-northview",
      environment_input: "staging",
      calendar_id_input: "cal-ucla-1234",
      calendar_label_input: "UCLA chapter calendar",
      status_input: "linked",
      is_default_input: true,
      notes_input: "Saved in app for staging review.",
      reason_input: "Save UCLA for the staging event loop.",
      confirmation_input: null,
    });
  });

  it("blocks production chapter mapping saves until the reviewer types the explicit confirmation", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const clientModule = await import("@/lib/supabase-server");
    const { saveChapterLumaCalendarAction } = await import(
      "@/app/admin/luma-live-pilot/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing production confirmation block for chapter calendar save."),
    );

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterId", "chapter-northview");
    formData.set("environment", "production");
    formData.set("calendarId", "cal-prod-1234");
    formData.set("calendarLabel", "UCLA production calendar");
    formData.set("reason", "Save the approved production chapter calendar mapping.");

    await expect(saveChapterLumaCalendarAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=error/,
    );
    expect(
      vi.mocked(clientModule.createLocalSupabaseServerClient),
    ).not.toHaveBeenCalled();
  });

  it("requires a signed-in Supabase reviewer session before saving a chapter mapping", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const clientModule = await import("@/lib/supabase-server");
    const authModule = await import("@/services/auth-session");
    const { saveChapterLumaCalendarAction } = await import(
      "@/app/admin/luma-live-pilot/actions"
    );

    const rpc = vi.fn();

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing signed-out chapter calendar save block."),
    );
    vi.mocked(clientModule.createLocalSupabaseServerClient).mockResolvedValue({
      config: {
        enabled: true,
        mode: "staging_supabase",
        reviewEnvironment: "staging",
        url: "https://example.supabase.co",
        anonKey: "anon",
        isLocalOnly: false,
        reason: "Hosted staging Supabase Auth is enabled.",
      },
      client: {
        schema: () => ({
          rpc,
        }),
      } as never,
    });
    vi.mocked(authModule.getAuthSessionState).mockResolvedValue({
      status: "signed_out",
      isLocalOnly: false,
      message: "No hosted reviewer session is active.",
      user: null,
    });

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterId", "chapter-northview");
    formData.set("environment", "staging");
    formData.set("calendarId", "cal-ucla-1234");
    formData.set("calendarLabel", "UCLA chapter calendar");
    formData.set("reason", "Save UCLA for the staging event loop.");

    await expect(saveChapterLumaCalendarAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=error/,
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it("blocks RSVP writeback before the external call when proof rows are not ready", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLumaRsvpWriteAction } = await import("@/app/admin/luma-live-pilot/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: false,
      message: "Luma staging writes and imports stay blocked until the app is reading Supabase-backed data instead of mock fallback.",
      usesHostedReviewerSession: true,
      dataSource: "mock",
    });

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterEventId", "chapter-event-ucla-kickoff");
    formData.set("email", "member.a@mymedlife.test");

    await expect(runLumaRsvpWriteAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=error/,
    );
    expect(vi.mocked(lumaModule.writeLumaRsvp)).not.toHaveBeenCalled();
    expect(vi.mocked(persistenceModule.persistLumaRsvpProof)).not.toHaveBeenCalled();
  });

  it("blocks attendance import before the external read when proof rows are not ready", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLumaAttendanceImportAction } = await import(
      "@/app/admin/luma-live-pilot/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: false,
      message:
        "A signed-in Supabase reviewer session is required before myMEDLIFE can run Luma staging writes or imports, because the proof rows must be recorded at the same time.",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterEventId", "chapter-event-ucla-kickoff");
    formData.set("limit", "25");

    await expect(runLumaAttendanceImportAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=error/,
    );
    expect(vi.mocked(lumaModule.importLumaAttendance)).not.toHaveBeenCalled();
    expect(
      vi.mocked(persistenceModule.persistLumaAttendanceImportProof),
    ).not.toHaveBeenCalled();
  });

  it("runs the event path and records proof when readiness is green", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLumaEventUpsertAction } = await import(
      "@/app/admin/luma-live-pilot/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin Luma event path."),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Hosted reviewer session and Supabase-backed data are both ready for proof capture.",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });
    vi.mocked(lumaModule.createOrUpdateLumaEvent).mockResolvedValue({
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
    });

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterId", "chapter-northview");
    formData.set("name", "Pilot Event");
    formData.set("startAt", "2026-07-20T23:00:00.000Z");
    formData.set("timezone", "America/Los_Angeles");

    await expect(runLumaEventUpsertAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=success/,
    );
    expect(vi.mocked(lumaModule.createOrUpdateLumaEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(lumaModule.createOrUpdateLumaEvent)).toHaveBeenCalledWith(
      expect.objectContaining({
        chapterId: "chapter-northview",
        name: "Pilot Event",
      }),
    );
    expect(
      vi.mocked(persistenceModule.persistLumaEventUpsertProof),
    ).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(persistenceModule.persistLumaEventUpsertProof),
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          chapterId: "chapter-northview",
          chapterName: "UCLA MEDLIFE",
        }),
      }),
    );
  });

  it("reports attendance confirmation and points awarded after a successful admin import", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLumaAttendanceImportAction } = await import(
      "@/app/admin/luma-live-pilot/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      withLinkedChapterEvent(getMockReadOnlyAppData("Testing admin attendance import."), {
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
      message: "Hosted reviewer session and Supabase-backed data are both ready for proof capture.",
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
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterEventId", "chapter-event-ucla-live");
    formData.set("limit", "25");

    await expect(runLumaAttendanceImportAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=success.*1\+attendee%28s%29\+confirmed\+and\+1\+point\+award%28s%29\+recorded\./,
    );
    expect(vi.mocked(lumaModule.importLumaAttendance)).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-live",
      }),
      expect.any(Object),
    );
  });

  it("blocks an admin event update when the chosen chapter does not match the linked Luma event", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLumaEventUpsertAction } = await import(
      "@/app/admin/luma-live-pilot/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      withLinkedChapterEvent(getMockReadOnlyAppData("Testing admin cross-chapter update block."), {
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
      message: "Hosted reviewer session and Supabase-backed data are both ready for proof capture.",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterId", "chapter-northview");
    formData.set("eventId", "evt-lakeside-live");
    formData.set("name", "Tampered event");
    formData.set("startAt", "2026-07-20T23:00:00.000Z");

    await expect(runLumaEventUpsertAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=error.*different\+chapter/,
    );
    expect(vi.mocked(lumaModule.createOrUpdateLumaEvent)).not.toHaveBeenCalled();
  });

  it("blocks an admin RSVP write when the event is not mapped to a chapter event", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const { runLumaRsvpWriteAction } = await import("@/app/admin/luma-live-pilot/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing unmapped admin RSVP."),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Hosted reviewer session and Supabase-backed data are both ready for proof capture.",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const formData = new FormData();
    formData.set("returnTo", "/admin/luma-live-pilot");
    formData.set("chapterEventId", "chapter-event-unmapped");
    formData.set("email", "member.a@mymedlife.test");

    await expect(runLumaRsvpWriteAction(formData)).rejects.toThrow(
      /redirect:\/admin\/luma-live-pilot\?lumaResult=error.*mapped\+chapter\+event/,
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
