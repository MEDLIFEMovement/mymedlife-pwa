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

export const metadata = getStaticRouteMetadata("sltPrepExtensions");
export const dynamic = "force-dynamic";

export default async function SltPrepExtensionsPage() {
  const { actor, data } = await getSltPrepPageContext("/slt-prep/extensions");
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
              Extensions and tours
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Optional add-ons for {workspace.traveler.firstName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              Keep optional travel choices readable, budget-aware, and clearly separated from the
              required readiness path.
            </p>
          </section>

          <SltPrepSectionCard eyebrow="Options" title="What is selected and what is still open?">
            <div className="grid gap-3">
              {workspace.traveler.extensions.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                      <p className="mt-1 text-sm text-white/58">{item.priceLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{item.summary}</p>
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
        </>
      )}
    </AppShell>
  );
}
