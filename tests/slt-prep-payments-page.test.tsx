import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep/payments",
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

describe("slt prep payments page", () => {
  it("lets the payments route lead with the traveler payment surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt payments page."),
    );

    const { default: SltPrepPaymentsPage } = await import("@/app/slt-prep/payments/page");
    const html = renderToStaticMarkup(await SltPrepPaymentsPage({}));

    expect(html).toContain("Payment Status");
    expect(html).toContain("1-week Peru SLT");
    expect(html).toContain("Current payment lane");
    expect(html).toContain("Current blocker");
    expect(html).toContain("Payment Options");
    expect(html).toContain("Choose a payment option.");
    expect(html).toContain("Payment History");
    expect(html).toContain("Payment Information");
    expect(html).toContain("All payments are securely processed through Shopify.");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps selected traveler context attached on the payments route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected traveler payments page."),
    );

    const { default: SltPrepPaymentsPage } = await import("@/app/slt-prep/payments/page");
    const html = renderToStaticMarkup(
      await SltPrepPaymentsPage({
        searchParams: Promise.resolve({ traveler: "daniel-kim" }),
      }),
    );

    expect(html).toContain("/slt-prep/payments?traveler=daniel-kim");
    expect(html).toContain("/slt-prep/timeline?traveler=daniel-kim");
  });

  it("turns visible payment controls into route-backed mock-safe review states", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing payment route states."),
    );

    const { default: SltPrepPaymentsPage } = await import("@/app/slt-prep/payments/page");
    const html = renderToStaticMarkup(await SltPrepPaymentsPage({}));

    expect(html).toContain("/slt-prep/payments?action=pay_balance#payment-action");
    expect(html).toContain("/slt-prep/payments?action=payment_plan#payment-action");
    expect(html).toContain("/slt-prep/payments?action=receipts#payment-action");
    expect(html).toContain("/slt-prep/checklist/second-installment?source=payments");
  });

  it("keeps selected traveler attached when a payment action preview is open", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing traveler payment action preview."),
    );

    const { default: SltPrepPaymentsPage } = await import("@/app/slt-prep/payments/page");
    const html = renderToStaticMarkup(
      await SltPrepPaymentsPage({
        searchParams: Promise.resolve({
          action: "receipts",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Receipt review stays read-only here.");
    expect(html).toContain("Back to payment status");
    expect(html).toContain("href=\"/slt-prep/payments?traveler=daniel-kim\"");
  });

  it("keeps profile handoff context visible without taking over the payments route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing payments profile handoff."),
    );

    const { default: SltPrepPaymentsPage } = await import("@/app/slt-prep/payments/page");
    const html = renderToStaticMarkup(
      await SltPrepPaymentsPage({
        searchParams: Promise.resolve({
          source: "profile",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Profile opened this prep route for Daniel Kim.");
    expect(html).toContain("Back to profile");
    expect(html).toContain('href="/slt-prep/profile?traveler=daniel-kim"');
    expect(html.indexOf("Current payment lane")).toBeLessThan(
      html.indexOf("Profile opened this prep route for Daniel Kim."),
    );
  });

  it("preserves staff source across payment action previews", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing payments staff handoff preservation."),
    );

    const { default: SltPrepPaymentsPage } = await import("@/app/slt-prep/payments/page");
    const html = renderToStaticMarkup(
      await SltPrepPaymentsPage({
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Staff traveler review opened this prep route for Daniel Kim.");
    expect(html).toContain('href="/slt-prep/payments?action=receipts&amp;source=staff&amp;traveler=daniel-kim#payment-action"');
    expect(html).toContain('href="/slt-prep/payments?action=pay_balance&amp;source=staff&amp;traveler=daniel-kim#payment-action"');
    expect(html).toContain('href="/slt-prep/payments?action=payment_plan&amp;source=staff&amp;traveler=daniel-kim#payment-action"');
  });

  it("keeps the back path inside the staff route set when a payment action is already open", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing payment preview back path."),
    );

    const { default: SltPrepPaymentsPage } = await import("@/app/slt-prep/payments/page");
    const html = renderToStaticMarkup(
      await SltPrepPaymentsPage({
        searchParams: Promise.resolve({
          action: "receipts",
          source: "staff",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain('href="/slt-prep/payments?source=staff&amp;traveler=daniel-kim"');
  });
});
