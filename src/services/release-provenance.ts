export type ReleaseProvenance = {
  service: "mymedlife-pwa";
  releaseSha: string | null;
  deploymentEnvironment: "production" | "preview" | "development" | "unknown";
  gitRef: string | null;
  ready: boolean;
};

export function getReleaseProvenance(
  env: Record<string, string | undefined> = process.env,
): ReleaseProvenance {
  const releaseSha = normalizeSha(
    env.VERCEL_GIT_COMMIT_SHA ?? env.MYMEDLIFE_RELEASE_SHA,
  );
  const deploymentEnvironment = normalizeEnvironment(
    env.VERCEL_ENV ?? env.NODE_ENV,
  );

  return {
    service: "mymedlife-pwa",
    releaseSha,
    deploymentEnvironment,
    gitRef: normalizeRef(env.VERCEL_GIT_COMMIT_REF),
    ready: releaseSha !== null,
  };
}

function normalizeSha(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return /^[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

function normalizeEnvironment(
  value: string | undefined,
): ReleaseProvenance["deploymentEnvironment"] {
  if (value === "production" || value === "preview" || value === "development") {
    return value;
  }
  return "unknown";
}

function normalizeRef(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  if (!normalized || normalized.length > 100) return null;
  return /^[A-Za-z0-9._/-]+$/.test(normalized) ? normalized : null;
}
