import Link from "next/link";
import { redirect } from "next/navigation";

import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberLaunchLaneEventRows } from "@/services/member-launch-lane-events";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { isMemberSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEvents");
export const dynamic = "force-dynamic";

export default async function AppEventsPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/app/events"));
  }

  if (!isMemberSurfaceFamily(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const events = getMemberLaunchLaneEventRows(actor, data);

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-6 text-[#10223f]">
      <div className="mx-auto max-w-[430px]">
        <Link
          href="/app"
          className="text-sm font-bold text-[#1B4B8E]"
        >
          Back to home
        </Link>
        <header className="mt-4 rounded-3xl bg-[#1B4B8E] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
            Chapter events
          </p>
          <h1 className="mt-1 text-2xl font-black">RSVP, show up, earn points</h1>
          <p className="mt-2 text-sm text-blue-100">
            Luma is the event reference. This page keeps the student loop simple:
            RSVP intent, attendance, and leaderboard impact.
          </p>
        </header>

        <section className="mt-5 space-y-3" aria-label="Upcoming events">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/app/events/${event.id}`}
              className="block rounded-2xl border border-[#d7e3f6] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#1B4B8E]">
                    {event.memberCampaignLabel}
                  </p>
                  <h2 className="mt-1 text-lg font-black text-[#10223f]">
                    {event.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#5c6b80]">
                    {event.memberDateTimeLabel} · {event.memberLocationLabel}
                  </p>
                </div>
                <span className="rounded-full bg-[#F5A623] px-3 py-1 text-xs font-black text-[#10223f]">
                  {event.memberRsvpLabel}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="rounded-xl bg-[#eef5ff] p-2">
                  {event.rsvpCount} RSVP
                </div>
                <div className="rounded-xl bg-[#fff7e6] p-2">
                  {event.attendanceCount} attended
                </div>
                <div className="rounded-xl bg-[#eef7f2] p-2">
                  {event.pointsAwarded} pts
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
