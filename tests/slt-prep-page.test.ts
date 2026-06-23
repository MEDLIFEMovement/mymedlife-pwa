import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  buildChecklistCards,
  buildOverviewCtas,
} from "@/app/slt-prep/overview-helpers";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getSltTripPrepWorkspace } from "@/services/slt-trip-prep-workspace";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep",
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

describe("slt prep overview page helpers", () => {
  it("builds CTA cards that match the overview routing hub from the mockup", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor);
    const ctas = buildOverviewCtas(workspace);

    expect(ctas).toEqual([
      expect.objectContaining({
        eyebrow: "Complete Next Step",
        href: "/slt-prep/checklist/flight-itinerary?source=overview",
        title: "Return flight still needs final confirmation",
      }),
      expect.objectContaining({
        eyebrow: "Staff Dashboard Access",
        href: "/slt-prep/staff",
        title: "Traveler Readiness Dashboard",
      }),
    ]);
  });

  it("uses the prototype-aligned Travel Details label on the overview checklist", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor);
    const cards = buildChecklistCards(workspace);

    expect(cards.map((card) => card.label)).toEqual([
      "Payments",
      "Required Forms",
      "Travel Details",
      "Meetings",
      "Extensions / Extra Tours",
      "Packing & Preparation",
    ]);
    expect(cards.find((card) => card.label === "Payments")).toEqual(
      expect.objectContaining({
        href: "/slt-prep/checklist/second-installment?source=overview",
        pill: "Action needed",
      }),
    );
    expect(cards.find((card) => card.label === "Required Forms")).toEqual(
      expect.objectContaining({
        href: "/slt-prep/checklist/medical-clearance?source=overview",
        pill: "Due soon",
      }),
    );
    expect(cards.find((card) => card.label === "Travel Details")).toEqual(
      expect.objectContaining({
        href: "/slt-prep/checklist/flight-itinerary?source=overview",
        pill: "Action needed",
      }),
    );
    expect(cards.find((card) => card.label === "Meetings")).toEqual(
      expect.objectContaining({
        href: "/slt-prep/checklist/orientation-rsvp?source=overview",
        pill: "Due soon",
      }),
    );
    expect(cards.find((card) => card.label === "Extensions / Extra Tours")).toEqual(
      expect.objectContaining({
        href: "/slt-prep/checklist/extension-choice?source=overview",
        pill: "Pending",
      }),
    );
  });

  it("keeps selected traveler context attached when overview opens the full timeline", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected traveler overview page."),
    );

    const { default: SltPrepPage } = await import("@/app/slt-prep/page");
    const html = renderToStaticMarkup(
      await SltPrepPage({
        searchParams: Promise.resolve({ traveler: "daniel-kim" }),
      }),
    );

    expect(html).toContain("/slt-prep/timeline?traveler=daniel-kim");
  });

  it("preserves staff source across overview traveler routes for a selected traveler", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected traveler overview staff handoff."),
    );

    const { default: SltPrepPage } = await import("@/app/slt-prep/page");
    const html = renderToStaticMarkup(
      await SltPrepPage({
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("/slt-prep/timeline?source=staff&amp;traveler=daniel-kim");
    expect(html).toContain("/slt-prep/staff?source=staff&amp;traveler=daniel-kim");
    expect(html).toContain("/slt-prep/checklist/flight-itinerary?source=overview&amp;traveler=daniel-kim");
    expect(html).toContain("/slt-prep/checklist/second-installment?source=overview&amp;traveler=daniel-kim");
    expect(html).toContain("/slt-prep/checklist/orientation-rsvp?source=overview&amp;traveler=daniel-kim");
  });
});

describe("slt prep overview page", () => {
  it("keeps DS Admin on admin safety routes when SLT prep is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing DS-blocked SLT prep page."),
    );

    const { default: SltPrepPage } = await import("@/app/slt-prep/page");
    const html = renderToStaticMarkup(await SltPrepPage({}));

    expect(html).toContain("Trip prep is hidden for DS Admin");
    expect(html).toContain('href="/admin/integration-outbox"');
    expect(html).toContain(">Open integration outbox<");
  });

  it("lets the overview route lead with the trip-readiness surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor);

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(actor);
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt overview page."),
    );

    const { default: SltPrepPage } = await import("@/app/slt-prep/page");
    const html = renderToStaticMarkup(await SltPrepPage({}));

    expect(html).toContain("Peru SLT");
    expect(html).toContain("Readiness Score");
    expect(html).toContain(`${workspace.readiness.score}%`);
    expect(html).toContain("SLT Deadlines");
    expect(html).toContain("Checklist");
    expect(html).toContain("Traveler Readiness Dashboard");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });
});
