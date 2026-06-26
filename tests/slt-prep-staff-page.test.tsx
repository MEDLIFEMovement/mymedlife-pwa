import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep/staff",
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

describe("slt prep staff page", () => {
  it("returns members to student home when the staff dashboard is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing blocked slt staff page."),
    );

    const { default: SltPrepStaffPage } = await import("@/app/slt-prep/staff/page");
    const html = renderToStaticMarkup(await SltPrepStaffPage({}));

    expect(html).toContain('href="/app"');
    expect(html).toContain(">Open student home<");
  });

  it("keeps DS Admin on admin safety routes when the staff dashboard is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing DS-blocked slt staff page."),
    );

    const { default: SltPrepStaffPage } = await import("@/app/slt-prep/staff/page");
    const html = renderToStaticMarkup(await SltPrepStaffPage({}));

    expect(html).toContain('href="/admin"');
    expect(html).toContain(">Open integration safety<");
  });

  it("lets the staff dashboard route lead with the traveler-readiness surface without review-only data chrome", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt staff page."),
    );

    const { default: SltPrepStaffPage } = await import("@/app/slt-prep/staff/page");
    const html = renderToStaticMarkup(await SltPrepStaffPage({}));

    expect(html).toContain("Traveler Readiness Dashboard");
    expect(html).toContain("Total travelers");
    expect(html).toContain("Need attention");
    expect(html).toContain("Missing Flights");
    expect(html).toContain("Missing Forms");
    expect(html).toContain("Unpaid Balance");
    expect(html).toContain("High Risk");
    expect(html).toContain("Status filters");
    expect(html).toContain("Traveler portfolio");
    expect(html).toContain("Bulk actions");
    expect(html).toContain("Payment follow-up");
    expect(html).toContain("Meeting make-up");
    expect(html).toContain("Traveler review");
    expect(html).toContain("Next owner");
    expect(html).not.toContain("Dashboard posture");
    expect(html).not.toContain("Support watchout");
    expect(html).toContain("Selected traveler");
    expect(html).toContain("Next reviewer moves");
    expect(html).toContain("Review blocker detail");
    expect(html).toContain("/slt-prep/checklist/flight-itinerary?source=staff&amp;traveler=sofia-alvarez");
    expect(
      html.match(
        /Staff needs the final return itinerary upload before the travel plan can lock\./g,
      )?.length,
    ).toBe(2);
    expect(html).toContain("/slt-prep?source=staff&amp;traveler=sofia-alvarez");
    expect(html).toContain("/slt-prep/profile?source=staff&amp;traveler=sofia-alvarez");
    expect(html).toContain("/slt-prep/flights?source=staff&amp;traveler=sofia-alvarez");
    expect(html).toContain("/slt-prep/timeline?source=staff&amp;traveler=sofia-alvarez");
    expect(html).not.toContain("Coach Command Center");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps the selected traveler attached when staff opens the traveler mobile view", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected traveler staff handoff."),
    );

    const { default: SltPrepStaffPage } = await import("@/app/slt-prep/staff/page");
    const html = renderToStaticMarkup(
      await SltPrepStaffPage({
        searchParams: Promise.resolve({ traveler: "sofia-alvarez" }),
      }),
    );

    expect(html).toContain("/slt-prep?source=staff&amp;traveler=sofia-alvarez");
    expect(html).toContain("Open traveler mobile view");
  });

  it("keeps staff-source navigation attached to the selected traveler route set", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff-source SLT nav preservation."),
    );

    const { default: SltPrepStaffPage } = await import("@/app/slt-prep/staff/page");
    const html = renderToStaticMarkup(
      await SltPrepStaffPage({
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "sofia-alvarez",
        }),
      }),
    );

    expect(html).toContain("/slt-prep?source=staff&amp;traveler=sofia-alvarez");
    expect(html).toContain("/slt-prep/checklist?source=staff&amp;traveler=sofia-alvarez");
    expect(html).toContain("/slt-prep/profile?source=staff&amp;traveler=sofia-alvarez");
    expect(html).toContain("/slt-prep/flights?source=staff&amp;traveler=sofia-alvarez");
    expect(html).toContain("/slt-prep/timeline?source=staff&amp;traveler=sofia-alvarez");
  });
});
