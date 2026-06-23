import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/coach",
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

describe("coach page", () => {
  it("returns chapter leaders to chapter home when the coach route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing blocked coach page."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(await CoachPage({}));

    expect(html).toContain("This coach command center is not visible to this role.");
    expect(html).toContain('href="/chapter?view=overview"');
    expect(html).toContain(">Open chapter home<");
  });

  it("keeps DS Admin on admin safety lanes when the coach route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing DS-blocked coach page."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(await CoachPage({}));

    expect(html).toContain('href="/admin"');
    expect(html).toContain(">Open integration outbox<");
  });

  it("lets the default coach route open as a coach-owned portfolio surface without review-only data chrome", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach page."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(await CoachPage({}));

    expect(html).toContain("Coach Dashboard");
    expect(html).toContain("Assigned portfolio");
    expect(html).toContain("AI Weekly Summary");
    expect(html).toContain("Chapter Portfolio");
    expect(html).toContain("Portfolio Overview");
    expect(html).toContain("Coaching Priorities");
    expect(html).toContain("Open chapter");
    expect(html).toContain("Write coach note");
    expect(html).toContain("Review risk reports");
    expect(html).toContain("Focus intervene now");
    expect(html).toContain("Risk");
    expect(html).toContain("Campus");
    expect(html).toContain("Campaign");
    expect(html).toContain("Ownership");
    expect(html).toContain("Coach views");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html.indexOf("Coach Dashboard")).toBeLessThan(html.indexOf("Coach views"));
    expect(html.indexOf("AI Weekly Summary")).toBeLessThan(html.indexOf("Portfolio Overview"));
    expect(html.indexOf("Portfolio Overview")).toBeLessThan(
      html.indexOf("Coaching Priorities"),
    );
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
    expect(html).not.toContain("Coach review lane");
    expect(html).not.toContain("Coach decision path");
    expect(html).not.toContain("Coach decision write remains disabled");
    expect(html).not.toContain("Risk readout");
    expect(html).not.toContain("Local preview only");
    expect(html).not.toContain("Use these notes to prepare the next coach check-in");
  });

  it("shows the member-home handoff when the coach lens is opened from the home role jump", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach role-jump handoff."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "chapters",
          source: "member_home",
        }),
      }),
    );

    expect(html).toContain("Member app handoff");
    expect(html).toContain("Opened from UCLA MEDLIFE into Coach Dashboard");
    expect(html).toContain("Switch View buttons");
    expect(html).toContain("AI Weekly Summary");
    expect(html).toContain("Chapter Portfolio");
    expect(html).toContain("Open chapter");
    expect(html).toContain("Write coach note");
    expect(html).toContain("Review risk reports");
    expect(html).toContain("Student view");
    expect(html.indexOf("Student view")).toBeLessThan(html.indexOf("Coach Dashboard"));
    expect(html.indexOf("Opened from UCLA MEDLIFE into Coach Dashboard")).toBeLessThan(
      html.indexOf("Avg Health"),
    );
    expect(html.indexOf("AI Weekly Summary")).toBeLessThan(html.indexOf("Portfolio Overview"));
    expect(html.indexOf("Coach Dashboard")).toBeLessThan(html.indexOf("Coach views"));
    expect(html).toContain("/coach?view=chapter_detail&amp;source=member_home&amp;chapter=chapter-northview");
    expect(html).toContain("/coach?view=support_notes&amp;source=member_home#support-notes");
    expect(html).toContain("/coach?view=chapters&amp;source=member_home&amp;risk=high");
    expect(html).toContain(
      'href="/local-preview?selectedEmail=member.a%40mymedlife.test&amp;returnTo=%2F"',
    );
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
    expect(html).not.toContain("Coach review lane");
    expect(html).not.toContain("Coach decision path");
    expect(html).not.toContain("Coach decision write remains disabled");
    expect(html).not.toContain("Risk readout");
    expect(html).not.toContain("Local preview only");
    expect(html).not.toContain("Use these notes to prepare the next coach check-in");
  });

  it("keeps filtered chapter drill-in controls on the coach-owned route instead of leaking back to staff", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach chapter drill-in page."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "chapters",
          risk: "high",
        }),
      }),
    );

    expect(html).toContain("Current support posture");
    expect(html).toContain("/coach?view=chapter_detail&amp;risk=high");
    expect(html).not.toContain('action="/staff"');
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("lets the coach route open a dedicated support-notes state from the coach-owned navigation", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach support notes state."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "support_notes",
        }),
      }),
    );

    expect(html).toContain("Coach views");
    expect(html).toContain("Support Notes");
    expect(html).toContain("Coach note lane");
    expect(html).toContain("Coach notes");
    expect(html).toContain("Coach support notes");
    expect(html).not.toContain('action="/staff"');
    expect(html).not.toContain("Coach review lane");
    expect(html).not.toContain("Coach decision path");
    expect(html).not.toContain("Coach decision write remains disabled");
    expect(html).not.toContain("Risk readout");
    expect(html).not.toContain("Locked coach note save");
    expect(html).not.toContain("Use these notes to prepare the next coach check-in");
  });

  it("preserves selected chapter and review context when the coach moves into support notes", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach support notes handoff."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "support_notes",
          chapter: "chapter-ucsd",
          feedDraft: "proof-florida-event-recap-feed",
          feedPost: "feed-post-faith-story",
          feedRole: "leader",
          feedAudience: "selected_chapters",
        }),
      }),
    );

    expect(html).toContain("Support Notes");
    expect(html).toContain("Notes focus");
    expect(html).toContain("Reviewing UCSD MEDLIFE");
    expect(html).toContain("Chapter UCSD MEDLIFE");
    expect(html).toContain("Return to chapter detail");
    expect(html).toContain("Review risk reports");
    expect(html).toContain("Feed analytics source");
    expect(html).toContain("Return to feed analytics");
    expect(html).toContain(
      "/coach?chapter=chapter-ucsd&amp;feedAudience=selected_chapters&amp;feedDraft=proof-florida-event-recap-feed&amp;feedPost=feed-post-faith-story&amp;feedRole=leader&amp;view=support_notes#support-notes",
    );
    expect(html).toContain(
      "/coach?chapter=chapter-ucsd&amp;feedAudience=selected_chapters&amp;feedDraft=proof-florida-event-recap-feed&amp;feedPost=feed-post-faith-story&amp;feedRole=leader&amp;view=chapter_detail",
    );
    expect(html).toContain(
      "/coach?view=feed_analytics&amp;campaign=rush-month&amp;feedDraft=proof-florida-event-recap-feed&amp;feedPost=feed-post-faith-story&amp;feedRole=leader&amp;feedAudience=selected_chapters",
    );
    expect(html).not.toContain('action="/staff"');
    expect(html).not.toContain("Locked coach decision save");
    expect(html).not.toContain("Locked external automation");
  });

  it("treats the campaigns lane as a coach-owned subpage instead of an unframed fallback", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach campaigns state."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "campaigns",
          campaign: "rush-month",
        }),
      }),
    );

    expect(html).toContain("Coach views");
    expect(html).toContain("Campaigns");
    expect(html).toContain("Campaign Operations");
    expect(html).toContain("Rush Month - Chapter Execution");
    expect(html).toContain("What should the coach move first this week?");
    expect(html).not.toContain('action="/staff"');
  });

  it("keeps chapter and review context visible when the coach opens campaigns from a selected chapter lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach campaigns handoff."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "campaigns",
          campaign: "rush-month",
          chapter: "chapter-ucsd",
          decision: "intervene",
          feedDraft: "proof-florida-event-recap-feed",
          feedPost: "feed-post-faith-story",
          feedRole: "leader",
          feedAudience: "selected_chapters",
        }),
      }),
    );

    expect(html).toContain("Campaign focus");
    expect(html).toContain("Campaign support for UCSD MEDLIFE");
    expect(html).toContain("Return to chapter detail");
    expect(html).toContain(
      "/coach?view=chapter_detail&amp;campaign=rush-month&amp;chapter=chapter-ucsd&amp;decision=intervene&amp;feedDraft=proof-florida-event-recap-feed&amp;feedPost=feed-post-faith-story&amp;feedRole=leader&amp;feedAudience=selected_chapters",
    );
    expect(html).not.toContain('action="/staff"');
  });

  it("renders the feed studio route as a real coach-owned fallback screen when opened from a best-practice handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach feed studio best-practice handoff."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "feed_studio",
          bestPractice: "practice-why-i-travel",
          practiceCampaign: "moving_mountains",
          practiceCountry: "mexico",
        }),
      }),
    );

    expect(html).toContain("Coach views");
    expect(html).toContain("Feed Curation Studio");
    expect(html).toContain("Best practice source");
    expect(html).toContain("Opened from the best-practice library");
    expect(html).toContain("Return to best practices");
    expect(html).not.toContain("Coach review lane");
    expect(html).not.toContain("Coach decision path");
    expect(html).not.toContain("What should the coach move first this week?");
    expect(html).not.toContain('action="/staff"');
  });

  it("opens feed analytics as the shared analytics surface instead of stacking the generic coach overview first", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach feed analytics surface."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
        }),
      }),
    );

    expect(html).toContain("Coach views");
    expect(html).toContain("Feed Analytics");
    expect(html).toContain("Post Performance");
    expect(html).not.toContain("Which support signals are moving across assigned chapters?");
    expect(html).not.toContain("Current coach posture");
    expect(html).not.toContain('action="/staff"');
  });

  it("renders the best-practices route as a real coach-owned fallback screen with selected state preserved", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach best-practice selection route."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "best_practices",
          bestPractice: "practice-why-i-travel",
          practiceCampaign: "moving_mountains",
          practiceCountry: "mexico",
        }),
      }),
    );

    expect(html).toContain("Coach views");
    expect(html).toContain("Best Practices Library");
    expect(html).toContain("Selected practice");
    expect(html).toContain("Selected for sharing");
    expect(html).toContain("Why I Travel");
    expect(html).not.toContain("Coach review lane");
    expect(html).not.toContain("Coach decision path");
    expect(html).not.toContain("What should the coach move first this week?");
    expect(html).not.toContain('action="/staff"');
  });

  it("uses a coach-owned chapter-detail state instead of falling back to the staff route family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach chapter detail state."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "chapter_detail",
          chapter: "chapter-ucsd",
          risk: "high",
        }),
      }),
    );

    expect(html).toContain("Coach chapter detail");
    expect(html).toContain("UCSD MEDLIFE");
    expect(html).toContain("Assigned portfolio");
    expect(html).toContain("Write coach note");
    expect(html).toContain("Review risk reports");
    expect(html).toContain("Open campaign support");
    expect(html).toContain("Current support posture");
    expect(html).toContain("Return to chapter list");
    expect(html).not.toContain("Assigned chapter detail");
    expect(html).toContain("/coach?view=chapter_detail&amp;risk=high");
    expect(html).not.toContain('action="/staff"');
    expect(html).not.toContain("Coach review lane");
    expect(html).not.toContain("Coach decision path");
    expect(html).not.toContain("Coach decision write remains disabled");
    expect(html).not.toContain("Risk readout");
  });

  it("keeps feed-analytics source context visible when a coach opens chapter detail from engagement review", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach analytics handoff state."),
    );

    const { default: CoachPage } = await import("@/app/coach/page");
    const html = renderToStaticMarkup(
      await CoachPage({
        searchParams: Promise.resolve({
          view: "chapter_detail",
          chapter: "chapter-ucsd",
          feedDraft: "proof-florida-event-recap-feed",
          feedPost: "feed-post-faith-story",
          feedRole: "leader",
          feedAudience: "selected_chapters",
        }),
      }),
    );

    expect(html).toContain("Coach chapter detail");
    expect(html).toContain("UCSD");
    expect(html).toContain("Feed analytics source");
    expect(html).toContain("Opened from a feed-engagement review");
    expect(html).toContain("Return to feed analytics");
    expect(html).toContain("Switch assigned chapter");
    expect(html).toContain(
      "/coach?view=feed_analytics&amp;campaign=rush-month&amp;feedDraft=proof-florida-event-recap-feed&amp;feedPost=feed-post-faith-story&amp;feedRole=leader&amp;feedAudience=selected_chapters",
    );
    expect(html).not.toContain('action="/staff"');
    expect(html).not.toContain("Coach review lane");
    expect(html).not.toContain("Coach decision path");
    expect(html).not.toContain("Coach decision write remains disabled");
    expect(html).not.toContain("Risk readout");
  });
});
