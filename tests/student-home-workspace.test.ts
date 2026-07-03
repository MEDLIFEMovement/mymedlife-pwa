import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getStudentHomeWorkspace } from "@/services/student-home-workspace";

const data = getMockReadOnlyAppData("Testing student home workspace.");

describe("student home workspace", () => {
  it("builds a member-first home with routes for events, campaigns, and points", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getStudentHomeWorkspace(actor, data);

    expect(workspace.greeting).toBe("Hi, Sofia");
    expect(workspace.chapterName).toBe("UCLA MEDLIFE");
    expect(workspace.chapterMeta).toBe(
      "General Member • UCLA • Current checkpoint: Make MEDLIFE visible on campus",
    );
    expect(workspace.startNextAction.href).toBe("/app/events?source=home");
    expect(workspace.startNextAction.label).toBe("Open events");
    expect(workspace.campaign.href).toBe("/campaigns?source=home");
    expect(workspace.campaign.campaignsHref).toBe("/campaigns");
    expect(workspace.campaign.summary).toBe(
      "Turn campus interest into actual student action through invites, events, follow-up, and proof.",
    );
    expect(workspace.campaign.weekLabel).toBe(
      "Current checkpoint: Make MEDLIFE visible on campus",
    );
    expect(workspace.campaign.stageLabel).toBe("Week 1 of 4");
    expect(workspace.campaign.activeMemberCount).toBe(22);
    expect(workspace.campaign.totalMemberCount).toBe(34);
    expect(workspace.upcomingEvents.map((event) => event.href)).toEqual([
      "/app/events/chapter-event-ucla-kickoff?source=home",
    ]);
    expect(workspace.upcomingEvents.map((event) => event.rsvpLabel)).toEqual(["RSVP'd"]);
    expect(workspace.upcomingEvents[0]).toMatchObject({
      title: "Rush Month kickoff social",
      timing: "Sun Nov 15 · 10:00 AM - 12:00 PM",
      locationLabel: "Bruin Plaza",
      rsvpState: "registered",
    });
    expect(workspace.assignedActions.map((action) => action.href)).toEqual([
      "/app/events?source=home",
      "/app/events?source=home",
      "/app/points?source=points",
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
    expect(workspace.points.href).toBe("/app/points");
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
      "Action Committee Member • UCLA • Current checkpoint: Make MEDLIFE visible on campus",
    );
    expect(workspace.campaign.progressPercent).toBe(67);
    expect(workspace.campaign.progressLabel).toBe("2 of 3 Rush Month steps are moving.");
    expect(workspace.campaign.progressCountLabel).toBe("1 / 3 actions done");
    expect(workspace.heroSummary).toContain(
      "Rush Month works only when students see momentum, not just announcements.",
    );
    expect(workspace.stats.find((stat) => stat.label === "Points")?.value).toBe("10");
    expect(workspace.coachMessage.authorName).toBe("Coach David Kim");
    expect(workspace.coachMessage.dateLabel).toBe("Nov 12");
    expect(workspace.coachMessage.body).toContain("Intro GBM");
    expect(workspace.safetyNote).toContain("turned off until approval");
    expect(workspace.travelerPrep).toBeNull();
  });

  it("keeps traveler-specific prep parked while the member launch lane stays focused on events and points", () => {
    const actor = getMockLocalActorContext("traveler.a@mymedlife.test");
    const workspace = getStudentHomeWorkspace(actor, data);

    expect(workspace.travelerPrep).toBeNull();
  });
});
