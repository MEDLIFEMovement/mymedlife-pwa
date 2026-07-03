import Link from "next/link";
import type {
  LaunchLaneResultNotice,
  MemberLaunchLaneRsvpCard,
} from "@/services/luma-launch-lane-workspace";
import { SurfacePanel, StatusPill } from "@/components/visual-primitives";

type MemberLiveRsvpCardProps = {
  card: MemberLaunchLaneRsvpCard;
  returnTo: string;
  enabled: boolean;
  leaderboardHref?: string;
  action?: (formData: FormData) => void | Promise<void>;
  resultNotice?: LaunchLaneResultNotice;
  eyebrow?: string;
};

export function MemberLiveRsvpCard({
  card,
  returnTo,
  enabled,
  leaderboardHref,
  action,
  resultNotice,
  eyebrow = "Live RSVP",
}: MemberLiveRsvpCardProps) {
  const canOpenLeaderboard =
    Boolean(leaderboardHref) &&
    (card.loopStage === "attendance_confirmed" ||
      card.loopStage === "points_awarded");

  return (
    <>
      {resultNotice?.status ? (
        <SurfacePanel
          tone={resultNotice.status === "success" ? "info" : "default"}
          className="rounded-[1.4rem] border p-4"
        >
          <p className="text-sm font-semibold text-slate-950">
            {resultNotice.status === "success"
              ? "Live RSVP update recorded"
              : "Live RSVP update blocked"}
          </p>
          {resultNotice.message ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {resultNotice.message}
            </p>
          ) : null}
        </SurfacePanel>
      ) : null}

      <SurfacePanel className="rounded-[1.6rem] border border-[#bfdbfe] bg-[#fbfdff] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              {card.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{card.timing}</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {card.detail}
            </p>
          </div>
          <StatusPill
            tone={
              card.loopStage === "preview_only"
                ? "white"
                : card.loopStage === "attendance_confirmed"
                  ? "gold"
                  : "blue"
            }
          >
            {card.statusLabel}
          </StatusPill>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#dbeafe] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {card.chapterName}
          </span>
          <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
            {card.rsvpCount} RSVP
          </span>
          <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
            {card.attendanceCount} attended
          </span>
          <span className="rounded-full border border-[#dbeafe] bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
            {card.pointsAwarded} pts awarded
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={card.detailHref}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Open event detail
          </Link>
          {canOpenLeaderboard && leaderboardHref ? (
            <Link
              href={leaderboardHref}
              className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2.5 text-sm font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#dbeafe]"
            >
              Open leaderboard
            </Link>
          ) : null}
          {action ? (
            <form action={action}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="chapterEventId" value={card.chapterEventId} />
              <button
                type="submit"
                disabled={!enabled || card.alreadyRecorded}
                className="inline-flex items-center rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {card.alreadyRecorded ? "RSVP already recorded" : "RSVP in Luma"}
              </button>
            </form>
          ) : null}
          <p className="text-sm text-slate-500">
            {enabled || card.alreadyRecorded
              ? card.nextStepDetail
              : "Live RSVP stays off until the staging review session is ready."}
          </p>
        </div>
      </SurfacePanel>
    </>
  );
}
