import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/review",
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

describe("rush month review page", () => {
  it("opens the leader proof-review route with follow-up accountability and decision posture", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing rush month review page."),
    );

    const { default: ReviewPage } = await import("@/app/rush-month/review/page");
    const html = renderToStaticMarkup(await ReviewPage({}));

    expect(html).toContain("Chapter proof follow-up");
    expect(html).toContain("Leader proof review");
    expect(html).toContain("Keep proof accountable without taking over HQ sharing.");
    expect(html).toContain("Chapter follow-up");
    expect(html).toContain("Chapter decisions");
    expect(html).toContain("Leaders can follow up; HQ controls sharing");
    expect(html).toContain("Chapter proof decision board");
    expect(html).toContain("/chapter/members");
    expect(html).not.toContain("Proof sharing desk");
    expect(html).not.toContain("Approve for later sharing");
    expect(html).not.toContain("Sharing decision unavailable");
    expect(html).not.toContain("Sharing decision outcomes");
    expect(html).not.toContain("Chapter decision outcomes");
    expect(html).not.toContain("Chapter decision preview");
    expect(html).not.toContain("Chapter decision unavailable");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("keeps the HQ sharing queue visible for admin-owned review context", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin rush month review page."),
    );

    const { default: ReviewPage } = await import("@/app/rush-month/review/page");
    const html = renderToStaticMarkup(await ReviewPage({}));

    expect(html).toContain("HQ proof-sharing review");
    expect(html).toContain("Proof sharing desk");
    expect(html).toContain("Approve for later sharing");
    expect(html).toContain("Sharing decision unavailable");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("keeps the technical leader decision diagnostics limited to super-admin review", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing super admin rush month review page."),
    );

    const { default: ReviewPage } = await import("@/app/rush-month/review/page");
    const html = renderToStaticMarkup(await ReviewPage({}));

    expect(html).toContain("Chapter decision outcomes");
    expect(html).toContain("Chapter decision preview");
    expect(html).toContain("Chapter decision unavailable");
    expect(html).toContain("HQ proof-sharing review");
    expect(html).toContain("Sharing decision outcomes");
  });
});
