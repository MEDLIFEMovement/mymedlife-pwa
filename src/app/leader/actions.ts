"use server";

import { revalidatePath } from "next/cache";

import {
  createLeaderEventForSupabase,
  type LeaderEventCreateInput,
  type LeaderEventCreateResult,
} from "@/services/leader-event-create-write";

export async function submitLeaderEventCreateAction(
  input: LeaderEventCreateInput,
): Promise<LeaderEventCreateResult> {
  const result = await createLeaderEventForSupabase(input);

  if (result.success) {
    revalidatePath("/leader");
    revalidatePath("/app");
    revalidatePath("/app/events");
    revalidatePath(`/app/events/${result.chapterEventId}`);
  }

  return result;
}
