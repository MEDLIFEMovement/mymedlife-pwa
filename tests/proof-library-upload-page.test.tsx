import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/proof-library/upload",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

describe("proof upload page", () => {
  it("opens the proof-upload handoff with proof prep, consent context, and held actions", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: ProofUploadPage } = await import("@/app/proof-library/upload/page");
    const html = renderToStaticMarkup(await ProofUploadPage({}));

    expect(html).toContain("Proof preparation");
    expect(html).toContain("File is prepared, but not saved yet.");
    expect(html).toContain("Consent and context");
    expect(html).toContain("Broader proof actions stay paused.");
    expect(html).toContain("Future proof path");
    expect(html).toContain("Future handoffs stay paused");
    expect(html).toContain("Proof upload path preview");
    expect(html).not.toContain("These actions are intentionally locked.");
    expect(html).not.toContain("Automation-ready, still disabled");
  });

  it("keeps the bridge-video handoff visible when chapter leaders open proof upload from the command center", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: ProofUploadPage } = await import("@/app/proof-library/upload/page");
    const html = renderToStaticMarkup(
      await ProofUploadPage({
        searchParams: Promise.resolve({
          source: "chapter_bridge_video",
          returnTo:
            "/chapter?view=bridge_videos&source=feed_analytics&member=member-maya&q=Sofia&feedPost=feed-post-slt-recap",
        }),
      }),
    );

    expect(html).toContain("From bridge videos");
    expect(html).toContain("Stay in the bridge-video story flow.");
    expect(html).toContain("Back to bridge library");
    expect(html).toContain(
      'href="/chapter?view=bridge_videos&amp;source=feed_analytics&amp;member=member-maya&amp;q=Sofia&amp;feedPost=feed-post-slt-recap"',
    );
  });
});
