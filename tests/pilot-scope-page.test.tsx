import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/pilot-scope",
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

describe("pilot scope page", () => {
  it("renders the pilot review snapshot for admin reviewers", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing pilot scope page."),
    );

    const { default: PilotScopePage } = await import("@/app/admin/pilot-scope/page");
    const html = renderToStaticMarkup(await PilotScopePage());

    expect(html).toContain("First pilot scope");
    expect(html).toContain("Control review snapshot");
    expect(html).toContain("Recorded now");
    expect(html).toContain("Still blocked");
    expect(html).toContain("Planning default scope is defined");
    expect(html).toContain("Named owners are still missing");
  });
});
