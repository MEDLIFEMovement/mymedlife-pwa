import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
  SltPrepMiniStat,
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import {
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  sltTripPrepMobileQuickNavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getSltPrepPageContext } from "../page-context";

export const metadata = getStaticRouteMetadata("sltPrepMeetings");
export const dynamic = "force-dynamic";

export default async function SltPrepMeetingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ traveler?: string }>;
}) {
  const [{ actor, data }, search] = await Promise.all([
    getSltPrepPageContext("/slt-prep/meetings"),
    searchParams ?? Promise.resolve<{ traveler?: string }>({}),
  ]);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);

  return (
    <AppShell
      actor={actor}
      hideTopHeader
      mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}
    >
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...getSltTripPrepSubnavItems(actor, workspace.traveler?.id)]} />

      {!workspace.canReadWorkspace || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/slt-prep"
          nextLabel="Back to trip prep"
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
            <div className="bg-[#0066CC] px-4 py-4">
              <h1 className="text-lg font-semibold text-white">Pre-Trip Meetings</h1>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-6 text-slate-600">
                Meetings should feel clear and supportive: what you attended, what is coming up,
                and what recording or make-up path would exist later without turning on live Luma or Zoom actions.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <SltPrepMiniStat label="Meetings" value={`${workspace.traveler.meetings.length}`} variant="light" />
                <SltPrepMiniStat
                  label="Attended"
                  value={`${workspace.traveler.meetings.filter((item) => item.status === "attended").length}`}
                  variant="light"
                />
                <SltPrepMiniStat
                  label="Upcoming"
                  value={`${workspace.traveler.meetings.filter((item) => item.status === "upcoming").length}`}
                  variant="light"
                />
              </div>
            </div>
          </section>

          <SltPrepSectionCard eyebrow="Meeting plan" title="Required preparation touchpoints" variant="light">
            <div className="grid gap-3">
              {workspace.traveler.meetings.map((meeting) => (
                <article
                  key={meeting.id}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-slate-950">{meeting.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{meeting.timingLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{meeting.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {meeting.host}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {meeting.sourceLabel}
                        </span>
                      </div>
                    </div>
                    <SltPrepTonePill
                      tone={
                        meeting.status === "attended"
                          ? "green"
                          : meeting.status === "missed"
                            ? "red"
                            : "yellow"
                      }
                      label={meeting.status === "attended" ? "Attended" : meeting.status === "missed" ? "Missed" : "Upcoming"}
                      variant="light"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled
                      className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
                    >
                      {meeting.status === "attended" ? "Watch recording is blocked" : "Join meeting is blocked"}
                    </button>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      Attendance and join links stay preview-only. No live Luma or Zoom action runs from this route.
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SltPrepSectionCard>
        </>
      )}
    </AppShell>
  );
}
