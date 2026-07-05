import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getCampaignsRouteRedirectHref,
  getChapterRouteRedirectHref,
  getChapterMembersRouteRedirectHref,
  getCoachRouteRedirectHref,
  getProofLibraryRouteRedirectHref,
  getRushMonthActionsRouteRedirectHref,
  getRushMonthActionDetailRouteRedirectHref,
  getRushMonthEventsRouteRedirectHref,
  getRushMonthLeaderboardRouteRedirectHref,
  getSltPrepRouteRedirectHref,
} from "@/services/owned-route-redirect";

describe("owned route redirect service", () => {
  it("parks campaign routes inside the events-first launch lane for every surface", () => {
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("member.a@mymedlife.test")),
    ).toBe("/app/events?source=campaigns");
    expect(
      getCampaignsRouteRedirectHref(
        getMockLocalActorContext("committee.member@mymedlife.test"),
      ),
    ).toBe("/app/events?source=campaigns");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test")),
    ).toBe("/leader?view=events");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test")),
    ).toBe("/staff?view=events");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test")),
    ).toBe("/staff?view=events");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("ds.admin@mymedlife.test")),
    ).toBe("/admin");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("super.admin@mymedlife.test")),
    ).toBe("/admin");
  });

  it("preserves the selected campaign when staff-owned campaign redirects still need context", () => {
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test"), {
        campaignSlug: "rush-month",
      }),
    ).toBe("/staff?view=events&campaign=rush-month");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test"), {
        campaignSlug: "rush-month",
      }),
    ).toBe("/staff?view=events&campaign=rush-month");
  });

  it("parks proof routes into the points-first launch lane for every surface", () => {
    expect(
      getProofLibraryRouteRedirectHref(getMockLocalActorContext("member.a@mymedlife.test")),
    ).toBe("/app/points?source=points");
    expect(
      getProofLibraryRouteRedirectHref(
        getMockLocalActorContext("committee.chair@mymedlife.test"),
      ),
    ).toBe("/leader?view=leaderboard");
    expect(
      getProofLibraryRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test")),
    ).toBe("/staff?view=leaderboard");
    expect(
      getProofLibraryRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test")),
    ).toBe("/staff?view=leaderboard");
    expect(
      getProofLibraryRouteRedirectHref(getMockLocalActorContext("ds.admin@mymedlife.test")),
    ).toBe("/admin");
  });

  it("parks the shared actions route back into each role's owned launch lane", () => {
    expect(
      getRushMonthActionsRouteRedirectHref(
        getMockLocalActorContext("member.a@mymedlife.test"),
      ),
    ).toBe("/app/events");
    expect(
      getRushMonthActionsRouteRedirectHref(
        getMockLocalActorContext("member.a@mymedlife.test"),
        { source: "campaigns" },
      ),
    ).toBe("/app/events?source=campaigns");
    expect(
      getRushMonthActionsRouteRedirectHref(
        getMockLocalActorContext("committee.member@mymedlife.test"),
        { source: "evidence" },
      ),
    ).toBe("/app/points?source=points");
    expect(
      getRushMonthActionsRouteRedirectHref(
        getMockLocalActorContext("leader.a@mymedlife.test"),
      ),
    ).toBe("/leader?view=events");
    expect(
      getRushMonthActionsRouteRedirectHref(
        getMockLocalActorContext("coach@mymedlife.test"),
      ),
    ).toBe("/staff?view=events&campaign=rush-month");
    expect(
      getRushMonthActionsRouteRedirectHref(
        getMockLocalActorContext("ds.admin@mymedlife.test"),
      ),
    ).toBe("/admin");
  });

  it("keeps members on the Rush Month events route while returning every other role to its owned workspace", () => {
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("member.a@mymedlife.test")),
    ).toBe("/app/events");
    expect(
      getRushMonthEventsRouteRedirectHref(
        getMockLocalActorContext("committee.member@mymedlife.test"),
      ),
    ).toBe("/app/events");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("traveler.a@mymedlife.test")),
    ).toBe("/app/events");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test")),
    ).toBe("/leader?view=events");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test")),
    ).toBe("/staff?view=events&campaign=rush-month");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test")),
    ).toBe("/staff?view=events&campaign=rush-month");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("ds.admin@mymedlife.test")),
    ).toBe("/admin");
  });

  it("preserves the selected event when leader and staff event detail routes redirect home", () => {
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test"), {
        eventId: "event-rush-social-001",
      }),
    ).toBe("/leader?view=events&event=event-rush-social-001");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test"), {
        eventId: "event-rush-social-001",
      }),
    ).toBe("/staff?view=events&campaign=rush-month&event=event-rush-social-001");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test"), {
        eventId: "event-rush-social-001",
      }),
    ).toBe("/staff?view=events&campaign=rush-month&event=event-rush-social-001");
  });

  it("keeps the member points route owned by members while redirecting every other role to its points workspace", () => {
    expect(
      getRushMonthLeaderboardRouteRedirectHref(
        getMockLocalActorContext("member.a@mymedlife.test"),
      ),
    ).toBe("/app/points");
    expect(
      getRushMonthLeaderboardRouteRedirectHref(
        getMockLocalActorContext("committee.member@mymedlife.test"),
      ),
    ).toBe("/app/points");
    expect(
      getRushMonthLeaderboardRouteRedirectHref(
        getMockLocalActorContext("leader.a@mymedlife.test"),
      ),
    ).toBe("/leader?view=leaderboard");
    expect(
      getRushMonthLeaderboardRouteRedirectHref(
        getMockLocalActorContext("coach@mymedlife.test"),
      ),
    ).toBe("/staff?view=leaderboard");
    expect(
      getRushMonthLeaderboardRouteRedirectHref(
        getMockLocalActorContext("admin@mymedlife.test"),
      ),
    ).toBe("/staff?view=leaderboard");
    expect(
      getRushMonthLeaderboardRouteRedirectHref(
        getMockLocalActorContext("ds.admin@mymedlife.test"),
      ),
    ).toBe("/admin");
  });

  it("redirects leader chapter-event handoffs back into the leader workspace instead of the shared member route family", () => {
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test"), {
        source: "chapter_create_event",
      }),
    ).toBe("/leader?view=events");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test"), {
        eventId: "event-rush-social-001",
        source: "chapter_event_review",
      }),
    ).toBe("/leader?view=events&event=event-rush-social-001");
  });

  it("parks member action detail back into the owned launch lane for each origin", () => {
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("member.a@mymedlife.test"),
      ),
    ).toBe("/app/events");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("committee.member@mymedlife.test"),
        {
          source: "campaigns",
        },
      ),
    ).toBe("/app/events?source=campaigns");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("traveler.a@mymedlife.test"),
        {
          eventId: "event-rush-social-001",
          source: "home",
        },
      ),
    ).toBe("/app/events/event-rush-social-001?source=home");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("member.a@mymedlife.test"),
        {
          source: "points",
        },
      ),
    ).toBe("/app/points?source=points");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("member.a@mymedlife.test"),
        {
          source: "profile",
        },
      ),
    ).toBe("/profile");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("leader.a@mymedlife.test"),
      ),
    ).toBe("/leader?view=events");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("coach@mymedlife.test"),
      ),
    ).toBe("/staff?view=events&campaign=rush-month");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("admin@mymedlife.test"),
      ),
    ).toBe("/staff?view=events&campaign=rush-month");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("ds.admin@mymedlife.test"),
      ),
    ).toBe("/admin");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("super.admin@mymedlife.test"),
      ),
    ).toBe("/admin");
  });

  it("rewrites the legacy coach route into the staff workspace while preserving useful filters", () => {
    expect(
      getCoachRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test"), {
        view: "campaigns",
        chapter: "chapter-ucla",
        risk: "high",
        source: "member_home",
      }),
    ).toBe("/staff?view=events&chapter=chapter-ucla&risk=high&source=member_home");
    expect(
      getCoachRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test"), {
        view: "support_notes",
      }),
    ).toBe("/staff?view=chapters");
    expect(
      getCoachRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test")),
    ).toBe("/leader?view=overview");
    expect(
      getCoachRouteRedirectHref(getMockLocalActorContext("ds.admin@mymedlife.test")),
    ).toBe("/admin");
  });

  it("parks the old chapter membership route back into each role's owned surface", () => {
    expect(
      getChapterMembersRouteRedirectHref(
        getMockLocalActorContext("member.a@mymedlife.test"),
      ),
    ).toBe("/app");
    expect(
      getChapterMembersRouteRedirectHref(
        getMockLocalActorContext("leader.a@mymedlife.test"),
      ),
    ).toBe("/leader?view=events");
    expect(
      getChapterMembersRouteRedirectHref(
        getMockLocalActorContext("coach@mymedlife.test"),
      ),
    ).toBe("/staff?view=chapters");
    expect(
      getChapterMembersRouteRedirectHref(
        getMockLocalActorContext("admin@mymedlife.test"),
      ),
    ).toBe("/staff?view=chapters");
    expect(
      getChapterMembersRouteRedirectHref(
        getMockLocalActorContext("ds.admin@mymedlife.test"),
      ),
    ).toBe("/admin");
    expect(
      getChapterMembersRouteRedirectHref(
        getMockLocalActorContext("super.admin@mymedlife.test"),
      ),
    ).toBe("/admin");
  });

  it("parks the old chapter shell back into each role's owned surface while preserving useful leader context", () => {
    expect(
      getChapterRouteRedirectHref(getMockLocalActorContext("member.a@mymedlife.test")),
    ).toBe("/app");
    expect(
      getChapterRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test")),
    ).toBe("/staff?view=chapters");
    expect(
      getChapterRouteRedirectHref(getMockLocalActorContext("ds.admin@mymedlife.test")),
    ).toBe("/admin");
    expect(
      getChapterRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test")),
    ).toBe("/leader?view=overview");
    expect(
      getChapterRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test"), {
        view: "member_profile",
        member: "member-ivy",
        pipeline: "follow_up",
        q: "Ivy",
        quickAction: "assign_action",
      }),
    ).toBe(
      "/leader?view=events&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=assign_action",
    );
    expect(
      getChapterRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test"), {
        view: "bridge_videos",
        bridge: "comms",
        bridgeVideo: "bridge-social-strategy",
      }),
    ).toBe(
      "/leader?view=leaderboard&bridge=comms&bridgeVideo=bridge-social-strategy",
    );
  });

  it("parks SLT prep routes outside the 30-chapter events and points rollout", () => {
    expect(
      getSltPrepRouteRedirectHref(getMockLocalActorContext("traveler.a@mymedlife.test")),
    ).toBe("/app/events");
    expect(
      getSltPrepRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test")),
    ).toBe("/leader?view=events");
    expect(
      getSltPrepRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test")),
    ).toBe("/staff?view=events&campaign=rush-month");
    expect(
      getSltPrepRouteRedirectHref(getMockLocalActorContext("ds.admin@mymedlife.test")),
    ).toBe("/admin");
  });
});
