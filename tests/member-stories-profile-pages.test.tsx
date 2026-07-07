import { describe, expect, it, vi } from "vitest";
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

describe("member stories and profile pages", () => {
  it("renders the route-backed stories surface with blocked publishing controls", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: AppStoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(await AppStoriesPage());

    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("Stories");
    expect(html).toContain("Read more");
    expect(html).toContain('href="/app"');
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/points"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain("Preview-only student feed");
    expect(html).toContain("Preview");
    expect(html).toContain("Preview-only reaction. Likes are not saved, synced, or counted as production proof.");
    expect(html).toContain("preview likes");
    expect(html).toContain("Sharing is blocked in this preview until publishing approval is complete");
    expect(html).toContain("Saving stories is blocked in this preview");
    expect(html).toContain("Story options are blocked in this preview.");
    expect(html).toContain("TEST @uconn");
    expect(html).not.toContain(">testuconn<");
    expect(html).not.toContain("Live from the field");
    expect(html).not.toContain("Add Story");
    expect(html).not.toContain("stories published");
  });

  it("keeps profile route-backed and explicitly read-only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile route."),
    );

    const { default: ProfilePage } = await import("@/app/profile/page");
    const html = renderToStaticMarkup(await ProfilePage());

    expect(html).toContain("Hi, TEST Sofia");
    expect(html).toContain("TEST Sofia Alvarez");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("TEST Rush Month kickoff social");
    expect(html).toContain("Read-only profile");
    expect(html).toContain("No profile save runs from this route.");
    expect(html).toContain("No join request, role approval, membership change, or coach assignment runs from this route.");
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/app/events?source=profile"');
    expect(html).toContain('href="/app/points?source=profile"');
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
    expect(html).toContain("Open the next chapter event");
    expect(html).toContain("Open events");
    expect(html).toContain("member.a@mymedlife.test");
    expect(html).toContain("None");
  });
});
