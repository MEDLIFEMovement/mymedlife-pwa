import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  LeaderEventCreateInput,
  LeaderEventCreateResult,
} from "@/services/leader-event-create-write";

const mocks = vi.hoisted(() => ({
  createLeaderEventForSupabase: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/services/leader-event-create-write", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/services/leader-event-create-write")>();

  return {
    ...original,
    createLeaderEventForSupabase: mocks.createLeaderEventForSupabase,
  };
});

import { submitLeaderEventCreateAction } from "@/app/leader/actions";

const input = {
  requestId: "82000000-0000-4000-8000-000000000101",
  chapterId: "10000000-0000-4000-8000-000000000001",
  title: "TEST App-Owned Service Night",
  eventType: "volunteer",
  description: "A TEST service event created inside myMEDLIFE.",
  startsAt: "2030-08-01T18:00:00.000Z",
  endsAt: "2030-08-01T20:00:00.000Z",
  locationType: "hybrid",
  locationName: "Student center",
  virtualUrl: "https://example.org/test-meeting",
  capacity: 40,
  rsvpDeadline: "2030-07-31T23:59:59.000Z",
  organizingGroup: "Service Learning Prep & Awareness",
  campaignLabel: "Moving Mountains",
  auditReason: "Leader creates the app-owned launch test event.",
} satisfies LeaderEventCreateInput;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("leader event create server action", () => {
  it("revalidates leader and member event readback after success", async () => {
    const result = successResult();
    mocks.createLeaderEventForSupabase.mockResolvedValue(result);

    await expect(submitLeaderEventCreateAction(input)).resolves.toEqual(result);
    expect(mocks.createLeaderEventForSupabase).toHaveBeenCalledWith(input);
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(4);
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/leader");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/app");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(3, "/app/events");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(
      4,
      "/app/events/51000000-0000-4000-8000-000000000101",
    );
  });

  it("does not invalidate readback when creation fails", async () => {
    const result = {
      success: false,
      code: "write_disabled",
      chapterEventId: null,
      externalWritesEnabled: false,
      plainEnglishMessage: "Writes disabled for this test.",
    } satisfies LeaderEventCreateResult;
    mocks.createLeaderEventForSupabase.mockResolvedValue(result);

    await expect(submitLeaderEventCreateAction(input)).resolves.toEqual(result);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

function successResult(): LeaderEventCreateResult {
  return {
    success: true,
    code: "chapter_event_created",
    chapterEventId: "51000000-0000-4000-8000-000000000101",
    eventId: "71000000-0000-4000-8000-000000000101",
    auditLogId: "91000000-0000-4000-8000-000000000101",
    deduplicated: false,
    externalWritesEnabled: false,
    plainEnglishMessage: "Event created.",
  };
}
