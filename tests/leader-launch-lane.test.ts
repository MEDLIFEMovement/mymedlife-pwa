import { describe, expect, it } from "vitest";

import { getLeaderLaunchLaneCanonicalHref } from "@/services/leader-launch-lane";

describe("leader launch lane canonical hrefs", () => {
  it("keeps canonical service-shell views untouched", () => {
    expect(getLeaderLaunchLaneCanonicalHref({ view: "create_event" })).toBeNull();
    expect(getLeaderLaunchLaneCanonicalHref({ view: "training" })).toBeNull();
    expect(getLeaderLaunchLaneCanonicalHref({ view: "stories" })).toBeNull();
  });

  it("canonicalizes alias views into the service-backed leader route family", () => {
    expect(getLeaderLaunchLaneCanonicalHref({ view: "create-event" })).toBe(
      "/leader?view=create_event",
    );
    expect(getLeaderLaunchLaneCanonicalHref({ view: "leadership_training" })).toBe(
      "/leader?view=training",
    );
    expect(getLeaderLaunchLaneCanonicalHref({ view: "medlife_stories" })).toBe(
      "/leader?view=stories",
    );
  });
});
