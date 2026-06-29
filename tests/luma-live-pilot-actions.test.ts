import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/luma-live-pilot", () => ({
  createOrUpdateLumaEvent: vi.fn(),
  writeLumaRsvp: vi.fn(),
  importLumaAttendance: vi.fn(),
}));

vi.mock("@/services/luma-live-pilot-persistence", () => ({
  persistLumaEventUpsertProof: vi.fn(),
  persistLumaRsvpProof: vi.fn(),
  persistLumaAttendanceImportProof: vi.fn(),
}));

describe("luma live pilot server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks non-DS users from staging Luma controls before any external call runs", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const lumaModule = await import("@/services/luma-live-pilot");
    const navigationModule = await import("next/navigation");
    const { runLumaEventUpsertAction } = await import("@/app/admin/luma-live-pilot/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );

    await expect(
      runLumaEventUpsertAction(
        formDataFor({
          returnTo: "/admin/luma-live-pilot",
          name: "Blocked coach event",
          startAt: "2026-07-20T23:00:00.000Z",
          timezone: "America/Los_Angeles",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/luma-live-pilot?");

    expect(vi.mocked(lumaModule.createOrUpdateLumaEvent)).not.toHaveBeenCalled();
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("Only+DS+Admin+or+Super+Admin+can+run+the+staging+Luma+pilot"),
    );
  });

  it("records pending-verification RSVP proof and keeps the warning redirect path", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const navigationModule = await import("next/navigation");
    const { runLumaRsvpWriteAction } = await import("@/app/admin/luma-live-pilot/actions");

    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(actor);
    vi.mocked(lumaModule.writeLumaRsvp).mockResolvedValue({
      ok: false,
      operation: "rsvp_write",
      status: "pending_verification",
      safeMessage:
        "Luma accepted the RSVP request, but the approved guest list has not settled yet.",
      externalWrites: 1,
      externalReads: 3,
      eventId: "evt-existing",
      eventUrl: null,
      attendanceRows: [],
      secretsReturned: false,
    });

    await expect(
      runLumaRsvpWriteAction(
        formDataFor({
          returnTo: "/admin/luma-live-pilot",
          eventId: "evt-existing",
          email: "member.a@mymedlife.test",
          name: "Member A",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/luma-live-pilot?");

    expect(vi.mocked(persistenceModule.persistLumaRsvpProof)).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        request: {
          eventId: "evt-existing",
          email: "member.a@mymedlife.test",
          name: "Member A",
        },
        result: expect.objectContaining({
          status: "pending_verification",
          eventId: "evt-existing",
        }),
      }),
    );
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("lumaResult=warning"),
    );
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("Staging+proof+recorded"),
    );
  });

  it("persists imported attendance rows on a successful staging import", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    const navigationModule = await import("next/navigation");
    const { runLumaAttendanceImportAction } = await import("@/app/admin/luma-live-pilot/actions");

    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(actor);
    vi.mocked(lumaModule.importLumaAttendance).mockImplementation(async (_input, options) => {
      options?.onImportedRows?.([
        {
          guestId: "guest-1",
          email: "member.a@mymedlife.test",
          name: "Member A",
          approvalStatus: "approved",
          checkedInAt: "2026-07-20T23:30:00.000Z",
          attended: true,
        },
      ]);

      return {
        ok: true,
        operation: "attendance_import",
        status: "executed",
        safeMessage: "Imported 1 attendance row from Luma.",
        externalWrites: 0,
        externalReads: 1,
        eventId: "evt-existing",
        eventUrl: null,
        attendanceRows: [
          {
            guestId: "guest-1",
            emailHint: "me***@mymedlife.test",
            name: "Member A",
            approvalStatus: "approved",
            checkedInAt: "2026-07-20T23:30:00.000Z",
            attended: true,
          },
        ],
        secretsReturned: false,
      };
    });

    await expect(
      runLumaAttendanceImportAction(
        formDataFor({
          returnTo: "/admin/luma-live-pilot",
          eventId: "evt-existing",
          limit: "25",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/luma-live-pilot?");

    expect(
      vi.mocked(persistenceModule.persistLumaAttendanceImportProof),
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        eventId: "evt-existing",
        attendanceRows: [
          expect.objectContaining({
            guestId: "guest-1",
            email: "member.a@mymedlife.test",
            attended: true,
          }),
        ],
      }),
    );
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("No+secrets+returned"),
    );
  });
});

function formDataFor(entries: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }

  return formData;
}
