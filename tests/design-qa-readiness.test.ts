import { describe, expect, it } from "vitest";
import { getDesignQaReadiness } from "@/services/design-qa-readiness";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("design QA readiness", () => {
  it("gives admin a Figma and mobile QA checklist with zero writes and sends", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getDesignQaReadiness(actor);

    expect(readiness.canReadReadiness).toBe(true);
    expect(readiness.title).toBe("Admin design QA readiness");
    expect(readiness.figmaTarget).toContain("figma.com/make");
    expect(readiness.mobileViewport).toContain("390px");
    expect(readiness.counts.total).toBe(8);
    expect(readiness.counts.browserWritesExpected).toBe(0);
    expect(readiness.counts.externalWritesExpected).toBe(0);
  });

  it("keeps final visual QA blocked before launch", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const readiness = getDesignQaReadiness(actor);
    const productionVisualQa = readiness.items.find(
      (item) => item.key === "production_visual_qa",
    );

    expect(productionVisualQa?.status).toBe("blocked_before_launch");
    expect(productionVisualQa?.plainEnglish).toContain("Final polish");
    expect(productionVisualQa?.reviewerPrompt).toContain("Do not call");
  });

  it("tracks student clarity, role complexity, accessibility, and safety", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getDesignQaReadiness(actor);
    const keys = readiness.items.map((item) => item.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        "mobile_next_action",
        "role_complexity",
        "accessibility_baseline",
        "pilot_safety_copy",
      ]),
    );
    expect(readiness.counts.readyForLocalReview).toBeGreaterThan(0);
    expect(readiness.counts.needsVisualReview).toBeGreaterThan(0);
    expect(readiness.counts.blockedBeforeLaunch).toBe(1);
  });

  it("hides design QA from operating roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getDesignQaReadiness(member).canReadReadiness).toBe(false);
    expect(getDesignQaReadiness(leader).canReadReadiness).toBe(false);
    expect(getDesignQaReadiness(coach).canReadReadiness).toBe(false);
  });
});
