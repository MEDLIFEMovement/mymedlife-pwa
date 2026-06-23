import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/loop",
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

describe("rush month loop page", () => {
  it("opens the local operating-path route with the end-to-end review loop before the review-data notice", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing Rush Month loop page."),
    );

    const { default: RushMonthLoopPage } = await import("@/app/rush-month/loop/page");
    const html = renderToStaticMarkup(await RushMonthLoopPage());

    expect(html).toContain("Rush Month operating loop");
    expect(html).toContain("One operating path, end to end.");
    expect(html).toContain("Walk through the operating path.");
    expect(html).toContain("Review controls");
    expect(html).toContain(
      "Follow the same chapter workflow from assignment through action, proof, review, recognition, and coach support so every handoff stays visible in one place.",
    );
    expect(html).toContain(
      "Use them to inspect each handoff and result state without changing real records or sending anything outward.",
    );
    expect(html).not.toContain("mock-safe local proof");
    expect(html).not.toContain("browser-local simulation");
    expect(html).not.toContain("Supabase writes");
    expect(html).toContain("Audit log");
    expect(html).toContain("Preview data");
    expect(html.indexOf("One operating path, end to end.")).toBeLessThan(
      html.indexOf("Audit log"),
    );
  });
});
