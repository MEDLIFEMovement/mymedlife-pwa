import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  createLocalSupabaseServerClient: vi.fn(),
  getAuthSessionState: vi.fn(),
  getMemberStoryReactionConfig: vi.fn(),
  createMemberStoryReactionClient: vi.fn(),
  setMemberStoryLike: vi.fn(),
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

vi.mock("@/services/member-story-reactions", () => ({
  createMemberStoryReactionClient: mocks.createMemberStoryReactionClient,
  getMemberStoryReactionConfig: mocks.getMemberStoryReactionConfig,
  setMemberStoryLike: mocks.setMemberStoryLike,
}));

import {
  submitMemberStoryReactionAction,
  submitMemberStoryReactionForSupabase,
} from "@/app/app/stories/actions";

describe("member story reaction server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns write_disabled before touching auth when the gate is closed", async () => {
    mocks.getMemberStoryReactionConfig.mockReturnValue({
      enabled: false,
      environment: "production",
      reason: "Story reactions are disabled for this test.",
    });

    await expect(submitMemberStoryReactionForSupabase("story-1", true)).resolves.toMatchObject({
      success: false,
      code: "write_disabled",
      evidenceItemId: "story-1",
      message: "Story reactions are disabled for this test.",
    });
    expect(mocks.createLocalSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns write_disabled when the session client is unavailable", async () => {
    enableReactionGate();
    mocks.createLocalSupabaseServerClient.mockResolvedValue({
      client: null,
      config: { reason: "Auth client unavailable." },
    });

    await expect(submitMemberStoryReactionForSupabase("story-2", true)).resolves.toMatchObject({
      success: false,
      code: "write_disabled",
      evidenceItemId: "story-2",
      message: "Auth client unavailable.",
    });
    expect(mocks.getAuthSessionState).not.toHaveBeenCalled();
  });

  it("requires a signed-in active member before writing", async () => {
    enableReactionGate();
    const sessionClient = { auth: "client" };
    const authConfig = { reason: "auth ok" };
    mocks.createLocalSupabaseServerClient.mockResolvedValue({
      client: sessionClient,
      config: authConfig,
    });
    mocks.getAuthSessionState.mockResolvedValue({ status: "signed_out", user: null });

    await expect(submitMemberStoryReactionForSupabase("story-3", true)).resolves.toMatchObject({
      success: false,
      code: "profile_not_found",
      evidenceItemId: "story-3",
    });
    expect(mocks.getAuthSessionState).toHaveBeenCalledWith(sessionClient, authConfig);
  });

  it("does not write when the server-only reaction client is unavailable", async () => {
    enableSignedInMember();
    mocks.createMemberStoryReactionClient.mockReturnValue(null);

    await expect(submitMemberStoryReactionForSupabase("story-4", true)).resolves.toMatchObject({
      success: false,
      code: "write_disabled",
      evidenceItemId: "story-4",
      message: "The server-only story reaction client is not configured.",
    });
    expect(mocks.setMemberStoryLike).not.toHaveBeenCalled();
  });

  it("delegates a signed-in member reaction to the service-role transaction", async () => {
    enableSignedInMember();
    const reactionClient = { service: "client" };
    mocks.createMemberStoryReactionClient.mockReturnValue(reactionClient);
    mocks.setMemberStoryLike.mockResolvedValue(successResult("story-5"));

    await expect(submitMemberStoryReactionForSupabase("story-5", true)).resolves.toMatchObject({
      success: true,
      code: "story_liked",
      reactionCount: 1,
    });
    expect(mocks.setMemberStoryLike).toHaveBeenCalledWith(reactionClient, {
      actorUserId: "member-1",
      evidenceItemId: "story-5",
      liked: true,
    });
  });

  it("redirects with the selected filter and open-story context preserved", async () => {
    enableSignedInMember();
    mocks.createMemberStoryReactionClient.mockReturnValue({ service: "client" });
    mocks.setMemberStoryLike.mockResolvedValue(successResult("story-6"));

    await expect(
      submitMemberStoryReactionAction(
        formData({
          storyId: " story-6 ",
          filter: " featured ",
          openStory: " story-6 ",
          desiredLiked: " true ",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:");

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/app/stories?filter=featured&story=story-6&storyReactionResult=story_liked",
    );
  });

  it("redirects without adding empty optional context", async () => {
    enableSignedInMember();
    mocks.createMemberStoryReactionClient.mockReturnValue({ service: "client" });
    mocks.setMemberStoryLike.mockResolvedValue(successResult("story-7"));

    await expect(
      submitMemberStoryReactionAction(
        formData({ storyId: "story-7", desiredLiked: "true" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:");

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/app/stories?storyReactionResult=story_liked",
    );
  });

  it("passes an explicit unlike intent instead of blindly toggling", async () => {
    enableSignedInMember();
    mocks.createMemberStoryReactionClient.mockReturnValue({ service: "client" });
    mocks.setMemberStoryLike.mockResolvedValue({
      ...successResult("story-8"),
      code: "story_unliked",
      reactionCount: 0,
      likedByActor: false,
    });

    await expect(
      submitMemberStoryReactionAction(
        formData({ storyId: "story-8", desiredLiked: "false" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:");

    expect(mocks.setMemberStoryLike).toHaveBeenCalledWith(
      { service: "client" },
      {
        actorUserId: "member-1",
        evidenceItemId: "story-8",
        liked: false,
      },
    );
  });

  it("fails closed when a stale form omits the desired reaction state", async () => {
    await expect(
      submitMemberStoryReactionAction(formData({ storyId: "story-9" })),
    ).rejects.toThrow("NEXT_REDIRECT:");

    expect(mocks.setMemberStoryLike).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/app/stories?storyReactionResult=server_error",
    );
  });
});

function enableReactionGate() {
  mocks.getMemberStoryReactionConfig.mockReturnValue({
    enabled: true,
    environment: "production",
    reason: "writes enabled",
  });
}

function enableSignedInMember() {
  enableReactionGate();
  mocks.createLocalSupabaseServerClient.mockResolvedValue({
    client: { auth: "client" },
    config: { reason: "auth ok" },
  });
  mocks.getAuthSessionState.mockResolvedValue({
    status: "signed_in",
    user: { id: "member-1", email: "member@mymedlife.test" },
  });
}

function successResult(evidenceItemId: string) {
  return {
    success: true,
    code: "story_liked",
    evidenceItemId,
    reactionCount: 1,
    likedByActor: true,
    message: "Story reaction recorded in myMEDLIFE.",
  };
}

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
