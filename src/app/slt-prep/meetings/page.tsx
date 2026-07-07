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
  getSltTripPrepWorkspace,
  sltTripPrepMobileQuickNavItems,
  sltTripPrepSubnavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getSltPrepPageContext } from "../page-context";

export const metadata = getStaticRouteMetadata("sltPrepMeetings");
export const dynamic = "force-dynamic";

export default async function SltPrepMeetingsPage() {
  const { actor, data } = await getSltPrepPageContext("/slt-prep/meetings");
  const workspace = getSltTripPrepWorkspace(actor);

  return (
    <AppShell actor={actor} mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}>
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...sltTripPrepSubnavItems]} />

      {!workspace.canReadWorkspace || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/slt-prep"
          nextLabel="Back to trip prep"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
              Pre-trip meetings
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Meeting plan for {workspace.traveler.firstName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              Keep the traveler clear on what they already attended, what is coming next, and what
              would eventually sync from Luma after approval.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <SltPrepMiniStat label="Meetings" value={`${workspace.traveler.meetings.length}`} />
            <SltPrepMiniStat
              label="Attended"
              value={`${workspace.traveler.meetings.filter((item) => item.status === "attended").length}`}
            />
            <SltPrepMiniStat
              label="Upcoming"
              value={`${workspace.traveler.meetings.filter((item) => item.status === "upcoming").length}`}
            />
          </section>

          <SltPrepSectionCard eyebrow="Meeting queue" title="Keep the traveler informed">
            <div className="grid gap-3">
              {workspace.traveler.meetings.map((meeting) => (
                <article
                  key={meeting.id}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{meeting.title}</h2>
                      <p className="mt-1 text-sm text-white/58">{meeting.timingLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{meeting.summary}</p>
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
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/54">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {meeting.host}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {meeting.sourceLabel}
                    </span>
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
