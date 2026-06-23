import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep/timeline",
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

describe("slt prep timeline page", () => {
  it("lets the timeline route lead with the trip milestone surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt timeline page."),
    );

    const { default: SltPrepTimelinePage } = await import("@/app/slt-prep/timeline/page");
    const html = renderToStaticMarkup(await SltPrepTimelinePage({}));

    expect(html).toContain("Trip timeline");
    expect(html).toContain("Trip Timeline");
    expect(html).toContain("Current milestone");
    expect(html).toContain("Core forms submitted");
    expect(html).toContain("Next milestone");
    expect(html).toContain("Flight itinerary locked");
    expect(html).toContain("A clear path to departure");
    expect(html).toContain("Open checklist");
    expect(html).toContain("Open traveler profile");
    expect(html).not.toContain("Timeline view");
    expect(html).not.toContain("Timeline watchout");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("preserves staff handoff links while the timeline route is open", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing timeline handoff preservation."),
    );

    const { default: SltPrepTimelinePage } = await import("@/app/slt-prep/timeline/page");
    const html = renderToStaticMarkup(
      await SltPrepTimelinePage({
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Staff traveler review opened this prep route for Daniel Kim.");
    expect(html).toContain("Back to staff");
    expect(html).toContain('href="/slt-prep/staff?traveler=daniel-kim"');
    expect(html).toContain("/slt-prep/checklist?source=staff&amp;traveler=daniel-kim");
    expect(html).toContain("/slt-prep/profile?source=staff&amp;traveler=daniel-kim");
    expect(html.indexOf("Current milestone")).toBeLessThan(
      html.indexOf("Staff traveler review opened this prep route for Daniel Kim."),
    );
  });
});
