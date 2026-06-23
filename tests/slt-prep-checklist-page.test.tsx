import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep/checklist",
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

describe("slt prep checklist page", () => {
  it("lets the checklist route lead with the trip-prep task surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist page."),
    );

    const { default: SltPrepChecklistPage } = await import("@/app/slt-prep/checklist/page");
    const html = renderToStaticMarkup(await SltPrepChecklistPage({}));

    expect(html).toContain("Readiness Checklist");
    expect(html).toContain("Return itinerary upload");
    expect(html).toContain("/slt-prep/checklist/flight-itinerary?source=checklist");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("preserves the selected traveler through checklist filters and detail links", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist traveler context."),
    );

    const { default: SltPrepChecklistPage } = await import("@/app/slt-prep/checklist/page");
    const html = renderToStaticMarkup(
      await SltPrepChecklistPage({
        searchParams: Promise.resolve({
          traveler: "daniel-kim",
          filter: "missing",
        }),
      }),
    );

    expect(html).toContain("/slt-prep/checklist?filter=all&amp;traveler=daniel-kim");
    expect(html).toContain("/slt-prep/checklist/flight-itinerary?source=checklist&amp;traveler=daniel-kim");
  });
});
