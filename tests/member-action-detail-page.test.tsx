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
  usePathname: () => "/rush-month/actions/member-push",
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

describe("member action detail page", () => {
  it("lets the member action-detail route lead with the mobile task surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action detail page."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
      }),
    );

    expect(html).toContain("Action Detail");
    expect(html).toContain("Submit evidence");
    expect(html.match(/Evidence Required/g)?.length).toBe(1);
    expect(html.match(/Submit evidence/g)?.length).toBe(1);
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Submit state");
    expect(html).not.toContain('id="submit-evidence"');
    expect(html).not.toContain("After you submit");
    expect(html).not.toContain("See your proof queue");
    expect(html).not.toContain("Back to all actions");
    expect(html).not.toContain("Action flow");
    expect(html).not.toContain("Member action detail");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("opens the submit-evidence state on the same member action route when the route step asks for it", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action submit state."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({ step: "submit" }),
      }),
    );

    expect(html).toContain("Submit Evidence");
    expect(html).toContain("Back to action details");
    expect(html).toContain('id="submit-evidence"');
    expect(html).toContain("href=\"/rush-month/actions/member-push\"");
    expect(html).not.toContain("Action Detail");
    expect(html).not.toContain("Why This Matters");
    expect(html).not.toContain("After you submit");
    expect(html).not.toContain("See your proof queue");
    expect(html).not.toContain("This mirrors the prototype clickthrough");
    expect(html).toContain(
      "Share one clear screenshot, link, or short note.",
    );
    expect(html).toContain(
      "Add one short note below so the screenshot still tells a clear proof story.",
    );
    expect(html).toContain(
      "This action is still worth",
    );
    expect(html).toContain("Points move once the proof is approved.");
    expect(html).not.toContain("Upload stays mock-only here.");
    expect(html).not.toContain("Local confirmation only.");
  });

  it("preserves event context when the member action route is opened from event detail", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action event handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          step: "submit",
          event: "event-rush-social-001",
        }),
      }),
    );

    expect(html).toContain("From event");
    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("Back to event detail");
    expect(html).toContain("href=\"/rush-month/events/event-rush-social-001\"");
    expect(html).toContain("href=\"/rush-month/actions/member-push?event=event-rush-social-001&amp;source=events\"");
    expect(html.indexOf("From event")).toBeLessThan(
      html.indexOf("Submit Evidence"),
    );
  });

  it("keeps the action-detail hero first when home context is attached on the default member route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action home detail handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "home",
        }),
      }),
    );

    expect(html).toContain("Action Detail");
    expect(html).toContain("From home");
    expect(html).toContain(
      "Keep the action tied to the weekly priority you opened from the home route so the member loop still feels like one clear next step.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain("href=\"/\"");
    expect(html.indexOf("Action Detail")).toBeLessThan(html.indexOf("From home"));
  });

  it("keeps campaign context attached when the member action route was opened from a campaign event", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action campaign event handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          event: "event-rush-med-talk-001",
          source: "campaigns",
          step: "submit",
        }),
      }),
    );

    expect(html).toContain("Intro GBM");
    expect(html).toContain("Back to event detail");
    expect(html).toContain("href=\"/rush-month/events/event-rush-med-talk-001?source=campaigns\"");
    expect(html).toContain(
      "href=\"/rush-month/actions/member-push?event=event-rush-med-talk-001&amp;source=campaigns\"",
    );
  });

  it("keeps home context attached when the member action route was opened from a home event card", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action home event handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          event: "event-rush-social-001",
          source: "home",
          step: "submit",
        }),
      }),
    );

    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("Back to event detail");
    expect(html).toContain("href=\"/rush-month/events/event-rush-social-001?source=home\"");
    expect(html).toContain(
      "href=\"/rush-month/actions/member-push?event=event-rush-social-001&amp;source=home\"",
    );
  });

  it("preserves points context when the member action route is opened from recognition", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action points handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "points",
          step: "submit",
        }),
      }),
    );

    expect(html).toContain("From points");
    expect(html).toContain(
      "You are submitting from the recognition handoff. Keep the proof clear enough that the later review can explain why the points should move.",
    );
    expect(html).toContain("Back to points");
    expect(html).toContain("href=\"/rush-month/leaderboard\"");
    expect(html).toContain("href=\"/rush-month/actions/member-push?source=points\"");
    expect(html.indexOf("From points")).toBeLessThan(
      html.indexOf("Submit Evidence"),
    );
  });

  it("preserves profile context when the member action route is opened from the member profile", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action profile handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "profile",
          step: "submit",
        }),
      }),
    );

    expect(html).toContain("From profile");
    expect(html).toContain(
      "You are submitting from the profile handoff. Keep the proof tied to the member task your profile surfaced as the next thing to finish.",
    );
    expect(html).toContain("Back to profile");
    expect(html).toContain("href=\"/profile\"");
    expect(html).toContain("href=\"/rush-month/actions/member-push?source=profile\"");
    expect(html.indexOf("From profile")).toBeLessThan(
      html.indexOf("Submit Evidence"),
    );
  });

  it("preserves proof-queue context when the member action route is opened from evidence", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action evidence handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "evidence",
          step: "submit",
        }),
      }),
    );

    expect(html).toContain("From proof");
    expect(html).toContain(
      "You are submitting from the proof handoff. Keep the note, screenshot, or story tied to the specific action your proof queue surfaced.",
    );
    expect(html).toContain("Back to proof");
    expect(html).toContain("href=\"/rush-month/evidence\"");
    expect(html).toContain("href=\"/rush-month/actions/member-push?source=evidence\"");
    expect(html.indexOf("From proof")).toBeLessThan(
      html.indexOf("Submit Evidence"),
    );
  });

  it("routes a direct leader landing back into the broader actions lane instead of rendering the member task route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader action-detail ownership."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );

    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/rush-month/actions");
  });
});
