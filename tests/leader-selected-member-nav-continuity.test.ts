import { describe, expect, it } from "vitest";

import { getChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing leader member-profile route continuity.");

describe("leader selected-member nav continuity", () => {
  it("keeps the selected member attached to member-profile nav when the route reloads without an explicit member query", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
    });
    const selectedMemberId = commandCenter.selectedMember?.id;

    expect(selectedMemberId).toBeTruthy();
    expect(commandCenter.navigationMemberId).toBe(selectedMemberId);
    expect(commandCenter.viewOptions.find((item) => item.key === "member_profile")?.href).toBe(
      `/leader?view=member_profile&member=${selectedMemberId}`,
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "overview")?.href).toBe(
      `/leader?view=overview&member=${selectedMemberId}`,
    );
  });

  it("falls back to the visible leader member context when a plain member-profile reload asks for a missing member", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "missing-member",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const selectedMemberId = commandCenter.selectedMember?.id;

    expect(selectedMemberId).toBe("member-ivy");
    expect(commandCenter.navigationMemberId).toBe(selectedMemberId);
    expect(commandCenter.viewOptions.find((item) => item.key === "member_profile")?.href).toBe(
      `/leader?view=member_profile&member=${selectedMemberId}&pipeline=follow_up&q=Ivy`,
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "overview")?.href).toBe(
      `/leader?view=overview&member=${selectedMemberId}&pipeline=follow_up&q=Ivy`,
    );
  });

  it("keeps blocked follow-through attached to the visible leader member when a plain member-profile reload asks for a missing member", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "missing-member",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "promote_to_chair",
    });
    const selectedMemberId = commandCenter.selectedMember?.id;

    expect(selectedMemberId).toBe("member-ivy");
    expect(commandCenter.navigationMemberId).toBe(selectedMemberId);
    expect(commandCenter.selectedMember?.backToPipelineHref).toBe(
      `/leader?view=members&member=${selectedMemberId}&pipeline=follow_up&q=Ivy`,
    );
    expect(commandCenter.selectedMember?.reviewContext).toMatchObject({
      eyebrow: "Follow-up review",
      actionLabel: "Open follow-up queue",
      actionHref: `/leader?view=members&member=${selectedMemberId}&pipeline=follow_up&q=Ivy`,
    });
  });

  it("keeps open-event-context follow-through attached to the visible leader member when a plain member-profile reload asks for a missing member", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "missing-member",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "assign_leadership_action",
    });
    const selectedMemberId = commandCenter.selectedMember?.id;

    expect(selectedMemberId).toBe("member-ivy");
    expect(commandCenter.navigationMemberId).toBe(selectedMemberId);
    expect(commandCenter.selectedMember?.backToPipelineHref).toBe(
      `/leader?view=members&member=${selectedMemberId}&pipeline=follow_up&q=Ivy`,
    );
    expect(commandCenter.selectedMember?.leadershipActions.find((action) => action.label === "Open Event Context")?.href).toBe(
      `/leader?view=member_profile&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&quickAction=assign_leadership_action`,
    );
  });

  it("keeps attendance-confirmation posture attached to the visible leader member when a plain member-profile reload asks for a missing member", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "missing-member",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "assign_action",
    });
    const selectedMemberId = commandCenter.selectedMember?.id;

    expect(selectedMemberId).toBe("member-ivy");
    expect(commandCenter.navigationMemberId).toBe(selectedMemberId);
    expect(commandCenter.quickActions.find((action) => action.label === "Confirm Attendance")?.href).toBe(
      `/leader?view=events&source=overview&member=${selectedMemberId}&quickAction=assign_action`,
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Review Members")?.href).toBe(
      `/leader?view=members&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&quickAction=review_members`,
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Review Leaderboard")?.href).toBe(
      `/leader?view=leaderboard&source=overview&member=${selectedMemberId}&leaderboardMetric=attendance&pipeline=follow_up&q=Ivy&quickAction=assign_action`,
    );
  });

  it("keeps stale-member add-note follow-through anchored to the recovered leader member with attendance return context", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "missing-member",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "add_leader_note",
      returnQuickAction: "assign_action",
    });
    const selectedMemberId = commandCenter.selectedMember?.id;

    expect(selectedMemberId).toBe("member-ivy");
    expect(commandCenter.navigationMemberId).toBe(selectedMemberId);
    expect(commandCenter.selectedMember?.backToPipelineHref).toBe(
      `/leader?view=members&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&returnQuickAction=assign_action`,
    );
    expect(commandCenter.selectedMember?.leadershipActions.find((action) => action.label === "Add Note")?.href).toBe(
      `/leader?view=member_profile&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&quickAction=add_leader_note&returnQuickAction=assign_action`,
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "overview")?.href).toBe(
      `/leader?view=overview&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&quickAction=assign_action`,
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "leaderboard")?.href).toBe(
      `/leader?view=leaderboard&member=${selectedMemberId}&leaderboardMetric=attendance&pipeline=follow_up&q=Ivy&quickAction=assign_action`,
    );
  });

  it("keeps stale-member blocked follow-through anchored to the recovered leader member with attendance return context", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "missing-member",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "promote_to_chair",
      returnQuickAction: "assign_action",
    });
    const selectedMemberId = commandCenter.selectedMember?.id;

    expect(selectedMemberId).toBe("member-ivy");
    expect(commandCenter.navigationMemberId).toBe(selectedMemberId);
    expect(commandCenter.selectedMember?.backToPipelineHref).toBe(
      `/leader?view=members&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&returnQuickAction=assign_action`,
    );
    expect(commandCenter.selectedMember?.leadershipActions.find((action) => action.label === "Promote to Chair")?.href).toBe(
      `/leader?view=member_profile&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&quickAction=promote_to_chair&returnQuickAction=assign_action`,
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "overview")?.href).toBe(
      `/leader?view=overview&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&quickAction=assign_action`,
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "leaderboard")?.href).toBe(
      `/leader?view=leaderboard&member=${selectedMemberId}&leaderboardMetric=attendance&pipeline=follow_up&q=Ivy&quickAction=assign_action`,
    );
  });

  it("keeps stale-member open-event-context follow-through anchored to the recovered leader member with attendance return context", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "missing-member",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "assign_leadership_action",
      returnQuickAction: "assign_action",
    });
    const selectedMemberId = commandCenter.selectedMember?.id;

    expect(selectedMemberId).toBe("member-ivy");
    expect(commandCenter.navigationMemberId).toBe(selectedMemberId);
    expect(commandCenter.selectedMember?.backToPipelineHref).toBe(
      `/leader?view=members&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&returnQuickAction=assign_action`,
    );
    expect(commandCenter.selectedMember?.leadershipActions.find((action) => action.label === "Open Event Context")?.href).toBe(
      `/leader?view=member_profile&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&quickAction=assign_leadership_action&returnQuickAction=assign_action`,
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "overview")?.href).toBe(
      `/leader?view=overview&member=${selectedMemberId}&pipeline=follow_up&q=Ivy&quickAction=assign_action`,
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "leaderboard")?.href).toBe(
      `/leader?view=leaderboard&member=${selectedMemberId}&leaderboardMetric=attendance&pipeline=follow_up&q=Ivy&quickAction=assign_action`,
    );
  });

  it("keeps event-sourced member review in the intentional empty state until a member is explicitly selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      source: "events",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      leaderboardMetric: "attendance",
    });

    expect(commandCenter.selectedMember).toBeNull();
    expect(commandCenter.navigationMemberId).toBeNull();
    expect(commandCenter.viewOptions.find((item) => item.key === "member_profile")?.href).toBe(
      "/leader?view=member_profile&source=events&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "members")?.href).toBe(
      "/leader?view=members&source=events&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    );
  });

  it("keeps leaderboard-sourced member review in the intentional empty state until a member is explicitly selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      source: "leaderboard",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
    });

    expect(commandCenter.selectedMember).toBeNull();
    expect(commandCenter.navigationMemberId).toBeNull();
    expect(commandCenter.viewOptions.find((item) => item.key === "member_profile")?.href).toBe(
      "/leader?view=member_profile&source=leaderboard&eventCommittee=events&event=bc-event-moving-mountains-kickoff&leaderboardMetric=attendance&region=canada",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "members")?.href).toBe(
      "/leader?view=members&source=leaderboard&eventCommittee=events&event=bc-event-moving-mountains-kickoff&leaderboardMetric=attendance&region=canada",
    );
  });
});
