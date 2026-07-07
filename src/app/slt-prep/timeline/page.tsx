import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
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

export const metadata = getStaticRouteMetadata("sltPrepTimeline");
export const dynamic = "force-dynamic";

export default async function SltPrepTimelinePage() {
  const { actor, data } = await getSltPrepPageContext("/slt-prep/timeline");
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
              Trip timeline
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Timeline to {workspace.traveler.departureDateLabel}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              This route turns the traveler packet into a sequence: what already happened, what is
              current, and what must happen before airport day.
            </p>
          </section>

          <SltPrepSectionCard eyebrow="Milestones" title="A clear path to departure">
            <div className="grid gap-3">
              {workspace.traveler.timeline.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-sm text-white/58">{item.dateLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{item.summary}</p>
                    </div>
                    <SltPrepTonePill
                      tone={
                        item.status === "complete"
                          ? "green"
                          : item.status === "current" || item.status === "next"
                            ? "yellow"
                            : "green"
                      }
                      label={item.status}
                    />
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
