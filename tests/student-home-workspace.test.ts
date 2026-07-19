import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getStudentHomeWorkspace } from "@/services/student-home-workspace";

const data = getMockReadOnlyAppData("Testing student home workspace.");

describe("student home workspace", () => {
  it("builds a member-first home with routes for next action, campaigns, events, and points", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getStudentHomeWorkspace(actor, data);

    expect(workspace.greeting).toBe("Hi, TEST Sofia");
    expect(workspace.chapterName).toBe("UCLA MEDLIFE");
    expect(workspace.startNextAction.href).toBe("/app/events?source=home");
    expect(workspace.startNextAction.label).toBe("Start next action");
    expect(workspace.campaign.href).toBe("/rush-month");
    expect(workspace.campaign.campaignsHref).toBe("/campaigns");
    expect(workspace.upcomingEvents.map((event) => event.href)).toEqual([
      "/rush-month/events/event-rush-social-001",
      "/rush-month/events/event-rush-med-talk-001",
    ]);
    expect(workspace.points.href).toBe("/rush-month/leaderboard");
    expect(workspace.points.leaderboardPreview).toHaveLength(3);
  });

  it("summarizes chapter momentum with a friendly progress label and safe recognition copy", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");
    const workspace = getStudentHomeWorkspace(actor, data);

    expect(workspace.campaign.progressPercent).toBe(57);
    expect(workspace.campaign.progressLabel).toBe("4 of 7 Rush Month steps are moving.");
    expect(workspace.stats.find((stat) => stat.label === "Points")?.value).toBe("10");
    expect(workspace.leaderMessage.authorName).toBe("Priya President");
    expect(workspace.safetyNote).toContain("mock-safe");
  });
});
