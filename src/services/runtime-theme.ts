import type { CSSProperties } from "react";
import {
  getThemeSettingDefinitions,
  isThemeSettingKey,
} from "@/services/admin-rollout-controls-registry";
import type {
  RolloutEnvironment,
  ThemeSettingKey,
} from "@/shared/types/admin-rollout-controls";
import type { ThemeSettingRow } from "@/shared/types/persistence";

type EnvSource = Record<string, string | undefined>;

type RuntimeThemeSource = "defaults" | "supabase";

type RuntimeThemeRow = Pick<ThemeSettingRow, "setting_key" | "value">;

export type RuntimeTheme = {
  environment: RolloutEnvironment;
  source: RuntimeThemeSource;
  values: Record<ThemeSettingKey, string>;
};

export async function getRuntimeTheme(
  env: EnvSource = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<RuntimeTheme> {
  const environment = resolveRuntimeThemeEnvironment(env);
  const defaults = getDefaultRuntimeThemeValues(environment);

  if (env.MYMEDLIFE_CONTROL_LAYER_SOURCE !== "supabase") {
    return {
      environment,
      source: "defaults",
      values: defaults,
    };
  }

  const url = stripTrailingSlash(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !key) {
    return {
      environment,
      source: "defaults",
      values: defaults,
    };
  }

  try {
    const requestUrl = new URL(`${url}/rest/v1/theme_settings`);
    requestUrl.searchParams.set("select", "setting_key,value");
    requestUrl.searchParams.set("environment", `eq.${environment}`);

    const response = await fetchFn(requestUrl, {
      method: "GET",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "accept-profile": "app",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        environment,
        source: "defaults",
        values: defaults,
      };
    }

    const rows = (await response.json()) as RuntimeThemeRow[];
    const values = { ...defaults };
    let usedPersistedValue = false;

    for (const row of rows) {
      if (!isThemeSettingKey(row.setting_key) || !isSafeThemeValue(row.value)) {
        continue;
      }

      values[row.setting_key] = row.value.trim();
      usedPersistedValue = true;
    }

    return {
      environment,
      source: usedPersistedValue ? "supabase" : "defaults",
      values,
    };
  } catch {
    return {
      environment,
      source: "defaults",
      values: defaults,
    };
  }
}

export function getRuntimeThemeStyle(theme: RuntimeTheme): CSSProperties {
  return {
    "--background": theme.values.background,
    "--foreground": theme.values.foreground,
    "--panel": theme.values.panel,
    "--panel-strong": theme.values.panel_strong,
    "--line": theme.values.line,
    "--accent": theme.values.accent,
    "--accent-strong": theme.values.accent_strong,
  } as CSSProperties;
}

export function resolveRuntimeThemeEnvironment(
  env: EnvSource = process.env,
): RolloutEnvironment {
  if (env.VERCEL_ENV === "production") {
    return "production";
  }

  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase" || env.VERCEL_ENV === "preview") {
    return "staging";
  }

  return "local";
}

function getDefaultRuntimeThemeValues(
  environment: RolloutEnvironment,
): Record<ThemeSettingKey, string> {
  return getThemeSettingDefinitions().reduce<Record<ThemeSettingKey, string>>(
    (accumulator, definition) => {
      accumulator[definition.key] = definition.defaultValueByEnvironment[environment];
      return accumulator;
    },
    {} as Record<ThemeSettingKey, string>,
  );
}

function isSafeThemeValue(value: string): boolean {
  const normalized = value.trim();

  return (
    /^#([0-9a-f]{3,8})$/i.test(normalized) ||
    /^(rgb|hsl)a?\(([^)]+)\)$/i.test(normalized) ||
    /^(transparent|white|black)$/i.test(normalized)
  );
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
