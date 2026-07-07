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

export const metadata = getStaticRouteMetadata("sltPrepProfile");
export const dynamic = "force-dynamic";

export default async function SltPrepProfilePage() {
  const { actor, data } = await getSltPrepPageContext("/slt-prep/profile");
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
              <h1 className="text-lg font-semibold text-white">Traveler Profile</h1>
            </div>
            <div className="px-5 py-5">
              <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Source-confidence note
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  The exported SLT bundle clearly includes the Profile tab in navigation, but it does not provide a fully distinct student profile screen. This route stays as a read-only myMEDLIFE adaptation so the traveler can still review key trip context.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <SltPrepSectionCard eyebrow="Traveler snapshot" title="Profile readback" variant="light">
              <div className="grid gap-3">
                {[
                  ["Passport", workspace.traveler.profile.passportStatus],
                  ["Emergency contact", workspace.traveler.profile.emergencyContactName],
                  ["Emergency phone", workspace.traveler.profile.emergencyContactPhone],
                  ["Dietary needs", workspace.traveler.profile.dietaryNeeds],
                  ["Insurance", workspace.traveler.profile.insuranceStatus],
                  ["Shirt size", workspace.traveler.profile.shirtSize],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
                  </div>
                ))}
              </div>
            </SltPrepSectionCard>

            <SltPrepSectionCard eyebrow="Flight context" title="Outbound and return plan" variant="light">
              <div className="grid gap-3">
                {workspace.traveler.flights.map((flight) => (
                  <article
                    key={flight.id}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{flight.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{flight.route}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{flight.summary}</p>
                      </div>
                      <SltPrepTonePill
                        tone={
                          flight.status === "confirmed"
                            ? "green"
                            : flight.status === "watch"
                              ? "yellow"
                              : "red"
                        }
                        label={flight.status === "confirmed" ? "Confirmed" : flight.status === "watch" ? "Watch" : "Missing"}
                        variant="light"
                      />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">{flight.timingLabel}</p>
                  </article>
                ))}

                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                  Traveler profile edits, passport changes, flight submission, scholarship updates, and staff approval remain blocked on this route.
                </div>
              </div>
            </SltPrepSectionCard>
          </section>
        </>
      )}
    </AppShell>
  );
}
