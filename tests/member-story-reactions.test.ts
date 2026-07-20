import { describe, expect, it, vi } from "vitest";

import {
  getMemberStoryReactionConfig,
  getMemberStoryReactionReadbacks,
  toggleMemberStoryLike,
  type MemberStoryReactionClient,
} from "@/services/member-story-reactions";

describe("member story reactions", () => {
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
    ).resolves.toEqual([
      { evidenceItemId: "story-1", reactionCount: 3, likedByActor: true },
    ]);
    expect(rpc).toHaveBeenCalledWith("get_member_story_reactions", {
      actor_uuid: "member-1",
    });
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
});

function clientWithRpc(rpc: ReturnType<typeof vi.fn>) {
  return {
    schema: () => ({ rpc }),
  } as unknown as MemberStoryReactionClient;
}
