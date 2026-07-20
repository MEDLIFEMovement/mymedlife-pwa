"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  createMemberStoryReactionClient,
  getMemberStoryReactionConfig,
  toggleMemberStoryLike,
  type MemberStoryReactionResult,
} from "@/services/member-story-reactions";

const memberStoryReactionResultParam = "storyReactionResult";

export async function submitMemberStoryReactionAction(formData: FormData) {
  const evidenceItemId = getFormString(formData, "storyId");
  const result = await submitMemberStoryReactionForSupabase(evidenceItemId);
  redirect(buildRedirectHref(formData, result.code));
}

export async function submitMemberStoryReactionForSupabase(
  evidenceItemId: string,
): Promise<MemberStoryReactionResult> {
  const config = getMemberStoryReactionConfig();

  if (!config.enabled) {
    return failure("write_disabled", evidenceItemId, config.reason);
  }

  const { client: sessionClient, config: authConfig } =
    await createLocalSupabaseServerClient();

  if (!sessionClient) {
    return failure("write_disabled", evidenceItemId, authConfig.reason);
  }

  const session = await getAuthSessionState(sessionClient, authConfig);
  if (session.status !== "signed_in" || !session.user) {
    return failure(
      "profile_not_found",
      evidenceItemId,
      "Sign in with an active myMEDLIFE member profile before reacting to a story.",
    );
  }

  const reactionClient = createMemberStoryReactionClient();
  if (!reactionClient) {
    return failure(
      "write_disabled",
      evidenceItemId,
      "The server-only story reaction client is not configured.",
    );
  }

  return toggleMemberStoryLike(reactionClient, {
    actorUserId: session.user.id,
    evidenceItemId,
  });
}

function buildRedirectHref(formData: FormData, resultCode: string) {
  const url = new URL("https://mymedlife.local/app/stories");
  const filter = getFormString(formData, "filter");
  const story = getFormString(formData, "openStory");

  if (filter) url.searchParams.set("filter", filter);
  if (story) url.searchParams.set("story", story);
  url.searchParams.set(memberStoryReactionResultParam, resultCode);
  return `${url.pathname}${url.search}`;
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function failure(
  code: "write_disabled" | "profile_not_found",
  evidenceItemId: string,
  message: string,
): MemberStoryReactionResult {
  return {
    success: false,
    code,
    evidenceItemId,
    reactionCount: 0,
    likedByActor: false,
    message,
  };
}
