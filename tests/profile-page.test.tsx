import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
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

describe("profile page", () => {
  it("lets the member profile route render as a member-owned mobile surface instead of a generic profile hero", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing profile page."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(await ProfilePage());

    expect(html).toContain("Hi, Sofia");
    expect(html).toContain("Profile snapshot");
    expect(html).toContain("<h2 class=\"mt-2 text-2xl font-semibold text-slate-950\">Recognition</h2>");
    expect(html).toContain("Keep identity easy to trust.");
    expect(html).toContain("How your name appears across myMEDLIFE.");
    expect(html).toContain("Email connected to this myMEDLIFE profile.");
    expect(html).toContain(
      "Keep this surface centered on identity, role, and the next step. Recognition and points stay visible lower on the route instead of turning profile into a second dashboard, so profile can hand you back to the event-and-points loop when you are ready to move again.",
    );
    expect(html).toContain("Next chapter moment");
    expect(html).toContain("Open events");
    expect(html).toContain("/app/events?source=profile");
    expect(html).toContain("/app/points?source=profile");
    expect(html).not.toContain("Earned across visible campaigns");
    expect(html).not.toContain("Friendly chapter-only visibility");
    expect(html.indexOf("About you")).toBeLessThan(
      html.indexOf("<h2 class=\"mt-2 text-2xl font-semibold text-slate-950\">Recognition</h2>"),
    );
    expect(html.indexOf("Chapter access")).toBeLessThan(
      html.indexOf("<h2 class=\"mt-2 text-2xl font-semibold text-slate-950\">Recognition</h2>"),
    );
    expect(html).not.toContain("Safety boundary");
    expect(html).not.toContain("Active scope");
    expect(html).not.toContain("This local profile shows who the selected actor is");
    expect(html).not.toContain("Data source status");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
    expect(html).not.toContain("local preview cookie");
    expect(html).not.toContain("Fake local account used for role review.");
  });

  it("returns coach traffic to the owned staff workspace instead of opening a side profile product", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach profile page."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");

    await expect(ProfilePage()).rejects.toThrow(
      "NEXT_REDIRECT:/staff?view=chapters",
    );
  });
});
