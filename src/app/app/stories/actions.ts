"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  createMemberStoryReactionClient,
  getMemberStoryReactionConfig,
  setMemberStoryLike,
  type MemberStoryReactionResult,
} from "@/services/member-story-reactions";

const memberStoryReactionResultParam = "storyReactionResult";

export async function submitMemberStoryReactionAction(formData: FormData) {
  const evidenceItemId = getFormString(formData, "storyId");
  const desiredLiked = parseDesiredLiked(formData);
  const result = desiredLiked === null
    ? failure(
        "server_error",
        evidenceItemId,
        "The reaction intent was missing, so the story was not changed.",
      )
    : await submitMemberStoryReactionForSupabase(evidenceItemId, desiredLiked);
  redirect(buildRedirectHref(formData, result.code));
}

export async function submitMemberStoryReactionForSupabase(
  evidenceItemId: string,
  desiredLiked: boolean,
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

  return setMemberStoryLike(reactionClient, {
    actorUserId: session.user.id,
    evidenceItemId,
    liked: desiredLiked,
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

function parseDesiredLiked(formData: FormData) {
  const value = getFormString(formData, "desiredLiked");
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function failure(
  code: "write_disabled" | "profile_not_found" | "server_error",
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
