import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
  const config = getSupabaseAuthConfig(env);

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
