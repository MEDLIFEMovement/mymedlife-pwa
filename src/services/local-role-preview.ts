type LocalRolePreviewEnv = Record<string, string | undefined>;

export function isLocalRolePreviewEnabled(
  env: LocalRolePreviewEnv = process.env,
) {
  return (
    env.VERCEL_ENV !== "production" &&
    env.MYMEDLIFE_AUTH_MODE !== "production_supabase"
  );
}
