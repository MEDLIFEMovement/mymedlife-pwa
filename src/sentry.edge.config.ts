import * as Sentry from "@sentry/nextjs";
import {
  getSentryEnvironment,
  getSentryTracesSampleRate,
  scrubSentryEvent,
} from "@/lib/sentry-config";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: getSentryEnvironment(),
  sendDefaultPii: false,
  beforeSend: scrubSentryEvent,
  tracesSampleRate: getSentryTracesSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
  enableLogs: process.env.SENTRY_ENABLE_LOGS === "true",
});
