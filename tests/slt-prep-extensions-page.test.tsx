import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep/extensions",
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

describe("slt prep extensions page", () => {
  it("lets the extensions route lead with the add-on planning surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt extensions page."),
    );

    const { default: SltPrepExtensionsPage } = await import("@/app/slt-prep/extensions/page");
    const html = renderToStaticMarkup(await SltPrepExtensionsPage({}));

    expect(html).toContain("Extensions &amp; Tours");
    expect(html).toContain("Selected option");
    expect(html).toContain("Optional add-on posture");
    expect(html).toContain("Current blocker");
    expect(html).toContain("Machu Picchu extension");
    expect(html).toContain("$95 add-on");
    expect(html).toContain("What is selected and what is still open?");
    expect(html).toContain("/slt-prep/checklist/extension-choice?source=extensions");
    expect(html).not.toContain("Extensions picture");
    expect(html).not.toContain("Decision watchout");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps selected traveler context attached on the extensions route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected traveler extensions page."),
    );

    const { default: SltPrepExtensionsPage } = await import("@/app/slt-prep/extensions/page");
    const html = renderToStaticMarkup(
      await SltPrepExtensionsPage({
        searchParams: Promise.resolve({ traveler: "daniel-kim" }),
      }),
    );

    expect(html).toContain("Extensions &amp; Tours");
    expect(html).toContain("/slt-prep/forms?traveler=daniel-kim");
    expect(html).toContain("/slt-prep/checklist/extension-choice?source=extensions&amp;traveler=daniel-kim");
    expect(html).toContain("/slt-prep/payments?traveler=daniel-kim");
  });

  it("keeps profile handoff context visible without taking over the extensions route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing extensions profile handoff."),
    );

    const { default: SltPrepExtensionsPage } = await import("@/app/slt-prep/extensions/page");
    const html = renderToStaticMarkup(
      await SltPrepExtensionsPage({
        searchParams: Promise.resolve({
          source: "profile",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Profile opened this prep route for Daniel Kim.");
    expect(html).toContain("Back to profile");
    expect(html).toContain('href="/slt-prep/profile?traveler=daniel-kim"');
    expect(html.indexOf("Selected option")).toBeLessThan(
      html.indexOf("Profile opened this prep route for Daniel Kim."),
    );
  });

  it("preserves staff source on nearby traveler routes while extensions is open", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing extensions staff handoff preservation."),
    );

    const { default: SltPrepExtensionsPage } = await import("@/app/slt-prep/extensions/page");
    const html = renderToStaticMarkup(
      await SltPrepExtensionsPage({
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Staff traveler review opened this prep route for Daniel Kim.");
    expect(html).toContain('href="/slt-prep/staff?traveler=daniel-kim"');
    expect(html).toContain('href="/slt-prep/payments?source=staff&amp;traveler=daniel-kim"');
  });
});
