import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
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

describe("profile page", () => {
  it("lets the member profile route render as a member-owned mobile surface instead of a generic profile hero", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
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
    expect(html).toContain("Finish: Invite 3 friends to the Intro GBM");
    expect(html).toContain("/campaigns?source=profile");
    expect(html).toContain("/rush-month/leaderboard?source=profile");
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

  it("keeps the coach profile route inside product-facing command-center copy instead of review-only tooling", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach profile page."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(await ProfilePage());

    expect(html).toContain("Coach profile and portfolio scope");
    expect(html).toContain("Current role");
    expect(html).toContain("Next focus");
    expect(html).toContain("Open Staff Command Center");
    expect(html).toContain("/staff?view=chapters");
    expect(html).toContain("Coach portfolio");
    expect(html).toContain("Staff view");
    expect(html).not.toContain("Data source status");
    expect(html).not.toContain("Safety boundary");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
    expect(html).not.toContain("What should I do next?");
    expect(html).not.toContain("Active scope");
  });
});
