import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMvpReleaseReadinessSummary } from "@/services/mvp-release-readiness";

describe("mvp release readiness", () => {
  it("marks the MVP ready for local review but not live launch", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const summary = getMvpReleaseReadinessSummary(actor);

    expect(summary.canReadSummary).toBe(true);
    expect(summary.localReviewReady).toBe(true);
    expect(summary.liveLaunchReady).toBe(false);
    expect(summary.browserWritesEnabled).toBe(0);
    expect(summary.externalWritesEnabled).toBe(0);
    expect(summary.plainEnglishVerdict).toContain("not ready for live student launch");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Controlled pilot decision packet");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Staff dry-run guide");
  });

  it("lists the key live-launch blockers", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getMvpReleaseReadinessSummary(actor);
    const blockerLabels = summary.blockers.map((blocker) => blocker.label);

    expect(blockerLabels).toEqual(
      expect.arrayContaining([
        "Live auth and real users",
        "Browser writes",
        "Proof uploads and public proof sharing",
        "External integrations",
        "Production environment and visual QA",
      ]),
    );
  });

  it("keeps DS Admin on the same conservative release-readiness summary", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const summary = getMvpReleaseReadinessSummary(actor);

    expect(summary.canReadSummary).toBe(true);
    expect(summary.title).toBe("DS Admin release-readiness summary");
    expect(summary.nextApprovals.join(" ")).toContain("n8n");
    expect(summary.nextApprovals.join(" ")).toContain("first pilot");
  });

  it("hides release readiness from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getMvpReleaseReadinessSummary(member).canReadSummary).toBe(false);
    expect(getMvpReleaseReadinessSummary(leader).canReadSummary).toBe(false);
    expect(getMvpReleaseReadinessSummary(coach).canReadSummary).toBe(false);
  });
});
