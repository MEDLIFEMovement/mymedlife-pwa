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
    expect(html).toContain("Create Event");
    expect(html).toContain("Confirm Attendance");
    expect(html).toContain("Chapter Metrics — June 2025");
    expect(html).toContain("Risk Alerts");
    expect(html).toContain("This Week&#x27;s Priority");
    expect(html).toContain("Weekly Points Trend");
    expect(html).not.toContain("Leadership page not yet available");
    expect(html).toContain("Feed Analytics");
    expect(html).toContain("Member Leaderboard");
    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("Bridge Videos");
    expect(html).toContain("Current Leaders");
    expect(html).toContain("Values");
    expect(html).toContain("Leadership Training");
    expect(html).toContain("Preview Surfaces");
    expect(html).not.toContain("Proof Review");
    expect(html).not.toContain("Campaigns");
    expect(html).not.toContain("Leader navigation");
    expect(html).not.toContain("Live event controls");
    expect(html).not.toContain("Leader event tracking");
  });

  it("opens the requested service-backed event screen from the leader view query", async () => {
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
    expect(html).toContain("attendance readback");
    expect(html).toContain("Preview-only event operations");
    expect(html).not.toContain("Chapter Metrics — June 2025");
    expect(html).not.toContain("Live event controls");
    expect(html).not.toContain("Luma readback");
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
    expect(html).toContain("Ideas to try");
    expect(html).toContain("Chapter Health");
    expect(html).toContain("All Regions");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).not.toContain("Chapter Metrics — June 2025");
  });

  it("canonicalizes leadership-family aliases at the page entrypoint while preserving review context", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader alias canonicalization."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(
      LeaderPage({
        searchParams: Promise.resolve({
          view: "current_leaders",
          source: "member_home",
          member: "member-ivy",
          pipeline: "follow_up",
          q: "Ivy",
          feedPost: "feed-post-slt-recap",
          quickAction: "add_leader_note",
          leaderboardMetric: "attendance",
          region: "canada",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/leader?source=member_home&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&leaderboardMetric=attendance&region=canada&view=leaders",
    );

    await expect(
      LeaderPage({
        searchParams: Promise.resolve({
          view: "leadership_training",
          source: "member_home",
          member: "member-ivy",
          pipeline: "follow_up",
          q: "Ivy",
          feedPost: "feed-post-slt-recap",
          quickAction: "schedule_values_interview",
          leaderboardMetric: "attendance",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/leader?source=member_home&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&leaderboardMetric=attendance&view=training",
    );
  });

  it("canonicalizes attendance aliases at the page entrypoint while keeping event review context", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader attendance alias canonicalization."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(
      LeaderPage({
        searchParams: Promise.resolve({
          view: "attendance",
          source: "member_home",
          member: "member-ivy",
          eventCommittee: "recruitment",
          event: "bc-event-quad-tabling",
          quickAction: "assign_action",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/leader?event=bc-event-quad-tabling&eventCommittee=recruitment&view=events",
    );
  });

  it.each([
    ["overview", "This Week&#x27;s Priority"],
    ["leaderboard", "Ideas to try"],
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

  it("routes attendance into the service-backed events lane so leader event review stays canonical", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader attendance continuity redirect."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(
      LeaderPage({
        searchParams: Promise.resolve({
          view: "attendance",
          source: "overview",
          member: "member-ivy",
          eventCommittee: "events",
          event: "bc-event-moving-mountains-kickoff",
          pipeline: "follow_up",
          q: "Ivy",
          quickAction: "assign_action",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/leader?event=bc-event-moving-mountains-kickoff&eventCommittee=events&view=events",
    );
  });

  it("keeps leaderboard comparison context when attendance is reopened from the leader readback loop", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing attendance redirect from leaderboard readback."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(
      LeaderPage({
        searchParams: Promise.resolve({
          view: "attendance",
          source: "leaderboard",
          member: "member-ivy",
          eventCommittee: "events",
          event: "bc-event-moving-mountains-kickoff",
          leaderboardMetric: "attendance",
          region: "canada",
          benchmark: "leaderboard-mcgill",
          quickAction: "assign_action",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/leader?event=bc-event-moving-mountains-kickoff&eventCommittee=events&view=events",
    );
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
    ["stories", "MEDLIFE Stories"],
  ])("keeps the %s leader view route-backed inside the leader shell", async (view, expectedCopy) => {
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
      expect(html).toContain("Events, points, and follow-through stay in one story.");
      expect(html).toContain("Open event context");
      expect(html).toContain("Coach &amp; Leader Notes");
    }

    if (view === "committees") {
      expect(html).toContain("Add Committee");
      expect(html).toContain("Needs visible ownership");
    }

    if (view === "succession") {
      expect(html).toContain("Open Candidate Review");
      expect(html).toContain("Preview Transition Review");
      expect(html).toContain("Leadership Gaps");
    }

    if (view === "values") {
      expect(html).toContain("Preview Values Interview");
      expect(html).toContain("Preview Interview Scheduling");
      expect(html).toContain("Preview Interview Form");
      expect(html).toContain("TEST values preview.");
      expect(html).toContain("Values Alignment");
    }

    if (view === "training") {
      expect(html).toContain("Preview Resource Intake");
      expect(html).toContain("Preview Video");
      expect(html).toContain("Preview Deck");
      expect(html).toContain("TEST Featured Resources");
    }

    if (view === "leaders") {
      expect(html).toContain("TEST leadership roster preview.");
      expect(html).toContain("Preview Succession Review");
      expect(html).toContain("Preview Values Review");
      expect(html).toContain("Who visibly owns each lane right now?");
    }
  });

  it("routes create_event into the service-backed events lane with preview ownership intact", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader create-event continuity redirect."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(
      LeaderPage({
        searchParams: Promise.resolve({
          view: "create_event",
          member: "member-ivy",
          eventCommittee: "events",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/leader?view=events&member=member-ivy&eventCommittee=events&quickAction=create_event",
    );
  });

  it.each([
    ["overview"],
    ["member_home"],
    ["bridge_videos"],
    ["feed_analytics"],
    ["impact"],
    ["leaderboard"],
  ] as const)(
    "preserves the supported %s review source when create_event redirects into the event shell",
    async (source) => {
      const actorModule = await import("@/services/local-actor-context");
      const dataModule = await import("@/services/read-only-app-data");

      vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
        getSignedInActor("leader.a@mymedlife.test"),
      );
      vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
        getMockReadOnlyAppData("Testing leader create-event source continuity redirect."),
      );

      const { default: LeaderPage } = await import("@/app/leader/page");

      await expect(
        LeaderPage({
          searchParams: Promise.resolve({
            view: "create_event",
            source,
            member: "member-ivy",
            eventCommittee: "events",
          }),
        }),
      ).rejects.toThrow(
        `NEXT_REDIRECT:/leader?view=events&source=${source}&member=member-ivy&eventCommittee=events&quickAction=create_event`,
      );
    },
  );

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
      expect(committeesHtml).toContain("Event Committees");
    expect(committeesHtml).toContain("Add Committee");

    const impactHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "impact",
        }),
      }),
    );
    expect(impactHtml).toContain("Impact Dashboard");
    expect(impactHtml).toContain("Share Bridge Video");
    expect(impactHtml).toContain("Share Impact Story");

    const bridgeHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
        }),
      }),
    );
    expect(bridgeHtml).toContain("Bridge Video Hub");
    expect(bridgeHtml).toContain("Bridge Culture Reminder");

    const feedHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
        }),
      }),
    );
    expect(feedHtml).toContain("Feed &amp; Engagement Analytics");
    expect(feedHtml).toContain("Share to Feed");
    expect(feedHtml).toContain("Ask Members to Respond");

    const valuesHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "values",
        }),
      }),
    );
    expect(valuesHtml).toContain("TEST values preview.");
    expect(valuesHtml).toContain("Values interview scheduling is blocked in this preview until the approved leadership-review workflow exists.");
    expect(valuesHtml).toContain("Interview scheduling is blocked in this preview until the approved leadership-review workflow exists.");
    expect(valuesHtml).toContain("The Values Alignment Interview form is blocked in this preview until the approved leadership-review workflow exists.");

    const successionHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "succession",
        }),
      }),
    );
    expect(successionHtml).toContain("Leadership Succession");
    expect(successionHtml).toContain("Open Candidate Review");
    expect(successionHtml).toContain("Preview Transition Review");

    const trainingHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "training",
        }),
      }),
    );
    expect(trainingHtml).toContain("TEST training preview.");
    expect(trainingHtml).toContain("TEST Featured Resources");
    expect(trainingHtml).toContain("TEST How to Run Your First Committee as Chair");
    expect(trainingHtml).toContain("TEST MEDLIFE Chapter Leadership Guide — Full Onboarding");
    expect(trainingHtml).toContain("Preview Link");
    expect(trainingHtml).toContain("External resource opens are blocked in this preview until leadership-content approval is complete.");

    const storiesHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "stories",
        }),
      }),
    );
    expect(storiesHtml).toContain("TEST stories preview.");
    expect(storiesHtml).toContain("Preview Story Intake");
    expect(storiesHtml).toContain("TEST MEDLIFE Stories preview");
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
    expect(source).toContain("<Sidebar");
    expect(source).toContain("active={screen}");
    expect(source).toContain("onNav={navigateToScreen}");
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
    expect(source).toContain("Preview Impact Share");
    expect(source).toContain("Preview Bridge Video");
    expect(source).toContain("Preview Field Update");
    expect(source).toContain("TEST bridge-video preview. Sample submissions stay visible for review, but no playback, featuring, or publishing is live.");
    expect(source).toContain("Preview Submission");
    expect(source).toContain("Preview Video");
    expect(source).toContain("Preview Feed Share");
    expect(source).toContain("Preview Feature");
    expect(source).toContain("Preview →");
    expect(source).toContain("TEST analytics preview. Sample posts, engagement, and outreach cues stay visible for review, but they do not count as live feed evidence or messaging authority.");
    expect(source).toContain("Preview Member Prompt");
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
    expect(source).toContain("TEST promotion preview. Leadership development still depends on human review, so this flow only previews how a member could move up.");
    expect(source).toContain("Preview role path");
    expect(source).toContain("Confirm Values & Preview Promotion");
    expect(source).toContain("TEST values interview completed in preview");
    expect(source).toContain("Preview Leadership Follow-through");
    expect(source).toContain("Preview E-Board Succession");
    expect(source).toContain("TEST strong E-Board candidate preview");
    expect(source).toContain("TEST strong E-Board candidate — nomination preview");
    expect(source).toContain("TEST chair promotion preview — ready now");
    expect(source).toContain("TEST schedule values interview preview");
    expect(source).toContain("Transition Plan Preview Ready");
    expect(source).toContain("No live plan was activated, no nominees were notified, and no transition tasks were published from this preview.");
    expect(source).toContain("This leader workflow stays visible for review, but it is preview-only until the audited write path is approved.");
    expect(source).toContain("Preview Plan");
    expect(source).toContain("Preview Transition Plan");
    expect(source).toContain("TEST succession preview. Candidate planning stays route-backed for review, but no nomination, transition, promotion, or notify flow goes live from this shell.");
    expect(source).toContain("TEST Appoint Member Engagement chair");
    expect(source).toContain("TEST Full E-Board transition complete");
    expect(source).toContain("TEST values preview. Three values guide every MEDLIFE leader, but no interview, nomination, promotion, or approval decision becomes live from this shell.");
    expect(source).not.toContain("Activate Transition Plan");
    expect(source).toContain("Preview Promotion");
    expect(source).toContain("Preview Candidate Nomination");
    expect(source).toContain("Preview Transition Plan");
    expect(source).toContain("Preview Values Interview");
    expect(source).toContain("Preview Interview Scheduling");
    expect(source).toContain("Preview Values Interview Form");
    expect(source).toContain("No live invite, contact sync, form submission, or provider handoff is sent from this preview.");
    expect(source).toContain("toTestLabel");
    expect(source).toContain("TEST leadership roster preview.");
    expect(source).toContain("TEST leader roster preview only.");
    expect(source).toContain("Preview Succession Review");
    expect(source).toContain("Preview Values Review");
    expect(source).toContain("Preview vacancy only");
    expect(source).toContain("No chair assigned in TEST preview");
    expect(source).toContain("Preview Review Actions");
    expect(source).toContain("Leader Review Notes");
    expect(source).toContain("Review this TEST member's points, event follow-through, preview actions, blocked notes, and succession handoff posture.");
    expect(source).toContain("TEST Service Committee Chair interview preview");
    expect(source).toContain("TEST reviewed Moving Mountains Kickoff event handoff preview");
    expect(source).toContain("TEST reviewed committee co-lead readiness preview");
    expect(source).toContain("Monitor whether each TEST committee is moving the chapter forward. Committee ownership, member review, and attendance follow-through stay preview-only in this shell.");
    expect(source).toContain("Preview Follow-through");
    expect(source).toContain("Preview Succession Review");
    expect(source).toContain("Preview Member Follow-through");
    expect(source).toContain("Keep chair coverage, member review, and attendance follow-through visible here without turning on live committee writes.");
    expect(source).toContain("Track TEST event execution previews, survey posture, committee follow-through, and chapter-wide attendance readback without turning on live event operations.");
    expect(source).toContain("Preview Lead");
    expect(source).toContain("Event Score Preview —");
    expect(source).toContain("Preview Survey");
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
    expect(source).toContain("Preview Note");
  });

  it("keeps the leader training resources shell source-faithful while making preview-only states obvious", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/figma-leader-training-screen.tsx"),
      "utf8",
    );

    expect(source).toContain("Leadership & Resources Hub");
    expect(source).toContain("TEST training preview. Sample leadership-development resources stay visible for review, but no publishing, playback, deck viewing, external opens, or chapter sharing is live.");
    expect(source).toContain("TEST Featured Resources");
    expect(source).toContain("All TEST Resources");
    expect(source).toContain("TEST What Is Servant Leadership? A MEDLIFE Framework");
    expect(source).toContain("TEST How to Run Your First Committee as Chair");
    expect(source).toContain("TEST MEDLIFE Chapter Leadership Guide — Full Onboarding");
    expect(source).toContain("TEST AshokaU — Social Innovation Leadership Resources");
    expect(source).toContain("Preview Link");
    expect(source).toContain("External resource opens are blocked in this preview until leadership-content approval is complete.");
    expect(source).not.toContain('href={r.url}');
  });

  it("keeps leader stories controls preview-safe and TEST-labeled instead of sounding live", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/figma-leader-stories-screen.tsx"),
      "utf8",
    );

    expect(source).toContain("Preview Story Intake");
    expect(source).toContain("Preview Save");
    expect(source).toContain("Preview Source on");
    expect(source).toContain("TEST stories preview. Sample chapter, field, and student stories stay visible for review, but no save, source-open, publish, or feed sync action is live.");
    expect(source).toContain("TEST MEDLIFE Stories preview — curated by staff · requires approval before publishing");
  });
});
