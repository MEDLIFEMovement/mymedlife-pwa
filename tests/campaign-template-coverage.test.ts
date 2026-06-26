import { describe, expect, it } from "vitest";
import { getCampaignTemplateCoverage } from "@/services/campaign-template-coverage";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("campaign template coverage", () => {
  it("stays quiet when the imported template and route surface are already aligned", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const coverage = getCampaignTemplateCoverage(actor, "chapter-engagement");

    expect(coverage).not.toBeNull();
    expect(coverage?.routePhaseCount).toBe(5);
    expect(coverage?.templateStepCount).toBe(5);
    expect(coverage?.isTemplateThinnerThanRoute).toBe(false);
    expect(coverage?.warnings).toEqual([]);
  });

  it("stays quiet once leadership transition parity is lifted into the structured template", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const coverage = getCampaignTemplateCoverage(actor, "leadership-transition");

    expect(coverage).not.toBeNull();
    expect(coverage?.routePhaseCount).toBe(5);
    expect(coverage?.templateStepCount).toBe(5);
    expect(coverage?.isTemplateThinnerThanRoute).toBe(false);
    expect(coverage?.warnings).toEqual([]);
  });
});
