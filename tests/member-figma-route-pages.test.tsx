import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

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
  it("renders campaigns as the student mobile campaign page", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(getSignedInMember());

    const { default: CampaignsPage } = await import("@/app/campaigns/page");
    const html = renderToStaticMarkup(await CampaignsPage());

    expect(html).toContain("Rush Month");
    expect(html).toContain("Current Phase");
    expect(html).toContain("Campaign KPIs");
    expect(html).toContain("Assigned Actions by Role");
    expect(html).toContain("Open event · RSVP · attendance · points");
    expect(html).not.toContain("Campaign operating system");
    expect(html).not.toContain("Campaigns turn SOPs into student action");
  });

  it("renders proof library as the student MEDLIFE Stories feed", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(getSignedInMember());

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const html = renderToStaticMarkup(await ProofLibraryPage());

    expect(html).toContain("Stories");
    expect(html).toContain("MEDLIFE Story");
    expect(html).toContain("Consent and publishing");
    expect(html).toContain("Preview proof upload requirements");
    expect(html).not.toContain("Proof exists to break self-limiting beliefs");
    expect(html).not.toContain("bg-[#071d1a]");
  });
});
