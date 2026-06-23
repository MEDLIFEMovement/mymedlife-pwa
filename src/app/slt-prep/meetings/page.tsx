import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SltPrepRouteHandoffCard } from "@/components/slt-prep-route-handoff-card";
import {
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { buildSltChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import {
  buildSltTripPrepRouteHref,
  getSltTripPrepRouteSourceContext,
  getSltTripPrepMobileQuickNavItems,
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  parseSltTripPrepRouteSource,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepMeetings");
export const dynamic = "force-dynamic";

type SltPrepMeetingsPageProps = {
  searchParams?: Promise<{
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepMeetingsPage({
  searchParams,
}: SltPrepMeetingsPageProps) {
  const emptySearchParams: { source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);
  const routeSource = parseSltTripPrepRouteSource(search.source);
  const routeSourceContext = getSltTripPrepRouteSourceContext(routeSource, search.traveler);
  const nextMeeting =
    workspace.traveler?.meetings.find((item) => item.status === "upcoming") ?? null;
  const missedMeeting =
    workspace.traveler?.meetings.find((item) => item.status === "missed") ?? null;
  const attendedMeetingCount =
    workspace.traveler?.meetings.filter((item) => item.status === "attended").length ?? 0;

  return (
    <AppShell
      actor={actor}
      mobileQuickItemsOverride={getSltTripPrepMobileQuickNavItems({
        source: routeSource ?? undefined,
        travelerId: search.traveler,
      })}
      hideTopHeader
      showMobileQuickItemHelpers={false}
      showDebugTools={false}
    >
      <SltPrepSubnav
        items={getSltTripPrepSubnavItems({
          source: routeSource ?? undefined,
          travelerId: search.traveler,
        })}
      />

      {!workspace.canReadWorkspace || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={buildSltTripPrepRouteHref("/slt-prep", { travelerId: search.traveler })}
          nextLabel="Back to trip prep"
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#083f8f_0%,#0b4f9b_52%,#081b3c_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7d05e]">
              Pre-trip meetings
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Pre-Trip Meetings
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
              Keep {workspace.traveler.firstName} clear on what they already attended, what is
              coming next, and what would eventually sync from Luma after approval.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <MeetingsHeroStat label="Meetings" value={`${workspace.traveler.meetings.length}`} />
              <MeetingsHeroStat
                label="Attended"
                value={`${workspace.traveler.meetings.filter((item) => item.status === "attended").length}`}
              />
              <MeetingsHeroStat
                label="Upcoming"
                value={`${workspace.traveler.meetings.filter((item) => item.status === "upcoming").length}`}
              />
            </div>
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
            <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
              <article className="app-surface-info rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-blue">Meeting status</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Attended and upcoming sessions
                </h2>
                <div className="mt-4 grid gap-3">
                  <MiniFact
                    label="Next session"
                    value={nextMeeting?.title ?? "No upcoming meeting"}
                    note={
                      nextMeeting?.summary ??
                      "No future meeting is currently blocking this traveler plan."
                    }
                  />
                  <MiniFact
                    label="Attended"
                    value={`${attendedMeetingCount} meeting${attendedMeetingCount === 1 ? "" : "s"}`}
                    note="Completed sessions can stay visible without stealing focus from what still needs a response."
                  />
                </div>
              </article>

              <article className="app-surface-warm rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-warm">Current blocker</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {missedMeeting?.title ?? nextMeeting?.title ?? "No meeting blocker is active right now."}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {missedMeeting?.summary ??
                    nextMeeting?.summary ??
                    "The traveler is up to date on the current meeting plan."}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniFact
                    label="Timing"
                    value={missedMeeting?.timingLabel ?? nextMeeting?.timingLabel ?? "Cleared"}
                    note="Meeting timing should stay obvious before airport week gets too close."
                  />
                  <MiniFact
                    label="Source"
                    value={missedMeeting?.sourceLabel ?? nextMeeting?.sourceLabel ?? "Luma mock"}
                    note="The route can show the expected meeting source without turning on live joins or attendance syncs."
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={buildSltChecklistDetailHref("orientation-rsvp", {
                      source: "meetings",
                      travelerId: search.traveler,
                    })}
                    className="rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open orientation detail
                  </Link>
                </div>
              </article>
            </section>

            {routeSourceContext ? <SltPrepRouteHandoffCard {...routeSourceContext} /> : null}

            <SltPrepSectionCard eyebrow="Meeting queue" title="Keep the traveler informed">
              <div className="grid gap-3">
                {workspace.traveler.meetings.map((meeting) => (
                  <article
                    key={meeting.id}
                    className="app-surface-soft rounded-[1.35rem] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">{meeting.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{meeting.timingLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{meeting.summary}</p>
                      </div>
                      <SltPrepTonePill
                        tone={
                          meeting.status === "attended"
                            ? "green"
                            : meeting.status === "missed"
                              ? "red"
                              : "yellow"
                        }
                        label={meeting.status}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        {meeting.host}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        {meeting.sourceLabel}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </SltPrepSectionCard>

            <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <article className="app-surface rounded-[1.75rem] p-5">
                <p className="app-eyebrow app-eyebrow-slate">Readiness handoff</p>
                <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
                  Which meeting still matters most before departure?
                </h2>
                <div className="mt-4 grid gap-3">
                  <MiniFact
                    label="Upcoming"
                    value={`${workspace.traveler.meetings.filter((item) => item.status === "upcoming").length} meetings`}
                    note="Upcoming sessions should keep the next real readiness move easy to see."
                  />
                  <MiniFact
                    label="Attended"
                    value={`${workspace.traveler.meetings.filter((item) => item.status === "attended").length} meetings`}
                    note="Completed sessions can stay visible without stealing focus from what is still open."
                  />
                </div>
              </article>

              <article className="app-surface rounded-[1.75rem] p-5">
                <p className="app-eyebrow app-eyebrow-slate">Related routes</p>
                <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
                  Move from meetings into the exact traveler blocker.
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={buildSltChecklistDetailHref("orientation-rsvp", {
                      source: "meetings",
                      travelerId: search.traveler,
                    })}
                    className="rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open orientation detail
                  </Link>
                  <Link
                    href={buildSltTripPrepRouteHref("/slt-prep/profile", {
                      source: routeSource ?? undefined,
                      travelerId: search.traveler,
                    })}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Open traveler profile
                  </Link>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Keep this route attached to the broader readiness flow without turning meetings
                  into a detached reviewer lane.
                </p>
              </article>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}

function MeetingsHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-white/56">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniFact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="app-surface-soft rounded-[1.25rem] p-4">
      <p className="app-eyebrow app-eyebrow-blue">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </div>
  );
}
