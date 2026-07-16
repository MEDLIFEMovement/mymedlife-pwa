import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { MemberProfilePanel } from "@/components/member-profile-panel";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: () => "/profile",
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

function getBottomNav(html: string) {
  return html.match(/<nav aria-label="Member bottom navigation"[\s\S]*?<\/nav>/)?.[0] ?? "";
}

function getSignedOutActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-out test actor.",
    "mock_fallback",
    "local_actor_email",
    "signed_out",
  );
}

describe("member stories and profile pages", () => {
  beforeEach(async () => {
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member stories and profile pages."),
    );
  });

  it("renders the route-backed stories surface with blocked publishing controls", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: AppStoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(await AppStoriesPage({}));

    expect(html).toContain(">Stories<");
    expect(html).toContain("Stories");
    expect(html).toContain("Read more");
    expect(html).toContain('aria-label="Back to student home"');
    expect(html).toContain('href="/app"');
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/points"');
    expect(html).toContain('href="/profile?source=stories"');
    expect(html).toContain("MEDLIFE Stories · preview-only student feed");
    expect(html).toContain("Preview");
    expect(html).toContain("TEST @nationwide");
    expect(html).toContain("TEST @uconn");
    expect(html).toContain('href="/app/stories?filter=For+You&amp;story=1"');
    expect(html).toContain('href="/app/stories?filter=For+You&amp;story=2"');
    expect(html).toContain('href="/app/stories?filter=Events"');
    expect(html).toContain('href="/app/stories?filter=SLT"');
    expect(html).toContain('href="/app/stories?filter=Fundraising"');
    expect(html).toContain('href="/app/stories?filter=Leadership"');
    expect(html).toContain('aria-label="Apply story filter: Events"');
    expect(html).toContain('aria-label="Apply story filter: SLT"');
    expect(html).toContain('aria-label="Apply story filter: Fundraising"');
    expect(html).toContain('aria-label="Apply story filter: Leadership"');
    expect(html).not.toContain('href="/app/stories?filter=My+Chapter"');
    expect(html).not.toContain('href="/app/stories?filter=Trip+Moments"');
    expect(html).not.toContain('aria-label="Apply story filter: My Chapter"');
    expect(html).not.toContain('aria-label="Apply story filter: Trip Moments"');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Preview-only reaction. Likes are not saved, synced, or counted as production proof.");
    expect(html).toContain("preview likes");
    expect(html).toContain("Preview only - comments open the reader; shares and saves stay blocked.");
    expect(html).toContain("Sharing is blocked in this preview until publishing approval is complete");
    expect(html).toContain("Saving stories is blocked in this preview");
    expect(html).toContain("Story options are blocked in this preview.");
    expect(html).toContain("TEST @uconn");
    expect(html).not.toContain(">testuconn<");
    expect(html).not.toContain("Live from the field");
    expect(html).not.toContain("Add Story");
    expect(html).not.toContain("stories published");
  });

  it("renders a route-backed story reader when the stories query selects one", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: AppStoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(
      await AppStoriesPage({
        searchParams: Promise.resolve({
          filter: "Events",
          story: "2",
        }),
      }),
    );

    expect(html).toContain("TEST UConn MEDLIFE chapter packed the room at their intro event");
    expect(html).toContain("TEST Over 90 students showed up to learn about MEDLIFE&#x27;s mission.");
    expect(html).toContain('href="/app/stories?filter=Events"');
    expect(html).toContain('aria-label="Back to stories feed"');
    expect(html).toContain('aria-label="Close story reader"');
    expect(html).toContain("External source links are blocked in this preview until feed-sharing approval is complete");
    expect(html).toContain("Story saving is blocked in this preview");
    expect(html).toContain("Save");
    expect(html).toContain("Instagram");
    expect(html).toContain("preview likes");
    expect(html).toContain("preview views");
    expect(html).toContain("TEST @uconn");
    expect(html).toContain("Instagram");
    expect(html).toContain("Preview only - reactions, save preview, and source previews stay blocked in this reader.");
    expect(html).toContain("TEST UConn");
    expect(html).toContain("Stay in the TEST member loop");
    expect(html).toContain("Open TEST event detail");
    expect(html).toContain("Open TEST points");
    expect(html).toContain("Open TEST profile");
    expect(html).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=stories&amp;storyFilter=Events&amp;campaign=Rush+Month&amp;story=2"',
    );
    expect(html).toContain(
      'href="/app/points?source=stories&amp;event=chapter-event-ucla-kickoff&amp;storyFilter=Events&amp;campaign=Rush+Month&amp;story=2"',
    );
    expect(html).toContain(
      'href="/profile?source=stories&amp;event=chapter-event-ucla-kickoff&amp;storyFilter=Events&amp;campaign=Rush+Month&amp;story=2"',
    );
    expect(getBottomNav(html)).toContain(
      'href="/profile?source=stories&amp;event=chapter-event-ucla-kickoff&amp;storyFilter=Events&amp;campaign=Rush+Month&amp;story=2"',
    );
  });

  it("keeps the generic stories-loop fallback when an Events story has no exact member event detail route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: AppStoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(
      await AppStoriesPage({
        searchParams: Promise.resolve({
          filter: "Events",
          story: "6",
        }),
      }),
    );

    expect(html).toContain("Stay in the TEST member loop");
    expect(html).toContain("Open TEST events");
    expect(html).toContain('href="/app/events?source=stories&amp;storyFilter=Events"');
    expect(html).not.toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=stories&amp;storyFilter=Events&amp;campaign=Rush+Month"',
    );
  });

  it("keeps the stories reader tied to the active filter when the query picks a mismatched story", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: AppStoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(
      await AppStoriesPage({
        searchParams: Promise.resolve({
          filter: "Events",
          story: "1",
        }),
      }),
    );

    expect(html).toContain('href="/app/stories?filter=Events"');
    expect(html).toContain("TEST UConn MEDLIFE chapter packed the room at their intro event");
    expect(html).toContain("TEST Community health fair draws 300+ in Managua");
    expect(html).not.toContain('aria-label="Back to stories feed"');
    expect(html).not.toContain("TEST Students in Lima joined a Mobile Clinic this weekend");
    expect(html).not.toContain("Preview only - reactions, save preview, and source previews stay blocked in this reader.");
    expect(html).not.toContain("Stay in the TEST member loop");
  });

  it("keeps profile route-backed and explicitly read-only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const previewModule = await import("@/services/workspace-access");
    const previewSpy = vi
      .spyOn(previewModule, "isPreviewWorkspaceAccess")
      .mockReturnValue(true);

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile route."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(await ProfilePage({}));

    expect(html).toContain("TEST Sofia Alvarez");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("TEST Rush Month kickoff social");
    expect(html).toContain("TEST Member ID");
    expect(html).toContain("ID Card");
    expect(html).toContain("Total Points");
    expect(html).toContain("Tasks Done");
    expect(html).toContain("Achievements");
    expect(html).toContain("TEST Speaker");
    expect(html).toContain("TEST Season MVP");
    expect(html).toContain("Recent Activity");
    expect(html).toContain("View full history");
    expect(html).toContain("Your Designation");
    expect(html).toContain("Switch designation to preview access");
    expect(html).toContain("Super Admin");
    expect(html).toContain("Settings");
    expect(html).toContain("Read-only profile");
    expect(html).toContain("No profile save runs from this route.");
    expect(html).toContain("No join request, role approval, membership change, or coach assignment runs from this route.");
    expect(html).toContain("Notification preference writes stay blocked");
    expect(html).toContain("Certificates stay blocked");
    expect(html).toContain("Back to Home");
    expect(html).toContain("max-w-[430px]");
    expect(html).toContain("bg-[#d6e0f0]");
    expect(html).toContain('href="/app"');
    expect(html).toContain('aria-label="Member bottom navigation"');
    expect(html).toContain("Sign Out");
    expect(html).toContain("myMEDLIFE v1.0");
    expect(html).not.toContain("Profile Details");
    expect(html).not.toContain("Next chapter moment");
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/app/events?source=profile"');
    expect(html).toContain('href="/app/points?source=profile"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain('aria-current="page"');

    previewSpy.mockRestore();
  });

  it("keeps profile inside the exact event-detail loop when opened from events", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile events continuity."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({
          source: "events",
          event: "chapter-event-ucla-kickoff",
          campaign: "Rush Month",
        }),
      }),
    );

    expect(html).toContain("Opened from the TEST events lane");
    expect(html).toContain("Back to TEST event detail");
    expect(html).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=events&amp;campaign=Rush+Month"',
    );
    expect(html).toContain(
      'href="/app/points?source=events&amp;event=chapter-event-ucla-kickoff&amp;campaign=Rush+Month"',
    );
    expect(html).toContain('href="/app/stories"');
  });

  it("keeps home-to-profile continuity inside the mobile member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile home continuity."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("Opened from the TEST home walkthrough");
    expect(html).toContain("This profile stays inside the student shell");
    expect(html).toContain("Back to Home");
    expect(html).toContain('href="/app"');
  });

  it("preserves exact TEST home-event continuity when profile opens from an event detail handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing exact home event continuity through profile."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({
          source: "home",
          event: "chapter-event-ucla-kickoff",
        }),
      }),
    );

    expect(html).toContain("Opened from the TEST home walkthrough");
    expect(html).toContain("Back to Home");
    expect(html).toContain("Back to TEST event detail");
    expect(html).toContain('href="/app/points?source=home&amp;event=chapter-event-ucla-kickoff"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home"');
  });

  it("keeps home-origin profile links inside the member loop when no exact event handoff is present", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing home-origin profile continuity without an exact event."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({
          source: "home",
        }),
      }),
    );

    expect(html).toContain('href="/app/points?source=home"');
    expect(html).toContain('href="/app/events?source=home"');
    expect(html).not.toContain('href="/app/points?source=profile"');
    expect(html).not.toContain('href="/app/events?source=profile"');
  });

  it("keeps points-to-profile continuity inside the mobile member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile points continuity."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({ source: "points" }),
      }),
    );

    expect(html).toContain("Opened from Points &amp; Recognition");
    expect(html).toContain("without breaking the points-to-profile member loop");
    expect(html).toContain("Back to Points");
    expect(html).toContain('href="/app/points?source=points"');
    expect(html).toContain('href="/app/events?source=profile"');
  });

  it("keeps stories-to-profile continuity inside the mobile member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile stories continuity."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({
          source: "stories",
          storyFilter: "Events",
        }),
      }),
    );

    expect(html).toContain("Opened from the TEST stories feed");
    expect(html).toContain("stories-to-profile handoff");
    expect(html).toContain("Back to Stories");
    expect(html).toContain('href="/app/stories?filter=Events"');
    expect(html).toContain('href="/app/points?source=stories&amp;storyFilter=Events"');
    expect(html).toContain('href="/app/events?source=stories&amp;storyFilter=Events"');
  });

  it("preserves stories event context when event detail opens profile from the stories feed", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile stories event continuity."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({
          source: "stories",
          storyFilter: "Events",
          event: "chapter-event-ucla-kickoff",
          campaign: "Rush Month",
          story: "2",
        }),
      }),
    );

    expect(html).toContain("stories-to-event-to-profile handoff");
    expect(html).toContain("Back to Stories");
    expect(html).toContain("Back to TEST event detail");
    expect(html).toContain('href="/app/stories?filter=Events&amp;story=2"');
    expect(html).toContain('href="/app/points?source=stories&amp;event=chapter-event-ucla-kickoff&amp;campaign=Rush+Month&amp;storyFilter=Events&amp;story=2"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=stories&amp;campaign=Rush+Month&amp;storyFilter=Events"');
  });

  it("preserves exact TEST event continuity when points opens profile from an event detail handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing exact event continuity through profile."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({
          source: "points",
          event: "chapter-event-ucla-kickoff",
        }),
      }),
    );

    expect(html).toContain("exact event context");
    expect(html).toContain("Back to Points");
    expect(html).toContain("Back to TEST event detail");
    expect(html).toContain('href="/app/points?source=points&amp;event=chapter-event-ucla-kickoff"');
    expect(html).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=profile&amp;profileSource=points"',
    );
  });

  it("preserves selected campaign context when points opens profile from an exact event handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing exact event campaign continuity through profile."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({
          source: "points",
          event: "chapter-event-ucla-kickoff",
          campaign: "Spring Showcase",
        }),
      }),
    );

    expect(html).toContain('href="/app/points?source=points&amp;event=chapter-event-ucla-kickoff&amp;campaign=Spring+Showcase"');
    expect(html).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=profile&amp;profileSource=points&amp;campaign=Spring+Showcase"',
    );
  });

  it("drops the generic All campaign marker when points opens profile without a real filtered campaign", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing profile continuity without a real filtered campaign."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({
          source: "points",
          event: "chapter-event-ucla-kickoff",
          campaign: "All",
        }),
      }),
    );

    expect(html).toContain('href="/app/points?source=points&amp;event=chapter-event-ucla-kickoff"');
    expect(html).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=profile&amp;profileSource=points"',
    );
    expect(html).not.toContain("campaign=All");
  });

  it("redirects signed-out actors to login before rendering the member profile shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const navigationModule = await import("next/navigation");
    const redirectError = new Error("redirect:/login");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedOutActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile login redirect."),
    );
    vi.mocked(navigationModule.redirect).mockImplementation(() => {
      throw redirectError;
    });

    const { default: ProfilePage } = await import("@/app/profile/page");
    await expect(ProfilePage({})).rejects.toBe(redirectError);

    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      "/login?redirectTo=%2Fprofile",
    );
  });

  it("redirects non-member actors away from the member profile shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const navigationModule = await import("next/navigation");
    const visibilityModule = await import("@/services/role-visibility");
    const redirectError = new Error("redirect:/staff");
    const accessSpy = vi.spyOn(visibilityModule, "canAccessMemberWorkspace").mockReturnValue(false);

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile role redirect."),
    );
    vi.mocked(navigationModule.redirect).mockImplementation(() => {
      throw redirectError;
    });

    const { default: ProfilePage } = await import("@/app/profile/page");
    await expect(ProfilePage({})).rejects.toBe(redirectError);

    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith("/staff?view=chapters");
    accessSpy.mockRestore();
  });

  it("keeps the member-mobile frame even when preview chrome and profile readbacks stay unavailable", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const homeModule = await import("@/services/mvp-event-tracking-workspace");
    const previewModule = await import("@/services/workspace-access");

    const homeSpy = vi
      .spyOn(homeModule, "getMvpMemberHome")
      .mockReturnValue(null as never);
    const previewSpy = vi
      .spyOn(previewModule, "isPreviewWorkspaceAccess")
      .mockReturnValue(false);

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile fallback shell."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(await ProfilePage({}));

    expect(html).toContain("max-w-[430px]");
    expect(html).toContain('aria-label="Member bottom navigation"');
    expect(html).not.toContain("Preview Mode — read-only");
    expect(html).not.toContain("Read-only profile");
    expect(html).not.toContain("Profile Details");

    homeSpy.mockRestore();
    previewSpy.mockRestore();
  });

  it("keeps the source-backed mobile profile shell when the member shell opens profile from home", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing home-to-profile continuity."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(
      await ProfilePage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("TEST Sofia Alvarez");
    expect(html).toContain("ID Card");
    expect(html).toContain("Achievements");
    expect(html).toContain("Recent Activity");
    expect(html).toContain("Your Designation");
    expect(html).toContain("Settings");
    expect(html).toContain("Opened from the TEST home walkthrough");
    expect(html).toContain("This profile stays inside the student shell");
    expect(html).toContain("Back to Home");
    expect(html).toContain('href="/app"');
    expect(html).toContain('aria-label="Member bottom navigation"');
    expect(html).toContain('href="/profile"');
  });

  it("keeps already-labeled profile content stable and falls back cleanly when no next event is present", () => {
    const html = renderToStaticMarkup(
      <MemberProfilePanel
        chapterName="TEST UCLA MEDLIFE"
        displayName="TEST Sofia Alvarez"
        workspace={{
          title: "Your myMEDLIFE profile",
          summary: "Preview profile",
          profileLabel: "General Member",
          nextStep: {
            label: "Open events",
            href: "/app/events?source=profile",
            detail: "Preview next step",
          },
          identityRows: [
            {
              label: "Name",
              value: "TEST Sofia Alvarez",
              detail: "Preview actor name",
            },
            {
              label: "Email",
              value: "member.a@mymedlife.test",
              detail: "Local-only account",
            },
          ],
          scopeRows: [
            {
              label: "Chapter scope",
              value: "TEST UCLA MEDLIFE",
              detail: "Preview chapter scope",
            },
            {
              label: "Coach portfolio",
              value: "None",
              detail: "No coach portfolio",
            },
          ],
          futureStructuredEvents: [],
          safetyNotes: [
            "No profile save runs from this route.",
            "No join request, role approval, membership change, or coach assignment runs from this route.",
          ],
          counts: {
            chapterRoles: 1,
            staffRoles: 0,
            chapterScopes: 1,
            coachPortfolioChapters: 0,
            profileWritesExpected: 0,
            membershipWritesExpected: 0,
            roleWritesExpected: 0,
            externalWritesExpected: 0,
          },
        }}
        studentHome={{
          greeting: "Hi, TEST Sofia",
          chapterName: "TEST UCLA MEDLIFE",
          chapterMeta: "General Member • TEST UCLA • Events and points",
          primaryEvent: null,
          pointsBalance: "165 pts",
          pointsDetail: "Chapter rank #3",
          pointsRankLabel: "#3",
          pointsTotal: 165,
          attendanceStatusLabel: "Attendance still pending",
          recognition: "Preview only",
          recentHistory: [],
          chapterCard: {
            title: "TEST UCLA MEDLIFE",
            detail: "Profile preview",
            profileHref: "/profile",
          },
          travelerHref: null,
        }}
        recognition={{
          canReadRecognition: true,
          title: "Recognition",
          summary: "Preview recognition",
          leaderboard: [],
          impacts: [],
          topStats: [],
          campaignPoints: [],
          badges: [
            { label: "TEST Connector", tone: "green" },
            { label: "TEST MVP", tone: "slate" },
          ],
          recentApprovedActions: [],
          explainer: {
            title: "How points work",
            body: "Preview only",
            ctaLabel: "See how to earn more points",
            ctaHref: "/app/events?source=profile",
          },
          pointsLedgerPosture: "mock_read_only",
        }}
      />,
    );

    expect(html).toContain("TEST Sofia Alvarez");
    expect(html).not.toContain("TEST TEST Sofia");
    expect(html).toContain("TEST Member ID");
    expect(html).toContain("TEST Speaker");
    expect(html).toContain("TEST Season MVP");
    expect(html).toContain("Switch designation to preview access");
    expect(html).toContain("View full history");
    expect(html).toContain("Sign Out");
    expect(html).toContain("myMEDLIFE v1.0 · TEST UCLA MEDLIFE");
    expect(html).not.toContain("Open the next chapter event");
    expect(html).toContain("Back to Home");
    expect(html).not.toContain("member.a@mymedlife.test");
    expect(html).not.toContain("Profile Details");
  });

  it("keeps zero-count signed-in profile readback from borrowing demo activity", () => {
    const html = renderToStaticMarkup(
      <MemberProfilePanel
        chapterName="myMEDLIFE Review Chapter"
        displayName="Nick Ellis"
        entrySource="home"
        workspace={{
          title: "Your myMEDLIFE profile",
          summary: "Preview profile",
          profileLabel: "General Member",
          nextStep: {
            label: "Open events",
            href: "/app/events?source=profile",
            detail: "Preview next step",
          },
          identityRows: [],
          scopeRows: [],
          futureStructuredEvents: [],
          safetyNotes: [],
          counts: {
            chapterRoles: 1,
            staffRoles: 0,
            chapterScopes: 1,
            coachPortfolioChapters: 0,
            profileWritesExpected: 0,
            membershipWritesExpected: 0,
            roleWritesExpected: 0,
            externalWritesExpected: 0,
          },
        }}
        studentHome={{
          greeting: "Hi, TEST Nick",
          chapterName: "myMEDLIFE Review Chapter",
          chapterMeta: "General Member - Review Campus",
          primaryEvent: null,
          pointsBalance: "0 pts",
          pointsDetail: "Chapter rank #6",
          pointsRankLabel: "#6",
          pointsTotal: 0,
          attendanceStatusLabel: "No attendance yet",
          recognition: "Signed-in member readback",
          recentHistory: [
            {
              label: "Borrowed TEST demo activity",
              detail: "This should not show for a zero-count signed-in member.",
            },
          ],
          chapterCard: {
            title: "myMEDLIFE Review Chapter",
            detail: "Profile preview",
            profileHref: "/profile",
          },
          travelerHref: null,
        }}
        recognition={{
          canReadRecognition: true,
          title: "Recognition",
          summary: "Preview recognition",
          selectedMember: {
            displayName: "Nick Ellis",
            rank: 6,
            points: 0,
            recognition: "Signed-in member readback",
            completedActions: 0,
          },
          leaderboard: [],
          impacts: [],
          topStats: [],
          campaignPoints: [],
          badges: [
            { label: "Event Starter", tone: "gold" },
            { label: "Connector", tone: "blue" },
            { label: "Evidence Pro", tone: "blue" },
            { label: "Chapter MVP", tone: "slate" },
          ],
          recentApprovedActions: [],
          explainer: {
            title: "How points work",
            body: "Preview only",
            ctaLabel: "See how to earn more points",
            ctaHref: "/app/events?source=profile",
          },
          pointsLedgerPosture: "mock_read_only",
        }}
      />,
    );

    expect(html).toContain("TEST Nick Ellis");
    expect(html).toContain("TEST myMEDLIFE Review Chapter");
    expect(html).toContain("TEST-REVIEW-0847");
    expect(html).toContain("Total Points");
    expect(html).toContain("Events");
    expect(html).toContain("Tasks Done");
    expect(html).toContain("No completed TEST activity yet");
    expect(html).not.toContain("Borrowed TEST demo activity");
    expect(html).not.toContain("TEST-UCLA-0847");
    expect(html).not.toContain(">Earned</span>");
  });

  it("keeps custom designation labels and single-name avatars inside the mobile profile shell", () => {
    const html = renderToStaticMarkup(
      <MemberProfilePanel
        chapterName="Sandbox Chapter"
        displayName="Avery"
        workspace={{
          title: "Your myMEDLIFE profile",
          summary: "Preview profile",
          profileLabel: "Preview Captain",
          nextStep: {
            label: "Open events",
            href: "/app/events?source=profile",
            detail: "Preview next step",
          },
          identityRows: [],
          scopeRows: [],
          futureStructuredEvents: [],
          safetyNotes: [],
          counts: {
            chapterRoles: 1,
            staffRoles: 0,
            chapterScopes: 1,
            coachPortfolioChapters: 0,
            profileWritesExpected: 0,
            membershipWritesExpected: 0,
            roleWritesExpected: 0,
            externalWritesExpected: 0,
          },
        }}
        studentHome={{
          greeting: "Hi, TEST Avery",
          chapterName: "Sandbox Chapter",
          chapterMeta: "General Member • Sandbox",
          primaryEvent: null,
          pointsBalance: "15 pts",
          pointsDetail: "Preview rank",
          pointsRankLabel: "#7",
          pointsTotal: 15,
          attendanceStatusLabel: "Attendance pending",
          recognition: "Preview only",
          recentHistory: [],
          chapterCard: {
            title: "Sandbox Chapter",
            detail: "Profile preview",
            profileHref: "/profile",
          },
          travelerHref: null,
        }}
        recognition={{
          canReadRecognition: true,
          title: "Recognition",
          summary: "Preview recognition",
          leaderboard: [],
          impacts: [],
          topStats: [],
          campaignPoints: [],
          badges: [],
          recentApprovedActions: [],
          explainer: {
            title: "How points work",
            body: "Preview only",
            ctaLabel: "See how to earn more points",
            ctaHref: "/app/events?source=profile",
          },
          pointsLedgerPosture: "mock_read_only",
        }}
      />,
    );

    expect(html).toContain("TEST Avery");
    expect(html).toContain("TEST Sandbox Chapter");
    expect(html).toContain(">Preview Captain<");
    expect(html).toContain(">A<");
  });

  it("falls back to a TEST monogram when the preview profile name is blank", () => {
    const html = renderToStaticMarkup(
      <MemberProfilePanel
        chapterName="Sandbox Chapter"
        displayName=""
        workspace={{
          title: "Your myMEDLIFE profile",
          summary: "Preview profile",
          profileLabel: "General Member",
          nextStep: {
            label: "Open events",
            href: "/app/events?source=profile",
            detail: "Preview next step",
          },
          identityRows: [],
          scopeRows: [],
          futureStructuredEvents: [],
          safetyNotes: [],
          counts: {
            chapterRoles: 1,
            staffRoles: 0,
            chapterScopes: 1,
            coachPortfolioChapters: 0,
            profileWritesExpected: 0,
            membershipWritesExpected: 0,
            roleWritesExpected: 0,
            externalWritesExpected: 0,
          },
        }}
        studentHome={{
          greeting: "Hi, TEST member",
          chapterName: "Sandbox Chapter",
          chapterMeta: "General Member • Sandbox",
          primaryEvent: null,
          pointsBalance: "15 pts",
          pointsDetail: "Preview rank",
          pointsRankLabel: "#7",
          pointsTotal: 15,
          attendanceStatusLabel: "Attendance pending",
          recognition: "Preview only",
          recentHistory: [],
          chapterCard: {
            title: "Sandbox Chapter",
            detail: "Profile preview",
            profileHref: "/profile",
          },
          travelerHref: null,
        }}
        recognition={{
          canReadRecognition: true,
          title: "Recognition",
          summary: "Preview recognition",
          leaderboard: [],
          impacts: [],
          topStats: [],
          campaignPoints: [],
          badges: [],
          recentApprovedActions: [],
          explainer: {
            title: "How points work",
            body: "Preview only",
            ctaLabel: "See how to earn more points",
            ctaHref: "/app/events?source=profile",
          },
          pointsLedgerPosture: "mock_read_only",
        }}
      />,
    );

    expect(html).toContain(">T<");
    expect(html).toContain(">TEST </h1>");
  });
});
