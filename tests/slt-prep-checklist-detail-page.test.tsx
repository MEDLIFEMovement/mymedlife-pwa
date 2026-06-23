import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound should not be called in this test");
  }),
  usePathname: () => "/slt-prep/checklist/flight-itinerary",
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

describe("slt prep checklist detail page", () => {
  it("lets the checklist detail route lead with the specific task screen only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist detail page."),
    );

    const { default: SltPrepChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await SltPrepChecklistDetailPage({
        params: Promise.resolve({ itemId: "flight-itinerary" }),
      }),
    );

    expect(html).toContain("Flight information submitted");
    expect(html).toContain("Flight Information");
    expect(html).toContain("Related routes");
    expect(html).toContain("Trip timeline");
    expect(html).toContain("Profile &amp; alerts");
    expect(html).toContain("Staff dashboard");
    expect(html).toContain("/slt-prep/timeline");
    expect(html).toContain("/slt-prep/staff");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("turns the primary CTA into a route-backed completion preview and sends support to profile context", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist detail preview."),
    );

    const { default: SltPrepChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await SltPrepChecklistDetailPage({
        params: Promise.resolve({ itemId: "flight-itinerary" }),
        searchParams: Promise.resolve({ preview: "complete" }),
      }),
    );

    expect(html).toContain("/slt-prep/checklist/flight-itinerary?preview=complete#completion-preview");
    expect(html).toContain("Completion preview");
    expect(html).toContain("This item is ready for staff review.");
    expect(html).toContain("/slt-prep/profile#notification-actions");
    expect(html).toContain("/slt-prep/staff");
    expect(html).toContain("/slt-prep/checklist");
  });

  it("preserves notification origin when checklist detail opens from the notification feed", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist notification handoff."),
    );

    const { default: SltPrepChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await SltPrepChecklistDetailPage({
        params: Promise.resolve({ itemId: "second-installment" }),
        searchParams: Promise.resolve({ source: "notifications" }),
      }),
    );

    expect(html).toContain("From notifications");
    expect(html).toContain("This detail opened from a readiness update.");
    expect(html).toContain("Back to notifications");
    expect(html).toContain("href=\"/slt-prep/notifications\"");
  });

  it("preserves flights origin when checklist detail opens from the flights route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist flights handoff."),
    );

    const { default: SltPrepChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await SltPrepChecklistDetailPage({
        params: Promise.resolve({ itemId: "flight-itinerary" }),
        searchParams: Promise.resolve({ source: "flights" }),
      }),
    );

    expect(html).toContain("From flights");
    expect(html).toContain("This detail opened from the traveler flight review.");
    expect(html).toContain("Back to flights");
    expect(html).toContain("href=\"/slt-prep/flights\"");
  });

  it("preserves forms origin when checklist detail opens from the forms route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist forms handoff."),
    );

    const { default: SltPrepChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await SltPrepChecklistDetailPage({
        params: Promise.resolve({ itemId: "medical-clearance" }),
        searchParams: Promise.resolve({ source: "forms" }),
      }),
    );

    expect(html).toContain("From forms");
    expect(html).toContain("This detail opened from the forms hub.");
    expect(html).toContain("Back to forms");
    expect(html).toContain("href=\"/slt-prep/forms\"");
  });

  it("preserves meetings origin when checklist detail opens from the meetings route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist meetings handoff."),
    );

    const { default: SltPrepChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await SltPrepChecklistDetailPage({
        params: Promise.resolve({ itemId: "orientation-rsvp" }),
        searchParams: Promise.resolve({ source: "meetings" }),
      }),
    );

    expect(html).toContain("From meetings");
    expect(html).toContain("This detail opened from the meetings route.");
    expect(html).toContain("Back to meetings");
    expect(html).toContain("href=\"/slt-prep/meetings\"");
  });

  it("preserves extensions origin when checklist detail opens from the extensions route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist extensions handoff."),
    );

    const { default: SltPrepChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await SltPrepChecklistDetailPage({
        params: Promise.resolve({ itemId: "extension-choice" }),
        searchParams: Promise.resolve({ source: "extensions" }),
      }),
    );

    expect(html).toContain("From extensions");
    expect(html).toContain("This detail opened from extensions and tours.");
    expect(html).toContain("Back to extensions");
    expect(html).toContain("href=\"/slt-prep/extensions\"");
  });

  it("preserves staff origin and selected traveler when checklist detail opens from the staff dashboard", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist staff handoff."),
    );

    const { default: SltPrepChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await SltPrepChecklistDetailPage({
        params: Promise.resolve({ itemId: "flight-itinerary" }),
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "sofia-alvarez",
        }),
      }),
    );

    expect(html).toContain("From staff dashboard");
    expect(html).toContain("This detail opened from staff traveler review.");
    expect(html).toContain("Back to staff dashboard");
    expect(html).toContain("href=\"/slt-prep/staff?traveler=sofia-alvarez\"");
  });

  it("keeps traveler and origin context in completion and support links", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt checklist completion context."),
    );

    const { default: SltPrepChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await SltPrepChecklistDetailPage({
        params: Promise.resolve({ itemId: "flight-itinerary" }),
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "sofia-alvarez",
          preview: "complete",
        }),
      }),
    );

    expect(html).toContain(
      "/slt-prep/checklist/flight-itinerary?source=staff&amp;traveler=sofia-alvarez&amp;preview=complete#completion-preview",
    );
    expect(html).toContain("/slt-prep/profile?source=staff&amp;traveler=sofia-alvarez#notification-actions");
    expect(html).toContain("href=\"/slt-prep/staff?traveler=sofia-alvarez\"");
    expect(html).toContain("Back to staff dashboard");
    expect(html).toContain("href=\"/slt-prep/flights?source=staff&amp;traveler=sofia-alvarez\"");
  });
});
