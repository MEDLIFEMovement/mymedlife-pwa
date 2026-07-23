export const memberEventLoopPointAward = 20;

export const memberEventLoopAttendancePointReasons = [
  "Attendance confirmed through the myMEDLIFE member event loop.",
  "Attendance confirmed through the production-safe TEST event loop.",
] as const;

export const memberEventLoopAttendancePointReason =
  memberEventLoopAttendancePointReasons[0];

export function isMemberEventLoopAttendancePointReason(reason: string) {
  const normalized = reason.trim();

  return (
    memberEventLoopAttendancePointReasons.includes(
      normalized as (typeof memberEventLoopAttendancePointReasons)[number],
    ) || /^attendance confirmed\b/iu.test(normalized)
  );
}
