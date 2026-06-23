import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberLeaderboardWorkspace } from "@/services/member-leaderboard-workspace";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing member leaderboard workspace.");

describe("member leaderboard workspace", () => {
  it("gives members a direct points and leaderboard next action", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const recognition = getMemberRecognitionSummary(actor, data);
    const workspace = getMemberLeaderboardWorkspace(actor, recognition);

    expect(workspace.canReadLeaderboard).toBe(true);
    expect(workspace.title).toBe("Your Rush Month leaderboard");
    expect(workspace.nextStep.href).toBe("/rush-month/actions/member-push?source=points");
    expect(workspace.nextStep.ctaLabel).toBe("Open next action");
    expect(workspace.browserWritesExpected).toBe(0);
    expect(workspace.externalWritesExpected).toBe(0);
    expect(workspace.summary).toContain("stays read-only");
    expect(workspace.safetyNotes.join(" ")).toContain("mock_read_only");
    expect(workspace.safetyNotes.join(" ")).toContain("No points write");
  });

  it("gives leaders and coaches read-only operating context", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const leaderWorkspace = getMemberLeaderboardWorkspace(
      leader,
      getMemberRecognitionSummary(leader, data),
    );
    const coachWorkspace = getMemberLeaderboardWorkspace(
      coach,
      getMemberRecognitionSummary(coach, data),
    );

    expect(leaderWorkspace.title).toBe("Chapter member leaderboard");
    expect(leaderWorkspace.nextStep.href).toBe("/rush-month/actions");
    expect(coachWorkspace.title).toBe("Portfolio chapter leaderboard");
    expect(coachWorkspace.nextStep.href).toBe("/coach");
  });

  it("maps committee members to member next actions and committee chairs to leader follow-up", () => {
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const committeeMemberWorkspace = getMemberLeaderboardWorkspace(
      committeeMember,
      getMemberRecognitionSummary(committeeMember, data),
    );
    const committeeChairWorkspace = getMemberLeaderboardWorkspace(
      committeeChair,
      getMemberRecognitionSummary(committeeChair, data),
    );

    expect(committeeMemberWorkspace.title).toBe("Your Rush Month leaderboard");
    expect(committeeMemberWorkspace.nextStep.href).toBe(
      "/rush-month/actions/member-push?source=points",
    );
    expect(committeeChairWorkspace.title).toBe("Chapter member leaderboard");
    expect(committeeChairWorkspace.nextStep.href).toBe("/rush-month/actions");
  });

  it("keeps DS Admin out of student points truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const recognition = getMemberRecognitionSummary(actor, data);
    const workspace = getMemberLeaderboardWorkspace(actor, recognition);

    expect(workspace.canReadLeaderboard).toBe(false);
    expect(workspace.title).toBe("Leaderboard hidden for this role");
    expect(workspace.nextStep.href).toBe("/admin");
    expect(workspace.summary).toContain("student points");
    expect(workspace.safetyNotes.join(" ")).toContain("No points ledger rows");
  });
});
