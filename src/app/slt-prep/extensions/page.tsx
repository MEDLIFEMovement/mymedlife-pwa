import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SltPrepRouteHandoffCard } from "@/components/slt-prep-route-handoff-card";
import {
  SltPrepMiniStat,
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

export const metadata = getStaticRouteMetadata("sltPrepExtensions");
export const dynamic = "force-dynamic";

type SltPrepExtensionsPageProps = {
  searchParams?: Promise<{
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepExtensionsPage({
  searchParams,
}: SltPrepExtensionsPageProps) {
  const emptySearchParams: { source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);
  const routeSource = parseSltTripPrepRouteSource(search.source);
  const routeSourceContext = getSltTripPrepRouteSourceContext(routeSource, search.traveler);
  const selectedExtension =
    workspace.traveler?.extensions.find((item) => item.status === "selected") ?? null;
  const consideringExtension =
    workspace.traveler?.extensions.find((item) => item.status === "considering") ?? null;

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
              Extensions and tours
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Extensions & Tours
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
              Add optional extensions and tours to {workspace.traveler.firstName}&apos;s trip.
              These experiences let travelers explore more of Peru and create lasting memories.
              Book early because spots are limited.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <ExtensionsHeroStat label="Options" value={`${workspace.traveler.extensions.length}`} />
              <ExtensionsHeroStat
                label="Selected"
                value={`${workspace.traveler.extensions.filter((item) => item.status === "selected").length}`}
              />
              <ExtensionsHeroStat
                label="Considering"
                value={`${workspace.traveler.extensions.filter((item) => item.status === "considering").length}`}
              />
            </div>
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
            <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
              <article className="app-surface-info rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-blue">Selected option</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Optional add-on posture
                </h2>
                <div className="mt-4 grid gap-3">
                  <MiniFact
                    label="Selected"
                    value={selectedExtension?.title ?? "No add-on selected"}
                    note={
                      selectedExtension?.summary ??
                      "The traveler has not locked an optional add-on yet."
                    }
                  />
                  <MiniFact
                    label="Price"
                    value={selectedExtension?.priceLabel ?? "Decision open"}
                    note="Chosen add-ons should stay visible without reading like required trip blockers."
                  />
                </div>
              </article>

              <article className="app-surface-warm rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-warm">Current blocker</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {consideringExtension?.title ?? "No open extension decision is blocking this plan."}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {consideringExtension?.summary ??
                    "There is no open extension decision pulling focus from the required prep work."}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniFact
                    label="Price"
                    value={consideringExtension?.priceLabel ?? "Cleared"}
                    note="Budget tradeoffs should stay visible before the traveler decides yes, no, or not yet."
                  />
                  <MiniFact
                    label="Status"
                    value={consideringExtension?.status.replace("_", " ") ?? "closed"}
                    note="Optional choices should stay clearly separate from required readiness work."
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={buildSltChecklistDetailHref("extension-choice", {
                      source: "extensions",
                      travelerId: search.traveler,
                    })}
                    className="rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open extension decision detail
                  </Link>
                </div>
              </article>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <SltPrepMiniStat
                label="Options"
                value={`${workspace.traveler.extensions.length}`}
                note="All available add-ons for this trip."
              />
              <SltPrepMiniStat
                label="Selected"
                value={`${workspace.traveler.extensions.filter((item) => item.status === "selected").length}`}
                note="Already chosen by the traveler."
              />
              <SltPrepMiniStat
                label="Considering"
                value={`${workspace.traveler.extensions.filter((item) => item.status === "considering").length}`}
                note="Still open while the traveler decides."
              />
            </section>

            {routeSourceContext ? <SltPrepRouteHandoffCard {...routeSourceContext} /> : null}

            <SltPrepSectionCard eyebrow="Options" title="What is selected and what is still open?">
              <div className="grid gap-3">
                {workspace.traveler.extensions.map((item) => (
                  <article
                    key={item.id}
                    className="app-surface-soft rounded-[1.35rem] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="app-eyebrow app-eyebrow-slate">{item.status.replace("_", " ")}</p>
                        <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{item.priceLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                      </div>
                      <SltPrepTonePill
                        tone={
                          item.status === "selected"
                            ? "green"
                            : item.status === "considering"
                              ? "yellow"
                              : "green"
                        }
                        label={item.status.replace("_", " ")}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </SltPrepSectionCard>

            <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <article className="app-surface rounded-[1.75rem] p-5">
                <p className="app-eyebrow app-eyebrow-slate">Decision posture</p>
                <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
                  Which add-on still needs a real decision?
                </h2>
                <div className="mt-4 grid gap-3">
                  <MiniFact
                    label="Selected"
                    value={`${workspace.traveler.extensions.filter((item) => item.status === "selected").length} option`}
                    note="Chosen add-ons should stay visible without looking like required trip blockers."
                  />
                  <MiniFact
                    label="Considering"
                    value={`${workspace.traveler.extensions.filter((item) => item.status === "considering").length} option`}
                    note="Open choices should still tie back to price, timing, and final readiness impact."
                  />
                </div>
              </article>

              <article className="app-surface rounded-[1.75rem] p-5">
                <p className="app-eyebrow app-eyebrow-slate">Related routes</p>
                <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
                  Move from optional tours into the right decision detail.
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={buildSltChecklistDetailHref("extension-choice", {
                      source: "extensions",
                      travelerId: search.traveler,
                    })}
                    className="rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open extension decision detail
                  </Link>
                  <Link
                    href={buildSltTripPrepRouteHref("/slt-prep/payments", {
                      source: routeSource ?? undefined,
                      travelerId: search.traveler,
                    })}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Open payments
                  </Link>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Keep this route attached to the broader readiness flow without turning optional
                  tours into a detached purchasing lane.
                </p>
              </article>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}

function ExtensionsHeroStat({ label, value }: { label: string; value: string }) {
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
