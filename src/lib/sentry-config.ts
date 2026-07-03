import type { ErrorEvent } from "@sentry/nextjs";

const DEFAULT_TRACES_SAMPLE_RATE = 0.05;

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-supabase-auth",
]);

export function getSentryEnvironment() {
  return (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV
  );
}

export function getSentryTracesSampleRate(value: string | undefined) {
  if (!value) {
    return DEFAULT_TRACES_SAMPLE_RATE;
  }

  const sampleRate = Number(value);

  if (!Number.isFinite(sampleRate)) {
    return DEFAULT_TRACES_SAMPLE_RATE;
  }

  return Math.min(Math.max(sampleRate, 0), 1);
}

export function scrubSentryEvent(event: ErrorEvent) {
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.name;
    delete event.user.username;
  }

  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;

    if (event.request.headers) {
      for (const headerName of Object.keys(event.request.headers)) {
        if (SENSITIVE_HEADER_NAMES.has(headerName.toLowerCase())) {
          delete event.request.headers[headerName];
        }
      }
    }
  }

  return event;
}
