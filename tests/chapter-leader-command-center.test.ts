import { describe, expect, it } from "vitest";

import {
  buildChapterLeaderCommandCenterHref,
  getChapterLeaderCommandCenter,
} from "@/services/chapter-leader-command-center";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing chapter leader command center.");

describe("chapter leader command center", () => {
  it("gives President / VP a Boston College sample leadership surface", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);

    expect(commandCenter.canReadCommandCenter).toBe(true);
    expect(commandCenter.chapterName).toBe("Boston College MEDLIFE");
    expect(commandCenter.sampleLabel).toBe("Boston College sample surface");
    expect(commandCenter.selectedView).toBe("overview");
    expect(commandCenter.healthTone).toBe("yellow");
    expect(commandCenter.quickActions.map((action) => action.label)).toEqual([
      "Create Event",
      "Assign Action",
      "Review Members",
      "Promote Emerging Leader",
    ]);
    expect(commandCenter.selectedMember?.displayName).toBe("Zara Events");
    expect(commandCenter.weeklyPriority?.title).toContain("proof and role gaps");
    expect(commandCenter.leadershipRoles.map((role) => role.label)).toEqual([
      "President / VP",
      "Recruitment lead",
      "Social lead",
      "Med Talk lead",
      "Local volunteering lead",
    ]);
    expect(commandCenter.riskAlerts[0]).toEqual(
      expect.objectContaining({
        severity: "high",
        href: "/chapter?view=succession",
      }),
    );
  });

  it("falls back to a safe default view and selected member when search params are invalid", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "not-a-real-view",
      memberId: "missing-member",
    });

    expect(commandCenter.selectedView).toBe("overview");
    expect(commandCenter.selectedMember?.id).toBe("member-zara");
    expect(commandCenter.viewOptions.find((item) => item.key === "members")?.href).toBe(
      "/chapter?view=members&member=member-zara",
    );
  });

  it("keeps E-Board focused on owner movement and lets the selected member carry across views", () => {
    const actor = getMockLocalActorContext("eboard.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      memberId: "member-ivy",
    });

    expect(commandCenter.selectedView).toBe("members");
    expect(commandCenter.weeklyPriority?.title).toContain("Move owners and event prep");
    expect(commandCenter.weeklyPriority?.primaryHref).toBe("/rush-month/actions");
    expect(commandCenter.selectedMember?.displayName).toBe("Ivy Invite");
    expect(commandCenter.quickActions.find((action) => action.label === "Promote Emerging Leader")?.href).toBe(
      "/chapter?view=succession&member=member-ivy",
    );
    expect(commandCenter.pipelineItems.map((item) => item.displayName)).toEqual(
      expect.arrayContaining(["Avery New", "Sam Service", "Ivy Invite", "Zara Events"]),
    );
  });

  it("hides the command center from non-leader personas", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);

    expect(commandCenter.canReadCommandCenter).toBe(false);
    expect(commandCenter.quickActions).toEqual([]);
    expect(commandCenter.leaderboard).toEqual([]);
  });
});

describe("chapter leader command center href", () => {
  it("builds a clean overview href without unnecessary query params", () => {
    expect(buildChapterLeaderCommandCenterHref("overview")).toBe("/chapter");
    expect(buildChapterLeaderCommandCenterHref("overview", "member-zara")).toBe(
      "/chapter?member=member-zara",
    );
  });
});
