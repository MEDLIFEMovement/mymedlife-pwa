import Link from "next/link";
import { SltPrepShell } from "@/components/slt-prep-shell";
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
import { buildSltChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepFlights");
export const dynamic = "force-dynamic";

type SltPrepFlightsPageProps = {
  searchParams?: Promise<{
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepFlightsPage({
  searchParams,
}: SltPrepFlightsPageProps) {
  const emptySearchParams: { source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);
  const routeSource = parseSltTripPrepRouteSource(search.source);
  const routeSourceContext = getSltTripPrepRouteSourceContext(
    routeSource,
    search.traveler,
    workspace.traveler?.displayName,
  );

  if (!workspace.canReadWorkspace || !workspace.traveler) {
    return (
      <SltPrepShell
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
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={buildSltTripPrepRouteHref("/slt-prep", { travelerId: search.traveler })}
          nextLabel="Back to trip prep"
        />
      </SltPrepShell>
    );
  }

  const confirmedFlights = workspace.traveler.flights.filter(
    (flight) => flight.status === "confirmed",
  ).length;
  const watchFlights = workspace.traveler.flights.filter(
    (flight) => flight.status !== "confirmed",
  ).length;
  const primaryWatchFlight =
    workspace.traveler.flights.find((flight) => flight.status !== "confirmed") ?? null;
  const flightAlert =
    workspace.traveler.alerts.find((alert) => alert.href.includes("/slt-prep/checklist/flight-itinerary")) ??
    workspace.traveler.alerts.find((alert) => alert.href.includes("/slt-prep/flights"));

  return (
    <SltPrepShell
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

      <section className="overflow-hidden rounded-[2rem] border border-[var(--accent)]/30 bg-[linear-gradient(145deg,var(--mymedlife-gradient-blue-start)_0%,var(--mymedlife-gradient-blue-mid)_52%,var(--mymedlife-gradient-blue-end)_100%)] p-5 shadow-[0_24px_80px_rgb(var(--mymedlife-deep-rgb)/0.32)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
          Flight plan
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Flight details for {workspace.traveler.firstName}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
          Keep outbound and return travel visible in one place so the traveler, coach, and staff
          can spot timing gaps before airport week.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <FlightsHeroStat label="Segments" value={`${workspace.traveler.flights.length}`} />
          <FlightsHeroStat label="Confirmed" value={`${confirmedFlights}`} />
          <FlightsHeroStat label="Needs review" value={`${watchFlights}`} />
        </div>
      </section>

      <div className="grid gap-4 rounded-[2rem] bg-[var(--mymedlife-panel-tint)] p-4 shadow-[0_18px_50px_rgb(var(--mymedlife-deep-rgb)/0.12)]">
        <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
          <article className="app-surface-info rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-blue">Upload status</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Upload and confirmation posture
            </h2>
            <div className="mt-4 grid gap-3">
              {workspace.traveler.flights.map((flight) => (
                <div
                  key={flight.id}
                  className="app-surface-soft rounded-[1.25rem] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="app-eyebrow app-eyebrow-slate">{flight.label}</p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {flight.route}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{flight.timingLabel}</p>
                    </div>
                    <SltPrepTonePill
                      tone={
                        flight.status === "confirmed"
                          ? "green"
                          : flight.status === "watch"
                            ? "yellow"
                            : "red"
                      }
                      label={flight.status === "watch" ? "needs review" : flight.status}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{flight.summary}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="app-surface-warm rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-warm">Current blocker</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {flightAlert?.label ?? "No flight blocker is active right now."}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {flightAlert?.summary ??
                "Both flight directions are readable in the itinerary, so the traveler can stay focused on the next readiness step."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniFact
                label="Owner"
                value={flightAlert?.owner ?? "Travel operations"}
                note="The itinerary should still show who owns the next follow-up before airport week gets crowded."
              />
              <MiniFact
                label="Due"
                value={flightAlert?.dueLabel ?? "Cleared"}
                note={
                  primaryWatchFlight
                    ? `${primaryWatchFlight.label} still needs attention before airport-week coordination can close.`
                    : "No follow-up is blocking airport-week coordination right now."
                }
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={buildSltChecklistDetailHref("flight-itinerary", {
                  source: "flights",
                  travelerId: search.traveler,
                })}
                className="rounded-full bg-[var(--mymedlife-admin-blue)] px-4 py-2 text-sm font-semibold text-white"
              >
                Open flight checklist item
              </Link>
              <Link
                href={buildSltTripPrepRouteHref("/slt-prep/timeline", {
                  source: routeSource ?? undefined,
                  travelerId: search.traveler,
                })}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Open trip timeline
              </Link>
            </div>
          </article>
        </section>

        {routeSourceContext ? <SltPrepRouteHandoffCard {...routeSourceContext} /> : null}

        <SltPrepSectionCard eyebrow="Itinerary" title="Outbound and return segments">
          <div className="grid gap-3">
            {workspace.traveler.flights.map((flight) => (
              <article key={flight.id} className="app-surface-soft rounded-[1.35rem] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="app-eyebrow app-eyebrow-slate">{flight.label}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">{flight.route}</h3>
                    <p className="mt-1 text-sm text-slate-500">{flight.timingLabel}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{flight.summary}</p>
                  </div>
                  <SltPrepTonePill
                    tone={
                      flight.status === "confirmed"
                        ? "green"
                        : flight.status === "watch"
                          ? "yellow"
                          : "red"
                    }
                    label={flight.status === "watch" ? "needs review" : flight.status}
                  />
                </div>
              </article>
            ))}
          </div>
        </SltPrepSectionCard>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="app-surface rounded-[1.75rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">Airport support</p>
            <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
              What still blocks clean airport coordination?
            </h2>
            <div className="mt-4 grid gap-3">
              <MiniFact
                label="Departure city"
                value={workspace.traveler.cityLabel}
                note="Airport pickup and roster timing should stay visible until the itinerary is fully confirmed."
              />
              <MiniFact
                label="Current flight alert"
                value={flightAlert?.label ?? "No flight alert"}
                note={flightAlert?.summary ?? "The itinerary has no active warning right now."}
              />
            </div>
          </article>

          <article className="app-surface rounded-[1.75rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">Related routes</p>
            <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
              Move between readiness, checklist, and traveler profile.
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={buildSltChecklistDetailHref("flight-itinerary", {
                  source: "flights",
                  travelerId: search.traveler,
                })}
                className="rounded-full bg-[var(--mymedlife-admin-blue)] px-4 py-2 text-sm font-semibold text-white"
              >
                Open flight checklist item
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
              Keep this route attached to the broader traveler prep loop without mixing flight
              status into general profile content.
            </p>
          </article>
        </section>
      </div>
    </SltPrepShell>
  );
}

function FlightsHeroStat({ label, value }: { label: string; value: string }) {
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
