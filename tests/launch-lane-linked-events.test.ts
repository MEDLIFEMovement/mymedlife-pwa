import { describe, expect, it } from "vitest";
import {
  getDefaultLinkedLaunchLaneEventOption,
  getLinkedLaunchLaneEventOptions,
} from "@/services/launch-lane-linked-events";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("launch lane linked events", () => {
  it("builds mapped Luma event options with chapter mapping status in the label", () => {
    const data = getMockReadOnlyAppData("Testing linked event options.");

    const options = getLinkedLaunchLaneEventOptions(data);

    expect(options).toHaveLength(5);
    expect(options[0]).toMatchObject({
      chapterName: "Boston College MEDLIFE",
      eventTitle: "Boston kickoff info night",
      calendarStatusLabel: "Explicit map",
      readyForPilot: true,
    });
    expect(options[0].optionLabel).toContain("Explicit map");
    expect(options[0].optionLabel).toContain("Boston kickoff info night");
  });

  it("keeps a ready mapped event as the default selection for the admin pilot forms", () => {
    const data = getMockReadOnlyAppData("Testing default linked event option.");

    const option = getDefaultLinkedLaunchLaneEventOption(data);

    expect(option).toMatchObject({
      calendarStatusLabel: "Explicit map",
      readyForPilot: true,
    });
  });
});
