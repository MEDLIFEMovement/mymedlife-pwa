import type { LaunchLaneMemberPointsReadback } from "@/services/launch-lane-points-readback";

type MemberPointsScreenContext = {
  pointsTotal: number;
  completedActions: number;
  pointsRankLabel: string;
  pointsLedgerPosture?: "mock_read_only" | "app_owned_readback";
  campaignPointRows?: Array<{
    campaign: string;
    points: number;
    available: number | null;
  }>;
  recentPointActions?: Array<{
    action: string;
    detail: string;
    pointsLabel: string;
  }>;
};

export function getMemberCampaignPointRows(
  memberContext: MemberPointsScreenContext,
) {
  if (memberContext.pointsLedgerPosture === "app_owned_readback") {
    return (memberContext.campaignPointRows ?? []).map((row) => ({
      campaign: row.campaign,
      pts: row.points,
      max: row.available,
      color: "bg-primary",
    }));
  }

  if (memberContext.pointsTotal <= 0) {
    return [
      { campaign: "TEST Rush Month", pts: 0, max: 150, color: "bg-primary" },
      {
        campaign: "TEST Spring Showcase (prev.)",
        pts: 0,
        max: 100,
        color: "bg-emerald-500",
      },
      {
        campaign: "TEST Community Health Fair",
        pts: 0,
        max: 80,
        color: "bg-amber-400",
      },
    ];
  }

  return [
    {
      campaign: "TEST Rush Month",
      pts: Math.min(memberContext.pointsTotal, 75),
      max: 150,
      color: "bg-primary",
    },
    {
      campaign: "TEST Spring Showcase (prev.)",
      pts: Math.min(Math.max(memberContext.pointsTotal - 75, 0), 45),
      max: 100,
      color: "bg-emerald-500",
    },
    {
      campaign: "TEST Community Health Fair",
      pts: Math.min(Math.max(memberContext.pointsTotal - 120, 0), 25),
      max: 80,
      color: "bg-amber-400",
    },
  ];
}

export function getMemberBadgeRows(
  memberContext: MemberPointsScreenContext,
) {
  if (memberContext.pointsLedgerPosture === "app_owned_readback") return [];

  return [
    {
      name: "TEST Rush Starter",
      desc: "Complete your first TEST Rush Month action",
      earned: memberContext.completedActions >= 1,
    },
    {
      name: "TEST Connector",
      desc: "Invite 10+ TEST members to a TEST chapter event",
      earned: memberContext.pointsTotal >= 50,
    },
    {
      name: "TEST Evidence Pro",
      desc: "3 TEST approvals in a single week",
      earned: memberContext.completedActions >= 3,
    },
    {
      name: "TEST Chapter MVP",
      desc: "Top 3 on the TEST leaderboard for 2 weeks",
      earned: ["#1", "#2", "#3"].includes(memberContext.pointsRankLabel),
    },
  ];
}

export function getMemberRecentApprovedActionRows(
  memberContext: MemberPointsScreenContext,
  pointsReadback: LaunchLaneMemberPointsReadback | null = null,
) {
  if (pointsReadback && pointsReadback.memberPointsAwarded > 0) {
    return [
      {
        action: `Checked in to ${pointsReadback.eventTitle}`,
        pts: pointsReadback.memberPointsAwarded,
        time:
          memberContext.pointsLedgerPosture === "app_owned_readback"
            ? "Recorded in the app-owned myMEDLIFE ledger"
            : "Recorded in myMEDLIFE internal TEST ledger",
      },
    ];
  }

  if (memberContext.pointsLedgerPosture === "app_owned_readback") {
    return (memberContext.recentPointActions ?? []).map((action) => ({
      action: action.action,
      pts: Number.parseInt(action.pointsLabel, 10) || 0,
      time: action.detail,
    }));
  }

  if (memberContext.completedActions <= 0) return [];

  return [
    {
      action: "Share TEST Rush Week flyer on Instagram",
      pts: 20,
      time: "Approved 2h ago in preview",
    },
    {
      action: "Attend TEST Bruin Walk tabling shift",
      pts: 15,
      time: "Approved yesterday in preview",
    },
    {
      action: "Add 5 TEST leads to the TEST chapter spreadsheet",
      pts: 25,
      time: "Approved 3d ago in preview",
    },
  ].slice(0, memberContext.completedActions);
}
