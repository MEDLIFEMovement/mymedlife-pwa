export function getLocalTestProductionDbContainerName(
  configToml: string,
  override = process.env.MYMEDLIFE_TEST_PRODUCTION_LOCAL_DB_CONTAINER,
): string {
  const trimmedOverride = override?.trim();

  if (trimmedOverride) {
    return trimmedOverride;
  }

  const projectId = getSupabaseProjectId(configToml);

  if (!projectId) {
    throw new Error(
      "Could not determine the local Supabase project_id from supabase/config.toml.",
    );
  }

  return `supabase_db_${projectId}`;
}

export function getSupabaseProjectId(configToml: string): string | null {
  const match = configToml.match(/^\s*project_id\s*=\s*"([^"]+)"\s*$/m);

  return match?.[1] ?? null;
}

export function buildLocalSupabaseAuthUsersCompatibilitySql(): string {
  return [
    "update auth.users",
    "set aud = coalesce(aud, 'authenticated'),",
    "  role = coalesce(role, 'authenticated'),",
    "  confirmation_token = coalesce(confirmation_token, ''),",
    "  recovery_token = coalesce(recovery_token, ''),",
    "  email_change_token_new = coalesce(email_change_token_new, ''),",
    "  email_change = coalesce(email_change, ''),",
    "  phone_change = coalesce(phone_change, ''),",
    "  phone_change_token = coalesce(phone_change_token, ''),",
    "  email_change_token_current = coalesce(email_change_token_current, ''),",
    "  reauthentication_token = coalesce(reauthentication_token, ''),",
    "  is_super_admin = coalesce(is_super_admin, false)",
    "where aud is null",
    "   or role is null",
    "   or confirmation_token is null",
    "   or recovery_token is null",
    "   or email_change_token_new is null",
    "   or email_change is null",
    "   or phone_change is null",
    "   or phone_change_token is null",
    "   or email_change_token_current is null",
    "   or reauthentication_token is null",
    "   or is_super_admin is null;",
  ].join("\n");
}
