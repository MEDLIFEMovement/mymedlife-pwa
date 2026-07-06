import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
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

describe("member mobile shell routes", () => {
  it("renders the Stories route through the shared Figma member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: StoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(await StoriesPage());

    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("For You");
    expect(html).toContain("curated by staff");
  });

  it("renders the Events route through the shared Figma member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(await EventsPage());

    expect(html).toContain(">Events<");
    expect(html).toContain("Show up. Check in. Earn points.");
    expect(html).toContain("Intro GBM");
  });

  it("renders the Points route through the shared Figma member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(await PointsPage());

    expect(html).toContain("Points &amp; Recognition");
    expect(html).toContain("Chapter Leaderboard");
    expect(html).toContain("Recent Approved Actions");
  });
});
