import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/phase-2",
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

describe("admin phase 2 page", () => {
  it("renders the definition-of-done audit directly in the review route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing Phase 2 page render."),
    );

    const { default: AdminPhase2Page } = await import("@/app/admin/phase-2/page");
    const html = renderToStaticMarkup(await AdminPhase2Page());

    expect(html).toContain("Backend route family");
    expect(html).toContain("Phase 2 closeout");
    expect(html).toContain("Definition of done audit");
    expect(html).toContain("Hosted evidence to collect next");
    expect(html).toContain("Copy-paste approval reply");
    expect(html).toContain("repo ready");
    expect(html).toContain("need signoff");
    expect(html).toContain("need hosted proof");
    expect(html).toContain(
      "Named pilot owners, rollback owner, and support/pause channel are recorded",
    );
    expect(html).toContain("Hosted auth works for the pilot cohort");
    expect(html).toContain(
      "The first hosted write lane `action_started` is enabled and proven in staging",
    );
    expect(html).toContain(
      "The smallest hosted proof/review loop is proven end to end",
    );
    expect(html).toContain(
      "Leader, staff, DS/admin, and audit/outbox views show the correct readback",
    );
    expect(html).toContain("Staging evidence, approval notes, and launch packet separate proven behavior from still-blocked scope");
    expect(html).toContain(
      "The result is controlled live pilot readiness, not full production launch",
    );
    expect(html).toContain("Capture the approved staging reviewer path");
    expect(html).toContain("Capture before/after evidence for the hosted `action_started` write");
    expect(html).toContain("Pilot chapter: UCLA MEDLIFE");
  });
});
