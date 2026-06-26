import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

describe("home page", () => {
  it("sends signed-out visitors to the login page first", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const navigationModule = await import("next/navigation");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing login-first home page."),
    );
    vi.mocked(navigationModule.redirect).mockClear();

    const { default: HomePage } = await import("@/app/page");
    const html = renderToStaticMarkup(await HomePage());

    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith("/login");
    expect(html).toBe("");
  });

  it("still shows the member home once the user is signed in", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "member.a@mymedlife.test",
        undefined,
        "mock_fallback",
        "local_actor_email",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing signed-in home page."),
    );

    const { default: HomePage } = await import("@/app/page");
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Hi, Sofia");
  });
});
