import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  getLaunchLaneChapterLeaderboardReadback,
  getLaunchLaneMemberPointsReadback,
} from "@/services/launch-lane-points-readback";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canAccessMemberWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { isPreviewWorkspaceAccess } from "@/services/workspace-access";

export const metadata = getStaticRouteMetadata("rushMonthLeaderboard");
export const dynamic = "force-dynamic";

export default async function AppPointsPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/app/points"));
  }

  if (!canAccessMemberWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const points = getLaunchLaneMemberPointsReadback(actor, data);
  const leaderboard = getLaunchLaneChapterLeaderboardReadback(data);

  return (
    <>
      {isPreviewWorkspaceAccess(actor, "student_app") ? (
        <WorkspacePreviewBanner workspaceLabel="the General Student App" />
      ) : null}
      <main className="min-h-screen bg-[#f7f4ee] px-4 py-6 text-[#10223f]">
      <div className="mx-auto max-w-[430px]">
        <Link href="/app" className="text-sm font-bold text-[#1B4B8E]">
          Back to home
        </Link>

        <header className="mt-4 rounded-3xl bg-[#1B4B8E] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
            Points and leaderboard
          </p>
          <h1 className="mt-1 text-2xl font-black">
            {points ? `${points.memberPointsAwarded} points this loop` : "Leaderboard ready"}
          </h1>
          <p className="mt-2 text-sm text-blue-100">
            Attendance-backed points move the chapter leaderboard. Proof and
            external sends stay off in this launch-interface split.
          </p>
        </header>

        {points ? (
          <section className="mt-5 rounded-2xl border border-[#d7e3f6] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1B4B8E]">
              Latest event
            </p>
            <h2 className="mt-1 text-lg font-black">{points.eventTitle}</h2>
            <p className="mt-1 text-sm text-[#5c6b80]">
              {points.memberStatusLabel} · {points.memberStatusDetail}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="rounded-xl bg-[#eef5ff] p-2">{points.rsvpCount} RSVP</div>
              <div className="rounded-xl bg-[#fff7e6] p-2">
                {points.attendanceCount} attended
              </div>
              <div className="rounded-xl bg-[#eef7f2] p-2">
                {points.chapterTotalPoints} chapter pts
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-5 space-y-3" aria-label="Chapter leaderboard">
          {leaderboard.map((row, index) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-2xl border border-[#d7e3f6] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5A623] text-sm font-black">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-black">{row.name}</h2>
                  <p className="text-xs text-[#5c6b80]">{row.detail}</p>
                </div>
              </div>
              <span className="text-lg font-black">{row.points}</span>
            </div>
          ))}
        </section>
      </div>
      </main>
    </>
  );
}
