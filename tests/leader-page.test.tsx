import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/leader",
  useRouter: () => ({
    replace: vi.fn(),
  }),
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("leader page", () => {
  it("returns members to their owned student surface instead of showing the leader shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member redirect from leader route."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(LeaderPage({})).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("sends signed-out reviewers to login before opening the command center", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing signed-out leader redirect."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(LeaderPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fleader%3Fview%3Doverview",
    );
  });

  it("renders the student leadership command center as the real leader workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader command center page."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const html = renderToStaticMarkup(await LeaderPage({}));

    expect(html).toContain("Leadership Center");
    expect(html).toContain("Chapter Dashboard · Jun 2025");
    expect(html).toContain("TEST Boston College MEDLIFE");
    expect(html).toContain("College / University Chapter");
    expect(html).toContain("Create Event");
    expect(html).toContain("Assign Task");
    expect(html).toContain("Promote Emerging Leader");
    expect(html).toContain("Share Bridge Video");
    expect(html).toContain("Chapter Metrics — June 2025");
    expect(html).toContain("Risk Alerts");
    expect(html).toContain("This Week&#x27;s Priority");
    expect(html).toContain("Weekly Points Trend");
    expect(html).not.toContain("Leadership page not yet available");
    expect(html).toContain("Feed Analytics");
    expect(html).toContain("Member Leaderboard");
    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("Bridge Videos");
    expect(html).toContain("Leadership Training");
    expect(html).not.toContain("Proof Review");
    expect(html).not.toContain("Campaigns");
    expect(html).not.toContain("Leader navigation");
    expect(html).not.toContain("Live event controls");
    expect(html).not.toContain("Leader event tracking");
  });

  it("opens the requested Figma-owned screen from the leader view query", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader events view."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const html = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "events",
        }),
      }),
    );

    expect(html).toContain("Event Performance");
    expect(html).toContain("Create Event");
    expect(html).toContain("All Events — June 2025");
    expect(html).not.toContain("Chapter Metrics — June 2025");
    expect(html).not.toContain("Live event controls");
    expect(html).not.toContain("Luma readback");

    const source = readFileSync(
      join(process.cwd(), "src/components/figma-leader-command-center.tsx"),
      "utf8",
    );
    expect(source).toContain("Preview survey");
    expect(source).toContain("Survey sending is blocked in this preview");
    expect(source).not.toContain(">Send survey");
  });

  it("renders the chapter leaderboard when reviewers open /leader?view=leaderboard", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader leaderboard view."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const html = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "leaderboard",
        }),
      }),
    );

    expect(html).toContain("Chapter Leaderboard");
    expect(html).toContain("Ranked Chapter Leaderboard");
    expect(html).toContain("Points Score");
    expect(html).toContain("TEST benchmark preview.");
    expect(html).toContain("TEST Organizational Average");
    expect(html).toContain("TEST Boston College vs. National Preview");
    expect(html).toContain("TEST National Leader Preview");
    expect(html).toContain("TEST benchmark idea:");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("Your Chapter");
    expect(html).not.toContain("Chapter Metrics — June 2025");
  });

  it.each([
    ["overview", "This Week&#x27;s Priority"],
    ["leaderboard", "Ranked Chapter Leaderboard"],
    ["events", "All Events — June 2025"],
  ])("renders the %s core launch view as its own screen", async (view, expectedCopy) => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData(`Testing leader ${view} view.`),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const html = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view,
        }),
      }),
    );

    expect(html).toContain(expectedCopy);
  });

  it.each([
    ["members", "Member Leaderboard"],
    ["member_profile", "Member Profile"],
    ["committees", "Event Committees"],
    ["succession", "Leadership Succession"],
    ["impact", "Impact Dashboard"],
    ["bridge_videos", "Bridge Video Hub"],
    ["feed_analytics", "Feed &amp; Engagement Analytics"],
    ["training", "Leadership Training"],
    ["values", "MEDLIFE Values"],
    ["leaders", "Current Leaders"],
    ["create_event", "Create New Event"],
    ["stories", "MEDLIFE Stories"],
  ])("keeps the %s leader view route-backed inside the restored Figma shell", async (view, expectedCopy) => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData(`Testing parked leader ${view} view.`),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const html = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view,
        }),
      }),
    );

    expect(html).toContain(expectedCopy);

    if (view === "member_profile") {
      expect(html).toContain("Promote to Officer");
      expect(html).toContain("Assign Leadership Action");
      expect(html).toContain("Nominate for E-Board");
      expect(html).toContain("Add Note");
    }
  });

  it("keeps blocked leader controls visibly honest inside the restored shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader blocked-control guidance."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    const committeesHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "committees",
        }),
      }),
    );
    expect(committeesHtml).toContain("Committee creation is blocked in this preview.");

    const impactHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "impact",
        }),
      }),
    );
    expect(impactHtml).toContain("TEST impact preview.");
    expect(impactHtml).toContain("Impact story sharing is blocked in this preview until feed-sharing approval is complete.");
    expect(impactHtml).toContain("Field-update submission is blocked in this preview until write approval is complete.");
    expect(impactHtml).toContain("TEST Rosa M.");
    expect(impactHtml).toContain("TEST preview story:");

    const bridgeHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
        }),
      }),
    );
    expect(bridgeHtml).toContain("TEST bridge-video preview.");
    expect(bridgeHtml).toContain("Bridge-video submission is blocked in this preview until write approval is complete.");

    const feedHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
        }),
      }),
    );
    expect(feedHtml).toContain("TEST analytics preview.");
    expect(feedHtml).toContain("Feed sharing is blocked in this preview until staff approval is complete.");
    expect(feedHtml).toContain("Direct member outreach is blocked in this preview until messaging approval is complete.");
    expect(feedHtml).toContain("TEST How to Run a Successful Info Night");

    const valuesHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "values",
        }),
      }),
    );
    expect(valuesHtml).toContain("Values interview scheduling is blocked in this preview until the approved leadership-review workflow exists.");
    expect(valuesHtml).toContain("Interview scheduling is blocked in this preview until the approved leadership-review workflow exists.");
    expect(valuesHtml).toContain("The Values Alignment Interview form is blocked in this preview until the approved leadership-review workflow exists.");
  });

  it("keeps the copied Figma leader shell close to the exported code size and state map", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/figma-leader-command-center.tsx"),
      "utf8",
    );
    const lineCount = source.split("\n").length;

    expect(lineCount).toBeGreaterThanOrEqual(3950);
    expect(lineCount).toBeLessThanOrEqual(4325);
    expect(source).toContain('initialScreen = "home"');
    expect(source).toContain("const [screen, setScreen] = useState<Screen>(initialScreen);");
    expect(source).toContain("<Sidebar active={screen} onNav={navigateToScreen}/>");
    expect(source).toContain("buildLeaderCommandCenterHrefForScreen");
    expect(source).toContain("Ranked Chapter Leaderboard");
    expect(source).toContain('aria-label="Ranked chapter leaderboard"');
    expect(source).toContain("disabled={isBlocked}");
    expect(source).toContain('screen==="events"');
    expect(source).toContain('screen==="create-event"');
    expect(source).toContain('screen==="stories"');
    expect(source).toContain("CreateEventForm");
    expect(source).toContain("MedlifeStoriesScreen");
    expect(source).toContain("MISSING_LEADERSHIP_PAGES");
    expect(source).toContain("Leadership page not yet available");
    expect(source).toContain("WORKSPACE_SWITCHER_BLOCKED_COPY");
    expect(source).toContain("Workspace switching is handled by the account menu above this shell.");
    expect(source).toContain("Committee chair assignment is blocked in this preview.");
    expect(source).toContain("Committee detail drill-in is not wired yet.");
    expect(source).toContain("TEST benchmark preview. Sample chapter comparisons stay visible for review, but they do not count as live chapter rankings, rollout evidence, or production planning truth.");
    expect(source).toContain("TEST Organizational Average");
    expect(source).toContain("TEST Regional Average");
    expect(source).toContain("TEST Boston College vs. National Preview");
    expect(source).toContain("TEST National Leader Preview");
    expect(source).toContain("TEST benchmark idea:");
    expect(source).toContain("Open Bridge Video Previews");
    expect(source).toContain("Member roster creation is blocked in this preview. Use the visible leaderboard only for TEST comparison review.");
    expect(source).toContain("TEST impact preview. Sample stories and metrics stay visible for review, but they do not count as live chapter impact or rollout evidence.");
    expect(source).toContain("TEST bridge-video preview. Sample submissions stay visible for review, but no playback, featuring, or publishing is live.");
    expect(source).toContain("TEST analytics preview. Sample posts, engagement, and outreach cues stay visible for review, but they do not count as live feed evidence or messaging authority.");
    expect(source).toContain('subject:"TEST Rosa M."');
    expect(source).toContain('location:"TEST Pisac, Cusco Region"');
    expect(source).toContain("Bridge video sharing is blocked in this preview until staff approval is complete.");
    expect(source).not.toContain('href="https://www.hubspot.com"');
  });

  it("keeps leader assignment, promotion, and succession outcomes preview-only instead of sounding live", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/figma-leader-command-center.tsx"),
      "utf8",
    );

    expect(source).toContain("Assignment Preview Ready");
    expect(source).toContain("No live task was created, no reminders were sent, and no member feed changed in this preview.");
    expect(source).toContain("Promotion Preview Ready");
    expect(source).toContain("No live role, pipeline, or chapter visibility changed in this preview.");
    expect(source).toContain("Transition Plan Preview Ready");
    expect(source).toContain("No live plan was activated, no nominees were notified, and no transition tasks were published from this preview.");
    expect(source).toContain("This leader workflow stays visible for review, but it is preview-only until the audited write path is approved.");
    expect(source).toContain("Preview Plan");
    expect(source).toContain("Preview Promotion");
  });

  it("routes member-profile leadership actions into preview flows and blocks note writes honestly", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/figma-leader-command-center.tsx"),
      "utf8",
    );

    expect(source).toContain("onAssignAction={(memberId) => openAssignActionPreview([memberId])}");
    expect(source).toContain("onPromote={openPromotePreview}");
    expect(source).toContain("onOpenSuccession={openSuccessionForMember}");
    expect(source).toContain("onAssignAction={() => openAssignActionPreview()}");
    expect(source).toContain("onPromote={() => openPromotePreview()}");
    expect(source).toContain("const [selectedMembers, setSelectedMembers] = useState<number[]>(initialMemberIds);");
    expect(source).toContain("const [selectedMemberId, setSelectedMemberId] = useState<number | null>(initialMemberId);");
    expect(source).toContain("Leader note saving is blocked in this preview until the audited note workflow is approved.");
  });
});
