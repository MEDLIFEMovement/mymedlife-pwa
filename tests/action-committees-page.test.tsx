import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/action-committees",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

describe("action committees page", () => {
  it("opens the committee workspace route with the role-aware handoff and operating examples", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: ActionCommitteesPage } = await import("@/app/action-committees/page");
    const html = renderToStaticMarkup(await ActionCommitteesPage({}));

    expect(html).toContain("Action committees");
    expect(html).toContain("Role-aware committee workspace");
    expect(html).toContain("What should I do next?");
    expect(html).toContain("Priority event focus");
    expect(html).toContain("Event operating examples");
    expect(html).toContain("Open related campaign");
  });

  it("keeps the chapter-committees handoff visible across the broader committee workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: ActionCommitteesPage } = await import("@/app/action-committees/page");
    const html = renderToStaticMarkup(
      await ActionCommitteesPage({
        searchParams: Promise.resolve({
          source: "chapter_add_committee",
          returnTo: "/chapter?view=committees&committee=committee-events&quickAction=add_committee",
        }),
      }),
    );

    expect(html).toContain("From chapter committees");
    expect(html).toContain("The committee health lane is still the review context.");
    expect(html).toContain("Back to chapter committees");
    expect(html).toContain(
      'href="/chapter?view=committees&amp;committee=committee-events&amp;quickAction=add_committee"',
    );
  });
});
