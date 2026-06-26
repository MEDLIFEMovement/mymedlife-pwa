import type { JsonValue } from "@/shared/types/persistence";
import type { RedactedProviderError } from "@/shared/types/admin-integrations";

const tokenPatterns = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /Bearer\s+[A-Za-z0-9._-]{8,}/gi,
  /AIza[0-9A-Za-z-_]{20,}/g,
];

const quotedSecretPatterns = [
  /("private_key"\s*:\s*")[^"]+(")/gi,
  /("refresh_token"\s*:\s*")[^"]+(")/gi,
  /("webhook_secret"\s*:\s*")[^"]+(")/gi,
  /("api_key"\s*:\s*")[^"]+(")/gi,
  /("authorization"\s*:\s*")[^"]+(")/gi,
];

export function getMaskedSecretHint(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "not_set";
  }

  const suffix = trimmed.slice(-4);
  return `••••${suffix}`;
}

export function redactSensitiveText(value: string): string {
  let redacted = value;

  for (const pattern of tokenPatterns) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }

  for (const pattern of quotedSecretPatterns) {
    redacted = redacted.replace(pattern, "$1[REDACTED]$2");
  }

  return redacted;
}

export function sanitizeProviderError(error: unknown): RedactedProviderError {
  if (error instanceof Error) {
    return {
      code: error.name || "provider_error",
      safeMessage: "The provider rejected the request or returned a safe failure.",
      detail: redactSensitiveText(error.message),
    };
  }

  if (typeof error === "string") {
    return {
      code: "provider_error",
      safeMessage: "The provider returned a safe failure message.",
      detail: redactSensitiveText(error),
    };
  }

  return {
    code: "provider_error",
    safeMessage: "The provider returned an unknown error shape.",
    detail: "Unknown provider error",
  };
}

export function sanitizeJsonValue(value: JsonValue): JsonValue {
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeJsonValue(entry));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("authorization") ||
        key.toLowerCase().includes("private_key")
      ) {
        return [key, "[REDACTED]"];
      }

      return [key, sanitizeJsonValue(entry)];
    }),
  );
}
