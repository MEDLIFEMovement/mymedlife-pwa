import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { SltPrepSectionCard, SltPrepTonePill } from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import {
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  sltTripPrepMobileQuickNavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getSltPrepPageContext } from "../page-context";

export const metadata = getStaticRouteMetadata("sltPrepTimeline");
export const dynamic = "force-dynamic";

export default async function SltPrepTimelinePage() {
  const { actor, data } = await getSltPrepPageContext("/slt-prep/timeline");
  const workspace = getSltTripPrepWorkspace(actor);

  return (
    <AppShell
      actor={actor}
      hideTopHeader
      mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}
    >
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...getSltTripPrepSubnavItems(actor)]} />

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
              <h1 className="text-lg font-semibold text-white">Trip Timeline</h1>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-6 text-slate-600">
                Follow the trip in chronological order: what already happened, what is current, and what is coming next before departure.
              </p>
            </div>
          </section>

          <SltPrepSectionCard eyebrow="Milestones" title="Everything in sequence" variant="light">
            <div className="relative grid gap-4">
              <div className="absolute bottom-0 left-5 top-1 w-px bg-[#0066CC]/25" />
              {workspace.traveler.timeline.map((item) => (
                <article key={item.id} className="relative flex gap-4">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-4 ring-[#F0F4F8]">
                    <div
                      className={`h-4 w-4 rounded-full ${
                        item.status === "complete"
                          ? "bg-emerald-500"
                          : item.status === "current" || item.status === "next"
                            ? "bg-amber-400"
                            : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <div className="flex-1 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-950">{item.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.dateLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                      </div>
                      <SltPrepTonePill
                        tone={
                          item.status === "complete"
                            ? "green"
                            : item.status === "current" || item.status === "next"
                              ? "yellow"
                              : "yellow"
                        }
                        label={item.status === "complete" ? "Complete" : item.status === "current" ? "Current" : item.status === "next" ? "Next" : "Upcoming"}
                        variant="light"
                      />
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
