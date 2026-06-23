import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound should not be called in this test");
  }),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  usePathname: () => "/rush-month/evidence",
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

describe("member proof handoff loop", () => {
  it("links proof queue, submit evidence, and post-submit return paths together", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member proof handoff."),
    );

    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");
    const evidenceHtml = renderToStaticMarkup(
      await EvidencePage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(evidenceHtml).toContain("Turn your action into one believable story.");
    expect(evidenceHtml).toContain("Open submit evidence");
    expect(evidenceHtml).toContain(
      'href="/rush-month/actions/share-rush-flyer?step=submit&amp;source=evidence#submit-evidence"',
    );
    expect(evidenceHtml).toContain("Open linked action");

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const submitHtml = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "share-rush-flyer" }),
        searchParams: Promise.resolve({
          source: "evidence",
          step: "submit",
        }),
      }),
    );

    expect(submitHtml).toContain("Submit Evidence");
    expect(submitHtml).toContain("From proof");
    expect(submitHtml).toContain("Back to proof");
    expect(submitHtml).toContain('href="/rush-month/evidence"');
    expect(submitHtml).toContain(
      "You are submitting from the proof handoff. Keep the note, screenshot, or story tied to the specific action your proof queue surfaced.",
    );
    expect(submitHtml).toContain(
      'action="/rush-month/actions/share-rush-flyer?step=submitted&amp;source=evidence#submit-evidence"',
    );

    const submittedHtml = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "share-rush-flyer" }),
        searchParams: Promise.resolve({
          source: "evidence",
          step: "submitted",
        }),
      }),
    );

    expect(submittedHtml).toContain("Submitted for Review");
    expect(submittedHtml).toContain("See your proof queue");
    expect(submittedHtml).toContain('href="/rush-month/evidence"');
    expect(submittedHtml).toContain("Edit evidence");
    expect(submittedHtml).toContain("Back to action details");
  });
});
