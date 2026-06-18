export type ServiceWorkerRegistrationEnv = {
  nodeEnv?: string;
  explicitFlag?: string;
};

export const pwaOfflineSupport = {
  serviceWorkerPath: "/sw.js",
  offlineRoute: "/offline",
  cachedShellAssets: [
    "/offline",
    "/manifest.webmanifest",
    "/icons/my-medlife-icon.svg",
  ],
  privateDataCachingPolicy:
    "Do not cache Supabase reads, API responses, auth sessions, proof details, audit rows, or integration/outbox payloads.",
  navigationPolicy:
    "Use network-first navigation and return the offline shell only when the browser cannot reach the app.",
  pushNotificationsEnabled: false,
  externalWritesExpected: 0,
} as const;

export function shouldRegisterServiceWorker(
  env: ServiceWorkerRegistrationEnv,
): boolean {
  return env.explicitFlag === "true" || env.nodeEnv === "production";
}
