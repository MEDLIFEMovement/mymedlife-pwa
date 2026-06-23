import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/chapter",
  useSearchParams: () => new URLSearchParams(),
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

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

describe("chapter page", () => {
  it("returns members to the owned student surface instead of showing the off-contract chapter snapshot", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member redirect from chapter route."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");

    await expect(ChapterPage({})).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("returns coaches to the coach-owned surface instead of showing the chapter snapshot fallback", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach redirect from chapter route."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");

    await expect(ChapterPage({})).rejects.toThrow("NEXT_REDIRECT:/coach?view=chapters");
  });

  it("opens the default chapter route with the leader home surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter home page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(await ChapterPage({}));
    expect(html).toContain("Chapter Leadership Home");
    expect(html).toContain("Boston College MEDLIFE");
    expect(html).toContain(
      "Activate Member Engagement committee, collect bridge videos from all chairs, and push the SLT sign-up campaign.",
    );
    expect(html).toContain("Member Engagement committee has no chair — inactive for 3 weeks");
    expect(html).toContain(
      "Fundraising committee has low activity — only 9 actions completed this month",
    );
    expect(html).toContain("No bridge videos submitted this month from 3 of 7 committees");
    expect(html).toContain("Follow-up overdue after &#x27;Tabling: Quad Recruitment&#x27; (Jun 15)");
    expect(html).toContain("This Week&#x27;s Priority");
    expect(html).toContain("Quick Actions");
    expect(html).toMatch(
      /<a[^>]*href="\/chapter\?view=leaderboard"[^>]*>Leaderboard<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/chapter\?view=members"[^>]*>Member Pipeline<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/chapter\?view=member_profile"[^>]*>Member Profile<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/chapter\?view=committees"[^>]*>Committees<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/chapter\?view=events&amp;quickAction=create_event"[^>]*>Create Event<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/chapter\?view=members&amp;pipeline=follow_up&amp;quickAction=assign_action"[^>]*>Assign Action<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/chapter\?view=members&amp;quickAction=review_members"[^>]*>Review Members<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/chapter\?view=succession&amp;quickAction=promote_emerging_leader"[^>]*>Promote Emerging Leader<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/chapter\?view=bridge_videos&amp;quickAction=share_bridge_video"[^>]*>Share Bridge Video<\/a>/,
    );
    expect(html.match(/>Create Event</g)?.length).toBe(2);
    expect(html.match(/>Assign Action</g)?.length).toBe(2);
    expect(html).not.toMatch(
      /<a[^>]*href="\/chapter\?view=leaderboard&amp;member=member-zara"[^>]*>Leaderboard<\/a>/,
    );
    expect(html).not.toMatch(
      /<a[^>]*href="\/chapter\?view=members&amp;member=member-zara"[^>]*>Member Pipeline<\/a>/,
    );
    expect(html).not.toMatch(
      /<a[^>]*href="\/chapter\?view=committees&amp;committee=committee-recruitment"[^>]*>Committees<\/a>/,
    );
    expect(html).not.toMatch(
      /<a[^>]*href="\/chapter\?view=events&amp;member=member-zara&amp;quickAction=create_event"[^>]*>Create Event<\/a>/,
    );
    expect(html).not.toMatch(
      /<a[^>]*href="\/chapter\?view=members&amp;member=member-zara&amp;pipeline=follow_up&amp;quickAction=assign_action"[^>]*>Assign Action<\/a>/,
    );
  });

  it("opens the member-pipeline route with the chapter-owned review table", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter member-pipeline page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "members",
        }),
      }),
    );
    expect(html).toContain("Member Pipeline");
    expect(html).toContain("Search members…");
    expect(html).toContain("All Pipeline Levels");
    expect(html).toContain("E-Board");
    expect(html).toContain("Chair");
    expect(html).toContain("General member");
    expect(html).toContain("12 of 12 members");
    expect(html).toContain("Sofia Reyes");
    expect(html).toContain("Marcus Chen");
    expect(html).toContain('href="/chapter?view=members&amp;quickAction=export_members"');
    expect(html).toContain('href="/chapter?view=members&amp;quickAction=add_member"');
    expect(html).toContain('href="/chapter?view=member_profile&amp;member=member-ivy"');
    expect(html).not.toContain('href="/chapter?view=members&amp;member=member-zara&amp;quickAction=export_members"');
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Ready Now");
    expect(html).not.toContain("Emerging Leaders");
    expect(html).not.toContain("Contributors");
  });

  it("opens review members as a chapter-owned member-pipeline state before the person-level review", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter review-members quick action."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "members",
          member: "member-ivy",
          pipeline: "follow_up",
          q: "Ivy",
          quickAction: "review_members",
        }),
      }),
    );

    expect(html).toContain("Review Members");
    expect(html).toContain("Start from the member pipeline, then open the right member review.");
    expect(html).toContain("Open member review");
    expect(html).toContain(
      'href="/chapter?view=member_profile&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy"',
    );
  });

  it("lets the bridge-video route open with the library surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter bridge-video page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          bridge: "comms",
        }),
      }),
    );
    expect(html).toContain(">Bridge Video Hub</h1>");
    expect(html).toContain("Communications");
    expect(html).toContain("/chapter?view=feed_analytics");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("lets the bridge-video feature action open as a bridge-library-owned review state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter feature-bridge-video quick action."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          bridge: "comms",
          bridgeVideo: "bridge-social-strategy",
          quickAction: "feature_bridge_video",
        }),
      }),
    );
    expect(html).toContain("Feature Bridge Video");
    expect(html).toContain("Feature selected video");
    expect(html).toContain("Use this step to confirm the story still feels specific");
    expect(html).not.toContain("mock-safe");
  });

  it("keeps a selected bridge video visible inside the bridge library", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter selected bridge-video state."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          bridge: "comms",
          bridgeVideo: "bridge-social-strategy",
        }),
      }),
    );
    expect(html).toContain("Selected video");
    expect(html).toContain("Back to bridge library");
    expect(html).toContain("Social Media Posting Strategy for MEDLIFE");
    expect(html).toContain("Feature selected video");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("accepts bridgeFilter as an alias for the bridge-video category route state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing bridgeFilter alias on the chapter bridge-video route."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          bridgeFilter: "comms",
          bridgeVideo: "bridge-social-strategy",
        }),
      }),
    );
    expect(html).toContain("Selected video");
    expect(html).toContain("Social Media Posting Strategy for MEDLIFE");
    expect(html).toContain("Communications");
    expect(html).toContain("Feature selected video");
  });

  it("opens the feed analytics route with the engagement chart from the Figma screen map", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing default chapter feed analytics page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
        }),
      }),
    );

    expect(html).toContain(">Feed &amp; Engagement Analytics</h1>");
    expect(html).toContain("Understand what content drives real action");
    expect(html).toContain("Content Engagement — Actions Driven");
    expect(html).toContain("Recent Posts");
    expect(html).toContain("Most Engaged Members");
    expect(html).toContain("Re-engagement Targets");
    expect(html).toContain("Share to Feed");
    expect(html).toContain("Ask Members to Respond");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps a selected feed post visible inside the feed analytics route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter selected feed-post state."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
          feedPost: "feed-post-slt-recap",
        }),
      }),
    );
    expect(html).toContain("Impact Analysis");
    expect(html).toContain("Back to recent posts");
    expect(html).toContain("SLT info meeting recap - 18 signed up!");
    expect(html).toContain("Content Engagement — Actions Driven");
    expect(html).toContain(
      "/chapter?view=bridge_videos&amp;source=feed_analytics&amp;feedPost=feed-post-slt-recap&amp;quickAction=share_to_feed",
    );
    expect(html).toContain(
      "/chapter?view=members&amp;source=feed_analytics&amp;pipeline=follow_up&amp;feedPost=feed-post-slt-recap&amp;quickAction=ask_members_to_respond",
    );
    expect(html).toContain("Open member review");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps leaderboard best-practice context attached when a feed post is selected", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected post from leaderboard handoff."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
          source: "leaderboard",
          benchmark: "leaderboard-mcgill",
          leaderboardMetric: "attendance",
          region: "canada",
          feedPost: "feed-post-info-night",
        }),
      }),
    );
    expect(html).toContain("Opened from McGill MEDLIFE best practices");
    expect(html).toContain("Impact Analysis");
    expect(html).toContain("Back to recent posts");
    expect(html).toContain(
      "/chapter?view=feed_analytics&amp;source=leaderboard&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill",
    );
  });

  it("keeps leaderboard best-practice context attached to feed follow-up CTAs after a feed post is selected", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected post CTA context from leaderboard handoff."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
          source: "leaderboard",
          benchmark: "leaderboard-mcgill",
          leaderboardMetric: "attendance",
          region: "canada",
          feedPost: "feed-post-info-night",
        }),
      }),
    );
    expect(html).toContain(
      "/chapter?view=bridge_videos&amp;source=feed_analytics&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill&amp;feedPost=feed-post-info-night&amp;quickAction=share_to_feed",
    );
    expect(html).toContain(
      "/chapter?view=members&amp;source=feed_analytics&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill&amp;pipeline=follow_up&amp;feedPost=feed-post-info-night&amp;quickAction=ask_members_to_respond",
    );
    expect(html).toContain(
      "/chapter?view=member_profile&amp;source=feed_analytics&amp;member=member-ivy&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill&amp;pipeline=follow_up&amp;q=Ivy&amp;feedPost=feed-post-info-night",
    );
  });

  it("keeps the feed-analytics handoff visible when the leader follow-up queue opens from content review", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter feed handoff."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "members",
          source: "feed_analytics",
          pipeline: "follow_up",
          member: "member-ivy",
          q: "Ivy",
        }),
      }),
    );
    expect(html).toContain("Feed analytics handoff");
    expect(html).toContain("Opened from a re-engagement workflow");
    expect(html).toContain("name=\"source\"");
    expect(html).toContain("value=\"feed_analytics\"");
  });

  it("lets ask-members-to-respond open as a feed-owned member-review state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter feed CTA handoff."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "members",
          source: "feed_analytics",
          pipeline: "follow_up",
          member: "member-ivy",
          q: "Ivy",
          quickAction: "ask_members_to_respond",
        }),
      }),
    );
    expect(html).toContain("Ask Members to Respond");
    expect(html).toContain("Open member review");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps selected-post context visible when ask-members-to-respond opens from feed analytics", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected-post feed CTA handoff."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "members",
          source: "feed_analytics",
          pipeline: "follow_up",
          member: "member-ivy",
          q: "Ivy",
          feedPost: "feed-post-slt-recap",
          quickAction: "ask_members_to_respond",
        }),
      }),
    );
    expect(html).toContain("Post in focus: SLT info meeting recap - 18 signed up!");
    expect(html).toContain("Back to selected post");
  });

  it("keeps selected-post context visible inside the bridge-video route opened from feed analytics", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing feed-owned chapter bridge-video route."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          source: "feed_analytics",
          member: "member-maya",
          q: "Sofia",
          feedPost: "feed-post-slt-recap",
        }),
      }),
    );

    expect(html).toContain("Post in focus");
    expect(html).toContain("SLT info meeting recap - 18 signed up!");
    expect(html).toContain("DeShawn Williams");
    expect(html).toContain("Actions After");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps selected-post metrics visible inside member review opened from feed analytics", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member review selected-post context."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "member_profile",
          source: "feed_analytics",
          member: "member-maya",
          q: "Sofia",
          feedPost: "feed-post-slt-recap",
        }),
      }),
    );

    expect(html).toContain("Post in focus");
    expect(html).toContain("SLT info meeting recap - 18 signed up!");
    expect(html).toContain("DeShawn Williams");
    expect(html).toContain("Actions After");
    expect(html).toContain("Back to selected post");
  });

  it("lets add-member open as a member-pipeline-owned state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter add-member quick action."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "members",
          member: "member-ivy",
          pipeline: "follow_up",
          q: "Ivy",
          quickAction: "add_member",
        }),
      }),
    );
    expect(html).toContain("Add Member");
    expect(html).toContain("Open member intake");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("opens the member-profile route without implementation-language copy", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter member profile page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "member_profile",
          member: "member-ivy",
        }),
      }),
    );
    expect(html).toContain("Member Profile");
    expect(html).toContain("Use this trend to see whether the member is building steady momentum over time");
    expect(html).not.toContain("mock-safe");
    expect(html).not.toContain("leadership review surface");
  });

  it("lets promote-to-chair open as a member-profile-owned state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter promote-to-chair quick action."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "member_profile",
          member: "member-ivy",
          pipeline: "follow_up",
          q: "Ivy",
          quickAction: "promote_to_chair",
        }),
      }),
    );
    expect(html).toContain("Promote to Chair");
    expect(html).toContain("Open chair review");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("opens the member-profile route with the selected leader workbench", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter member profile page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "member_profile",
          member: "member-ivy",
          pipeline: "follow_up",
          q: "Ivy",
        }),
      }),
    );
    expect(html).toContain("Member Profile");
    expect(html).toContain("Ivy Invite");
    expect(html).toContain("Back to Member Pipeline");
    expect(html).toContain("Leadership Actions");
    expect(html).toContain("Promote to Chair");
    expect(html).toContain("Schedule Values Interview");
    expect(html).toContain("Add Note");
    expect(html.match(/Add Note/g)?.length).toBe(1);
    expect(html.indexOf("Coach &amp; Leader Notes")).toBeLessThan(html.indexOf("Add Note"));
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("opens the impact route with the story-first dashboard", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter impact page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "impact",
        }),
      }),
    );
    expect(html).toContain(">Impact Dashboard</h1>");
    expect(html).toContain("Share Bridge Video");
    expect(html).not.toContain("Story in focus");
    expect(html).toContain("/chapter?view=impact&amp;quickAction=share_impact_story");
    expect(html).toContain("Local Community Impact");
    expect(html).toContain("MEDLIFE Global Impact");
    expect(html).toContain("Moving Mountains");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("lets share-impact-story open as an impact-owned state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter share-impact-story quick action."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "impact",
          member: "member-ivy",
          impactStory: "impact-moving-mountains",
          quickAction: "share_impact_story",
        }),
      }),
    );
    expect(html).toContain("Share Impact Story");
    expect(html).toContain("Open story library");
    expect(
      html,
    ).toContain(
      "/chapter?view=bridge_videos&amp;source=impact&amp;member=member-ivy&amp;impactStory=impact-moving-mountains",
    );
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps the impact-owned bridge-video handoff labeled as Share Bridge Video", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter impact bridge-video handoff label."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "impact",
          member: "member-ivy",
          impactStory: "impact-moving-mountains",
          quickAction: "create_impact_bridge_video",
        }),
      }),
    );

    expect(html).toContain("Share Bridge Video");
    expect(html).not.toContain("Create Bridge Video");
    expect(html).toContain("Open bridge-video lane");
  });

  it("lets the create-event quick action open as an events-owned chapter state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter create-event quick action."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "events",
          quickAction: "create_event",
        }),
      }),
    );
    expect(html).toContain("Create Event");
    expect(html).toContain("Open the chapter event lane with ownership and follow-up in mind.");
    expect(html).toContain("Open event flow");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("opens the leaderboard route with a region filter inside the chapter surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter leaderboard page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "leaderboard",
          region: "canada",
        }),
      }),
    );
    expect(html).toContain("Leaderboard");
    expect(html).not.toContain("Chapter Leaderboard");
    expect(html).toContain("Learn from top chapters. Find ideas to try. Rise together.");
    expect(html).toContain('aria-label="Leaderboard region filter"');
    expect(html).toContain('id="chapter-leaderboard-region-filter"');
    expect(html).toContain("McGill MEDLIFE");
    expect(html).toContain("benchmark=leaderboard-mcgill");
    expect(html).not.toContain("benchmark=leaderboard-ucla");
    expect(html).not.toContain(">Apply<");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("opens the events route with a committee filter inside the chapter surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter events page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "events",
          eventCommittee: "recruitment",
        }),
      }),
    );
    expect(html).toContain(">Events &amp; Attendance</h1>");
    expect(html).toContain('aria-label="Committee filter"');
    expect(html).toContain('id="chapter-events-committee-filter"');
    expect(html).toContain("Tabling: Quad Recruitment");
    expect(html).not.toContain("Moving Mountains Kickoff");
    expect(html).toContain("All Events — June 2025");
    expect(html).toContain("Events This Month");
    expect(html).toContain("RSVP vs. Actual Attendance");
    expect(html).toContain("Social Recruiting Data");
    expect(html).toContain("Manual update");
    expect(html).toContain(
      "Recruiting momentum is being summarized from chapter recaps for now, so use this as a directional signal while you plan the next push.",
    );
    expect(html).not.toContain("Hootsuite / API integration pending");
    expect(html).not.toContain("Placeholder data shown");
    expect(html).not.toContain(">Apply<");
    expect(html.indexOf("Events This Month")).toBeLessThan(
      html.indexOf("All Events — June 2025"),
    );
    expect(html.indexOf("All Events — June 2025")).toBeLessThan(
      html.indexOf("RSVP vs. Actual Attendance"),
    );
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps the plain succession route generic until a candidate is explicitly selected", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing plain chapter succession page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "succession",
        }),
      }),
    );
    expect(html).toContain(">Leadership Succession</h1>");
    expect(html).toContain("Succession Planning");
    expect(html).not.toContain("Selected candidate");
    expect(html).not.toContain("Selected now");
    expect(html).toContain("Leadership Gaps");
    expect(html).toContain("Candidate Pipeline");
    expect(html).toContain("Succession Timeline");
    expect(html).toContain("href=\"/chapter?view=members\"");
  });

  it("opens the committees route with a selected committee inside the chapter surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter committees page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "committees",
          committee: "committee-events",
        }),
      }),
    );
    expect(html).toContain("Action Committees");
    expect(html).toContain(
      "/chapter?view=committees&amp;committee=committee-events",
    );
    expect(html).toContain("Committee in focus");
    expect(html).toContain("Events committee");
    expect(html).toContain("Chapter General Meeting");
    expect(html).toContain("Activity visible now");
    expect(html).toContain("Next committee move");
    expect(html).toContain("Broader committee workspace");
    expect(html).toContain("Open committee workspace");
    expect(html).toContain("Selected");
    expect(html).toContain("Needs Attention");
    expect(html).toContain("Inactive");
    expect(html).not.toContain("Selected Committee");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps the plain committees route generic until a committee is explicitly selected", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing generic chapter committees page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "committees",
        }),
      }),
    );
    expect(html).toContain("Action Committees");
    expect(html).toContain('href="/chapter?view=committees&amp;quickAction=add_committee"');
    expect(html).not.toContain("Committee in focus");
    expect(html).not.toContain("Broader committee workspace");
    expect(html).not.toContain("Open committee workspace");
    expect(html).toContain("Needs Attention");
    expect(html).toContain("Inactive");
  });

  it("opens the succession route with the leadership gaps and candidate timeline", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter succession page."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "succession",
          member: "member-ivy",
        }),
      }),
    );
    expect(html).toContain(">Leadership Succession</h1>");
    expect(html).toContain("Succession Planning");
    expect(html).toContain("Leadership Gaps");
    expect(html).toContain("Candidate Pipeline");
    expect(html).toContain("Succession Timeline");
    expect(html).toContain("Reviewing Ivy Invite for succession");
    expect(html).toContain("Ivy Invite");
    expect(html).not.toContain("Jordan Kim");
    expect(html).toContain("href=\"/chapter?view=members\"");
    expect(html).toContain("href=\"/chapter?view=succession&amp;member=member-ivy\"");
  });

  it("lets add committee open as a committees-owned chapter state before the broader committee lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter add-committee quick action."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "committees",
          committee: "committee-events",
          quickAction: "add_committee",
        }),
      }),
    );
    expect(html).toContain("Add Committee");
    expect(html).toContain("Open the committee lane with ownership and operating health in mind.");
    expect(html).toContain("Open committee flow");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("lets the promote-emerging-leader quick action open as a succession-owned chapter state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter promote-emerging-leader quick action."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "succession",
          member: "member-ivy",
          quickAction: "promote_emerging_leader",
        }),
      }),
    );
    expect(html).toContain("Promote Emerging Leader");
    expect(html).toContain("Start from succession planning, then open the candidate lane.");
    expect(html).toContain("Open candidate review");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("lets the share-bridge-video quick action open as a bridge-library-owned chapter state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter share-bridge-video quick action."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          bridge: "comms",
          quickAction: "share_bridge_video",
        }),
      }),
    );
    expect(html).toContain("Share Bridge Video");
    expect(html).toContain("Start from the bridge-video library, then open the sharing lane.");
    expect(html).toContain("Share Bridge Video");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps the bridge-library return path when submit-bridge-video opens the proof lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter submit-bridge-video proof handoff."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          bridge: "comms",
          quickAction: "submit_bridge_video",
        }),
      }),
    );

    expect(html).toContain("Submit Bridge Video");
    expect(html).toContain("Open proof lane");
    expect(html).toContain(
      "/proof-library/upload?source=chapter_bridge_video&amp;returnTo=%2Fchapter%3Fview%3Dbridge_videos%26bridge%3Dcomms",
    );
  });

  it("keeps the selected impact story attached to the Share Bridge Video quick action", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing impact-selected Share Bridge Video context."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "impact",
          member: "member-ivy",
          impactStory: "impact-moving-mountains",
        }),
      }),
    );
    expect(html).toContain(
      "/chapter?view=bridge_videos&amp;source=impact&amp;member=member-ivy&amp;impactStory=impact-moving-mountains&amp;quickAction=share_bridge_video",
    );
    expect(html).toContain("Story in focus");
    expect(html.indexOf("Story in focus")).toBeLessThan(html.indexOf("1,840"));
    expect(html.match(/#3 network rank/g)?.length).toBe(1);
  });

  it("keeps share-bridge-video honest when no bridge video is selected yet", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing no-selection bridge-video sharing context."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          quickAction: "share_bridge_video",
        }),
      }),
    );
    expect(html).toMatch(
      /href="\/chapter\?view=feed_analytics&amp;source=bridge_videos"[^>]*>Share Bridge Video<\/a>/,
    );
    expect(html).not.toMatch(
      /href="\/chapter\?view=feed_analytics&amp;source=bridge_videos&amp;bridge=recruitment"[^>]*>Share Bridge Video<\/a>/,
    );
  });

  it("keeps selected bridge-video sharing tied to the selected card when the route opens from all videos", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected bridge-video sharing context."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          bridgeVideo: "bridge-social-strategy",
          quickAction: "share_bridge_video",
        }),
      }),
    );
    expect(html).toMatch(
      /href="\/chapter\?view=feed_analytics&amp;source=bridge_videos&amp;bridge=comms"[^>]*>Share Bridge Video<\/a>/,
    );
  });

  it("keeps the member-home handoff visible when the leader route is opened from the home role jump", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter role-jump handoff."),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    const html = renderToStaticMarkup(
      await ChapterPage({
        searchParams: Promise.resolve({
          view: "overview",
          source: "member_home",
        }),
      }),
    );
    expect(html).toContain("Member app handoff");
    expect(html).toContain("Opened from UCLA MEDLIFE into Leader Hub");
    expect(html).toContain("Switch View buttons");
    expect(html).toContain("Review all 7");
    expect(html).toContain("Assign action");
    expect(html).toContain("Review evidence");
    expect(html).toContain("Student view");
    expect(html).toContain("Leader Hub");
    expect(html).toContain("Rush Month Progress");
    expect(html).toContain("Risk Alerts");
    expect(html).toContain("Member Status");
    expect(html).toContain("Evidence Queue");
    expect(html).toContain("/chapter?view=members&amp;source=member_home&amp;quickAction=review_members");
    expect(html).toContain(
      "/chapter?view=members&amp;source=member_home&amp;pipeline=follow_up&amp;quickAction=assign_action",
    );
    expect(html).toContain("/chapter?view=events&amp;source=member_home&amp;quickAction=create_event");
    expect(html).toContain(
      "/chapter?view=succession&amp;source=member_home&amp;quickAction=promote_emerging_leader",
    );
    expect(html).toContain("/rush-month/review");
    expect(html).toContain(
      'href="/local-preview?selectedEmail=member.a%40mymedlife.test&amp;returnTo=%2F"',
    );
    expect(html.indexOf("Opened from UCLA MEDLIFE into Leader Hub")).toBeLessThan(
      html.indexOf("Leadership Center"),
    );
    expect(html.indexOf("Leader Hub")).toBeLessThan(
      html.indexOf("Leadership Center"),
    );
  });
});
