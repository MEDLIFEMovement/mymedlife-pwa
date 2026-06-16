import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMvpProgressMap } from "@/services/mvp-progress-map";

describe("mvp progress map", () => {
  it("gives admins a plain-English map of MVP progress and remaining work", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const progressMap = getMvpProgressMap(actor);

    expect(progressMap.canReadProgressMap).toBe(true);
    expect(progressMap.title).toBe("Admin MVP progress map");
    expect(progressMap.counts).toEqual({
      total: 13,
      localReviewReady: 4,
      partiallyReady: 6,
      needsApproval: 2,
      futureBuild: 1,
    });
    expect(progressMap.localReviewPercent).toBeGreaterThan(progressMap.liveMvpPercent);
    expect(progressMap.liveMvpPercent).toBeLessThan(50);
    expect(progressMap.plainEnglishSummary).toContain("not a live student launch");
  });

  it("keeps external automation and proof upload work explicitly unfinished", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const progressMap = getMvpProgressMap(actor);
    const proofUpload = progressMap.subprojects.find(
      (item) => item.key === "proof_upload_storage",
    );
    const automation = progressMap.subprojects.find(
      (item) => item.key === "external_automation",
    );

    expect(proofUpload?.status).toBe("partially_ready");
    expect(proofUpload?.remainingWork).toContain("storage buckets");
    expect(automation?.status).toBe("needs_approval");
    expect(automation?.plainEnglish).toContain("no real external systems");
    expect(automation?.liveMvpWeight).toBe(0);
    expect(
      progressMap.subprojects.find((item) => item.key === "design_qa_readiness")
        ?.remainingWork,
    ).toContain("real phone QA");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.remainingWork,
    ).toContain("Pick the first pilot group");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.routeEvidence,
    ).toContain("/admin/staff-dry-run");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.routeEvidence,
    ).toContain("/admin/pilot-scope");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.routeEvidence,
    ).toContain("/admin/first-write");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.routeEvidence,
    ).toContain("/admin/first-write");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.routeEvidence,
    ).toContain("/admin/coach-write");
  });

  it("gives DS Admin the automation-aware progress map without granting ownership", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const progressMap = getMvpProgressMap(actor);

    expect(progressMap.canReadProgressMap).toBe(true);
    expect(progressMap.title).toBe("DS Admin MVP progress and automation map");
    expect(progressMap.nextBestSteps.join(" ")).toContain("n8n");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.remainingWork,
    ).toContain("membership truth");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.status,
    ).toBe("partially_ready");
  });

  it("hides the build-status map from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getMvpProgressMap(member).canReadProgressMap).toBe(false);
    expect(getMvpProgressMap(leader).canReadProgressMap).toBe(false);
    expect(getMvpProgressMap(coach).canReadProgressMap).toBe(false);
  });
});
