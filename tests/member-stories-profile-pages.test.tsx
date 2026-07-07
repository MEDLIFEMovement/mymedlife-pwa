import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: () => "/profile",
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("member stories and profile pages", () => {
  it("renders the route-backed stories surface with blocked publishing controls", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: AppStoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(await AppStoriesPage());

    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("Stories");
    expect(html).toContain("Read more");
    expect(html).toContain('href="/app"');
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/points"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain("Story creation is blocked until publishing approval is complete");
    expect(html).toContain("Preview-only reaction. Likes are not saved, synced, or counted as production proof.");
    expect(html).toContain("preview likes");
    expect(html).toContain("Sharing is blocked in this preview until publishing approval is complete");
    expect(html).toContain("Saving stories is blocked in this preview");
  });

  it("keeps profile route-backed and explicitly read-only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile route."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(await ProfilePage());

    expect(html).toContain("Hi, Sofia");
    expect(html).toContain("Read-only profile");
    expect(html).toContain("No profile save runs from this route.");
    expect(html).toContain("No join request, role approval, membership change, or coach assignment runs from this route.");
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/app/events?source=profile"');
    expect(html).toContain('href="/app/points?source=profile"');
  });
});
