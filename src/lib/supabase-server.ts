import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getResolvedFeatureFlagEnv } from "@/services/runtime-feature-flags";
import {
  getSupabaseAuthConfig,
  type SupabaseAuthConfig,
} from "@/services/supabase-auth-config";

type LocalSupabaseServerClientResult =
  | {
      config: Extract<SupabaseAuthConfig, { enabled: true }>;
      client: ReturnType<typeof createServerClient>;
    }
  | {
      config: Extract<SupabaseAuthConfig, { enabled: false }>;
      client: null;
    };

export async function createLocalSupabaseServerClient(
  env: Record<string, string | undefined> = process.env,
): Promise<LocalSupabaseServerClientResult> {
  const resolvedEnv =
    env.MYMEDLIFE_AUTH_MODE === "staging_supabase"
      ? await getResolvedFeatureFlagEnv(["staging_review_auth"], env)
      : env;
  const config = getSupabaseAuthConfig(resolvedEnv);

  if (!config.enabled) {
    return { config, client: null };
  }

  const cookieStore = await cookies();

  return {
    config,
    client: createServerClient(config.url, config.anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always write cookies. Server actions can.
          }
        },
      },
    }),
  };
}
