const launchLaneAttendancePoints = 20;

export function getLaunchLaneAttendancePointsValue() {
  return launchLaneAttendancePoints;
}

export function getLaunchLaneAttendancePointsLabel() {
  return `${launchLaneAttendancePoints} pts for attending`;
}

export function getLaunchLaneAttendancePointsShortLabel() {
  return `+${launchLaneAttendancePoints} pts`;
}

export function getLaunchLaneAttendancePointsRateLabel() {
  return `${launchLaneAttendancePoints} pts per confirmed attendee`;
}

export function buildLaunchLaneAttendancePointsReason(eventTitle: string) {
  return `Luma pilot attendance confirmed for ${eventTitle}`;
}
