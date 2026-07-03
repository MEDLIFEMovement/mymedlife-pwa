import { describe, expect, it } from "vitest";

import {
  buildLaunchLaneAttendancePointsReason,
  getLaunchLaneAttendancePointsLabel,
  getLaunchLaneAttendancePointsRateLabel,
  getLaunchLaneAttendancePointsShortLabel,
  getLaunchLaneAttendancePointsValue,
} from "@/services/launch-lane-points-policy";

describe("launch lane points policy", () => {
  it("keeps the attendance points rule in one readable place", () => {
    expect(getLaunchLaneAttendancePointsValue()).toBe(20);
    expect(getLaunchLaneAttendancePointsLabel()).toBe("20 pts for attending");
    expect(getLaunchLaneAttendancePointsShortLabel()).toBe("+20 pts");
    expect(getLaunchLaneAttendancePointsRateLabel()).toBe(
      "20 pts per confirmed attendee",
    );
    expect(buildLaunchLaneAttendancePointsReason("Rush Month kickoff social")).toBe(
      "Luma pilot attendance confirmed for Rush Month kickoff social",
    );
  });
});
