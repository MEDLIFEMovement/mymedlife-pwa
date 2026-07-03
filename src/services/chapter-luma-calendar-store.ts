import { createSupabaseReadonlyAccess, type SupabaseReadonlyClient } from "@/lib/supabase-readonly";
import { resolveRuntimeFeatureFlagEnvironment } from "@/services/runtime-feature-flags";
import type { ChapterLumaCalendarEnv } from "@/services/chapter-luma-calendars";
import type {
  ChapterLumaCalendarRow,
  RolloutEnvironment,
} from "@/shared/types/persistence";

export async function getPersistedChapterLumaCalendarRows(
  env: ChapterLumaCalendarEnv = process.env as ChapterLumaCalendarEnv,
): Promise<ChapterLumaCalendarRow[]> {
  const access = await createSupabaseReadonlyAccess(env);

  if (!access.enabled) {
    return [];
  }

  const rows = await readChapterLumaCalendarRows(access.client);
  return filterChapterLumaCalendarRowsForEnvironment(rows, env);
}

export async function readChapterLumaCalendarRows(
  client: SupabaseReadonlyClient,
): Promise<ChapterLumaCalendarRow[]> {
  try {
    return await client.selectRows<ChapterLumaCalendarRow>("chapter_luma_calendars", {
      query: {
        order: "environment.asc,chapter_id.asc",
      },
    });
  } catch (error) {
    if (isMissingChapterLumaCalendarTableError(error)) {
      return [];
    }

    throw error;
  }
}

export function filterChapterLumaCalendarRowsForEnvironment(
  rows: readonly ChapterLumaCalendarRow[],
  env: ChapterLumaCalendarEnv = process.env as ChapterLumaCalendarEnv,
): ChapterLumaCalendarRow[] {
  const environment = resolveChapterLumaCalendarEnvironment(env);

  return rows.filter((row) => row.environment === environment);
}

export function resolveChapterLumaCalendarEnvironment(
  env: ChapterLumaCalendarEnv = process.env as ChapterLumaCalendarEnv,
): RolloutEnvironment {
  return resolveRuntimeFeatureFlagEnvironment(env);
}

export function isMissingChapterLumaCalendarTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  return normalizedMessage.includes("chapter_luma_calendars") && (
    normalizedMessage.includes("42p01") ||
    normalizedMessage.includes("does not exist") ||
    normalizedMessage.includes("could not find the table")
  );
}
