import { describe, expect, it } from "vitest";

import {
  getLaunchLaneFocusHref,
  getLaunchLaneHomeHref,
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
  getLaunchLaneWorkspaceNextStep,
  isEventsPointsLaunchLaneEnabled,
  shouldShowTravelerPrepEntry,
} from "@/services/events-points-launch-lane";

describe("events and points launch lane", () => {
  it("keeps the launch lane enabled and traveler entry hidden from the member home", () => {
    expect(isEventsPointsLaunchLaneEnabled()).toBe(true);
    expect(shouldShowTravelerPrepEntry()).toBe(false);
  });

  it("builds member event and points routes with source context", () => {
    expect(getLaunchLaneMemberEventsHref("profile")).toBe(
      "/app/events?source=profile",
    );
    expect(getLaunchLaneMemberPointsHref("events")).toBe(
      "/app/points?source=events",
    );
  });

  it("keeps parked routes funneled back into simple home, events, and points destinations", () => {
    expect(getLaunchLaneHomeHref("member")).toBe("/app");
    expect(getLaunchLaneHomeHref("leader")).toBe("/leader?view=overview");
    expect(getLaunchLaneFocusHref("member", "events")).toBe("/app/events");
    expect(getLaunchLaneFocusHref("leader", "events")).toBe("/leader?view=events");
    expect(getLaunchLaneFocusHref("staff", "points")).toBe("/staff?view=leaderboard");
    expect(getLaunchLaneFocusHref("ds_admin", "home")).toBe("/admin");
  });

  it("keeps each workspace aimed at the core event-and-points loop", () => {
    expect(getLaunchLaneWorkspaceNextStep("member").href).toBe(
      "/app/events?source=points",
    );
    expect(getLaunchLaneWorkspaceNextStep("leader").href).toBe(
      "/leader?view=events",
    );
    expect(getLaunchLaneWorkspaceNextStep("coach").href).toBe(
      "/staff?view=chapters",
    );
    expect(getLaunchLaneWorkspaceNextStep("staff").href).toBe(
      "/staff?view=chapters",
    );
  });
});
