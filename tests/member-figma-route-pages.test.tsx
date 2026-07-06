import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

function getSignedInMember() {
  return getMockLocalActorContext(
    "member.a@mymedlife.test",
    "Using signed-in member actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("member Figma route pages", () => {
  it("renders the source-backed member campaign shell instead of parking campaigns away", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(getSignedInMember());

    const { default: CampaignsPage } = await import("@/app/campaigns/page");
    const html = renderToStaticMarkup(await CampaignsPage());

    expect(html).toContain("Rush Month");
    expect(html).toContain("Campaign KPIs");
    expect(html).toContain("Assigned Actions by Role");
    expect(html).toContain("What Good Looks Like");
    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/proof-library/upload"');
    expect(html).toContain('href="/rush-month/actions"');
  });

  it("renders the member proof library surface instead of parking it into points", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(getSignedInMember());

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const html = renderToStaticMarkup(await ProofLibraryPage());

    expect(html).toContain("Proof library");
    expect(html).toContain("What is happening with my proof?");
    expect(html).toContain("Open member stories");
    expect(html).toContain('href="/proof-library/upload"');
  });
});
