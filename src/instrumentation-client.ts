import * as Sentry from "@sentry/nextjs";
import {
  getSentryEnvironment,
  getSentryTracesSampleRate,
  scrubSentryEvent,
} from "@/lib/sentry-config";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const replaysEnabled = process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ENABLED === "true";

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: getSentryEnvironment(),
  sendDefaultPii: false,
  beforeSend: scrubSentryEvent,
  tracesSampleRate: getSentryTracesSampleRate(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  ),
  enableLogs: process.env.NEXT_PUBLIC_SENTRY_ENABLE_LOGS === "true",
  integrations: replaysEnabled
    ? [
        Sentry.replayIntegration({
          maskAllInputs: true,
          maskAllText: true,
          blockAllMedia: true,
        }),
      ]
    : [],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: replaysEnabled ? 1 : 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
