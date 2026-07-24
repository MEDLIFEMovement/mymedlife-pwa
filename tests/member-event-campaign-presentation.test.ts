import { describe, expect, it } from "vitest";

import { getMemberEventCampaignFallback } from "@/services/member-event-campaign-presentation";

describe("member event campaign presentation", () => {
  it("keeps imported Luma history visibly read-only", () => {
    expect(getMemberEventCampaignFallback("Luma calendar history", null)).toEqual({
      name: "Luma calendar history",
      phase: "Imported provider history - read-only",
      color: "from-slate-700 to-slate-600",
      accent: "bg-slate-100 text-slate-700 border-slate-200",
      description:
        "Completed chapter events imported from Luma. RSVP and check-in are closed, and provider writes remain disabled.",
      progress: 100,
    });
  });

  it("uses current campaign context for other dynamic event groups", () => {
    expect(
      getMemberEventCampaignFallback("Chapter events", {
        name: "TEST Rush Month",
        objective: "TEST chapter objective",
      }),
    ).toMatchObject({
      name: "Chapter events",
      phase: "Active chapter campaign",
      description: "TEST chapter objective",
      progress: 0,
    });
  });

  it("uses honest fallback copy when campaign context is unavailable", () => {
    expect(getMemberEventCampaignFallback("Chapter events", null).description).toBe(
      "Chapter campaign details are not available yet.",
    );
  });
});
