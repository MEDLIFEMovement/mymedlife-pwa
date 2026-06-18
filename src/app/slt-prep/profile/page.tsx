import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getSltTripPrepWorkspace,
  sltTripPrepSubnavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepProfile");
export const dynamic = "force-dynamic";

export default async function SltPrepProfilePage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = getSltTripPrepWorkspace(actor);

  return (
    <AppShell actor={actor}>
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
              Traveler profile
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Profile and flight context for {workspace.traveler.displayName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              Keep the traveler profile readable for support work: passport, emergency contact,
              dietary needs, insurance, and flights in one place.
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <SltPrepSectionCard eyebrow="Profile" title="Traveler snapshot">
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
                    className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
                      {label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/72">{value}</p>
                  </div>
                ))}
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
                    Travel notes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/72">
                    {workspace.traveler.profile.travelNotes}
                  </p>
                </div>
              </div>
            </SltPrepSectionCard>

            <SltPrepSectionCard eyebrow="Flights" title="Outbound and return plan">
              <div className="grid gap-3">
                {workspace.traveler.flights.map((flight) => (
                  <article
                    key={flight.id}
                    className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{flight.label}</p>
                        <p className="mt-1 text-sm text-white/58">{flight.route}</p>
                        <p className="mt-2 text-sm leading-6 text-white/72">{flight.summary}</p>
                      </div>
                      <SltPrepTonePill
                        tone={
                          flight.status === "confirmed"
                            ? "green"
                            : flight.status === "watch"
                              ? "yellow"
                              : "red"
                        }
                        label={flight.status}
                      />
                    </div>
                    <p className="mt-3 text-sm text-white/58">{flight.timingLabel}</p>
                  </article>
                ))}
              </div>
            </SltPrepSectionCard>
          </section>
        </>
      )}
    </AppShell>
  );
}
