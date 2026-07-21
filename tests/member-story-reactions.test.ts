import { describe, expect, it, vi } from "vitest";

import {
  createMemberStoryReactionClient,
  createMemberStoryReactionReadClient,
  getMemberStoryReactionConfig,
  getMemberStoryReactionReadbacks,
  toggleMemberStoryLike,
  type MemberStoryReactionClient,
} from "@/services/member-story-reactions";

describe("member story reactions", () => {
  it("keeps persisted reaction readback available when the write gate is closed", () => {
    const env = {
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    };

    expect(createMemberStoryReactionClient(env)).toBeNull();
    expect(createMemberStoryReactionReadClient(env)).not.toBeNull();
  });

  it("keeps production writes closed without both enablement flags", () => {
    const base = {
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    };

    expect(getMemberStoryReactionConfig(base).enabled).toBe(false);
    expect(
      getMemberStoryReactionConfig({
        ...base,
        MYMEDLIFE_ENABLE_MEMBER_STORY_REACTION_WRITE: "true",
      }).enabled,
    ).toBe(false);
    expect(
      getMemberStoryReactionConfig({
        ...base,
        MYMEDLIFE_ENABLE_MEMBER_STORY_REACTION_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_MEMBER_STORY_REACTION_WRITE: "true",
      }),
    ).toMatchObject({ enabled: true, environment: "production" });
  });

  it("requires the service-role key and the matching non-production approval flag", () => {
    expect(
      getMemberStoryReactionConfig({
        MYMEDLIFE_ENABLE_MEMBER_STORY_REACTION_WRITE: "true",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "local",
      reason: expect.stringContaining("service-role key"),
    });

    expect(
      getMemberStoryReactionConfig({
        MYMEDLIFE_ENABLE_MEMBER_STORY_REACTION_WRITE: "true",
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        SUPABASE_SERVICE_ROLE_KEY: "server-secret",
        MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({ enabled: true, environment: "staging" });

    expect(
      getMemberStoryReactionConfig({
        MYMEDLIFE_ENABLE_MEMBER_STORY_REACTION_WRITE: "true",
        SUPABASE_SERVICE_ROLE_KEY: "server-secret",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({ enabled: true, environment: "local" });
  });

  it("maps aggregate reaction readbacks for the signed-in actor", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          evidence_item_id: "story-1",
          reaction_count: 3,
          liked_by_actor: true,
        },
      ],
      error: null,
    });

    await expect(
      getMemberStoryReactionReadbacks(clientWithRpc(rpc), "member-1"),
    ).resolves.toEqual({
      status: "ready",
      rows: [
        { evidenceItemId: "story-1", reactionCount: 3, likedByActor: true },
      ],
    });
    expect(rpc).toHaveBeenCalledWith("get_member_story_reactions", {
      actor_uuid: "member-1",
    });
  });

  it("marks reaction readback unavailable when the aggregate transaction fails or is malformed", async () => {
    const failed = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "read failed" },
    });
    const malformed = vi.fn().mockResolvedValue({ data: {}, error: null });
    const invalidRow = vi.fn().mockResolvedValue({
      data: [{ evidence_item_id: "story-1", reaction_count: -1, liked_by_actor: true }],
      error: null,
    });
    const thrown = vi.fn().mockRejectedValue(new Error("database unavailable"));

    await expect(
      getMemberStoryReactionReadbacks(clientWithRpc(failed), "member-1"),
    ).resolves.toEqual({ status: "unavailable", rows: [] });
    await expect(
      getMemberStoryReactionReadbacks(clientWithRpc(malformed), "member-1"),
    ).resolves.toEqual({ status: "unavailable", rows: [] });
    await expect(
      getMemberStoryReactionReadbacks(clientWithRpc(invalidRow), "member-1"),
    ).resolves.toEqual({ status: "unavailable", rows: [] });
    await expect(
      getMemberStoryReactionReadbacks(clientWithRpc(thrown), "member-1"),
    ).resolves.toEqual({ status: "unavailable", rows: [] });
  });

  it.each([
    ["story_liked", true, "recorded"],
    ["story_unliked", false, "audit history"],
  ] as const)("maps a transactional %s result", async (code, liked, messageFragment) => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        result_code: code,
        evidence_item_id: "story-1",
        reaction_count: liked ? 1 : 0,
        liked_by_actor: liked,
      }],
      error: null,
    });

    const result = await toggleMemberStoryLike(clientWithRpc(rpc), {
      actorUserId: "member-1",
      evidenceItemId: "story-1",
    });

    expect(result).toMatchObject({
      success: true,
      code,
      evidenceItemId: "story-1",
      likedByActor: liked,
    });
    expect(result.message).toContain(messageFragment);
  });

  it("does not claim success for an invalid or failed database result", async () => {
    const invalid = vi.fn().mockResolvedValue({
      data: [{ result_code: "unknown" }],
      error: null,
    });
    const failed = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "approved story not found" },
    });

    await expect(
      toggleMemberStoryLike(clientWithRpc(invalid), {
        actorUserId: "member-1",
        evidenceItemId: "story-1",
      }),
    ).resolves.toMatchObject({ success: false, code: "server_error" });
    await expect(
      toggleMemberStoryLike(clientWithRpc(failed), {
        actorUserId: "member-1",
        evidenceItemId: "story-1",
      }),
    ).resolves.toMatchObject({ success: false, code: "story_not_found" });
  });

  it("maps profile and unknown database failures without changing the visible count", async () => {
    const missingProfile = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "active member profile not found" },
    });
    const unknown = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
    });

    await expect(
      toggleMemberStoryLike(clientWithRpc(missingProfile), {
        actorUserId: "member-1",
        evidenceItemId: "story-1",
      }),
    ).resolves.toMatchObject({
      success: false,
      code: "profile_not_found",
      reactionCount: 0,
    });

    await expect(
      toggleMemberStoryLike(clientWithRpc(unknown), {
        actorUserId: "member-1",
        evidenceItemId: "story-1",
      }),
    ).resolves.toMatchObject({
      success: false,
      code: "server_error",
      reactionCount: 0,
    });
  });
});

function clientWithRpc(rpc: ReturnType<typeof vi.fn>) {
  return {
    schema: () => ({ rpc }),
  } as unknown as MemberStoryReactionClient;
}
