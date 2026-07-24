import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/services/local-actor-context", () => ({
  getLocalActorContext: async () => ({
    audience: "member",
    identitySource: "local_actor_email",
    authSessionStatus: "disabled",
  }),
}));

import OnboardingPage from "@/app/onboarding/page";

describe("onboarding production auth boundary", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("redirects an unsigned seeded actor with the onboarding return target", async () => {
    vi.stubEnv("VERCEL_ENV", "production");

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?redirectTo=%2Fonboarding",
    );
  });
});
