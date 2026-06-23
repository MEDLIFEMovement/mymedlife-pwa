import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep/flights",
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

describe("slt prep flights page", () => {
  it("lets the flights route lead with the itinerary surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt flights page."),
    );

    const { default: SltPrepFlightsPage } = await import("@/app/slt-prep/flights/page");
    const html = renderToStaticMarkup(await SltPrepFlightsPage({}));

    expect(html).toContain("Flight details for Sofia");
    expect(html).toContain("Upload and confirmation posture");
    expect(html).toContain("Current blocker");
    expect(html).toContain("Owner");
    expect(html).toContain("Due");
    expect(html).toContain("Outbound and return segments");
    expect(html).toContain(
      "The itinerary should still show who owns the next follow-up before airport week gets crowded.",
    );
    expect(html).toContain(
      "Airport pickup and roster timing should stay visible until the itinerary is fully confirmed.",
    );
    expect(html).toContain("/slt-prep/checklist/flight-itinerary?source=flights");
    expect(html).toContain("/slt-prep/timeline");
    expect(html).toContain("Return flight still needs final confirmation");
    expect(html).not.toContain("Flight picture");
    expect(html).not.toContain("Flight watchout");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("The flight lane stays mock-safe");
    expect(html).not.toContain("Airport pickup and roster timing stay mock-safe");
  });

  it("keeps notification handoff context visible on the flights route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing flights notification handoff."),
    );

    const { default: SltPrepFlightsPage } = await import("@/app/slt-prep/flights/page");
    const html = renderToStaticMarkup(
      await SltPrepFlightsPage({
        searchParams: Promise.resolve({
          source: "notifications",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Notifications opened this prep route for Daniel Kim.");
    expect(html).toContain("Back to notifications");
    expect(html).toContain("href=\"/slt-prep/notifications?traveler=daniel-kim\"");
    expect(html.indexOf("Upload and confirmation posture")).toBeLessThan(
      html.indexOf("Notifications opened this prep route for Daniel Kim."),
    );
  });

  it("preserves staff traveler routes while flights is open for a selected traveler", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing flights staff handoff preservation."),
    );

    const { default: SltPrepFlightsPage } = await import("@/app/slt-prep/flights/page");
    const html = renderToStaticMarkup(
      await SltPrepFlightsPage({
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Staff traveler review opened this prep route for Daniel Kim.");
    expect(html).toContain('href="/slt-prep/staff?traveler=daniel-kim"');
    expect(html).toContain('href="/slt-prep/timeline?source=staff&amp;traveler=daniel-kim"');
    expect(html).toContain('href="/slt-prep/profile?source=staff&amp;traveler=daniel-kim"');
  });
});
