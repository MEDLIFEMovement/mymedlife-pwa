type EnvSource = Record<string, string | undefined>;

const unresolvedValueMatchers = [
  /^pending(?:\b|[\s:/-])/i,
  /^tbd(?:\b|[\s:/-])/i,
  /^to be determined(?:\b|[\s:/-])/i,
  /^unknown(?:\b|[\s:/-])/i,
  /^not yet(?:\b|[\s:/-])/i,
  /^unassigned(?:\b|[\s:/-])/i,
  /^none yet(?:\b|[\s:/-])/i,
] as const;

export function readReviewPacketValue(
  env: EnvSource,
  key: string | undefined,
  packetValues?: Map<string, string>,
): string | null {
  if (!key) {
    return null;
  }

  const packetValue = packetValues?.get(key)?.trim();

  if (packetValue) {
    return packetValue;
  }

  const value = env[key]?.trim();
  return value ? value : null;
}

export function isResolvedReviewPacketValue(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return !unresolvedValueMatchers.some((pattern) => pattern.test(value.trim()));
}
