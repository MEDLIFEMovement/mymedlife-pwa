import { describe, expect, it } from "vitest";
import { getDiscourseBakeoffEvaluation } from "@/services/discourse-bakeoff-evaluation";

describe("Discourse bake-off evaluation", () => {
  it("keeps myMEDLIFE as the MVP and pilot operating system", () => {
    const evaluation = getDiscourseBakeoffEvaluation();

    expect(evaluation.launchCall).toBe("mymedlife_mvp_discourse_reference_only");
    expect(evaluation.finalRecommendation).toContain("Use myMEDLIFE as the MVP");
    expect(evaluation.finalRecommendation).toContain("Discourse as a prototype");
    expect(evaluation.items.find((item) => item.key === "student_action_loop")?.status).toBe(
      "pwa_leads",
    );
    expect(
      evaluation.items.find((item) => item.key === "community_and_reference_content")
        ?.status,
    ).toBe("reference_only");
    expect(
      evaluation.items.find((item) => item.key === "pilot_confirmation")?.status,
    ).toBe("needs_pilot_confirmation");
  });
});
