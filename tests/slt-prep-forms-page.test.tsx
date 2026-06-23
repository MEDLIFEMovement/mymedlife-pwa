import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep/forms",
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

describe("slt prep forms page", () => {
  it("lets the forms route lead with the traveler forms surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt forms page."),
    );

    const { default: SltPrepFormsPage } = await import("@/app/slt-prep/forms/page");
    const html = renderToStaticMarkup(await SltPrepFormsPage({}));

    expect(html).toContain("Required Forms Hub");
    expect(html).toContain("Review queue");
    expect(html).toContain("Submitted and review-ready forms");
    expect(html).toContain("Current blocker");
    expect(html).toContain("Media consent");
    expect(html).toContain("Needs signature by June 23, 2026");
    expect(html).toContain("Form status and next steps");
    expect(html).toContain(
      "Keep the source visible so the traveler knows exactly where the next handoff lives.",
    );
    expect(html).toContain("/slt-prep/checklist/medical-clearance?source=forms");
    expect(html).not.toContain("Forms picture");
    expect(html).not.toContain("Forms watchout");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Readable, reviewable, and mock-safe");
  });

  it("can render a selected traveler forms route with traveler-safe subnav links", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected traveler forms page."),
    );

    const { default: SltPrepFormsPage } = await import("@/app/slt-prep/forms/page");
    const html = renderToStaticMarkup(
      await SltPrepFormsPage({
        searchParams: Promise.resolve({ traveler: "daniel-kim" }),
      }),
    );

    expect(html).toContain("Required Forms Hub");
    expect(html).toContain("/slt-prep/checklist?traveler=daniel-kim");
    expect(html).toContain("/slt-prep/staff?traveler=daniel-kim");
    expect(html).toContain("/slt-prep/checklist/medical-clearance?source=forms&amp;traveler=daniel-kim");
  });

  it("keeps notification handoff context visible on the forms route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing forms notification handoff."),
    );

    const { default: SltPrepFormsPage } = await import("@/app/slt-prep/forms/page");
    const html = renderToStaticMarkup(
      await SltPrepFormsPage({
        searchParams: Promise.resolve({
          source: "notifications",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Notifications opened this prep route for Daniel Kim.");
    expect(html).toContain("Back to notifications");
    expect(html).toContain('href="/slt-prep/notifications?traveler=daniel-kim"');
    expect(html.indexOf("Review queue")).toBeLessThan(
      html.indexOf("Notifications opened this prep route for Daniel Kim."),
    );
  });
});
