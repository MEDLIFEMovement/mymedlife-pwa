import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  createLocalSupabaseServerClient: vi.fn(),
  getAuthSessionState: vi.fn(),
  getMemberEventLoopWriteConfig: vi.fn(),
  createMemberEventLoopWriteClient: vi.fn(),
  recordMemberEventLoopStepAtomically: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: mocks.createLocalSupabaseServerClient,
}));

vi.mock("@/services/auth-session", () => ({
  getAuthSessionState: mocks.getAuthSessionState,
}));

vi.mock("@/services/member-event-loop-write", () => ({
  createMemberEventLoopWriteClient: mocks.createMemberEventLoopWriteClient,
  getMemberEventLoopWriteConfig: mocks.getMemberEventLoopWriteConfig,
  memberEventLoopWriteResultParam: "memberEventLoopWriteResult",
  recordMemberEventLoopStepAtomically: mocks.recordMemberEventLoopStepAtomically,
}));

import {
  submitMemberEventCheckInAction,
  submitMemberEventLoopStepForSupabase,
  submitMemberEventRsvpAction,
} from "@/app/app/events/[eventId]/actions";

describe("member event-loop server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a blocked write result before touching auth when the write gate is disabled", async () => {
    mocks.getMemberEventLoopWriteConfig.mockReturnValue({
      enabled: false,
      environment: "production",
      externalWritesEnabled: false,
      reason: "Writes disabled for test.",
    });

    const result = await submitMemberEventLoopStepForSupabase("rsvp", formData({ eventId: "event-1" }));

    expect(result).toMatchObject({
      success: false,
      code: "write_disabled",
      eventId: "event-1",
      externalWritesEnabled: false,
      plainEnglishMessage: "Writes disabled for test.",
    });
    expect(mocks.createLocalSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns missing_auth when the session client is unavailable", async () => {
    enableWriteGate();
    mocks.createLocalSupabaseServerClient.mockResolvedValue({
      client: null,
      config: { reason: "Auth client unavailable." },
    });

    const result = await submitMemberEventLoopStepForSupabase("checkin", formData({ eventId: "event-2" }));

    expect(result).toMatchObject({
      success: false,
      code: "missing_auth",
      eventId: "event-2",
      plainEnglishMessage: "Auth client unavailable.",
    });
    expect(mocks.getAuthSessionState).not.toHaveBeenCalled();
  });

  it("returns missing_auth when the user is not signed in", async () => {
    enableWriteGate();
    const sessionClient = { auth: "client" };
    const authConfig = { reason: "auth ok" };
    mocks.createLocalSupabaseServerClient.mockResolvedValue({
      client: sessionClient,
      config: authConfig,
    });
    mocks.getAuthSessionState.mockResolvedValue({ status: "signed_out", user: null });

    const result = await submitMemberEventLoopStepForSupabase("rsvp", formData({ eventId: "event-3" }));

    expect(result).toMatchObject({
      success: false,
      code: "missing_auth",
      eventId: "event-3",
    });
    expect(mocks.getAuthSessionState).toHaveBeenCalledWith(sessionClient, authConfig);
  });

  it("returns write_disabled when the server-only service client is not configured", async () => {
    enableWriteGate();
    mocks.createLocalSupabaseServerClient.mockResolvedValue({
      client: { auth: "client" },
      config: { reason: "auth ok" },
    });
    mocks.getAuthSessionState.mockResolvedValue({
      status: "signed_in",
      user: { id: "user-1", email: "member.a@mymedlife.test" },
    });
    mocks.createMemberEventLoopWriteClient.mockReturnValue(null);

    const result = await submitMemberEventLoopStepForSupabase("checkin", formData({ eventId: "event-4" }));

    expect(result).toMatchObject({
      success: false,
      code: "write_disabled",
      eventId: "event-4",
      plainEnglishMessage: "The server-only member event-loop write client is not configured.",
    });
  });

  it("delegates signed-in writes to the server-only event-loop service", async () => {
    enableWriteGate();
    const serviceClient = { service: "client" };
    mocks.createLocalSupabaseServerClient.mockResolvedValue({
      client: { auth: "client" },
      config: { reason: "auth ok" },
    });
    mocks.getAuthSessionState.mockResolvedValue({
      status: "signed_in",
      user: { id: "user-1", email: "member.a@mymedlife.test" },
    });
    mocks.createMemberEventLoopWriteClient.mockReturnValue(serviceClient);
    mocks.recordMemberEventLoopStepAtomically.mockResolvedValue({
      success: true,
      code: "checked_in",
      eventId: "materialized-event",
      pointsAwarded: 20,
      attendanceCount: 1,
      externalWritesEnabled: false,
      plainEnglishMessage: "Checked in.",
    });

    const result = await submitMemberEventLoopStepForSupabase(
      "checkin",
      formData({ eventId: "chapter-event-ucla-kickoff" }),
    );

    expect(result).toMatchObject({ success: true, code: "checked_in" });
    expect(mocks.recordMemberEventLoopStepAtomically).toHaveBeenCalledWith(serviceClient, {
      operation: "checkin",
      routeEventId: "chapter-event-ucla-kickoff",
      actorUserId: "user-1",
      actorEmail: "member.a@mymedlife.test",
    });
  });

  it("redirects RSVP submissions with stories source context preserved", async () => {
    enableSuccessfulActionResult("rsvp_recorded", "chapter-event-ucla-kickoff");

    await expect(
      submitMemberEventRsvpAction(
        formData({
          eventId: "chapter-event-ucla-kickoff",
          source: "stories",
          campaign: "fall-2026",
          storyFilter: "featured",
          story: "story-1",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:");

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/app/events/chapter-event-ucla-kickoff?source=stories&step=rsvp&campaign=fall-2026&storyFilter=featured&story=story-1&memberEventLoopWriteResult=rsvp_recorded",
    );
  });

  it("redirects check-in submissions to points with profile return context preserved", async () => {
    enableSuccessfulActionResult("checked_in", "event-from-service");

    await expect(
      submitMemberEventCheckInAction(
        formData({
          eventId: "chapter-event-ucla-kickoff",
          source: "profile",
          profileSource: "points",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:");

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/app/events/event-from-service?source=profile&step=points&profileSource=points&memberEventLoopWriteResult=checked_in",
    );
  });
});

function enableWriteGate() {
  mocks.getMemberEventLoopWriteConfig.mockReturnValue({
    enabled: true,
    environment: "production",
    externalWritesEnabled: false,
    reason: "writes enabled",
  });
}

function enableSuccessfulActionResult(code: string, eventId: string) {
  enableWriteGate();
  mocks.createLocalSupabaseServerClient.mockResolvedValue({
    client: { auth: "client" },
    config: { reason: "auth ok" },
  });
  mocks.getAuthSessionState.mockResolvedValue({
    status: "signed_in",
    user: { id: "user-1", email: "member.a@mymedlife.test" },
  });
  mocks.createMemberEventLoopWriteClient.mockReturnValue({ service: "client" });
  mocks.recordMemberEventLoopStepAtomically.mockResolvedValue({
    success: true,
    code,
    eventId,
    pointsAwarded: code === "checked_in" ? 20 : 0,
    attendanceCount: code === "checked_in" ? 1 : 0,
    externalWritesEnabled: false,
    plainEnglishMessage: "Recorded.",
  });
}

function formData(values: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}
