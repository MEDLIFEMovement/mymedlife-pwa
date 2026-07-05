import Link from "next/link";
import { redirect } from "next/navigation";

import { StudentRouteQuickNav } from "@/components/student-route-quick-nav";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberLaunchLaneEventRowById } from "@/services/member-launch-lane-events";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canAccessMemberWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { isPreviewWorkspaceAccess } from "@/services/workspace-access";

type AppEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export const metadata = getStaticRouteMetadata("rushMonthEventDetail");
export const dynamic = "force-dynamic";

export default async function AppEventDetailPage({
  params,
}: AppEventDetailPageProps) {
  const [{ eventId }, actor, data] = await Promise.all([
    params,
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(`/app/events/${eventId}`));
  }

  if (!canAccessMemberWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const event = getMemberLaunchLaneEventRowById(actor, data, eventId);

  if (!event) {
    redirect("/app/events");
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="student_app" />
      {isPreviewWorkspaceAccess(actor, "student_app") ? (
        <WorkspacePreviewBanner workspaceLabel="the General Student App" />
      ) : null}
      <main className="min-h-screen bg-[#f7f4ee] px-4 pb-32 pt-6 text-[#10223f]">
      <div className="mx-auto max-w-[430px]">
        <Link href="/app/events" className="text-sm font-bold text-[#1B4B8E]">
          Back to events
        </Link>

        <article className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
          <section className="bg-[#1B4B8E] p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
              {event.eventTypeLabel}
            </p>
            <h1 className="mt-1 text-2xl font-black">{event.title}</h1>
            <p className="mt-2 text-sm text-blue-100">
              {event.memberDateTimeLabel} · {event.memberLocationLabel}
            </p>
          </section>

          <section className="space-y-4 p-5">
            <div className="rounded-2xl border border-[#d7e3f6] bg-[#eef5ff] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#1B4B8E]">
                Student status
              </p>
              <h2 className="mt-1 text-xl font-black">{event.rsvpStatusLabel}</h2>
              <p className="mt-1 text-sm text-[#5c6b80]">{event.rsvpDetail}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="rounded-xl bg-[#eef5ff] p-3">
                <span className="block text-lg font-black">{event.rsvpCount}</span>
                RSVP
              </div>
              <div className="rounded-xl bg-[#fff7e6] p-3">
                <span className="block text-lg font-black">{event.attendanceCount}</span>
                attended
              </div>
              <div className="rounded-xl bg-[#eef7f2] p-3">
                <span className="block text-lg font-black">{event.pointsAwarded}</span>
                points
              </div>
            </div>

            <Link
              href="/app/points"
              className="flex items-center justify-center rounded-2xl bg-[#F5A623] px-4 py-3 text-sm font-black text-[#10223f]"
            >
              View leaderboard impact
            </Link>
          </section>
        </article>
      </div>
      </main>
      <StudentRouteQuickNav active="events" />
    </>
  );
}
