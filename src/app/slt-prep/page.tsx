import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SltPrepTonePill } from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { buildChecklistCards, buildOverviewCtas } from "@/app/slt-prep/overview-helpers";
import { getLocalActorContext } from "@/services/local-actor-context";
import { mapChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import {
  buildSltTripPrepRouteHref,
  getSltTripPrepMobileQuickNavItems,
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  parseSltTripPrepRouteSource,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrep");
export const dynamic = "force-dynamic";

type SltPrepPageProps = {
  searchParams?: Promise<{
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepPage({ searchParams }: SltPrepPageProps) {
  const emptySearchParams: { source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const routeSource = parseSltTripPrepRouteSource(search.source);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);

  if (!workspace.canReadWorkspace || !workspace.traveler) {
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
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={buildSltTripPrepRouteHref(workspace.nextStep.href, {
            travelerId: search.traveler,
          })}
          nextLabel={workspace.nextStep.label}
        />
      </AppShell>
    );
  }

  const checklistCards = buildChecklistCards(workspace).map((card) => ({
    ...card,
    href: buildSltTripPrepRouteHref(card.href, { travelerId: search.traveler }),
  }));
  const overviewCtas = buildOverviewCtas(workspace).map((cta) => ({
    ...cta,
    href: buildSltTripPrepRouteHref(cta.href, { travelerId: search.traveler }),
  }));
  const readinessPercent = Math.max(
    Math.round((workspace.counts.checklistComplete / workspace.counts.checklistTotal) * 100),
    0,
  );

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

      <section className="overflow-hidden rounded-[1.8rem] border border-[#1565c0]/12 bg-white shadow-[0_18px_55px_rgba(8,34,76,0.08)]">
        <div className="bg-[#0b66cc] px-5 pb-5 pt-4 text-white">
          <h1 className="text-[1.95rem] font-semibold tracking-tight">
            {workspace.traveler.tripLabel.replace("|", "—")}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            {workspace.traveler.cityLabel} • {workspace.traveler.departureDateLabel}
          </p>

          <div className="mt-4 rounded-[1.1rem] bg-white/12 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              Countdown
            </p>
            <p className="mt-1 text-xl font-semibold">{workspace.countdownLabel}</p>
          </div>
        </div>

        <div className="space-y-5 px-4 pb-5 pt-4">
          <div
            className={[
              "rounded-[1.2rem] border px-4 py-3 text-sm font-medium",
              workspace.readiness.tone === "red"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : workspace.readiness.tone === "yellow"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {workspace.readiness.tone === "red"
              ? "Action required — items are overdue"
              : workspace.readiness.tone === "yellow"
                ? "A few items need attention before departure"
                : "Your trip prep is in good shape"}
          </div>

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Readiness Score</h2>
                <p className="mt-1 text-sm text-slate-500">{workspace.readiness.label}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-slate-950">
                  {workspace.readiness.score}%
                </p>
                <p className="text-sm text-slate-500">
                  {workspace.counts.checklistComplete} of {workspace.counts.checklistTotal} complete
                </p>
              </div>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#111827]"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-[#fbfdff] p-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">SLT Deadlines</h2>
              </div>
              <Link
                href={buildSltTripPrepRouteHref("/slt-prep/timeline", {
                  source: routeSource ?? undefined,
                  travelerId: search.traveler,
                })}
                className="text-sm font-semibold text-[#0b66cc]"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {workspace.traveler.alerts.slice(0, 3).map((alert) => (
                <Link
                  key={alert.id}
                  href={mapChecklistDetailHref(alert.href, {
                    source: "overview",
                    travelerId: search.traveler,
                  })}
                  className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white px-3 py-3 transition hover:bg-slate-50"
                >
                  <span
                    className={[
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      alert.tone === "red"
                        ? "bg-rose-500"
                        : alert.tone === "yellow"
                          ? "bg-amber-400"
                          : "bg-sky-500",
                    ].join(" ")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950">{alert.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{alert.dueLabel}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">Checklist</h2>
            <div className="mt-3 space-y-3">
              {checklistCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className={[
                    "block rounded-[1.2rem] border bg-white p-4 transition hover:bg-slate-50",
                    card.borderClassName,
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-950">{card.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{card.helper}</p>
                    </div>
                    <SltPrepTonePill tone={card.tone} label={card.pill} />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            {overviewCtas.map((cta) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={cta.className}
              >
                <p className="text-sm font-semibold text-[#0b66cc]">{cta.eyebrow}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {cta.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {cta.detail}
                </p>
              </Link>
            ))}
          </section>
        </div>
      </section>
    </AppShell>
  );
}
