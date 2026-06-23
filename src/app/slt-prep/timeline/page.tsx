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
import {
  buildSltTripPrepRouteHref,
  getSltTripPrepRouteSourceContext,
  getSltTripPrepMobileQuickNavItems,
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  parseSltTripPrepRouteSource,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepTimeline");
export const dynamic = "force-dynamic";

type SltPrepTimelinePageProps = {
  searchParams?: Promise<{
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepTimelinePage({
  searchParams,
}: SltPrepTimelinePageProps) {
  const emptySearchParams: { source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const routeSource = parseSltTripPrepRouteSource(search.source);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);
  const routeSourceContext = getSltTripPrepRouteSourceContext(routeSource, search.traveler);
  const currentMilestone =
    workspace.traveler?.timeline.find((item) => item.status === "current") ?? null;
  const nextMilestone =
    workspace.traveler?.timeline.find((item) => item.status === "next") ?? null;

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
              Trip timeline
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Trip Timeline</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
              This route turns the traveler prep flow into a sequence: what already happened, what is
              current, and what must happen before airport day on{" "}
              {workspace.traveler.departureDateLabel}.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <TimelineHeroStat label="Milestones" value={`${workspace.traveler.timeline.length}`} />
              <TimelineHeroStat
                label="Complete"
                value={`${workspace.traveler.timeline.filter((item) => item.status === "complete").length}`}
              />
              <TimelineHeroStat
                label="Current/next"
                value={`${workspace.traveler.timeline.filter((item) => item.status === "current" || item.status === "next").length}`}
              />
            </div>
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
            <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
              <article className="app-surface-info rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-blue">Current milestone</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {currentMilestone?.label ?? "The prep flow is between milestones right now."}
                </h2>
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  {currentMilestone?.dateLabel ?? "No current milestone"}
                </p>
                <p className="app-copy mt-3">
                  {currentMilestone?.summary ??
                    "Use the timeline to keep the traveler attached to the next clear prep step."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={buildSltTripPrepRouteHref("/slt-prep/checklist", {
                      source: routeSource ?? undefined,
                      travelerId: search.traveler,
                    })}
                    className="rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open checklist
                  </Link>
                </div>
              </article>

              <article className="app-surface-warm rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-warm">Next milestone</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {nextMilestone?.label ?? "No new milestone is blocking departure right now."}
                </h2>
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  {nextMilestone?.dateLabel ?? "Cleared"}
                </p>
                <p className="app-copy mt-3">
                  {nextMilestone?.summary ??
                    "The next step is already visible elsewhere in the prep flow."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
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
              </article>
            </section>

            {routeSourceContext ? <SltPrepRouteHandoffCard {...routeSourceContext} /> : null}

            <SltPrepSectionCard eyebrow="Milestones" title="A clear path to departure">
              <div className="grid gap-3">
                {workspace.traveler.timeline.map((item) => (
                  <article
                    key={item.id}
                    className="app-surface-soft rounded-[1.35rem] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.dateLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
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
          </div>
        </>
      )}
    </AppShell>
  );
}

function TimelineHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-white/56">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
