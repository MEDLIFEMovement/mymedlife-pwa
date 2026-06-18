import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isKnownAppRouteHref } from "@/services/app-route-registry";
import {
  pwaOfflineSupport,
  shouldRegisterServiceWorker,
} from "@/services/pwa-offline-support";

describe("PWA offline support", () => {
  it("registers the service worker only in production or explicit local rehearsal", () => {
    expect(
      shouldRegisterServiceWorker({
        nodeEnv: "development",
        explicitFlag: "false",
      }),
    ).toBe(false);
    expect(
      shouldRegisterServiceWorker({
        nodeEnv: "development",
        explicitFlag: "true",
      }),
    ).toBe(true);
    expect(
      shouldRegisterServiceWorker({
        nodeEnv: "production",
        explicitFlag: "false",
      }),
    ).toBe(true);
  });

  it("keeps offline support scoped to shell recovery, not private app data", () => {
    expect(pwaOfflineSupport.serviceWorkerPath).toBe("/sw.js");
    expect(pwaOfflineSupport.offlineRoute).toBe("/offline");
    expect(pwaOfflineSupport.cachedShellAssets).toEqual([
      "/offline",
      "/manifest.webmanifest",
      "/icons/my-medlife-icon.svg",
    ]);
    expect(pwaOfflineSupport.privateDataCachingPolicy).toContain("Do not cache Supabase");
    expect(pwaOfflineSupport.navigationPolicy).toContain("network-first");
    expect(pwaOfflineSupport.pushNotificationsEnabled).toBe(false);
    expect(pwaOfflineSupport.externalWritesExpected).toBe(0);
    expect(isKnownAppRouteHref("/offline")).toBe(true);
  });

  it("serves navigation fallback without caching API or Supabase data", () => {
    const workerSource = readFileSync("public/sw.js", "utf8");

    expect(workerSource).toContain("CACHE_NAME");
    expect(workerSource).toContain("OFFLINE_URL");
    expect(workerSource).toContain('request.mode === "navigate"');
    expect(workerSource).toContain("fetch(request).catch");
    expect(workerSource).toContain('request.method !== "GET"');
    expect(workerSource).toContain('url.origin !== self.location.origin');
    expect(workerSource).toContain('pathname.startsWith("/_next/static/")');
    expect(workerSource).not.toContain("push");
    expect(workerSource).not.toContain("/rest/v1");
    expect(workerSource).not.toContain("supabase");
  });
});
