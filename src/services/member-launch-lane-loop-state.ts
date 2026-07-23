export type MemberLaunchLaneLoopStage =
  | "preview_only"
  | "ready_for_rsvp"
  | "rsvp_recorded"
  | "attendance_confirmed"
  | "points_awarded";

export type MemberLaunchLaneLoopState = {
  stage: MemberLaunchLaneLoopStage;
  statusLabel: string;
  statusDetail: string;
  nextStepLabel: string;
  nextStepDetail: string;
};

export function getMemberLaunchLaneLoopState(input: {
  alreadyRecorded: boolean;
  attendanceRecorded: boolean;
  attendanceCount: number;
  memberPointsAwarded: number;
  hasLumaLink: boolean;
}): MemberLaunchLaneLoopState {
  if (input.attendanceRecorded && input.memberPointsAwarded > 0) {
    return {
      stage: "points_awarded",
      statusLabel: "Points awarded",
      statusDetail:
        "Attendance is confirmed and your points are visible for this event.",
      nextStepLabel: "Open leaderboard",
      nextStepDetail:
        "Check how this event changed your rank and the chapter total.",
    };
  }

  if (input.attendanceRecorded) {
    return {
      stage: "attendance_confirmed",
      statusLabel: "Attendance confirmed; points pending",
      statusDetail:
        "Attendance is confirmed, and points are the next readback to watch.",
      nextStepLabel: "Open leaderboard",
      nextStepDetail:
        "Use the leaderboard to watch for the event points and chapter movement that follow attendance.",
    };
  }

  if (input.alreadyRecorded) {
    return {
      stage: "rsvp_recorded",
      statusLabel: "RSVP recorded",
      statusDetail:
        "Your RSVP is already in the pilot record. The next real step is to attend and get checked in.",
      nextStepLabel: "Show up and get checked in",
      nextStepDetail:
        "Attendance is what moves points, not RSVP alone.",
    };
  }

  if (input.hasLumaLink) {
    return {
      stage: "ready_for_rsvp",
      statusLabel: "Ready for RSVP",
      statusDetail:
        "This chapter event is live in the pilot lane. RSVP here, then let attendance and points follow from the same event.",
      nextStepLabel: "RSVP in Luma",
      nextStepDetail:
        "RSVP is the front door into the live event loop.",
    };
  }

  return {
    stage: "preview_only",
    statusLabel: "Preview only",
    statusDetail:
      "This chapter event is visible, but live RSVP stays off until the approved Luma link is in place.",
    nextStepLabel: "Wait for live link",
    nextStepDetail:
      "Once the event is linked, the same loop will carry RSVP, attendance, points, and leaderboard movement.",
  };
}
