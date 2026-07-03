import {
  getFeatureFlagDefinition,
  getFeatureFlagDefinitions,
} from "@/services/admin-rollout-controls-registry";
import type {
  FeatureFlagKey,
  RolloutEnvironment,
} from "@/shared/types/admin-rollout-controls";
import type { FeatureFlagRow } from "@/shared/types/persistence";

type EnvSource = Record<string, string | undefined>;

type RuntimeFeatureFlagSource = "supabase" | "env" | "defaults";

type FeatureFlagRuntimeRow = Pick<FeatureFlagRow, "flag_key" | "enabled">;

export type RuntimeFeatureFlags = {
  environment: RolloutEnvironment;
  source: RuntimeFeatureFlagSource;
  values: Record<FeatureFlagKey, boolean>;
};

const featureFlagEnvMap: Partial<
  Record<FeatureFlagKey, Partial<Record<RolloutEnvironment, string>>>
> = {
  staging_review_auth: {
    staging: "MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH",
  },
  action_started_write: {
    local: "MYMEDLIFE_ENABLE_ACTION_START_WRITE",
    staging: "MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE",
  },
  proof_metadata_write: {
    local: "MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE",
    staging: "MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE",
  },
  leader_review_write: {
    local: "MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE",
  },
  membership_approval_write: {
    local: "MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE",
  },
};

export async function getRuntimeFeatureFlags(
  keys: readonly FeatureFlagKey[],
  env: EnvSource = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<RuntimeFeatureFlags> {
  const environment = resolveRuntimeFeatureFlagEnvironment(env);
  const defaults = getDefaultFeatureFlagValues(environment, keys);

  if (env.MYMEDLIFE_CONTROL_LAYER_SOURCE !== "supabase") {
    const envValues = applyEnvFallback(defaults, environment, env, keys);

    return {
      environment,
      source: envValues.usedEnvValue ? "env" : "defaults",
      values: envValues.values,
    };
  }

  const url = stripTrailingSlash(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !key) {
    const envValues = applyEnvFallback(defaults, environment, env, keys);

    return {
      environment,
      source: envValues.usedEnvValue ? "env" : "defaults",
      values: envValues.values,
    };
  }

  try {
    const requestUrl = new URL(`${url}/rest/v1/feature_flags`);
    requestUrl.searchParams.set("select", "flag_key,enabled");
    requestUrl.searchParams.set("environment", `eq.${environment}`);
    requestUrl.searchParams.set("flag_key", `in.(${keys.join(",")})`);

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
      const envValues = applyEnvFallback(defaults, environment, env, keys);

      return {
        environment,
        source: envValues.usedEnvValue ? "env" : "defaults",
        values: envValues.values,
      };
    }

    const rows = (await response.json()) as FeatureFlagRuntimeRow[];
    const values = { ...defaults };
    let usedPersistedValue = false;

    for (const row of rows) {
      const definition = getFeatureFlagDefinition(row.flag_key);

      if (!definition) {
        continue;
      }

      values[definition.key] = row.enabled;
      usedPersistedValue = true;
    }

    if (!usedPersistedValue) {
      const envValues = applyEnvFallback(values, environment, env, keys);

      return {
        environment,
        source: envValues.usedEnvValue ? "env" : "defaults",
        values: envValues.values,
      };
    }

    return {
      environment,
      source: "supabase",
      values,
    };
  } catch {
    const envValues = applyEnvFallback(defaults, environment, env, keys);

    return {
      environment,
      source: envValues.usedEnvValue ? "env" : "defaults",
      values: envValues.values,
    };
  }
}

export async function getRuntimeFeatureFlagValue(
  key: FeatureFlagKey,
  env: EnvSource = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  const flags = await getRuntimeFeatureFlags([key], env, fetchFn);
  return flags.values[key];
}

export async function getResolvedFeatureFlagEnv(
  keys: readonly FeatureFlagKey[],
  env: EnvSource = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<EnvSource> {
  const runtimeFlags = await getRuntimeFeatureFlags(keys, env, fetchFn);
  const resolvedEnv = { ...env };

  for (const key of keys) {
    const envVarName = featureFlagEnvMap[key]?.[runtimeFlags.environment];

    if (!envVarName) {
      continue;
    }

    resolvedEnv[envVarName] = runtimeFlags.values[key] ? "true" : "false";
  }

  return resolvedEnv;
}

export function resolveRuntimeFeatureFlagEnvironment(
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

function applyEnvFallback(
  baseValues: Record<FeatureFlagKey, boolean>,
  environment: RolloutEnvironment,
  env: EnvSource,
  keys: readonly FeatureFlagKey[],
) {
  let usedEnvValue = false;
  const values = { ...baseValues };

  for (const key of keys) {
    const envVarName = featureFlagEnvMap[key]?.[environment];

    if (!envVarName) {
      continue;
    }

    if (env[envVarName] === "true") {
      values[key] = true;
      usedEnvValue = true;
      continue;
    }

    if (env[envVarName] === "false") {
      values[key] = false;
      usedEnvValue = true;
    }
  }

  return { values, usedEnvValue };
}

function getDefaultFeatureFlagValues(
  environment: RolloutEnvironment,
  keys: readonly FeatureFlagKey[],
): Record<FeatureFlagKey, boolean> {
  const allDefaults = getFeatureFlagDefinitions().reduce<Record<FeatureFlagKey, boolean>>(
    (accumulator, definition) => {
      accumulator[definition.key] = definition.defaultEnabledByEnvironment[environment];
      return accumulator;
    },
    {} as Record<FeatureFlagKey, boolean>,
  );

  return keys.reduce<Record<FeatureFlagKey, boolean>>((accumulator, key) => {
    accumulator[key] = allDefaults[key];
    return accumulator;
  }, {} as Record<FeatureFlagKey, boolean>);
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
