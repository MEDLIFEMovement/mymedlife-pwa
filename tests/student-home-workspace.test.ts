import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getStudentHomeWorkspace } from "@/services/student-home-workspace";

const data = getMockReadOnlyAppData("Testing student home workspace.");

describe("student home workspace", () => {
  it("builds a member-first home with routes for next action, campaigns, events, and points", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getStudentHomeWorkspace(actor, data);

    expect(workspace.greeting).toBe("Hi, Sofia");
    expect(workspace.chapterName).toBe("UCLA MEDLIFE");
    expect(workspace.chapterMeta).toBe(
      "General Member • UCLA • Week 1: Invite and prove the first push",
    );
    expect(workspace.startNextAction.href).toBe("/rush-month/actions/member-push?source=home");
    expect(workspace.startNextAction.label).toBe("Start next action");
    expect(workspace.campaign.href).toBe("/campaigns?source=home");
    expect(workspace.campaign.campaignsHref).toBe("/campaigns");
    expect(workspace.campaign.stageLabel).toBe("Week 1 of 4");
    expect(workspace.campaign.activeMemberCount).toBe(22);
    expect(workspace.campaign.totalMemberCount).toBe(34);
    expect(workspace.upcomingEvents.map((event) => event.href)).toEqual([
      "/rush-month/events/event-rush-med-talk-001?source=home",
      "/rush-month/events/event-rush-social-001?source=home",
    ]);
    expect(workspace.upcomingEvents.map((event) => event.rsvpLabel)).toEqual([
      "RSVP",
      "RSVP'd",
    ]);
    expect(workspace.upcomingEvents[0]).toMatchObject({
      title: "Intro GBM",
      timing: "Thu Nov 15 · 6:00 PM - 8:00 PM",
      locationLabel: "Ackerman 2100",
      rsvpState: "open",
    });
    expect(workspace.assignedActions.map((action) => action.href)).toEqual([
      "/rush-month/actions/member-push?source=home",
      "/rush-month/actions/share-rush-flyer?source=home",
      "/rush-month/actions/welcome-table?source=home",
    ]);
    expect(workspace.assignedActions.map((action) => action.title)).toEqual([
      "Invite 3 friends to the Intro GBM",
      "Share Rush Week flyer on Instagram",
      "Add 5 leads",
    ]);
    expect(workspace.assignedActions.map((action) => action.status)).toEqual([
      "not_started",
      "in_progress",
      "submitted",
    ]);
    expect(workspace.points.href).toBe("/rush-month/leaderboard");
    expect(workspace.points.total).toBe(145);
    expect(workspace.points.weeklyMomentumLabel).toBe("+75 this week");
    expect(workspace.points.rankDetail).toBe("Chapter rank #3");
    expect(workspace.points.leaderboardPreview.map((row) => row.displayName)).toEqual([
      "Aisha N.",
      "Marcus T.",
      "Sofia Alvarez",
      "James L.",
    ]);
    expect(workspace.points.leaderboardPreview).toHaveLength(4);
  });

  it("summarizes chapter momentum with a friendly progress label and safe recognition copy", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");
    const workspace = getStudentHomeWorkspace(actor, data);

    expect(workspace.chapterMeta).toBe(
      "Action Committee Member • UCLA • Week 1: Invite and prove the first push",
    );
    expect(workspace.campaign.progressPercent).toBe(67);
    expect(workspace.campaign.progressLabel).toBe("2 of 3 Rush Month steps are moving.");
    expect(workspace.campaign.progressCountLabel).toBe("1 / 3 actions done");
    expect(workspace.stats.find((stat) => stat.label === "Points")?.value).toBe("10");
    expect(workspace.coachMessage.authorName).toBe("Coach David Kim");
    expect(workspace.coachMessage.dateLabel).toBe("Nov 12");
    expect(workspace.coachMessage.body).toContain("Intro GBM");
    expect(workspace.safetyNote).toContain("turned off until approval");
  });
});
