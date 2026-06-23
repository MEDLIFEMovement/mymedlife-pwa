import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/onboarding",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

describe("onboarding page", () => {
  it("keeps the member onboarding route focused on the product path instead of audit scaffolding", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: OnboardingPage } = await import("@/app/onboarding/page");
    const html = renderToStaticMarkup(await OnboardingPage());

    expect(html).toContain("Next best step");
    expect(html).toContain("Onboarding sequence");
    expect(html).toContain("Held for later");
    expect(html).toContain("available later");
    expect(html).toContain("tracked");
    expect(html).not.toContain("What should I do next?");
    expect(html).not.toContain("Future onboarding sequence");
    expect(html).not.toContain("Blocked until approval");
    expect(html).not.toContain("browser off");
    expect(html).not.toContain("event-ready");
    expect(html).not.toContain("Event and outbox log");
    expect(html).not.toContain("Automation-ready, mock-only");
  });

  it("keeps the staff onboarding route able to show the operational preflight and audit view", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );

    const { default: OnboardingPage } = await import("@/app/onboarding/page");
    const html = renderToStaticMarkup(await OnboardingPage());

    expect(html).toContain("Staff auth preflight");
    expect(html).toContain("Event and outbox log");
    expect(html).toContain("Later: create production users");
    expect(html).not.toContain("Locked create production users");
  });
});
